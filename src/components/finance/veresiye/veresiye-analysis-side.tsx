"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SlidersHorizontal, AlertCircle, CalendarClock, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface VeresiyeAnalysisSideProps {
    aging: {
        '0-30': { amount: number; percentage: number };
        '31-60': { amount: number; percentage: number };
        '60+': { amount: number; percentage: number };
    };
    defaultCurrency: string;
}

const colorMap = {
    indigo: {
        text: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        bar: "bg-indigo-500",
    },
    amber: {
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        bar: "bg-amber-500",
    },
    rose: {
        text: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        bar: "bg-rose-500",
    },
};

export function VeresiyeAnalysisSide({ aging, defaultCurrency }: VeresiyeAnalysisSideProps) {
    const agingGroups: {
        label: string;
        amount: number;
        percent: number;
        color: "indigo" | "amber" | "rose";
    }[] = [
        { label: "0 - 30 Günlük", amount: aging['0-30'].amount, percent: aging['0-30'].percentage, color: "indigo" },
        { label: "31 - 60 Günlük", amount: aging['31-60'].amount, percent: aging['31-60'].percentage, color: "amber" },
        { label: "60+ Gün (Kritik)", amount: aging['60+'].amount, percent: aging['60+'].percentage, color: "rose" }
    ];

    return (
        <div className="space-y-3.5 sm:space-y-4">
            {/* Risk & Aging Breakdown Card */}
            <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-xs overflow-hidden">
                <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/40">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Analiz Merkezi</span>
                    </CardTitle>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/60 px-2 py-0.5 rounded-md">Yaşlandırma</span>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {agingGroups.map((g, i) => {
                        const scheme = colorMap[g.color];
                        return (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[11px] font-semibold text-muted-foreground">{g.label}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md border", scheme.text, scheme.bg, scheme.border)}>
                                            {defaultCurrency === 'USD' ? '$' : '₺'}{Math.round(g.amount).toLocaleString('tr-TR')}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-8 text-right">
                                            %{Math.round(g.percent)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden p-[1px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, Math.max(0, g.percent))}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + (i * 0.1) }}
                                        className={cn("h-full rounded-full relative overflow-hidden", scheme.bar)}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="p-3 bg-muted/30 rounded-xl border border-border/50 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                        <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <AlertCircle className="w-16 h-16 text-indigo-500 -rotate-12" />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed relative z-10">
                            {aging['60+'].percentage > 30
                                ? '⚠️ Dikkat seviyesi yüksek: 60 gün üzeri alacaklar nakit akışını zorlayabilir.'
                                : '✅ Portföy sağlığı stabil: 60 gün üzeri alacak payınız güvenli baremde.'}{" "}
                            <span className="font-bold text-foreground">Risk oranı: %{Math.round(aging['60+'].percentage)}</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* AI Projection Card */}
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Card className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 shadow-md text-white p-4 sm:p-5 relative overflow-hidden group cursor-default">
                    <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-15 transition-all duration-500 group-hover:scale-110 pointer-events-none">
                        <CalendarClock className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>AI Projeksiyon</span>
                        </div>
                        <h3 className="font-bold text-base leading-snug">Ay Sonu Tahsilat Öngörüsü</h3>
                        <p className="text-xs leading-relaxed text-indigo-100/85">
                            Toplam alacaklarınızın <strong className="text-white underline decoration-white/40 underline-offset-4">%{Math.max(10, 100 - Math.round(aging['60+'].percentage))}</strong>'lik kısmının mevcut tahsilat ivmesiyle bu dönem içinde kasaya gireceği öngörülüyor.
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
