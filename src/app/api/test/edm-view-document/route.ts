import { EdmService } from "@/lib/edm/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * ÇÖZÜM: ViewInvoice URI'si veya GetDocument endpoint'i kullan
 * GET /api/test/edm-view-document?uuid={uuid}&vkn={vkn}&ettn={ettn}
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get("uuid");
    const vkn = searchParams.get("vkn") || process.env.EDM_SENDER_VKN || "1111111111";
    const ettn = searchParams.get("ettn");
    const format = (searchParams.get("format") || "pdf") as "pdf" | "html";
    const method = (searchParams.get("method") || "view-invoice") as
        | "view-invoice"
        | "get-document"
        | "get-pdf";

    console.log(`\n📄 EDM Fatura Görüntüleme Metodu Test: "${method}"`);
    console.log(`   UUID: ${uuid}`);
    console.log(`   VKN: ${vkn}`);
    console.log(`   ETTN: ${ettn}`);
    console.log(`   Format: ${format}\n`);

    // Seçenekler
    if (method === "view-invoice") {
        if (!ettn) {
            return NextResponse.json(
                {
                    error: "ETTN (Fatura Sıra Numarası) eksik",
                    example: `/api/test/edm-view-document?uuid=3694852c-47a6-4297-baf2-f5eacad032e9&vkn=1234567890&ettn=SATISF202200000001&method=view-invoice`,
                    link: `https://view.edmbilisim.com.tr/fatura/ViewInvoice/${vkn}/${ettn}/earsiv`,
                },
                { status: 400 }
            );
        }

        // Direktamen EDM ViewInvoice linki dön
        const viewInvoiceUrl = `https://view.edmbilisim.com.tr/fatura/ViewInvoice/${encodeURIComponent(vkn)}/${encodeURIComponent(ettn)}/earsiv`;

        console.log(`✅ ViewInvoice URL: ${viewInvoiceUrl}`);

        return NextResponse.json(
            {
                success: true,
                method: "view-invoice",
                message: "Fatura görüntüleme linki hazır",
                viewInvoiceUrl,
                instructions: [
                    "1. ViewInvoice URL'sine tarayıcıdan git",
                    "2. Veya iframe'de embed et",
                    '3. Şu format kullan: https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/earsiv',
                ],
            },
            { status: 200 }
        );
    } else if (method === "get-document" || method === "get-pdf") {
        if (!uuid) {
            return NextResponse.json(
                {
                    error: "UUID eksik",
                    example: `/api/test/edm-view-document?uuid=3694852c-47a6-4297-baf2-f5eacad032e9&method=get-document`,
                },
                { status: 400 }
            );
        }

        try {
            // EDM REST API'ye istek yap (deneme yapılacak)
            const buffer = await EdmService.getInvoiceDocument(uuid, format);

            console.log(`✅ Belge indirildi! Boyut: ${buffer.length} bytes`);

            const contentType =
                format === "pdf" ? "application/pdf" : "text/html; charset=utf-8";

            const uint8Array = new Uint8Array(buffer);

            return new NextResponse(uint8Array, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition":
                        format === "pdf"
                            ? `inline; filename="fatura-${uuid}.pdf"`
                            : `inline; filename="fatura-${uuid}.html"`,
                    "Cache-Control": "public, max-age=3600",
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            console.error(`❌ GetDocument hatası: ${message}`);

            return NextResponse.json(
                {
                    error: "Belge indirilemedi",
                    details: message,
                    suggestion:
                        'ViewInvoice metodunu dene: method=view-invoice&ettn=...',
                },
                { status: 500 }
            );
        }
    }

    return NextResponse.json(
        {
            error: "Geçersiz method",
            validMethods: ["view-invoice", "get-document", "get-pdf"],
        },
        { status: 400 }
    );
}
