"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus, PaymentMethod, TransactionType } from "@prisma/client";

export async function createPurchaseOrderAction(data: {
    supplierId: string;
    orderNo: string;
    items: { productId?: string; name: string; quantity: number; buyPrice: number; vatRate?: number }[];
    totalAmount: number;
    vatAmount: number;
    netAmount: number;
    description?: string;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
}) {
    try {
        const order = await prisma.purchaseOrder.create({
            data: {
                supplierId: data.supplierId,
                orderNo: data.orderNo,
                totalAmount: data.totalAmount,
                vatAmount: data.vatAmount,
                netAmount: data.netAmount,
                description: data.description,
                status: "PENDING",
                paymentStatus: data.paymentStatus || "UNPAID",
                paymentMethod: data.paymentMethod || "CASH",
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        quantity: item.quantity,
                        buyPrice: item.buyPrice,
                        vatRate: item.vatRate || 20,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        // If payment status is PAID or PARTIAL, create a transaction? 
        // Usually it's better to do this in a separate step or Mal Kabul.

        revalidatePath("/tedarikciler");
        return { success: true, order };
    } catch (error) {
        console.error("Error creating purchase order:", error);
        return { success: false, error: "Sipariş oluşturulamadı." };
    }
}

export async function updatePurchaseOrderStatusAction(orderId: string, status: OrderStatus) {
    try {
        const order = await prisma.purchaseOrder.update({
            where: { id: orderId },
            data: { status },
        });
        revalidatePath("/tedarikciler");
        return { success: true, order };
    } catch (error) {
        return { success: false, error: "Durum güncellenemedi." };
    }
}

export async function getSupplierProfileDataAction(supplierId: string) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: {
                purchases: {
                    orderBy: { createdAt: "desc" },
                    include: { items: true },
                },
                transactions: {
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!supplier) return null;

        // Convert Decimals to Numbers for client components
        const serializedSupplier = JSON.parse(JSON.stringify(supplier));

        return serializedSupplier;
    } catch (error) {
        console.error("Error fetching supplier profile:", error);
        return null;
    }
}

export async function createSupplierTransactionAction(data: {
    supplierId: string;
    amount: number;
    type: TransactionType;
    description: string;
}) {
    try {
        const transaction = await prisma.$transaction(async (tx) => {
            const t = await tx.supplierTransaction.create({
                data: {
                    supplierId: data.supplierId,
                    amount: data.amount,
                    type: data.type,
                    description: data.description,
                },
            });

            // Update supplier balance
            // DEBT increases balance (what we owe), PAYMENT decreases it.
            const adjustment = data.type === "INCOME" ? -data.amount : data.amount; // INCOME/EXPENSE enum from prisma
            // Note: Reusing TransactionType enum which has INCOME/EXPENSE. 
            // For Supplier: EXPENSE = we spent money (debt), INCOME = we received money (refund?)
            // Actually let's use DEBT/PAYMENT if possible, but TransactionType is fixed.
            // I'll interpret EXPENSE as payment from us to them? No, EXPENSE is usually money going out.

            await tx.supplier.update({
                where: { id: data.supplierId },
                data: {
                    balance: { increment: adjustment },
                },
            });

            return t;
        });

        revalidatePath("/tedarikciler");
        return { success: true, transaction };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error: "İşlem kaydedilemedi." };
    }
}

export async function receivePurchaseOrderAction(orderId: string, receivedItems: { itemId: string; receivedQuantity: number }[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.purchaseOrder.findUnique({
                where: { id: orderId },
                include: { items: true, supplier: true },
            });

            if (!order) throw new Error("Sipariş bulunamadı.");

            // 1. Update received quantities for items
            for (const rItem of receivedItems) {
                const item = order.items.find((i) => i.id === rItem.itemId);
                if (item) {
                    await tx.purchaseOrderItem.update({
                        where: { id: rItem.itemId },
                        data: { receivedQuantity: { increment: rItem.receivedQuantity } },
                    });

                    // 2. Update Product stock if productId exists
                    if (item.productId && rItem.receivedQuantity > 0) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: rItem.receivedQuantity } },
                        });

                        // Create InventoryMovement
                        await tx.inventoryMovement.create({
                            data: {
                                productId: item.productId,
                                quantity: rItem.receivedQuantity,
                                type: "PURCHASE",
                                notes: `Sipariş Kabul: ${order.orderNo}`,
                            },
                        });
                    }
                }
            }

            // 3. Update Order status to COMPLETED if all received? Or just mark as COMPLETED.
            await tx.purchaseOrder.update({
                where: { id: orderId },
                data: {
                    status: "COMPLETED",
                    receivedAt: new Date(),
                },
            });

            // 4. Update Supplier Balance & Total Shopping
            // When received, the net amount becomes a DEBT if not paid.
            // For now, let's assume simple tracking.
            await tx.supplier.update({
                where: { id: order.supplierId },
                data: {
                    totalShopping: { increment: order.totalAmount },
                    balance: { increment: order.paymentStatus === "UNPAID" ? order.totalAmount : 0 },
                },
            });

            return order;
        });

        revalidatePath("/tedarikciler");
        return { success: true, order: result };
    } catch (error) {
        console.error("Error receiving order:", error);
        return { success: false, error: "Stok girişi yapılamadı." };
    }
}
