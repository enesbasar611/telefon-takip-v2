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
  await prisma.shortageItem.create({
    data: {
      productId: data.productId,
      name: data.name,
      quantity: data.quantity,
      notes: data.notes,
    },
  });
  revalidatePath("/");
}

export async function resolveShortageItem(id: string) {
  await prisma.shortageItem.update({
    where: { id },
    data: { isResolved: true },
  });
  revalidatePath("/");
}
