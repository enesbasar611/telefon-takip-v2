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

export function RecentTransactionsStream({ cols = 12, rows = 4, shopId, onDataStatus }: { cols?: number, rows?: number, shopId?: string, onDataStatus?: (isEmpty: boolean) => void }) {
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

    if (isLoading) return <Card className="h-full border border-border/40 bg-card rounded-[2rem] animate-pulse" />;

    const limit = rows >= 4 ? 12 : 6;
    const items = data.slice(0, limit);

    return (
        <Card className="h-full flex flex-col border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500 animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40",
                isVerySmall || isShort ? "p-4 py-3" : "p-8 pb-6"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner",
                        isVerySmall || isShort ? "h-8 w-8" : "h-11 w-11"
                    )}>
                        <HistoryIcon className={cn("text-secondary", isVerySmall || isShort ? "h-4 w-4" : "h-5 w-5")} />
                    </div>
                    <div>
                        <CardTitle className={cn(
                            "font-medium tracking-tight font-sans uppercase flex items-center gap-6",
                            isVerySmall || isShort ? "text-sm" : "text-lg"
                        )}>
                            <span>Finansal Kayıtlar</span>

                            {summary && !isVerySmall && (
                                <div className="flex items-center gap-6 normal-case font-normal border-l border-border/40 pl-6 h-10">
                                    {/* Yesterday */}
                                    <div className="flex flex-col gap-0.5 opacity-40 hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold">DÜN</span>
                                        <div className="flex items-center gap-3 text-[11px]">
                                            <div className="flex items-center gap-1 text-emerald-500 font-semibold">
                                                <ArrowUpRight className="h-3 w-3" />
                                                <span>{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.yesterday.income)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-rose-500 font-semibold">
                                                <ArrowDownLeft className="h-3 w-3" />
                                                <span>{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.yesterday.expense)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Today */}
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] uppercase tracking-tighter text-blue-500 font-bold">BUGÜN</span>
                                        <div className="flex items-center gap-3 text-[11px]">
                                            <div className="flex items-center gap-1 text-emerald-500 font-bold">
                                                <ArrowUpRight className="h-3 w-3" />
                                                <span>{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.today.income)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-rose-500 font-bold">
                                                <ArrowDownLeft className="h-3 w-3" />
                                                <span>{summary.currency === 'USD' ? '$' : '₺'}{formatCurrency(summary.today.expense)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardTitle>
                        {!isVerySmall && !isShort && <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Son İşlemler</p>}
                    </div>
                </div>
                {!isVerySmall && (
                    <Link href="/satis/kasa">
                        <Button variant="outline" className="text-[10px] uppercase tracking-tighter text-blue-500 border-blue-500/20 hover:bg-blue-500/5 h-9 rounded-xl px-5 transition-all">
                            TÜMÜ <ChevronRight className="h-3 w-3 ml-2" />
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <div className="min-w-full inline-block align-middle">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-card z-10">
                            <tr className="text-[10px] text-muted-foreground/60 bg-muted/20 tracking-[.15em] uppercase">
                                <th className={cn("py-4", isVerySmall ? "px-4" : "px-8")}>Müşteri</th>
                                {!isVerySmall && <th className="px-6 py-4 lg:table-cell hidden">Detay</th>}
                                <th className="px-6 py-4">Tutar</th>
                                {!isVerySmall && <th className="px-8 py-4 text-right">Durum</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {items.length > 0 ? (
                                items.map((t: any) => (
                                    <tr key={t.id} className="group hover:bg-muted/10 transition-colors">
                                        <td className={cn("py-3", isVerySmall ? "px-4" : "px-8")}>
                                            <div className={cn("text-foreground tracking-tight line-clamp-1", isVerySmall ? "text-xs" : "text-sm")}>
                                                {t.customer?.name || t.sale?.customer?.name || (t.description.includes('SATIŞ') ? 'Hızlı Satış' : 'Genel İşlem')}
                                            </div>
                                            {!isShort && <div className="text-[9px] text-muted-foreground/40 mt-1 uppercase tracking-tighter font-medium">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>}
                                        </td>
                                        {!isVerySmall && <td className="px-6 py-3 text-[10px] text-muted-foreground lg:table-cell hidden max-w-[150px] truncate">{t.description}</td>}
                                        <td className="px-6 py-3">
                                            <RevealFinancial amount={t.amount} className={cn("tracking-tight", isVerySmall ? "text-xs" : "text-sm")} />
                                        </td>
                                        {!isVerySmall && (
                                            <td className="px-8 py-3 text-right">
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border-none shadow-sm transition-all",
                                                    t.paymentMethod === 'DEBT'
                                                        ? 'bg-amber-500/10 text-amber-500'
                                                        : t.type === 'INCOME'
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-destructive/10 text-destructive'
                                                )}>
                                                    {formatStatus(t)}
                                                </Badge>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center opacity-20">
                                        <div className="flex flex-col items-center justify-center">
                                            <HistoryIcon className="h-10 w-10 mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Henüz işlem bulunmuyor</p>
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
