"use server";

import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";
import { callGemini } from "@/lib/actions/gemini-actions";
import { revalidatePath } from "next/cache";

export type ReportType =
    | "MONTH_END_PROJECTION"
    | "FINANCIAL_SNAPSHOT"
    | "STOCK_FORECAST"
    | "RECEIVABLES_ALERT";

export interface ForecastMetrics {
    todayStr: string;
    dayOfMonth: number;
    daysInMonth: number;
    daysRemaining: number;
    monthProgressPercent: number;
    currentSales: number;
    currentService: number;
    currentGrossRevenue: number;
    currentExpenses: number;
    currentNetRevenue: number;
    dailyAverageRevenue: number;
    projectedMonthEndRevenue: number;
    prevMonthTTDGross: number;
    prevMonthTTDNet: number;
    growthRateTTD: number; // percentage
    todayRevenue: number;
    criticalStockCount: number;
    totalOpenDebts: number;
    openDebtsCount: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

/**
 * Computes zero-token, high-accuracy financial and run-rate metrics.
 */
export async function getMonthEndForecastMetrics(): Promise<ForecastMetrics> {
    const shopId = await getShopId();
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
    const monthProgressPercent = Math.min(100, Math.round((dayOfMonth / daysInMonth) * 100));

    // Month boundaries
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const startOfToday = new Date(currentYear, currentMonth, dayOfMonth, 0, 0, 0, 0);

    // Previous month equivalent period (Time-To-Date)
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    const prevMonthEquivDay = Math.min(dayOfMonth, daysInPrevMonth);

    const startOfPrevMonth = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
    const endOfPrevMonthTTD = new Date(prevYear, prevMonth, prevMonthEquivDay, 23, 59, 59, 999);

    const [
        currentSalesAgg,
        currentServices,
        currentExpensesAgg,
        prevSalesAgg,
        prevServices,
        prevExpensesAgg,
        todaySalesAgg,
        criticalStockCount,
        debtsAgg,
        topSaleItems
    ] = await Promise.all([
        // 1. Current month sales
        prisma.sale.aggregate({
            _sum: { finalAmount: true },
            _count: true,
            where: { shopId, createdAt: { gte: startOfMonth } }
        }),
        // 2. Current month services (ready or delivered)
        prisma.serviceTicket.findMany({
            where: {
                shopId,
                status: { in: ["READY", "DELIVERED"] },
                createdAt: { gte: startOfMonth }
            },
            select: { actualCost: true, estimatedCost: true }
        }),
        // 3. Current month expenses
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { shopId, type: "EXPENSE", createdAt: { gte: startOfMonth } }
        }),
        // 4. Prev month TTD sales
        prisma.sale.aggregate({
            _sum: { finalAmount: true },
            where: { shopId, createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonthTTD } }
        }),
        // 5. Prev month TTD services
        prisma.serviceTicket.findMany({
            where: {
                shopId,
                status: { in: ["READY", "DELIVERED"] },
                createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonthTTD }
            },
            select: { actualCost: true, estimatedCost: true }
        }),
        // 6. Prev month TTD expenses
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { shopId, type: "EXPENSE", createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonthTTD } }
        }),
        // 7. Today sales
        prisma.sale.aggregate({
            _sum: { finalAmount: true },
            where: { shopId, createdAt: { gte: startOfToday } }
        }),
        // 8. Critical stock count
        prisma.product.count({
            where: {
                shopId,
                isDeleted: false,
                stock: { lte: 2 }
            }
        }),
        // 9. Overdue / Open debts
        prisma.debt.aggregate({
            _sum: { remainingAmount: true },
            _count: true,
            where: { shopId, isPaid: false, remainingAmount: { gt: 0 } }
        }),
        // 10. Top selling items this month
        prisma.saleItem.groupBy({
            by: ["productId"],
            _sum: { quantity: true, totalPrice: true },
            where: {
                shopId,
                sale: { createdAt: { gte: startOfMonth } }
            },
            orderBy: { _sum: { quantity: "desc" } },
            take: 5
        })
    ]);

    // Top product names lookup
    const topProductIds = topSaleItems.map(item => item.productId);
    const productsInfo = await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true }
    });
    const productNameMap = new Map(productsInfo.map(p => [p.id, p.name]));

    const topProducts = topSaleItems.map(item => ({
        name: productNameMap.get(item.productId) || "Bilinmeyen Ürün",
        quantity: item._sum?.quantity || 0,
        revenue: Number(item._sum?.totalPrice || 0)
    }));

    const currentSales = Number(currentSalesAgg._sum.finalAmount || 0);
    const currentService = currentServices.reduce((acc, curr) => {
        const val = Number(curr.actualCost || 0) > 0 ? Number(curr.actualCost) : Number(curr.estimatedCost || 0);
        return acc + val;
    }, 0);
    const currentGrossRevenue = currentSales + currentService;
    const currentExpenses = Number(currentExpensesAgg._sum.amount || 0);
    const currentNetRevenue = currentGrossRevenue - currentExpenses;

    const dailyAverageRevenue = Math.round(currentNetRevenue / Math.max(dayOfMonth, 1));
    const projectedMonthEndRevenue = Math.round(dailyAverageRevenue * daysInMonth);

    const prevSales = Number(prevSalesAgg._sum.finalAmount || 0);
    const prevService = prevServices.reduce((acc, curr) => {
        const val = Number(curr.actualCost || 0) > 0 ? Number(curr.actualCost) : Number(curr.estimatedCost || 0);
        return acc + val;
    }, 0);
    const prevMonthTTDGross = prevSales + prevService;
    const prevExpenses = Number(prevExpensesAgg._sum.amount || 0);
    const prevMonthTTDNet = prevMonthTTDGross - prevExpenses;

    let growthRateTTD = 0;
    if (prevMonthTTDNet > 0) {
        growthRateTTD = Number((((currentNetRevenue - prevMonthTTDNet) / prevMonthTTDNet) * 100).toFixed(1));
    } else if (currentNetRevenue > 0) {
        growthRateTTD = 100;
    }

    const todayRevenue = Number(todaySalesAgg._sum.finalAmount || 0);
    const totalOpenDebts = Number(debtsAgg._sum.remainingAmount || 0);
    const openDebtsCount = debtsAgg._count || 0;

    return {
        todayStr: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
        dayOfMonth,
        daysInMonth,
        daysRemaining,
        monthProgressPercent,
        currentSales,
        currentService,
        currentGrossRevenue,
        currentExpenses,
        currentNetRevenue,
        dailyAverageRevenue,
        projectedMonthEndRevenue,
        prevMonthTTDGross,
        prevMonthTTDNet,
        growthRateTTD,
        todayRevenue,
        criticalStockCount,
        totalOpenDebts,
        openDebtsCount,
        topProducts
    };
}

