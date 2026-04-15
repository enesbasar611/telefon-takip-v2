"use client";

import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { DollarSign, Euro, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CurrencyTicker() {
    const { rates } = useDashboardData();

    if (!rates) return null;

    const items = [
        { label: "USD", value: rates.usd, icon: DollarSign, color: "text-blue-500" },
        { label: "EUR", value: rates.eur, icon: Euro, color: "text-emerald-500" },
        { label: "ALTIN", value: rates.ga, icon: Coins, color: "text-amber-500" },
    ];

    return (
        <div className="flex items-center group overflow-hidden bg-muted/30 border border-border/40 rounded-full py-1.5 px-4 h-9 min-w-[150px] max-w-[400px]">
            <div className="flex items-center gap-6 animate-marquee whitespace-nowrap group-hover:pause">
                {/* Duplicate items for infinite effect */}
                {[...items, ...items].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">{item.label}</span>
                        <span className="text-[11px] font-black text-foreground">₺{item.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
