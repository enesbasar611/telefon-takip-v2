"use client";

import React from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, MessageCircle, Receipt, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    isSelected,
    onSelect
}: VeresiyeCustomerCardProps) {
    const isUsdPrimary = defaultCurrency === "USD";
    return (
        <AddDebtModal rates={rates} initialData={{ name: item.name, phone: item.phone || "" }}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                    "group relative transition-all overflow-hidden cursor-pointer",
                    viewMode === 'list'
                        ? "p-4 md:px-8 py-4 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/5 border-b border-border/5"
                        : "p-3 md:p-4 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md shadow-md hover:shadow-xl hover:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    isSelected && (viewMode === 'list' ? "bg-indigo-500/[0.04] dark:bg-indigo-500/10" : "ring-1 ring-indigo-500/50 bg-indigo-500/[0.02]"),
                    (item.totalRemainingTRY === 0 && item.totalRemainingUSD === 0) ? (viewMode === 'list' ? "bg-emerald-500/[0.04]" : "border-emerald-500/20") : (viewMode === 'list' ? "bg-rose-500/[0.04]" : "border-rose-500/20")
                )}
            >
                {/* Status Color Strip */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-[4px] transition-all group-hover:w-[6px]",
                    (item.totalRemainingTRY === 0 && item.totalRemainingUSD === 0) ? "bg-emerald-500" : "bg-rose-500"
                )} />

                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="shrink-0 relative flex items-center gap-3">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item.customerId);
                            }}
                            className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                isSelected
                                    ? "bg-indigo-500 border-indigo-500 shadow-md"
                                    : "border-border bg-card group-hover:border-indigo-500/50"
                            )}
                        >
                            {isSelected && <Badge variant="secondary" className="p-0 h-3 w-3 bg-white" />}
                        </div>

                        <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
                            <div className={cn(
                                "rounded-full flex items-center justify-center font-black transition-all duration-500 relative z-10 border-2 border-white dark:border-zinc-800 shadow-xl group-hover/avatar:rotate-6",
                                viewMode === 'grid' ? "w-10 h-10 text-sm" : "w-12 h-12 text-lg",
                                item.totalRemainingTRY + item.totalRemainingUSD > 0 ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                                {item.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                            <h3 className={cn("font-medium tracking-tight text-foreground uppercase antialiased", viewMode === 'grid' ? "text-base" : "text-lg md:text-xl")}>
                                {item.name}
                            </h3>
                            {item.totalRemainingTRY + item.totalRemainingUSD > 5000 && (
                                <div className="animate-in fade-in zoom-in-95">
                                    <Badge className="bg-rose-500/10 text-rose-500 border-none px-2 py-0 text-[8px] font-black tracking-widest leading-none">RİSKLİ PORTFÖY</Badge>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 opacity-80">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-muted-foreground/70" /> {item.phone || 'Sayı Yok'}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-muted-foreground/70" /> {new Date(item.lastActivity).toLocaleDateString('tr-TR')} <span className="opacity-40 text-[10px]">{new Date(item.lastActivity).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                                {item.debtCount} KALEM
                            </span>
                        </div>
                    </div>
                </div>

                <div className={cn("flex flex-row items-center gap-4 mt-4 md:mt-0", viewMode === 'list' && "md:min-w-[150px]")}>
                    <div className="flex flex-row items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className={cn("font-black tabular-nums tracking-tighter text-rose-600 dark:text-rose-400", viewMode === 'grid' ? "text-sm" : "text-base md:text-xl")}>
                                {isUsdPrimary
                                    ? `$${(item.totalRemainingUSD + (item.totalRemainingTRY / usdRate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `₺${Math.round(item.totalRemainingTRY + (item.totalRemainingUSD * usdRate)).toLocaleString('tr-TR')}`
                                }
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 tabular-nums font-medium -mt-1">
                                {isUsdPrimary
                                    ? `(₺${Math.round(item.totalRemainingTRY + (item.totalRemainingUSD * usdRate)).toLocaleString('tr-TR')})`
                                    : `($${(item.totalRemainingUSD + (item.totalRemainingTRY / usdRate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                                }
                            </span>
                        </div>
                        {(item.balance > 0 || item.balanceUsd > 0) && (
                            <div className="flex flex-col items-end opacity-80">
                                <span className={cn("font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tighter", viewMode === 'grid' ? "text-xs" : "text-sm md:text-base")}>
                                    - {isUsdPrimary
                                        ? `$${(item.balanceUsd + (item.balance / usdRate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `₺${Math.round(item.balance + (item.balanceUsd * usdRate)).toLocaleString('tr-TR')}`
                                    }
                                </span>
                                <span className={cn("text-[9px] text-emerald-500/60 tabular-nums font-bold -mt-1 uppercase tracking-widest", viewMode === 'grid' && "hidden md:block")}>
                                    {isUsdPrimary
                                        ? `(₺${Math.round(item.balance + (item.balanceUsd * usdRate)).toLocaleString('tr-TR')})`
                                        : `($${(item.balanceUsd + (item.balance / usdRate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                                    }
                                </span>
                            </div>
                        )}
                        {item.totalRemainingTRY === 0 && item.totalRemainingUSD === 0 && !item.balance && !item.balanceUsd && (
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">ÖDENDİ</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onWhatsApp(item);
                            }}
                            title="WhatsApp'tan Ekstre Gönder"
                            className={cn("rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/10 transition-all", viewMode === 'grid' ? "h-8 w-8" : "h-9 w-9")}
                        >
                            <MessageCircle className={viewMode === 'grid' ? "w-4 h-4" : "w-5 h-5"} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onReceipt(item);
                            }}
                            title="Borç Fişi Yazdır / WhatsApp"
                            className={cn("rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/10 transition-all", viewMode === 'grid' ? "h-8 w-8" : "h-9 w-9")}
                        >
                            <Receipt className={viewMode === 'grid' ? "w-3.5 h-3.5" : "w-4 h-4"} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onDetail(item);
                            }}
                            title="Detayları Gör"
                            className={cn("rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/10 transition-all", viewMode === 'grid' ? "h-8 w-8" : "h-9 w-9")}
                        >
                            <Eye className={viewMode === 'grid' ? "w-4 h-4" : "w-5 h-5"} />
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onPayment(item);
                            }}
                            className={cn("rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 uppercase font-bold tracking-widest transition-all shadow-lg shadow-emerald-500/10 shrink-0", viewMode === 'grid' ? "h-8 px-2 text-[8px]" : "h-9 px-4 text-[9px]")}
                        >
                            Ödeme
                        </Button>
                    </div>
                </div>

                <div className={cn("absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300", viewMode === 'grid' ? "opacity-0" : "opacity-0 group-hover:opacity-100")}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground/30 -rotate-90" />
                </div>
            </motion.div>
        </AddDebtModal>
    );
}
