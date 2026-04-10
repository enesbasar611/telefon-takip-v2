"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function getSettings() {
  try {
    const shopId = await getShopId();
    const settings = await prisma.setting.findMany({ where: { shopId } });
    return serializePrisma(settings);
  } catch (error) {
    return [];
  }
}

export async function updateSetting(key: string, value: string, revalidate = true) {
  try {
    const shopId = await getShopId();
    await prisma.setting.upsert({
      where: { shopId_key: { shopId, key } },
      update: { value },
      create: { key, value, shopId }
    });
    if (revalidate) {
      const { revalidateTag } = await import("next/cache");
      revalidatePath("/ayarlar");
      revalidateTag("settings");
      revalidateTag(`settings-${shopId}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ayar kaydedilemedi." };
  }
}

export async function bulkUpdateSettings(settings: Record<string, string>) {
  try {
    const shopId = await getShopId();
    const promises = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key } },
        update: { value },
        create: { key, value, shopId }
      })
    );
    await Promise.all(promises);
    const { revalidateTag } = await import("next/cache");
    revalidatePath("/ayarlar");
    revalidateTag("settings");
    revalidateTag(`settings-${shopId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ayarlar güncellenirken hata oluştu." };
  }
}
