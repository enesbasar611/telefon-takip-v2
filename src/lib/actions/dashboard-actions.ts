"use server";

import prisma from "@/lib/prisma";
import { auth, getShopId } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { getExchangeRates } from "@/lib/actions/currency-actions";

export async function getDashboardStats() {
  const shopId = await getShopId();
  if (!shopId) return null;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const yesterdayStart = startOfDay(new Date(new Date().setDate(new Date().getDate() - 1)));
  const yesterdayEnd = endOfDay(new Date(new Date().setDate(new Date().getDate() - 1)));
  const monthStart = startOfMonth(new Date());

  const [
    totalSalesData,
    todaySalesData,
    pendingServices,
    totalDebtData,
    products,
    cashAccounts,
    serviceIncomeData,
    collectionsData,
    readyTickets,
    cancelledTickets,
    yesterdayServiceIncomeData
  ] = await Promise.all([
    // Total Sales this month
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: monthStart } },
      _sum: { finalAmount: true }
    }),
    // Today's Sales
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: todayStart } },
      _sum: { finalAmount: true }
    }),
    // Pending services count
    prisma.serviceTicket.count({
      where: { shopId, status: { in: ["PENDING", "REPAIRING", "WAITING_PART", "APPROVED"] } }
    }),
    // Total Debt (Remaining amount from debt table)
    prisma.debt.aggregate({
      where: { shopId, remainingAmount: { gt: 0 } },
      _sum: { remainingAmount: true }
    }),
    // Fetch products for low stock
    prisma.product.findMany({
      where: { shopId },
      select: { stock: true, criticalStock: true }
    }),
    // Total Cash Balance (Sum of all CASH type accounts)
    prisma.financeAccount.findMany({
      where: { shopId, type: "CASH", isActive: true },
      select: { balance: true }
    }),
    // Service Income (today)
    prisma.transaction.aggregate({
      where: {
        shopId,
        type: "INCOME",
        createdAt: { gte: todayStart, lte: todayEnd },
        category: { in: ["Teknik Servis", "Servis", "SERVICE", "Tamir"] }
      },
      _sum: { amount: true }
    }),
    // Collections (today) - All income transactions today
    prisma.transaction.aggregate({
      where: {
        shopId,
        type: "INCOME",
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      _sum: { amount: true }
    }),
    // Ready tickets
    prisma.serviceTicket.count({ where: { shopId, status: "READY" } }),
    // Cancelled tickets
    prisma.serviceTicket.count({ where: { shopId, status: "CANCELLED" } }),
    // Service Income (yesterday)
    prisma.transaction.aggregate({
      where: {
        shopId,
        type: "INCOME",
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        category: { in: ["Teknik Servis", "Servis", "SERVICE", "Tamir"] }
      },
      _sum: { amount: true }
    }),
  ]);

  const todayRepairIncome = Number(serviceIncomeData?._sum?.amount || 0);
  const totalYesterdayIncome = Number(yesterdayServiceIncomeData?._sum?.amount || 0);

  // Calculate percentage change
  let repairIncomeChange = 0;
  if (totalYesterdayIncome > 0) {
    repairIncomeChange = ((todayRepairIncome - totalYesterdayIncome) / totalYesterdayIncome) * 100;
  } else if (todayRepairIncome > 0) {
    repairIncomeChange = 100; // From 0 to something
  }

  const lowStockProducts = products.filter(p => p.stock <= p.criticalStock).length;
  const cashBalance = cashAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return serializePrisma({
    totalSales: Number(totalSalesData?._sum?.finalAmount || 0),
    todaySales: Number(todaySalesData?._sum?.finalAmount || 0),
    kasaBalance: cashBalance,
    todayRepairIncome: todayRepairIncome,
    repairIncomeChange: Number(repairIncomeChange.toFixed(1)),
    collectedPayments: Number(collectionsData?._sum?.amount || 0),
    pendingServices,
    totalDebts: Number(totalDebtData?._sum?.remainingAmount || 0),
    criticalStock: lowStockProducts,
    readyDevices: readyTickets,
    issueDevices: cancelledTickets
  });
}

