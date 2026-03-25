"use server";
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
  sku?: string;
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
        sku: data.sku,
        isSecondHand: data.isSecondHand || false,
        deviceInfo: data.isSecondHand ? {
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

export async function updateProduct(id: string, data: any) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        buyPrice: data.buyPrice ? Number(data.buyPrice) : undefined,
        sellPrice: data.sellPrice ? Number(data.sellPrice) : undefined,
        stock: data.stock !== undefined ? Number(data.stock) : undefined,
        criticalStock: data.criticalStock !== undefined ? Number(data.criticalStock) : undefined,
      }
    });
    revalidatePath("/stok");
    return { success: true, product: serializePrisma(product) };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, error: "Ürün güncellenemedi." };
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

export async function createCategory(name: string) {
    try {
      const category = await prisma.category.create({ data: { name } });
      revalidatePath("/stok");
      return { success: true, category: serializePrisma(category) };
    } catch (error) {
      return { success: false, error: "Kategori oluşturulamadı." };
    }
}
