"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfDay, endOfDay } from "date-fns";

export async function getDebtDetails() {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: {
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
        const today = new Date();
        const transactions = await prisma.transaction.findMany({
            where: {
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
                account: true
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
        const today = new Date();
        const sales = await prisma.sale.findMany({
            where: {
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
        const today = new Date();
        const tickets = await prisma.serviceTicket.findMany({
            where: {
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
        const tickets = await prisma.serviceTicket.findMany({
            where: {
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
        const tickets = await prisma.serviceTicket.findMany({
            where: {
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
        const products = await prisma.product.findMany({
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
        const accounts = await prisma.account.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return serializePrisma(accounts);
    } catch (error) {
        console.error("Error fetching account balance details:", error);
        return [];
    }
}
