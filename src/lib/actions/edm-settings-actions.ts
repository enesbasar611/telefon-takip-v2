"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function saveShopEdmSettings(data: {
    username: string;
    passwordPlain: string;
    senderVkn: string;
    senderTitle: string;
}) {
    try {
        const shopId = await getShopId(false);
        if (!shopId) return { success: false, error: "Oturum bulunamadı." };

        // Şifreyi base64 ile kodlayalım
        const passwordEncrypted = Buffer.from(data.passwordPlain).toString("base64");

        await prisma.eDMSettings.upsert({
            where: { shopId },
            create: {
                shopId,
                username: data.username,
                passwordEncrypted,
                senderVkn: data.senderVkn,
                senderName: data.senderTitle,
                edmActive: true,
                apiUrl: process.env.EDM_REST_API_URL || "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test",
            },
            update: {
                username: data.username,
                passwordEncrypted,
                senderVkn: data.senderVkn,
                senderName: data.senderTitle,
                edmActive: true,
            },
        });

        revalidatePath("/efatura");
        return { success: true };
    } catch (error: any) {
        console.error("saveShopEdmSettings Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getShopEdmSettings() {
    try {
        const shopId = await getShopId(false);
        if (!shopId) return null;

        const settings = await prisma.eDMSettings.findUnique({
            where: { shopId }
        });

        if (!settings) return null;

        return {
            id: settings.id,
            username: settings.username,
            senderVkn: settings.senderVkn,
            senderName: settings.senderName,
            edmActive: settings.edmActive,
            environment: settings.environment,
            apiUrl: settings.apiUrl,
            hasPassword: !!settings.passwordEncrypted,
        };
    } catch (error) {
        return null;
    }
}

export async function disconnectEdm() {
    try {
        const shopId = await getShopId(false);
        if (!shopId) return { success: false, error: "Oturum bulunamadı." };

        await prisma.eDMSettings.update({
            where: { shopId },
            data: { edmActive: false }
        });

        revalidatePath("/efatura");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteEdmSettings() {
    try {
        const shopId = await getShopId(false);
        if (!shopId) return { success: false, error: "Oturum bulunamadı." };

        await prisma.eDMSettings.delete({
            where: { shopId }
        });

        revalidatePath("/efatura");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
