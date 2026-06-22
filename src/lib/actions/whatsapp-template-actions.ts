"use server";

import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getWhatsAppTemplates() {
    try {
        const shopId = await getShopId();
        return await prisma.whatsAppTemplate.findMany({
            where: { shopId },
            orderBy: { name: "asc" }
        });
    } catch (error) {
        console.error("Error fetching WhatsApp templates:", error);
        return [];
    }
}

export async function createWhatsAppTemplate(data: {
    name: string;
    content: string;
    category: string;
    variables: string[];
}) {
    try {
        const shopId = await getShopId();
        const template = await prisma.whatsAppTemplate.create({
            data: {
                ...data,
                shopId
            }
        });
        revalidatePath("/ayarlar");
        return { success: true, data: template };
    } catch (error) {
        console.error("Error creating WhatsApp template:", error);
        return { success: false, error: "Şablon oluşturulamadı." };
    }
}

export async function updateWhatsAppTemplate(id: string, data: {
    name?: string;
    content?: string;
    category?: string;
    variables?: string[];
    isActive?: boolean;
}) {
    try {
        const shopId = await getShopId();
        await prisma.whatsAppTemplate.update({
            where: { id, shopId },
            data
        });
        revalidatePath("/ayarlar");
        return { success: true };
    } catch (error) {
        console.error("Error updating WhatsApp template:", error);
        return { success: false, error: "Şablon güncellenemedi." };
    }
}

export async function deleteWhatsAppTemplate(id: string) {
    try {
        const shopId = await getShopId();
        await prisma.whatsAppTemplate.delete({
            where: { id, shopId }
        });
        revalidatePath("/ayarlar");
        return { success: true };
    } catch (error) {
        console.error("Error deleting WhatsApp template:", error);
        return { success: false, error: "Şablon silinemedi." };
    }
}
