"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardDailyAgenda } from "@/lib/actions/dashboard-widgets-actions";
import { useQuery } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import { getCurrencySymbol, isTransactionCurrency } from "@/lib/finance/transaction-currency";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import {
    CalendarClock,
    ChevronRight,
    Smartphone,
    Banknote,
    CheckSquare,
    AlertCircle,
} from "lucide-react";

type AgendaFilter = "ALL" | "DELIVERY" | "DEBT" | "AGENDA";

const URGENCY_STYLES: Record<
    string,
    { badgeClass: string; dotClass: string }
> = {
    OVERDUE: {
        badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/25",
        dotClass: "bg-rose-500",
    },
    TODAY: {
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/25",
        dotClass: "bg-amber-500",
    },
    READY: {
        badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
        dotClass: "bg-emerald-500",
    },
    UPCOMING: {
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/25",
        dotClass: "bg-blue-500",
    },
};

function getKindIcon(kind: string) {
    if (kind === "DELIVERY") return Smartphone;
    if (kind === "DEBT") return Banknote;
    return CheckSquare;
}

export function DailyAgendaStream({
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
    const [filter, setFilter] = useState<AgendaFilter>("ALL");

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-daily-agenda", shopId || ""],
        queryFn: () => getDashboardDailyAgenda(shopId || ""),
        enabled: !!shopId,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!data || data.items.length === 0);
        }
    }, [data, isLoading, onDataStatus]);

    const items = data?.items || [];
    const summary = data?.summary || {
        overdueCount: 0,
        todayCount: 0,
        readyCount: 0,
        upcomingCount: 0,
        deliveryCount: 0,
        debtCount: 0,
        agendaCount: 0,
        dueDebtTotalTry: 0,
    };

    const filteredItems = useMemo(() => {
        if (filter === "ALL") return items;
        return items.filter((it: any) => it.kind === filter);
    }, [items, filter]);

    if (isLoading) {
        return (
            <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />
        );
    }

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
                                "rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 shrink-0",
                                isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                            )}
                        >
                            <CalendarClock className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </div>
                        <div className="min-w-0">
                            <CardTitle
                                className={cn(
                                    "font-semibold tracking-tight uppercase text-foreground truncate flex items-center gap-2",
                                    isVerySmall || isShort ? "text-xs" : "text-sm"
                                )}
                            >
                                <span>Bugünün Teslimat & Vade Ajandası</span>
                                {summary.overdueCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25 px-1.5 py-0.5 rounded-md">
                                        <AlertCircle className="h-2.5 w-2.5" />
                                        {summary.overdueCount} Geciken
                                    </span>
                                )}
                            </CardTitle>
                            {!isVerySmall && !isShort && (
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {summary.readyCount} Hazır Cihaz · {summary.debtCount} Yaklaşan Vade
                                    {summary.dueDebtTotalTry > 0
                                        ? ` (₺${formatCurrency(summary.dueDebtTotalTry)})`
                                        : ""}
                                </p>
                            )}
                        </div>
                    </div>

                    {!isVerySmall && (
                        <Link href="/ajanda">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all"
                            >
                                AJANDA <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </Link>
                    )}
                </div>

                {!isVerySmall && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                        {[
                            { key: "ALL" as const, label: `Tümü (${items.length})` },
                            { key: "DELIVERY" as const, label: `Teslimat (${summary.deliveryCount})` },
                            { key: "DEBT" as const, label: `Vadeler (${summary.debtCount})` },
                            { key: "AGENDA" as const, label: `Ajanda (${summary.agendaCount})` },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setFilter(tab.key)}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border",
                                    filter === tab.key
                                        ? "bg-primary/15 text-primary border-primary/30"
                                        : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar">
                {filteredItems.length > 0 ? (
                    <div className="divide-y divide-border/25">
                        {filteredItems.map((item: any) => {
                            const Icon = getKindIcon(item.kind);
                            const style = URGENCY_STYLES[item.urgency] || URGENCY_STYLES.UPCOMING;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors",
                                        isVerySmall ? "px-3 py-2.5" : "px-5 py-2.5"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center shrink-0 text-foreground/80">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-foreground truncate">
                                                {item.title}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                {item.subtitle} ·{" "}
                                                <span className="tabular-nums">
                                                    {format(new Date(item.date), "d MMM, HH:mm", { locale: tr })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        {typeof item.amount === "number" && item.amount > 0 && (
                                            <span className="text-xs font-bold text-foreground tabular-nums">
                                                {getCurrencySymbol(isTransactionCurrency(item.currency) ? item.currency : "TRY")}
                                                {formatCurrency(item.amount)}
                                            </span>
                                        )}
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                style.badgeClass
                                            )}
                                        >
                                            <span className={cn("h-1.5 w-1.5 rounded-full", style.dotClass)} />
                                            {item.statusLabel}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                        <CalendarClock className="h-7 w-7 mb-1.5 opacity-40" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider">
                            Yaklaşan teslimat veya vade bulunmuyor
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
