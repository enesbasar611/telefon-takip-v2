import { NextResponse } from "next/server";
import { checkUser } from "@/lib/edm/rest-client";
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

        // EDM ayarlarini DB'den al
        const settings = await prisma.eDMSettings.findFirst({
            where: { shopId: String(shopId) },
        });

        if (!settings?.username || !settings?.passwordEncrypted) {
            return NextResponse.json(
                { error: "EDM ayarlari bulunamadi. Lutfen once EDM ayarlarini yapin." },
                { status: 400 }
            );
        }

        const credentials = {
            username: settings.username,
            password: Buffer.from(settings.passwordEncrypted, "base64").toString("utf-8"),
            senderVkn: settings.senderVkn || "3230512384",
        };

        let result;
        let isEInvoiceUser = false;

        try {
            result = await checkUser(credentials, vknTckn);
            // UserAlias donerse → e-Fatura mükellefi
            isEInvoiceUser = !!result.alias;
            console.log(`[CheckUser] Mükellef durumu sorgulandı:`, {
                vknTckn,
                alias: result.alias,
                isEInvoiceUser,
                resultMessage: result.message
            });
        } catch (checkError: any) {
            // Hata donerse → e-Arşiv mükellefi
            isEInvoiceUser = false;
            console.log(`[CheckUser] e-Arşiv mükellefi (sorgu hatasi):`, {
                vknTckn,
                error: checkError.message,
                isEInvoiceUser,
            });
            result = { isEInvoice: false, alias: null, error: checkError.message };
        }

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
