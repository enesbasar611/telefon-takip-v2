import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getInvoiceViewUrl, getInvoiceHtml, getShopEdmCredentials } from "@/lib/edm/rest-client";

/**
 * GET /api/edm/invoice/[id]/render
 * Faturayı yerel olarak render etmek (XSLT transform) yerine EDM'in resmi izleme portalına (ViewInvoice) yönlendirir.
 * Bu sayede xslt-processor bağımlılığına ve sunucu taraflı karmaşık işlemlere gerek kalmaz.
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

        // 3. EDM'den ham HTML içeriğini çek (En güvenli ve profesyonel yöntem)
        console.log(`[EDM Render] Fetching HTML for UUID: ${invoice.uuid}`);
        const htmlContent = await getInvoiceHtml(credentials, invoice.uuid);

        if (!htmlContent) {
            // Fallback: EDM Portal Linki (Redirect)
            // Enum değerleri: EARCHIVE | EINVOICE
            const isEArxiv = invoice.type === 'EARCHIVE';
            const portalType = isEArxiv ? 'earsiv' : 'efatura';

            const fallbackUrl = getInvoiceViewUrl(credentials.senderVkn, invoice.uuid, portalType as any);

            console.warn(`[EDM Render] HTML içeriği çekilemedi, portala yönlendiriliyor: ${fallbackUrl}`);
            return NextResponse.redirect(fallbackUrl, 307);
        }

        // 4. HTML içeriğini döndür
        return new Response(htmlContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error: any) {
        console.error("[EDM Render API] Hata:", error.message);
        return NextResponse.json({
            error: "Fatura görüntüleme yönlendirmesi sırasında hata oluştu.",
            detail: error.message
        }, { status: 500 });
    }
}
