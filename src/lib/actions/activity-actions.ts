"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { addDays, differenceInCalendarDays, eachDayOfInterval, endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { convertTransactionAmount, type TransactionCurrency } from "@/lib/finance/transaction-currency";

export type OperationType = "SALE" | "DEBT_DIRECT" | "PAYMENT";
export type HistoryDateRange = "TODAY" | "THIS_MONTH" | "LAST_MONTH" | "TWO_MONTHS_AGO" | "ALL";

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
    items: { name: string; quantity: number; price?: number; productId?: string; saleId?: string; debtId?: string }[];
    status?: string;
    saleId?: string;
    debtId?: string;
    transactionType: "INCOME" | "EXPENSE";
}

export async function getUnifiedHistory(options: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    typeFilter?: string;
    dateRange?: HistoryDateRange;
    startDate?: string | Date;
    endDate?: string | Date;
} = {}) {
    try {
        const shopId = await getShopId();
        const { page = 1, pageSize = 20, searchTerm = "", typeFilter = "ALL", dateRange = "ALL", startDate, endDate } = options;
        const skip = (page - 1) * pageSize;

        const where: Prisma.TransactionWhereInput = {
            shopId,
            OR: searchTerm ? [
                { description: { contains: searchTerm, mode: "insensitive" } },
                { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
                { sale: { saleNumber: { contains: searchTerm, mode: "insensitive" } } },
                { customer: { phone: { contains: searchTerm, mode: "insensitive" } } },
            ] : undefined,
        };

        const now = new Date();
        if (startDate && endDate) {
            where.createdAt = {
                gte: startOfDay(new Date(startDate)),
                lte: endOfDay(new Date(endDate)),
            };
        } else if (dateRange === "TODAY") {
            where.createdAt = { gte: startOfDay(now), lte: endOfDay(now) };
        } else if (dateRange === "THIS_MONTH") {
            where.createdAt = { gte: startOfMonth(now), lte: endOfMonth(now) };
        } else if (dateRange === "LAST_MONTH") {
            const target = subMonths(now, 1);
            where.createdAt = { gte: startOfMonth(target), lte: endOfMonth(target) };
        } else if (dateRange === "TWO_MONTHS_AGO") {
            const target = subMonths(now, 2);
            where.createdAt = { gte: startOfMonth(target), lte: endOfMonth(target) };
        }

        if (typeFilter !== "ALL") {
            if (typeFilter === "SALE") where.saleId = { not: null };
            else if (typeFilter === "DEBT") {
                where.debtId = { not: null };
                where.NOT = { category: "Tahsilat" };
            } else if (typeFilter === "PAYMENT") where.category = "Tahsilat";
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
                            items: { include: { product: true } },
                        },
                    },
                    debt: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
        ]);

        const items: UnifiedOperation[] = transactions
            .filter((tx: any) => {
                if (tx.saleId && tx.sale && (!tx.sale.items || tx.sale.items.length === 0)) {
                    return false;
                }
                return true;
            })
            .map((tx: any) => {
            const isSale = !!tx.saleId;
            const isDebt = !!tx.debtId;
            const isPayment = tx.category === "Tahsilat";

            let type: OperationType = "SALE";
            if (isDebt) type = "DEBT_DIRECT";
            if (isPayment) type = "PAYMENT";

            const operationItems = tx.sale?.items.map((item: any) => ({
                name: item.product?.name || "Bilinmeyen Ürün",
                quantity: item.quantity,
                price: Number(item.unitPrice),
                productId: item.productId,
                saleId: tx.saleId || undefined,
                debtId: tx.debtId || undefined,
            })) || [];

            if (isDebt && operationItems.length === 0) {
                operationItems.push({
                    name: tx.description || "Veresiye Kaydı",
                    quantity: 1,
                    price: Number(tx.amount),
                    productId: undefined,
                    saleId: tx.saleId || undefined,
                    debtId: tx.debtId || undefined,
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
                transactionType: tx.type,
            };
        });

        return {
            items: serializePrisma(items),
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: page,
        };
    } catch (error) {
        console.error("Unified history error:", error);
        return { items: [], total: 0, totalPages: 0, currentPage: 1 };
    }
}

type PeriodKey = "current" | "previous" | "twoAgo";

export interface SalesHistoryReport {
    periods: Record<PeriodKey, {
        key: PeriodKey;
        label: string;
        start: string;
        end: string;
        revenue: number;
        profit: number;
        saleCount: number;
        itemCount: number;
        averageSale: number;
        debtSales: number;
        cashRevenue: number;
        cardRevenue: number;
        transferRevenue: number;
        debtRevenue: number;
    }>;
    comparisons: {
        revenueVsPrevious: number;
        revenueVsTwoAgo: number;
        profitVsPrevious: number;
        saleCountVsPrevious: number;
    };
    dailyTrend: { date: string; revenue: number; profit: number; count: number }[];
    paymentBreakdown: { method: string; label: string; total: number; count: number }[];
    topProducts: { name: string; quantity: number; revenue: number; profit: number }[];
    insights: string[];
}

