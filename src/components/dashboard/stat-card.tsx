"use client";
import { useMemo } from "react";
import { useLongPress } from "@/hooks/use-long-press";

import { Card, CardContent } from "@/components/ui/card";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { CountingNumber } from "@/components/ui/counting-number";
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
    TrendingUp,
    Info,
    ArrowUpRight
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
    id,
    label,
    value,
    subValue,
    iconId,
    colorClass = "",
    bgClass = "",
    trend,
    badge,
    onClick,
    usdValue,
    defaultCurrency,
    outOfStockCount,
    isLoading,
    actionLabel,
    onAction,
    onDetail
}: any) {
    const Icon = IconMap[iconId] || ShoppingCart;
    const gesture = useLongPress(
        () => (onAction || onClick)?.(),
        () => (onDetail || onClick)?.()
    );

    if (isLoading) {
        return (
            <div className="h-full w-full">
                <Card className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 h-full animate-pulse overflow-hidden">
                    <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div className="h-9 w-9 bg-muted/60 rounded-xl" />
                            <div className="h-5 w-12 bg-muted/40 rounded-full" />
                        </div>
                        <div className="space-y-2 mt-3">
                            <div className="h-3 w-16 bg-muted/30 rounded-md" />
                            <div className="h-7 w-24 bg-muted/50 rounded-lg" />
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

    // Distinct Liquid Glass Themes per Card (Optimized for both Light & Dark modes)
    const glassTheme = useMemo(() => {
        // 1. Kasa Bakiyesi -> Emerald Jade Liquid Glass
        if (id === "stat_sales" || label?.includes("Kasa")) {
            return {
                bg: "bg-gradient-to-br from-emerald-500/15 via-emerald-600/10 to-teal-500/5 dark:from-emerald-500/25 dark:via-teal-900/20 dark:to-[#041a14]/90",
                border: "border-emerald-500/30 dark:border-emerald-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(16,185,129,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(16,185,129,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-emerald-400/30 dark:bg-emerald-400/35",
                blobSecondary: "bg-teal-400/20 dark:bg-teal-400/25",
                iconPill: "bg-emerald-600/15 text-emerald-900 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/40 shadow-xs",
                badgePill: "bg-emerald-600/15 text-emerald-900 border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-100 dark:border-emerald-400/40",
                actionPill: "bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-950 border-emerald-500/30 dark:bg-emerald-500/25 dark:hover:bg-emerald-500/35 dark:text-emerald-50 dark:border-emerald-400/30",
            };
        }

        // 2. Satış Hacmi -> Azure Cyan Liquid Glass
        if (id === "stat_accounts" || label?.includes("Satış Hacmi")) {
            return {
                bg: "bg-gradient-to-br from-sky-500/15 via-blue-600/10 to-indigo-500/5 dark:from-sky-500/25 dark:via-blue-900/20 dark:to-[#041527]/90",
                border: "border-sky-500/30 dark:border-sky-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(14,165,233,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(14,165,233,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-sky-400/30 dark:bg-sky-400/35",
                blobSecondary: "bg-blue-400/20 dark:bg-blue-400/25",
                iconPill: "bg-sky-600/15 text-sky-900 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-400/40 shadow-xs",
                badgePill: "bg-sky-600/15 text-sky-900 border-sky-500/30 dark:bg-sky-500/25 dark:text-sky-100 dark:border-sky-400/40",
                actionPill: "bg-sky-600/15 hover:bg-sky-600/25 text-sky-950 border-sky-500/30 dark:bg-sky-500/25 dark:hover:bg-sky-500/35 dark:text-sky-50 dark:border-sky-400/30",
            };
        }

        // 3. Servis Gelirleri -> Amethyst Violet Liquid Glass
        if (id === "stat_income" || label?.includes("Servis Gelirleri")) {
            return {
                bg: "bg-gradient-to-br from-violet-500/15 via-purple-600/10 to-fuchsia-500/5 dark:from-violet-500/25 dark:via-purple-900/20 dark:to-[#170529]/90",
                border: "border-violet-500/30 dark:border-violet-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(139,92,246,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(139,92,246,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-violet-400/30 dark:bg-violet-400/35",
                blobSecondary: "bg-fuchsia-400/20 dark:bg-fuchsia-400/25",
                iconPill: "bg-violet-600/15 text-violet-900 border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-400/40 shadow-xs",
                badgePill: "bg-violet-600/15 text-violet-900 border-violet-500/30 dark:bg-violet-500/25 dark:text-violet-100 dark:border-violet-400/40",
                actionPill: "bg-violet-600/15 hover:bg-violet-600/25 text-violet-950 border-violet-500/30 dark:bg-violet-500/25 dark:hover:bg-violet-500/35 dark:text-violet-50 dark:border-violet-400/30",
            };
        }

        // 4. Tahsilatlar -> Amber Golden Liquid Glass
        if (id === "stat_collections" || label?.includes("Tahsilat")) {
            return {
                bg: "bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-amber-500/5 dark:from-amber-500/25 dark:via-orange-900/20 dark:to-[#211103]/90",
                border: "border-amber-500/30 dark:border-amber-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(245,158,11,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(245,158,11,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-amber-400/30 dark:bg-amber-400/35",
                blobSecondary: "bg-orange-400/20 dark:bg-orange-400/25",
                iconPill: "bg-amber-600/15 text-amber-950 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/40 shadow-xs",
                badgePill: "bg-amber-600/15 text-amber-950 border-amber-500/30 dark:bg-amber-500/25 dark:text-amber-100 dark:border-amber-400/40",
                actionPill: "bg-amber-600/15 hover:bg-amber-600/25 text-amber-950 border-amber-500/30 dark:bg-amber-500/25 dark:hover:bg-amber-500/35 dark:text-amber-50 dark:border-amber-400/30",
            };
        }

        // 5. Hazır Cihazlar -> Mint Emerald Liquid Glass
        if (id === "stat_ready" || label?.includes("Hazır")) {
            return {
                bg: "bg-gradient-to-br from-teal-500/15 via-emerald-600/10 to-emerald-500/5 dark:from-teal-500/25 dark:via-emerald-900/20 dark:to-[#042111]/90",
                border: "border-teal-500/30 dark:border-teal-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(20,184,166,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(20,184,166,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-teal-400/30 dark:bg-teal-400/35",
                blobSecondary: "bg-emerald-400/20 dark:bg-emerald-400/25",
                iconPill: "bg-teal-600/15 text-teal-900 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-400/40 shadow-xs",
                badgePill: "bg-teal-600/15 text-teal-900 border-teal-500/30 dark:bg-teal-500/25 dark:text-teal-100 dark:border-teal-400/40",
                actionPill: "bg-teal-600/15 hover:bg-teal-600/25 text-teal-950 border-teal-500/30 dark:bg-teal-500/25 dark:hover:bg-teal-500/35 dark:text-teal-50 dark:border-teal-400/30",
            };
        }

        // 6. Bekleyen Servisler -> Glacier Cyan Liquid Glass
        if (id === "stat_pending" || label?.includes("Bekleyen")) {
            return {
                bg: "bg-gradient-to-br from-cyan-500/15 via-sky-600/10 to-blue-500/5 dark:from-cyan-500/25 dark:via-sky-900/20 dark:to-[#031d28]/90",
                border: "border-cyan-500/30 dark:border-cyan-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(6,182,212,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(6,182,212,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-cyan-400/30 dark:bg-cyan-400/35",
                blobSecondary: "bg-sky-400/20 dark:bg-sky-400/25",
                iconPill: "bg-cyan-600/15 text-cyan-950 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-100 dark:border-cyan-400/40 shadow-xs",
                badgePill: "bg-cyan-600/15 text-cyan-950 border-cyan-500/30 dark:bg-cyan-500/25 dark:text-cyan-100 dark:border-cyan-400/40",
                actionPill: "bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-950 border-cyan-500/30 dark:bg-cyan-500/25 dark:hover:bg-cyan-500/35 dark:text-cyan-50 dark:border-cyan-400/30",
            };
        }

        // 7. Kritik Stok -> Ruby Coral Liquid Glass
        if (id === "stat_stock" || label?.includes("Kritik") || colorClass.includes("rose")) {
            return {
                bg: "bg-gradient-to-br from-rose-500/15 via-pink-600/10 to-rose-500/5 dark:from-rose-500/25 dark:via-pink-900/20 dark:to-[#26050b]/90",
                border: "border-rose-500/30 dark:border-rose-400/30",
                glow: "shadow-[0_4px_20px_0_rgba(244,63,94,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(244,63,94,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
                blobColor: "bg-rose-400/30 dark:bg-rose-400/35",
                blobSecondary: "bg-pink-400/20 dark:bg-pink-400/25",
                iconPill: "bg-rose-600/15 text-rose-950 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/40 shadow-xs",
                badgePill: "bg-rose-600/15 text-rose-950 border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-100 dark:border-rose-400/40",
                actionPill: "bg-rose-600/15 hover:bg-rose-600/25 text-rose-950 border-rose-500/30 dark:bg-rose-500/25 dark:hover:bg-rose-500/35 dark:text-rose-50 dark:border-rose-400/30",
            };
        }

        // 8. Veresiyeler -> Indigo Cobalt Liquid Glass
        return {
            bg: "bg-gradient-to-br from-indigo-500/15 via-blue-600/10 to-indigo-500/5 dark:from-indigo-500/25 dark:via-blue-900/20 dark:to-[#080927]/90",
            border: "border-indigo-500/30 dark:border-indigo-400/30",
            glow: "shadow-[0_4px_20px_0_rgba(99,102,241,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_0_rgba(99,102,241,0.22),inset_0_1px_1.5px_0_rgba(255,255,255,0.35)]",
            blobColor: "bg-indigo-400/30 dark:bg-indigo-400/35",
            blobSecondary: "bg-blue-400/20 dark:bg-blue-400/25",
            iconPill: "bg-indigo-600/15 text-indigo-950 border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-100 dark:border-indigo-400/40 shadow-xs",
            badgePill: "bg-indigo-600/15 text-indigo-950 border-indigo-500/30 dark:bg-indigo-500/25 dark:text-indigo-100 dark:border-indigo-400/40",
            actionPill: "bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-950 border-indigo-500/30 dark:bg-indigo-500/25 dark:hover:bg-indigo-500/35 dark:text-indigo-50 dark:border-indigo-400/30",
        };
    }, [id, label, colorClass]);

    return (
        <div className="h-full w-full @container">
            <Card
                role="button"
                tabIndex={0}
                aria-label={actionLabel ? `${label}: ${actionLabel} (detay için basılı tutun)` : label}
                {...gesture}
                className={cn(
                    "rounded-2xl transition-all duration-300 md:hover:-translate-y-1 group relative overflow-hidden cursor-pointer active:scale-[0.98] h-full select-none touch-manipulation [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "backdrop-blur-2xl border bg-white/90 dark:bg-card/40",
                    glassTheme.bg,
                    glassTheme.border,
                    glassTheme.glow
                )}>
                
                {/* Specular Highlight along top edge */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/60 via-transparent to-transparent opacity-80 dark:from-white/20" />

                {/* Ambient Liquid Fluid Blobs */}
                <div className={cn("pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 dark:opacity-40 dark:group-hover:opacity-75 transition-opacity duration-500", glassTheme.blobColor)} />
                <div className={cn("pointer-events-none absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-xl opacity-15 group-hover:opacity-30 dark:opacity-20 dark:group-hover:opacity-45 transition-opacity duration-500", glassTheme.blobSecondary)} />

                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full relative z-10 font-sans">
                    <div className="flex items-start justify-between relative">
                        <div className={cn(
                            "p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-105",
                            glassTheme.iconPill
                        )}>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            {badge && (
                                <span className={cn(
                                    "text-[9px] px-2 py-0.5 rounded-full tracking-tight font-bold uppercase shadow-xs",
                                    glassTheme.badgePill
                                )}>
                                    {badge}
                                </span>
                            )}
                            {trend && !isUSD && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/25 dark:text-emerald-100 tracking-tight font-bold uppercase shadow-xs">
                                    {trend}
                                </span>
                            )}
                            {isUSD && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/20 text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/25 dark:text-sky-100 tracking-tight font-bold uppercase shadow-xs">
                                    USD
                                </span>
                            )}
                            {onDetail && (
                                <button
                                    type="button"
                                    aria-label={`${label} detayları`}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onPointerUp={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); onDetail(); }}
                                    className="h-6 w-6 rounded-full flex items-center justify-center transition-colors bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 dark:bg-white/15 dark:hover:bg-white/30 dark:text-white shadow-xs"
                                >
                                    <Info className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 relative min-w-0">
                        <p className="text-[10px] sm:text-[11px] mb-1 font-bold tracking-wider uppercase text-slate-800 dark:text-white/80 truncate">
                            {label}
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {outOfStockCount !== undefined ? (
                                <div className="flex items-baseline gap-3 sm:gap-4">
                                    <div className="flex flex-col items-start">
                                        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                                            <CountingNumber value={value} />
                                        </h3>
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-700 dark:text-white/70">Kritik</span>
                                    </div>
                                    <div className="h-6 w-px bg-slate-300 dark:bg-white/30 self-center" />
                                    <div className="flex flex-col items-start">
                                        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                                            <CountingNumber value={outOfStockCount} />
                                        </h3>
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-700 dark:text-white/70">Biten</span>
                                    </div>
                                </div>
                            ) : secondaryDisplay ? (
                                <>
                                    <RevealFinancial
                                        amount={mainDisplay}
                                        prefix=""
                                        className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums break-all"
                                    />
                                    <p className="text-[11px] font-semibold text-slate-700 dark:text-white/75 tabular-nums">
                                        (<CountingNumber value={secondaryDisplay} />)
                                    </p>
                                </>
                            ) : typeof mainDisplay === 'string' && (mainDisplay.includes('₺') || mainDisplay.includes('$')) ? (
                                <RevealFinancial
                                    amount={mainDisplay}
                                    prefix=""
                                    className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums break-all"
                                />
                            ) : (
                                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                                    <CountingNumber value={mainDisplay} />
                                </h3>
                            )}
                        </div>

                        {subValue && (
                            <p className="text-[10px] mt-1.5 font-medium text-slate-700 dark:text-white/75 leading-tight truncate">
                                {subValue}
                            </p>
                        )}

                        {actionLabel && (
                            <div className={cn(
                                "mt-2.5 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all",
                                glassTheme.actionPill
                            )}>
                                <span className="truncate">{actionLabel}</span>
                                <ArrowUpRight className="h-2.5 w-2.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