/**
 * Dashboard Provider için gerekli başlangıç verilerini getirir
 */
export async function getDashboardInit(shopIdParam?: string) {
  const shopId = shopIdParam || await getShopId();
  if (!shopId) return { rates: null, stats: {}, settings: [] };

  const [stats, settings] = await Promise.all([
    getDashboardStats(),
    prisma.setting.findMany({ where: { shopId } })
  ]);

  const rates = await getExchangeRates(shopId);
  const usdRate = rates?.usd || 34;

  // Add calculated USD values to stats for consistent usage in wrappers
  if (stats) {
    stats.kasaBalanceUSD = Number((stats.kasaBalance / usdRate).toFixed(2));
    stats.todaySalesUSD = Number((stats.todaySales / usdRate).toFixed(2));
    stats.todayRepairIncomeUSD = Number((stats.todayRepairIncome / usdRate).toFixed(2));
    stats.collectedPaymentsUSD = Number((stats.collectedPayments / usdRate).toFixed(2));
    stats.totalDebtsUSD = Number((stats.totalDebts / usdRate).toFixed(2));
  }

  return serializePrisma({
    stats,
    settings: settings.map(s => ({ key: s.key, value: s.value })),
    rates
  });
}

/**
 * Hızlı istatistikler (Widget'lar için)
 */
export async function getDashboardQuickStats() {
  return getDashboardStats();
}

/**
 * Son işlemleri getirir
 */
export async function getRecentTransactions(shopIdIn?: string, take = 10) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return [];

  const transactions = await prisma.transaction.findMany({
    where: { shopId },
    include: {
      customer: { select: { name: true } },
      sale: { include: { customer: { select: { name: true } } } }
    },
    orderBy: { createdAt: "desc" },
    take
  });

  return serializePrisma(transactions);
}

/**
 * Finansal özeti getirir (Bugün vs Dün)
 */
export async function getDashboardFinancialSummary(shopIdIn?: string) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(new Date(now.setDate(now.getDate() - 1)));
  const yesterdayEnd = endOfDay(yesterdayStart);

  const [todayIncome, todayExpense, yesterdayIncome, yesterdayExpense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { shopId, type: "INCOME", createdAt: { gte: todayStart } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { shopId, type: "EXPENSE", createdAt: { gte: todayStart } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { shopId, type: "INCOME", createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { shopId, type: "EXPENSE", createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      _sum: { amount: true }
    })
  ]);

  return {
    today: {
      income: Number(todayIncome._sum.amount || 0),
      expense: Number(todayExpense._sum.amount || 0)
    },
    yesterday: {
      income: Number(yesterdayIncome._sum.amount || 0),
      expense: Number(yesterdayExpense._sum.amount || 0)
    },
    currency: "TRY" // Default
  };
}

/**
 * Son satışları/servisleri getirir (İsim uyumluluğu için)
 */
export async function getRecentSales(shopIdIn?: string, take = 5) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return [];

  // ServiceQueueStream actually wants ServiceTickets based on typical usage
  const tickets = await prisma.serviceTicket.findMany({
    where: { shopId },
    include: {
      customer: { select: { name: true } },
      technician: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take
  });

  return serializePrisma(tickets);
}

/**
 * En çok satılan ürünleri getirir
 */
export async function getTopProducts(shopIdIn?: string, limit = 5) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return [];

  const topProducts = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: { shopId },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit
  });

  const products = await Promise.all(
    topProducts.map(async (tp) => {
      const product = await prisma.product.findUnique({
        where: { id: tp.productId },
        include: { category: true }
      });
      return {
        ...product,
        totalSold: tp._sum.quantity
      };
    })
  );

  return serializePrisma(products);
}
