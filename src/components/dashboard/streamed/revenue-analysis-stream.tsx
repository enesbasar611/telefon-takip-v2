import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { getSalesReport } from "@/lib/actions/report-actions";
import { getProfitMatrix } from "@/lib/actions/analytics-actions";
import { serializePrisma } from "@/lib/utils";

export async function RevenueAnalysisStream() {
    const [salesTrendRaw, profitMatrixRaw] = await Promise.all([
        getSalesReport(),
        getProfitMatrix("THIS_MONTH")
    ]);

    const salesTrend = serializePrisma(salesTrendRaw);
    const profitMatrix = serializePrisma(profitMatrixRaw);

    return (
        <Card className="lg:col-span-2 shadow-xl border-border/40 overflow-hidden group w-full bg-card rounded-[2rem] animate-in fade-in duration-1000">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 p-8 bg-muted/5">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="font-medium text-xl  tracking-tight font-sans uppercase">Gelir Analizi</CardTitle>
                        <p className="text-xs text-muted-foreground  opacity-70 uppercase tracking-wider">Son 30 Günlük Performans</p>
                    </div>
                    <div className="h-10 w-px bg-border/40 hidden md:block" />
                    <div className="hidden md:flex gap-10">
                        <div className="flex flex-col">
                            <span className="text-[9px]  text-muted-foreground/60 tracking-[0.2em] mb-1 uppercase">Brüt Gelir</span>
                            <span className="text-lg  text-foreground tracking-tight">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px]  text-muted-foreground/60 tracking-[0.2em] mb-1 uppercase">Net Kâr</span>
                            <span className="text-lg  text-secondary tracking-tight">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20">
                    <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="text-[10px]  text-blue-500 uppercase tracking-tighter">Canlı Analitik</span>
                </div>
            </CardHeader>
            <CardContent className="p-8 w-full">
                <SalesTrendChart data={salesTrend} />
            </CardContent>
        </Card>
    );
}




