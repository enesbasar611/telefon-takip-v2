import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getInvoices, getShopEdmCredentials } from "@/lib/edm/rest-client";

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

        // Dukkanın EDM ayarlarını ve credential'larını al
        let credentials;
        try {
            credentials = await getShopEdmCredentials(String(shopId));
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        const invoices = await getInvoices(credentials, {
            startDate,
            endDate,
            direction: "INBOUND",
        });

        return NextResponse.json({ invoices });
    } catch (error: any) {
        console.error("[EDM Incoming List] Hata:", error.message);
        return NextResponse.json(
            { error: error.message || "Gelen faturalar listelenirken hata oluştu." },
            { status: 500 }
        );
    }
}
