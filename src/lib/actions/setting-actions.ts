"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  try {
    const settings = await prisma.setting.findMany();
    return serializePrisma(settings);
  } catch (error) {
    return [];
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    revalidatePath("/ayarlar");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ayar kaydedilemedi." };
  }
}

export async function bulkUpdateSettings(settings: Record<string, string>) {
  try {
    const promises = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    );
    await Promise.all(promises);
    revalidatePath("/ayarlar");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ayarlar güncellenirken hata oluştu." };
  }
}
