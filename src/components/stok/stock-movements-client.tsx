"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    RefreshCcw,
    AlertTriangle,
    Search,
    Package,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    Activity,
    BarChart3,
    Filter,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CriticalStockDialog } from "./critical-stock-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { getInventoryStats, getCriticalProducts, getAllInventoryMovements } from "@/lib/actions/product-actions";
import { useQuery } from "@tanstack/react-query";

interface StockMovementsClientProps {
    initialPage: number;
    initialSearch: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; colors: string; dot: string }> = {
    STOCK_IN: {
        label: "GİRİŞ",
        icon: ArrowDownLeft,
        colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
    },
    IN: {
        label: "GİRİŞ",
        icon: ArrowDownLeft,
        colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
    },
    PURCHASE: {
        label: "GİRİŞ",
        icon: ArrowDownLeft,
        colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
    },
    STOCK_OUT: {
        label: "ÇIKIŞ",
        icon: ArrowUpRight,
        colors: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dot: "bg-rose-500",
    },
    OUT: {
        label: "ÇIKIŞ",
        icon: ArrowUpRight,
        colors: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dot: "bg-rose-500",
    },
    SALE: {
        label: "SATIŞ",
        icon: ArrowUpRight,
        colors: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        dot: "bg-blue-500",
    },
    SERVICE_USE: {
        label: "SERVİS",
        icon: ArrowUpRight,
        colors: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        dot: "bg-indigo-500",
    },
    ADJUSTMENT: {
        label: "DÜZELTME",
        icon: ArrowRightLeft,
        colors: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
    },
};

