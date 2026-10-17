"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";
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
                customer: true,
                supplier: true,
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
        const transactions = await prisma.transaction.findMany({
            where: {
                shopId,
                type: "INCOME",
                paymentMethod: { not: "DEBT" },
                createdAt: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                }
            },
            include: {
                customer: true,
                sale: {
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return serializePrisma(transactions);
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

export async function getCashBalanceMonthlyDetails(params?: { year?: number; month?: number }) {
    try {
        const shopId = await getShopId();
        if (!shopId) return null;

        const now = new Date();
        const year = typeof params?.year === "number" ? params.year : now.getFullYear();
        const month = typeof params?.month === "number" ? params.month : now.getMonth(); // 0-indexed

        const monthStart = startOfMonth(new Date(year, month, 1));
        const monthEnd = endOfMonth(new Date(year, month, 1));

        // 1. CASH Accounts
        const cashAccounts = await prisma.financeAccount.findMany({
            where: { shopId, type: "CASH", isActive: true },
            select: { id: true, name: true, balance: true, currency: true }
        });
        const cashAccountIds = cashAccounts.map(a => a.id);
        const currentCashBalance = cashAccounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

        // Kasa işlem filtresi:
        // financeAccountId bu hesaplardan biri olan veya type: "CASH" olan hesaplara bağlı veya paymentMethod === "CASH"
        const cashCondition: any = {
            shopId,
            OR: [
                ...(cashAccountIds.length > 0 ? [{ financeAccountId: { in: cashAccountIds } }] : []),
                { financeAccount: { type: "CASH" } },
                { AND: [{ financeAccountId: null }, { paymentMethod: "CASH" }] }
            ]
        };

        // 2. Son 20 Kasa Kaydı
        const last20Transactions = await prisma.transaction.findMany({
            where: cashCondition,
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                supplier: { select: { id: true, name: true, phone: true } },
                user: { select: { id: true, name: true } },
                financeAccount: { select: { id: true, name: true, type: true } },
                sale: {
                    select: {
                        id: true,
                        saleNumber: true,
                        totalAmount: true,
                        finalAmount: true,
                        items: {
                            select: {
                                id: true,
                                quantity: true,
                                unitPrice: true,
                                totalPrice: true,
                                product: { select: { id: true, name: true, sku: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        // 3. Seçili Ayın Başından Beri Kasaya Giren ve Çıkan Para
        const [monthInflowAgg, monthOutflowAgg] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    ...cashCondition,
                    type: "INCOME",
                    createdAt: { gte: monthStart, lte: monthEnd }
                },
                _sum: { amount: true },
                _count: { _all: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    ...cashCondition,
                    type: "EXPENSE",
                    createdAt: { gte: monthStart, lte: monthEnd }
                },
                _sum: { amount: true },
                _count: { _all: true }
            })
        ]);

        const monthInflow = Number(monthInflowAgg._sum.amount || 0);
        const monthOutflow = Number(monthOutflowAgg._sum.amount || 0);
        const monthInflowCount = monthInflowAgg._count._all;
        const monthOutflowCount = monthOutflowAgg._count._all;

        // 4. Ay Başındaki Kasa Bakiyesi Hesabı:
        // Ay başındaki bakiye = Güncel Bakiye - (monthStart'tan günümüze kadar girenler) + (monthStart'tan günümüze kadar çıkanlar)
        const [postStartInflowAgg, postStartOutflowAgg] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    ...cashCondition,
                    type: "INCOME",
                    createdAt: { gte: monthStart }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    ...cashCondition,
                    type: "EXPENSE",
                    createdAt: { gte: monthStart }
                },
                _sum: { amount: true }
            })
        ]);

        const postInflows = Number(postStartInflowAgg._sum.amount || 0);
        const postOutflows = Number(postStartOutflowAgg._sum.amount || 0);
        const openingBalance = currentCashBalance - postInflows + postOutflows;

        // 5. Son 20 Kaydın Giriş ve Çıkış Ayrımları & Toplamları
        const last20Inflows = last20Transactions.filter(t => t.type === "INCOME");
        const last20Outflows = last20Transactions.filter(t => t.type === "EXPENSE");
        const last20InflowTotal = last20Inflows.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const last20OutflowTotal = last20Outflows.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return serializePrisma({
            year,
            month,
            monthLabel: format(monthStart, "MMMM yyyy", { locale: tr }),
            currentCashBalance,
            openingBalance,
            monthInflow,
            monthOutflow,
            monthInflowCount,
            monthOutflowCount,
            netMonthCashflow: monthInflow - monthOutflow,
            cashAccounts,
            last20Transactions,
            last20Inflows,
            last20Outflows,
            last20InflowTotal,
            last20OutflowTotal,
            last20Net: last20InflowTotal - last20OutflowTotal
        });
    } catch (error) {
        console.error("Error in getCashBalanceMonthlyDetails:", error);
        return null;
    }
}

