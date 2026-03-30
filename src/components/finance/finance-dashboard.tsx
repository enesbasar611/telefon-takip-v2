"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Scale, PiggyBank, Receipt } from "lucide-react";
import { RevealFinancial } from "@/components/ui/reveal-financial";

export function FinanceDashboard({ summary }: { summary: any }) {
    const mainStats = [
        { label: "NET VARLIK", value: summary.netAssets, icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10", description: "Kasa + Banka + Alacaklar - Borçlar" },
        { label: "TOPLAM ALACAK", value: summary.totalReceivables, icon: PiggyBank, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Müşterilerden beklenen ödemeler" },
        { label: "TOPLAM BORÇ", value: summary.totalPayables, icon: Receipt, color: "text-rose-500", bg: "bg-rose-500/10", description: "Tedarikçilere yapılacak ödemeler" },
    ];

    const incomeStats = [
        { label: "TOPLAM GELİR", value: summary.totalIncome, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "TOPLAM GİDER", value: summary.totalExpense, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {mainStats.map((stat, i) => (
                    <Card key={i} className="border-border/40 shadow-sm group overflow-hidden relative bg-card/50 backdrop-blur-sm rounded-[2.5rem]">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-[0.03] rounded-full bg-foreground group-hover:opacity-[0.06] transition-opacity" />
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border border-current/10`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase px-3 py-1 bg-background rounded-full border-border/40">GÜNCEL DURUM</Badge>
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase mb-1 opacity-60">{stat.label}</p>
                            <div className="mt-1 flex items-baseline gap-2">
                                <RevealFinancial amount={stat.value} className="text-4xl font-black tracking-tighter" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-4 leading-relaxed opacity-80">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
                <div className="lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {incomeStats.map((stat, i) => (
                        <Card key={i} className="border-border/40 bg-card/30 rounded-[2rem] overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-2 opacity-60">{stat.label}</p>
                                        <RevealFinancial amount={stat.value} className="text-2xl font-black tracking-tight" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="lg:col-span-3">
                    {/* Placeholder for future trends or charts */}
                </div>
            </div>
        </div>
    );
}
