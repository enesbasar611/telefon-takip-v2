"use client";

import {
    Package,
    TrendingUp,
    AlertTriangle,
    AlertCircle,
    Layers,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { Card } from "@/components/ui/card";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

interface StockStats {
    totalValue: number;
    totalValueUsd?: number;
    potentialProfit: number;
    potentialProfitUsd?: number;
    criticalCount: number;
    outOfStockCount: number;
    totalItems: number;
}

export function StockDashboardMetrics({ stats }: { stats: StockStats }) {
    const searchParams = useSearchParams();
    const isOutOfStockActive = searchParams.get("outOfStock") === "true";
    const isCriticalActive = searchParams.get("isCritical") === "true";

    const { defaultCurrency = "TRY", rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;
    const isUSD = defaultCurrency === "USD";
    const symbol = isUSD ? "$" : "₺";

    const displayTotalValue = isUSD 
        ? (stats.totalValueUsd !== undefined && Number(stats.totalValueUsd) > 0 ? Number(stats.totalValueUsd) : (Number(stats.totalValue || 0) / usdRate))
        : Number(stats.totalValue || 0);

    const displayPotentialProfit = isUSD
        ? (stats.potentialProfitUsd !== undefined && Number(stats.potentialProfitUsd) > 0 ? Number(stats.potentialProfitUsd) : (Number(stats.potentialProfit || 0) / usdRate))
        : Number(stats.potentialProfit || 0);

    const getOutOfStockUrl = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (isOutOfStockActive) {
            params.delete("outOfStock");
        } else {
            params.set("outOfStock", "true");
            params.delete("isCritical");
        }
        params.set("page", "1");
        const qs = params.toString();
        return qs ? `/stok?${qs}` : "/stok";
    };

    const getCriticalStockUrl = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (isCriticalActive) {
            params.delete("isCritical");
        } else {
            params.set("isCritical", "true");
            params.delete("outOfStock");
        }
        params.set("page", "1");
        const qs = params.toString();
        return qs ? `/stok?${qs}` : "/stok";
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
            {/* Total Inventory Value - Large Card */}
            <Card className="col-span-2 relative overflow-hidden bg-rose-500/5 border-rose-500/30 p-4 sm:p-6 matte-card">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Package className="h-32 w-32 text-rose-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-rose-500 tracking-wider font-bold">TOPLAM STOK MALİYETİ</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <RevealFinancial
                                amount={displayTotalValue}
                                prefix={symbol}
                                decimals={2}
                                className="text-2xl sm:text-4xl text-rose-500 tracking-tight font-black"
                            />
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-rose-500/80 mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 text-rose-500" />
                            <span>Şu anki dükkan mal varlığı değeri</span>
                            {isUSD && (
                                <span className="font-bold text-rose-400/90 ml-1">
                                    (₺{Number(stats.totalValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Potential Profit and Stats Column */}
            <Card className="col-span-1 bg-card/40 border-border/50 p-3.5 sm:p-6 relative overflow-hidden matte-card">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground/80 tracking-wider truncate font-bold">BEKLENEN KÂR</span>
                </div>
                <div className="flex flex-col">
                    <RevealFinancial
                        amount={displayPotentialProfit}
                        prefix={symbol}
                        decimals={2}
                        className="text-lg sm:text-2xl text-foreground tracking-tight font-black"
                    />
                    <div className="flex flex-wrap items-center gap-1 mt-1.5 sm:mt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] sm:text-[10px] text-emerald-500/80 uppercase font-semibold">Satış Kârı</span>
                        {isUSD && (
                            <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground/80 ml-1">
                                (₺{Number(stats.potentialProfit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                        )}
                    </div>
                </div>
                <div className="mt-auto pt-4 sm:pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500" />
                            <span className="text-[8px] sm:text-[10px] text-muted-foreground/80 font-bold">ADET</span>
                        </div>
                        <span className="text-base sm:text-xl text-foreground font-black">{stats.totalItems}</span>
                    </div>
                </div>
            </Card>

            {/* Stock Alerts Column */}
            <div className="col-span-1 flex flex-col gap-2.5 sm:gap-4">
                {/* Out of Stock (Bitenler) */}
                <Link href={getOutOfStockUrl()} className="flex-1">
                    <Card className={`h-full p-4 matte-card border transition-all hover:border-rose-500/50 hover:bg-rose-500/10 cursor-pointer ${
                        isOutOfStockActive
                            ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 shadow-sm'
                            : stats.outOfStockCount > 0
                                ? 'bg-rose-500/5 border-rose-500/20'
                                : 'bg-card/40 border-border/50'
                    }`}>
                        <div className="flex items-center justify-between h-full">
                            <div className="flex items-center gap-2">
                                <AlertCircle className={`h-4 w-4 ${isOutOfStockActive || stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-muted-foreground/80'}`} />
                                <span className={`text-[10px] uppercase font-bold ${isOutOfStockActive ? 'text-rose-500 font-black' : 'text-muted-foreground/80'}`}>Bitenler</span>
                            </div>
                            <span className={`text-xl font-black ${isOutOfStockActive || stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-foreground'}`}>
                                {stats.outOfStockCount}
                            </span>
                        </div>
                    </Card>
                </Link>

                {/* Critical Stock */}
                <Link href={getCriticalStockUrl()} className="flex-1">
                    <Card className={`h-full p-4 matte-card border transition-all hover:border-orange-500/50 hover:bg-orange-500/10 cursor-pointer ${
                        isCriticalActive
                            ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/40 shadow-sm'
                            : stats.criticalCount > 0
                                ? 'bg-orange-500/5 border-orange-500/20'
                                : 'bg-card/40 border-border/50'
                    }`}>
                        <div className="flex items-center justify-between h-full">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className={`h-4 w-4 ${isCriticalActive || stats.criticalCount > 0 ? 'text-orange-500' : 'text-muted-foreground/80'}`} />
                                <span className={`text-[10px] uppercase font-bold ${isCriticalActive ? 'text-orange-500 font-black' : 'text-muted-foreground/80'}`}>Kritik Stok</span>
                            </div>
                            <span className={`text-xl font-black ${isCriticalActive || stats.criticalCount > 0 ? 'text-orange-500' : 'text-foreground'}`}>
                                {stats.criticalCount}
                            </span>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
