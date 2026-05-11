"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
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

export function StatCard({
    label,
    value,
    subValue,
    iconId,
    colorClass,
    bgClass,
    trend,
    badge,
    onClick,
    usdValue,
    defaultCurrency,
}: any) {
    const Icon = IconMap[iconId] || ShoppingCart;
    const showUSD = defaultCurrency === "USD" && usdValue !== undefined && usdValue !== null;

    const displayValue = showUSD
        ? `$${Number(usdValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : value;

    return (
        <Card
            onClick={onClick}
            className={cn(
                "rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/5 cursor-pointer active:scale-95 h-full"
            )}>
            <CardContent className="p-8 flex flex-col justify-between min-h-[220px] h-full relative z-10 font-sans">
                <Icon className="absolute -bottom-4 -right-4 h-32 w-32 opacity-[0.03] -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

                <div className="flex items-start justify-between relative">
                    <div className={cn(
                        "p-3.5 rounded-2xl border border-border/50 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                        bgClass
                    )}>
                        <Icon className={cn("h-7 w-7", colorClass)} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {showUSD && (
                            <span className="text-[10px] bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 text-blue-500 tracking-tighter uppercase font-bold">
                                USD
                            </span>
                        )}
                        {trend && !showUSD && (
                            <span className="text-[10px] bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-500 tracking-tighter uppercase">
                                {trend} Δ
                            </span>
                        )}
                        {badge && (
                            <span className={cn(
                                "text-[10px] px-3 py-1.5 rounded-full border border-border/50 tracking-tighter uppercase shadow-sm",
                                colorClass,
                                bgClass
                            )}>
                                {badge}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-8 relative">
                    <p className="text-[10px] mb-2 text-muted-foreground/60 tracking-[0.2em] uppercase">{label}</p>
                    <div className="flex items-baseline gap-2">
                        {typeof displayValue === 'string' && (displayValue.includes('₺') || displayValue.includes('$')) ? (
                            <RevealFinancial amount={displayValue} className={cn("text-4xl tracking-tight", colorClass)} />
                        ) : (
                            <h3 className={cn("text-5xl tracking-tighter", colorClass)}>{displayValue}</h3>
                        )}
                    </div>
                    {/* TL secondary value when USD mode is active */}
                    {showUSD && value && (
                        <p className="text-[11px] text-muted-foreground/40 mt-1.5 tracking-tight font-medium">
                            {value} TL karşılığı
                        </p>
                    )}
                    {/* Normal subValue */}
                    {!showUSD && subValue && (
                        <p className="text-[11px] text-muted-foreground/50 mt-2 tracking-tight">{subValue}</p>
                    )}
                    {/* subValue always shown below the TL line */}
                    {showUSD && subValue && (
                        <p className="text-[10px] text-muted-foreground/35 mt-0.5 tracking-tight">{subValue}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
