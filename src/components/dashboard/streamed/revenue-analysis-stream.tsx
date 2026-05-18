"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { getSalesReport } from "@/lib/actions/report-actions";
import { getProfitMatrix } from "@/lib/actions/analytics-actions";
import { serializePrisma, cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function RevenueAnalysisStream({ cols = 12, rows = 4 }: { cols?: number, rows?: number }) {
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
            return {
                salesTrend: serializePrisma(salesTrendRaw),
                profitMatrix: serializePrisma(profitMatrixRaw)
            };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card rounded-[2.5rem] animate-pulse" />;

    const { salesTrend, profitMatrix } = data || { salesTrend: [], profitMatrix: { totalRevenue: 0, totalNetProfit: 0 } };

    return (
        <Card className="h-full flex flex-col shadow-xl border-border/40 overflow-hidden group w-full bg-card rounded-[2rem] animate-in fade-in duration-1000">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 bg-muted/5",
                isShort || isVerySmall ? "p-4 py-3" : "p-8 pb-6"
            )}>
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex flex-col gap-1">
                        <CardTitle className={cn(
                            "font-medium tracking-tight font-sans uppercase",
                            isVerySmall ? "text-sm" : "text-xl"
                        )}>Gelir Analizi</CardTitle>
                        {!isShort && !isVerySmall && <p className="text-xs text-muted-foreground opacity-70 uppercase tracking-wider">Son 30 Günlük Performans</p>}
                    </div>
                    {!isVerySmall && !isShort && (
                        <>
                            <div className="h-10 w-px bg-border/40 hidden md:block" />
                            <div className="hidden md:flex gap-10">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground/60 tracking-[0.2em] mb-1 uppercase">Brüt Gelir</span>
                                    <span className="text-lg text-foreground tracking-tight">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground/60 tracking-[0.2em] mb-1 uppercase">Net Kâr</span>
                                    <span className="text-lg text-secondary tracking-tight">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className={cn(
                    "flex items-center gap-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20",
                    isVerySmall ? "px-2 py-1" : "px-4 py-2"
                )}>
                    <Activity className={cn("text-blue-500 animate-pulse", isVerySmall ? "h-3 w-3" : "h-4 w-4")} />
                    {!isVerySmall && <span className="text-[10px] text-blue-500 uppercase tracking-tighter">Canlı Analitik</span>}
                </div>
            </CardHeader>
            <CardContent className={cn(
                "flex-1 w-full min-h-0",
                isShort || isVerySmall ? "p-2" : "p-8"
            )}>
                <div className="h-full w-full">
                    <SalesTrendChart data={salesTrend} />
                </div>
            </CardContent>
        </Card>
    );
}




