"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { getDashboardReturnsWarranty } from "@/lib/actions/dashboard-widgets-actions";
import { useQuery } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import { getCurrencySymbol, isTransactionCurrency } from "@/lib/finance/transaction-currency";
import { differenceInDays, format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { RotateCcw, ShieldCheck, ChevronRight } from "lucide-react";

type ReturnTab = "RETURNS" | "WARRANTIES";

const RETURN_STATUS_META: Record<string, { label: string; className: string }> = {
    PENDING: {
        label: "Beklemede",
        className: "bg-amber-500/10 text-amber-500 border-amber-500/25",
    },
    APPROVED: {
        label: "Onaylandı",
        className: "bg-blue-500/10 text-blue-500 border-blue-500/25",
    },
    SENT_TO_SUPPLIER: {
        label: "Tedarikçide",
        className: "bg-violet-500/10 text-violet-500 border-violet-500/25",
    },
    RESTOCKED: {
        label: "Stoğa Alındı",
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
    },
    EXCHANGED: {
        label: "Değiştirildi",
        className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/25",
    },
    REFUNDED: {
        label: "İade Edildi",
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
    },
    REJECTED: {
        label: "Reddedildi",
        className: "bg-rose-500/10 text-rose-500 border-rose-500/25",
    },
};

const RETURN_REASON_LABELS: Record<string, string> = {
    PART_FAILURE: "Parça Arızası",
    LABOR_ERROR: "İşçilik",
    CUSTOMER_MISUSE: "Kullanıcı Hatası",
    CUSTOMER_CANCEL: "Müşteri İptal",
    GENERAL_RETURN: "Genel İade",
    DAMAGED: "Hasarlı",
};

export function ReturnsWarrantyStream({
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
    const [tab, setTab] = useState<ReturnTab>("RETURNS");

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-returns-warranty", shopId || ""],
        queryFn: () => getDashboardReturnsWarranty(shopId || ""),
        enabled: !!shopId,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const recentReturns = data?.recentReturns || [];
    const expiringWarranties = data?.expiringWarranties || [];
    const summary = data?.summary || {
        pendingCount: 0,
        supplierPendingCount: 0,
        monthReturnsCount: 0,
        monthRefundTry: 0,
        monthLossTry: 0,
        activeWarrantiesCount: 0,
        expiringSoonCount: 0,
    };

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            const empty =
                recentReturns.length === 0 &&
                expiringWarranties.length === 0 &&
                summary.activeWarrantiesCount === 0;
            onDataStatus(empty);
        }
    }, [isLoading, onDataStatus, recentReturns.length, expiringWarranties.length, summary.activeWarrantiesCount]);

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
                                "rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 shrink-0",
                                isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                            )}
                        >
                            <RotateCcw className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </div>
                        <div className="min-w-0">
                            <CardTitle
                                className={cn(
                                    "font-semibold tracking-tight uppercase text-foreground truncate",
                                    isVerySmall || isShort ? "text-xs" : "text-sm"
                                )}
                            >
                                İade, Değişim & Garanti
                            </CardTitle>
                            {!isVerySmall && !isShort && (
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Bu Ay {summary.monthReturnsCount} İade · {summary.activeWarrantiesCount} Aktif Garanti
                                </p>
                            )}
                        </div>
                    </div>

                    {!isVerySmall && (
                        <Link href="/stok/iade">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all"
                            >
                                İADELER <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </Link>
                    )}
                </div>

                {!isVerySmall && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Bekleyen / Tedarikçi
                            </div>
                            <div className="text-xs font-bold text-amber-500 tabular-nums mt-0.5">
                                {summary.pendingCount} Bekliyor · {summary.supplierPendingCount} Tdr.
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Bu Ay İade / Kayıp
                            </div>
                            <div className="text-xs font-bold text-rose-500 tabular-nums mt-0.5">
                                <RevealFinancial
                                    amount={Math.max(summary.monthRefundTry, summary.monthLossTry)}
                                    prefix="₺"
                                    className="text-rose-500"
                                />
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/25 border border-border/40 px-2.5 py-1.5">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Aktif Garanti
                            </div>
                            <div className="text-xs font-bold text-emerald-500 tabular-nums mt-0.5">
                                {summary.activeWarrantiesCount} Cihaz
                                {summary.expiringSoonCount > 0 ? ` (${summary.expiringSoonCount} yakında)` : ""}
                            </div>
                        </div>
                    </div>
                )}

                {!isVerySmall && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setTab("RETURNS")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border",
                                tab === "RETURNS"
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                            )}
                        >
                            İade Kayıtları ({recentReturns.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("WARRANTIES")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border",
                                tab === "WARRANTIES"
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                            )}
                        >
                            Garantisi Bitenler ({expiringWarranties.length})
                        </button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar">
                {tab === "RETURNS" ? (
                    recentReturns.length > 0 ? (
                        <div className="divide-y divide-border/25">
                            {recentReturns.map((r: any) => {
                                const statusMeta = RETURN_STATUS_META[r.returnStatus] || RETURN_STATUS_META.PENDING;
                                const reasonLabel = r.returnReason
                                    ? RETURN_REASON_LABELS[r.returnReason] || r.returnReason
                                    : r.sourceType || "İade";
                                const itemTitle =
                                    r.productName ||
                                    r.product?.name ||
                                    (r.serviceTicket
                                        ? `${r.serviceTicket.deviceBrand} ${r.serviceTicket.deviceModel}`
                                        : r.ticketNumber);
                                const displayAmount =
                                    Number(r.refundAmount || 0) > 0
                                        ? `${getCurrencySymbol(isTransactionCurrency(r.refundCurrency) ? r.refundCurrency : "TRY")}${formatCurrency(Number(r.refundAmount))}`
                                        : Number(r.lossAmount || 0) > 0
                                          ? `₺${formatCurrency(Number(r.lossAmount))}`
                                          : null;

                                return (
                                    <Link
                                        key={r.id}
                                        href={r.serviceTicket ? `/servis/${r.serviceTicket.id}` : "/stok/iade"}
                                        className={cn(
                                            "flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors",
                                            isVerySmall ? "px-3 py-2.5" : "px-5 py-2.5"
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-foreground truncate">
                                                    {itemTitle}
                                                </span>
                                                {r.quantity > 1 && (
                                                    <span className="text-[10px] font-bold text-primary">
                                                        ×{r.quantity}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                #{r.ticketNumber} · {r.customer?.name || r.supplier?.name || "Genel"} ·{" "}
                                                {reasonLabel} ·{" "}
                                                {format(new Date(r.createdAt), "d MMM", { locale: tr })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {displayAmount && (
                                                <span className="text-xs font-bold text-foreground tabular-nums">
                                                    {displayAmount}
                                                </span>
                                            )}
                                            <span
                                                className={cn(
                                                    "inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                    statusMeta.className
                                                )}
                                            >
                                                {statusMeta.label}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground text-xs">
                            Henüz iade veya değişim kaydı bulunmuyor.
                        </div>
                    )
                ) : expiringWarranties.length > 0 ? (
                    <div className="divide-y divide-border/25">
                        {expiringWarranties.map((w: any) => {
                            const daysLeft = Math.max(
                                0,
                                differenceInDays(new Date(w.warrantyExpiry), new Date())
                            );
                            return (
                                <Link
                                    key={w.id}
                                    href={`/servis/${w.id}`}
                                    className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-foreground truncate">
                                                {w.deviceBrand} {w.deviceModel}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {w.customer?.name || "Müşteri"} · #{w.ticketNumber} · Bitiş:{" "}
                                                {format(new Date(w.warrantyExpiry), "d MMM yyyy", { locale: tr })}
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0",
                                            daysLeft <= 3
                                                ? "bg-rose-500/10 text-rose-500 border-rose-500/25"
                                                : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                                        )}
                                    >
                                        {daysLeft === 0 ? "Bugün Bitiyor" : `${daysLeft} Gün Kaldı`}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground text-xs">
                        Önümüzdeki 14 gün içinde garantisi dolacak cihaz bulunmuyor.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
