import { EdmService } from "@/lib/edm/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * DEBUG endpoint: EDM API ile farklı format kombinasyonlarını test et
 * GET /api/test/edm-debug?uuid={uuid}
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get("uuid");
    const testFormat = (searchParams.get("format") || "pdf") as "pdf" | "html";

    if (!uuid || !uuid.trim()) {
        return NextResponse.json(
            {
                error: "UUID parametresi eksik",
                example: "/api/test/edm-debug?uuid=3694852c-47a6-4297-baf2-f5eacad032e9",
            },
            { status: 400 }
        );
    }

    try {
        // Çalışan endpoint'i bulmaya çalış
        console.log(
            `\n📋 EDM debug: UUID "${uuid}" için ${testFormat} indiriliyor...`
        );

        const buffer = await EdmService.getInvoiceDocument(
            uuid.trim(),
            testFormat
        );

        console.log(`✅ BAŞARILI! Buffer boyutu: ${buffer.length} bytes`);

        return NextResponse.json(
            {
                success: true,
                message: `Fatura belgesi başarıyla indirildi!`,
                size: buffer.length,
                format: testFormat,
                uuid: uuid.trim(),
                hint: `Test etmek için: /api/test/edm-view/${uuid}?format=${testFormat}`,
            },
            { status: 200 }
        );
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("❌ EDM debug error:", details);

        return NextResponse.json(
            {
                error: "Fatura belgesi indirilemedi",
                details: details,
                suggestions: [
                    "UUID'nin doğru olduğundan emin ol",
                    "EDM API SessionID geçerli mi kontrol et",
                    "Log'ları kontrol et - hangi endpoint'lerin denenmişse",
                    "EDM API dokümantasyonunda fatura indirme endpoint'i öğren",
                ],
                uuid: uuid?.trim(),
                format: testFormat,
            },
            { status: 500 }
        );
    }
}
