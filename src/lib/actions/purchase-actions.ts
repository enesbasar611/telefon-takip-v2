"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { OrderStatus, PaymentStatus, PaymentMethod, TransactionType } from "@prisma/client";
import { getShopId } from "@/lib/auth";

export async function createPurchaseOrderAction(data: {
    supplierId: string;
    orderNo: string;
    items: { productId?: string; name: string; quantity: number; buyPrice: number; buyPriceUsd?: number | null; vatRate?: number }[];
    totalAmount: number;
    paidAmount?: number;
    vatAmount: number;
    netAmount: number;
    description?: string;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    accountId?: string;
}) {
    try {
        const shopId = await getShopId();
        const { getUserId } = await import("@/lib/auth");
        const userId = await getUserId();

        const order = await prisma.$transaction(async (tx: any) => {
            const o = await tx.purchaseOrder.create({
                data: {
                    shopId,
                    supplierId: data.supplierId,
                    orderNo: data.orderNo,
                    totalAmount: data.totalAmount,
                    vatAmount: data.vatAmount,
                    netAmount: data.netAmount,
                    description: data.description,
                    status: "PENDING",
                    remainingAmount: data.paidAmount !== undefined ? (data.totalAmount - data.paidAmount) : (data.paymentStatus === "PAID" ? 0 : data.totalAmount),
                    paymentStatus: data.paymentStatus || "UNPAID",
                    paymentMethod: data.paymentMethod || "CASH",
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
                            name: item.name,
                            quantity: item.quantity,
                            buyPrice: item.buyPrice,
                            buyPriceUsd: item.buyPriceUsd,
                            vatRate: item.vatRate || 20,
                            shopId
                        })),
                    },
                },
                include: {
                    items: true,
                    supplier: true,
                },
            });

            if ((data.paymentStatus === "PAID" || data.paymentStatus === "PARTIAL") && data.accountId) {
                const amountToPay = data.paidAmount || data.totalAmount;
                // Ödeme işlemi, tedarikçi ekstresine ve kasaya yansıtılır
                await tx.supplierTransaction.create({
                    data: {
                        supplierId: data.supplierId,
                        amount: Math.round(amountToPay),
                        type: "EXPENSE",
                        description: `${data.orderNo} nolu sipariş ${data.paymentStatus === "PARTIAL" ? "kısmi " : ""}ödemesi`,
                        purchaseOrderId: o.id,
                        shopId
                    }
                });

                await tx.transaction.create({
                    data: {
                        type: "EXPENSE",
                        amount: Math.round(amountToPay),
                        description: `[${data.paymentStatus === "PARTIAL" ? "Kısmi " : "Peşin"} Satın Alma] ${data.orderNo} nolu sipariş`,
                        paymentMethod: data.paymentMethod || "CASH",
                        financeAccountId: data.accountId,
                        userId,
                        shopId,
                        category: "TEDARİKÇİ"
                    }
                });

                await tx.financeAccount.update({
                    where: { id: data.accountId },
                    data: { balance: { decrement: amountToPay } }
                });
            }

            return o;
        });

        revalidatePath("/tedarikciler");
        revalidatePath("/stok");
        return { success: true, order: serializePrisma(order) };

    } catch (error) {
        console.error("Error creating purchase order:", error);
        return { success: false, error: "Sipariş oluşturulamadı." };
    }
}

