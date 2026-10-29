"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Phone,
    Calendar,
    MessageCircle,
    Receipt,
    Eye,
    MoreVertical,
    PlusCircle,
    RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AddDebtModal } from "@/components/finance/add-debt-modal";

interface VeresiyeCustomerCardProps {
    item: {
        customerId: string;
        name: string;
        phone?: string | null;
        balance: number;
        balanceUsd: number;
        lastActivity: Date;
        totalRemainingTRY: number;
        totalRemainingUSD: number;
        debtCount: number;
    };
    idx: number;
    viewMode: 'list' | 'grid';
    usdRate: number;
    rates: any;
    defaultCurrency?: string;
    onWhatsApp: (item: any) => void;
    onReceipt: (item: any) => void;
    onDetail: (item: any) => void;
    onPayment: (item: any) => void;
    onRefund?: (item: any) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export function VeresiyeCustomerCard({
    item,
    idx,
    viewMode,
    usdRate,
    rates,
    defaultCurrency = "TRY",
    onWhatsApp,
    onReceipt,
    onDetail,
    onPayment,
    onRefund,
    isSelected,
    onSelect
}: VeresiyeCustomerCardProps) {
    const isUsdPrimary = defaultCurrency === "USD";
    const hasNoDebt = item.totalRemainingTRY === 0 && item.totalRemainingUSD === 0;
    const hasEmanet = item.balance > 0 || item.balanceUsd > 0;

    // Converted totals
    const totalInTRY = Math.round(item.totalRemainingTRY + (item.totalRemainingUSD * usdRate));
    const totalInUSD = (item.totalRemainingUSD + (item.totalRemainingTRY / usdRate)).toFixed(2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.015, 0.2), duration: 0.2 }}
            onClick={() => onDetail(item)}
            className={cn(
                "group relative transition-all overflow-hidden cursor-pointer",
                viewMode === 'list'
                    ? "py-2 px-3 sm:py-2.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5 hover:bg-muted/40 border-b border-border/40 bg-card/40 transition-colors"
                    : "p-3 sm:p-3.5 rounded-2xl border border-border/50 bg-card/80 hover:bg-card/95 backdrop-blur-sm shadow-2xs hover:shadow-xs hover:border-primary/30 flex flex-col justify-between gap-2.5",
                isSelected && (viewMode === 'list' ? "bg-primary/5 dark:bg-primary/10" : "ring-2 ring-primary/40 bg-primary/[0.03]"),
                hasNoDebt ? (viewMode === 'list' ? "border-l-3 border-l-emerald-500" : "border-emerald-500/25") : (viewMode === 'list' ? "border-l-3 border-l-rose-500" : "border-rose-500/25")
            )}
        >
            {/* Top row / Info Section */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* Selection checkbox */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.customerId);
                    }}
                    className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0",
                        isSelected
                            ? "bg-primary border-primary shadow-2xs text-primary-foreground"
                            : "border-muted-foreground/40 bg-background hover:border-primary/60"
                    )}
                >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-xs bg-white" />}
                </div>

                {/* Avatar with initial */}
                <div className="shrink-0 relative">
                    <div className={cn(
                        "rounded-xl flex items-center justify-center font-extrabold text-white shadow-2xs select-none transition-transform group-hover:scale-105",
                        viewMode === 'grid' ? "w-8 h-8 text-xs" : "w-8 h-8 text-xs sm:w-8.5 sm:h-8.5 sm:text-xs",
                        hasNoDebt ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-indigo-500 to-blue-600"
                    )}>
                        {item.name.charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* Customer Details */}
                <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold tracking-tight text-foreground uppercase truncate text-xs sm:text-sm">
                            {item.name}
                        </h3>
                        {item.totalRemainingTRY + item.totalRemainingUSD > 5000 && (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 px-1.5 py-0 text-[8px] font-black tracking-wider shrink-0">
                                RİSKLİ
                            </Badge>
                        )}
                        {hasNoDebt && !hasEmanet && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-1.5 py-0 text-[8px] font-black tracking-wider shrink-0">
                                ÖDENDİ
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-muted-foreground">
                        {item.phone ? (
                            <a
                                href={`tel:${item.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-primary flex items-center gap-1 transition-colors"
                            >
                                <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/70" />
                                <span>{item.phone}</span>
                            </a>
                        ) : (
                            <span className="opacity-50">Numara yok</span>
                        )}
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/70" />
                            {new Date(item.lastActivity).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="opacity-40">•</span>
                        <span className="font-semibold text-primary/80">
                            {item.debtCount} Kalem
                        </span>
                    </div>
                </div>
            </div>

            {/* Balances & Actions */}
            <div className={cn(
                "flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/30",
                viewMode === 'grid' && "flex-col sm:flex-row sm:items-center sm:justify-between"
            )}>
                {/* Balance display */}
                <div className="flex flex-col items-start sm:items-end min-w-0">
                    <div className="flex items-baseline gap-1">
                        <span className={cn(
                            "font-black tabular-nums tracking-tight text-sm sm:text-base",
                            hasNoDebt ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                            {isUsdPrimary ? `$${totalInUSD}` : `₺${totalInTRY.toLocaleString('tr-TR')}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                            {isUsdPrimary ? `(₺${totalInTRY.toLocaleString('tr-TR')})` : `($${totalInUSD})`}
                        </span>
                    </div>

                    {/* Emanet badge if any */}
                    {hasEmanet && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            🎁 Emanet: {item.balance > 0 ? `₺${item.balance.toLocaleString('tr-TR')}` : ""}{item.balanceUsd > 0 ? ` $${item.balanceUsd}` : ""}
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Prominent Yeni Borç Ekle Button (Visible on sm and up) */}
                    <AddDebtModal
                        rates={rates}
                        initialData={{ name: item.name, phone: item.phone || "" }}
                    >
                        <Button
                            size="sm"
                            className="hidden sm:inline-flex h-8 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-2xs transition-all shrink-0"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Yeni Borç Ekle</span>
                            <span className="inline md:hidden">Borç Ekle</span>
                        </Button>
                    </AddDebtModal>

                    {/* Primary Tahsilat Button */}
                    <Button
                        size="sm"
                        onClick={() => onPayment(item)}
                        className="h-8 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-2xs transition-all"
                    >
                        <span>Tahsilat</span>
                    </Button>

                    {/* WhatsApp Ekstre */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onWhatsApp(item)}
                        title="WhatsApp Ekstre Gönder"
                        className="h-8 w-8 rounded-xl text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                    </Button>

                    {/* Fiş / PDF */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onReceipt(item)}
                        title="Borç Fişi / PDF Ekstre"
                        className="h-8 w-8 rounded-xl text-primary border-primary/20 hover:bg-primary/10"
                    >
                        <Receipt className="w-3.5 h-3.5" />
                    </Button>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 z-50">
                            {/* If screen is very small (< sm), activate "Yeni Borç Ekle" inside dot menu */}
                            <div className="sm:hidden">
                                <AddDebtModal
                                    rates={rates}
                                    initialData={{ name: item.name, phone: item.phone || "" }}
                                >
                                    <div className="flex items-center gap-2 text-xs font-bold py-2 px-2 hover:bg-muted rounded-md cursor-pointer text-blue-600 dark:text-blue-400">
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        <span>Yeni Borç Ekle</span>
                                    </div>
                                </AddDebtModal>
                                <DropdownMenuSeparator />
                            </div>

                            <DropdownMenuItem
                                onClick={() => onDetail(item)}
                                className="flex items-center gap-2 text-xs font-semibold py-2 cursor-pointer"
                            >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Hesap Hareketleri</span>
                            </DropdownMenuItem>

                            {hasEmanet && onRefund && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onRefund(item)}
                                        className="flex items-center gap-2 text-xs font-semibold py-2 text-amber-600 dark:text-amber-400 cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Emanet İade Et</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
}
