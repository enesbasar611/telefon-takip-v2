"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    ArrowUpRight,
    Target
} from "lucide-react";
import { motion } from "framer-motion";

export function FinanceSummary({ stats }: { stats: any }) {
    const s = stats || {};

    const financialMetrics = [
        {
            label: "Nakit Satışlar",
            value: s.cashSales || 0,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            trend: "+3.2%",
            isUp: true
        },
        {
            label: "Kredi Kartı",
            value: s.cardSales || 0,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            trend: "+8.5%",
            isUp: true
        },
        {
            label: "Veresiye/Borç",
            value: s.debtSales || 0,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            trend: "-1.2%",
            isUp: false
        }
    ];

    return (
        <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-500" />
                    Finansal Özet
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    {financialMetrics.map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-white/5 group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-11 w-11 rounded-2xl ${metric.bg} ${metric.color} flex items-center justify-center shadow-sm`}>
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{metric.label}</h4>
                                    <p className="text-lg font-black text-foreground">₺{metric.value.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${metric.isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                    } flex items-center gap-1`}>
                                    {metric.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {metric.trend}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-[2rem] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Target className="w-20 h-20" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Hedef İlerlemesi</p>
                        <div className="flex justify-between items-end mt-2">
                            <h3 className="text-2xl font-black">74%</h3>
                            <span className="text-[10px] font-bold opacity-60 uppercase">Eylul Hedefi</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '74%' }}></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