export async function updatePurchaseOrderStatusAction(orderId: string, status: OrderStatus) {
    try {
        const shopId = await getShopId();
        const order = await prisma.purchaseOrder.update({
            where: { id: orderId, shopId },
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
        const shopId = await getShopId();
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId, shopId },
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
    accountId?: string;
    paymentMethod?: PaymentMethod;
}) {
    try {
        const shopId = await getShopId();
        const { getUserId } = await import("@/lib/auth");
        const userId = await getUserId();

        const transaction = await prisma.$transaction(async (tx: any) => {
            const t = await tx.supplierTransaction.create({
                data: {
                    supplierId: data.supplierId,
                    amount: Math.round(data.amount), // Küsüratları yuvarla
                    type: data.type,
                    description: data.description,
                    purchaseOrderId: data.purchaseOrderId || null,
                    shopId
                },
            });

            // If an account is selected and this impacts cash flow:
            // "EXPENSE" in supplier means we PAY money -> decreases our FinanceAccount (EXPENSE transaction)
            if (data.accountId && data.type === "EXPENSE") {
                await tx.transaction.create({
                    data: {
                        type: "EXPENSE",
                        amount: Math.round(data.amount),
                        description: `[Tedarikçi Ödemesi] ${data.description}`,
                        paymentMethod: data.paymentMethod || "CASH",
                        financeAccountId: data.accountId,
                        userId,
                        shopId,
                        category: "TEDARİKÇİ"
                    }
                });

                // Dedükte balance in FinanceAccount
                await tx.financeAccount.update({
                    where: { id: data.accountId },
                    data: { balance: { decrement: data.amount } }
                });
            }

            // Borç/Ödeme miktarını yuvarla
            const roundedAmount = Math.round(data.amount);

            // 1. Eğer spesifik bir sipariş için ödeme yapılıyorsa
            if (data.purchaseOrderId && data.type === "EXPENSE") {
                const order = await tx.purchaseOrder.findUnique({
                    where: { id: data.purchaseOrderId, shopId }
                });

                if (order) {
                    const newRemaining = Math.max(0, Math.round(Number(order.remainingAmount) - roundedAmount));
                    await tx.purchaseOrder.update({
                        where: { id: data.purchaseOrderId },
                        data: {
                            remainingAmount: newRemaining,
                            paymentStatus: newRemaining <= 0 ? "PAID" : "PARTIAL"
                        }
                    });
                }
            }

            // 2. Tedarikçi bakiyesini güncelle
            // INCOME = Borçlandık (balance artar), EXPENSE = Ödeme yaptık (balance azalır)
            const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId, shopId } });
            if (!supplier) throw new Error("Tedarikçi bulunamadı");

            const currentBalance = Math.round(Number(supplier.balance));
            const adjustment = data.type === "INCOME" ? roundedAmount : -roundedAmount;
            let newBalance = Math.max(0, currentBalance + adjustment); // Borç asla eksiye düşmez

            await tx.supplier.update({
                where: { id: data.supplierId },
                data: { balance: newBalance },
            });

            // 3. Eğer toplam borç sıfırlandıysa, o tedarikçinin tüm siparişlerini ÖDENDİ olarak işaretle
            if (newBalance === 0) {
                await tx.purchaseOrder.updateMany({
                    where: {
                        supplierId: data.supplierId,
                        shopId,
                        paymentStatus: { not: "PAID" }
                    },
                    data: {
                        paymentStatus: "PAID",
                        remainingAmount: 0
                    }
                });
            }

            return t;
        });

        revalidatePath("/tedarikciler");
        revalidatePath("/finans");
        return { success: true, transaction: serializePrisma(transaction) };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error: "İşlem kaydedilemedi." };
    }
}

export async function receivePurchaseOrderAction(
    orderId: string,
    receivedItems: {
        itemId: string;
        receivedQuantity: number;
        buyPrice?: number;
        buyPriceUsd?: number | null;
        addToStock?: boolean;
        categoryId?: string;
        sellPrice?: number;
    }[]
) {
    try {
        const shopId = await getShopId();
        const result = await prisma.$transaction(async (tx: any) => {
            const order = await tx.purchaseOrder.findUnique({
                where: { id: orderId, shopId },
                include: { items: true, supplier: true },
            });

            if (!order) throw new Error("Sipariş bulunamadı.");

            let newTotalAmount = 0;

            // 1. Update received quantities for items
            for (const rItem of (receivedItems as any)) {
                const item = order.items.find((i: any) => i.id === rItem.itemId);
                if (item) {
                    const priceToUse = rItem.buyPrice ?? Number(item.buyPrice);
                    newTotalAmount += rItem.receivedQuantity * priceToUse;

                    let productId = item.productId;

                    // 2a. If we need to create a new product for this entry
                    if (!productId && rItem.addToStock && rItem.categoryId && rItem.sellPrice) {
                        const newProduct = await tx.product.create({
                            data: {
                                name: item.name,
                                categoryId: rItem.categoryId,
                                buyPrice: priceToUse,
                                buyPriceUsd: rItem.buyPriceUsd || null,
                                sellPrice: rItem.sellPrice,
                                stock: 0, // Will be incremented below
                                criticalStock: 1,
                                shopId,
                                supplierId: order.supplierId
                            }
                        });
                        productId = newProduct.id;

                        // Update the purchase order item with the newly created productId
                        await tx.purchaseOrderItem.update({
                            where: { id: rItem.itemId },
                            data: { productId }
                        });
                    }

                    await tx.purchaseOrderItem.update({
                        where: { id: rItem.itemId, shopId },
                        data: {
                            receivedQuantity: { increment: rItem.receivedQuantity },
                            buyPrice: priceToUse,
                            buyPriceUsd: rItem.buyPriceUsd !== undefined ? rItem.buyPriceUsd : null
                        },
                    });

                    // 2. Update Product stock if productId exists
                    if (productId && rItem.receivedQuantity > 0) {
                        const product = await tx.product.findUnique({ where: { id: productId, shopId } });
                        const oldPrice = Number(product.buyPrice);

                        await tx.product.update({
                            where: { id: productId, shopId },
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
                                productId: productId,
                                quantity: rItem.receivedQuantity,
                                type: "PURCHASE",
                                notes: priceNote,
                                shopId
                            },
                        });

                        // Auto-remove from Shortage List as some stock arrived?
                        await tx.shortageItem.deleteMany({
                            where: { productId: productId, shopId }
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
                                isResolved: false,
                                shopId
                            }
                        });
                    }
                }
            }

            const finalReceivedAmount = Math.round(newTotalAmount);

            // 3. Update Order status
            await tx.purchaseOrder.update({
                where: { id: orderId },
                data: {
                    status: "COMPLETED",
                    receivedAt: new Date(),
                    totalAmount: finalReceivedAmount,
                    netAmount: finalReceivedAmount,
                    remainingAmount: order.paymentStatus === "UNPAID" ? finalReceivedAmount : 0,
                },
            });

            // 4. Update Supplier Balance & Total Shopping
            const currentSupplier = await tx.supplier.findUnique({ where: { id: order.supplierId, shopId } });
            const oldBalance = Math.round(Number(currentSupplier.balance));
            const newBalance = order.paymentStatus === "UNPAID" ? oldBalance + finalReceivedAmount : oldBalance;

            await tx.supplier.update({
                where: { id: order.supplierId },
                data: {
                    totalShopping: { increment: finalReceivedAmount },
                    balance: newBalance,
                },
            });

            return order;
        });

        revalidatePath("/tedarikciler");
        revalidatePath("/stok");
        return { success: true, order: serializePrisma(result) };
    } catch (error) {
        console.error("Error receiving order:", error);
        return { success: false, error: "Stok girişi yapılamadı." };
    }
}

