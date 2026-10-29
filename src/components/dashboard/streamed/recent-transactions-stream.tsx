"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, serializePrisma, formatCurrency } from "@/lib/utils";
import { getRecentTransactions, getDashboardFinancialSummary } from "@/lib/actions/dashboard-actions";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function RecentTransactionsStream({ cols = 12, rows = 3, shopId, onDataStatus }: { cols?: number, rows?: number, shopId?: string, onDataStatus?: (isEmpty: boolean) => void }) {
    const isVerySmall = cols < 8;
    const isShort = rows < 3;

    const { data = [], isLoading } = useQuery({
        queryKey: ["dashboard-recent-transactions", shopId || ""],
        queryFn: async () => {
            if (!shopId) return [];
            const recentTransactionsRaw = await getRecentTransactions(shopId);
            return serializePrisma(recentTransactionsRaw);
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!data || data.length === 0);
        }
    }, [data, isLoading, onDataStatus]);

    const { data: summary } = useQuery({
        queryKey: ["dashboard-financial-summary", shopId || ""],
        queryFn: () => getDashboardFinancialSummary(shopId || ""),
        enabled: !!shopId,
        staleTime: 60 * 1000,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />;

    const limit = rows >= 4 ? 12 : 7;
    const items = data.slice(0, limit);

    return (
        <Card className="h-full flex flex-col border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 bg-muted/10",
                isVerySmall || isShort ? "p-3 pb-2.5" : "px-5 py-3.5"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary",
                        isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                    )}>
                        <HistoryIcon className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                    </div>
                    <div>
                        <CardTitle className={cn(
                            "font-semibold tracking-tight uppercase text-foreground flex items-center gap-4",
                            isVerySmall || isShort ? "text-xs" : "text-sm"
                        )}>
                            <span>Finansal Kayıtlar</span>

                            {summary && !isVerySmall && (
                                <div className="hidden lg:flex items-center gap-4 normal-case font-normal border-l border-border/40 pl-4 h-6">
                                    {/* Yesterday */}
                                    <div className="flex items-center gap-2 text-[10px] opacity-70 hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Dün:</span>
                                        <span className="text-emerald-500 font-medium tabular-nums">+{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.yesterday.income)}</span>
                                        <span className="text-rose-500 font-medium tabular-nums">-{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.yesterday.expense)}</span>
                                    </div>

                                    {/* Today */}
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-[9px] uppercase tracking-wider text-blue-500 font-semibold">Bugün:</span>
                                        <span className="text-emerald-500 font-bold tabular-nums">+{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.today.income)}</span>
                                        <span className="text-rose-500 font-bold tabular-nums">-{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.today.expense)}</span>
                                    </div>
                                </div>
                            )}
                        </CardTitle>
                        {!isVerySmall && !isShort && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Son İşlemler</p>}
                    </div>
                </div>

                {!isVerySmall && (
                    <Link href="/satis/kasa">
                        <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all">
                            TÜMÜ <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </Link>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <div className="min-w-full inline-block align-middle">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-muted/30 border-b border-border/40 z-10 backdrop-blur-sm">
                            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                <th className={cn("py-2.5", isVerySmall ? "px-3" : "px-5")}>Müşteri</th>
                                {!isVerySmall && <th className="px-4 py-2.5 lg:table-cell hidden">Detay</th>}
                                <th className="px-4 py-2.5">Tutar</th>
                                {!isVerySmall && <th className="px-5 py-2.5 text-right">Durum</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {items.length > 0 ? (
                                items.map((t: any) => (
                                    <tr key={t.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className={cn("py-2.5", isVerySmall ? "px-3" : "px-5")}>
                                            <div className={cn("font-medium text-foreground tracking-tight line-clamp-1", isVerySmall ? "text-xs" : "text-xs")}>
                                                {t.customer?.name || t.sale?.customer?.name || (t.description?.includes('SATIŞ') ? 'Hızlı Satış' : 'Genel İşlem')}
                                            </div>
                                            {!isShort && <div className="text-[9px] text-muted-foreground uppercase tracking-tight tabular-nums mt-0.5">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>}
                                        </td>
                                        {!isVerySmall && <td className="px-4 py-2.5 text-[11px] text-muted-foreground lg:table-cell hidden max-w-[160px] truncate">{t.description}</td>}
                                        <td className="px-4 py-2.5">
                                            <RevealFinancial amount={t.amount} className="font-semibold text-xs tabular-nums text-foreground" />
                                        </td>
                                        {!isVerySmall && (
                                            <td className="px-5 py-2.5 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                    t.paymentMethod === 'DEBT'
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        : t.type === 'INCOME'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                )}>
                                                    <span className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        t.paymentMethod === 'DEBT' ? 'bg-amber-500' : (t.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500')
                                                    )} />
                                                    {formatStatus(t)}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <HistoryIcon className="h-7 w-7 mb-1.5 opacity-40" />
                                            <p className="text-[10px] font-semibold uppercase tracking-wider">Henüz işlem bulunmuyor</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function formatStatus(t: any) {
    if (t.paymentMethod === 'DEBT') return 'VRS';
    if (t.category) return t.category.substring(0, 3).toUpperCase();
    return t.type === 'INCOME' ? 'THS' : 'GDR';
}
