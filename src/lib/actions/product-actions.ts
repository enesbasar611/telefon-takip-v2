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

export async function createProduct(data: {
  name: string;
  categoryId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  criticalStock: number;
  barcode?: string;
  isSecondHand?: boolean;
  imei?: string;
  color?: string;
  capacity?: string;
}) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        stock: data.stock,
        criticalStock: data.criticalStock,
        barcode: data.barcode,
        isSecondHand: data.isSecondHand || false,
        secondHandInfo: data.isSecondHand ? {
            create: {
                imei: data.imei || `GEN-${Date.now()}`,
                color: data.color,
                capacity: data.capacity,
            }
        } : undefined
      }
    });

    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    return { success: true, product: serializePrisma(product) };
  } catch (error) {
    console.error("Create product error:", error);
    return { success: false, error: "Ürün eklenemedi." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ürün silinemedi." };
  }
}
