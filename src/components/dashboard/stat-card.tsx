"use client";
import { useMemo } from "react";

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
    ArrowDownCircle,
    Smartphone,
    CreditCard,
    Activity,
    TrendingUp
} from "lucide-react";

const IconMap: Record<string, any> = {
    Wrench,
    ShoppingCart,
    Wallet,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Banknote,
    ArrowDownCircle,
    Smartphone,
    CreditCard,
    Activity,
    TrendingUp
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

    const isUSD = defaultCurrency === "USD";
    const hasUSD = usdValue !== undefined && usdValue !== null;
    const hasTRY = value !== undefined && value !== null;

    const formatTRY = (val: any) => {
        const num = typeof val === 'string' ? Number(val.replace('₺', '').replace(/\./g, '').replace(',', '.')) : Number(val);
        if (isNaN(num)) return val;
        return `₺${num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatUSD = (val: any) => {
        const num = Number(val);
        if (isNaN(num)) return val;
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isCurrency = hasUSD;
    const mainDisplay = isCurrency
        ? (isUSD && hasUSD ? formatUSD(usdValue) : formatTRY(value))
        : value;
    const secondaryDisplay = isCurrency
        ? (isUSD ? (hasTRY ? formatTRY(value) : null) : (hasUSD ? formatUSD(usdValue) : null))
        : null;

    const { styles, isVibrant } = useMemo(() => {
        if (colorClass.includes("primary")) return { styles: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-500/20", isVibrant: true };
        if (colorClass.includes("secondary")) return { styles: "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-xl shadow-purple-500/20", isVibrant: true };
        if (colorClass.includes("blue-500")) return { styles: "bg-gradient-to-br from-sky-500 to-blue-700 text-white border-none shadow-xl shadow-blue-500/20", isVibrant: true };
        if (colorClass.includes("amber-500")) return { styles: "bg-gradient-to-br from-orange-400 to-amber-600 text-white border-none shadow-xl shadow-orange-500/20", isVibrant: true };
        if (colorClass.includes("emerald-500")) return { styles: "bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-none shadow-xl shadow-emerald-500/20", isVibrant: true };
        if (colorClass.includes("rose-500")) return { styles: "bg-gradient-to-br from-rose-500 to-pink-600 text-white border-none shadow-xl shadow-rose-500/20", isVibrant: true };
        if (colorClass.includes("indigo-500")) return { styles: "bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-500/20", isVibrant: true };
        return { styles: "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5", isVibrant: false };
    }, [colorClass]);

    return (
        <div className="h-full w-full @container">
            <Card
                onClick={onClick}
                className={cn(
                    "rounded-[1.5rem] transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-sm hover:shadow-2xl cursor-pointer active:scale-[0.98] h-full border-none",
                    styles,
                    "@min-w-[400px]:rounded-[2rem]"
                )}>
                <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full relative z-10 font-sans">
                    <Icon className={cn(
                        "absolute -bottom-4 -right-4 h-32 w-32 -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110",
                        isVibrant ? "opacity-10 text-white" : "opacity-[0.02]"
                    )} />

                    <div className="flex items-start justify-between relative">
                        <div className={cn(
                            "p-3 rounded-2xl border shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                            isVibrant ? "bg-white/20 border-white/10 text-white" : cn("border-border/50", bgClass)
                        )}>
                            <Icon className={cn("h-6 w-6", isVibrant ? "text-white" : colorClass)} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {isUSD && (
                                <span className={cn(
                                    "text-[9px] px-2.5 py-1 rounded-full border tracking-tighter uppercase font-bold",
                                    isVibrant ? "bg-white/20 border-white/20 text-white" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                )}>
                                    USD
                                </span>
                            )}
                            {trend && !isUSD && (
                                <span className={cn(
                                    "text-[9px] px-2.5 py-1 rounded-full border tracking-tighter uppercase font-bold",
                                    isVibrant ? "bg-white/20 border-white/20 text-white" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                )}>
                                    {trend}
                                </span>
                            )}
                            {badge && (
                                <span className={cn(
                                    "text-[9px] px-2.5 py-1 rounded-full border tracking-tighter uppercase font-bold shadow-sm",
                                    isVibrant ? "bg-white/20 border-white/10 text-white" : cn(colorClass, bgClass, "border-border/50")
                                )}>
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 relative">
                        <p className={cn(
                            "text-[10px] mb-1 tracking-[0.15em] uppercase font-black",
                            isVibrant ? "text-white/60" : "text-muted-foreground/50"
                        )}>
                            {label}
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {outOfStockCount !== undefined ? (
                                <div className="flex items-baseline gap-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <h3 className={cn("text-3xl tracking-tighter font-black", isVibrant ? "text-white" : "text-amber-500")}>{value}</h3>
                                        <span className={cn("text-[8px] font-black uppercase tracking-widest", isVibrant ? "text-white/50" : "text-amber-500/60")}>Kritik</span>
                                    </div>
                                    <div className={cn("h-8 w-px mx-1 self-center", isVibrant ? "bg-white/20" : "bg-border/40")} />
                                    <div className="flex flex-col items-start gap-1">
                                        <h3 className={cn("text-3xl tracking-tighter font-black", isVibrant ? "text-white" : "text-rose-500")}>{outOfStockCount}</h3>
                                        <span className={cn("text-[8px] font-black uppercase tracking-widest", isVibrant ? "text-white/50" : "text-rose-500/60")}>Biten</span>
                                    </div>
                                </div>
                            ) : secondaryDisplay ? (
                                <>
                                    <RevealFinancial
                                        amount={mainDisplay}
                                        prefix=""
                                        className={cn("text-3xl tracking-tight font-black", isVibrant ? "text-white" : colorClass)}
                                    />
                                    <p className={cn("text-xs tracking-tight font-bold italic", isVibrant ? "text-white/40" : "text-muted-foreground/30")}>
                                        ({secondaryDisplay})
                                    </p>
                                </>
                            ) : typeof mainDisplay === 'string' && (mainDisplay.includes('₺') || mainDisplay.includes('$')) ? (
                                <RevealFinancial
                                    amount={mainDisplay}
                                    prefix=""
                                    className={cn("text-3xl tracking-tight font-black", isVibrant ? "text-white" : colorClass)}
                                />
                            ) : (
                                <h3 className={cn("text-3xl tracking-tighter font-black", isVibrant ? "text-white" : colorClass)}>{mainDisplay}</h3>
                            )}
                        </div>

                        {subValue && (
                            <p className={cn(
                                "text-[10px] mt-2 tracking-tight font-bold leading-tight",
                                isVibrant ? "text-white/50" : "text-muted-foreground/40"
                            )}>
                                {subValue}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
