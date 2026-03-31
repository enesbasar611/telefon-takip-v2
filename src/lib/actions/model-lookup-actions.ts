"use server";
import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";

export async function searchDeviceModels(query: string) {
  if (!query || query.length < 2) return [];

  const shopId = await getShopId();

  // Logic: Search existing products/devices to suggest common models
  const products = await prisma.product.findMany({
    where: {
      shopId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { deviceInfo: { imei: { contains: query } } }
      ]
    },
    take: 10,
    select: { name: true, category: { select: { name: true } } }
  });

  return Array.from(new Set(products.map(p => p.name)));
}
