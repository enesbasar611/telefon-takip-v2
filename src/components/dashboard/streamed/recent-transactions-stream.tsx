"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    History as HistoryIcon,
    ChevronRight,
    Search,
    ShoppingBag,
    Wallet,
    Clock,
    User,
    Landmark,
    Receipt,
    ArrowUpRight,
    ArrowDownLeft,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, serializePrisma, formatCurrency } from "@/lib/utils";
import { getRecentTransactions, getDashboardFinancialSummary } from "@/lib/actions/dashboard-actions";
import { useQuery } from "@tanstack/react-query";

type FilterTab = "ALL" | "SALES" | "DEBT" | "COLLECTIONS" | "EXPENSE";

interface SaleItemRecord {
    id: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
    product?: {
        id: string;
        name: string;
        category?: { name: string } | null;
    } | null;
}

interface TransactionRecord {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number | string;
    currency?: string | null;
    description: string;
    paymentMethod: "CASH" | "CARD" | "TRANSFER" | "DEBT" | string;
    category?: string | null;
    createdAt: string | Date;
    saleId?: string | null;
    debtId?: string | null;
    customer?: { id: string; name: string; phone?: string | null } | null;
    supplier?: { id: string; name: string } | null;
    financeAccount?: { id: string; name: string; type?: string | null; currency?: string | null } | null;
    user?: { id: string; name?: string | null } | null;
    debt?: {
        id: string;
        remainingAmount: number | string;
        currency?: string | null;
        isPaid?: boolean;
        description?: string | null;
    } | null;
    sale?: {
        id: string;
        saleNumber: string;
        totalAmount: number | string;
        discount: number | string;
        finalAmount: number | string;
        paymentMethod: string;
        customer?: { id: string; name: string; phone?: string | null } | null;
        items?: SaleItemRecord[];
    } | null;
}

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
    { key: "ALL", label: "Tümü" },
    { key: "SALES", label: "Satılanlar" },
    { key: "DEBT", label: "Veresiye" },
    { key: "COLLECTIONS", label: "Tahsilat" },
    { key: "EXPENSE", label: "Gider" },
];

function getCurrencySymbol(currency?: string | null): string {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    return "₺";
}

function getPaymentMethodLabel(method?: string | null): string {
    switch (method) {
        case "CARD":
            return "Kart / POS";
        case "TRANSFER":
            return "Havale";
        case "DEBT":
            return "Veresiye";
        default:
            return "Nakit";
    }
}

function resolveTransactionMeta(t: TransactionRecord) {
    const isDebt = t.paymentMethod === "DEBT" || t.category === "VERESİYE";
    const isSale = Boolean(t.saleId || t.sale || t.category === "SATIŞ");
    const isExpense = t.type === "EXPENSE";

    if (isDebt) {
        return {
            badge: isSale ? "Veresiye Satış" : "Veresiye Verildi",
            toneClass: "bg-amber-500/10 text-amber-500 border-amber-500/25",
            dotClass: "bg-amber-500",
            amountClass: "text-amber-500",
            sign: "",
            isSale,
            isDebt: true,
        };
    }

    if (isExpense) {
        const badge = t.supplier || t.category === "TEDARİKÇİ"
            ? "Tedarikçi Ödemesi"
            : t.category === "GİDER" || !t.category
                ? "Gider"
                : t.category;
        return {
            badge,
            toneClass: "bg-rose-500/10 text-rose-500 border-rose-500/25",
            dotClass: "bg-rose-500",
            amountClass: "text-rose-500",
            sign: "-",
            isSale,
            isDebt: false,
        };
    }

    let badge = "Tahsilat";
    if (isSale) {
        badge = `${getPaymentMethodLabel(t.paymentMethod)} Satış`;
    } else if (t.category === "VERESİYE_TAHSİLAT" || t.debtId) {
        badge = "Veresiye Tahsilat";
    } else if (
        t.category === "SERVİS" ||
        t.description?.toLocaleLowerCase("tr-TR").includes("servis")
    ) {
        badge = "Servis Tahsilatı";
    } else if (t.category) {
        badge = t.category;
    }

    return {
        badge,
        toneClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
        dotClass: "bg-emerald-500",
        amountClass: "text-emerald-500",
        sign: "+",
        isSale,
        isDebt: false,
    };
}

function matchesFilter(t: TransactionRecord, filter: FilterTab): boolean {
    if (filter === "ALL") return true;
    const isSale = Boolean(t.saleId || t.sale || t.category === "SATIŞ");
    const isDebt = t.paymentMethod === "DEBT" || t.category === "VERESİYE";
    if (filter === "SALES") return isSale;
    if (filter === "DEBT") return isDebt;
    if (filter === "COLLECTIONS") return t.type === "INCOME" && !isDebt;
    if (filter === "EXPENSE") return t.type === "EXPENSE";
    return true;
}

