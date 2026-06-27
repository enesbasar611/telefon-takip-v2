import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getShopEdmCredentials, getInvoiceHTML, getInvoiceViewUrl } from "@/lib/edm/rest-client";

/**
 * GET /api/edm/invoice/[id]/render
 * Faturayı yerel olarak render etmek (XSLT transform) yerine EDM'in resmi izleme portalına (ViewInvoice) yönlendirir.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;
        const { id } = await params;

        // 1. Veritabanından faturayı bul
        const invoice = await prisma.eDMInvoice.findFirst({
            where: {
                OR: [
                    { id: id },
                    { uuid: id },
                    { invoiceId: id }
                ],
                shopId: String(shopId)
            },
            select: {
                uuid: true,
                type: true,
                shopId: true,
                invoiceId: true,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Fatura bulunamadı." },
                { status: 404 }
            );
        }

        // 2. Dükkanın EDM ayarlarını ve kimlik bilgilerini al
        const credentials = await getShopEdmCredentials(invoice.shopId);

        if (!credentials || !credentials.senderVkn) {
            return NextResponse.json(
                { error: "EDM ayarlarında gönderici VKN bilgisi eksik. Lütfen EDM Ayarlarını kontrol edin." },
                { status: 500 }
            );
        }

        // 3. EDM Portal Linki (Redirect) — büyük/küçük harf toleranslı
        // Fatura tipine göre EDM render tipini belirle
        const typeStr = String(invoice.type).toUpperCase();
        const renderType = typeStr.includes('EAR') || typeStr.includes('ARCHIVE') ? 'earsiv' : 'efatura';
        // VKN olarak öncelik senderVkn, yoksa username
        const vkn = credentials.senderVkn || credentials.username;

        let htmlContent = "";

        try {
            // 1. ADIM: API üzerinden HTML çekmeyi dene
            console.log(`[Proxy] API üzerinden HTML çekiliyor: ${invoice.uuid}`);
            htmlContent = await getInvoiceHTML(credentials, invoice.uuid, renderType, invoice.invoiceId || undefined);
        } catch (apiError) {
            console.error("[Proxy] API HTML Hatası, Public Link deneniyor:", apiError instanceof Error ? apiError.message : apiError);

            // 2. ADIM: API patlarsa veya 503 verirse, kamuya açık görüntüleme linkinden fetch et
            // Bu link genelde login gerektirmez ve daha stabildir
            const publicUrl = `https://view.edmbilisim.com.tr/fatura/ViewInvoice/${vkn}/${invoice.uuid}/${renderType}`;
            console.log(`[Proxy] Public URL'den fetch ediliyor: ${publicUrl}`);

            try {
                const response = await fetch(publicUrl);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                htmlContent = await response.text();
            } catch (fetchError) {
                console.error("[Proxy] Public Fetch Hatası:", fetchError);
                // Eğer scrap da başarısız olursa mecburen redirect et
                return NextResponse.redirect(publicUrl, 307);
            }
        }

        // HTML içeriğini temizle ve base etiketi ekle
        // Bu sayede CSS ve resimler EDM sunucularından çekilmeye devam eder
        let processedHtml = htmlContent;
        if (!processedHtml.includes('<base')) {
            processedHtml = processedHtml.replace('<head>', '<head><base href="https://view.edmbilisim.com.tr/">');
        }

        // HTML olarak döndür
        return new NextResponse(processedHtml, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Frame-Options': 'ALLOWALL', // Iframe içinde gösterilmesine izin ver
                'Content-Security-Policy': "frame-ancestors 'self' *" // Güvenlik duvarını esnet
            }
        });

    } catch (error) {
        console.error("[Render Route] Beklenmeyen Hata:", error);
        return NextResponse.json(
            { error: "Fatura görüntüleme sırasında bir hata oluştu.", detail: error instanceof Error ? error.message : "Bilinmeyen hata" },
            { status: 500 }
        );
    }
}