/**
 * Returns latest saved executive report from vault (0 tokens consumed).
 */
export async function getLatestAIReport(reportType?: ReportType) {
    try {
        const shopId = await getShopId();
        const whereClause: any = { shopId };
        if (reportType) {
            whereClause.reportType = reportType;
        }

        const report = await prisma.aIReportHistory.findFirst({
            where: whereClause,
            orderBy: { createdAt: "desc" }
        });

        if (!report) return null;

        return serializePrisma({
            ...report,
            metrics: report.metricsJson ? JSON.parse(report.metricsJson) : null
        });
    } catch (error) {
        console.error("Error fetching latest AI report:", error);
        return null;
    }
}

/**
 * Returns timeline vault of past reports.
 */
export async function getAIReportHistory(limit = 15) {
    try {
        const shopId = await getShopId();
        const list = await prisma.aIReportHistory.findMany({
            where: { shopId },
            orderBy: { createdAt: "desc" },
            take: limit
        });

        return serializePrisma(
            list.map(item => ({
                ...item,
                metrics: item.metricsJson ? JSON.parse(item.metricsJson) : null
            }))
        );
    } catch (error) {
        console.error("Error fetching AI report history:", error);
        return [];
    }
}

/**
 * Deletes an old report from history.
 */
export async function deleteAIReport(id: string) {
    try {
        const shopId = await getShopId();
        await prisma.aIReportHistory.delete({
            where: { id, shopId }
        });
        revalidatePath("/stok/stok-ai");
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Generates an executive B.A.Ş.A.R. Command AI Report,
 * stores it in AIReportHistory for zero-token caching, and returns it.
 */
export async function generateExecutiveAIReport(reportType: ReportType = "MONTH_END_PROJECTION") {
    try {
        const shopId = await getShopId();
        const metrics = await getMonthEndForecastMetrics();

        let title = "🎯 Ay Sonu Net Ciro ve Büyüme Projeksiyonu";
        let contextGoal = "";

        switch (reportType) {
            case "MONTH_END_PROJECTION":
                title = "🎯 Ay Sonu Net Ciro ve Büyüme Projeksiyonu";
                contextGoal = `Ana odak: Mevcut ayın kalan ${metrics.daysRemaining} günü için net ciro kapatma projeksiyonu, günlük hedef ve geçen aya göre büyüme dinamiği.`;
                break;
            case "FINANCIAL_SNAPSHOT":
                title = "📊 Finansal Sağlık & Kâr/Zarar Özeti";
                contextGoal = `Ana odak: Satış (${metrics.currentSales.toLocaleString("tr-TR")} ₺) ile Teknik Servis (${metrics.currentService.toLocaleString("tr-TR")} ₺) gelir dengesi, gider kontrolü (${metrics.currentExpenses.toLocaleString("tr-TR")} ₺) ve net marj optimizasyonu.`;
                break;
            case "STOCK_FORECAST":
                title = "📦 Kritik Stok Riski & İkmal Maliyet Analizi";
                contextGoal = `Ana odak: ${metrics.criticalStockCount} adet kritik stok riski, en çok satan ürünlerin tükenme ihtimali ve gereksiz sermaye bağlamadan optimal ikmal planı.`;
                break;
            case "RECEIVABLES_ALERT":
                title = "💸 Açık Veresiye & Tahsilat Risk Bülteni";
                contextGoal = `Ana odak: Toplam ${metrics.totalOpenDebts.toLocaleString("tr-TR")} ₺ tutarındaki ${metrics.openDebtsCount} adet açık veresiye bakiyesi, nakit akışını rahatlatacak acil tahsilat stratejisi.`;
                break;
        }

        const systemPrompt = `Sen "Başar Teknik" yönetim platformunun baş yapay zeka danışmanı B.A.Ş.A.R.'sın (Başar Teknik Akıllı Strateji Analiz ve Raporlama Sistemi).
Üst yöneticiye (Dükkan Sahibi / Yönetici) hitap ediyorsun. 
Tonun: Son derece profesyonel, veri odaklı, kendinden emin, doğrudan hedefe yönelik, kararlı ve eyleme geçirici.
Gereksiz nezaket cümleleri ve klişeler yok. Doğrudan stratejik bulgular ve taktiksel aksiyonlar var. Kesinlikle İngilizce terim veya başlık kullanma, tamamen Türkçe ifade et.

ÖNEMLİ VERİ BİLGİLERİ (GÜNCEL SİSTEM RAPORU - ${metrics.todayStr}):
- Ay İlerlemesi: %${metrics.monthProgressPercent} tamamlandı (Günün ${metrics.dayOfMonth}. günü, kalan ${metrics.daysRemaining} gün)
- Mevcut Net Ciro (Bu Ay Şu Ana Kadar): ${metrics.currentNetRevenue.toLocaleString("tr-TR")} ₺
  * Mağaza Satış Geliri: ${metrics.currentSales.toLocaleString("tr-TR")} ₺
  * Teknik Servis Tamamlanan: ${metrics.currentService.toLocaleString("tr-TR")} ₺
  * Toplam Giderler: ${metrics.currentExpenses.toLocaleString("tr-TR")} ₺
- Günlük Ortalama Net Ciro: ${metrics.dailyAverageRevenue.toLocaleString("tr-TR")} ₺ / gün
- 🏁 AY SONU NET CİRO TAHMİNİ (Kapanış Projeksiyonu): ${metrics.projectedMonthEndRevenue.toLocaleString("tr-TR")} ₺
- Geçen Ayın Aynı Dönemine Göre Büyüme (Dönemsel Kıyaslama): %${metrics.growthRateTTD >= 0 ? "+" : ""}${metrics.growthRateTTD} (Geçen Ay Aynı Dönem Net: ${metrics.prevMonthTTDNet.toLocaleString("tr-TR")} ₺)
- Bugünün Anlık Satışı: ${metrics.todayRevenue.toLocaleString("tr-TR")} ₺
- Kritik Stok Eşiğindeki Ürünler: ${metrics.criticalStockCount} adet
- Açık Veresiye (Müşteri Borçları): ${metrics.totalOpenDebts.toLocaleString("tr-TR")} ₺ (${metrics.openDebtsCount} müşteri/kalem)
- Bu Ay En Çok Satanlar: ${metrics.topProducts.map(p => `${p.name} (${p.quantity} ad. - ${p.revenue.toLocaleString("tr-TR")} ₺)`).join(", ") || "Veri yok"}

TALEP EDİLEN RAPOR TÜRÜ: ${reportType}
${contextGoal}

RAPOR ÇIKTI FORMATI (Markdown):
1. ⚡ **YÖNETİCİ ÖZETİ:** 2-3 vurucu cümleyle mevcut gidişat ve ay sonu tahmini.
2. 📊 **METRİK VE PERFORMANS KONTROLÜ:** Rakamları net gösteren kısa maddeler (Projeksiyon, büyüme farkı, servis ve satış dengesi).
3. ⚠️ **RİSK VE FIRSAT RADARI:** Dikkat edilmesi gereken 2 kritik risk (stok, veresiye veya gider) ve 2 büyüme fırsatı.
4. 🚀 **B.A.Ş.A.R. STRATEJİK HAREKET PLANI (ÖNÜMÜZDEKİ 7 GÜN):** Yöneticinin ve ekibin derhal uygulaması gereken 3 somut, numaralandırılmış emir niteliğinde taktik adım.

Asla JSON veya süslü parantez döndürme. Doğrudan net Markdown metni üret.`;

        const result = await callGemini(shopId, [systemPrompt, "Yönetici Komuta Raporunu üret."], "text");
        if ("error" in result) {
            return { success: false, error: result.error };
        }

        const reportContent = result.text;

        // Save report into database vault
        const savedReport = await prisma.aIReportHistory.create({
            data: {
                shopId,
                reportType,
                title,
                content: reportContent,
                metricsJson: JSON.stringify(metrics)
            }
        });

        revalidatePath("/stok/stok-ai");

        return {
            success: true,
            report: serializePrisma({
                ...savedReport,
                metrics
            })
        };
    } catch (error) {
        console.error("Generate Executive AI Report Error:", error);
        return { success: false, error: "Stratejik kokpit raporu oluşturulurken hata meydana geldi." };
    }
}
