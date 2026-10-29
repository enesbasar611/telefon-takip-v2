"use client";

import React from "react";
import {
    Wallet,
    CreditCard,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowUpRight,
    X
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VeresiyePaymentModalProps {
    paymentCustomer: any;
    onClose: () => void;
    paymentAmount: string;
    onAmountChange: (val: string) => void;
    paymentCurrency: string;
    onCurrencyChange: (curr: string) => void;
    paymentMethod: "CASH" | "CARD" | "TRANSFER";
    onMethodChange: (method: "CASH" | "CARD" | "TRANSFER") => void;
    paymentNotes: string;
    onNotesChange: (val: string) => void;
    selectedAccountId: string;
    onAccountChange: (id: string) => void;
    accounts: any[];
    isPending: boolean;
    onConfirm: () => void;
    rates: any;
    setIgnoreBalance: (val: boolean) => void;
}

export const VeresiyePaymentModal: React.FC<VeresiyePaymentModalProps> = ({
    paymentCustomer,
    onClose,
    paymentAmount,
    onAmountChange,
    paymentCurrency,
    onCurrencyChange,
    paymentMethod,
    onMethodChange,
    paymentNotes,
    onNotesChange,
    selectedAccountId,
    onAccountChange,
    accounts,
    isPending,
    onConfirm,
    rates,
    setIgnoreBalance
}) => {
    if (!paymentCustomer) return null;

    const filteredAccounts = accounts.filter((acc: any) =>
        paymentMethod === 'CASH' ? acc.type === 'CASH' :
            paymentMethod === 'CARD' ? (acc.type === 'POS' || acc.type === 'BANK') :
                (acc.type === 'BANK')
    );

    return (
        <AlertDialog open={!!paymentCustomer} onOpenChange={(o) => { if (!o) onClose(); }}>
            <AlertDialogContent className="fixed left-0 right-0 top-auto bottom-0 z-[100] w-full max-w-none translate-x-0 translate-y-0 gap-0 bg-card border border-border/50 p-0 overflow-hidden rounded-t-2xl rounded-b-none shadow-2xl flex flex-col h-[90dvh] max-h-[90dvh] sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:w-[min(540px,calc(100vw-2rem))] sm:max-w-[540px] sm:h-auto sm:max-h-[min(90dvh,720px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl transition-all duration-300">
                <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-card to-card border-b border-border/50 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
                        <Wallet className="w-20 h-20 rotate-12" />
                    </div>
                    <div className="sm:hidden w-10 h-1 bg-border rounded-full mx-auto mb-2" />
                    <AlertDialogHeader className="relative z-10 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <AlertDialogTitle className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">Tahsilat İşlemi</AlertDialogTitle>
                            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors shrink-0" aria-label="Kapat">
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        <AlertDialogDescription className="text-muted-foreground text-xs font-medium flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="font-bold text-foreground">{paymentCustomer?.name}</span> •
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-bold">₺{paymentCustomer?.totalRemainingTRY?.toLocaleString('tr-TR')}</span>
                            {paymentCustomer?.totalRemainingUSD > 0 && (
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold">
                                    ${paymentCustomer?.totalRemainingUSD?.toLocaleString('tr-TR')}
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 scrollbar-hide">
                    {/* Currency toggle */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">Ödeme Birimi</Label>
                        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
                            <button
                                type="button"
                                onClick={() => onCurrencyChange("TRY")}
                                className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", paymentCurrency === "TRY" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs border border-border/40" : "text-muted-foreground hover:text-foreground")}
                            >
                                Türk Lirası (₺)
                            </button>
                            <button
                                type="button"
                                onClick={() => onCurrencyChange("USD")}
                                className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", paymentCurrency === "USD" ? "bg-card text-blue-600 dark:text-blue-400 shadow-2xs border border-border/40" : "text-muted-foreground hover:text-foreground")}
                            >
                                Dolar ($)
                            </button>
                        </div>
                    </div>

                    {/* Amount input */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">Ödeme Tutarı</Label>
                        <div className="relative group overflow-hidden rounded-xl bg-card border border-border/70 focus-within:border-emerald-500/50 transition-all">
                            <span className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black",
                                paymentCurrency === "USD" ? "text-blue-500" : "text-emerald-500"
                            )}>{paymentCurrency === "USD" ? '$' : '₺'}</span>
                            <Input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => {
                                    onAmountChange(e.target.value);
                                    setIgnoreBalance(false);
                                }}
                                placeholder="0.00"
                                className="pl-10 pr-28 sm:pr-32 h-12 bg-transparent border-none text-xl sm:text-2xl font-black focus-visible:ring-0 tabular-nums text-foreground"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        const total = paymentCurrency === 'TRY'
                                            ? (paymentCustomer?.totalRemainingTRY + (paymentCustomer?.totalRemainingUSD * (rates?.usd || 1)))
                                            : (paymentCustomer?.totalRemainingUSD + (paymentCustomer?.totalRemainingTRY / (rates?.usd || 1)));
                                        onAmountChange(String(Math.ceil(total)));
                                        setIgnoreBalance(true);
                                    }}
                                    className="h-8 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-[10px] font-black transition-all uppercase tracking-wider shadow-2xs"
                                >
                                    Borcu Kapat
                                </Button>
                            </div>
                        </div>
                        {Number(paymentAmount) > (
                            paymentCurrency === 'TRY'
                                ? (paymentCustomer?.totalRemainingTRY || 0) + ((paymentCustomer?.totalRemainingUSD || 0) * (rates?.usd || 1))
                                : (paymentCustomer?.totalRemainingUSD || 0) + ((paymentCustomer?.totalRemainingTRY || 0) / (rates?.usd || 1))
                        ) && (
                            <div className="mt-2 flex items-start gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-500 p-2.5 rounded-xl border border-amber-500/20 text-xs">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div className="text-[11px] font-medium">
                                    <strong className="font-bold block uppercase tracking-wider text-[10px]">Emanet Bakiye Oluşacak</strong>
                                    Fark ({
                                        paymentCurrency === 'TRY' ? '₺' : '$'
                                    }{(Number(paymentAmount) - (paymentCurrency === 'TRY'
                                        ? (paymentCustomer?.totalRemainingTRY || 0) + ((paymentCustomer?.totalRemainingUSD || 0) * (rates?.usd || 1))
                                        : (paymentCustomer?.totalRemainingUSD || 0) + ((paymentCustomer?.totalRemainingTRY || 0) / (rates?.usd || 1)))).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) emanet bakiyeye eklenecektir.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note input */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">Açıklama (Opsiyonel)</Label>
                        <Input
                            value={paymentNotes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Tahsilat için ek açıklama yazın..."
                            className="h-9.5 bg-card border border-border/70 rounded-xl px-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Payment method */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">Ödeme Yöntemi</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'CASH', label: 'Nakit', icon: Wallet },
                                { id: 'CARD', label: 'Kart/POS', icon: CreditCard },
                                { id: 'TRANSFER', label: 'Havale', icon: RefreshCcw }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => onMethodChange(method.id as any)}
                                    className={cn(
                                        "flex items-center justify-center gap-1.5 h-10 rounded-xl border transition-all duration-200 cursor-pointer text-xs font-bold",
                                        paymentMethod === method.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-card border-border/70 text-muted-foreground hover:border-indigo-500/40 hover:bg-muted/40"
                                    )}
                                >
                                    <method.icon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account selection */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={paymentMethod}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-1.5"
                        >
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                                {paymentMethod === 'CASH' ? 'Kasa Seçimi' : paymentMethod === 'CARD' ? 'POS / Hesap Seçimi' : 'Banka Hesabı Seçimi'}
                            </Label>
                            {filteredAccounts.length === 0 ? (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                            Hesap Bulunamadı
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 pl-5.5">
                                        Finans panelinden {paymentMethod === 'CASH' ? 'bir nakit kasa' : 'bir banka veya POS hesabı'} oluşturmalısınız.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {filteredAccounts.map((acc: any) => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => onAccountChange(acc.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                                                selectedAccountId === acc.id
                                                    ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/40 shadow-2xs"
                                                    : "bg-card border-border/60 hover:border-border hover:bg-muted/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                selectedAccountId === acc.id
                                                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                                    : "bg-muted/60 text-muted-foreground"
                                            )}>
                                                {acc.type === 'CASH' ? <Wallet className="w-4 h-4" /> : acc.type === 'POS' ? <CreditCard className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-bold truncate", selectedAccountId === acc.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>{acc.name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase">{acc.type === 'CASH' ? 'Nakit Kasa' : acc.type === 'POS' ? 'POS Cihazı' : 'Banka Hesabı'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-foreground tabular-nums">₺{Number(acc.balance).toLocaleString('tr-TR')}</p>
                                                <p className="text-[9px] text-muted-foreground/60">Bakiye</p>
                                            </div>
                                            {selectedAccountId === acc.id && (
                                                <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-3.5 sm:p-4 flex gap-2.5 border-t border-border/50 bg-card/95 backdrop-blur shrink-0">
                    <AlertDialogCancel className="h-10 flex-1 rounded-xl border border-border text-xs font-bold uppercase tracking-wider transition-all mt-0">Vazgeç</AlertDialogCancel>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending || !selectedAccountId}
                        className="h-10 flex-[2] rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-sm text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tahsilatı Tamamla"}
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};
