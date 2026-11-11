"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KasaBalanceText } from "@/components/finance/kasa-balance-text";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { getDashboardCashChannels } from "@/lib/actions/dashboard-widgets-actions";
import { useQuery } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import { getCurrencySymbol, isTransactionCurrency } from "@/lib/finance/transaction-currency";
import Link from "next/link";
import {
    Landmark,
    Banknote,
    CreditCard,
    ArrowRightLeft,
    ChevronRight,
    Wallet,
} from "lucide-react";

type ChannelTab = "ACCOUNTS" | "METHODS";

function getAccountTypeMeta(type: string) {
    switch (type) {
        case "BANK":
            return {
                label: "Banka",
                Icon: Landmark,
                iconClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            };
        case "POS":
            return {
                label: "POS",
                Icon: CreditCard,
                iconClass: "text-violet-500 bg-violet-500/10 border-violet-500/20",
            };
        case "CREDIT_CARD":
            return {
                label: "Kredi Kartı",
                Icon: CreditCard,
                iconClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            };
        default:
            return {
                label: "Nakit",
                Icon: Banknote,
                iconClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            };
    }
}

export function CashChannelsStream({
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
    const [tab, setTab] = useState<ChannelTab>("ACCOUNTS");

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-cash-channels", shopId || ""],
        queryFn: () => getDashboardCashChannels(shopId || ""),
        enabled: !!shopId,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!data || data.accounts.length === 0);
        }
    }, [data, isLoading, onDataStatus]);

    if (isLoading) {
        return (
            <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />
        );
    }

    const accounts = data?.accounts || [];
    const methods = data?.paymentMethodsToday || [];
    const totals = data?.totals || {
        cashTry: 0,
        bankPosTry: 0,
        netLiquidTry: 0,
        creditCardDebtTry: 0,
        fxAccountsCount: 0,
    };

    const maxMethodFlow = Math.max(
        1,
        ...methods.map((m: any) => Number(m.incomeTry || 0) + Number(m.expenseTry || 0))
    );

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
                                "rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0",
                                isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                            )}
                        >
                            <Wallet className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </div>
                        <div className="min-w-0">
                            <CardTitle
                                className={cn(
                                    "font-semibold tracking-tight uppercase text-foreground truncate",
                                    isVerySmall || isShort ? "text-xs" : "text-sm"
                                )}
                            >
                                Kasa & Ödeme Kanalları
                            </CardTitle>
                            {!isVerySmall && !isShort && (
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Nakit, Banka/POS, Döviz Hesapları & Bugünkü Akış
                                </p>
                            )}
                        </div>
                    </div>

                    {!isVerySmall && (
                        <Link href="/satis/kasa">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all"
                            >
                                KASALAR <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Top Summary Strip */}
                {!isVerySmall && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Nakit Kasa
                            </div>
                            <div className="text-xs font-bold text-foreground tabular-nums mt-0.5">
                                <KasaBalanceText balance={totals.cashTry} currency="TRY" />
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Banka & POS
                            </div>
                            <div className="text-xs font-bold text-blue-500 tabular-nums mt-0.5">
                                <KasaBalanceText balance={totals.bankPosTry} currency="TRY" />
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Net Likit (~TRY)
                            </div>
                            <div className="text-xs font-bold text-emerald-500 tabular-nums mt-0.5">
                                <KasaBalanceText balance={totals.netLiquidTry} currency="TRY" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                {!isVerySmall && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setTab("ACCOUNTS")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border",
                                tab === "ACCOUNTS"
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                            )}
                        >
                            Hesaplar ({accounts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("METHODS")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border",
                                tab === "METHODS"
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                            )}
                        >
                            Bugün Kanallar
                        </button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar">
                {tab === "ACCOUNTS" ? (
                    accounts.length > 0 ? (
                        <div className="divide-y divide-border/25">
                            {accounts.map((acc: any) => {
                                const meta = getAccountTypeMeta(acc.type);
                                const Icon = meta.Icon;
                                const curPrefix = getCurrencySymbol(isTransactionCurrency(acc.currency) ? acc.currency : "TRY");
                                const hasTodayFlow = acc.todayIn > 0 || acc.todayOut > 0;

                                return (
                                    <Link
                                        key={acc.id}
                                        href="/satis/kasa"
                                        className={cn(
                                            "flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors",
                                            isVerySmall ? "px-3 py-2.5" : "px-5 py-2.5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={cn(
                                                    "h-8 w-8 rounded-xl border flex items-center justify-center shrink-0",
                                                    meta.iconClass
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-semibold text-foreground truncate">
                                                        {acc.name}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground">
                                                        {acc.currency}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                                                    <span>{meta.label}</span>
                                                    {hasTodayFlow && (
                                                        <>
                                                            <span className="opacity-40">•</span>
                                                            {acc.todayIn > 0 && (
                                                                <span className="text-emerald-500 font-medium tabular-nums">
                                                                    +{curPrefix}
                                                                    {formatCurrency(acc.todayIn)}
                                                                </span>
                                                            )}
                                                            {acc.todayOut > 0 && (
                                                                <span className="text-rose-500 font-medium tabular-nums">
                                                                    -{curPrefix}
                                                                    {formatCurrency(acc.todayOut)}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="text-xs font-bold text-foreground tabular-nums">
                                                <KasaBalanceText
                                                    balance={acc.balance}
                                                    currency={acc.currency}
                                                    accountType={acc.type}
                                                />
                                            </div>
                                            {acc.currency !== "TRY" && acc.type !== "CREDIT_CARD" && (
                                                <div className="text-[9px] text-muted-foreground tabular-nums">
                                                    ~₺{formatCurrency(acc.tryEquivalent)}
                                                </div>
                                            )}
                                            {acc.type === "CREDIT_CARD" && acc.limit && (
                                                <div className="text-[9px] text-muted-foreground tabular-nums">
                                                    Limit: ₺{formatCurrency(acc.limit)}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-muted-foreground text-xs">
                            Tanımlı kasa veya banka hesabı bulunmuyor.
                        </div>
                    )
                ) : (
                    <div className="p-4 space-y-3">
                        {methods.map((m: any) => {
                            const totalFlow = Number(m.incomeTry || 0) + Number(m.expenseTry || 0);
                            const pct = Math.min(100, Math.round((totalFlow / maxMethodFlow) * 100));
                            return (
                                <div
                                    key={m.method}
                                    className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-2"
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-semibold text-foreground">
                                            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                                            <span>{m.label}</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                                ({m.count} işlem)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[11px] tabular-nums font-bold">
                                            <span className="text-emerald-500">
                                                +<RevealFinancial amount={m.incomeTry} prefix="₺" className="text-emerald-500" />
                                            </span>
                                            {m.expenseTry > 0 && (
                                                <span className="text-rose-500">
                                                    -<RevealFinancial amount={m.expenseTry} prefix="₺" className="text-rose-500" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
