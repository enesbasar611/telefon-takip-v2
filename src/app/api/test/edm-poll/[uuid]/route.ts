import { NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

// GET /api/test/edm-poll/[uuid]?invoiceId=...&format=pdf&attempts=10&interval=3000
// Polls for invoice document with automatic retry + search-key fallback.
// Kullanım: Fatura asenkron işleme sırasında otomatik poll edip belgesini almak için.
export async function GET(
    request: Request,
    { params }: { params: { uuid: string } }
) {
    const { searchParams } = new URL(request.url);
    const uuid = params.uuid;
    const invoiceId = searchParams.get("invoiceId") || undefined;
    const format = (searchParams.get("format") || "pdf") as "pdf" | "html";
    const maxAttempts = parseInt(searchParams.get("attempts") || "10", 10);
    const intervalMs = parseInt(searchParams.get("interval") || "3000", 10);

    if (!uuid) {
        return NextResponse.json(
            { success: false, error: "UUID parametresi zorunlu." },
            { status: 400 }
        );
    }

    try {
        // Use the retry wrapper with uuid + optional invoiceId
        const buffer = await EdmService.getInvoiceDocumentWithRetry(
            { uuid, ...(invoiceId ? { id: invoiceId } : {}) },
            format,
            {},
            maxAttempts,
            intervalMs
        );

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": format === "pdf" ? "application/pdf" : "text/html",
                "Content-Disposition": `attachment; filename="fatura.${format}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error: any) {
        console.error(`[EDM] Polling hatası uuid=${uuid}:`, error.message);
        return NextResponse.json(
            {
                success: false,
                uuid,
                invoiceId,
                format,
                attempts: maxAttempts,
                error: "Fatura belgesi indirilemedi",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