const percentChange = (current: number, previous: number) => {
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

const toSupportedCurrency = (value?: string | null): TransactionCurrency => {
    return value === "USD" || value === "EUR" ? value : "TRY";
};

const createEmptyPeriod = (key: PeriodKey, date: Date) => ({
    key,
    label: format(date, "MMMM yyyy"),
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
    revenue: 0,
    profit: 0,
    saleCount: 0,
    itemCount: 0,
    averageSale: 0,
    debtSales: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    transferRevenue: 0,
    debtRevenue: 0,
});

export async function getSalesHistoryReport(options: { startDate?: string | Date; endDate?: string | Date } = {}): Promise<SalesHistoryReport> {
    try {
        const shopId = await getShopId();
        const now = new Date();
        const currentStart = options.startDate ? startOfDay(new Date(options.startDate)) : startOfMonth(now);
        const currentEnd = options.endDate ? endOfDay(new Date(options.endDate)) : endOfDay(now);
        const spanDays = Math.max(0, differenceInCalendarDays(currentEnd, currentStart));
        const previousEnd = endOfDay(subDays(currentStart, 1));
        const previousStart = startOfDay(subDays(previousEnd, spanDays));
        const twoAgoEnd = endOfDay(subDays(previousStart, 1));
        const twoAgoStart = startOfDay(subDays(twoAgoEnd, spanDays));

        const periodRanges: Record<PeriodKey, { start: Date; end: Date; label: string }> = {
            current: { start: currentStart, end: currentEnd, label: `${format(currentStart, "d MMM", { locale: tr })} - ${format(currentEnd, "d MMM yyyy", { locale: tr })}` },
            previous: { start: previousStart, end: previousEnd, label: `${format(previousStart, "d MMM", { locale: tr })} - ${format(previousEnd, "d MMM yyyy", { locale: tr })}` },
            twoAgo: { start: twoAgoStart, end: twoAgoEnd, label: `${format(twoAgoStart, "d MMM", { locale: tr })} - ${format(twoAgoEnd, "d MMM yyyy", { locale: tr })}` },
        };

        const periods: SalesHistoryReport["periods"] = {
            current: { ...createEmptyPeriod("current", currentStart), label: periodRanges.current.label, start: currentStart.toISOString(), end: currentEnd.toISOString() },
            previous: { ...createEmptyPeriod("previous", previousStart), label: periodRanges.previous.label, start: previousStart.toISOString(), end: previousEnd.toISOString() },
            twoAgo: { ...createEmptyPeriod("twoAgo", twoAgoStart), label: periodRanges.twoAgo.label, start: twoAgoStart.toISOString(), end: twoAgoEnd.toISOString() },
        };

        const [sales, rates] = await Promise.all([
            prisma.sale.findMany({
            where: {
                shopId,
                createdAt: {
                    gte: twoAgoStart,
                    lte: currentEnd,
                },
            },
            include: {
                items: {
                    include: {
                        product: { include: { category: true } },
                    },
                },
                transaction: true,
                customer: true,
            },
            orderBy: { createdAt: "asc" },
            }),
            getExchangeRates(shopId),
        ]);

        const currentDays = eachDayOfInterval({
            start: currentStart,
            end: currentEnd,
        }).map((day) => ({
            key: format(day, "yyyy-MM-dd"),
            date: format(day, "d MMM", { locale: tr }),
            revenue: 0,
            profit: 0,
            count: 0,
        }));
        const dailyMap = new Map(currentDays.map((day) => [day.key, day]));
        const paymentMap = new Map<string, { method: string; label: string; total: number; count: number }>();
        const productMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();

        const resolvePeriod = (date: Date): PeriodKey | null => {
            if (date >= periodRanges.current.start && date <= periodRanges.current.end) return "current";
            if (date >= periodRanges.previous.start && date <= periodRanges.previous.end) return "previous";
            if (date >= periodRanges.twoAgo.start && date <= periodRanges.twoAgo.end) return "twoAgo";
            return null;
        };

        for (const sale of sales) {
            if (!sale.items || sale.items.length === 0) continue;
            const periodKey = resolvePeriod(sale.createdAt);
            if (!periodKey) continue;

            const saleCurrency = toSupportedCurrency(sale.transaction?.currency);
            const revenue = convertTransactionAmount(
                Number(sale.transaction?.amount ?? sale.finalAmount ?? 0),
                saleCurrency,
                rates
            ).TRY;
            const itemCount = sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const profit = sale.items.reduce((sum, item) => {
                const unitPrice = convertTransactionAmount(Number(item.unitPrice || 0), saleCurrency, rates).TRY;
                const cost = Number(item.product?.buyPrice || 0);
                return sum + ((unitPrice - cost) * Number(item.quantity || 0));
            }, 0);

            const period = periods[periodKey];
            period.revenue += revenue;
            period.profit += profit;
            period.saleCount += 1;
            period.itemCount += itemCount;

            const paymentMethod = sale.paymentMethod || "CASH";
            if (paymentMethod === "CASH") period.cashRevenue += revenue;
            if (paymentMethod === "CARD") period.cardRevenue += revenue;
            if (paymentMethod === "TRANSFER") period.transferRevenue += revenue;
            if (paymentMethod === "DEBT") {
                period.debtRevenue += revenue;
                period.debtSales += 1;
            }

            if (periodKey === "current") {
                const dayKey = format(sale.createdAt, "yyyy-MM-dd");
                const daily = dailyMap.get(dayKey);
                if (daily) {
                    daily.revenue += revenue;
                    daily.profit += profit;
                    daily.count += 1;
                }

                const labels: Record<string, string> = {
                    CASH: "Nakit",
                    CARD: "Kart",
                    TRANSFER: "Havale",
                    DEBT: "Veresiye",
                };
                const payment = paymentMap.get(paymentMethod) || {
                    method: paymentMethod,
                    label: labels[paymentMethod] || paymentMethod,
                    total: 0,
                    count: 0,
                };
                payment.total += revenue;
                payment.count += 1;
                paymentMap.set(paymentMethod, payment);

                for (const item of sale.items) {
                    const productName = item.product?.name || "Bilinmeyen Ürün";
                    const quantity = Number(item.quantity || 0);
                    const itemRevenue = convertTransactionAmount(Number(item.totalPrice || 0), saleCurrency, rates).TRY;
                    const itemProfit = (convertTransactionAmount(Number(item.unitPrice || 0), saleCurrency, rates).TRY - Number(item.product?.buyPrice || 0)) * quantity;
                    const product = productMap.get(productName) || { name: productName, quantity: 0, revenue: 0, profit: 0 };
                    product.quantity += quantity;
                    product.revenue += itemRevenue;
                    product.profit += itemProfit;
                    productMap.set(productName, product);
                }
            }
        }

        for (const key of Object.keys(periods) as PeriodKey[]) {
            periods[key].averageSale = periods[key].saleCount > 0 ? periods[key].revenue / periods[key].saleCount : 0;
        }

        const comparisons = {
            revenueVsPrevious: percentChange(periods.current.revenue, periods.previous.revenue),
            revenueVsTwoAgo: percentChange(periods.current.revenue, periods.twoAgo.revenue),
            profitVsPrevious: percentChange(periods.current.profit, periods.previous.profit),
            saleCountVsPrevious: percentChange(periods.current.saleCount, periods.previous.saleCount),
        };

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);

        const paymentBreakdown = Array.from(paymentMap.values()).sort((a, b) => b.total - a.total);
        const bestProduct = topProducts[0];
        const insights = [
            comparisons.revenueVsPrevious >= 0
                ? `Ciro geçen aya göre %${Math.abs(comparisons.revenueVsPrevious).toFixed(1)} arttı.`
                : `Ciro geçen aya göre %${Math.abs(comparisons.revenueVsPrevious).toFixed(1)} düştü.`,
            comparisons.profitVsPrevious >= 0
                ? `Tahmini kâr geçen aya göre %${Math.abs(comparisons.profitVsPrevious).toFixed(1)} arttı.`
                : `Tahmini kâr geçen aya göre %${Math.abs(comparisons.profitVsPrevious).toFixed(1)} düştü.`,
            bestProduct
                ? `Bu ay en çok ciro getiren ürün: ${bestProduct.name}.`
                : "Bu ay ürün bazlı satış verisi henüz oluşmadı.",
        ];

        return serializePrisma({
            periods,
            comparisons,
            dailyTrend: currentDays.map(({ key, ...day }) => day),
            paymentBreakdown,
            topProducts,
            insights,
        });
    } catch (error) {
        console.error("Sales history report error:", error);
        const now = new Date();
        const periods = {
            current: createEmptyPeriod("current", now),
            previous: createEmptyPeriod("previous", subMonths(now, 1)),
            twoAgo: createEmptyPeriod("twoAgo", subMonths(now, 2)),
        };
        return {
            periods,
            comparisons: { revenueVsPrevious: 0, revenueVsTwoAgo: 0, profitVsPrevious: 0, saleCountVsPrevious: 0 },
            dailyTrend: [],
            paymentBreakdown: [],
            topProducts: [],
            insights: [],
        };
    }
}
