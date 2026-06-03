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
    isLoading
}: any) {
    const Icon = IconMap[iconId] || ShoppingCart;

    if (isLoading) {
        return (
            <div className="h-full w-full">
                <Card className="rounded-[1.5rem] bg-card/40 border border-border/20 h-full animate-pulse overflow-hidden">
                    <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div className="h-10 w-10 bg-muted/60 rounded-xl" />
                            <div className="h-5 w-12 bg-muted/40 rounded-full" />
                        </div>
                        <div className="space-y-3 mt-4">
                            <div className="h-3 w-16 bg-muted/30 rounded-md" />
                            <div className="h-8 w-24 bg-muted/50 rounded-lg" />
                            <div className="h-3 w-32 bg-muted/20 rounded-md" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const showUSD = defaultCurrency === "USD" && usdValue !== undefined && usdValue !== null;

    const displayValue = showUSD
        ? `$${Number(usdValue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : value;

    return (
        <div className="h-full w-full @container">
            <Card
                onClick={onClick}
                className={cn(
                    "rounded-[1.5rem] bg-card/60 backdrop-blur-xl border border-border/40 transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5 cursor-pointer active:scale-[0.98] h-full",
                    "@min-w-[400px]:rounded-[2rem]"
                )}>
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full relative z-10 font-sans">
                    <Icon className="absolute -bottom-2 -right-2 h-24 w-24 opacity-[0.02] -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

                    <div className="flex items-start justify-between relative">
                        <div className={cn(
                            "p-2.5 rounded-xl border border-border/50 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:rotate-3",
                            bgClass
                        )}>
                            <Icon className={cn("h-5 w-5", colorClass)} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {showUSD && (
                                <span className="text-[9px] bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 text-blue-500 tracking-tighter uppercase font-bold">
                                    USD
                                </span>
                            )}
                            {trend && !showUSD && (
                                <span className="text-[9px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-500 tracking-tighter uppercase font-bold">
                                    {trend}
                                </span>
                            )}
                            {badge && (
                                <span className={cn(
                                    "text-[9px] px-2.5 py-1 rounded-full border border-border/50 tracking-tighter uppercase font-bold shadow-sm",
                                    colorClass,
                                    bgClass
                                )}>
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 relative">
                        <p className="text-[9px] mb-1 text-muted-foreground/50 tracking-[0.15em] uppercase font-bold">{label}</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {outOfStockCount !== undefined ? (
                                <div className="flex items-baseline gap-2">
                                    <div className="flex flex-col items-start">
                                        <h3 className="text-2xl tracking-tighter font-black text-amber-500">{value}</h3>
                                        <span className="text-[7px] font-black uppercase tracking-widest text-amber-500/60">Kritik</span>
                                    </div>
                                    <div className="h-6 w-px bg-border/40 mx-1 self-center" />
                                    <div className="flex flex-col items-start">
                                        <h3 className="text-2xl tracking-tighter font-black text-rose-500">{outOfStockCount}</h3>
                                        <span className="text-[7px] font-black uppercase tracking-widest text-rose-500/60">Biten</span>
                                    </div>
                                </div>
                            ) : typeof displayValue === 'string' && (displayValue.includes('₺') || displayValue.includes('$')) ? (
                                <RevealFinancial
                                    amount={displayValue}
                                    prefix={displayValue.startsWith('$') || displayValue.startsWith('₺') ? "" : "₺"}
                                    className={cn("text-2xl tracking-tight font-bold", colorClass)}
                                />
                            ) : (
                                <h3 className={cn("text-2xl tracking-tighter font-black", colorClass)}>{displayValue}</h3>
                            )}

                            {showUSD && value && (
                                <p className="text-[10px] text-muted-foreground/30 tracking-tight font-medium pb-1 italic">
                                    ({value} TL)
                                </p>
                            )}
                        </div>

                        {!showUSD && subValue && (
                            <p className="text-[10px] text-muted-foreground/40 mt-1 tracking-tight font-medium leading-tight">{subValue}</p>
                        )}
                        {showUSD && subValue && (
                            <p className="text-[9px] text-muted-foreground/30 mt-0.5 tracking-tight font-medium leading-tight">{subValue}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
