import { NextRequest, NextResponse } from "next/server";

/**
 * EDM Swagger JSON schema'sından fatura indirme endpoint'ini öğren
 * GET /api/test/edm-swagger-schema
 */
export async function GET(request: NextRequest) {
    const swaggerUrl =
        "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test/swagger.json";

    try {
        console.log(`\n📚 EDM Swagger schema ayıklanıyor: ${swaggerUrl}\n`);

        const response = await fetch(swaggerUrl);
        if (!response.ok) {
            throw new Error(
                `Swagger JSON fetch başarısız: HTTP ${response.status}`
            );
        }

        const schema = await response.json();

        // Fatura indirme with ilgili endpoint'leri bul
        const paths = schema.paths || {};
        const invoiceEndpoints: Record<string, unknown> = {};

        for (const [path, methods] of Object.entries(paths)) {
            if (
                /invoice|document|pdf|html|download|get/i.test(path) &&
                !path.includes("Send") &&
                !path.includes("Create")
            ) {
                invoiceEndpoints[path] = methods;
                console.log(`✅ Endpoint bulundu: ${path}`);
            }
        }

        console.log(`\n📋 Toplam bulunan get endpoint'i: ${Object.keys(invoiceEndpoints).length}\n`);

        // Detaylı olarak fatura indirme operasyonlarını listele
        const documentOperations: Array<{
            path: string;
            method: string;
            summary?: string;
            description?: string;
            parameters?: Array<{ name: string; in: string; required?: boolean; type?: string }>;
        }> = [];

        for (const [path, methods] of Object.entries(invoiceEndpoints)) {
            if (typeof methods !== "object" || methods === null) continue;

            for (const [method, operation] of Object.entries(methods)) {
                if (method.toUpperCase() === "PARAMETERS") continue;
                if (typeof operation !== "object" || operation === null) continue;

                const op = operation as any;
                documentOperations.push({
                    path,
                    method: method.toUpperCase(),
                    summary: op.summary,
                    description: op.description,
                    parameters: op.parameters,
                });
            }
        }

        return NextResponse.json(
            {
                success: true,
                swaggerUrl,
                message: "EDM Swagger schema analizi tamamlandı",
                documentOperationsCount: documentOperations.length,
                documentOperations,
                allPaths: Object.keys(paths).filter(
                    (p) =>
                        /invoice|document|pdf|html/i.test(p) ||
                        /get|download/i.test(p)
                ),
                hints: [
                    "Yukarıdaki endpoint'lerden biri fatura indirmek için kullanılmalı",
                    "Genellikle {uuid} veya {id} parametresi alır",
                    "PDF/HTML format'ı URL'de veya header'da belirtilir",
                    "Authorization: Bearer {sessionId} kullan",
                ],
            },
            { status: 200 }
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : String(error);
        console.error("❌ Swagger schema fetch hatası:", message);

        return NextResponse.json(
            {
                error: "Swagger schema alınamadı",
                details: message,
                swaggerUrl,
                alternatives: [
                    "Swagger UI'ye git: " +
                        "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test/swagger/index.html",
                    "Tercih etme: https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/earsiv",
                ],
            },
            { status: 500 }
        );
    }
}
