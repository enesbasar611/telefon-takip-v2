"use client";

import React from "react";
import { CheckCircle2, FileText, Printer, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface PaymentSummary {
    customerId: string;
    customerName: string;
    items: string[];
    paidAmount: number;
    currency: string;
    previousTRY: number;
    previousUSD: number;
    remainingTRY: number;
    remainingUSD: number;
}

interface VeresiyePaymentSummaryModalProps {
    paymentSummary: PaymentSummary | null;
    onClose: () => void;
    isPending: boolean;
    onPrintReceipt: () => Promise<void>;
}

export const VeresiyePaymentSummaryModal: React.FC<VeresiyePaymentSummaryModalProps> = ({
    paymentSummary,
    onClose,
    isPending,
    onPrintReceipt,
}) => {
    if (!paymentSummary) return null;

    return (
        <AlertDialog open={!!paymentSummary} onOpenChange={(o) => { if (!o) onClose(); }}>
            <AlertDialogContent className="max-w-[500px] bg-background dark:bg-[#0f172a] rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none">
                <div className="p-8 bg-emerald-500 text-white flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-1">
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Tahsilat Başarılı</AlertDialogTitle>
                        <p className="text-emerald-50 opacity-90 text-sm font-medium">Ödeme kaydı başarıyla oluşturuldu ve borçlardan düşüldü.</p>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">ÖDEME YAPILAN KALEMLER</span>
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                            {paymentSummary.items.map((it, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="truncate">{it}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <span className="block text-[9px] font-black uppercase tracking-widest mb-1 text-slate-500">Önceki Bakiye</span>
                            <span className="text-lg font-black font-mono text-slate-700 dark:text-slate-200">
                                ₺{Math.round(paymentSummary.previousTRY).toLocaleString('tr-TR')}
                            </span>
                            {paymentSummary.previousUSD > 0 && (
                                <span className="block text-[10px] font-bold text-slate-400 mt-0.5">
                                    + ${Math.round(paymentSummary.previousUSD).toLocaleString('tr-TR')}
                                </span>
                            )}
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white !text-white shadow-lg shadow-emerald-500/20">
                            <span className="block text-[9px] font-black uppercase tracking-widest mb-1 opacity-80 !text-white">Tahsil Edilen</span>
                            <span className="text-xl font-black font-mono !text-white">
                                {paymentSummary.currency === 'USD' ? '$' : '₺'}{Math.round(paymentSummary.paidAmount).toLocaleString('tr-TR')}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-500 dark:bg-indigo-600 text-white !text-white shadow-lg shadow-indigo-500/20">
                        <span className="block text-[9px] font-black uppercase tracking-widest mb-1 opacity-80 !text-white text-center">Kalan Bakiye</span>
                        <div className="flex justify-center items-center gap-6">
                            <span className="text-xl font-black font-mono !text-white">
                                ₺{Math.round(paymentSummary.remainingTRY).toLocaleString('tr-TR')}
                            </span>
                            {paymentSummary.remainingUSD > 0 && (
                                <span className="text-xl font-black font-mono !text-white">
                                    ${Math.round(paymentSummary.remainingUSD).toLocaleString('tr-TR')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-[#1a2231] border-t border-slate-100 dark:border-white/5 flex gap-3">
                    <Button
                        variant="outline"
                        disabled={isPending}
                        onClick={onPrintReceipt}
                        className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs gap-2"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                <Printer className="w-4 h-4" />
                                Fiş Yazdır
                            </>
                        )}
                    </Button>
                    <Button onClick={onClose} className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-xs">Tamam</Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};
