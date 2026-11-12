"use server";

import { cache } from "react";
import prisma from "@/lib/prisma";
import { auth, getShopId } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, eachDayOfInterval, format } from "date-fns";
import { tr } from "date-fns/locale";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { convertTransactionAmount, isTransactionCurrency } from "@/lib/finance/transaction-currency";
import { calculateServiceProfitAnalytics } from "@/lib/service/service-profit-analytics";

const NON_COST_SALE_KEYWORDS = [
  "servis",
  "tamir",
  "yazılım",
  "yazilim",
  "işçilik",
  "iscilik",
  "hizmet",
  "service",
  "repair",
  "software",
  "cihaz kârı",
  "cihaz kari",
];

function resolveSaleProductCost(product?: {
  name?: string | null;
  buyPrice?: unknown;
  category?: { name?: string | null } | null;
} | null): number {
  if (!product) return 0;
  const catName = (product.category?.name || "").toLocaleLowerCase("tr-TR");
  const prodName = (product.name || "").toLocaleLowerCase("tr-TR");
  const isNonInventoryCost = NON_COST_SALE_KEYWORDS.some(
    (kw) => catName.includes(kw) || prodName.includes(kw)
  );
  if (isNonInventoryCost) return 0;
  return Number(product.buyPrice || 0);
}

function getSaleRevenueTry(
  sale: {
    finalAmount: unknown;
    transaction?: { amount: unknown; currency: string | null } | null;
  },
  rates: Awaited<ReturnType<typeof getExchangeRates>>
): number {
  const tx = sale.transaction;
  const txCurrency = tx && isTransactionCurrency(tx.currency) ? tx.currency : "TRY";
  return tx
    ? convertTransactionAmount(Number(tx.amount || 0), txCurrency, rates).TRY
    : Number(sale.finalAmount || 0);
}

function sumTransactionsInTry(
  txs: Array<{ amount: unknown; currency: string | null }>,
  rates: Awaited<ReturnType<typeof getExchangeRates>>
): number {
  const total = txs.reduce((sum, tx) => {
    const cur = isTransactionCurrency(tx.currency) ? tx.currency : "TRY";
    return sum + convertTransactionAmount(Number(tx.amount || 0), cur, rates).TRY;
  }, 0);
  return Math.round(total * 100) / 100;
}

function calculateSalesGrossProfit(
  sales: Array<{
    finalAmount: unknown;
    transaction?: { amount: unknown; currency: string | null } | null;
    items: Array<{
      quantity: number;
      unitPrice: unknown;
      product?: {
        name?: string | null;
        buyPrice?: unknown;
        category?: { name?: string | null } | null;
      } | null;
    }>;
  }>,
  rates: Awaited<ReturnType<typeof getExchangeRates>>
): number {
  let totalProfit = 0;

  for (const sale of sales) {
    const realizedRevenue = getSaleRevenueTry(sale, rates);

    if (realizedRevenue <= 0) continue;

    if (sale.items.length === 0) {
      totalProfit += Math.max(0, realizedRevenue);
      continue;
    }

    const grossItemsTotal = sale.items.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * item.quantity,
      0
    );

    for (const item of sale.items) {
      const itemGross = Number(item.unitPrice || 0) * item.quantity;
      const itemRevenue =
        grossItemsTotal > 0
          ? realizedRevenue * (itemGross / grossItemsTotal)
          : realizedRevenue / sale.items.length;
      const unitCost = resolveSaleProductCost(item.product);
      const itemCost = unitCost * item.quantity;
      totalProfit += Math.max(0, itemRevenue - itemCost);
    }
  }

  return Math.round(totalProfit * 100) / 100;
}

