"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export type OperationType = 'SALE' | 'DEBT_DIRECT' | 'PAYMENT';

export interface UnifiedOperation {
    id: string;
    type: OperationType;
    number: string;
    date: Date;
    amount: number;
    currency: string;
    customerName: string;
    customerId?: string;
    paymentMethod: string;
    description: string;
    items: { name: string; quantity: number; price?: number }[];
    status?: string;
}

export async function getUnifiedHistory(options: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    typeFilter?: string;
} = {}) {
    try {
        const shopId = await getShopId();
        const { page = 1, pageSize = 20, searchTerm = "", typeFilter = "ALL" } = options;
        const skip = (page - 1) * pageSize;

        // We use transactions as the primary source of truth for "Activities"
        // This includes Sales (via saleId), Direct Debts (via debtId), and Payments
        const where: Prisma.TransactionWhereInput = {
            shopId,
            OR: searchTerm ? [
                { description: { contains: searchTerm } },
                { customer: { name: { contains: searchTerm } } },
                { sale: { saleNumber: { contains: searchTerm } } },
                { customer: { phone: { contains: searchTerm } } }
            ] : undefined
        };

        // Filter by type if needed
        if (typeFilter !== "ALL") {
            if (typeFilter === "SALE") where.saleId = { not: null };
            else if (typeFilter === "DEBT") where.debtId = { not: null };
            else if (typeFilter === "PAYMENT") where.category = "Tahsilat";
        }

        const [total, transactions] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.findMany({
                where,
                include: {
                    customer: true,
                    sale: {
                        include: {
                            items: { include: { product: true } }
                        }
                    },
                    debt: {
                        include: {
                            // Direct debts items are tracked via inventory movements where notes link back
                            // But for simplicity in the feed, we can rely on the description or 
                            // join movements if we want product names.
                            // However, our new Transactions already have a good description.
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize
            })
        ]);

        // Map to unified structure
        const items: UnifiedOperation[] = transactions.map((tx: any) => {
            const isSale = !!tx.saleId;
            const isDebt = !!tx.debtId;
            const isPayment = tx.category === "Tahsilat";

            let type: OperationType = 'SALE';
            if (isDebt) type = 'DEBT_DIRECT';
            if (isPayment) type = 'PAYMENT';

            const operationItems = tx.sale?.items.map((item: any) => ({
                name: item.product?.name || "Bilinmeyen Ürün",
                quantity: item.quantity,
                price: Number(item.price)
            })) || [];

            return {
                id: tx.id,
                type,
                number: tx.sale?.saleNumber || (isDebt ? `B-${tx.id.substring(0, 6)}` : `O-${tx.id.substring(0, 6)}`),
                date: tx.createdAt,
                amount: Number(tx.amount),
                currency: tx.currency,
                customerName: tx.customer?.name || "Perakende Müşteri",
                customerId: tx.customerId || undefined,
                paymentMethod: tx.paymentMethod,
                description: tx.description,
                items: operationItems,
                status: isSale ? "SATIŞ" : (isDebt ? "VERESİYE" : "TAHSİLAT")
            };
        });

        return {
            items: serializePrisma(items),
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: page
        };
    } catch (error) {
        console.error("Unified history error:", error);
        return { items: [], total: 0, totalPages: 0, currentPage: 1 };
    }
}
