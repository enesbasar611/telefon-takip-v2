import { NextResponse } from "next/server";
import { checkEdmUser } from "@/lib/edm/rest-client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/edm/check-user
 * EDM CheckUserRequest - Mükellef sorgulama
 * 
 * Karar Mekanizması:
 * - EDM'den UserAlias dönerse → e-Fatura mükellefi (isEInvoiceUser = true)
 * - EDM hata dönerse (Mükellef bulunamadı) → e-Arşiv mükellefi (isEInvoiceUser = false)
 * 
 * Sonuc Customer.isEInvoiceUser kolonuna kaydedilir.
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;

        const body = await req.json().catch(() => ({}));
        const { vknTckn, customerId } = body;

        if (!vknTckn || !/^\d{10,11}$/.test(vknTckn)) {
            return NextResponse.json(
                { error: "Gecerli bir VKN/TCKN girin (10 veya 11 hane)." },
                { status: 400 }
            );
        }

        let credentials;
        try {
            credentials = await import("@/lib/edm/rest-client").then(m => m.getShopEdmCredentials(String(shopId)));
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message || "EDM bilgileri alinamadi." },
                { status: 400 }
            );
        }

        // checkEdmUser kendi içinde try-catch barındırır, hata fırlatmaz, güvenli obje döner
        const result = await checkEdmUser(credentials, vknTckn);
        const isEInvoiceUser = result.isEInvoice;

        console.log(`[CheckUser] Mükellef durumu sorgulandı:`, {
            vknTckn,
            alias: result.alias,
            isEInvoiceUser,
            resultMessage: result.message
        });

        // Customer tablosunu güncelle (varsa)
        if (customerId) {
            try {
                await prisma.customer.update({
                    where: { id: customerId },
                    data: { isEInvoiceUser },
                });
                console.log(`[CheckUser] Customer guncellendi:`, { customerId, isEInvoiceUser });
            } catch (dbError) {
                console.warn(`[CheckUser] Customer guncellenemedi:`, dbError);
            }
        } else {
            // customerId yoksa taxNumber ile ara ve guncelle
            try {
                const customer = await prisma.customer.findFirst({
                    where: { shopId: String(shopId), taxNumber: vknTckn },
                });
                if (customer) {
                    await prisma.customer.update({
                        where: { id: customer.id },
                        data: { isEInvoiceUser },
                    });
                    console.log(`[CheckUser] Customer (taxNumber) guncellendi:`, {
                        customerId: customer.id,
                        isEInvoiceUser,
                    });
                }
            } catch (dbError) {
                console.warn(`[CheckUser] Customer (taxNumber) guncellenemedi:`, dbError);
            }
        }

        return NextResponse.json({
            ...result,
            isEInvoiceUser,
            vknTckn,
        });
    } catch (error: any) {
        console.error("CHECK_USER_ERR_DETAIL:", error);
        return NextResponse.json(
            { error: error.message || "Mukellef sorgulama basarisiz." },
            { status: 500 }
        );
    }
}
