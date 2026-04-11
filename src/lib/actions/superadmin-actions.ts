"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function checkSuperAdmin() {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }
    if (session.user.role !== "SUPER_ADMIN") {
        throw new Error("Sadece sistem yöneticileri bu işlemi yapabilir.");
    }
    return session.user;
}

export async function getAllShops() {
    try {
        await checkSuperAdmin();
        const shops = await prisma.shop.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                industry: true,
                phone: true,
                email: true,
                address: true,
                isActive: true,
                createdAt: true,
                enabledModules: true,
                themeConfig: true,
                _count: {
                    select: { users: true, customers: true, serviceTickets: true }
                }
            } as any
        });
        return { success: true, data: shops };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateShopThemeConfig(shopId: string, newConfigJson: any) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: { themeConfig: newConfigJson }
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Ayarlar güncellenirken hata oluştu: " + error.message };
    }
}

export async function updateShopModules(shopId: string, enabledModules: string[]) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: { enabledModules }
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Modüller güncellenirken hata oluştu: " + error.message };
    }
}

export async function updateShopStatus(shopId: string, isActive: boolean) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: { isActive } as any
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Dükkan durumu güncellenirken hata oluştu: " + error.message };
    }
}

export async function impersonateShop(shopId: string) {
    try {
        const user = await checkSuperAdmin();

        // Update the user's shopId in the database.
        await prisma.user.update({
            where: { id: user.id },
            data: { shopId }
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Kimliğe bürünme başarısız: " + error.message };
    }
}

export async function deleteShop(shopId: string) {
    try {
        await checkSuperAdmin();
        await prisma.shop.delete({
            where: { id: shopId }
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Dükkan silinemedi: " + error.message };
    }
}

export async function updateShopGeneral(shopId: string, data: { name: string; industry: string }) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                name: data.name,
                industry: data.industry
            } as any
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Dükkan bilgileri güncellenemedi: " + error.message };
    }
}

export async function adminCreateShop(data: { name: string; industry: string }) {
    try {
        await checkSuperAdmin();
        const shop = await prisma.shop.create({
            data: {
                name: data.name,
                industry: data.industry,
            } as any
        });
        revalidatePath("/admin/shops");
        return { success: true, data: shop };
    } catch (error: any) {
        return { success: false, error: "Dükkan oluşturulamadı: " + error.message };
    }
}