export function StockMovementsClient({
    initialPage = 1,
    initialSearch = "",
}: StockMovementsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [isTransitioning, startTransition] = useTransition();
    const [isCriticalDialogOpen, setIsCriticalDialogOpen] = useState(false);

    const currentPage = Number(searchParams.get("page")) || initialPage;
    const currentSearch = searchParams.get("search") || initialSearch;

    const { data: statsData } = useQuery({
        queryKey: ["inventory-stats"],
        queryFn: async () => await getInventoryStats(),
        staleTime: 1000 * 60 * 5,
    });

    const { data: criticalProducts, isLoading: isCriticalLoading } = useQuery({
        queryKey: ["critical-products"],
        queryFn: async () => await getCriticalProducts(),
        staleTime: 1000 * 60 * 5,
    });

    const { data: movementData, isPlaceholderData, isLoading: isMovementsLoading } = useQuery({
        queryKey: ["inventory-movements", currentPage, currentSearch],
        queryFn: async () => await getAllInventoryMovements({ page: currentPage, limit: 30, search: currentSearch }),
        staleTime: 1000 * 60 * 5,
    });

    const isPending = isTransitioning || isMovementsLoading || isPlaceholderData;

    const movements = movementData?.success ? movementData.data : [];
    const stats = {
        totalMovements: movementData?.success ? movementData.total : 0,
        criticalCount: statsData?.criticalCount || 0
    };
    const pagination = {
        page: currentPage,
        totalPages: movementData?.success ? movementData.totalPages : 1,
        search: currentSearch
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (value) params.set("search", value);
        else params.delete("search");
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    };

    const inCount = movements.filter((m: any) => ["STOCK_IN", "IN", "PURCHASE"].includes(m.type)).length;
    const outCount = movements.filter((m: any) => ["STOCK_OUT", "OUT", "SALE", "SERVICE_USE"].includes(m.type)).length;

    return (
        <div className="space-y-6 pb-24">
            {/* ── PAGE HEADER ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(59,130,246,0.12)]">
                        <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">Hareket Analizi</h1>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            Envanter değişim logları
                        </p>
                    </div>
                </div>

                {/* Stat chips */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border/50">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span className="text-[11px] text-muted-foreground/80 uppercase tracking-widest">Toplam</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{stats.totalMovements}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400/80 uppercase tracking-widest">Giriş</span>
                        <span className="text-sm font-semibold text-emerald-400 tabular-nums">{inCount}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/5 rounded-xl border border-rose-500/10">
                        <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                        <span className="text-[11px] text-rose-400/80 uppercase tracking-widest">Çıkış</span>
                        <span className="text-sm font-semibold text-rose-400 tabular-nums">{outCount}</span>
                    </div>
                    <Button
                        onClick={() => setIsCriticalDialogOpen(true)}
                        className={cn(
                            "h-9 px-4 rounded-xl text-[11px] uppercase tracking-widest gap-2 transition-all",
                            stats.criticalCount > 0
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 shadow-rose-500/10 shadow-lg"
                                : "bg-muted text-muted-foreground border border-border/50 hover:bg-muted/80"
                        )}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Kritik ({stats.criticalCount})
                    </Button>
                </div>
            </div>

            {/* ── MAIN CARD ────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                            Sayfa {pagination.page} / {pagination.totalPages} &nbsp;·&nbsp; {movements.length} kayıt gösteriliyor
                        </span>
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                        <Input
                            placeholder="Ürün adı ara..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9 h-9 text-xs bg-background border-border rounded-xl focus-visible:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/40"
                        />
                        {isPending && (
                            <RefreshCcw className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Movement list */}
                <div className={cn("transition-all duration-300", isPending ? "opacity-40 blur-[2px] pointer-events-none" : "")}>
                    <AnimatePresence mode="wait">
                        {movements.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-24 gap-4 text-center"
                            >
                                <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
                                    <Package className="h-7 w-7 text-muted-foreground/20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground/50">Eşleşen hareket bulunamadı</p>
                                    <p className="text-[11px] text-muted-foreground/30 uppercase tracking-widest">Farklı bir arama deneyin</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div key="list" className="divide-y divide-border/30">
                                {movements.map((m: any, idx: number) => {
                                    const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.ADJUSTMENT;
                                    const Icon = cfg.icon;
                                    const isPositive = m.quantity > 0;

                                    return (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.18, delay: idx * 0.015 }}
                                            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
                                        >
                                            {/* Type icon */}
                                            <div className={cn(
                                                "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-110",
                                                cfg.colors
                                            )}>
                                                <Icon className="h-4 w-4" />
                                            </div>

                                            {/* Product info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[13px] font-medium text-foreground tracking-tight">
                                                        {m.product?.name || "—"}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                        cfg.colors
                                                    )}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    {m.notes && (
                                                        <span className="text-[11px] text-muted-foreground/50 italic truncate max-w-[200px]">
                                                            {m.notes}
                                                        </span>
                                                    )}
                                                    {m.sale && (
                                                        <Badge className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20 border rounded-full font-normal">
                                                            SL-{m.sale.saleNumber}
                                                        </Badge>
                                                    )}
                                                    {m.serviceTicket && (
                                                        <Badge className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 border rounded-full font-normal">
                                                            SRV-{m.serviceTicket.ticketNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className={cn(
                                                "text-base font-bold tabular-nums shrink-0 min-w-[48px] text-right",
                                                isPositive ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {isPositive ? `+${m.quantity}` : m.quantity}
                                            </div>

                                            {/* Date */}
                                            <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[80px]">
                                                <span className="text-[12px] text-foreground/50 tabular-nums">
                                                    {format(new Date(m.createdAt), "dd MMM", { locale: tr })}
                                                </span>
                                                <span className="text-[10px] text-foreground/25 tabular-nums">
                                                    {format(new Date(m.createdAt), "HH:mm")}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── PAGINATION FOOTER ─────────────────────────── */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
                        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest hidden sm:block">
                            Toplam {stats.totalMovements} kayıt
                        </span>

                        <div className="flex items-center gap-2 ml-auto">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1 || isPending}
                                className="h-8 w-8 rounded-lg bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                                    let pageNum: number;
                                    const total = pagination.totalPages;
                                    const current = pagination.page;

                                    if (total <= 7) {
                                        pageNum = i + 1;
                                    } else if (current <= 4) {
                                        pageNum = i + 1;
                                        if (i === 6) pageNum = total;
                                        if (i === 5) return <span key="e1" className="text-muted-foreground/30 w-6 text-center text-xs">…</span>;
                                    } else if (current >= total - 3) {
                                        pageNum = total - 6 + i;
                                        if (i === 0) pageNum = 1;
                                        if (i === 1) return <span key="e2" className="text-muted-foreground/30 w-6 text-center text-xs">…</span>;
                                    } else {
                                        if (i === 0) pageNum = 1;
                                        else if (i === 1) return <span key="e3" className="text-muted-foreground/30 w-6 text-center text-xs">…</span>;
                                        else if (i === 5) return <span key="e4" className="text-muted-foreground/30 w-6 text-center text-xs">…</span>;
                                        else if (i === 6) pageNum = total;
                                        else pageNum = current + (i - 3);
                                    }

                                    const isActive = pageNum === current;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={isPending}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-xs font-medium transition-all",
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                    : "text-muted-foreground/50 hover:bg-muted hover:text-foreground bg-transparent"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages || isPending}
                                className="h-8 w-8 rounded-lg bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <CriticalStockDialog
                open={isCriticalDialogOpen}
                onOpenChange={setIsCriticalDialogOpen}
                products={criticalProducts || []}
            />
        </div>
    );
}
