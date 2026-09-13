"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSystemAnnouncement(data: {
    title: string;
    content: string;
    type?: string;
    isActive?: boolean;
}) {
    try {
        await prisma.systemAnnouncement.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type || "INFO",
                isActive: data.isActive ?? true,
            }
        });
        revalidatePath("/admin/duyurular");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || "Duyuru oluşturulamadı." };
    }
}

export async function getActiveSystemAnnouncements() {
    try {
        const announcements = await prisma.systemAnnouncement.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: announcements };
    } catch (error: any) {
        return { success: false, error: error?.message || "Duyurular getirilemedi." };
    }
}

export async function getAllSystemAnnouncements() {
    try {
        const announcements = await prisma.systemAnnouncement.findMany({
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: announcements };
    } catch (error: any) {
        return { success: false, error: error?.message || "Duyurular getirilemedi." };
    }
}

export async function toggleSystemAnnouncement(id: string, isActive: boolean) {
    try {
        await prisma.systemAnnouncement.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath("/admin/duyurular");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || "Durum güncellenemedi." };
    }
}

export async function deleteSystemAnnouncement(id: string) {
    try {
        await prisma.systemAnnouncement.delete({
            where: { id }
        });
        revalidatePath("/admin/duyurular");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || "Duyuru silinemedi." };
    }
}
