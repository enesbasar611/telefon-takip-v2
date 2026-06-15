"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getShopId } from "@/lib/auth";
import { cache } from "react";


export const getSettings = cache(async function getSettings() {
  const shopId = await getShopId(false);
  if (!shopId) return [];

  return unstable_cache(
    async () => {
      try {
        const settings = await prisma.setting.findMany({ where: { shopId } });
        return serializePrisma(settings);
      } catch (error) {
        return [];
      }
    },
    [`settings-${shopId}`],
    { tags: [`settings-${shopId}`, "settings"], revalidate: 3600 }
  )();
});

export const getShop = cache(async function getShop() {
  const shopId = await getShopId(false);
  if (!shopId) return null;

  return unstable_cache(
    async () => {
      try {
        const shop = await prisma.shop.findUnique({
          where: { id: shopId }
        });
        return serializePrisma(shop);
      } catch (error) {
        console.error("getShop error:", error);
        return null;
      }
    },
    [`shop-${shopId}`],
    { tags: [`shop-${shopId}`, "shop"], revalidate: 60 }
  )();
});

export async function updateSetting(key: string, value: string, revalidate = true) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { success: false, error: "Dükkan bulunamadı." };
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
      revalidateTag(`rates-${shopId}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ayar kaydedilemedi." };
  }
}

export async function bulkUpdateSettings(settings: Record<string, string>) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { success: false, error: "Dükkan bulunamadı." };
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
    revalidateTag(`rates-${shopId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ayarlar güncellenirken hata oluştu." };
  }
}

export async function updateShop(data: any) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { success: false, error: "Dükkan bulunamadı." };
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: data.name,
        industry: data.industry,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxNumber: data.taxNumber,
        taxOffice: data.taxOffice,
        companyName: data.companyName,
        companyAddress: data.address,
        companyCity: data.companyCity,
        companyDistrict: data.companyDistrict,
        website: data.website,
        logoUrl: data.logoUrl,
        enabledModules: data.enabledModules,
        themeConfig: data.themeConfig,
        // Sync flags
        isFinanceEnabled: data.enabledModules?.includes("FINANCE"),
        isServiceEnabled: data.enabledModules?.includes("SERVICE"),
        isStockEnabled: data.enabledModules?.includes("STOCK"),
        isCourierEnabled: data.enabledModules?.includes("COURIER"),
        isEInvoiceEnabled: data.enabledModules?.includes("EFATURA")
      } as any,
    });

    // EDM Ayarları ile senkronize et
    // Eğer dükkanın e-Fatura modülü aktifse ve VKN/Vergi bilgileri değiştiyse oraya da yansıt
    await prisma.eDMSettings.upsert({
      where: { shopId },
      create: {
        shopId,
        senderVkn: data.taxNumber || null,
        senderTaxOffice: data.taxOffice || null,
        senderName: data.companyName || data.name || null,
        senderAddress: data.address || null,
        senderCity: data.companyCity || "İstanbul",
        senderDistrict: data.companyDistrict || null,
      },
      update: {
        ...(data.taxNumber !== undefined && { senderVkn: data.taxNumber }),
        ...(data.taxOffice !== undefined && { senderTaxOffice: data.taxOffice }),
        ...(data.companyName !== undefined && { senderName: data.companyName }),
        ...(data.address !== undefined && { senderAddress: data.address }),
        ...(data.companyCity !== undefined && { senderCity: data.companyCity }),
        ...(data.companyDistrict !== undefined && { senderDistrict: data.companyDistrict }),
      },
    });

    // Fiş Ayarları (ReceiptSettings) ile senkronize et
    // Dükkan ismi, telefon veya adres değiştiyse tüm fiş tiplerine yansıt
    await prisma.receiptSettings.updateMany({
      where: { shopId },
      data: {
        ...(data.name !== undefined && { title: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
      }
    });

    revalidatePath("/");
    revalidatePath("/ayarlar");
    revalidatePath("/admin/edm");
    revalidatePath("/");
    revalidatePath("/ayarlar");
    revalidateTag("shop");
    revalidateTag(`shop-${shopId}`);
    revalidateTag("receipt-settings");
    return { success: true };
  } catch (error) {
    console.error("updateShop error:", error);
    return { success: false, error: "Dükkan bilgileri güncellenemedi." };
  }
}

export async function updateShopModules(enabledModules: string[]) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { success: false, error: "Dükkan bulunamadı." };
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        enabledModules,
        // Sync flags
        isFinanceEnabled: enabledModules.includes("FINANCE"),
        isServiceEnabled: enabledModules.includes("SERVICE"),
        isStockEnabled: enabledModules.includes("STOCK"),
        isCourierEnabled: enabledModules.includes("COURIER"),
        isEInvoiceEnabled: enabledModules.includes("EFATURA")
      } as any,
    });
    revalidatePath("/");
    revalidatePath("/ayarlar");
    revalidateTag("shop");
    revalidateTag(`shop-${shopId}`);
    return { success: true };
  } catch (error) {
    console.error("updateShopModules error:", error);
    return { success: false, error: "Modüller güncellenemedi." };
  }
}

export async function saveAIIndustryConfig(serviceFields: any[], inventoryFields: any[], accessories: string[]) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { success: false, error: "Dükkan bulunamadı." };
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
    revalidateTag("shop");
    revalidateTag(`shop-${shopId}`);
    return { success: true };
  } catch (error) {
    console.error("saveAIIndustryConfig error:", error);
    return { success: false, error: "AI yapılandırması kaydedilemedi." };
  }
}

export async function updateGlobalCriticalStock(level: number) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { success: false, error: "Dükkan bulunamadı." };

    await prisma.product.updateMany({
      where: { shopId },
      data: { criticalStock: level }
    });

    // Also save it as a setting for future reference/defaults
    await prisma.setting.upsert({
      where: { shopId_key: { shopId, key: "default_critical_stock" } },
      update: { value: level.toString() },
      create: { key: "default_critical_stock", value: level.toString(), shopId }
    });

    revalidatePath("/stok");
    revalidatePath("/ayarlar");
    revalidateTag("shop");
    revalidateTag(`shop-${shopId}`);

    return { success: true };
  } catch (error) {
    console.error("updateGlobalCriticalStock error:", error);
    return { success: false, error: "Kritik stok seviyesi güncellenemedi." };
  }
}
