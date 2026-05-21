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
    outOfStockCount,
}: any) {
    const Icon = IconMap[iconId] || ShoppingCart;
    const showUSD = defaultCurrency === "USD" && usdValue !== undefined && usdValue !== null;

    const displayValue = showUSD
        ? `$${Number(usdValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : value;

    return (
        <div className="h-full w-full @container">
            <Card
                onClick={onClick}
                className={cn(
                    "rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/5 cursor-pointer active:scale-95 h-full",
                    "@min-w-[400px]:rounded-[3rem]"
                )}>
                <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full relative z-10 font-sans">
                    <Icon className="absolute -bottom-1 -right-1 h-20 w-20 opacity-[0.03] -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

                    <div className="flex items-start justify-between relative">
                        <div className={cn(
                            "p-3 rounded-2xl border border-border/50 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                            bgClass
                        )}>
                            <Icon className={cn("h-6 w-6", colorClass)} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {showUSD && (
                                <span className="text-[min(2.5cqw,10px)] @min-w-[300px]:text-[10px] bg-blue-500/10 px-[2cqw] py-[1cqw] @min-w-[300px]:px-3 @min-w-[300px]:py-1.5 rounded-full border border-blue-500/20 text-blue-500 tracking-tighter uppercase font-bold">
                                    USD
                                </span>
                            )}
                            {trend && !showUSD && (
                                <span className="text-[min(2.5cqw,10px)] @min-w-[300px]:text-[10px] bg-emerald-500/10 px-[2cqw] py-[1cqw] @min-w-[300px]:px-3 @min-w-[300px]:py-1.5 rounded-full border border-emerald-500/20 text-emerald-500 tracking-tighter uppercase">
                                    {trend} Δ
                                </span>
                            )}
                            {badge && (
                                <span className={cn(
                                    "text-[min(2.5cqw,10px)] @min-w-[300px]:text-[10px] px-[2cqw] py-[1cqw] @min-w-[300px]:px-3 @min-w-[300px]:py-1.5 rounded-full border border-border/50 tracking-tighter uppercase shadow-sm",
                                    colorClass,
                                    bgClass
                                )}>
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 relative">
                        <p className="text-[10px] mb-1.5 text-muted-foreground/60 tracking-[0.2em] uppercase font-semibold">{label}</p>
                        <div className="flex items-baseline gap-3 flex-wrap">
                            {outOfStockCount !== undefined ? (
                                <div className="flex items-baseline gap-4">
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-4xl tracking-tighter font-black text-amber-500">{value}</h3>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 mt-1">Kritik</span>
                                    </div>
                                    <div className="h-10 w-px bg-border/60 mx-1" />
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-4xl tracking-tighter font-black text-rose-500">{outOfStockCount}</h3>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-500 mt-1">Biten</span>
                                    </div>
                                </div>
                            ) : typeof displayValue === 'string' && (displayValue.includes('₺') || displayValue.includes('$')) ? (
                                <RevealFinancial
                                    amount={displayValue}
                                    prefix={displayValue.startsWith('$') || displayValue.startsWith('₺') ? "" : "₺"}
                                    className={cn("text-3xl tracking-tight font-bold", colorClass)}
                                />
                            ) : (
                                <h3 className={cn("text-4xl tracking-tighter font-black", colorClass)}>{displayValue}</h3>
                            )}

                            {/* TL secondary value when USD mode is active - Moved next to value */}
                            {showUSD && value && (
                                <p className="text-[11px] text-muted-foreground/30 tracking-tight font-medium pb-1.5 italic">
                                    ({value} TL)
                                </p>
                            )}
                        </div>
                        {/* Normal subValue */}
                        {!showUSD && subValue && (
                            <p className="text-[min(2.5cqw,11px)] @min-w-[300px]:text-[11px] text-muted-foreground/50 mt-[1cqh] @min-w-[300px]:mt-2 tracking-tight">{subValue}</p>
                        )}
                        {/* subValue always shown below the TL line */}
                        {showUSD && subValue && (
                            <p className="text-[min(2cqw,10px)] @min-w-[300px]:text-[10px] text-muted-foreground/35 mt-0.5 tracking-tight">{subValue}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
