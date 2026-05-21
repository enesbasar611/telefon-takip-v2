import { NextRequest, NextResponse } from "next/server";

/**
 * EDM REST API Swagger/Documentation endpoint finder
 * Test etmek için: GET /api/test/edm-swagger
 */
export async function GET(request: NextRequest) {
    const baseUrl = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test";

    // Swagger endpoint'lerinin olası konumları
    const swaggerEndpoints = [
        "/swagger/index.html",
        "/swagger-ui.html",
        "/swagger-ui.htm",
        "/swagger",
        "/api/swagger.json",
        "/swagger.json",
        "/api/docs",
        "/docs",
        "/openapi.json",
        "/swagger/v1/swagger.json",
        "/api/swagger/v1/swagger.json",
    ];

    const results: Record<
        string,
        { status: number; found: boolean; url: string }
    > = {};

    console.log(`\n🔍 EDM Swagger/API Documentation detection başlıyor...\n`);

    // Tüm endpoint'leri paralel test et
    const promises = swaggerEndpoints.map(async (endpoint) => {
        const url = `${baseUrl}${endpoint}`;
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "text/html, application/json, */*" },
            });

            const found = response.ok;
            results[endpoint] = {
                status: response.status,
                found,
                url,
            };

            if (found) {
                console.log(`✅ BULUNDU: ${endpoint} (${response.status})`);
            } else {
                console.log(`❌ ${endpoint} (${response.status})`);
            }
        } catch (error) {
            results[endpoint] = {
                status: 0,
                found: false,
                url,
            };
            console.log(
                `⚠️  ${endpoint} - Ağ hatası: ${error instanceof Error ? error.message : "Bilinmiyor"}`
            );
        }
    });

    await Promise.all(promises);

    const foundEndpoints = Object.entries(results)
        .filter(([, res]) => res.found)
        .map(([endpoint, res]) => ({ endpoint, ...res }));

    console.log(`\n📊 Sonuçlar:`);
    console.log(`   Toplam denenen: ${swaggerEndpoints.length}`);
    console.log(`   Bulunan: ${foundEndpoints.length}`);
    console.log(`   Bulunamayan: ${swaggerEndpoints.length - foundEndpoints.length}\n`);

    // Fatura indirme endpoint'lerini test etmek için eksik bilgiler
    console.log(`\n💡 Harita: EDM REST API'nin temel endpoint'leri`);
    console.log(`   BaseURL: ${baseUrl}`);
    console.log(`   Login: /LoginRequest (POST)`);
    console.log(`   Send Invoice: /api/SetArchiveInvoiceRequest (POST)`);
    console.log(`   Document Download: /api/Invoice/Get[Pdf|Html]/{uuid} (?)`);
    console.log(`   View URL: https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/earsiv\n`);

    return NextResponse.json(
        {
            baseUrl,
            message: "EDM REST API Swagger endpoint detection",
            swaggerEndpointsCount: swaggerEndpoints.length,
            foundCount: foundEndpoints.length,
            found: foundEndpoints,
            allResults: results,
            suggestions: [
                foundEndpoints.length === 0
                    ? "Swagger endpoint'i bulunamadı - EDM REST API belki Swagger expose etmiyor"
                    : "Swagger dokümantasyonunu ziyaret et",
                "EDM support ile iletişime geç ve fatura indirme endpoint'ini sor",
                "Canlı endpoint'i (production) test et: https://restapi.edmbilisim.com.tr/EFaturaEDM",
                "Alternatif: fatura görüntüleme linki: https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/earsiv",
            ],
        },
        { status: 200 }
    );
}
