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
            <AlertDialogContent className="fixed left-0 right-0 top-auto bottom-0 z-[100] w-full max-w-none translate-x-0 translate-y-0 gap-0 bg-card border border-border/50 p-0 overflow-hidden rounded-t-[2rem] rounded-b-none shadow-2xl flex flex-col h-[92dvh] max-h-[92dvh] sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:w-[min(600px,calc(100vw-2rem))] sm:max-w-[600px] sm:h-auto sm:max-h-[min(92dvh,760px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2.5rem] transition-all duration-500">
                <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 via-card to-card border-b border-border/50 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.04]"><Wallet className="w-24 h-24 sm:w-28 sm:h-28 rotate-12" /></div>
                    <div className="sm:hidden w-12 h-1 bg-border rounded-full mx-auto mb-3" />
                    <AlertDialogHeader className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                            <AlertDialogTitle className="text-xl sm:text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight leading-tight">TAHSİLAT İŞLEMİ</AlertDialogTitle>
                            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors shrink-0" aria-label="Kapat"><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <AlertDialogDescription className="text-muted-foreground text-xs sm:text-sm font-medium pt-2 flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground">{paymentCustomer?.name}</span> için ödeme •
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">₺{paymentCustomer?.totalRemainingTRY?.toLocaleString('tr-TR')}</span>
                            {paymentCustomer?.totalRemainingUSD > 0 && (
                                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold">
                                    ${paymentCustomer?.totalRemainingUSD?.toLocaleString('tr-TR')}
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 scrollbar-hide">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME BİRİMİ</Label>
                        <div className="flex bg-muted/50 dark:bg-muted/30 p-1.5 rounded-2xl h-14 border border-border/50">
                            <button type="button" onClick={() => onCurrencyChange("TRY")} className={cn("flex-1 text-xs font-bold rounded-xl transition-all duration-200", paymentCurrency === "TRY" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}>TÜRK LİRASI (₺)</button>
                            <button type="button" onClick={() => onCurrencyChange("USD")} className={cn("flex-1 text-xs font-bold rounded-xl transition-all duration-200", paymentCurrency === "USD" ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}>DOLAR ($)</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME TUTARI</Label>
                        <div className="relative group overflow-hidden rounded-2xl bg-muted/30 dark:bg-muted/20 border-2 border-border/60 focus-within:border-emerald-500/40 transition-all">
                            <span className={cn(
                                "absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black transition-all duration-300",
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
                                className="pl-14 sm:pl-16 pr-6 sm:pr-40 h-16 sm:h-20 bg-transparent border-none text-2xl sm:text-3xl font-black focus-visible:ring-0 tabular-nums text-foreground"
                            />
                            <div className="px-4 pb-4 sm:p-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
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
                                    className="h-10 sm:h-9 w-full sm:w-auto px-4 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-[10px] font-black transition-all uppercase tracking-wider shadow-sm hover:shadow-emerald-500/20"
                                >
                                    BORCU KAPAT
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">AÇIKLAMA (OPSİYONEL)</Label>
                        <Input
                            value={paymentNotes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Tahsilat için ek açıklama yazın..."
                            className="h-12 bg-muted/30 dark:bg-muted/20 border border-border/50 rounded-xl px-5 focus-visible:ring-1 focus-visible:ring-indigo-500/20 text-sm text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME YÖNTEMİ</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'CASH', label: 'Nakit', icon: Wallet, desc: 'Nakit Kasa' },
                                { id: 'CARD', label: 'Kart', icon: CreditCard, desc: 'POS / Banka' },
                                { id: 'TRANSFER', label: 'Havale/EFT', icon: RefreshCcw, desc: 'Banka Hesabı' }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => onMethodChange(method.id as any)}
                                    className={cn(
                                        "flex flex-row sm:flex-col items-center justify-center h-14 sm:h-[4.5rem] gap-2 sm:gap-1.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer",
                                        paymentMethod === method.id
                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25 scale-[1.03]"
                                            : "bg-card border-border/60 text-muted-foreground hover:border-indigo-500/30 hover:bg-muted/30"
                                    )}
                                >
                                    <method.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={paymentMethod}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                {paymentMethod === 'CASH' ? 'KASA SEÇİMİ' : paymentMethod === 'CARD' ? 'POS / HESAP SEÇİMİ' : 'BANKA HESABI SEÇİMİ'}
                            </Label>
                            {filteredAccounts.length === 0 ? (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            {paymentMethod === 'CASH' ? 'NAKİT KASA BULUNAMADI' : 'BANKA / POS HESABI BULUNAMADI'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-amber-700/80 dark:text-amber-300/70 pl-6">
                                        Tahsilat yapabilmek için Finans panelinden {paymentMethod === 'CASH' ? 'bir nakit kasa' : 'bir banka veya POS hesabı'} oluşturmalısınız.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredAccounts.map((acc: any) => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => onAccountChange(acc.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                                                selectedAccountId === acc.id
                                                    ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/40 shadow-sm"
                                                    : "bg-card border-border/50 hover:border-border hover:bg-muted/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                selectedAccountId === acc.id
                                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                    : "bg-muted/50 text-muted-foreground"
                                            )}>
                                                {acc.type === 'CASH' ? <Wallet className="w-5 h-5" /> : acc.type === 'POS' ? <CreditCard className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-bold truncate", selectedAccountId === acc.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>{acc.name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{acc.type === 'CASH' ? 'Nakit Kasa' : acc.type === 'POS' ? 'POS Cihazı' : 'Banka Hesabı'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-muted-foreground tabular-nums">₺{Number(acc.balance).toLocaleString('tr-TR')}</p>
                                                <p className="text-[9px] text-muted-foreground/60">Bakiye</p>
                                            </div>
                                            {selectedAccountId === acc.id && (
                                                <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-4 md:p-6 flex flex-col sm:flex-row gap-3 border-t border-border/50 bg-card/95 backdrop-blur shrink-0">
                    <AlertDialogCancel className="h-12 flex-1 rounded-2xl border border-border bg-card text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted/50 transition-all mt-0">Vazgeç</AlertDialogCancel>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending || !selectedAccountId}
                        className="h-12 flex-[2] rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tahsilatı Tamamla"}
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog >
    );
};
