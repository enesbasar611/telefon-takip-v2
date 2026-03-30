"use client";

import { useMemo } from "react";
import { Folder, TrendingUp, Coins } from "lucide-react";
import { RevealFinancial } from "@/components/ui/reveal-financial";

interface CategorySummaryCardsProps {
    products: any[];
    categories: any[];
}

export function CategorySummaryCards({ products, categories }: CategorySummaryCardsProps) {
    const categoryStats = useMemo(() => {
        const stats: Record<string, { count: number; cost: number; profit: number; name: string }> = {};

        categories.forEach(cat => {
            stats[cat.id] = { count: 0, cost: 0, profit: 0, name: cat.name };
        });

        products.forEach(p => {
            if (stats[p.categoryId]) {
                stats[p.categoryId].count += p.stock;
                stats[p.categoryId].cost += (Number(p.buyPrice) || 0) * p.stock;
                stats[p.categoryId].profit += ((Number(p.sellPrice) || 0) - (Number(p.buyPrice) || 0)) * p.stock;
            }
        });

        // Sadece stokta ürünü olan kategorileri göster ve ürün sayısına göre büyükten küçüğe sırala
        return Object.values(stats)
            .filter(s => s.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [products, categories]);

    if (categoryStats.length === 0) return null;

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scroll scrollbar-hide">
            {categoryStats.map((stat, idx) => (
                <div
                    key={idx}
                    className="min-w-[280px] bg-white/[0.02] border border-white/5 p-5 rounded-2xl shrink-0 snap-center hover:bg-white/[0.04] transition-colors relative overflow-hidden group"
                >
                    {/* Subtle gradient hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                <Folder className="h-4 w-4" />
                            </div>
                            <h3 className="text-[14px] font-semibold text-slate-200">{stat.name}</h3>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-medium text-slate-300 shadow-inner">
                            {stat.count} Adet
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-black/20 border border-white/5">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Coins className="h-3 w-3" />
                                <span className="text-[9px] uppercase font-semibold tracking-wider">Maliyet</span>
                            </div>
                            <RevealFinancial amount={stat.cost} className="text-[13px] font-medium text-slate-300" />
                        </div>

                        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-center gap-1.5 text-emerald-500/80">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-[9px] uppercase font-semibold tracking-wider">Beklenen Kâr</span>
                            </div>
                            <RevealFinancial amount={stat.profit} className="text-[13px] font-semibold text-emerald-400" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
