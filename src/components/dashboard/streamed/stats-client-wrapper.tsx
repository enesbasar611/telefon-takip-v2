"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
import { StatType, StatDetailModal } from "../modals/stat-detail-modal";
import {
    Wrench,
    ShoppingCart,
    Wallet,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Banknote,
    ArrowDownCircle
} from "lucide-react";

const IconMap: Record<string, any> = {
    Wrench,
    ShoppingCart,
    Wallet,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Banknote,
    ArrowDownCircle
};

export function StatsClientWrapper({ stats, statTypes, statsData }: any) {
    const [selectedStat, setSelectedStat] = useState<StatType | null>(null);

    return (
        <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {stats.map((stat: any, idx: number) => {
                    const Icon = IconMap[stat.iconId] || ShoppingCart;
                    return (
                        <Card key={idx}
                            onClick={() => setSelectedStat(statTypes[stat.label])}
                            className={cn(
                                "rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/5 cursor-pointer active:scale-95"
                            )}>
                            <CardContent className="p-8 flex flex-col justify-between min-h-[220px] relative z-10 font-sans">
                                <Icon className="absolute -bottom-4 -right-4 h-32 w-32 opacity-[0.03] -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

                                <div className="flex items-start justify-between relative">
                                    <div className={cn(
                                        "p-3.5 rounded-2xl border border-white/5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                                        stat.bgClass
                                    )}>
                                        <Icon className={cn("h-7 w-7", stat.colorClass)} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {stat.trend && (
                                            <span className="text-[10px] font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-500 tracking-tighter uppercase">
                                                {stat.trend} Δ
                                            </span>
                                        )}
                                        {stat.badge && (
                                            <span className={cn(
                                                "text-[10px] font-bold px-3 py-1.5 rounded-full border border-border/50 tracking-tighter uppercase shadow-sm",
                                                stat.colorClass,
                                                stat.bgClass
                                            )}>
                                                {stat.badge}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 relative">
                                    <p className="text-[10px] font-bold mb-2 text-muted-foreground/60 tracking-[0.2em] uppercase">{stat.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                                            <RevealFinancial amount={stat.value} className={cn("text-4xl font-bold tracking-tight", stat.colorClass)} />
                                        ) : (
                                            <h3 className={cn("text-5xl font-bold tracking-tighter", stat.colorClass)}>{stat.value}</h3>
                                        )}
                                    </div>
                                    {stat.subValue && (
                                        <p className="text-[11px] font-bold text-muted-foreground/50 mt-2 tracking-tight">{stat.subValue}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <StatDetailModal
                type={selectedStat}
                isOpen={selectedStat !== null}
                onClose={() => setSelectedStat(null)}
                statsData={statsData}
            />
        </>
    );
}
