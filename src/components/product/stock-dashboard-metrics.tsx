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
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { Card } from "@/components/ui/card";

interface StockStats {
    totalValue: number;
    potentialProfit: number;
    criticalCount: number;
    outOfStockCount: number;
    totalItems: number;
}

export function StockDashboardMetrics({ stats }: { stats: StockStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Inventory Value - Large Card */}
            <Card className="md:col-span-2 relative overflow-hidden bg-rose-500/5 border-rose-500/30 p-6 matte-card">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Package className="h-32 w-32 text-rose-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-rose-500" />
                        </div>
                        <span className="text-[10px] text-rose-500 tracking-wider">TOPLAM STOK MALİYETİ</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <RevealFinancial
                                amount={stats.totalValue}
                                className="text-4xl text-rose-500 tracking-tight"
                            />
                        </div>
                        <p className="text-[10px] text-rose-500/80 mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-rose-500" />
                            Şu anki dükkan mal varlığı değeri
                        </p>
                    </div>
                </div>
            </Card>

            {/* Potential Profit and Stats Column */}
            <Card className="bg-card/40 border-border/50 p-6 relative overflow-hidden matte-card">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-[10px]  text-muted-foreground/80 tracking-wider">BEKLENEN KÂR</span>
                </div>
                <div className="flex flex-col">
                    <RevealFinancial
                        amount={stats.potentialProfit}
                        className="text-2xl text-foreground tracking-tight"
                    />
                    <div className="flex items-center gap-1 mt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-500/80  uppercase">Satış Odaklı Kâr</span>
                    </div>
                </div>
                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-sky-500" />
                            <span className="text-[10px]  text-muted-foreground/80">TOPLAM ADET</span>
                        </div>
                        <span className="text-xl text-foreground font-black">{stats.totalItems}</span>
                    </div>
                </div>
            </Card>

            {/* Stock Alerts Column */}
            <div className="flex flex-col gap-4">
                {/* Out of Stock (Bitenler) */}
                <Link href="/stok?outOfStock=true" className="flex-1">
                    <Card className={`h-full p-4 matte-card border transition-all hover:border-rose-500/50 hover:bg-rose-500/10 cursor-pointer ${stats.outOfStockCount > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-card/40 border-border/50'}`}>
                        <div className="flex items-center justify-between h-full">
                            <div className="flex items-center gap-2">
                                <AlertCircle className={`h-4 w-4 ${stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-muted-foreground/80'}`} />
                                <span className="text-[10px]  text-muted-foreground/80  uppercase">Bitenler</span>
                            </div>
                            <span className={`text-xl font-black ${stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-foreground'}`}>
                                {stats.outOfStockCount}
                            </span>
                        </div>
                    </Card>
                </Link>

                {/* Critical Stock */}
                <Link href="/stok?isCritical=true" className="flex-1">
                    <Card className={`h-full p-4 matte-card border transition-all hover:border-orange-500/50 hover:bg-orange-500/10 cursor-pointer ${stats.criticalCount > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-card/40 border-border/50'}`}>
                        <div className="flex items-center justify-between h-full">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className={`h-4 w-4 ${stats.criticalCount > 0 ? 'text-orange-500' : 'text-muted-foreground/80'}`} />
                                <span className="text-[10px]  text-muted-foreground/80  uppercase">Kritik Stok</span>
                            </div>
                            <span className={`text-xl font-black ${stats.criticalCount > 0 ? 'text-orange-500' : 'text-foreground'}`}>
                                {stats.criticalCount}
                            </span>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
