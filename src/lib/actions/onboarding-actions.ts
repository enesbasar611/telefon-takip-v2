"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createShopOnboarding(formData: {
    name: string;
    address: string;
    phone: string;
    currency: string;
    openingBalance: number;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        // 1. Create the Shop
        const shop = await prisma.shop.create({
            data: {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                // We could add currency to shop model if we update the schema again, 
                // but for now let's assume it's stored in settings or just used in UI.
            },
        });

        // 2. Link User to Shop and set as ADMIN
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!userExists) {
            return { success: false, error: "Kullanıcı kaydı bulunamadı. DB sıfırlanmış veya eski oturum kalmış olabilir. Lütfen çıkış yapıp tekrar giriş yapın." };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                shopId: shop.id,
                role: "ADMIN",
            },
        });

        // 3. Create initial "Kasa" account
        await prisma.financeAccount.create({
            data: {
                name: "Merkez Kasa",
                type: "CASH",
                balance: formData.openingBalance,
                isDefault: true,
                shopId: shop.id,
            },
        });

        // 4. Create initial Daily Session if balance > 0
        if (formData.openingBalance > 0) {
            await prisma.dailySession.create({
                data: {
                    openingBalance: formData.openingBalance,
                    openedById: session.user.id as string,
                    status: "OPEN",
                    shopId: shop.id,
                    notes: "Sistem açılış bakiyesi",
                },
            });
        }

        // 5. Create default Receipt Settings
        await prisma.receiptSettings.create({
            data: {
                id: `rcpt_${shop.id}`,
                title: shop.name.toUpperCase(),
                subtitle: "TEKNİK SERVİS & SATIŞ",
                phone: shop.phone || "",
                address: shop.address || "",
                shopId: shop.id
            }
        });

        revalidatePath("/");
        return { success: true, shopId: shop.id, shopName: shop.name };
    } catch (error: any) {
        console.error("Onboarding error:", error);
        return { success: false, error: error?.message || "Dükkan oluşturulamadı." };
    }
}
