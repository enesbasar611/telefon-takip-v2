"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchases: true
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function createSupplier(data: { name: string; contact?: string; phone?: string; email?: string; address?: string }) {
  try {
    const supplier = await prisma.supplier.create({ data });
    revalidatePath("/tedarikciler");
    return { success: true, supplier: serializePrisma(supplier) };
  } catch (error) {
    return { success: false, error: "Tedarikçi oluşturulamadı." };
  }
}

export async function deleteSupplier(id: string) {
    try {
      await prisma.supplier.delete({ where: { id } });
      revalidatePath("/tedarikciler");
      return { success: true };
    } catch (error) {
      return { success: false, error: "Tedarikçi silinemedi." };
    }
}

export async function getPurchaseOrders() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

export async function createPurchaseOrder(data: { supplierId: string; totalAmount: number; status: string }) {
  try {
    const order = await prisma.purchaseOrder.create({ data });
    revalidatePath("/tedarikciler");
    return { success: true, order: serializePrisma(order) };
  } catch (error) {
    return { success: false, error: "Sipariş oluşturulamadı." };
  }
}
