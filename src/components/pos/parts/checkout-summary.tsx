"use client";

import React from "react";
import {
    Banknote, CreditCard, Landmark, History,
    Sparkles, CheckCircle, AlertCircle, Loader2, Printer
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface CheckoutSummaryProps {
    subtotal: number;
    tax: number;
    total: number; // Final total after loyalty
    paymentMethod: string;
    setPaymentMethod: (m: string) => void;
    loyaltyEnabled: boolean;
    totalPoints: number;
    pointValueTl: number;
    applyLoyaltyDiscount: boolean;
    setApplyLoyaltyDiscount: (v: boolean) => void;
    loyaltyDiscountAmount: number;
    isProcessing: boolean;
    onCheckout: () => void;
    isDebtBlocked?: boolean; // When DEBT selected but no customer
    isCompact?: boolean;
    getEquivalentDisplay?: (val: any) => string;
}

export const CheckoutSummary = ({
    subtotal,
    tax,
    total,
    paymentMethod,
    setPaymentMethod,
    loyaltyEnabled,
    totalPoints,
    pointValueTl,
    applyLoyaltyDiscount,
    setApplyLoyaltyDiscount,
    loyaltyDiscountAmount,
    isProcessing,
    onCheckout,
    isDebtBlocked = false,
    isCompact = false,
    getEquivalentDisplay
}: CheckoutSummaryProps) => {
    const paymentMethods = [
        { id: "CASH", label: "NAKİT", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "CREDIT_CARD", label: "KART", icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "BANK_TRANSFER", label: "HAVALE", icon: Landmark, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { id: "DEBT", label: "VERESİYE", icon: History, color: "text-rose-500", bg: "bg-rose-500/10" }
    ];

    if (isCompact) {
        return (
            <div className="space-y-4 border-t border-border/40 bg-card p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.03)] backdrop-blur-xl">
                <div className="bg-muted/30 border-2 border-border/40 p-5 rounded-[1.75rem] space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ARA TOPLAM</span>
                        <span className="text-xs font-black text-foreground/70 tabular-nums">₺{subtotal.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">KDV (%20)</span>
                        <span className="text-xs font-black text-foreground/70 tabular-nums">₺{tax.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 mt-2 border-t-2 border-border/30">
                        <span className="text-xs font-black text-foreground tracking-[0.1em] uppercase leading-none">ÖDENECEK TUTAR</span>
                        <div className="flex flex-col items-end">
                            {loyaltyDiscountAmount > 0 && (
                                <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-none text-[9px] font-black mb-1.5 px-3 py-1 rounded-lg">- ₺{formatCurrency(loyaltyDiscountAmount)}</Badge>
                            )}
                            <span className="text-4xl font-black text-blue-700 tabular-nums tracking-tighter leading-none">₺{total.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

                {loyaltyEnabled && totalPoints > 0 && (
                    <div className="p-4 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">SADAKAT PUANLARI</span>
                                <span className="text-xs font-bold text-white tabular-nums">{totalPoints} Puan • ₺{formatCurrency(totalPoints * pointValueTl)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <Checkbox
                                checked={applyLoyaltyDiscount}
                                onCheckedChange={(checked) => setApplyLoyaltyDiscount(!!checked)}
                                className="h-7 w-7 rounded-lg border-2 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-[1.25rem] border-2 transition-all duration-300 relative group overflow-hidden",
                                paymentMethod === method.id
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 -translate-y-1"
                                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50 hover:border-border"
                            )}
                        >
                            <method.icon className={cn("h-5 w-5", paymentMethod === method.id ? "text-white" : method.color)} />
                            <span className="text-[8px] font-black tracking-widest uppercase">{method.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 min-h-[72px]">
                    <Button
                        disabled={total <= 0 || isProcessing}
                        onClick={onCheckout}
                        className={cn(
                            "flex-1 h-auto text-[13px] font-black tracking-widest rounded-[1.5rem] shadow-2xl transition-all gap-4 uppercase py-6",
                            isDebtBlocked
                                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white"
                        )}
                    >
                        {isDebtBlocked ? <AlertCircle className="h-6 w-6" /> : (isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle className="h-6 w-6" />)}
                        {isDebtBlocked ? "Müşteri Seçilmelidir" : (isProcessing ? "İşleniyor..." : "Tamamla & Fiş Yazdır")}
                    </Button>
                </div>
            </div>
        );
    }

    // Standard Page View for POSInterface
    return (
        <div className="p-6 bg-muted/5 border-t border-border/40">
            <div className="grid grid-cols-4 gap-3 mb-5">
                {paymentMethods.map((method) => (
                    <Button
                        key={method.id}
                        variant="ghost"
                        className={cn(
                            "h-16 flex flex-col gap-1.5 rounded-2xl border transition-all p-0 group",
                            paymentMethod === method.id
                                ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105"
                                : "bg-muted/10 text-muted-foreground border-border/20 hover:bg-muted hover:border-border/50"
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                    >
                        <method.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", paymentMethod === method.id ? "text-primary-foreground" : "text-muted-foreground/60")} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                    </Button>
                ))}
            </div>

            {loyaltyEnabled && totalPoints > 0 && (
                <div className="mb-5 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-primary flex items-center gap-2">
                                CÜZDAN BAKİYESİ KULLAN
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                                Müşterinin {totalPoints} Puanı ({formatCurrency(totalPoints * pointValueTl)} TL değeri) var.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {applyLoyaltyDiscount && (
                            <span className="text-[10px] font-bold text-emerald-500">- ₺{formatCurrency(loyaltyDiscountAmount)}</span>
                        )}
                        <Checkbox
                            checked={applyLoyaltyDiscount}
                            onCheckedChange={(checked) => setApplyLoyaltyDiscount(!!checked)}
                            className="h-6 w-6 rounded-lg border-primary/50 data-[state=checked]:bg-primary"
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground tracking-[0.2em] opacity-70">ÖDENECEK TOPLAM</span>
                    <div className="flex flex-col items-end gap-0">
                        <div className="flex items-center gap-2">
                            {loyaltyDiscountAmount > 0 && (
                                <span className="text-[10px] sm:text-xs text-muted-foreground line-through opacity-50">₺{formatCurrency(subtotal)}</span>
                            )}
                            {getEquivalentDisplay && (
                                <span className="text-[12px] sm:text-[14px] font-bold text-muted-foreground italic">
                                    ({getEquivalentDisplay({ sellPrice: total })})
                                </span>
                            )}
                        </div>
                        <span className="text-3xl sm:text-5xl text-foreground drop-shadow-md font-black tracking-tighter">₺{formatCurrency(total)}</span>
                    </div>
                </div>

                <Button
                    className={cn(
                        "h-14 sm:h-16 w-full text-[13px] sm:text-[14px] font-bold gap-3 sm:gap-4 rounded-2xl sm:rounded-[1.5rem] transition-all shadow-2xl border active:scale-[0.98] whitespace-normal text-center leading-tight",
                        isDebtBlocked
                            ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-rose-500/10"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/20 border-primary/20"
                    )}
                    disabled={total <= 0 || isProcessing}
                    onClick={onCheckout}
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>İŞLENİYOR...</span>
                        </div>
                    ) : (
                        <>
                            <span className="flex-1">
                                {isDebtBlocked
                                    ? "MÜŞTERİ SEÇMENİZ GEREKİYOR (VERESİYE)"
                                    : "SATIŞI TAMAMLA & FİŞ YAZDIR"}
                            </span>
                            {isDebtBlocked
                                ? <AlertCircle className="h-5 w-5 shrink-0" />
                                : <CheckCircle className="h-5 w-5 shrink-0" />}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
