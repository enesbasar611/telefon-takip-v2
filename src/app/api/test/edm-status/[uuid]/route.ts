import { NextRequest, NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

export async function GET(
    request: NextRequest,
    { params }: { params: { uuid: string } }
) {
    const { uuid } = params;
    if (!uuid || !uuid.trim()) {
        return NextResponse.json(
            {
                success: false,
                error: "UUID eksik",
                example: "/api/test/edm-status/3694852c-47a6-4297-baf2-f5eacad032e9",
            },
            { status: 400 }
        );
    }

    try {
        const status = await EdmService.getInvoiceStatus(uuid.trim());
        return NextResponse.json({ success: true, uuid: uuid.trim(), status }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            {
                success: false,
                uuid: uuid.trim(),
                error: "Fatura durumu alınamadı",
                details: message,
            },
            { status: 500 }
        );
    }
}
