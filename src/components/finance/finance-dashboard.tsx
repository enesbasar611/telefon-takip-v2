"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Scale, PiggyBank, Receipt } from "lucide-react";
import { RevealFinancial } from "@/components/ui/reveal-financial";

export function FinanceDashboard({ summary }: { summary: any }) {
    const posBankBalance = summary.bankBalance || 0;
    const nakitBalance = summary.cashBalance || 0;
    const bugunGelir = summary.todayIncome || 0;
    const bugunGider = summary.todayExpense || 0;

    const cards = [
        { label: "BUGÜNKÜ GELİR", value: bugunGelir, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Bugün yapılan toplam tahsilat" },
        { label: "BUGÜNKÜ GİDER", value: bugunGider, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", description: "Bugün yapılan toplam çıkış" },
        { label: "NAKİT & KASA", value: nakitBalance, icon: PiggyBank, color: "text-amber-500", bg: "bg-amber-500/10", description: "Nakit kasa hesaplarının toplamı" },
        { label: "BANKA & POS", value: posBankBalance, icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10", description: "Banka ve Sanal POS bakiyeleri" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((stat, i) => (
                    <Card key={i} className="border-zinc-200 dark:border-zinc-800 shadow-sm group overflow-hidden relative bg-card/50 backdrop-blur-sm rounded-[2.5rem]">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-[0.03] rounded-full bg-foreground group-hover:opacity-[0.06] transition-opacity" />
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border border-current/10`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <Badge variant="outline" className="text-[9px]  tracking-widest uppercase px-3 py-1 bg-background rounded-full border-zinc-200 dark:border-zinc-800">GÜNCEL DURUM</Badge>
                            </div>
                            <p className="text-[10px]  text-muted-foreground tracking-[0.2em] uppercase mb-1 opacity-60">{stat.label}</p>
                            <div className="mt-1 flex items-baseline gap-2">
                                <RevealFinancial amount={stat.value} className="text-4xl  tracking-tighter" />
                            </div>
                            <p className="text-[11px] text-muted-foreground  mt-4 leading-relaxed opacity-80">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}



