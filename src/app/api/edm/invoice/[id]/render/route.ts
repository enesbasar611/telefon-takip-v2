import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Xslt, XmlParser } from "xslt-processor";

/**
 * GET /api/edm/invoice/[id]/render
 * Faturanin DB'deki XML icerigini ceker, XSLT transform yapar ve HTML dondurur.
 * 
 * e-Arsiv / e-Fatura ayrimi:
 *   1. DB'deki type alani (EARCHIVE vs EINVOICE)
 *   2. XML icindeki cbc:ProfileID degeri (EARSIVFATURA vs TEMELFATURA)
 *   Her iki durumda da e-Arsiv ise e-arsiv.xslt kullanilir.
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;
        const { id } = params;

        // DB'den faturayi al
        const invoice = await prisma.eDMInvoice.findFirst({
            where: { id, shopId: String(shopId) },
            select: {
                id: true,
                uuid: true,
                invoiceId: true,
                type: true,
                xmlContent: true,
                xsltContent: true,
                status: true,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Fatura bulunamadi." },
                { status: 404 }
            );
        }

        // XML'deki ProfileID'yi kontrol et (en guvenilir kaynak)
        const xmlProfileId = extractProfileIdFromXml(invoice.xmlContent);
        const isEarsivFromXml = xmlProfileId === "EARSIVFATURA";
        const isEarsivFromDb = invoice.type === "EARCHIVE" || invoice.type === "EARSIVFATURA";
        const isEarsiv = isEarsivFromXml || isEarsivFromDb;

        console.log("[Invoice Render] Fatura analizi:", {
            id: invoice.id,
            uuid: invoice.uuid,
            dbType: invoice.type,
            xmlProfileId,
            isEarsivFromXml,
            isEarsivFromDb,
            finalIsEarsiv: isEarsiv,
            hasXml: !!invoice.xmlContent,
            hasXslt: !!invoice.xsltContent,
        });

        if (!invoice.xmlContent) {
            return NextResponse.json(
                { error: "Fatura XML icerigi bulunamadi." },
                { status: 404 }
            );
        }

        // XSLT sablonunu cozumle (fallback zinciri ile)
        let xsltTemplate = await resolveXsltTemplate(invoice, shopId, isEarsiv);
        
        if (!xsltTemplate) {
            return NextResponse.json(
                { error: "XSLT sablonu bulunamadi." },
                { status: 500 }
            );
        }

        // XSLT 2.0 ozelliklerini temizle
        xsltTemplate = sanitizeXsltForXslt1(xsltTemplate);

        // Logo ve basligi fatura tipine gore zorla
        xsltTemplate = forceInvoiceTypeInXslt(xsltTemplate, isEarsiv);

        // Server-side XSLT transform
        try {
            const xmlParser = new XmlParser();
            const xmlDoc = xmlParser.xmlParse(invoice.xmlContent);
            const xsltDoc = xmlParser.xmlParse(xsltTemplate);
            const xslt = new Xslt();
            const htmlResult = await xslt.xsltProcess(xmlDoc, xsltDoc);

            console.log("[Invoice Render] XSLT transform basarili, HTML uzunlugu:", htmlResult.length);

            // Kirik logo/QR kodlari gizleyen CSS ekle
            const cssPatch = `
<style>
/* EDM'in sunucudan cekmeye calistigi ama kiran logoyu/QR'i gizler */
#mainTable img[src*="GetQrCode"], 
#mainTable img[src*="qrcode"],
img[src*="restapi.edmbilisim"] {
    display: none !important;
}
</style>
`;
            const htmlWithCss = htmlResult.replace(/<head>/i, `<head>${cssPatch}`);

            return new NextResponse(htmlWithCss, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                },
            });
        } catch (xsltError: any) {
            console.error("[Invoice Render] XSLT transform hatasi:", xsltError.message);

            // XSLT basarisiz olursa, XML + XSLT referansi ile don
            const xmlWithXslt = combineXmlWithXslt(invoice.xmlContent, xsltTemplate);
            return new NextResponse(xmlWithXslt, {
                headers: {
                    "Content-Type": "application/xml; charset=utf-8",
                    "Cache-Control": "no-store",
                },
            });
        }

    } catch (error: any) {
        console.error("[Invoice Render] Hata:", error);
        return NextResponse.json(
            { error: "Fatura render hatasi", detail: error.message },
            { status: 500 }
        );
    }
}

/**
 * XML iceriginden cbc:ProfileID degerini cikar.
 */
function extractProfileIdFromXml(xmlContent: string | null): string | null {
    if (!xmlContent) return null;
    const match = xmlContent.match(/<cbc:ProfileID>([^<]*)<\/cbc:ProfileID>/i);
    return match ? match[1].trim() : null;
}

/**
 * XSLT Sablonu Cozumleme (Fallback Zinciri)
 * 
 * 1. EDMInvoice.xsltContent — fatura ile birlikte kaydedilen ozel sablon
 * 2. EDMSettings.efaturaXslt / earsivXslt — dukkan/bayi ayarlarindaki sablon
 * 3. public/e-fatura.xslt veya public/e-arsiv.xslt — ortak fallback sablonu
 */
async function resolveXsltTemplate(
    invoice: { type: string | null; xsltContent: string | null },
    shopId: string | number,
    isEarsiv: boolean
): Promise<string | null> {
    const xsltFileName = isEarsiv ? "e-arsiv.xslt" : "e-fatura.xslt";

    // Adim 1: Fatura ile birlikte kaydedilen XSLT (tip kontrolu yap)
    if (invoice.xsltContent) {
        // Eger DB'deki XSLT tipi yanlis ise, uygun olani kullan
        const hasEarsivMarker = invoice.xsltContent.includes("e-Arsiv") || 
                                invoice.xsltContent.includes("EARSIV") ||
                                invoice.xsltContent.includes("e-Arşiv");
        const hasEfaturaMarker = invoice.xsltContent.includes("e-Fatura") ||
                                 invoice.xsltContent.includes("EFATURA") ||
                                 invoice.xsltContent.includes("e-FATURA");
        
        const xsltMatchesType = isEarsiv ? hasEarsivMarker : hasEfaturaMarker;
        
        if (xsltMatchesType || (!hasEarsivMarker && !hasEfaturaMarker)) {
            console.log(`[Invoice Render] XSLT kaynagi: DB (EDMInvoice.xsltContent)`);
            return invoice.xsltContent;
        } else {
            console.log(`[Invoice Render] DB'deki XSLT tipi uyumsuz, fallback kullanilacak`);
        }
    }

    // Adim 2: Dukkan ayarlarindaki XSLT
    try {
        const settings = await prisma.eDMSettings.findFirst({
            where: { shopId: String(shopId) },
            select: { efaturaXslt: true, earsivXslt: true },
        });

        const settingsXslt = isEarsiv ? settings?.earsivXslt : settings?.efaturaXslt;
        if (settingsXslt) {
            console.log(`[Invoice Render] XSLT kaynagi: DB (EDMSettings.${isEarsiv ? "earsivXslt" : "efaturaXslt"})`);
            return settingsXslt;
        }
    } catch (err) {
        console.warn("[Invoice Render] EDMSettings XSLT okunamadi:", err);
    }

    // Adim 3: Ortak fallback sablonu (public/)
    try {
        const fs = await import("fs");
        const xsltPath = process.cwd() + "/public/" + xsltFileName;
        const fallbackXslt = fs.readFileSync(xsltPath, "utf8");
        console.log(`[Invoice Render] XSLT kaynagi: Ortak fallback (${xsltFileName})`);
        return fallbackXslt;
    } catch (err) {
        console.error(`[Invoice Render] Ortak XSLT sablonu bulunamadi: ${xsltFileName}`, err);
        return null;
    }
}

