"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfDay, endOfDay } from "date-fns";
import { getShopId } from "@/lib/auth";

export async function getDebtDetails() {
    try {
        const shopId = await getShopId();
        const suppliers = await prisma.supplier.findMany({
            where: {
                shopId,
                balance: { gt: 0 }
            },
            include: {
                purchases: {
                    where: {
                        paymentStatus: { in: ["UNPAID", "PARTIAL"] },
                        remainingAmount: { gt: 0 }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        return serializePrisma(suppliers);
    } catch (error) {
        console.error("Error fetching debt details:", error);
        return [];
    }
}

export async function getCollectionDetails() {
    try {
        const shopId = await getShopId();
        const today = new Date();
        const transactions = await prisma.transaction.findMany({
            where: {
                shopId,
                type: "INCOME",
                createdAt: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                }
            },
            include: {
                sale: {
                    include: { customer: true }
                },
                financeAccount: true
            },
            orderBy: { createdAt: "desc" }
        });

        return serializePrisma(transactions);
    } catch (error) {
        console.error("Error fetching collection details:", error);
        return [];
    }
}

export async function getDailySalesDetails() {
    try {
        const shopId = await getShopId();
        const today = new Date();
        const sales = await prisma.sale.findMany({
            where: {
                shopId,
                createdAt: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                }
            },
            include: {
                customer: true,
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return serializePrisma(sales);
    } catch (error) {
        console.error("Error fetching daily sales details:", error);
        return [];
    }
}

export async function getRepairIncomeDetails() {
    try {
        const shopId = await getShopId();
        const today = new Date();
        const tickets = await prisma.serviceTicket.findMany({
            where: {
                shopId,
                status: "DELIVERED",
                deliveredAt: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                }
            },
            include: {
                customer: true,
                technician: true
            },
            orderBy: { deliveredAt: "desc" }
        });

        return serializePrisma(tickets);
    } catch (error) {
        console.error("Error fetching repair income details:", error);
        return [];
    }
}

export async function getPendingServicesDetails() {
    try {
        const shopId = await getShopId();
        const tickets = await prisma.serviceTicket.findMany({
            where: {
                shopId,
                status: {
                    in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"]
                }
            },
            include: {
                customer: true,
                technician: true
            },
            orderBy: { createdAt: "asc" }
        });

        return serializePrisma(tickets);
    } catch (error) {
        console.error("Error fetching pending services details:", error);
        return [];
    }
}

export async function getReadyDevicesDetails() {
    try {
        const shopId = await getShopId();
        const tickets = await prisma.serviceTicket.findMany({
            where: {
                shopId,
                status: "READY"
            },
            include: {
                customer: true,
                technician: true
            },
            orderBy: { updatedAt: "desc" }
        });

        return serializePrisma(tickets);
    } catch (error) {
        console.error("Error fetching ready devices details:", error);
        return [];
    }
}

export async function getCriticalStockDetails() {
    try {
        const shopId = await getShopId();
        const products = await prisma.product.findMany({
            where: { shopId },
            include: {
                category: true
            }
        });

        // Filter in JS to ensure cross-table compatibility
        const critical = products.filter(p => p.stock <= p.criticalStock);
        return serializePrisma(critical);
    } catch (error) {
        console.error("Error fetching critical stock details:", error);
        return [];
    }
}

export async function getAccountBalanceDetails() {
    try {
        const shopId = await getShopId();
        const accounts = await prisma.financeAccount.findMany({
            where: { shopId, isActive: true },
            orderBy: { name: 'asc' }
        });
        return serializePrisma(accounts);
    } catch (error) {
        console.error("Error fetching account balance details:", error);
        return [];
    }
}
