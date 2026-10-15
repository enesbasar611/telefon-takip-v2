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
    paymentMethod?: string;
    staffId?: string;
} = {}) {
    try {
        const shopId = await getShopId();
        const { page = 1, pageSize = 20, searchTerm = "", typeFilter = "ALL", dateRange = "ALL", startDate, endDate, paymentMethod, staffId } = options;
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
            if (typeFilter === "SALE") {
                where.saleId = { not: null };
                where.paymentMethod = { not: "DEBT" };
            } else if (typeFilter === "DEBT") {
                const debtConditions = [
                    { paymentMethod: "DEBT" as any },
                    { debtId: { not: null }, category: { not: "Tahsilat" } }
                ];
                
                if (where.OR) {
                    const existingOr = where.OR;
                    delete where.OR;
                    where.AND = [
                        { OR: existingOr },
                        { OR: debtConditions }
                    ];
                } else {
                    where.OR = debtConditions;
                }
            } else if (typeFilter === "PAYMENT") {
                where.category = "Tahsilat";
            }
        }

        if (paymentMethod && paymentMethod !== "ALL") {
            where.paymentMethod = paymentMethod as any;
        }

        if (staffId && staffId !== "ALL") {
            where.userId = staffId;
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
            const isPayment = tx.category === "Tahsilat";
            const isDebt = tx.paymentMethod === "DEBT" || (!!tx.debtId && !isPayment);
            const isSale = !!tx.saleId && !isDebt;

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

export type PeriodKey = "current" | "previous" | "twoAgo";

export interface SalesHistoryInsight {
    id: string;
    title: string;
    text: string;
    tone: "positive" | "negative" | "warning" | "neutral" | "highlight";
    iconName: "TrendingUp" | "TrendingDown" | "Award" | "AlertTriangle" | "Banknote" | "Clock" | "Boxes" | "Percent";
    metric?: string;
}

export interface SalesHistoryReport {
    periods: Record<PeriodKey, {
        key: PeriodKey;
        label: string;
        shortLabel: string;
        start: string;
        end: string;
        revenue: number;
        profit: number;
        saleCount: number;
        itemCount: number;
        averageSale: number;
        profitMargin: number;
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
        averageSaleVsPrevious: number;
        profitMarginDiff: number;
        isTimeToDate: boolean;
        comparisonLabel: string;
        previousEqualPeriodLabel: string;
    };
    dailyTrend: { 
        date: string; 
        dateKey: string;
        dateFull: string;
        dayName: string;
        revenue: number; 
        profit: number; 
        count: number;
        averageBasket: number;
    }[];
    paymentBreakdown: { method: string; label: string; total: number; count: number; percentage: number }[];
    topProducts: { name: string; quantity: number; revenue: number; profit: number; margin: number }[];
    topCategories: { name: string; revenue: number; profit: number; share: number }[];
    staffPerformance: { id: string; name: string; revenue: number; profit: number; saleCount: number }[];
    insights: string[];
    smartInsights: SalesHistoryInsight[];
    bestDay?: {
        dateKey: string;
        dateFormatted: string;
        dayName: string;
        revenue: number;
        profit: number;
        count: number;
    } | null;
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
    label: format(date, "MMMM yyyy", { locale: tr }),
    shortLabel: format(date, "MMM yyyy", { locale: tr }),
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
    revenue: 0,
    profit: 0,
    saleCount: 0,
    itemCount: 0,
    averageSale: 0,
    profitMargin: 0,
    debtSales: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    transferRevenue: 0,
    debtRevenue: 0,
});

export async function getSalesHistoryReport(options: { 
    startDate?: string | Date; 
    endDate?: string | Date;
    comparisonMode?: "TTD" | "ROLLING_SPAN";
} = {}): Promise<SalesHistoryReport> {
    try {
        const shopId = await getShopId();
        const now = new Date();
        const currentStart = options.startDate ? startOfDay(new Date(options.startDate)) : startOfMonth(now);
        const currentEnd = options.endDate ? endOfDay(new Date(options.endDate)) : endOfDay(now);

        // Time-To-Date (TTD) Equal Day Logic:
        // Comparing ongoing month (e.g. Oct 1-15) against prior month (Sep 1-15) gives true equal-day comparison.
        let previousStart: Date;
        let previousEnd: Date;
        let twoAgoStart: Date;
        let twoAgoEnd: Date;
        let isTimeToDate = true;

        if (options.comparisonMode === "ROLLING_SPAN") {
            const spanDays = Math.max(0, differenceInCalendarDays(currentEnd, currentStart));
            previousEnd = endOfDay(subDays(currentStart, 1));
            previousStart = startOfDay(subDays(previousEnd, spanDays));
            twoAgoEnd = endOfDay(subDays(previousStart, 1));
            twoAgoStart = startOfDay(subDays(twoAgoEnd, spanDays));
            isTimeToDate = false;
        } else {
            // TTD Equal Calendar Days (Default)
            previousStart = startOfDay(subMonths(currentStart, 1));
            previousEnd = endOfDay(subMonths(currentEnd, 1));
            twoAgoStart = startOfDay(subMonths(currentStart, 2));
            twoAgoEnd = endOfDay(subMonths(currentEnd, 2));
        }

        const periodRanges: Record<PeriodKey, { start: Date; end: Date; label: string; shortLabel: string }> = {
            current: { 
                start: currentStart, 
                end: currentEnd, 
                label: `${format(currentStart, "d MMM", { locale: tr })} - ${format(currentEnd, "d MMM yyyy", { locale: tr })}`,
                shortLabel: `${format(currentStart, "d MMM", { locale: tr })} - ${format(currentEnd, "d MMM", { locale: tr })}`
            },
            previous: { 
                start: previousStart, 
                end: previousEnd, 
                label: isTimeToDate 
                    ? `${format(previousStart, "d MMM", { locale: tr })} - ${format(previousEnd, "d MMM yyyy", { locale: tr })} (Eşdeğer Dönem)` 
                    : `${format(previousStart, "d MMM", { locale: tr })} - ${format(previousEnd, "d MMM yyyy", { locale: tr })}`,
                shortLabel: `${format(previousStart, "d MMM", { locale: tr })} - ${format(previousEnd, "d MMM", { locale: tr })}`
            },
            twoAgo: { 
                start: twoAgoStart, 
                end: twoAgoEnd, 
                label: isTimeToDate 
                    ? `${format(twoAgoStart, "d MMM", { locale: tr })} - ${format(twoAgoEnd, "d MMM yyyy", { locale: tr })} (Eşdeğer Dönem)` 
                    : `${format(twoAgoStart, "d MMM", { locale: tr })} - ${format(twoAgoEnd, "d MMM yyyy", { locale: tr })}`,
                shortLabel: `${format(twoAgoStart, "d MMM", { locale: tr })} - ${format(twoAgoEnd, "d MMM", { locale: tr })}`
            },
        };

        const periods: SalesHistoryReport["periods"] = {
            current: { ...createEmptyPeriod("current", currentStart), label: periodRanges.current.label, shortLabel: periodRanges.current.shortLabel, start: currentStart.toISOString(), end: currentEnd.toISOString() },
            previous: { ...createEmptyPeriod("previous", previousStart), label: periodRanges.previous.label, shortLabel: periodRanges.previous.shortLabel, start: previousStart.toISOString(), end: previousEnd.toISOString() },
            twoAgo: { ...createEmptyPeriod("twoAgo", twoAgoStart), label: periodRanges.twoAgo.label, shortLabel: periodRanges.twoAgo.shortLabel, start: twoAgoStart.toISOString(), end: twoAgoEnd.toISOString() },
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
                    user: true,
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
            dateKey: format(day, "yyyy-MM-dd"),
            dateFull: format(day, "dd MMMM yyyy", { locale: tr }),
            dayName: format(day, "EEEE", { locale: tr }),
            revenue: 0,
            profit: 0,
            count: 0,
            averageBasket: 0,
        }));
        const dailyMap = new Map(currentDays.map((day) => [day.key, day]));
        const paymentMap = new Map<string, { method: string; label: string; total: number; count: number }>();
        const productMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();
        const categoryMap = new Map<string, { name: string; revenue: number; profit: number }>();
        const staffMap = new Map<string, { id: string; name: string; revenue: number; profit: number; saleCount: number }>();

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
                    CARD: "Kredi Kartı",
                    TRANSFER: "Havale/EFT",
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

                if (sale.user) {
                    const staffId = sale.user.id;
                    const staffName = `${sale.user.name} ${sale.user.surname || ""}`.trim();
                    const staff = staffMap.get(staffId) || { id: staffId, name: staffName, revenue: 0, profit: 0, saleCount: 0 };
                    staff.revenue += revenue;
                    staff.profit += profit;
                    staff.saleCount += 1;
                    staffMap.set(staffId, staff);
                }

                for (const item of sale.items) {
                    const productName = item.product?.name || "Bilinmeyen Ürün";
                    const categoryName = item.product?.category?.name || "Kategorisiz";
                    const quantity = Number(item.quantity || 0);
                    const itemRevenue = convertTransactionAmount(Number(item.totalPrice || 0), saleCurrency, rates).TRY;
                    const itemProfit = (convertTransactionAmount(Number(item.unitPrice || 0), saleCurrency, rates).TRY - Number(item.product?.buyPrice || 0)) * quantity;
                    
                    const product = productMap.get(productName) || { name: productName, quantity: 0, revenue: 0, profit: 0 };
                    product.quantity += quantity;
                    product.revenue += itemRevenue;
                    product.profit += itemProfit;
                    productMap.set(productName, product);

                    const category = categoryMap.get(categoryName) || { name: categoryName, revenue: 0, profit: 0 };
                    category.revenue += itemRevenue;
                    category.profit += itemProfit;
                    categoryMap.set(categoryName, category);
                }
            }
        }

        for (const day of currentDays) {
            day.averageBasket = day.count > 0 ? day.revenue / day.count : 0;
        }

        for (const key of Object.keys(periods) as PeriodKey[]) {
            const period = periods[key];
            period.averageSale = period.saleCount > 0 ? period.revenue / period.saleCount : 0;
            period.profitMargin = period.revenue > 0 ? (period.profit / period.revenue) * 100 : 0;
        }

        const comparisons = {
            revenueVsPrevious: percentChange(periods.current.revenue, periods.previous.revenue),
            revenueVsTwoAgo: percentChange(periods.current.revenue, periods.twoAgo.revenue),
            profitVsPrevious: percentChange(periods.current.profit, periods.previous.profit),
            saleCountVsPrevious: percentChange(periods.current.saleCount, periods.previous.saleCount),
            averageSaleVsPrevious: percentChange(periods.current.averageSale, periods.previous.averageSale),
            profitMarginDiff: periods.current.profitMargin - periods.previous.profitMargin,
            isTimeToDate,
            comparisonLabel: isTimeToDate 
                ? `Önceki ayın eşdeğer günleri (${periodRanges.previous.shortLabel}) ile Time-to-Date kıyaslaması`
                : `Önceki ${periodRanges.previous.label} dönemi ile kıyaslama`,
            previousEqualPeriodLabel: periodRanges.previous.label,
        };

        const totalRevenue = periods.current.revenue || 1;

        const topProducts = Array.from(productMap.values())
            .map((prod) => ({
                ...prod,
                margin: prod.revenue > 0 ? (prod.profit / prod.revenue) * 100 : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);

        const topCategories = Array.from(categoryMap.values())
            .map((cat) => ({
                ...cat,
                share: (cat.revenue / totalRevenue) * 100,
            }))
            .sort((a, b) => b.revenue - a.revenue);

        const staffPerformance = Array.from(staffMap.values()).sort((a, b) => b.revenue - a.revenue);

        const paymentBreakdown = Array.from(paymentMap.values())
            .map((pay) => ({
                ...pay,
                percentage: (pay.total / totalRevenue) * 100,
            }))
            .sort((a, b) => b.total - a.total);

        const bestDayItem = currentDays.reduce((best, curr) => (curr.revenue > (best?.revenue || 0) ? curr : best), null as any);
        const bestDay = bestDayItem && bestDayItem.revenue > 0 ? {
            dateKey: bestDayItem.dateKey,
            dateFormatted: bestDayItem.dateFull,
            dayName: bestDayItem.dayName,
            revenue: bestDayItem.revenue,
            profit: bestDayItem.profit,
            count: bestDayItem.count,
        } : null;

        // Smart textual insights & "Did You Know?" executive intelligence
        const smartInsights: SalesHistoryInsight[] = [];
        
        if (bestDay) {
            smartInsights.push({
                id: "best-day",
                title: "Dönemin En Çok Ciro Getiren Günü",
                text: `Bu dönemin en kârlı ve hareketli günü ${bestDay.dayName} (${bestDay.dateFormatted}) oldu. Toplam ${bestDay.revenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺ ciro ve ${bestDay.count} satış kaydedildi.`,
                tone: "highlight",
                iconName: "Award",
                metric: `${bestDay.revenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`,
            });
        }

        const revDiff = comparisons.revenueVsPrevious;
        smartInsights.push({
            id: "ttd-comparison",
            title: isTimeToDate ? "Eşdeğer Gün (Time-to-Date) Ciro Kıyaslaması" : "Önceki Dönem Ciro Kıyaslaması",
            text: revDiff >= 0
                ? `${periodRanges.previous.shortLabel} eşdeğer günlerine göre net cironuz %${Math.abs(revDiff).toFixed(1)} artış gösterdi.`
                : `${periodRanges.previous.shortLabel} eşdeğer günlerine göre net cironuz %${Math.abs(revDiff).toFixed(1)} geriledi.`,
            tone: revDiff >= 0 ? "positive" : "warning",
            iconName: revDiff >= 0 ? "TrendingUp" : "TrendingDown",
            metric: `${revDiff >= 0 ? "+" : ""}%${revDiff.toFixed(1)}`,
        });

        const avgDiff = comparisons.averageSaleVsPrevious;
        smartInsights.push({
            id: "average-basket",
            title: "Ortalama Sepet / Fiş Hacmi",
            text: `Satış başına düşen ortalama sepet tutarı ${periods.current.averageSale.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺ oldu (${avgDiff >= 0 ? "+" : ""}%${avgDiff.toFixed(1)} değişim).`,
            tone: avgDiff >= 0 ? "positive" : "neutral",
            iconName: "Banknote",
            metric: `${periods.current.averageSale.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`,
        });

        if (topCategories.length > 0) {
            const leader = topCategories[0];
            smartInsights.push({
                id: "top-category",
                title: "Lider Gelir Kaynağı",
                text: `"${leader.name}" kategorisi, toplam cironun %${leader.share.toFixed(1)}'ini oluşturarak en büyük ciro jeneratörü oldu (${leader.revenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺).`,
                tone: "positive",
                iconName: "Boxes",
                metric: `%${leader.share.toFixed(0)} Pay`,
            });
        }

        const debtRate = periods.current.revenue > 0 ? (periods.current.debtRevenue / periods.current.revenue) * 100 : 0;
        if (debtRate > 20) {
            smartInsights.push({
                id: "debt-warning",
                title: "Veresiye / Alacak Risk Uyarısı",
                text: `Bu dönemdeki satışların %${debtRate.toFixed(1)}'i veresiye (${periods.current.debtRevenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺) olarak kaydedildi. Nakit akışı için tahsilatları takip etmeniz önerilir.`,
                tone: "warning",
                iconName: "AlertTriangle",
                metric: `%${debtRate.toFixed(0)} Veresiye`,
            });
        } else {
            const immediateCashRate = 100 - debtRate;
            smartInsights.push({
                id: "cash-flow",
                title: "Sağlıklı Nakit Akışı",
                text: `Satışların %${immediateCashRate.toFixed(1)}'i anında nakit, kart veya havale ile tahsil edildi.`,
                tone: "positive",
                iconName: "Banknote",
                metric: `%${immediateCashRate.toFixed(0)} Anında`,
            });
        }

        const legacyInsights = smartInsights.map((i) => `${i.title}: ${i.text}`);

        return serializePrisma({
            periods,
            comparisons,
            dailyTrend: currentDays.map(({ key, ...day }) => day),
            paymentBreakdown,
            topProducts,
            topCategories,
            staffPerformance,
            insights: legacyInsights,
            smartInsights,
            bestDay,
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
            comparisons: { 
                revenueVsPrevious: 0, 
                revenueVsTwoAgo: 0, 
                profitVsPrevious: 0, 
                saleCountVsPrevious: 0,
                averageSaleVsPrevious: 0,
                profitMarginDiff: 0,
                isTimeToDate: true,
                comparisonLabel: "Karşılaştırma verisi bulunmuyor",
                previousEqualPeriodLabel: "Önceki Dönem"
            },
            dailyTrend: [],
            paymentBreakdown: [],
            topProducts: [],
            topCategories: [],
            staffPerformance: [],
            insights: [],
            smartInsights: [],
            bestDay: null,
        };
    }
}
