"use client";

import {
    Package,
    TrendingUp,
    AlertTriangle,
    Layers,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { Card } from "@/components/ui/card";

interface StockStats {
    totalValue: number;
    potentialProfit: number;
    criticalCount: number;
    totalItems: number;
}

export function StockDashboardMetrics({ stats }: { stats: StockStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Inventory Value - Large Card */}
            <Card className="md:col-span-2 relative overflow-hidden bg-slate-900/40 border-slate-800/50 p-6 matte-card">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Package className="h-32 w-32 text-blue-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider">TOPLAM STOK MALİYETİ</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <RevealFinancial
                                amount={stats.totalValue}
                                className="text-4xl font-black text-white tracking-tight"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            Şu anki dükkan mal varlığı değeri
                        </p>
                    </div>
                </div>
            </Card>

            {/* Potential Profit */}
            <Card className="bg-slate-900/40 border-slate-800/50 p-6 relative overflow-hidden matte-card">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">BEKLENEN KÂR</span>
                </div>
                <div className="flex flex-col">
                    <RevealFinancial
                        amount={stats.potentialProfit}
                        className="text-2xl font-black text-white tracking-tight"
                    />
                    <div className="flex items-center gap-1 mt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-500/80 font-bold uppercase">Satış Odaklı Kâr</span>
                    </div>
                </div>
            </Card>

            {/* Item Count & Critical Status - Stacked in one column space or separate */}
            <div className="flex flex-col gap-4">
                <Card className="flex-1 bg-slate-900/40 border-slate-800/50 p-4 matte-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-orange-500" />
                            <span className="text-[10px] font-bold text-slate-500">TOPLAM ÜRÜN</span>
                        </div>
                        <span className="text-xl font-black text-white">{stats.totalItems}</span>
                    </div>
                </Card>

                <Card className={`flex-1 p-4 matte-card border ${stats.criticalCount > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900/40 border-slate-800/50'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${stats.criticalCount > 0 ? 'text-rose-500' : 'text-slate-500'}`} />
                            <span className="text-[10px] font-bold text-slate-500 font-bold uppercase">Kritik Stok</span>
                        </div>
                        <span className={`text-xl font-black ${stats.criticalCount > 0 ? 'text-rose-500' : 'text-white'}`}>
                            {stats.criticalCount}
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