const loadDashboardStatsForShop = cache(async (shopId: string) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayDate = subDays(now, 1);
  const yesterdayStart = startOfDay(yesterdayDate);
  const yesterdayEnd = endOfDay(yesterdayDate);
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = startOfDay(subDays(now, 29));
  const ninetyDaysAgo = startOfDay(subDays(now, 90));

  // Batch 1: Core aggregates & lightweight counts (stays well within Neon pooler limit)
  const [
    totalSalesData,
    todaySalesData,
    pendingServices,
    totalDebtData,
    products,
    cashAccounts,
    serviceIncomeTxs,
    collectionsTxs,
    readyTickets,
    cancelledTickets,
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
    // Fetch products for low stock & dead stock analysis
    prisma.product.findMany({
      where: { shopId },
      select: { id: true, stock: true, criticalStock: true }
    }),
    // Total Cash Balance (Sum of all CASH type accounts)
    prisma.financeAccount.findMany({
      where: { shopId, type: "CASH", isActive: true },
      select: { balance: true }
    }),
    // Service Income (today) - normalized currency & excluding uncollected DEBT
    prisma.transaction.findMany({
      where: {
        shopId,
        type: "INCOME",
        paymentMethod: { not: "DEBT" },
        createdAt: { gte: todayStart, lte: todayEnd },
        category: { in: ["Teknik Servis", "Servis", "SERVICE", "Tamir"] }
      },
      select: { amount: true, currency: true }
    }),
    // Collections (today) - Actual cash/bank/POS inflows excluding uncollected DEBT
    prisma.transaction.findMany({
      where: {
        shopId,
        type: "INCOME",
        paymentMethod: { not: "DEBT" },
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      select: { amount: true, currency: true }
    }),
    // Ready tickets
    prisma.serviceTicket.count({ where: { shopId, status: "READY" } }),
    // Cancelled tickets
    prisma.serviceTicket.count({ where: { shopId, status: "CANCELLED" } }),
  ]);

  // Batch 2: Secondary analytics & trend queries
  const [
    monthSalesForProfit,
    monthDeliveredServices,
    profitRates,
    yesterdayServiceIncomeTxs,
    pendingProcurementCount,
    active90dSaleProducts,
    last30dSalesAgg,
    overdueServicesCount,
    bankPosAccounts,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: monthStart, lte: endOfDay(new Date()) }, finalAmount: { gt: 0 } },
      select: {
        finalAmount: true,
        transaction: { select: { amount: true, currency: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                name: true,
                buyPrice: true,
                category: { select: { name: true } }
              }
            }
          }
        }
      }
    }),
    prisma.serviceTicket.findMany({
      where: { shopId, status: "DELIVERED", deliveredAt: { gte: monthStart, lte: endOfDay(new Date()) } },
      select: {
        estimatedCost: true,
        actualCost: true,
        overhead: true,
        usedParts: { select: { quantity: true, unitPrice: true, costPrice: true } }
      }
    }),
    getExchangeRates(shopId),
    // Service Income (yesterday) - normalized currency & excluding DEBT
    prisma.transaction.findMany({
      where: {
        shopId,
        type: "INCOME",
        paymentMethod: { not: "DEBT" },
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        category: { in: ["Teknik Servis", "Servis", "SERVICE", "Tamir"] }
      },
      select: { amount: true, currency: true }
    }),
    prisma.shortageItem.count({
      where: { shopId, isResolved: false }
    }),
    prisma.saleItem.findMany({
      where: { shopId, sale: { createdAt: { gte: ninetyDaysAgo } } },
      select: { productId: true },
      distinct: ["productId"]
    }),
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: thirtyDaysAgo, lte: yesterdayEnd } },
      _sum: { finalAmount: true }
    }),
    prisma.serviceTicket.count({
      where: {
        shopId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
        estimatedDeliveryDate: { lt: now }
      }
    }),
    prisma.financeAccount.findMany({
      where: { shopId, type: { in: ["BANK", "POS"] }, isActive: true },
      select: { balance: true }
    }),
  ]);

  const todayRepairIncome = sumTransactionsInTry(serviceIncomeTxs, profitRates);
  const collectedPaymentsTotal = sumTransactionsInTry(collectionsTxs, profitRates);
  const monthlySalesProfit = calculateSalesGrossProfit(monthSalesForProfit, profitRates);
  const monthlyServiceProfit = calculateServiceProfitAnalytics(monthDeliveredServices).netProfit;
  const monthlyProfit = Math.round((monthlySalesProfit + monthlyServiceProfit) * 100) / 100;
  const totalYesterdayIncome = sumTransactionsInTry(yesterdayServiceIncomeTxs, profitRates);

  const todaySalesAmount = Number(todaySalesData?._sum?.finalAmount || 0);
  const past29Total = Number(last30dSalesAgg?._sum?.finalAmount || 0);
  const avgDailySales = past29Total > 0 ? past29Total / 29 : 0;
  const salesTrendPercent = avgDailySales > 0
    ? Math.round(((todaySalesAmount - avgDailySales) / avgDailySales) * 100)
    : null;

  // Calculate percentage change
  let repairIncomeChange = 0;
  if (totalYesterdayIncome > 0) {
    repairIncomeChange = ((todayRepairIncome - totalYesterdayIncome) / totalYesterdayIncome) * 100;
  } else if (todayRepairIncome > 0) {
    repairIncomeChange = 100; // From 0 to something
  }

  const lowStockProducts = products.filter(p => p.stock <= p.criticalStock).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const active90dIds = new Set(active90dSaleProducts.map(item => item.productId));
  const deadStockCount = products.filter(p => p.stock > 0 && !active90dIds.has(p.id)).length;
  const cashBalance = cashAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const bankPosBalance = bankPosAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return serializePrisma({
    totalSales: Number(totalSalesData?._sum?.finalAmount || 0),
    todaySales: todaySalesAmount,
    kasaBalance: cashBalance,
    bankPosBalance,
    todayRepairIncome: todayRepairIncome,
    repairIncomeChange: Number(repairIncomeChange.toFixed(1)),
    collectedPayments: collectedPaymentsTotal,
    pendingServices,
    overdueServicesCount,
    totalDebts: Number(totalDebtData?._sum?.remainingAmount || 0),
    criticalStock: lowStockProducts,
    outOfStockCount,
    pendingProcurementCount,
    deadStockCount,
    salesTrendPercent,
    readyDevices: readyTickets,
    monthlyProfit,
    monthlySalesProfit,
    monthlyServiceProfit,
    issueDevices: cancelledTickets
  });
});

