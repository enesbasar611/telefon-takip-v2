"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { getDashboardSupplierPayables } from "@/lib/actions/dashboard-widgets-actions";
import { useQuery } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Truck, ChevronRight, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from "lucide-react";

type SupplierTab = "BALANCES" | "HISTORY";

export function SupplierPayablesStream({
    cols = 12,
    rows = 3,
    shopId,
    onDataStatus,
}: {
    cols?: number;
    rows?: number;
    shopId?: string;
    onDataStatus?: (isEmpty: boolean) => void;
}) {
    const isVerySmall = cols < 8;
    const isShort = rows < 3;
    const [tab, setTab] = useState<SupplierTab>("BALANCES");
    const [showAll, setShowAll] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-supplier-payables", shopId || ""],
        queryFn: () => getDashboardSupplierPayables(shopId || ""),
        enabled: !!shopId,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!data || data.suppliers.length === 0);
        }
    }, [data, isLoading, onDataStatus]);

    if (isLoading) {
        return (
            <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />
        );
    }

    const suppliers = data?.suppliers || [];
    const recentTx = data?.recentTransactions || [];
    const totals = data?.totals || {
        totalDebtTry: 0,
        totalDebtUsd: 0,
        totalCreditTry: 0,
        totalCreditUsd: 0,
        totalCombinedTry: 0,
        indebtedCount: 0,
        unpaidOrdersCount: 0,
        supplierCount: 0,
    };

    const displayLimit = showAll ? suppliers.length : 8;
    const visibleSuppliers = suppliers.slice(0, displayLimit);

    return (
        <Card className="h-full flex flex-col border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader
                className={cn(
                    "flex-shrink-0 flex flex-col gap-2.5 border-b border-border/40 bg-muted/10",
                    isVerySmall || isShort ? "p-3 pb-2.5" : "px-5 py-3.5"
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={cn(
                                "rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shrink-0",
                                isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                            )}
                        >
                            <Truck className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </div>
                        <div className="min-w-0">
                            <CardTitle
                                className={cn(
                                    "font-semibold tracking-tight uppercase text-foreground truncate",
                                    isVerySmall || isShort ? "text-xs" : "text-sm"
                                )}
                            >
                                Tedarikçi Borçları & Ödemeler
                            </CardTitle>
                            {!isVerySmall && !isShort && (
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {totals.indebtedCount} Borçlu Tedarikçi · {totals.unpaidOrdersCount} Açık Alım Faturası
                                </p>
                            )}
                        </div>
                    </div>

                    {!isVerySmall && (
                        <Link href="/tedarikciler">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all"
                            >
                                TEDARİKÇİLER <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Totals Row */}
                {!isVerySmall && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                TRY Borç
                            </div>
                            <div className="text-xs font-bold text-rose-500 tabular-nums mt-0.5">
                                <RevealFinancial amount={totals.totalDebtTry} prefix="₺" className="text-rose-500" />
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                USD Borç
                            </div>
                            <div className="text-xs font-bold text-amber-500 tabular-nums mt-0.5">
                                <RevealFinancial amount={totals.totalDebtUsd} prefix="$" className="text-amber-500" />
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Toplam (~TRY)
                            </div>
                            <div className="text-xs font-bold text-foreground tabular-nums mt-0.5">
                                <RevealFinancial amount={totals.totalCombinedTry} prefix="₺" />
                            </div>
                        </div>
                    </div>
                )}

                {!isVerySmall && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setTab("BALANCES")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border",
                                tab === "BALANCES"
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                            )}
                        >
                            Bakiyeler ({suppliers.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("HISTORY")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border",
                                tab === "HISTORY"
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                            )}
                        >
                            Son Ödemeler / Alımlar
                        </button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar">
                {tab === "BALANCES" ? (
                    visibleSuppliers.length > 0 ? (
                        <div className="divide-y divide-border/25">
                            {visibleSuppliers.map((s: any) => {
                                const hasTryDebt = s.balanceTry > 0.01;
                                const hasUsdDebt = s.balanceUsd > 0.01;
                                const hasAdvance = s.balanceTry < -0.01 || s.balanceUsd < -0.01;
                                const isSettled = !hasTryDebt && !hasUsdDebt && !hasAdvance;

                                return (
                                    <Link
                                        key={s.id}
                                        href="/tedarikciler"
                                        className={cn(
                                            "flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors",
                                            isVerySmall ? "px-3 py-2.5" : "px-5 py-2.5"
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-foreground truncate">
                                                    {s.name}
                                                </span>
                                                {s.unpaidOrdersCount > 0 && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20 shrink-0">
                                                        {s.unpaidOrdersCount} Açık Fatura
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                                                <span>{s.category || "Genel"}</span>
                                                {s.phone && (
                                                    <>
                                                        <span className="opacity-40">•</span>
                                                        <span className="tabular-nums">{s.phone}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                                            {isSettled ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                                                    <CheckCircle2 className="h-3 w-3" /> Borç Yok
                                                </span>
                                            ) : (
                                                <>
                                                    {Math.abs(s.balanceTry) > 0.01 && (
                                                        <span
                                                            className={cn(
                                                                "text-xs font-bold tabular-nums",
                                                                s.balanceTry > 0 ? "text-rose-500" : "text-emerald-500"
                                                            )}
                                                        >
                                                            {s.balanceTry < 0 ? "Avans: " : ""}
                                                            ₺{formatCurrency(Math.abs(s.balanceTry))}
                                                        </span>
                                                    )}
                                                    {Math.abs(s.balanceUsd) > 0.01 && (
                                                        <span
                                                            className={cn(
                                                                "text-[11px] font-bold tabular-nums",
                                                                s.balanceUsd > 0 ? "text-amber-500" : "text-emerald-500"
                                                            )}
                                                        >
                                                            {s.balanceUsd < 0 ? "Avans: " : ""}
                                                            ${formatCurrency(Math.abs(s.balanceUsd))}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}

                            {suppliers.length > 8 && (
                                <div className="py-2 px-4 flex justify-center bg-muted/10">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAll((prev) => !prev)}
                                        className="h-7 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                    >
                                        {showAll ? "Daha Az Göster" : `Tümünü Göster (${suppliers.length})`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-muted-foreground text-xs">
                            Henüz kayıtlı tedarikçi bulunmuyor.
                        </div>
                    )
                ) : recentTx.length > 0 ? (
                    <div className="divide-y divide-border/25">
                        {recentTx.map((tx: any) => {
                            const isPayment = tx.type === "EXPENSE";
                            return (
                                <Link
                                    key={tx.id}
                                    href="/tedarikciler"
                                    className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {isPayment ? (
                                            <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <ArrowDownLeft className="h-4 w-4 text-amber-500 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-foreground truncate">
                                                {tx.supplier?.name || "Tedarikçi"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {tx.description} ·{" "}
                                                {format(new Date(tx.date), "d MMM, HH:mm", { locale: tr })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div
                                            className={cn(
                                                "text-xs font-bold tabular-nums",
                                                isPayment ? "text-emerald-500" : "text-amber-500"
                                            )}
                                        >
                                            ₺{formatCurrency(Number(tx.amount || 0))}
                                        </div>
                                        {Number(tx.amountUsd || 0) > 0 && (
                                            <div className="text-[10px] text-muted-foreground tabular-nums">
                                                ${formatCurrency(Number(tx.amountUsd))}
                                            </div>
                                        )}
                                        <div className="text-[9px] text-muted-foreground uppercase">
                                            {isPayment ? "Ödeme Yapıldı" : "Alım / Borç"}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-10 text-center text-muted-foreground text-xs">
                        Son tedarikçi hareketi bulunmuyor.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

