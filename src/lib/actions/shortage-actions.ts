"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getShortageItems() {
  return await prisma.shortageItem.findMany({
    where: { isResolved: false },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addShortageItem(data: { productId?: string; name: string; quantity: number; notes?: string }) {
  try {
    await prisma.shortageItem.create({
      data: {
        productId: data.productId,
        name: data.name,
        quantity: data.quantity,
        notes: data.notes,
      },
    });
    revalidatePath("/");
    revalidatePath("/stok");
    return { success: true };
  } catch (error) {
    console.error("Add shortage item error:", error);
    return { success: false, error: "Ekleme başarısız oldu." };
  }
}

export async function approveShortageItem(id: string, quantity: number) {
  try {
    const shortageItem = await prisma.shortageItem.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!shortageItem) throw new Error("Kayıt bulunamadı.");

    if (shortageItem.productId) {
      await prisma.$transaction([
        prisma.product.update({
          where: { id: shortageItem.productId },
          data: {
            stock: { increment: quantity },
            movements: {
              create: {
                quantity: quantity,
                type: "PURCHASE",
                notes: `Eksikler listesi üzerinden onaylandı: ${shortageItem.name}`
              }
            }
          }
        }),
        prisma.shortageItem.update({
          where: { id },
          data: { isResolved: true }
        })
      ]);
    } else {
      await prisma.shortageItem.update({
        where: { id },
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
    await prisma.shortageItem.delete({
      where: { id }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Shortage deletion error:", error);
    return { success: false, error: "Silme işlemi başarısız." };
  }
}

export async function resolveShortageItem(id: string) {
  await prisma.shortageItem.update({
    where: { id },
    data: { isResolved: true },
  });
  revalidatePath("/");
}
