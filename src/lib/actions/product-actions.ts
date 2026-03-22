import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" }
    });
    return serializePrisma(products);
  } catch (error) {
    return [];
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany();
    return serializePrisma(categories);
  } catch (error) {
    return [];
  }
}

export async function createProduct(data: { name: string; categoryId: string; buyPrice: number; sellPrice: number; stock: number; criticalStock: number; barcode?: string; isSecondHand?: boolean }) {
  try {
    const product = await prisma.product.create({ data });
    revalidatePath("/stok");
    return { success: true, product: serializePrisma(product) };
  } catch (error) {
    return { success: false, error: "Ürün eklenemedi." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/stok");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ürün silinemedi." };
  }
}
