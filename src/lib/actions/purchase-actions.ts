"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
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

        // revalidatePath("/tedarikciler");
        return { success: true, order: serializePrisma(order) };

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
        // revalidatePath("/tedarikciler");
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

        // Add import { serializePrisma } from "@/lib/utils"; at top of file, doing it here first 
        const serializedSupplier = serializePrisma(supplier);

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
    purchaseOrderId?: string;
}) {
    try {
        const transaction = await prisma.$transaction(async (tx: any) => {
            const t = await tx.supplierTransaction.create({
                data: {
                    supplierId: data.supplierId,
                    amount: data.amount,
                    type: data.type,
                    description: data.description,
                },
            });

            // If this is for a specific purchase order, mark it as PAID
            if (data.purchaseOrderId) {
                await tx.purchaseOrder.update({
                    where: { id: data.purchaseOrderId },
                    data: { paymentStatus: "PAID" }
                });
            }

            // Update supplier balance
            // User requested: "Borç Ekle" (INCOME/Debt) and "Borç Öde" (EXPENSE/Payment)
            // INCOME = Borçlandık (increases balance), EXPENSE = Biz ödeme yaptık (decreases balance)
            const adjustment = data.type === "INCOME" ? data.amount : -data.amount;

            await tx.supplier.update({
                where: { id: data.supplierId },
                data: {
                    balance: { increment: adjustment },
                },
            });

            return t;
        });

        // revalidatePath("/tedarikciler");
        return { success: true, transaction: serializePrisma(transaction) };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error: "İşlem kaydedilemedi." };
    }
}

export async function receivePurchaseOrderAction(orderId: string, receivedItems: { itemId: string; receivedQuantity: number; buyPrice?: number; buyPriceUsd?: number | null }[]) {
    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const order = await tx.purchaseOrder.findUnique({
                where: { id: orderId },
                include: { items: true, supplier: true },
            });

            if (!order) throw new Error("Sipariş bulunamadı.");

            let newTotalAmount = 0;

            // 1. Update received quantities for items
            for (const rItem of receivedItems) {
                const item = order.items.find((i: any) => i.id === rItem.itemId);
                if (item) {
                    const priceToUse = rItem.buyPrice ?? Number(item.buyPrice);
                    newTotalAmount += rItem.receivedQuantity * priceToUse;

                    await tx.purchaseOrderItem.update({
                        where: { id: rItem.itemId },
                        data: {
                            receivedQuantity: { increment: rItem.receivedQuantity },
                            buyPrice: priceToUse,
                            buyPriceUsd: rItem.buyPriceUsd !== undefined ? rItem.buyPriceUsd : null
                        },
                    });

                    // 2. Update Product stock if productId exists
                    if (item.productId && rItem.receivedQuantity > 0) {
                        const product = await tx.product.findUnique({ where: { id: item.productId } });
                        const oldPrice = Number(product.buyPrice);

                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: { increment: rItem.receivedQuantity },
                                buyPrice: priceToUse,
                                buyPriceUsd: rItem.buyPriceUsd !== undefined ? rItem.buyPriceUsd : null
                            },
                        });

                        let priceNote = "";
                        if (rItem.buyPriceUsd) {
                            priceNote = priceToUse !== oldPrice
                                ? `Sipariş Kabul: ${order.orderNo}. Eski: ${oldPrice}₺, Yeni: $${rItem.buyPriceUsd} (${priceToUse}₺)`
                                : `Sipariş Kabul: ${order.orderNo}`;
                        } else {
                            priceNote = priceToUse !== oldPrice
                                ? `Sipariş Kabul: ${order.orderNo}. Eski: ${oldPrice}₺, Yeni: ${priceToUse}₺`
                                : `Sipariş Kabul: ${order.orderNo}`;
                        }

                        // Create InventoryMovement
                        await tx.inventoryMovement.create({
                            data: {
                                productId: item.productId,
                                quantity: rItem.receivedQuantity,
                                type: "PURCHASE",
                                notes: priceNote,
                            },
                        });

                        // Auto-remove from Shortage List as some stock arrived?
                        // Actually, if we received SOME, we remove old entry, but if we still have MISSING below, we'll re-add it.
                        await tx.shortageItem.deleteMany({
                            where: { productId: item.productId }
                        });
                    }

                    // 2b. Handle Missing Items: If received < ordered, re-add to Shortage List
                    // IF received >= ordered, DON'T add to shortage (user request: "fazlaysa eksik listesine gönderme")
                    if (rItem.receivedQuantity < item.quantity) {
                        const missingQty = item.quantity - rItem.receivedQuantity;
                        await tx.shortageItem.create({
                            data: {
                                productId: item.productId,
                                name: item.name,
                                quantity: missingQty,
                                notes: `Sipariş #${order.orderNo} uyuşmazlığı - Gelen: ${rItem.receivedQuantity}/${item.quantity}`,
                                isResolved: false
                            }
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
                    totalAmount: newTotalAmount,
                    netAmount: newTotalAmount,
                },
            });

            // 4. Update Supplier Balance & Total Shopping
            await tx.supplier.update({
                where: { id: order.supplierId },
                data: {
                    totalShopping: { increment: newTotalAmount },
                    balance: { increment: order.paymentStatus === "UNPAID" ? newTotalAmount : 0 },
                },
            });

            return order;
        });

        // revalidatePath("/tedarikciler");
        return { success: true, order: serializePrisma(result) };
    } catch (error) {
        console.error("Error receiving order:", error);
        return { success: false, error: "Stok girişi yapılamadı." };
    }
}