/**
 * XSLT icindeki logo ve baslik alanlarini fatura tipine gore zorla.
 * e-Arsiv faturalarda "e-FATURA" yerine "e-ARŞİV FATURA" basar.
 */
function forceInvoiceTypeInXslt(xslt: string, isEarsiv: boolean): string {
    let modified = xslt;

    if (isEarsiv) {
        // e-Fatura -> e-Arsiv degisiklikleri
        const replacements = [
            // Turkce karakterli ve karaktersiz varyasyonlar
            { from: /e-FATURA/g, to: "e-ARŞİV FATURA" },
            { from: /e-Fatura/g, to: "e-Arşiv Fatura" },
            { from: /e-fatura/g, to: "e-arşiv fatura" },
            { from: /EFATURA/g, to: "EARŞİV" },
            { from: /E-FATURA/g, to: "E-ARŞİV FATURA" },
            { from: /E-Fatura/g, to: "E-Arşiv Fatura" },
            // Logo metni degisiklikleri (XSLT sablonlarinda yaygin)
            { from: /TEMEL FATURA/g, to: "E-ARŞİV FATURA" },
            { from: /TEMELFATURA/g, to: "EARSIVFATURA" },
        ];

        for (const rep of replacements) {
            modified = modified.replace(rep.from, rep.to);
        }

        console.log("[Invoice Render] XSLT e-Arsiv tipine zorlandi");
    } else {
        // e-Fatura icin ters degisiklikler (gerekirse)
        const replacements = [
            { from: /e-ARŞİV FATURA/g, to: "e-FATURA" },
            { from: /e-Arşiv Fatura/g, to: "e-Fatura" },
        ];

        for (const rep of replacements) {
            modified = modified.replace(rep.from, rep.to);
        }
    }

    return modified;
}

