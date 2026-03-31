"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function getDeviceList() {
  try {
    const shopId = await getShopId();
    const devices = await prisma.product.findMany({
      where: {
        shopId,
        deviceInfo: { isNot: null }
      },
      include: {
        category: true,
        deviceInfo: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
}

export async function createDeviceEntry(data: any) {
  try {
    const shopId = await getShopId();
    const user = await prisma.user.findFirst({ where: { role: "ADMIN", shopId } });
    if (!user) throw new Error("Admin user not found");

    const product = await prisma.product.create({
      data: {
        name: `${data.brand} ${data.model}`,
        shopId,
        categoryId: data.categoryId,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        stock: 1,
        criticalStock: 0,
        isSecondHand: data.condition === "USED",
        deviceInfo: {
          create: {
            shopId,
            imei: data.imei,
            serialNumber: data.serialNumber,
            color: data.color,
            capacity: data.capacity,
            batteryHealth: data.batteryHealth,
            cosmeticScore: data.cosmeticScore,
            condition: data.condition,
            expertChecklist: data.expertChecklist,
            buyBackPrice: data.buyBackPrice,
            buyBackMonths: data.buyBackMonths,
            purchasedFrom: data.purchasedFrom,
            purchaseDate: new Date(),
          }
        }
      }
    });

    // Financial Sync: Record the purchase as an EXPENSE
    await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amount: data.buyPrice,
        description: `Cihaz Alımı: ${data.brand} ${data.model} (IMEI: ${data.imei})`,
        paymentMethod: "CASH",
        userId: user.id,
        shopId,
      }
    });

    // Inventory Movement
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        shopId,
        quantity: 1,
        type: "PURCHASE",
        notes: `Cihaz Alımı: ${data.condition}`
      }
    });

    revalidatePath("/cihaz-listesi");
    revalidatePath("/satis/kasa");
    revalidatePath("/stok");
    return { success: true, device: serializePrisma(product) };
  } catch (error) {
    console.error("Create device error:", error);
    return { success: false, error: "Cihaz kaydı oluşturulamadı." };
  }
}

export async function updateDeviceExpertise(deviceId: string, expertChecklist: any, cosmeticScore: number) {
  try {
    const shopId = await getShopId();
    const info = await prisma.deviceHubInfo.findUnique({ where: { id: deviceId }, include: { product: true } });
    if (!info || info.product.shopId !== shopId) throw new Error("Yetkisiz islem");

    await prisma.deviceHubInfo.update({
      where: { id: deviceId },
      data: {
        expertChecklist,
        cosmeticScore,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/cihaz-listesi");
    return { success: true };
  } catch (error) {
    console.error("Error updating device expertise:", error);
    return { success: false, error: "Ekspertiz sonuçları güncellenirken hata oluştu." };
  }
}
