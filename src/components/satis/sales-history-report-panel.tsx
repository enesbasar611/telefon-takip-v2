"use client";

import { useState } from "react";
import { 
    Area, 
    AreaChart, 
    Bar, 
    BarChart, 
    CartesianGrid, 
    Cell, 
    Pie, 
    PieChart, 
    ResponsiveContainer, 
    Tooltip, 
    XAxis, 
    YAxis 
} from "recharts";
import { 
    AlertTriangle, 
    ArrowDownRight, 
    ArrowUpRight, 
    Award, 
    Banknote, 
    Boxes, 
    Calendar, 
    CheckCircle2, 
    ChevronRight, 
    CreditCard, 
    ExternalLink, 
    Flame, 
    HelpCircle, 
    Info, 
    Layers, 
    Package, 
    Percent, 
    Receipt, 
    ShoppingBag, 
    Sparkles, 
    TrendingDown, 
    TrendingUp, 
    Users, 
    X 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { getUnifiedHistory, type SalesHistoryReport, type UnifiedOperation } from "@/lib/actions/activity-actions";
import { UnifiedSaleModal } from "@/components/pos/unified-sale-modal";
import { getSaleById } from "@/lib/actions/sale-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const paymentColors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function changeLabel(value: number) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}%${Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function metricTone(value: number) {
    return value >= 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
}

