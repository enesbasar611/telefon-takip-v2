"use server";
import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { buildProductSearchOrConditions } from "@/lib/inventory/product-search";

export async function searchDeviceModels(query: string) {
  if (!query || query.trim().length < 2) return [];

  const shopId = await getShopId();
  if (!shopId) return [];

  const orConditions = await buildProductSearchOrConditions(shopId, query, { minLength: 2 });
  if (orConditions.length === 0) return [];

  // Logic: Search existing products/devices (including compatible models) to suggest common models
  const products = await prisma.product.findMany({
    where: {
      shopId,
      isDeleted: false,
      OR: orConditions
    },
    take: 10,
    select: { name: true, category: { select: { name: true } } }
  });

  return Array.from(new Set(products.map(p => p.name)));
}
