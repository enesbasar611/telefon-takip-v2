/**
 * Eski Faturalar icin Data Patch Scripti
 * 
 * Kullanim:
 *   npx tsx scripts/patch-old-invoices.ts
 * 
 * Bu script:
 * 1. DB'deki xmlContent ve xsltContent alanlari bos olan faturalari bulur
 * 2. EDM'den her fatura icin XML icerigini ceker
 * 3. public/e-fatura.xslt sablonunu okur
 * 4. Her iki icerigi de DB'ye yazar
 */

import { PrismaClient } from "@prisma/client";
import { getEdmSession } from "../src/lib/edm/rest-client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const EDM_TEST_BASE_URL = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test";
const DEFAULT_TEST_VKN = "3230512384";

async function patchOldInvoices() {
    console.log("[Patch] Eski faturalar icin data patch basliyor...");

    // 1. EDM ayarlarini al (ilk dukkanin ayarlarini kullan)
    const edmSettings = await prisma.eDMSettings.findFirst();
    if (!edmSettings?.username || !edmSettings?.passwordEncrypted) {
        console.error("[Patch] EDM ayarlari bulunamadi.");
        process.exit(1);
    }

    const credentials = {
        username: edmSettings.username,
        password: Buffer.from(edmSettings.passwordEncrypted || "", "base64").toString("utf8"),
        senderVkn: edmSettings.senderVkn || DEFAULT_TEST_VKN,
    };

    // 2. XSLT sablonunu oku (bir kere)
    let xsltContent: string | null = null;
    try {
        const xsltPath = path.join(process.cwd(), "public", "e-fatura.xslt");
        xsltContent = fs.readFileSync(xsltPath, "utf8");
        console.log("[Patch] XSLT sablonu okundu, uzunluk:", xsltContent.length);
    } catch (error) {
        console.error("[Patch] XSLT sablonu okunamadi:", error);
        process.exit(1);
    }

    // 3. xmlContent ve xsltContent'i bos olan faturalari bul
    const oldInvoices = await prisma.eDMInvoice.findMany({
        where: {
            OR: [
                { xmlContent: null },
                { xsltContent: null },
            ],
        },
        select: {
            id: true,
            uuid: true,
            invoiceId: true,
            shopId: true,
        },
        take: 50, // Bir seferde en fazla 50 fatura
    });

    console.log(`[Patch] ${oldInvoices.length} adet eski fatura bulundu.`);

    if (oldInvoices.length === 0) {
        console.log("[Patch] Islem tamamlandi, eski fatura kalmadi.");
        await prisma.$disconnect();
        return;
    }

    // 4. Her fatura icin EDM'den XML cek
    let successCount = 0;
    let failCount = 0;

    for (const invoice of oldInvoices) {
        try {
            console.log(`[Patch] Isleniyor: ${invoice.invoiceId} (UUID: ${invoice.uuid})`);

            const xmlContent = await fetchInvoiceXmlFromEdm(credentials, invoice.uuid);

            if (!xmlContent) {
                console.warn(`[Patch] XML alinamadi: ${invoice.invoiceId}`);
                failCount++;
                continue;
            }

            // 5. DB'ye kaydet
            await prisma.eDMInvoice.update({
                where: { id: invoice.id },
                data: {
                    xmlContent,
                    xsltContent,
                },
            });

            console.log(`[Patch] Basarili: ${invoice.invoiceId}`);
            successCount++;

            // Rate limiting icin kisa bekleme
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
            console.error(`[Patch] Hata: ${invoice.invoiceId}`, error.message);
            failCount++;
        }
    }

    console.log("[Patch] Islem tamamlandi.");
    console.log(`  Basarili: ${successCount}`);
    console.log(`  Basarisiz: ${failCount}`);

    await prisma.$disconnect();
}

/**
 * EDM'den fatura XML'ini ceker
 */
async function fetchInvoiceXmlFromEdm(
    credentials: { username: string; password: string; senderVkn: string },
    uuid: string
): Promise<string | null> {
    try {
        const session = await getEdmSession(credentials);
        const url = `${EDM_TEST_BASE_URL}/GetInvoiceRequest`;

        const body = {
            requesT_HEADER: {
                sessioN_ID: session.sessionId,
                reason: "GET_INVOICE_XML",
                actioN_DATE: new Date().toISOString(),
                actioN_DATESpecified: true,
                applicatioN_NAME: "WEB_APP",
                channeL_NAME: "WEB",
            },
            invoiceUUID: uuid,
            outputFormat: "XML",
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
        });

        const responseText = await response.text();

        // JSON string wrapping temizle
        let rawData = responseText;
        if (rawData.startsWith('"') && rawData.endsWith('"')) {
            rawData = rawData.slice(1, -1).replace(/\\"/g, '"').replace(/\\r\\n/g, '\n');
        }

        // Direkt XML mi?
        if (rawData.trim().startsWith("<?xml") || rawData.includes("<Invoice")) {
            return rawData;
        }

        // JSON parse dene
        let data: any;
        try {
            data = JSON.parse(rawData);
        } catch {
            return null;
        }

        // XML icerigini cikart
        let xmlContent =
            data.content || data.xml || data.xML || data.body || data.value || null;

        if (!xmlContent) {
            const base64Xml = data.base64 || data.contentBase64 || null;
            if (base64Xml) {
                xmlContent = Buffer.from(base64Xml, "base64").toString("utf8");
            }
        }

        return xmlContent || null;
    } catch (error: any) {
        console.error("[Patch] EDM XML cekme hatasi:", error.message);
        return null;
    }
}

// Calistir
patchOldInvoices().catch((error) => {
    console.error("[Patch] Genel hata:", error);
    process.exit(1);
});
