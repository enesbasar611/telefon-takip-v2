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

export function VeresiyeAnalysisSide({ aging, defaultCurrency }: VeresiyeAnalysisSideProps) {
    return (
        <div className="space-y-10">
            <Card className="border-none bg-muted/30 backdrop-blur-3xl shadow-2xl shadow-black/5 overflow-hidden rounded-[2.5rem] border border-border">
                <CardHeader className="px-8 pt-8 pb-4">
                    <CardTitle className="font-medium text-[10px] uppercase flex items-center gap-4 text-muted-foreground/80">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                        ANALİZ MERKEZİ
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-10 pt-4">
                    {[
                        { label: "0 - 30 GÜNLÜK", amount: aging['0-30'].amount, percent: aging['0-30'].percentage, color: "indigo" },
                        { label: "31 - 60 GÜNLÜK", amount: aging['31-60'].amount, percent: aging['31-60'].percentage, color: "amber" },
                        { label: "60 GÜN+ KRİTİK", amount: aging['60+'].amount, percent: aging['60+'].percentage, color: "rose" }
                    ].map((g, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-muted-foreground/80 uppercase">{g.label}</span>
                                <span className={cn("text-xs tabular-nums", `text-${g.color}-500 px-3 py-1 rounded-full bg-${g.color}-500/10 border border-${g.color}-500/10`)}>
                                    {defaultCurrency === 'USD' ? '$' : '₺'}{Math.round(g.amount).toLocaleString('tr-TR')}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${g.percent}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 + (i * 0.2) }}
                                    className={cn("h-full rounded-full relative overflow-hidden", `bg-${g.color}-500`)}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </motion.div>
                            </div>
                        </div>
                    ))}

                    <div className="p-6 bg-muted/20 rounded-[1.5rem] border border-border relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-500">
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 dark:opacity-5 transition-all duration-700">
                            <AlertCircle className="w-24 h-24 text-indigo-500 -rotate-12" />
                        </div>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed relative z-10 antialiased">
                            "{aging['60+'].percentage > 30 ? 'Dikkat seviyesi yüksek! Ödeme süresi geciken alacaklar nakit akışını zorlayabilir. ' : 'Portföy sağlığı stabil. 60 gün üzeri alacak payınız güvenli baremde. '} Mevcut risk oranı: %{Math.round(aging['60+'].percentage)}"
                        </p>
                    </div>
                </CardContent>
            </Card>

            <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="border-none bg-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.3)] text-white overflow-hidden rounded-[2.5rem] relative group cursor-pointer border border-border/50">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125">
                        <CalendarClock className="w-32 h-32 rotate-12" />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                    <CardHeader className="px-8 pt-10 pb-4">
                        <CardTitle className="font-medium text-[10px] uppercase flex items-center gap-3 opacity-90">
                            <TrendingDown className="w-4 h-4" />
                            AI PROJEKSİYON
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-12 pt-2">
                        <h3 className="font-medium text-2xl leading-tight mb-4 uppercase">Ay Sonu Tahsilat Öngörüsü</h3>
                        <p className="text-sm leading-relaxed opacity-80 antialiased">
                            Algoritmik analiz, toplam alacaklarınızın <span className="underline decoration-white/40 underline-offset-8">%{Math.max(10, 100 - Math.round(aging['60+'].percentage))}</span>'lik kısmının mevcut tahsilat ivmesiyle bu dönem içinde kasaya gireceğini öngörüyor.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
