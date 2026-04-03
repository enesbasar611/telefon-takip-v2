"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { getShopId, getUserId } from "@/lib/auth";

export async function getShortageItems() {
  const shopId = await getShopId();
  const items = await prisma.shortageItem.findMany({
    where: { shopId, isResolved: false },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(items);
}

export async function addShortageItem(data: { productId?: string; name: string; quantity: number; notes?: string }) {
  try {
    const shopId = await getShopId();
    // Check if an unresolved item with same productId or name already exists
    const existing = await prisma.shortageItem.findFirst({
      where: {
        shopId,
        isResolved: false,
        OR: [
          ...(data.productId ? [{ productId: data.productId }] : []),
          { name: { equals: data.name, mode: 'insensitive' as const } }
        ]
      }
    });

    if (existing) {
      return { success: true, isDuplicate: true, message: "Ürün zaten eksikler listesinde mevcut." };
    }

    const newItem = await prisma.shortageItem.create({
      data: {
        productId: data.productId,
        name: data.name,
        quantity: data.quantity,
        notes: data.notes,
        shopId
      },
      include: {
        product: true
      }
    });
    revalidatePath("/");
    revalidatePath("/stok");
    revalidatePath("/stok/hareketler");
    return { success: true, item: serializePrisma(newItem) };
  } catch (error) {
    console.error("Add shortage item error:", error);
    return { success: false, error: "Ekleme başarısız oldu." };
  }
}

export async function updateShortageQuantity(id: string, quantity: number) {
  try {
    const shopId = await getShopId();
    await prisma.shortageItem.update({
      where: { id, shopId },
      data: { quantity }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Güncelleme başarısız." };
  }
}

export async function approveShortageItem(id: string, quantity: number) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();
    const shortageItem = await prisma.shortageItem.findUnique({
      where: { id, shopId },
      include: { product: true }
    });

    if (!shortageItem) throw new Error("Kayıt bulunamadı.");

    if (shortageItem.productId) {
      await prisma.$transaction([
        prisma.product.update({
          where: { id: shortageItem.productId, shopId },
          data: {
            stock: { increment: quantity },
            movements: {
              create: {
                quantity: quantity,
                type: "PURCHASE",
                notes: `Eksikler listesi üzerinden onaylandı: ${shortageItem.name}`,
                shopId
              }
            }
          }
        }),
        prisma.shortageItem.update({
          where: { id, shopId },
          data: { isResolved: true }
        })
      ]);
    } else {
      await prisma.shortageItem.update({
        where: { id, shopId },
        data: { isResolved: true }
      });
    }

    revalidatePath("/");
    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Shortage approval error:", error);
    return { success: false, error: error.message || "İşlem başarısız." };
  }
}

export async function deleteShortageItem(id: string) {
  try {
    const shopId = await getShopId();
    await prisma.shortageItem.delete({
      where: { id, shopId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Shortage deletion error:", error);
    return { success: false, error: "Silme işlemi başarısız." };
  }
}

export async function resolveShortageItem(id: string) {
  try {
    const shopId = await getShopId();
    await prisma.shortageItem.update({
      where: { id, shopId },
      data: { isResolved: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function resolveShortageItems(ids: string[]) {
  if (ids.length === 0) return { success: true };
  try {
    const shopId = await getShopId();
    await prisma.shortageItem.updateMany({
      where: { id: { in: ids }, shopId },
      data: { isResolved: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Toplu güncelleme başarısız." };
  }
}
