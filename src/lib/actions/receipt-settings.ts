"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

const serviceTerms = [
    "• Arıza tespit ücreti 150 TL'dir. İptal edilen cihazlarda bu ücret tahsil edilir.",
    "• 30 gün içinde teslim alınmayan cihazlardan işletmemiz sorumlu değildir.",
    "• Yedekleme sorumluluğu müşteriye aittir. Veri kaybından firmamız sorumlu tutulamaz.",
].join("\n");

export async function getReceiptSettings(type: string = "pos") {
    try {
        const shopId = await getShopId();
        const settings = await prisma.receiptSettings.findUnique({
            where: { id: `${shopId}_${type}` },
        });

        if (!settings) {
            const shop = await prisma.shop.findUnique({
                where: { id: shopId },
                select: { name: true, phone: true, address: true, website: true },
            });

            const defaultSettings = await prisma.receiptSettings.create({
                data: {
                    id: `${shopId}_${type}`,
                    shopId,
                    title: shop?.name || "BAŞAR TEKNİK",
                    subtitle: type === "service" ? "Mobil servis & teknik destek" : "PROFESYONEL TEKNİK SERVİS",
                    phone: shop?.phone || "+90 (5xx) xxx xx xx",
                    address: shop?.address || null,
                    website: shop?.website || "v2.basarteknik.com",
                    footer: "Bizi Tercih Ettiğiniz İçin Teşekkürler",
                    terms: type === "service" ? serviceTerms : null,
                },
            });
            return serializePrisma(defaultSettings);
        }

        return serializePrisma(settings);
    } catch (error) {
        console.error(`Error fetching receipt settings for ${type}:`, error);
        return null;
    }
}

export async function getAllReceiptSettings() {
    try {
        const shopId = await getShopId();
        const settings = await prisma.receiptSettings.findMany({
            where: { shopId },
        });
        return serializePrisma(settings);
    } catch (error) {
        console.error("Error fetching all receipt settings:", error);
        return [];
    }
}

export async function updateReceiptSettings(type: string, data: any) {
    try {
        const shopId = await getShopId();
        const settings = await prisma.receiptSettings.upsert({
            where: { id: `${shopId}_${type}` },
            update: data,
            create: { ...data, id: `${shopId}_${type}`, shopId },
        });

        revalidatePath("/ayarlar");
        revalidatePath("/satis");
        revalidatePath("/servis");
        return { success: true, data: serializePrisma(settings) };
    } catch (error) {
        console.error(`Error updating receipt settings for ${type}:`, error);
        return { success: false, error: "Ayarlar kaydedilirken hata oluştu." };
    }
}

export async function getShopInfo() {
    try {
        const shopId = await getShopId();
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
        });
        return serializePrisma(shop);
    } catch (error) {
        console.error("Error fetching shop info:", error);
        return null;
    }
}
