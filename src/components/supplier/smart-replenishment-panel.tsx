"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Clock,
    Package,
    Wrench,
    ShoppingCart,
    ArrowRight,
    Zap,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Sparkles,
    PackageOpen,
    BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getSmartReplenishmentData,
    type ReplenishmentRecommendation,
} from "@/lib/actions/supplier-actions";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
    CRITICAL: {
        label: "Acil",
        badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        dot: "bg-rose-400",
        border: "border-l-rose-500",
        glow: "shadow-rose-500/10",
    },
    HIGH: {
        label: "Yüksek",
        badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        dot: "bg-orange-400",
        border: "border-l-orange-500",
        glow: "shadow-orange-500/10",
    },
    MEDIUM: {
        label: "Orta",
        badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        dot: "bg-amber-400",
        border: "border-l-amber-500",
        glow: "shadow-amber-500/10",
    },
    LOW: {
        label: "Düşük",
        badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        dot: "bg-blue-400",
        border: "border-l-blue-500",
        glow: "shadow-blue-500/10",
    },
};

function VelocityBar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">
                {value > 0 ? `${value}/gün` : "—"}
            </span>
        </div>
    );
}

function PriorityPill({ level }: { level: ReplenishmentRecommendation["priorityLevel"] }) {
    const cfg = PRIORITY_CONFIG[level];
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                cfg.badge
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

function ReplenishmentRow({
    item,
    suppliers,
    onAddToOrder,
}: {
    item: ReplenishmentRecommendation;
    suppliers: any[];
    onAddToOrder: (item: ReplenishmentRecommendation, supplierId: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const cfg = PRIORITY_CONFIG[item.priorityLevel];

    const daysText =
        item.daysUntilStockout === 0
            ? "Stok tükendi"
            : item.daysUntilStockout === null
                ? "Satış yok"
                : `${item.daysUntilStockout} gün kaldı`;

    const daysColor =
        item.daysUntilStockout === 0
            ? "text-rose-400"
            : item.daysUntilStockout !== null && item.daysUntilStockout <= 3
                ? "text-rose-400"
                : item.daysUntilStockout !== null && item.daysUntilStockout <= 7
                    ? "text-orange-400"
                    : "text-muted-foreground";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
                "border-l-2 bg-card/80 rounded-xl overflow-hidden transition-all duration-200",
                cfg.border,
                "hover:bg-card border border-border/40 border-l-2"
            )}
        >
            {/* Main row */}
            <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                onClick={() => setExpanded((x) => !x)}
            >
                {/* Priority dot */}
                <div className={cn("h-2 w-2 rounded-full shrink-0 animate-pulse", cfg.dot)} />

                {/* Product info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground truncate">
                            {item.productName}
                        </p>
                        <PriorityPill level={item.priorityLevel} />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                        {item.categoryName}
                        {item.suggestedSupplierName && (
                            <> · <span className="text-blue-400">{item.suggestedSupplierName}</span></>
                        )}
                    </p>
                </div>

                {/* Stock badges */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                        <div className="flex items-baseline gap-1">
                            <span
                                className={cn(
                                    "text-base font-bold tabular-nums",
                                    item.currentStock === 0 ? "text-rose-400" : "text-amber-400"
                                )}
                            >
                                {item.currentStock}
                            </span>
                            <span className="text-[10px] text-muted-foreground">/ {item.criticalStock} min</span>
                        </div>
                        <p className={cn("text-[10px] font-medium", daysColor)}>{daysText}</p>
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-0.5">
                        <span className="text-[10px] text-muted-foreground">Öneri</span>
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">
                            +{item.suggestedOrderQty} adet
                        </span>
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/5"
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded((x) => !x);
                        }}
                    >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 border-t border-border/30">
                            {/* Metrics grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {[
                                    {
                                        icon: BarChart2,
                                        label: "Son 30 gün satış",
                                        value: item.salesLast30,
                                        suffix: "adet",
                                        color: "text-blue-400",
                                    },
                                    {
                                        icon: TrendingUp,
                                        label: "Son 90 gün satış",
                                        value: item.salesLast90,
                                        suffix: "adet",
                                        color: "text-indigo-400",
                                    },
                                    {
                                        icon: Wrench,
                                        label: "Bekleyen servis",
                                        value: item.pendingServiceQty,
                                        suffix: "adet",
                                        color: "text-amber-400",
                                    },
                                    {
                                        icon: Clock,
                                        label: "Tahmini tükenme",
                                        value: item.daysUntilStockout ?? "—",
                                        suffix: item.daysUntilStockout !== null ? "gün" : "",
                                        color: daysColor,
                                    },
                                ].map((m, i) => (
                                    <div
                                        key={i}
                                        className="bg-white/[0.03] rounded-xl p-3 border border-border/30 flex flex-col gap-1.5"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <m.icon className={cn("h-3.5 w-3.5", m.color)} />
                                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
                                                {m.label}
                                            </span>
                                        </div>
                                        <span className={cn("text-xl font-bold tabular-nums", m.color)}>
                                            {m.value}{" "}
                                            {m.suffix && (
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {m.suffix}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Sales velocity bar */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        Günlük satış hızı
                                    </span>
                                    <span className="text-[10px] font-bold text-foreground">
                                        {item.dailyVelocity.toFixed(2)} adet/gün
                                    </span>
                                </div>
                                <VelocityBar value={item.dailyVelocity} max={5} />
                            </div>

                            {/* Pricing & Order CTA */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/20">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">
                                            Alış fiyatı
                                        </p>
                                        <p className="text-sm font-bold text-foreground">
                                            ₺{item.buyPrice.toLocaleString("tr-TR")}
                                            {item.buyPriceUsd && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    (${item.buyPriceUsd})
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">
                                            Tahmini maliyet
                                        </p>
                                        <p className="text-sm font-bold text-emerald-400">
                                            ₺{Math.round(item.estimatedCost).toLocaleString("tr-TR")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">
                                            Öneri adedi
                                        </p>
                                        <p className="text-sm font-bold text-blue-400">
                                            {item.suggestedOrderQty} adet
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {item.suggestedSupplierId ? (
                                        <Button
                                            size="sm"
                                            className="h-9 px-4 rounded-xl text-[11px] gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (item.suggestedSupplierId) {
                                                    onAddToOrder(item, item.suggestedSupplierId);
                                                }
                                            }}
                                        >
                                            <ShoppingCart className="h-3.5 w-3.5" />
                                            Sipariş Listesine Ekle
                                        </Button>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">
                                            Tedarikçi atanmamış
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

interface SmartReplenishmentPanelProps {
    suppliers: any[];
}

export function SmartReplenishmentPanel({ suppliers }: SmartReplenishmentPanelProps) {
    const [filterLevel, setFilterLevel] = useState<
        "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    >("ALL");

    const { addProductToSupplier } = useSupplierOrders();

    const {
        data: recommendations = [],
        isLoading,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["smart-replenishment"],
        queryFn: () => getSmartReplenishmentData(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const filtered = useMemo(() => {
        if (filterLevel === "ALL") return recommendations;
        return recommendations.filter((r) => r.priorityLevel === filterLevel);
    }, [recommendations, filterLevel]);

    const counts = useMemo(() => {
        const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        for (const r of recommendations) c[r.priorityLevel]++;
        return c;
    }, [recommendations]);

    const totalEstimatedCost = filtered.reduce((s, r) => s + r.estimatedCost, 0);

    const handleAddToOrder = (
        item: ReplenishmentRecommendation,
        supplierId: string
    ) => {
        const supplier = suppliers.find((s) => s.id === supplierId);
        addProductToSupplier(
            supplierId,
            supplier?.name ?? "Tedarikçi",
            supplier?.phone ?? undefined,
            { productId: item.productId, name: item.productName },
            item.suggestedOrderQty
        );
        toast.success(
            `${item.productName} sipariş listesine eklendi`,
            {
                description: `${item.suggestedOrderQty} adet → ${supplier?.name ?? "Tedarikçi"}`,
            }
        );
    };

    return (
        <Card className="bg-card border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="font-medium text-sm text-foreground">
                            Akıllı Stok Yenileme
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Satış hızı, servis talebi ve kritik eşik analizi
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {totalEstimatedCost > 0 && (
                        <div className="hidden sm:flex flex-col items-end pr-3 border-r border-border/30 mr-1">
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                                Tahmini toplam
                            </span>
                            <span className="text-sm font-bold text-emerald-400">
                                ₺{Math.round(totalEstimatedCost).toLocaleString("tr-TR")}
                            </span>
                        </div>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/5"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Priority filter tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-border/30 overflow-x-auto scrollbar-none">
                {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((level) => {
                    const isActive = filterLevel === level;
                    const count =
                        level === "ALL"
                            ? recommendations.length
                            : counts[level];
                    const cfg = level !== "ALL" ? PRIORITY_CONFIG[level] : null;
                    return (
                        <button
                            key={level}
                            onClick={() => setFilterLevel(level)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                                isActive
                                    ? level === "ALL"
                                        ? "bg-foreground/10 border-border text-foreground"
                                        : cn(cfg?.badge)
                                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:border-border/40"
                            )}
                        >
                            {cfg && (
                                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                            )}
                            {level === "ALL" ? "Tümü" : cfg?.label}
                            {count > 0 && (
                                <span
                                    className={cn(
                                        "ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                                        isActive && level !== "ALL"
                                            ? "bg-white/10"
                                            : "bg-white/5"
                                    )}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-border/30"
                            />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <PackageOpen className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground mb-1">
                                {recommendations.length === 0
                                    ? "Stok seviyeleri normal"
                                    : "Bu kategoride ürün yok"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {recommendations.length === 0
                                    ? "Kritik stok seviyesine yaklaşan ürün bulunmuyor."
                                    : "Farklı bir öncelik filtresi seçin."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="flex flex-col gap-2.5">
                            {filtered.map((item) => (
                                <ReplenishmentRow
                                    key={item.productId}
                                    item={item}
                                    suppliers={suppliers}
                                    onAddToOrder={handleAddToOrder}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </Card>
    );
}