export async function getDashboardStats(shopIdParam?: string) {
  const shopId = shopIdParam || await getShopId();
  if (!shopId) return null;
  return loadDashboardStatsForShop(shopId);
}

/**
 * Dashboard Provider için gerekli başlangıç verilerini getirir
 */
export async function getDashboardInit(shopIdParam?: string) {
  const shopId = shopIdParam || await getShopId();
  if (!shopId) return { rates: null, stats: {}, settings: [], tenant: null };

  const [stats, settings, shop] = await Promise.all([
    getDashboardStats(shopId),
    prisma.setting.findMany({ where: { shopId } }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        industry: true,
        enabledModules: true,
        isCourierEnabled: true,
        isEInvoiceEnabled: true,
        isFinanceEnabled: true,
        isServiceEnabled: true,
        isStockEnabled: true,
      }
    })
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
    stats.monthlyProfitUSD = Number(((stats.monthlyProfit || 0) / usdRate).toFixed(2));
    stats.bankPosBalanceUSD = Number(((stats.bankPosBalance || 0) / usdRate).toFixed(2));
  }

  return serializePrisma({
    stats,
    settings: settings.map(s => ({ key: s.key, value: s.value })),
    rates,
    tenant: shop || null
  });
}

/**
 * Hızlı istatistikler (Widget'lar için)
 */
export async function getDashboardQuickStats() {
  return getDashboardStats();
}

/**
 * Son işlemleri getirir (ürün kalemleri, kasa, müşteri, veresiye detayı dahil)
 */
