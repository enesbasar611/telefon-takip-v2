import { Product } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function getProducts() {
  try {
    return await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    return await prisma.category.findMany();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createProduct(data: {
  name: string;
  categoryId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  sku?: string;
  barcode?: string;
}) {
  const product = await prisma.product.create({
    data,
  });
  revalidatePath("/stok");
  return product;
}

export async function deleteProduct(id: string) {
  // Check if used in services or sales
  const serviceUseCount = await prisma.serviceUsedPart.count({ where: { productId: id } });
  const saleItemCount = await prisma.saleItem.count({ where: { productId: id } });

  if (serviceUseCount > 0 || saleItemCount > 0) {
    throw new Error("Ürün servislerde veya satışlarda kullanıldığı için silinemez.");
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/stok");
}
