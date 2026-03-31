"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function getSuppliers() {
  try {
    const shopId = await getShopId();
    const suppliers = await prisma.supplier.findMany({
      where: { shopId },
      include: {
        purchases: {
          include: { items: { include: { product: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function createSupplier(data: {
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: string | null;
  bankName?: string | null;
  iban?: string | null;
  notes?: string | null;
  trustScore?: number;
  taxNumber?: string | null;
  taxOffice?: string | null;
}) {
  try {
    const shopId = await getShopId();
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        shopId
      }
    });
    revalidatePath("/tedarikciler");
    return { success: true, supplier: serializePrisma(supplier) };
  } catch (error) {
    return { success: false, error: "Tedarikçi oluşturulamadı." };
  }
}

export async function deleteSupplier(id: string, force: boolean = false) {
  try {
    const shopId = await getShopId();
    const supplier = await prisma.supplier.findUnique({
      where: { id, shopId },
      include: {
        purchases: {
          where: {
            shopId,
            status: { in: ["PENDING", "ON_WAY"] }
          },
          include: { items: true }
        }
      }
    });

    if (!supplier) return { success: false, error: "Tedarikçi bulunamadı." };

    // If there's pending orders and not forced, return them to UI to ask user
    if (supplier.purchases.length > 0 && !force) {
      return {
        success: false,
        error: "PENDING_ORDERS",
        pendingOrders: serializePrisma(supplier.purchases)
      };
    }

    // If force is true, we move items to shortage list before deleting
    if (force && supplier.purchases.length > 0) {
      for (const order of supplier.purchases) {
        for (const item of order.items) {
          const missingQty = item.quantity - (item.receivedQuantity || 0);
          if (missingQty > 0) {
            await prisma.shortageItem.create({
              data: {
                productId: item.productId,
                name: item.name,
                quantity: missingQty,
                notes: `Tedarikçi (${supplier.name}) silindi. Bekleyen siparişten aktarıldı.`,
                isResolved: false,
                shopId
              }
            });
          }
        }
      }
    }

    // Use a transaction for deletion to ensure everything is cleaned up
    await prisma.$transaction(async (tx) => {
      // 1. Delete PurchaseOrderItems (manually if needed, but onDelete: Cascade is on schema for some)
      // Actually schema shows PurchaseOrder has items. Let's delete items first if needed or rely on cascade

      // 2. Delete Transactions (onDelete: Cascade is on schema for SupplierTransaction)

      // 3. Nullify supplierId on Products (Product -> Supplier is optional)
      await tx.product.updateMany({
        where: { supplierId: id, shopId },
        data: { supplierId: null }
      });

      // 4. Delete PurchaseOrders
      await tx.purchaseOrder.deleteMany({
        where: { supplierId: id, shopId }
      });

      // 5. Delete Supplier
      await tx.supplier.delete({ where: { id, shopId } });
    });

    revalidatePath("/tedarikciler");
    return { success: true };
  } catch (error) {
    console.error("Delete supplier error:", error);
    return { success: false, error: "Tedarikçi silinemedi. Lütfen sistem yöneticisine danışın." };
  }
}

export async function getPurchaseOrders() {
  try {
    const shopId = await getShopId();
    const orders = await prisma.purchaseOrder.findMany({
      where: { shopId },
      include: {
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

export async function createPurchaseOrder(data: { supplierId: string; totalAmount: number; status: OrderStatus }) {
  try {
    const shopId = await getShopId();
    const generatedOrderNo = `PO-${data.supplierId.slice(-4)}-${Date.now()}`;
    const order = await prisma.purchaseOrder.create({
      data: {
        ...data,
        orderNo: generatedOrderNo,
        shopId
      }
    });
    revalidatePath("/tedarikciler");
    return { success: true, order: serializePrisma(order) };
  } catch (error) {
    return { success: false, error: "Sipariş oluşturulamadı." };
  }
}

export async function updateSupplier(id: string, data: Partial<{
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: string | null;
  bankName?: string | null;
  iban?: string | null;
  notes?: string | null;
  trustScore?: number;
  taxNumber?: string | null;
  taxOffice?: string | null;
  balance?: number;
}>) {
  try {
    const shopId = await getShopId();
    const supplier = await prisma.supplier.update({
      where: { id, shopId },
      data
    });
    revalidatePath("/tedarikciler");
    return { success: true, supplier: serializePrisma(supplier) };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Tedarikçi güncellenemedi." };
  }
}

export async function getCriticalAndOutOfStockProducts() {
  try {
    const shopId = await getShopId();
    const products = await prisma.product.findMany({
      where: { shopId },
      include: { category: true },
      orderBy: { stock: 'asc' },
    });
    const critical = products.filter((p: any) => p.stock <= p.criticalStock);
    return serializePrisma(critical);
  } catch (error) {
    console.error("Error fetching critical products:", error);
    return [];
  }
}