export async function getRecentTransactions(shopIdIn?: string, take = 30) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return [];

  const transactions = await prisma.transaction.findMany({
    where: { shopId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      supplier: { select: { id: true, name: true } },
      financeAccount: { select: { id: true, name: true, type: true, currency: true } },
      user: { select: { id: true, name: true } },
      debt: { select: { id: true, remainingAmount: true, currency: true, isPaid: true, description: true } },
      sale: {
        select: {
          id: true,
          saleNumber: true,
          totalAmount: true,
          discount: true,
          finalAmount: true,
          paymentMethod: true,
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  category: { select: { name: true } }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take
  });

  return serializePrisma(transactions);
}

/**
 * Finansal özeti getirir (Bugün vs Dün — Çoklu para birimi & veresiye ayrımlı)
 */
export async function getDashboardFinancialSummary(shopIdIn?: string) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayRef = subDays(now, 1);
  const yesterdayStart = startOfDay(yesterdayRef);
  const yesterdayEnd = endOfDay(yesterdayRef);

  const [rates, todayTxs, yesterdayTxs] = await Promise.all([
    getExchangeRates(shopId),
    prisma.transaction.findMany({
      where: { shopId, createdAt: { gte: todayStart } },
      select: { type: true, amount: true, currency: true, paymentMethod: true }
    }),
    prisma.transaction.findMany({
      where: { shopId, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      select: { type: true, amount: true, currency: true, paymentMethod: true }
    })
  ]);

  const splitSummary = (txs: typeof todayTxs) => ({
    income: sumTransactionsInTry(
      txs.filter((t) => t.type === "INCOME" && t.paymentMethod !== "DEBT"),
      rates
    ),
    debtIncome: sumTransactionsInTry(
      txs.filter((t) => t.type === "INCOME" && t.paymentMethod === "DEBT"),
      rates
    ),
    expense: sumTransactionsInTry(
      txs.filter((t) => t.type === "EXPENSE"),
      rates
    )
  });

  return {
    today: splitSummary(todayTxs),
    yesterday: splitSummary(yesterdayTxs),
    currency: "TRY"
  };
}

/**
 * Son satışları/servisleri getirir (İsim uyumluluğu için)
 */
export async function getRecentSales(shopIdIn?: string, take = 6, activeOnly = true) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return [];

  // ServiceQueueStream queries active ServiceTickets ordered by priority & recency
  const tickets = await prisma.serviceTicket.findMany({
    where: {
      shopId,
      ...(activeOnly ? { status: { in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART", "READY"] } } : {})
    },
    include: {
      customer: { select: { name: true, phone: true } },
      technician: { select: { name: true } }
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take
  });

  return serializePrisma(tickets);
}

export type TopProductsPeriod = "TODAY" | "WEEK" | "MONTH" | "ALL";

/**
 * En çok satılan ürünleri getirir
 */
export async function getTopProducts(
  shopIdIn?: string,
  limit = 8,
  period: TopProductsPeriod = "MONTH"
) {
  const shopId = shopIdIn || await getShopId();
  if (!shopId) return [];

  const now = new Date();
  let periodStart: Date | null = null;
  if (period === "TODAY") periodStart = startOfDay(now);
  else if (period === "WEEK") periodStart = startOfDay(subDays(now, 6));
  else if (period === "MONTH") periodStart = startOfMonth(now);

  const saleFilter = periodStart ? { sale: { createdAt: { gte: periodStart } } } : {};

  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { shopId, ...saleFilter },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit
  });

  if (topProducts.length === 0) return [];

  const productIds = topProducts.map((tp) => tp.productId);
  const [productRecords, saleItemsForRevenue] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true }
    }),
    prisma.saleItem.findMany({
      where: { shopId, productId: { in: productIds }, ...saleFilter },
      select: { productId: true, quantity: true, unitPrice: true }
    })
  ]);

  const productById = new Map(productRecords.map((p) => [p.id, p]));
  const revenueByProduct = new Map<string, number>();
  for (const item of saleItemsForRevenue) {
    revenueByProduct.set(
      item.productId,
      (revenueByProduct.get(item.productId) || 0) + Number(item.unitPrice || 0) * item.quantity
    );
  }

  const products = topProducts
    .map((tp) => {
      const product = productById.get(tp.productId);
      if (!product) return null;
      return {
        ...product,
        price: Number(product.sellPrice || 0),
        sales: tp._sum.quantity || 0,
        totalSold: tp._sum.quantity || 0,
        totalRevenue: Math.round((revenueByProduct.get(tp.productId) || 0) * 100) / 100,
        category: product.category?.name || "Kategorisiz"
      };
    })
    .filter(Boolean);

  return serializePrisma(products);
}

