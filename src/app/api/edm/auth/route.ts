import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { getEdmRestSession } from "@/lib/edm/rest-client";

const TEST_API_URL = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test";
const PROD_API_URL = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password, rememberMe } = body;

        // 1. Shop ID Al
        const shopId = await getShopId(false);
        if (!shopId) {
            return NextResponse.json({ success: false, error: "Oturum bulunamadı." }, { status: 401 });
        }

        // 2. URL ve Credentials Belirle
        const finalUsername = username || process.env.EDM_USERNAME;
        const finalPassword = password || process.env.EDM_PASSWORD;
        // Swagger: EFaturaEDM_API_Test (REST değil)
        const baseUrl = process.env.EDM_REST_API_URL || TEST_API_URL;

        if (!finalUsername || !finalPassword) {
            return NextResponse.json({ success: false, error: "Kullanıcı adı ve şifre gereklidir." }, { status: 400 });
        }

        // 3. EDM ile Session Doğrula
        let session;
        try {
            session = await getEdmRestSession({
                username: finalUsername,
                password: finalPassword,
                baseUrl: baseUrl,
                senderVkn: "" // Login için opsiyonel
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, error: `EDM Giriş Başarısız: ${error.message}` }, { status: 401 });
        }

        // 4. Veritabanına Yaz (Apple Tarzı: Şifre base64)
        const passwordEncrypted = Buffer.from(finalPassword).toString('base64');
        const shouldBeActive = rememberMe === true;

        await prisma.eDMSettings.upsert({
            where: { shopId },
            create: {
                shopId,
                username: finalUsername,
                passwordEncrypted,
                edmActive: shouldBeActive,
                apiUrl: baseUrl,
                environment: baseUrl.toLowerCase().includes("test") ? "TEST" : "PRODUCTION"
            },
            update: {
                username: finalUsername,
                passwordEncrypted,
                edmActive: shouldBeActive,
                apiUrl: baseUrl,
                environment: baseUrl.toLowerCase().includes("test") ? "TEST" : "PRODUCTION"
            }
        });

        return NextResponse.json({
            success: true,
            message: "Oturum id si başarıyla alındı",
            sessionId: session.sessionId
        });

    } catch (error: any) {
        console.error("[EDM AUTH API ERROR]:", error);
        return NextResponse.json({ success: false, error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
