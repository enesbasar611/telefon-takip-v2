"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

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
    customerPhone?: string;
    paymentMethod: string;
    accountName?: string;
    description: string;
    items: { name: string; quantity: number; price?: number; productId?: string }[];
    status?: string;
    saleId?: string;
    debtId?: string;
    transactionType: 'INCOME' | 'EXPENSE';
}

export async function getUnifiedHistory(options: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    typeFilter?: string;
    dateRange?: 'TODAY' | 'ALL';
} = {}) {
    try {
        const shopId = await getShopId();
        const { page = 1, pageSize = 20, searchTerm = "", typeFilter = "ALL", dateRange = "ALL" } = options;
        const skip = (page - 1) * pageSize;

        // We use transactions as the primary source of truth for "Activities"
        // This includes Sales (via saleId), Direct Debts (via debtId), and Payments
        const where: Prisma.TransactionWhereInput = {
            shopId,
            OR: searchTerm ? [
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { sale: { saleNumber: { contains: searchTerm, mode: 'insensitive' } } },
                { customer: { phone: { contains: searchTerm, mode: 'insensitive' } } }
            ] : undefined
        };

        // Date filter
        if (dateRange === "TODAY") {
            const today = new Date();
            where.createdAt = {
                gte: startOfDay(today),
                lte: endOfDay(today)
            };
        }

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
                    financeAccount: true,
                    sale: {
                        include: {
                            items: { include: { product: true } }
                        }
                    },
                    debt: true
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
                price: Number(item.unitPrice),
                productId: item.productId
            })) || [];

            // If it's a debt and no items exist (direct debt), add description as a virtual item
            if (isDebt && operationItems.length === 0) {
                operationItems.push({
                    name: tx.description || "Veresiye Kaydı",
                    quantity: 1,
                    price: Number(tx.amount),
                    productId: undefined
                });
            }

            return {
                id: tx.id,
                type,
                number: tx.sale?.saleNumber || (isDebt ? `B-${tx.id.substring(0, 6)}` : `O-${tx.id.substring(0, 6)}`),
                date: tx.createdAt,
                amount: Number(tx.amount),
                currency: tx.currency,
                customerName: tx.customer?.name || "Perakende Müşteri",
                customerId: tx.customerId || undefined,
                customerPhone: tx.customer?.phone || undefined,
                paymentMethod: tx.paymentMethod,
                accountName: tx.financeAccount?.name,
                description: tx.description,
                items: operationItems,
                status: isSale ? "SATIŞ" : (isDebt ? "VERESİYE" : "TAHSİLAT"),
                saleId: tx.saleId || undefined,
                debtId: tx.debtId || undefined,
                transactionType: tx.type
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