export async function deletePendingOrdersForSupplierAction(supplierId: string) {
    try {
        const shopId = await getShopId();

        // Find all pending or on-way orders for this supplier
        const pendingOrders = await prisma.purchaseOrder.findMany({
            where: {
                supplierId,
                shopId,
                status: { in: ["PENDING", "ON_WAY"] }
            },
            include: {
                transactions: true,
                items: true
            }
        });

        if (pendingOrders.length === 0) {
            return { success: true, message: "Silinecek bekleyen sipariş bulunamadı." };
        }

        // Delete them in a transaction
        await prisma.$transaction(async (tx) => {
            for (const order of pendingOrders) {
                // Check for transactions (payments)
                // If there are transactions, we might want to prevent deletion or handle them.
                // However, the request is to "sil" (delete) pending orders.
                // In deleteSupplier, it just deletes them.

                // 1. Delete PurchaseOrderItems (cascade delete is on PurchaseOrder.items in schema)
                // Actually, schema shows items: PurchaseOrderItem[] in PurchaseOrder
                // and order: PurchaseOrder in PurchaseOrderItem with onDelete: Cascade

                // 2. Delete SupplierTransactions related to these orders
                await tx.supplierTransaction.deleteMany({
                    where: { purchaseOrderId: order.id, shopId }
                });

                // 3. Delete the order itself
                await tx.purchaseOrder.delete({
                    where: { id: order.id, shopId }
                });
            }
        });

        revalidatePath("/tedarikciler");
        return { success: true, count: pendingOrders.length };
    } catch (error) {
        console.error("Delete pending orders error:", error);
        return { success: false, error: "Bekleyen siparişler silinemedi." };
    }
}

export async function deletePurchaseOrdersAction(orderIds: string[]) {
    try {
        const shopId = await getShopId();

        if (!orderIds || orderIds.length === 0) {
            return { success: false, error: "Silinecek sipariş seçilmedi." };
        }

        // Find orders to verify shopId
        const orders = await prisma.purchaseOrder.findMany({
            where: {
                id: { in: orderIds },
                shopId
            }
        });

        if (orders.length === 0) {
            return { success: false, error: "Sipariş bulunamadı." };
        }

        // Delete in a transaction
        await prisma.$transaction(async (tx) => {
            for (const order of orders) {
                // Delete SupplierTransactions related to these orders
                await tx.supplierTransaction.deleteMany({
                    where: { purchaseOrderId: order.id, shopId }
                });

                // Delete the order itself (cascade handles items)
                await tx.purchaseOrder.delete({
                    where: { id: order.id, shopId }
                });
            }
        });

        revalidatePath("/tedarikciler");
        return { success: true, count: orders.length };
    } catch (error) {
        console.error("Delete purchase orders error:", error);
        return { success: false, error: "Siparişler silinemedi." };
    }
}


