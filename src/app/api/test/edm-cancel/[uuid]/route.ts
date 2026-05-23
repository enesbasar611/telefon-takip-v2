import { NextRequest, NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

export async function GET(
    request: NextRequest,
    { params }: { params: { uuid: string } }
) {
    const { uuid } = params;
    const invoiceId = request.nextUrl.searchParams.get("invoiceId") || undefined;

    if (!uuid || !uuid.trim()) {
        return NextResponse.json(
            {
                success: false,
                error: "UUID eksik",
                example: "/api/test/edm-cancel/3694852c-47a6-4297-baf2-f5eacad032e9?invoiceId=TST20260501000001",
            },
            { status: 400 }
        );
    }

    try {
        const result = await EdmService.cancelInvoice(uuid.trim(), invoiceId);
        return NextResponse.json(
            {
                success: true,
                uuid: uuid.trim(),
                invoiceId,
                result,
            },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            {
                success: false,
                uuid: uuid.trim(),
                invoiceId,
                error: "Fatura iptal edilemedi",
                details: message,
            },
            { status: 500 }
        );
    }
}
