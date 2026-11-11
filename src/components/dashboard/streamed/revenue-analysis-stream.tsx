"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { CountingNumber } from "@/components/ui/counting-number";
import { getDashboardRevenueAnalysis, DashboardRevenueRange } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const RANGE_OPTIONS: { id: DashboardRevenueRange; label: string; subtitle: string }[] = [
    { id: "7D", label: "7 Gün", subtitle: "Son 7 Günlük Performans (Satış + Servis)" },
    { id: "THIS_MONTH", label: "Bu Ay", subtitle: "Ay Başından Bugüne (Satış + Servis)" },
    { id: "LAST_MONTH", label: "Geçen Ay", subtitle: "Geçen Ay Toplam Performans" },
];

export function RevenueAnalysisStream({ cols = 15, rows = 3, onDataStatus }: { cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
    const isVerySmall = cols < 8;
    const isShort = rows < 3;
    const [range, setRange] = useState<DashboardRevenueRange>("THIS_MONTH");

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-revenue-analysis", range],
        queryFn: async () => {
            const res = await getDashboardRevenueAnalysis(range);
            if (onDataStatus && range === "THIS_MONTH") {
                const isEmpty = (!res?.salesTrend || res.salesTrend.length === 0) && (!res || res.totalRevenue === 0);
                onDataStatus(isEmpty);
            }
            return res;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />;

    const {
        salesTrend = [],
        salesRevenue = 0,
        serviceRevenue = 0,
        totalRevenue = 0,
        salesProfit = 0,
        serviceProfit = 0,
        totalNetProfit = 0
    } = data || {};
    const activeRangeMeta = RANGE_OPTIONS.find((r) => r.id === range) || RANGE_OPTIONS[1];

    return (
        <Card className="h-full flex flex-col shadow-sm border border-border/40 dark:border-white/[0.08] overflow-hidden group w-full bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between gap-3 border-b border-border/40 bg-muted/10 flex-wrap",
                isShort || isVerySmall ? "p-3 pb-2.5" : "px-5 py-3.5"
            )}>
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <CardTitle className={cn(
                            "font-semibold tracking-tight uppercase text-foreground",
                            isVerySmall ? "text-xs" : "text-sm"
                        )}>Gelir Analizi</CardTitle>
                        {!isShort && !isVerySmall && (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                                {activeRangeMeta.subtitle}
                            </p>
                        )}
                    </div>
                    {!isVerySmall && !isShort && (
                        <>
                            <div className="h-7 w-px bg-border/40 hidden md:block" />
                            <div className="hidden md:flex gap-5">
                                <div
                                    className="flex flex-col"
                                    title={`POS Satış: ₺${Number(salesRevenue).toLocaleString("tr-TR")} • Servis: ₺${Number(serviceRevenue).toLocaleString("tr-TR")}`}
                                >
                                    <span className="text-[9px] text-muted-foreground/70 tracking-wider uppercase font-semibold">Toplam Gelir</span>
                                    <span className="text-sm font-bold text-foreground tracking-tight tabular-nums">
                                        <CountingNumber value={totalRevenue} prefix="₺" grouping />
                                    </span>
                                </div>
                                <div
                                    className="flex flex-col"
                                    title={`Satış Kârı: ₺${Number(salesProfit).toLocaleString("tr-TR")} • Servis Kârı: ₺${Number(serviceProfit).toLocaleString("tr-TR")}`}
                                >
                                    <span className="text-[9px] text-muted-foreground/70 tracking-wider uppercase font-semibold">Brüt / Servis Kârı</span>
                                    <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400 tracking-tight tabular-nums">
                                        <CountingNumber value={totalNetProfit} prefix="₺" grouping />
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <div className="flex items-center p-0.5 rounded-lg bg-muted/50 border border-border/40">
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setRange(opt.id)}
                                className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer",
                                    range === opt.id
                                        ? "bg-background text-foreground shadow-xs border border-border/40"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {!isVerySmall && (
                        <div className="hidden sm:flex items-center gap-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 px-2.5 py-1">
                            <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tight">Canlı</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className={cn(
                "flex-1 w-full min-h-0 flex flex-col",
                isShort || isVerySmall ? "p-2" : "p-4 sm:p-5"
            )}>
                {!isVerySmall && !isShort && (
                    <div className="flex items-center justify-between gap-4 mb-2 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                POS Satış (₺{Number(salesRevenue).toLocaleString("tr-TR", { maximumFractionDigits: 0 })})
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-medium">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Servis (₺{Number(serviceRevenue).toLocaleString("tr-TR", { maximumFractionDigits: 0 })})
                            </span>
                        </div>
                    </div>
                )}
                <div className="h-[220px] w-full flex-1 min-h-[160px]">
                    <SalesTrendChart data={salesTrend} />
                </div>
            </CardContent>
        </Card>
    );
}