function getCounterpartyName(t: TransactionRecord): string {
    return (
        t.customer?.name ||
        t.sale?.customer?.name ||
        t.supplier?.name ||
        (t.saleId || t.sale ? "Peşin Müşteri" : "Genel Kasa")
    );
}

export function RecentTransactionsStream({
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

    const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

    const { data = [], isLoading } = useQuery<TransactionRecord[]>({
        queryKey: ["dashboard-recent-transactions", shopId || ""],
        queryFn: async () => {
            if (!shopId) return [];
            const recentTransactionsRaw = await getRecentTransactions(shopId, 30);
            return serializePrisma(recentTransactionsRaw);
        },
        staleTime: 2 * 60 * 1000,
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

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLocaleLowerCase("tr-TR");
        return data.filter((t) => {
            if (!matchesFilter(t, activeFilter)) return false;
            if (!q) return true;
            const counterparty = getCounterpartyName(t).toLocaleLowerCase("tr-TR");
            const desc = (t.description || "").toLocaleLowerCase("tr-TR");
            const productText = (t.sale?.items || [])
                .map((it) => it.product?.name || "")
                .join(" ")
                .toLocaleLowerCase("tr-TR");
            const saleNo = (t.sale?.saleNumber || "").toLocaleLowerCase("tr-TR");
            return (
                counterparty.includes(q) ||
                desc.includes(q) ||
                productText.includes(q) ||
                saleNo.includes(q)
            );
        });
    }, [data, activeFilter, searchQuery]);

    const defaultLimit = rows >= 4 ? 15 : 10;
    const items = showAll ? filteredItems : filteredItems.slice(0, defaultLimit);
    const hasMore = filteredItems.length > defaultLimit;

    if (isLoading) {
        return (
            <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />
        );
    }

    return (
        <>
            <Card className="h-full flex flex-col border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl transition-all duration-300 hover:shadow-md animate-in fade-in">
                <CardHeader
                    className={cn(
                        "flex-shrink-0 flex flex-col gap-2.5 border-b border-border/40 bg-muted/10",
                        isVerySmall || isShort ? "p-3 pb-2.5" : "px-5 py-3.5"
                    )}
                >
                    <div className="flex flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={cn(
                                    "rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary shrink-0",
                                    isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                                )}
                            >
                                <HistoryIcon className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                            </div>
                            <div className="min-w-0">
                                <CardTitle
                                    className={cn(
                                        "font-semibold tracking-tight uppercase text-foreground flex items-center gap-3 flex-wrap",
                                        isVerySmall || isShort ? "text-xs" : "text-sm"
                                    )}
                                >
                                    <span>Finansal Kayıtlar</span>

                                    {summary && !isVerySmall && (
                                        <div className="hidden lg:flex items-center gap-3 normal-case font-normal border-l border-border/40 pl-3 h-5">
                                            <div className="flex items-center gap-1.5 text-[10px] opacity-75 hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                    Dün:
                                                </span>
                                                <span className="text-emerald-500 font-medium tabular-nums">
                                                    +₺{formatCurrency(summary.yesterday.income)}
                                                </span>
                                                {summary.yesterday.debtIncome > 0 && (
                                                    <span className="text-amber-500 font-medium tabular-nums">
                                                        (Vrs ₺{formatCurrency(summary.yesterday.debtIncome)})
                                                    </span>
                                                )}
                                                <span className="text-rose-500 font-medium tabular-nums">
                                                    -₺{formatCurrency(summary.yesterday.expense)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                <span className="text-[9px] uppercase tracking-wider text-blue-500 font-semibold">
                                                    Bugün:
                                                </span>
                                                <span className="text-emerald-500 font-bold tabular-nums">
                                                    +₺{formatCurrency(summary.today.income)}
                                                </span>
                                                {summary.today.debtIncome > 0 && (
                                                    <span className="text-amber-500 font-semibold tabular-nums" title="Bugün verilen veresiye">
                                                        (Vrs ₺{formatCurrency(summary.today.debtIncome)})
                                                    </span>
                                                )}
                                                <span className="text-rose-500 font-bold tabular-nums">
                                                    -₺{formatCurrency(summary.today.expense)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardTitle>
                                {!isVerySmall && !isShort && (
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Satılan Ürünler, Tahsilatlar & Verilenler · Son {data.length} Kayıt
                                    </p>
                                )}
                            </div>
                        </div>

                        {!isVerySmall && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Link href="/satis/gecmis" className="hidden sm:block">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground h-7 rounded-lg px-2"
                                    >
                                        Satışlar
                                    </Button>
                                </Link>
                                <Link href="/satis/kasa">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all"
                                    >
                                        KASA <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {!isVerySmall && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                                {FILTER_TABS.map((tab) => {
                                    const active = activeFilter === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => {
                                                setActiveFilter(tab.key);
                                                setShowAll(false);
                                            }}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border",
                                                active
                                                    ? "bg-primary/15 text-primary border-primary/30"
                                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative w-full sm:w-44">
                                <Search className="h-3 w-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ürün veya müşteri ara..."
                                    className="h-7 pl-7 pr-6 text-[11px] bg-muted/20 border-border/40 rounded-lg focus-visible:ring-1"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label="Aramayı temizle"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar">
                    {items.length > 0 ? (
                        <div className="divide-y divide-border/25">
                            {items.map((t) => {
                                const meta = resolveTransactionMeta(t);
                                const currencySymbol = getCurrencySymbol(t.currency);
                                const counterparty = getCounterpartyName(t);
                                const saleItems = t.sale?.items || [];

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTx(t)}
                                        className={cn(
                                            "w-full text-left flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors group",
                                            isVerySmall ? "px-3 py-2.5" : "px-5 py-2.5"
                                        )}
                                    >
                                        <div className="min-w-0 flex-1 space-y-1">
                                            {/* Primary Row: What was sold or given */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {saleItems.length > 0 ? (
                                                    <>
                                                        <ShoppingBag className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                                        {saleItems.slice(0, 2).map((item) => (
                                                            <span
                                                                key={item.id}
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded-md max-w-[190px]"
                                                            >
                                                                <span className="truncate">
                                                                    {item.product?.name || "Ürün"}
                                                                </span>
                                                                <span className="text-[10px] text-primary font-bold shrink-0">
                                                                    ×{item.quantity}
                                                                </span>
                                                            </span>
                                                        ))}
                                                        {saleItems.length > 2 && (
                                                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">
                                                                +{saleItems.length - 2} kalem
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {meta.isDebt ? (
                                                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                        ) : t.type === "INCOME" ? (
                                                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <ArrowUpRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                                        )}
                                                        <span className="text-xs font-semibold text-foreground truncate">
                                                            {t.description || "Genel İşlem"}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Secondary Row: Counterparty · Account · Staff · Time */}
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                                                <span className="font-medium text-foreground/80 truncate max-w-[140px]">
                                                    {counterparty}
                                                </span>
                                                {t.financeAccount?.name && !isVerySmall && (
                                                    <>
                                                        <span className="opacity-40">•</span>
                                                        <span className="truncate max-w-[110px]">
                                                            {t.financeAccount.name}
                                                        </span>
                                                    </>
                                                )}
                                                {t.user?.name && !isVerySmall && (
                                                    <>
                                                        <span className="opacity-40">•</span>
                                                        <span className="truncate max-w-[90px]">
                                                            {t.user.name}
                                                        </span>
                                                    </>
                                                )}
                                                {!isShort && (
                                                    <>
                                                        <span className="opacity-40">•</span>
                                                        <span className="tabular-nums">
                                                            {format(new Date(t.createdAt), "d MMM, HH:mm", {
                                                                locale: tr,
                                                            })}
                                                        </span>
                                                    </>
                                                )}
                                                {t.debt && !t.debt.isPaid && Number(t.debt.remainingAmount) > 0 && !isVerySmall && (
                                                    <span className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded">
                                                        Kalan: {getCurrencySymbol(t.debt.currency)}
                                                        {formatCurrency(Number(t.debt.remainingAmount))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Amount + Readable Badge */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className={cn("font-bold text-xs tabular-nums flex items-center", meta.amountClass)}>
                                                {meta.sign && <span className="mr-0.5">{meta.sign}</span>}
                                                <RevealFinancial
                                                    amount={Number(t.amount || 0)}
                                                    prefix={currencySymbol}
                                                    className={cn("font-bold text-xs tabular-nums", meta.amountClass)}
                                                />
                                            </div>
                                            {!isVerySmall && (
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                        meta.toneClass
                                                    )}
                                                >
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
                                                    {meta.badge}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {hasMore && (
                                <div className="py-2 px-4 flex justify-center bg-muted/10">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAll((prev) => !prev)}
                                        className="h-7 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                    >
                                        {showAll
                                            ? "Daha Az Göster"
                                            : `Tümünü Göster (${filteredItems.length} Kayıt)`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <HistoryIcon className="h-7 w-7 mb-1.5 opacity-40" />
                            <p className="text-[10px] font-semibold uppercase tracking-wider">
                                {searchQuery || activeFilter !== "ALL"
                                    ? "Filtreye uygun işlem bulunamadı"
                                    : "Henüz işlem bulunmuyor"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Transaction Detail Modal */}
            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
                    {selectedTx && (() => {
                        const meta = resolveTransactionMeta(selectedTx);
                        const cur = getCurrencySymbol(selectedTx.currency);
                        const sale = selectedTx.sale;
                        const saleItems = sale?.items || [];
                        return (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center justify-between gap-2 pr-6">
                                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                                            <Receipt className="h-4 w-4 text-primary" />
                                            {sale ? `Satış #${sale.saleNumber}` : "İşlem Detayı"}
                                        </DialogTitle>
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border",
                                                meta.toneClass
                                            )}
                                        >
                                            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
                                            {meta.badge}
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs">
                                        {format(new Date(selectedTx.createdAt), "d MMMM yyyy, HH:mm", {
                                            locale: tr,
                                        })}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 mt-1">
                                    {/* Key Summary Grid */}
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-0.5">
                                                <User className="h-3 w-3" /> Karşı Taraf
                                            </div>
                                            <div className="font-semibold text-foreground truncate">
                                                {getCounterpartyName(selectedTx)}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-0.5">
                                                <Landmark className="h-3 w-3" /> Kasa / Hesap
                                            </div>
                                            <div className="font-semibold text-foreground truncate">
                                                {selectedTx.financeAccount?.name ||
                                                    getPaymentMethodLabel(selectedTx.paymentMethod)}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-0.5">
                                                <Wallet className="h-3 w-3" /> İşlem Tutarı
                                            </div>
                                            <div className={cn("font-bold text-sm tabular-nums", meta.amountClass)}>
                                                {meta.sign}
                                                {cur}
                                                {formatCurrency(Number(selectedTx.amount || 0))}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-0.5">
                                                <User className="h-3 w-3" /> Personel
                                            </div>
                                            <div className="font-semibold text-foreground truncate">
                                                {selectedTx.user?.name || "Sistem"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sold Products List */}
                                    {saleItems.length > 0 && (
                                        <div className="rounded-xl border border-border/40 overflow-hidden">
                                            <div className="bg-muted/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                                                <span>Satılan Ürünler ({saleItems.length} Kalem)</span>
                                                <span>Tutar</span>
                                            </div>
                                            <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
                                                {saleItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-foreground truncate">
                                                                {item.product?.name || "Ürün"}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {item.quantity} adet × {cur}
                                                                {formatCurrency(Number(item.unitPrice || 0))}
                                                            </div>
                                                        </div>
                                                        <div className="font-semibold tabular-nums shrink-0">
                                                            {cur}
                                                            {formatCurrency(Number(item.totalPrice || 0))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {sale && Number(sale.discount || 0) > 0 && (
                                                <div className="bg-muted/20 px-3 py-1.5 flex justify-between text-[11px] border-t border-border/30 text-amber-500">
                                                    <span>İndirim</span>
                                                    <span className="font-semibold tabular-nums">
                                                        -{cur}
                                                        {formatCurrency(Number(sale.discount))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Description / Note */}
                                    {selectedTx.description && (
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground/80 block text-[10px] uppercase mb-1">
                                                Açıklama
                                            </span>
                                            {selectedTx.description}
                                        </div>
                                    )}

                                    {/* Debt Status if applicable */}
                                    {selectedTx.debt && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                                            <span className="font-medium text-amber-500">
                                                {selectedTx.debt.isPaid
                                                    ? "Bağlı Veresiye Kapatıldı"
                                                    : "Bağlı Veresiye Kalan Tutar"}
                                            </span>
                                            {!selectedTx.debt.isPaid && (
                                                <span className="font-bold text-amber-500 tabular-nums">
                                                    {getCurrencySymbol(selectedTx.debt.currency)}
                                                    {formatCurrency(Number(selectedTx.debt.remainingAmount || 0))}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Links */}
                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        {sale && (
                                            <Link href="/satis/gecmis" onClick={() => setSelectedTx(null)}>
                                                <Button variant="outline" size="sm" className="text-xs h-8">
                                                    Satış Arşivine Git
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href="/satis/kasa" onClick={() => setSelectedTx(null)}>
                                            <Button size="sm" className="text-xs h-8">
                                                Kasada Görüntüle
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </>
    );
}
