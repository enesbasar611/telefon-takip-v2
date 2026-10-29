"use client";

import React from "react";
import {
    Banknote, CreditCard, Landmark, History,
    Sparkles, CheckCircle, AlertCircle, Loader2, Printer,
    ChevronDown
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface CheckoutSummaryProps {
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
    isDebtBlocked?: boolean;
    isCompact?: boolean;
    defaultCurrency?: string;
    rates?: any;
    formattedTotal: string;
    formattedSubtotal: string;
    formattedTax: string;
    formattedEquivalentTotal: string;
    showDetails?: boolean;
    setShowDetails?: (v: boolean) => void;
    accounts?: any[];
    selectedAccountId?: string;
    setSelectedAccountId?: (id: string) => void;
}

export const CheckoutSummary = ({
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
    defaultCurrency = "TRY",
    rates,
    formattedTotal,
    formattedSubtotal,
    formattedTax,
    formattedEquivalentTotal,
    showDetails: externalShowDetails,
    setShowDetails: externalSetShowDetails,
    accounts = [],
    selectedAccountId = "",
    setSelectedAccountId
}: CheckoutSummaryProps) => {
    const [internalShowDetails, setInternalShowDetails] = React.useState(false);
    const showDetails = externalShowDetails ?? internalShowDetails;
    const setShowDetails = externalSetShowDetails ?? setInternalShowDetails;

    const currentUsdRate = Number(rates?.usd || rates?.USD) || 34.5;
    const currencySymbol = defaultCurrency === "USD" ? "$" : (defaultCurrency === "EUR" ? "€" : "₺");
    
    const convertBalance = React.useCallback((balance: number, fromCurrency: string) => {
        if (!rates) return balance;
        const target = defaultCurrency || 'TRY';
        if (fromCurrency === target) return balance;
        
        let tryValue = balance;
        if (fromCurrency === "USD") tryValue = balance * (Number(rates.usd || rates.USD) || 1);
        else if (fromCurrency === "EUR") tryValue = balance * (Number(rates.eur || rates.EUR) || 1);

        if (target === "TRY") return tryValue;
        if (target === "USD") return tryValue / (Number(rates.usd || rates.USD) || 1);
        if (target === "EUR") return tryValue / (Number(rates.eur || rates.EUR) || 1);
        
        return balance;
    }, [rates, defaultCurrency]);

    const paymentMethods = [
        { id: "CASH", label: "NAKİT", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "CREDIT_CARD", label: "KART", icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "BANK_TRANSFER", label: "HAVALE", icon: Landmark, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { id: "DEBT", label: "VERESİYE", icon: History, color: "text-rose-500", bg: "bg-rose-500/10" }
    ];
    const showAccountSelection = paymentMethod !== "DEBT";

    const eligibleAccounts = React.useMemo(() => {
        if (paymentMethod === "DEBT") return [];
        if (paymentMethod === "CASH") {
            const cashAccs = accounts.filter(a => a.type === "CASH");
            return cashAccs.length > 0 ? cashAccs : accounts;
        }
        if (paymentMethod === "CREDIT_CARD") {
            const cardAccs = accounts.filter(a => a.type === "POS" || a.type === "CREDIT_CARD");
            return cardAccs.length > 0 ? cardAccs : accounts;
        }
        if (paymentMethod === "BANK_TRANSFER" || paymentMethod === "TRANSFER") {
            const bankAccs = accounts.filter(a => a.type === "BANK");
            return bankAccs.length > 0 ? bankAccs : accounts;
        }
        return accounts;
    }, [accounts, paymentMethod]);

    const selectedAccount = eligibleAccounts.find((account) => account.id === selectedAccountId);
    const accountSelectionTitle =
        paymentMethod === "CASH" ? "NAKİT KASA SEÇİMİ" :
            paymentMethod === "CREDIT_CARD" ? "KART HESABI SEÇİMİ" :
                paymentMethod === "BANK_TRANSFER" || paymentMethod === "TRANSFER" ? "HAVALE HESABI SEÇİMİ" :
                    "HESAP SEÇİMİ";

    const renderAccountSelection = () => {
        if (!showAccountSelection) return null;
        return (
            <div className="mb-2 rounded-xl border border-border/40 bg-muted/10 p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2 px-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{accountSelectionTitle}</span>
                    {selectedAccount && (
                        <span className="text-[9px] text-muted-foreground truncate max-w-[140px]">{selectedAccount.name}</span>
                    )}
                </div>
                {eligibleAccounts.length === 0 ? (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        Bu ödeme yöntemi için uygun hesap bulunamadı.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {eligibleAccounts.map((account) => {
                            const Icon = account.type === "CASH" ? Banknote : account.type === "BANK" ? Landmark : CreditCard;
                            const checked = selectedAccountId === account.id;
                            return (
                                <button
                                    key={account.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedAccountId?.(account.id);
                                        if (typeof window !== "undefined" && paymentMethod) {
                                            localStorage.setItem(`pos_last_account_${paymentMethod}`, account.id);
                                        }
                                    }}
                                    className={cn(
                                        "min-h-8 rounded-lg border px-2 py-1 flex items-center gap-2 text-left transition-all",
                                        checked
                                            ? "border-primary bg-primary/10 text-primary font-bold"
                                            : "border-border/40 bg-background/60 text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[10px] font-bold truncate leading-tight">{account.name}</span>
                                        <span className="block text-[8px] uppercase tracking-wider opacity-70 leading-none mt-0.5">
                                            {account.type === "CASH" ? "NAKİT" : account.type === "BANK" ? "BANKA" : "KART"} 
                                            {account.balance !== undefined ? ` • ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: defaultCurrency || 'TRY', maximumFractionDigits: 2 }).format(convertBalance(Number(account.balance), 'TRY'))}` : ` • ${defaultCurrency || "TRY"}`}
                                        </span>
                                    </span>
                                    {checked && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (isCompact) {
        return (
            <div className="space-y-2 border-t border-border/40 bg-card p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl">
                <div className="bg-muted/30 border border-border/40 p-2.5 rounded-2xl space-y-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between p-1 hover:bg-muted/50 rounded-xl transition-all duration-300 group"
                    >
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-[9px] font-black text-foreground tracking-wider uppercase leading-none flex items-center gap-1.5">
                                TOPLAM TUTAR
                                <ChevronDown className={cn("h-3 w-3 transition-transform duration-300 text-primary", showDetails && "rotate-180")} />
                            </span>
                            <span className="text-[8px] text-muted-foreground font-bold group-hover:text-primary transition-colors">
                                {showDetails ? "Detayları Gizle" : "Detayları Gör"}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            {loyaltyDiscountAmount > 0 && (
                                <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-none text-[8px] font-black mb-1 px-2 py-0.5 rounded-md">
                                    - {currencySymbol}{formatCurrency(defaultCurrency === 'TRY' ? loyaltyDiscountAmount : loyaltyDiscountAmount / currentUsdRate)}
                                </Badge>
                            )}
                            <span className="text-2xl font-black text-blue-700 dark:text-blue-400 tabular-nums tracking-tighter leading-none transition-transform group-active:scale-95">
                                {formattedTotal}
                            </span>
                            {formattedEquivalentTotal && (
                                <span className="text-[10px] font-bold text-muted-foreground italic mt-0.5 leading-none">
                                    {formattedEquivalentTotal}
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Collapsible Details */}
                    <div className={cn(
                        "space-y-2 overflow-hidden transition-all duration-300 ease-in-out border-t border-border/20 pt-2 mt-2",
                        showDetails ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    )}>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ARA TOPLAM</span>
                            <span className="text-[11px] font-black text-foreground/70 tabular-nums">{formattedSubtotal}</span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">KDV (%20)</span>
                            <span className="text-[11px] font-black text-foreground/70 tabular-nums">{formattedTax}</span>
                        </div>
                    </div>
                </div>

                {loyaltyEnabled && totalPoints > 0 && (
                    <div className="p-2.5 rounded-xl bg-blue-600 shadow-md flex items-center justify-between group overflow-hidden relative">
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">SADAKAT PUANLARI</span>
                                <span className="text-[11px] font-bold text-white tabular-nums">{totalPoints} Puan • ₺{formatCurrency(totalPoints * pointValueTl)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <Checkbox
                                checked={applyLoyaltyDiscount}
                                onCheckedChange={(checked) => setApplyLoyaltyDiscount(!!checked)}
                                className="h-5 w-5 rounded-md border-2 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-1.5 py-2.5 rounded-xl border transition-all duration-300 relative group overflow-hidden",
                                paymentMethod === method.id
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50 hover:border-border"
                            )}
                        >
                            <method.icon className={cn("h-4 w-4", paymentMethod === method.id ? "text-white" : method.color)} />
                            <span className="text-[8px] font-black tracking-wider uppercase">{method.label}</span>
                        </button>
                    ))}
                </div>

                {renderAccountSelection()}

                <div className="flex gap-2 min-h-[44px]">
                    <Button
                        disabled={isProcessing}
                        onClick={onCheckout}
                        className={cn(
                            "flex-1 h-11 text-xs font-black tracking-wider rounded-xl shadow-lg transition-all gap-2 uppercase py-2",
                            isDebtBlocked
                                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white"
                        )}
                    >
                        {isDebtBlocked ? <AlertCircle className="h-4 w-4" /> : (isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />)}
                        {isDebtBlocked ? "Müşteri Seçilmelidir" : (isProcessing ? "İşleniyor..." : "Tamamla & Fiş Yazdır")}
                    </Button>
                </div>
            </div>
        );
    }

    // Standard Page View for POSInterface (Compact Bento Optimization)
    return (
        <div className="p-3 sm:p-3.5 bg-muted/5 border-t border-border/40 shrink-0">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2.5">
                {paymentMethods.map((method) => (
                    <Button
                        key={method.id}
                        variant="ghost"
                        className={cn(
                            "h-11 sm:h-12 flex flex-col gap-1 rounded-xl border transition-all p-0 group",
                            paymentMethod === method.id
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                                : "bg-muted/10 text-muted-foreground border-border/20 hover:bg-muted hover:border-border/50"
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                    >
                        <method.icon className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform group-hover:scale-110", paymentMethod === method.id ? "text-primary-foreground" : "text-muted-foreground/70")} />
                        <span className="text-[9px] font-black uppercase tracking-wider">{method.label}</span>
                    </Button>
                ))}
            </div>

            {renderAccountSelection()}

            {loyaltyEnabled && totalPoints > 0 && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-tight">
                                CÜZDAN BAKİYESİ
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                                {totalPoints} Puan ({formatCurrency(totalPoints * pointValueTl)} TL)
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {applyLoyaltyDiscount && (
                            <span className="text-[10px] font-bold text-emerald-500">-₺{formatCurrency(loyaltyDiscountAmount)}</span>
                        )}
                        <Checkbox
                            checked={applyLoyaltyDiscount}
                            onCheckedChange={(checked) => setApplyLoyaltyDiscount(!!checked)}
                            className="h-5 w-5 rounded-md border-primary/50 data-[state=checked]:bg-primary"
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase opacity-80">ÖDENECEK TOPLAM</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground/75 tabular-nums">
                            {formattedEquivalentTotal}
                        </span>
                        <span className="text-xl sm:text-2xl text-foreground font-black tracking-tight tabular-nums">{formattedTotal}</span>
                    </div>
                </div>

                <Button
                    className={cn(
                        "h-10 sm:h-11 w-full text-xs sm:text-sm font-bold gap-2 rounded-xl transition-all shadow-md border active:scale-[0.98] uppercase leading-tight",
                        isDebtBlocked
                            ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-rose-500/10"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/20 border-primary/20"
                    )}
                    disabled={isProcessing}
                    onClick={onCheckout}
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>İŞLENİYOR...</span>
                        </div>
                    ) : (
                        <>
                            <span className="flex-1 truncate">
                                {isDebtBlocked
                                    ? "MÜŞTERİ SEÇİLMELİDİR (VERESİYE)"
                                    : "SATIŞI TAMAMLA & FİŞ YAZDIR"}
                            </span>
                            {isDebtBlocked
                                ? <AlertCircle className="h-4 w-4 shrink-0" />
                                : <CheckCircle className="h-4 w-4 shrink-0" />}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
