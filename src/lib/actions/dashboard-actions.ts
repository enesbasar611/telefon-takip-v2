"use server";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma, formatCurrency } from "@/lib/utils";
import { getDeadStockCount } from "./product-actions";
import { getOrCreateKasaAccount } from "./finance-actions";
import { getExchangeRates } from "./currency-actions";

export const getDashboardStats = async (shopId: string) => {
  return unstable_cache(
    async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const res = await Promise.all([
          prisma.serviceTicket.count({
            where: { shopId, status: { in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"] } }
          }),
          prisma.serviceTicket.count({ where: { shopId, status: "READY" } }),
          prisma.product.findMany({
            where: { shopId },
            select: {
              stock: true,
              criticalStock: true,
            }
          }),
          // Actual cash-basis sales (exclude DEBT)
          prisma.sale.aggregate({
            where: {
              shopId,
              createdAt: { gte: today },
              paymentMethod: { not: "DEBT" }
            },
            _sum: { finalAmount: true }
          }),
          prisma.serviceTicket.aggregate({
            where: { shopId, status: "DELIVERED", deliveredAt: { gte: today } },
            _sum: { actualCost: true }
          }),
          // Actual income (exclude DEBT transactions)
          prisma.transaction.aggregate({
            where: {
              shopId,
              type: "INCOME",
              createdAt: { gte: today },
              paymentMethod: { not: "DEBT" }
            },
            _sum: { amount: true }
          }),
          prisma.supplier.aggregate({ where: { shopId }, _sum: { balance: true } }),
          prisma.shortageItem.count({ where: { shopId, isResolved: false } }),
          getDeadStockCount(shopId),
          getOrCreateKasaAccount(shopId),
          prisma.product.count({ where: { shopId, deviceInfo: { isNot: null } } }),
        ]);

        const [
          pendingServicesValue,
          readyDevicesValue,
          productsList,
          todaySalesAggResult,
          todayRepairIncomeResult,
          todayTransactionsResult,
          totalDebtsResult,
          pendingProcurementCountValue,
          deadStockCountValue,
          kasaAccountObject,
          totalDevicesCountValue,
        ] = res;

        const lowStockCount = productsList.filter(p => p.stock <= p.criticalStock).length;
        const kasaBalance = Number(kasaAccountObject.balance) || 0;
        const todaySalesAmount = Number(todaySalesAggResult._sum.finalAmount) || 0;
        const collectedToday = Number(todayTransactionsResult._sum.amount) || 0;

        let kasaOpeningBalance = 0;
        try {
          const activeSession = await prisma.dailySession.findFirst({
            where: { shopId, status: "OPEN" },
            orderBy: { createdAt: "desc" }
          });
          kasaOpeningBalance = Number(activeSession?.openingBalance) || 0;
        } catch { /* ignore */ }

        return serializePrisma({
          todaySales: `₺${formatCurrency(todaySalesAmount)}`,
          todaySalesRaw: todaySalesAmount,
          kasaBalance: `₺${formatCurrency(kasaBalance)}`,
          kasaBalanceRaw: kasaBalance,
          kasaOpeningBalance: `₺${formatCurrency(kasaOpeningBalance)}`,
          kasaOpeningBalanceRaw: kasaOpeningBalance,
          todayRepairIncome: `₺${formatCurrency(Number(todayRepairIncomeResult._sum.actualCost) || 0)}`,
          collectedPayments: `₺${formatCurrency(collectedToday)}`,
          pendingServices: pendingServicesValue.toString(),
          readyDevices: readyDevicesValue.toString(),
          criticalStock: lowStockCount.toString(),
          totalDebts: `₺${formatCurrency(Number(totalDebtsResult._sum.balance) || 0)}`,
          cashBalance: `₺${formatCurrency(kasaBalance)}`,
          pendingProcurementCount: pendingProcurementCountValue.toString(),
          deadStockCount: deadStockCountValue.toString(),
          totalDevices: (totalDevicesCountValue || 0).toString(),
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return serializePrisma({
          todaySales: "₺0", todaySalesRaw: 0, kasaBalance: "₺0", kasaBalanceRaw: 0,
          kasaOpeningBalance: "₺0", kasaOpeningBalanceRaw: 0, todayRepairIncome: "₺0",
          collectedPayments: "₺0", pendingServices: "0", readyDevices: "0",
          criticalStock: "0", totalDebts: "₺0", cashBalance: "₺0",
          pendingProcurementCount: "0", deadStockCount: "0",
        });
      }
    },
    [`dashboard-stats-${shopId}`],
    { tags: [`dashboard-${shopId}`], revalidate: 10 } // Reduced to 10 seconds for real-time feel
  )();
};

export const getRecentSales = async (shopId: string, limit: number = 5) => {
  try {
    const tickets = await prisma.serviceTicket.findMany({
      where: { shopId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        technician: true
      }
    });
    return serializePrisma(tickets);
  } catch (error) {
    console.error("Error fetching recent tickets:", error);
    return [];
  }
}

export async function getRecentTransactions(shopId: string) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { shopId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        sale: {
          include: {
            customer: true
          }
        }
      }
    });
    return serializePrisma(transactions);
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}

export const getTopProducts = async (shopId: string, limit: number = 5) => {
  try {
    const products = await prisma.product.findMany({
      where: { shopId },
      take: limit,
      orderBy: { saleItems: { _count: 'desc' } },
      include: {
        category: true,
        _count: {
          select: { saleItems: true }
        }
      }
    });

    return serializePrisma(products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category.name,
      price: Number(p.sellPrice),
      sales: p._count.saleItems,
      stock: p.stock,
      criticalStock: p.criticalStock
    })));
  } catch (error) {
    console.error("Error fetching top products:", error);
    return [];
  }
}

export async function getDashboardInit(shopId: string) {
  const [stats, rates] = await Promise.all([
    getDashboardStats(shopId),
    getExchangeRates(shopId),
  ]);

  return { stats, rates };
}
