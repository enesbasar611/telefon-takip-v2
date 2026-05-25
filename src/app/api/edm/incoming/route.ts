import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getInvoices } from "@/lib/edm/rest-client";

/**
 * GET /api/edm/incoming
 * Gelen faturaları listeler
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;

        const edmSettings = await prisma.eDMSettings.findUnique({
            where: { shopId: String(shopId) },
        });

        if (!edmSettings || !edmSettings.edmActive) {
            return NextResponse.json(
                { error: "e-Fatura modülü aktif değil." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        const credentials = {
            username: edmSettings.username!,
            password: decryptPassword(edmSettings.passwordEncrypted),
            senderVkn: edmSettings.senderVkn!,
            baseUrl: edmSettings.apiUrl || undefined,
        };

        const invoices = await getInvoices(credentials, {
            startDate,
            endDate,
            direction: "INBOUND",
        });

        return NextResponse.json({ invoices });
    } catch (error: any) {
        console.error("[EDM Incoming List] Hata:", error);
        return NextResponse.json(
            { error: error.message || "Gelen faturalar listelenirken hata oluştu." },
            { status: 500 }
        );
    }
}

function decryptPassword(encrypted: string | null): string {
    if (!encrypted) throw new Error("Şifreli parola bulunamadı.");
    try {
        return Buffer.from(encrypted, "base64").toString("utf8");
    } catch {
        return encrypted;
    }
}
