import { NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

export async function GET() {
    try {
        const sessionId = await EdmService.login();

        if (sessionId) {
            return NextResponse.json({
                success: true,
                message: "EDM Login Başarılı",
                sessionId: sessionId
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "EDM Login Başarısız. Konsol loglarını kontrol edin."
            }, { status: 401 });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Hata oluştu",
            error: error.message
        }, { status: 500 });
    }
}
