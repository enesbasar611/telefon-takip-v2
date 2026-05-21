import { NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

export async function GET() {
    try {
        const result = await EdmService.sendInvoice({
            customer: {
                name: "Test Musteri",
                tckn: "11111111111",
                address: "Test Mahallesi Test Sokak No:1",
                district: "Merkez",
                city: "Istanbul",
            },
            lines: [
                {
                    name: "Test Servis Hizmeti",
                    quantity: 1,
                    unitPrice: 100,
                    vatRate: 20,
                },
            ],
            currency: "TRY",
            note: "EDM REST API test faturasi",
        });

        return NextResponse.json({
            success: true,
            message: "EDM test faturasi gonderildi.",
            uuid: result.uuid,
            requestUuid: result.requestUuid,
            requestId: result.requestId,
            edmResponse: result.response,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "EDM test faturasi gonderilemedi.",
            error: error.message,
        }, { status: 500 });
    }
}