/**
 * XSLT 2.0 ozelliklerini XSLT 1.0 ile uyumlu hale getir.
 */
function sanitizeXsltForXslt1(xslt: string): string {
    let cleaned = xslt;

    // xsl:character-map kaldir
    cleaned = cleaned.replace(
        /<xsl:character-map[^>]*>[\s\S]*?<\/xsl:character-map>/gi,
        ""
    );

    // xsl:output/@use-character-maps kaldir
    cleaned = cleaned.replace(/\s+use-character-maps="[^"]*"/gi, "");

    // xsl:stylesheet/@version="2.0" → "1.0"
    cleaned = cleaned.replace(
        /(<xsl:stylesheet[^>]*version=")2\.0(")/i,
        '$11.0$2'
    );

    // xsl:stylesheet/@xpath-default-namespace kaldir
    cleaned = cleaned.replace(/\s+xpath-default-namespace="[^"]*"/gi, "");

    // xsl:function kaldir
    cleaned = cleaned.replace(
        /<xsl:function[^>]*>[\s\S]*?<\/xsl:function>/gi,
        ""
    );

    // xsl:sequence kaldir
    cleaned = cleaned.replace(
        /<xsl:sequence[^\/]*\/?>/gi,
        ""
    );

    return cleaned;
}

/**
 * XML + XSLT birlestirerek tarayici tarafinda islenecek XML uret.
 */
function combineXmlWithXslt(xmlContent: string, xsltTemplate: string): string {
    let cleanXml = xmlContent.replace(/^\uFEFF/, "").trim();
    const xmlPrologMatch = cleanXml.match(/^(<\?xml[^?]*\?>)/);
    const xmlProlog = xmlPrologMatch ? xmlPrologMatch[1] : '<?xml version="1.0" encoding="UTF-8"?>';
    const xsltBase64 = Buffer.from(xsltTemplate, "utf8").toString("base64");

    return `${xmlProlog}
<?xml-stylesheet type="text/xsl" href="data:text/xsl;base64,${xsltBase64}"?>
${cleanXml.replace(xmlProlog, "").trim()}`;
}
