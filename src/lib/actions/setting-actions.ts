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

export async function getShop() {
  try {
    const shopId = await getShopId();
    const shop = await prisma.shop.findUnique({
      where: { id: shopId }
    });
    return serializePrisma(shop);
  } catch (error) {
    console.error("getShop error:", error);
    return null;
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

export async function updateShop(data: any) {
  try {
    const shopId = await getShopId();
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: data.name,
        industry: data.industry,
        phone: data.phone,
        email: data.email,
        address: data.address,
        enabledModules: data.enabledModules,
        themeConfig: data.themeConfig
      } as any,
    });
    revalidatePath("/");
    revalidatePath("/ayarlar");
    return { success: true };
  } catch (error) {
    console.error("updateShop error:", error);
    return { success: false, error: "Dükkan bilgileri güncellenemedi." };
  }
}

export async function updateShopModules(enabledModules: string[]) {
  try {
    const shopId = await getShopId();
    await prisma.shop.update({
      where: { id: shopId },
      data: { enabledModules } as any,
    });
    revalidatePath("/");
    revalidatePath("/ayarlar");
    return { success: true };
  } catch (error) {
    console.error("updateShopModules error:", error);
    return { success: false, error: "Modüller güncellenemedi." };
  }
}

export async function saveAIIndustryConfig(serviceFields: any[], inventoryFields: any[], accessories: string[]) {
  try {
    const shopId = await getShopId();
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Dükkan bulunamadı.");

    const themeConfig = (shop.themeConfig as any) || {};

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        themeConfig: {
          ...themeConfig,
          serviceFields: serviceFields,
          productFields: inventoryFields,
          accessories: accessories,
        }
      } as any,
    });

    revalidatePath("/");
    revalidatePath("/ayarlar");
    return { success: true };
  } catch (error) {
    console.error("saveAIIndustryConfig error:", error);
    return { success: false, error: "AI yapılandırması kaydedilemedi." };
  }
}
