"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { CountingNumber } from "@/components/ui/counting-number";
import { getSalesReport } from "@/lib/actions/report-actions";
import { getProfitMatrix } from "@/lib/actions/analytics-actions";
import { serializePrisma, cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function RevenueAnalysisStream({ cols = 15, rows = 3, onDataStatus }: { cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
    const isSmall = cols < 12;
    const isVerySmall = cols < 8;
    const isShort = rows < 3;

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-revenue-analysis"],
        queryFn: async () => {
            const [salesTrendRaw, profitMatrixRaw] = await Promise.all([
                getSalesReport(),
                getProfitMatrix("THIS_MONTH")
            ]);
            const salesTrend = serializePrisma(salesTrendRaw);
            const profitMatrix = serializePrisma(profitMatrixRaw);

            if (onDataStatus) {
                const isEmpty = (!salesTrend || salesTrend.length === 0) && (!profitMatrix || profitMatrix.totalRevenue === 0);
                onDataStatus(isEmpty);
            }

            return {
                salesTrend,
                profitMatrix
            };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />;

    const { salesTrend, profitMatrix } = data || { salesTrend: [], profitMatrix: { totalRevenue: 0, totalNetProfit: 0 } };

    return (
        <Card className="h-full flex flex-col shadow-sm border border-border/40 dark:border-white/[0.08] overflow-hidden group w-full bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 bg-muted/10",
                isShort || isVerySmall ? "p-3 pb-2.5" : "px-5 py-3.5"
            )}>
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex flex-col gap-0.5">
                        <CardTitle className={cn(
                            "font-semibold tracking-tight uppercase text-foreground",
                            isVerySmall ? "text-xs" : "text-sm"
                        )}>Gelir Analizi</CardTitle>
                        {!isShort && !isVerySmall && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Son 30 Günlük Performans</p>}
                    </div>
                    {!isVerySmall && !isShort && (
                        <>
                            <div className="h-7 w-px bg-border/40 hidden md:block" />
                            <div className="hidden md:flex gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground/70 tracking-wider uppercase font-semibold">Brüt Gelir</span>
                                    <span className="text-sm font-bold text-foreground tracking-tight tabular-nums">
                                        <CountingNumber value={profitMatrix?.totalRevenue ?? 0} prefix="₺" grouping />
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground/70 tracking-wider uppercase font-semibold">Net Kâr</span>
                                    <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400 tracking-tight tabular-nums">
                                        <CountingNumber value={profitMatrix?.totalNetProfit ?? 0} prefix="₺" grouping />
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 bg-blue-500/10 rounded-full border border-blue-500/20",
                    isVerySmall ? "px-2 py-0.5" : "px-3 py-1"
                )}>
                    <Activity className={cn("text-blue-500 animate-pulse", isVerySmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
                    {!isVerySmall && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Canlı Analitik</span>}
                </div>
            </CardHeader>
            <CardContent className={cn(
                "flex-1 w-full min-h-0 flex flex-col",
                isShort || isVerySmall ? "p-2" : "p-4 sm:p-5"
            )}>
                <div className="h-full w-full flex-1 min-h-[200px]">
                    <SalesTrendChart data={salesTrend} />
                </div>
            </CardContent>
        </Card>
    );
}