export type DashboardRevenueRange = "7D" | "THIS_MONTH" | "LAST_MONTH";

/**
 * Gelir Analizi widget'ı için POS satış + Servis gelir ve net kâr verisi (uyumlu dönem & kapsam)
 */
export async function getDashboardRevenueAnalysis(range: DashboardRevenueRange = "THIS_MONTH") {
  const shopId = await getShopId(false);
  if (!shopId) {
    return {
      salesTrend: [],
      salesRevenue: 0,
      serviceRevenue: 0,
      totalRevenue: 0,
      salesProfit: 0,
      serviceProfit: 0,
      totalNetProfit: 0
    };
  }

  const now = new Date();
  let startDate = startOfMonth(now);
  let endDate = endOfDay(now);

  if (range === "7D") {
    startDate = startOfDay(subDays(now, 6));
  } else if (range === "LAST_MONTH") {
    const prev = subMonths(now, 1);
    startDate = startOfMonth(prev);
    endDate = endOfMonth(prev);
  }

  const [sales, deliveredServices, rates] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: startDate, lte: endDate }, finalAmount: { gt: 0 } },
      select: {
        createdAt: true,
        finalAmount: true,
        transaction: { select: { amount: true, currency: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                name: true,
                buyPrice: true,
                category: { select: { name: true } }
              }
            }
          }
        }
      }
    }),
    prisma.serviceTicket.findMany({
      where: { shopId, status: "DELIVERED", deliveredAt: { gte: startDate, lte: endDate } },
      select: {
        deliveredAt: true,
        estimatedCost: true,
        actualCost: true,
        overhead: true,
        usedParts: { select: { quantity: true, unitPrice: true, costPrice: true } }
      }
    }),
    getExchangeRates(shopId)
  ]);

  let salesRevenue = 0;
  const salesByDay = new Map<string, number>();
  for (const sale of sales) {
    const rev = getSaleRevenueTry(sale, rates);
    salesRevenue += rev;
    const key = format(new Date(sale.createdAt), "yyyy-MM-dd");
    salesByDay.set(key, (salesByDay.get(key) || 0) + rev);
  }

  const servicesByDay = new Map<string, typeof deliveredServices>();
  for (const ticket of deliveredServices) {
    if (!ticket.deliveredAt) continue;
    const key = format(new Date(ticket.deliveredAt), "yyyy-MM-dd");
    const list = servicesByDay.get(key) || [];
    list.push(ticket);
    servicesByDay.set(key, list);
  }

  const salesProfit = calculateSalesGrossProfit(sales, rates);
  const serviceAnalytics = calculateServiceProfitAnalytics(deliveredServices);
  const serviceRevenue = serviceAnalytics.grossRevenue;
  const serviceProfit = serviceAnalytics.netProfit;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const salesTrend = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const daySales = Math.round((salesByDay.get(key) || 0) * 100) / 100;
    const dayServiceTickets = servicesByDay.get(key) || [];
    const dayService = dayServiceTickets.length > 0
      ? calculateServiceProfitAnalytics(dayServiceTickets).grossRevenue
      : 0;
    return {
      date: format(day, "dd MMM", { locale: tr }),
      sales: daySales,
      service: dayService,
      total: Math.round((daySales + dayService) * 100) / 100
    };
  });

  return serializePrisma({
    salesTrend,
    salesRevenue: Math.round(salesRevenue * 100) / 100,
    serviceRevenue: Math.round(serviceRevenue * 100) / 100,
    totalRevenue: Math.round((salesRevenue + serviceRevenue) * 100) / 100,
    salesProfit: Math.round(salesProfit * 100) / 100,
    serviceProfit: Math.round(serviceProfit * 100) / 100,
    totalNetProfit: Math.round((salesProfit + serviceProfit) * 100) / 100
  });
}