function useMoneyFormatter() {
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 35;
    const eurRate = Number(rates?.eur) > 0 ? Number(rates.eur) : 38;

    return (value: number) => {
        const amount = defaultCurrency === "USD" ? value / usdRate : defaultCurrency === "EUR" ? value / eurRate : value;
        const symbol = defaultCurrency === "USD" ? "$" : defaultCurrency === "EUR" ? "€" : "₺";
        return `${symbol}${amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
    };
}

interface DrilldownState {
    open: boolean;
    title: string;
    subtitle: string;
    modalType: "sales" | "profit" | "expenses" | "collections";
    filterType: "date" | "product" | "category" | "payment" | "period";
    filterValue: string;
    dateStart?: string;
    dateEnd?: string;
    items?: UnifiedOperation[];
    loading?: boolean;
}

interface SalesHistoryReportPanelProps {
    report: SalesHistoryReport;
    isLoading?: boolean;
    onNavigateToListWithFilter?: (params: { searchTerm?: string; startDate?: string; endDate?: string; paymentMethod?: string }) => void;
}

export function SalesHistoryReportPanel({ 
    report, 
    isLoading = false,
    onNavigateToListWithFilter
}: SalesHistoryReportPanelProps) {
    const formatMoney = useMoneyFormatter();
    const { rates } = useDashboardData();

    // Modal state for drilling down into chart data points & rows
    const [drilldown, setDrilldown] = useState<DrilldownState>({
        open: false,
        title: "",
        subtitle: "",
        modalType: "sales",
        filterType: "date",
        filterValue: "",
    });
    const [receiptSale, setReceiptSale] = useState<any>(null);
    const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

    const current = report.periods.current;
    const previous = report.periods.previous;
    const twoAgo = report.periods.twoAgo;

    const periodComparison = [
        { name: current.shortLabel || current.label, ciro: current.revenue, kar: current.profit, rawKey: "current" },
        { name: previous.shortLabel || previous.label, ciro: previous.revenue, kar: previous.profit, rawKey: "previous" },
        { name: twoAgo.shortLabel || twoAgo.label, ciro: twoAgo.revenue, kar: twoAgo.profit, rawKey: "twoAgo" },
    ].reverse();

    const openDrilldown = async (params: {
        title: string;
        subtitle: string;
        modalType?: "sales" | "profit" | "expenses" | "collections";
        filterType: "date" | "product" | "category" | "payment" | "period";
        filterValue: string;
        dateStart?: string;
        dateEnd?: string;
    }) => {
        const modalType = params.modalType || "sales";
        setDrilldown({
            open: true,
            title: params.title,
            subtitle: params.subtitle,
            modalType,
            filterType: params.filterType,
            filterValue: params.filterValue,
            dateStart: params.dateStart,
            dateEnd: params.dateEnd,
            loading: true,
            items: [],
        });

        try {
            const queryOptions: any = {
                page: 1,
                pageSize: 100,
            };

            if (modalType === "expenses") {
                queryOptions.typeFilter = "EXPENSE";
            } else if (modalType === "sales") {
                queryOptions.typeFilter = "SALE";
            }

            if (params.filterType === "date") {
                queryOptions.startDate = params.dateStart;
                queryOptions.endDate = params.dateEnd;
            } else if (params.filterType === "product" || params.filterType === "category") {
                queryOptions.searchTerm = params.filterValue;
                queryOptions.startDate = current.start;
                queryOptions.endDate = current.end;
            } else if (params.filterType === "payment") {
                queryOptions.paymentMethod = params.filterValue;
                queryOptions.startDate = current.start;
                queryOptions.endDate = current.end;
            } else if (params.filterType === "period") {
                queryOptions.startDate = params.dateStart;
                queryOptions.endDate = params.dateEnd;
            }

            const res = await getUnifiedHistory(queryOptions);
            setDrilldown((prev) => ({
                ...prev,
                loading: false,
                items: res?.items || [],
            }));
        } catch (error) {
            console.error("Failed to load drilldown items", error);
            toast.error("İşlem detayları yüklenemedi.");
            setDrilldown((prev) => ({ ...prev, loading: false }));
        }
    };

    const handlePrintReceipt = async (op: UnifiedOperation) => {
        if (!op.saleId && op.type !== "SALE") return;
        const targetId = op.saleId || op.id;
        setReceiptLoading(targetId);
        try {
            const sale = await getSaleById(targetId);
            if (sale) setReceiptSale(sale);
            else toast.error("Satış kaydı bulunamadı.");
        } catch (err) {
            console.error(err);
            toast.error("Fiş yüklenirken hata oluştu.");
        } finally {
            setReceiptLoading(null);
        }
    };

    const totalCollected = current.cashRevenue + current.cardRevenue + current.transferRevenue;

    const kpis = [
        {
            id: "revenue",
            label: "Net Satış Cirosu",
            value: formatMoney(current.revenue),
            change: report.comparisons.revenueVsPrevious,
            detail: `${current.saleCount} fiş, ${current.itemCount} adet ürün (Giderler hariç)`,
            compareText: `vs ${previous.shortLabel || "Önceki Eşdeğer"}`,
            icon: TrendingUp,
            iconTone: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
            action: () => openDrilldown({
                title: "Bugün Ne Satmışım? (Net Satış ve Ciro Kalemleri)",
                subtitle: `${current.label} tarih aralığındaki tüm mağaza satışları ve fişler`,
                modalType: "sales",
                filterType: "period",
                filterValue: "all",
                dateStart: current.start,
                dateEnd: current.end,
            })
        },
        {
            id: "profit",
            label: "Net Tahmini Kâr",
            value: formatMoney(current.profit),
            change: report.comparisons.profitVsPrevious,
            detail: `Brüt Kâr Marjı: %${current.profitMargin.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} (Giderler düşülmez)`,
            compareText: `vs ${previous.shortLabel || "Önceki Eşdeğer"}`,
            icon: Banknote,
            iconTone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            action: () => openDrilldown({
                title: "Satış Kârlılık Analizi (Ne Kadarı Kâr?)",
                subtitle: `${current.label} tarih aralığındaki ürün satış kârları ve alış maliyetleri`,
                modalType: "profit",
                filterType: "period",
                filterValue: "all",
                dateStart: current.start,
                dateEnd: current.end,
            })
        },
        {
            id: "expense",
            label: "İşletme Giderleri",
            value: formatMoney(current.expense),
            change: report.comparisons.expenseVsPrevious,
            detail: `${current.expenseCount} gider ödemesi (Kârdan ayrı tutulur)`,
            compareText: `Önceki: ${formatMoney(previous.expense)}`,
            icon: Receipt,
            iconTone: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
            action: () => openDrilldown({
                title: "İşletme Giderleri (Nereye Para Ödemişim?)",
                subtitle: `${current.label} tarih aralığındaki tüm harcama ve ödeme kalemleri`,
                modalType: "expenses",
                filterType: "period",
                filterValue: "all",
                dateStart: current.start,
                dateEnd: current.end,
            })
        },
        {
            id: "collections",
            label: "Kasa & Tahsilat (Toplanan Para)",
            value: formatMoney(totalCollected),
            change: 0,
            detail: `Nakit: ${formatMoney(current.cashRevenue)} • Kart: ${formatMoney(current.cardRevenue)} • Havale: ${formatMoney(current.transferRevenue)}`,
            compareText: `Veresiye: ${formatMoney(current.debtRevenue)}`,
            icon: CreditCard,
            iconTone: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
            action: () => openDrilldown({
                title: "Tahsilat & Kasa Özeti (Kaç Para Toplamışım?)",
                subtitle: `${current.label} tarih aralığında kasaya giren nakit, kart ve transferler`,
                modalType: "collections",
                filterType: "period",
                filterValue: "all",
                dateStart: current.start,
                dateEnd: current.end,
            })
        },
        {
            id: "basket",
            label: "Ortalama Sepet Hacmi",
            value: formatMoney(current.averageSale),
            change: report.comparisons.averageSaleVsPrevious,
            detail: `İşlem başına ortalama sepet büyüklüğü`,
            compareText: `Önceki: ${formatMoney(previous.averageSale)}`,
            icon: ShoppingBag,
            iconTone: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
            action: () => openDrilldown({
                title: "Ortalama Sepet İşlemleri",
                subtitle: `${current.label} tarih aralığındaki sepetler`,
                modalType: "sales",
                filterType: "period",
                filterValue: "all",
                dateStart: current.start,
                dateEnd: current.end,
            })
        },
        {
            id: "volume",
            label: "Satış & Fiş Hacmi",
            value: `${current.saleCount.toLocaleString("tr-TR")} Fiş`,
            change: report.comparisons.saleCountVsPrevious,
            detail: `${current.debtSales} veresiye satış`,
            compareText: `Önceki: ${previous.saleCount} fiş`,
            icon: Boxes,
            iconTone: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
            action: () => openDrilldown({
                title: "Dönemin Fiş Hacmi",
                subtitle: `${current.label} tarih aralığındaki işlem listesi`,
                modalType: "sales",
                filterType: "period",
                filterValue: "all",
                dateStart: current.start,
                dateEnd: current.end,
            })
        },
    ];

    const bestDay = report.bestDay;

    return (
        <div className={cn("space-y-6 transition-opacity", isLoading && "opacity-60 pointer-events-none")}>
            
            {/* 1. Time-to-Date Executive Header Indicator Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-500/25 bg-blue-500/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {report.comparisons.isTimeToDate ? "Time-to-Date (Eşdeğer Gün) Analizi" : "Dönemsel Karşılaştırma"}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                                Doğru Kıyaslama Aktif
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {report.comparisons.comparisonLabel}. Ayın tamamı yerine geçmiş dönemin eşit günleri ({previous.shortLabel || "Eşdeğer Gün"}) kıyaslanarak yanıltıcı farklar önlenmiştir.
                        </p>
                    </div>
                </div>
                {bestDay && (
                    <div className="flex items-center gap-2 self-stretch sm:self-auto bg-background/80 border border-border/60 rounded-xl px-3 py-2 text-xs">
                        <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
                        <div>
                            <span className="text-muted-foreground">En Karlı Gün: </span>
                            <span className="font-bold text-foreground">{bestDay.dayName} ({formatMoney(bestDay.revenue)})</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Smart Insights & "Biliyor muydunuz?" Widget */}
            {report.smartInsights && report.smartInsights.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">
                                Akıllı Finansal Öngörüler & Biliyor muydunuz?
                            </h3>
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:inline">Yapay zeka ve muhasebe motoru özeti</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {report.smartInsights.map((insight) => {
                            let toneClasses = "border-border/60 bg-card/70 text-foreground";
                            let iconBg = "bg-primary/10 text-primary border-primary/20";

                            if (insight.tone === "highlight") {
                                toneClasses = "border-amber-500/30 bg-amber-500/5 text-foreground";
                                iconBg = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
                            } else if (insight.tone === "positive") {
                                toneClasses = "border-emerald-500/30 bg-emerald-500/5 text-foreground";
                                iconBg = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                            } else if (insight.tone === "warning") {
                                toneClasses = "border-rose-500/30 bg-rose-500/5 text-foreground";
                                iconBg = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
                            } else if (insight.tone === "neutral") {
                                toneClasses = "border-blue-500/30 bg-blue-500/5 text-foreground";
                                iconBg = "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
                            }

                            return (
                                <Card key={insight.id} className={cn("rounded-2xl border shadow-sm p-4 transition-all hover:shadow-md", toneClasses)}>
                                    <div className="flex items-start gap-3">
                                        <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center shrink-0", iconBg)}>
                                            {insight.iconName === "Award" && <Award className="h-5 w-5" />}
                                            {insight.iconName === "TrendingUp" && <TrendingUp className="h-5 w-5" />}
                                            {insight.iconName === "TrendingDown" && <TrendingDown className="h-5 w-5" />}
                                            {insight.iconName === "Banknote" && <Banknote className="h-5 w-5" />}
                                            {insight.iconName === "Boxes" && <Boxes className="h-5 w-5" />}
                                            {insight.iconName === "AlertTriangle" && <AlertTriangle className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-bold truncate text-foreground">{insight.title}</h4>
                                                {insight.metric && (
                                                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                        {insight.metric}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                {insight.text}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. Executive KPI Metric Cards (6 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    const isPositive = kpi.change >= 0;
                    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

                    return (
                        <Card 
                            key={kpi.id} 
                            onClick={kpi.action}
                            className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-pointer group flex flex-col justify-between"
                        >
                            <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors truncate">
                                            {kpi.label}
                                        </p>
                                        <p className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                                            {kpi.value}
                                        </p>
                                    </div>
                                    <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform shrink-0", kpi.iconTone || "bg-primary/10 border-primary/20 text-primary")}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-[10px] text-muted-foreground truncate">{kpi.compareText}</span>
                                        {kpi.id !== "collections" ? (
                                            <Badge variant="outline" className={cn("rounded-md text-[10px] font-bold px-1.5 py-0 gap-0.5 border shrink-0", metricTone(kpi.change))}>
                                                <TrendIcon className="h-2.5 w-2.5" />
                                                {changeLabel(kpi.change)}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="rounded-md text-[9px] font-bold px-1.5 py-0 bg-muted/40 text-muted-foreground border-border/40 shrink-0">
                                                Net Kasa
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/80 truncate">
                                        {kpi.detail}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 4. Interactive Charts Section: Daily Trend & Period Comparison */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-5">
                
                {/* Daily Revenue & Profit Flow */}
                <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-bold">Günlük Satış Akışı ve Kârlılık</CardTitle>
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    Tıklanabilir Grafikler
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Ciro ve tahmini kârın günlere göre seyri. Bir güne tıklayarak o günkü fiş listesini açabilirsiniz.
                            </p>
                        </div>
                        <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs bg-muted/30">
                            {current.label}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart 
                                    data={report.dailyTrend}
                                    onClick={(e: any) => {
                                        if (e && e.activePayload && e.activePayload.length > 0) {
                                            const day = e.activePayload[0].payload;
                                            openDrilldown({
                                                title: `${day.dateFull || day.date} - Günün Satışları`,
                                                subtitle: `${day.dayName || ""}, Toplam Ciro: ${formatMoney(day.revenue)}, Kâr: ${formatMoney(day.profit)}, İşlem: ${day.count}`,
                                                filterType: "date",
                                                filterValue: day.dateKey,
                                                dateStart: `${day.dateKey}T00:00:00.000Z`,
                                                dateEnd: `${day.dateKey}T23:59:59.999Z`,
                                            });
                                        }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="salesRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                                        </linearGradient>
                                        <linearGradient id="salesProfitGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.24} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        tickFormatter={(v) => formatMoney(Number(v)).replace(/,00$/, "")} 
                                        tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={65} 
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload?.length) return null;
                                            const data = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-1.5 min-w-[180px]">
                                                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5 font-bold">
                                                        <span>{data.dateFull || label}</span>
                                                        <span className="text-[10px] text-muted-foreground">{data.dayName}</span>
                                                    </div>
                                                    <div className="space-y-1 pt-1">
                                                        <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                                                            <span>Ciro:</span>
                                                            <span className="font-bold">{formatMoney(Number(data.revenue || 0))}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                                            <span>Kâr:</span>
                                                            <span className="font-bold">{formatMoney(Number(data.profit || 0))}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-muted-foreground">
                                                            <span>İşlem Sayısı:</span>
                                                            <span className="font-semibold text-foreground">{data.count} satış</span>
                                                        </div>
                                                        {data.averageBasket > 0 && (
                                                            <div className="flex justify-between items-center text-muted-foreground">
                                                                <span>Ort. Sepet:</span>
                                                                <span className="font-semibold text-foreground">{formatMoney(Number(data.averageBasket || 0))}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-primary/80 pt-1 border-t border-border/40 font-medium text-center">
                                                        Detaylı fiş listesi için tıklayın ➔
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        name="Ciro" 
                                        dataKey="revenue" 
                                        stroke="#2563eb" 
                                        strokeWidth={2.5} 
                                        fill="url(#salesRevenueGrad)" 
                                        activeDot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        name="Kâr" 
                                        dataKey="profit" 
                                        stroke="#10b981" 
                                        strokeWidth={2} 
                                        fill="url(#salesProfitGrad)" 
                                        activeDot={{ r: 5, fill: "#10b981" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Interactive touch pills for mobile / quick selection */}
                        <div className="mt-4 pt-3 border-t border-border/40">
                            <p className="text-[11px] font-semibold text-muted-foreground mb-2">Hızlı Gün İncelemesi (Dokunun):</p>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {report.dailyTrend.map((day) => {
                                    const isBest = bestDay && bestDay.dateKey === day.dateKey;
                                    return (
                                        <button
                                            key={day.dateKey}
                                            onClick={() => openDrilldown({
                                                title: `${day.dateFull || day.date} - Günün Satışları`,
                                                subtitle: `${day.dayName || ""}, Toplam Ciro: ${formatMoney(day.revenue)}, Kâr: ${formatMoney(day.profit)}`,
                                                filterType: "date",
                                                filterValue: day.dateKey,
                                                dateStart: `${day.dateKey}T00:00:00.000Z`,
                                                dateEnd: `${day.dateKey}T23:59:59.999Z`,
                                            })}
                                            className={cn(
                                                "px-2.5 py-1.5 rounded-xl border text-left shrink-0 transition-all text-xs hover:border-primary/50",
                                                isBest 
                                                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold" 
                                                    : day.revenue > 0
                                                        ? "border-border/60 bg-background/60 hover:bg-muted/40"
                                                        : "border-border/30 bg-muted/10 opacity-60 text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>{day.date}</span>
                                                {isBest && <Flame className="h-3 w-3 text-amber-500" />}
                                            </div>
                                            <div className="font-bold text-[11px] mt-0.5">
                                                {day.revenue > 0 ? formatMoney(day.revenue).replace(/,00$/, "") : "₺0"}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Period Comparison Bar Chart */}
                <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm flex flex-col justify-between">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                        <CardTitle className="text-base font-bold">Eşdeğer Dönem Karşılaştırması</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Seçili gün aralığının önceki aylardaki birebir eşdeğer günlerle kıyaslaması.
                        </p>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div className="h-[210px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={periodComparison}
                                    onClick={(e: any) => {
                                        if (e && e.activePayload && e.activePayload.length > 0) {
                                            const item = e.activePayload[0].payload;
                                            const targetPeriod = report.periods[item.rawKey as keyof typeof report.periods];
                                            if (targetPeriod) {
                                                openDrilldown({
                                                    title: `${targetPeriod.label} Dönem Satışları`,
                                                    subtitle: `Toplam Ciro: ${formatMoney(targetPeriod.revenue)}, Kâr: ${formatMoney(targetPeriod.profit)}, Fiş: ${targetPeriod.saleCount}`,
                                                    filterType: "period",
                                                    filterValue: item.rawKey,
                                                    dateStart: targetPeriod.start,
                                                    dateEnd: targetPeriod.end,
                                                });
                                            }
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        tickFormatter={(v) => formatMoney(Number(v)).replace(/,00$/, "")} 
                                        tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={65} 
                                    />
                                    <Tooltip 
                                        formatter={(value: any, name: any) => [formatMoney(Number(value || 0)), name === "ciro" ? "Ciro" : "Kâr"]} 
                                    />
                                    <Bar dataKey="ciro" name="Ciro" fill="#2563eb" radius={[6, 6, 0, 0]} cursor="pointer" />
                                    <Bar dataKey="kar" name="Kâr" fill="#10b981" radius={[6, 6, 0, 0]} cursor="pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-4 pt-3 border-t border-border/40 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Ciro Büyüme Oranı:</span>
                                <Badge variant="outline" className={cn("rounded-md text-xs font-bold gap-1", metricTone(report.comparisons.revenueVsPrevious))}>
                                    {report.comparisons.revenueVsPrevious >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {changeLabel(report.comparisons.revenueVsPrevious)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Kâr Büyüme Oranı:</span>
                                <Badge variant="outline" className={cn("rounded-md text-xs font-bold gap-1", metricTone(report.comparisons.profitVsPrevious))}>
                                    {report.comparisons.profitVsPrevious >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {changeLabel(report.comparisons.profitVsPrevious)}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 5. Breakdown Section: Payment Methods & Category Share */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Payment Breakdown */}
                <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                        <CardTitle className="text-base font-bold">Ödeme Kanalları & Kasa Girişleri</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Seçili aralıktaki nakit akışı kanalları. Bir ödeme yöntemine dokunarak ilgili işlemleri listeleyin.
                        </p>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
                            <div className="h-[160px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={report.paymentBreakdown} 
                                            dataKey="total" 
                                            nameKey="label" 
                                            innerRadius={46} 
                                            outerRadius={68} 
                                            paddingAngle={4}
                                            cursor="pointer"
                                            onClick={(entry: any) => {
                                                if (entry) {
                                                    openDrilldown({
                                                        title: `${entry.label || entry.name || "Ödeme"} ile Yapılan Satışlar`,
                                                        subtitle: `Toplam: ${formatMoney(entry.total || 0)}, ${entry.count || 0} işlem`,
                                                        filterType: "payment",
                                                        filterValue: entry.method || entry.name || "",
                                                    });
                                                }
                                            }}
                                        >
                                            {report.paymentBreakdown.map((entry, index) => (
                                                <Cell key={entry.method} fill={paymentColors[index % paymentColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatMoney(Number(value || 0))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2.5">
                                {report.paymentBreakdown.map((item, index) => (
                                    <button
                                        key={item.method}
                                        onClick={() => openDrilldown({
                                            title: `${item.label} ile Yapılan Satışlar`,
                                            subtitle: `Toplam: ${formatMoney(item.total)}, ${item.count} işlem`,
                                            filterType: "payment",
                                            filterValue: item.method,
                                        })}
                                        className="w-full flex items-center justify-between p-2 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors text-xs text-left"
                                    >
                                        <span className="flex items-center gap-2 text-foreground font-medium">
                                            <span 
                                                className="h-2.5 w-2.5 rounded-full shrink-0" 
                                                style={{ backgroundColor: paymentColors[index % paymentColors.length] }} 
                                            />
                                            {item.label}
                                            <span className="text-muted-foreground text-[10px]">({item.count} adet)</span>
                                        </span>
                                        <div className="text-right">
                                            <span className="font-bold">{formatMoney(item.total)}</span>
                                            <span className="text-[10px] text-muted-foreground ml-1.5 font-semibold">
                                                (%{item.percentage.toFixed(0)})
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                {report.paymentBreakdown.length === 0 && (
                                    <p className="text-xs text-muted-foreground py-4 text-center">Bu aralıkta ödeme verisi bulunmuyor.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Share */}
                <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                        <CardTitle className="text-base font-bold">Kategori Bazlı Gelir Dağılımı</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Cironun kategorilere göre dağılımı. Kategorilere tıklayarak ürün satışlarını filtreleyin.
                        </p>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {report.topCategories?.map((cat, idx) => (
                                <button
                                    key={cat.name}
                                    onClick={() => openDrilldown({
                                        title: `"${cat.name}" Kategorisi Satışları`,
                                        subtitle: `Toplam Ciro: ${formatMoney(cat.revenue)}, Tahmini Kâr: ${formatMoney(cat.profit)}`,
                                        filterType: "category",
                                        filterValue: cat.name,
                                    })}
                                    className="w-full text-left p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors space-y-1.5"
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-foreground truncate max-w-[200px]">{cat.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-[11px]">Kâr: {formatMoney(cat.profit)}</span>
                                            <span className="font-bold text-primary">{formatMoney(cat.revenue)}</span>
                                            <Badge variant="outline" className="text-[10px] font-bold">
                                                %{cat.share.toFixed(0)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Progress value={Math.min(100, cat.share)} className="h-1.5 bg-muted" />
                                </button>
                            ))}
                            {(!report.topCategories || report.topCategories.length === 0) && (
                                <p className="text-xs text-muted-foreground py-6 text-center">Kategori verisi bulunmuyor.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 6. Top Products & Staff Performance */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                
                {/* Top Products */}
                <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">En Çok Ciro Getiren Ürün ve Hizmetler</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Seçili aralıktaki ürün satış sıralaması.</p>
                        </div>
                        <Package className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="space-y-2.5">
                            {report.topProducts.map((prod, idx) => (
                                <div
                                    key={prod.name}
                                    onClick={() => openDrilldown({
                                        title: `"${prod.name}" Satış Geçmişi`,
                                        subtitle: `Satılan Adet: ${prod.quantity}, Toplam Ciro: ${formatMoney(prod.revenue)}, Kâr: ${formatMoney(prod.profit)}`,
                                        filterType: "product",
                                        filterValue: prod.name,
                                    })}
                                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate text-foreground">{prod.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {prod.quantity} adet satıldı • Kâr: {formatMoney(prod.profit)} (%{prod.margin.toFixed(0)})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-foreground">{formatMoney(prod.revenue)}</p>
                                        <span className="text-[10px] text-primary flex items-center justify-end gap-0.5">
                                            İncele <ChevronRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {report.topProducts.length === 0 && (
                                <p className="text-xs text-muted-foreground py-6 text-center">Bu aralıkta ürün satışı bulunmuyor.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Staff Performance */}
                <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">Personel Satış ve Kârlılık Performansı</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Personellerin yaptığı satış tutarları ve tahmini kâr.</p>
                        </div>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="space-y-2.5">
                            {report.staffPerformance?.map((staff, idx) => (
                                <div
                                    key={staff.id}
                                    onClick={() => openDrilldown({
                                        title: `${staff.name} - Satış Listesi`,
                                        subtitle: `Toplam Ciro: ${formatMoney(staff.revenue)}, Kâr: ${formatMoney(staff.profit)}, Satış Adedi: ${staff.saleCount}`,
                                        filterType: "period",
                                        filterValue: staff.id,
                                        dateStart: current.start,
                                        dateEnd: current.end,
                                    })}
                                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate text-foreground">{staff.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {staff.saleCount} işlem • Kâr: {formatMoney(staff.profit)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(staff.revenue)}</p>
                                        <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5">
                                            Detay <ChevronRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!report.staffPerformance || report.staffPerformance.length === 0) && (
                                <p className="text-xs text-muted-foreground py-6 text-center">Personel satış verisi bulunmuyor.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 7. Interactive Drilldown Modal: Tapping any chart point/summary row opens this! */}
            <Dialog 
                open={drilldown.open} 
                onOpenChange={(open) => setDrilldown((prev) => ({ ...prev, open }))}
            >
                <DialogContent className="w-full sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-background border border-border shadow-2xl">
                    <DialogHeader className="p-5 border-b border-border/40 bg-muted/10 text-left">
                        <div className="flex items-start justify-between gap-3 pr-6">
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                                    {drilldown.title}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    {drilldown.subtitle}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                        {drilldown.loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse text-xs">
                                <ShoppingBag className="h-8 w-8 text-primary animate-bounce" />
                                <span>Kayıtlar yükleniyor...</span>
                            </div>
                        ) : drilldown.modalType === "profit" ? (
                            <div className="space-y-4">
                                {/* Profitability summary pills */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Net Satış Cirosu</span>
                                        <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatMoney(current.revenue)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Tahmini Alış Maliyeti</span>
                                        <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{formatMoney(Math.max(0, current.revenue - current.profit))}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Net Tahmini Kâr</span>
                                        <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(current.profit)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Brüt Kâr Marjı</span>
                                        <p className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">%{current.profitMargin.toFixed(1)}</p>
                                    </div>
                                </div>

                                {/* Informational banner */}
                                <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-xs text-foreground flex items-start gap-2.5">
                                    <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold">Tahmini Kâr Nasıl Hesaplanır?</p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Her satış için ürünün <b>(Satış Fiyatı - Alış Maliyeti) × Adet</b> tutarı toplanarak brüt kâr elde edilir. Dükkanın genel işletme giderleri kârdan düşülmez; muhasebe standartlarına göre giderler her zaman ayrı tutulur.
                                        </p>
                                    </div>
                                </div>

                                {/* Product Profitability list */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                                        <span>Satılan Ürün & Kalem</span>
                                        <span>Kâr & Marj</span>
                                    </div>
                                    {report.topProducts.map((prod, idx) => (
                                        <div key={idx} className="p-3 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-3 text-xs">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground truncate">{prod.name}</span>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/40 font-semibold">
                                                        {prod.quantity} adet
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                                                    <span>Satış Tutarı: <b className="text-foreground">{formatMoney(prod.revenue)}</b></span>
                                                    <span>Maliyet: <b>{formatMoney(Math.max(0, prod.revenue - prod.profit))}</b></span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{formatMoney(prod.profit)}</span>
                                                <div className="text-[10px] text-muted-foreground font-semibold">%{prod.margin.toFixed(0)} Kâr Marjı</div>
                                            </div>
                                        </div>
                                    ))}
                                    {report.topProducts.length === 0 && (
                                        <p className="text-xs text-muted-foreground py-8 text-center">Bu dönemde kayıtlı ürün satışı bulunmuyor.</p>
                                    )}
                                </div>
                            </div>
                        ) : drilldown.modalType === "expenses" ? (
                            <div className="space-y-4">
                                {/* Expense summary pills */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Toplam İşletme Gideri</span>
                                        <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">-{formatMoney(current.expense)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Gider Ödeme Sayısı</span>
                                        <p className="text-base sm:text-lg font-black text-foreground mt-0.5">{current.expenseCount} İşlem</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 col-span-2 sm:col-span-1">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Muhasebe Kuralı</span>
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">Kârdan Düşülmez (Ayrı)</p>
                                    </div>
                                </div>

                                {/* Informational banner */}
                                <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/10 text-xs text-foreground flex items-start gap-2.5">
                                    <Info className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold">Nereye Para Ödenmiş?</p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Seçilen dönemde dükkan kasanızdan veya banka hesaplarınızdan çıkan harcamalar, ödenen muhataplar ve kategorileri aşağıda yer almaktadır. Giderler satış cirosuna dahil edilmemiştir.
                                        </p>
                                    </div>
                                </div>

                                {/* Expenses list */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                                        <span>Gider & Ödeme Yeri</span>
                                        <span>Ödenen Tutar</span>
                                    </div>
                                    {report.topExpenses && report.topExpenses.length > 0 ? (
                                        report.topExpenses.map((exp) => (
                                            <div key={exp.id} className="p-3 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-3 text-xs">
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-foreground truncate">{exp.description}</span>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-500/10 text-rose-600 border-rose-500/20 shrink-0">
                                                            {exp.category}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                        <span>Kasa/Hesap: <b>{exp.accountName || "Nakit Kasa"}</b></span>
                                                        {exp.supplierName && <span>• Muhatap: <b>{exp.supplierName}</b></span>}
                                                        <span>• {exp.dateFormatted}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">-{formatMoney(exp.amount)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground py-8 text-center">Bu dönemde kaydedilmiş işletme gideri bulunmuyor.</p>
                                    )}
                                </div>
                            </div>
                        ) : drilldown.modalType === "collections" ? (
                            <div className="space-y-4">
                                {/* Collection summary pills */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Nakit Kasa</span>
                                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(current.cashRevenue)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">POS / Kredi Kartı</span>
                                        <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatMoney(current.cardRevenue)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Banka Havale</span>
                                        <p className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{formatMoney(current.transferRevenue)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Açık Hesap (Veresiye)</span>
                                        <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{formatMoney(current.debtRevenue)}</p>
                                    </div>
                                </div>

                                {/* Payment breakdown bars */}
                                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tahsilat Kanalları Oranı</h4>
                                    {report.paymentBreakdown.map((pay) => (
                                        <div key={pay.method} className="space-y-1 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-foreground">{pay.label} ({pay.count} işlem)</span>
                                                <span className="font-bold">{formatMoney(pay.total)} (%{pay.percentage.toFixed(1)})</span>
                                            </div>
                                            <Progress value={pay.percentage} className="h-1.5" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Standard Sales Modal ("Bugün ne satmışım?") */
                            <div className="space-y-3">
                                {/* Sales summary pills */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                    <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Net Satış Cirosu</span>
                                        <p className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatMoney(current.revenue)}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Toplam Fiş</span>
                                        <p className="text-sm sm:text-base font-black text-foreground mt-0.5">{current.saleCount} Adet</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Satılan Parça</span>
                                        <p className="text-sm sm:text-base font-black text-foreground mt-0.5">{current.itemCount} Ürün</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                        <span className="text-[11px] text-muted-foreground font-semibold">Ortalama Sepet</span>
                                        <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(current.averageSale)}</p>
                                    </div>
                                </div>

                                {drilldown.items && drilldown.items.length > 0 ? (
                                    drilldown.items
                                        .filter((op) => op.type === "SALE" || op.type === "DEBT_DIRECT")
                                        .map((op) => (
                                            <div 
                                                key={op.id}
                                                className="p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-foreground">#{op.number || op.id.substring(0, 8)}</span>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            {op.paymentMethod === "CASH" ? "Nakit" : op.paymentMethod === "CARD" ? "Kredi Kartı" : op.paymentMethod === "DEBT" ? "Veresiye" : "Havale"}
                                                        </Badge>
                                                        <span className="text-muted-foreground text-[11px]">
                                                            {format(new Date(op.date), "dd MMM yyyy HH:mm", { locale: tr })}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-foreground truncate">
                                                        {op.customerName || "Perakende Müşteri"}
                                                    </p>
                                                    {op.items && op.items.length > 0 && (
                                                        <p className="text-muted-foreground text-[11px] truncate">
                                                            {op.items.map((it) => `${it.name} (${it.quantity}x)`).join(", ")}
                                                        </p>
                                                    )}
                                                    {op.description && (
                                                        <p className="text-[11px] text-muted-foreground/80 italic truncate">
                                                            Not: "{op.description}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                                                    <span className={cn(
                                                        "text-sm font-black",
                                                        op.type === "DEBT_DIRECT" ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"
                                                    )}>
                                                        {formatMoney(op.amount)}
                                                    </span>
                                                    {op.saleId && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 rounded-lg text-xs gap-1.5 border-border/60"
                                                            onClick={() => handlePrintReceipt(op)}
                                                            disabled={receiptLoading === op.saleId}
                                                        >
                                                            <Receipt className="h-3.5 w-3.5 text-primary" />
                                                            Fiş Yazdır
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="py-12 text-center text-xs text-muted-foreground">
                                        Bu filtreye uygun satış kaydı bulunamadı.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-xs"
                            onClick={() => setDrilldown((prev) => ({ ...prev, open: false }))}
                        >
                            Kapat
                        </Button>
                        {onNavigateToListWithFilter && (
                            <Button
                                size="sm"
                                className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-md"
                                onClick={() => {
                                    setDrilldown((prev) => ({ ...prev, open: false }));
                                    onNavigateToListWithFilter({
                                        startDate: drilldown.dateStart,
                                        endDate: drilldown.dateEnd,
                                        searchTerm: drilldown.filterType === "product" || drilldown.filterType === "category" ? drilldown.filterValue : undefined,
                                        paymentMethod: drilldown.filterType === "payment" ? drilldown.filterValue : undefined,
                                    });
                                }}
                            >
                                Tümünü İşlem Listesinde İncele <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal for direct printing from drilldown */}
            <UnifiedSaleModal
                isOpen={!!receiptSale}
                onClose={() => setReceiptSale(null)}
                sale={receiptSale}
                rates={rates as any}
            />
        </div>
    );
}
