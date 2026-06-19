"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeftRight,
    MessageCircle,
    Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedOperation } from "@/lib/actions/activity-actions";

interface OperationDetailsProps {
    op: UnifiedOperation;
    getTypeColor: (type: any) => string;
    getTypeLabel: (type: any) => string;
    getPaymentLabel: (method: string) => string;
    translateLabel: (text: string | null | undefined) => string;
    handleReturn: (op: UnifiedOperation, item: any) => void;
    handleSendWhatsApp: (op: UnifiedOperation, item?: any) => void;
    handlePrintReceipt: (op: UnifiedOperation) => void;
    rates?: any;
    defaultCurrency?: string;
}

export function OperationDetails({
    op,
    getTypeColor,
    getTypeLabel,
    getPaymentLabel,
    translateLabel,
    handleReturn,
    handleSendWhatsApp,
    handlePrintReceipt,
    rates,
    defaultCurrency = "TRY"
}: OperationDetailsProps) {
    const convertAmount = (amount: number, currency: string) => {
        if (defaultCurrency !== currency && rates) {
            if (currency === "TRY" && defaultCurrency === "USD") {
                return { amount: amount / (rates.usd || 34.5), symbol: "$" };
            } else if (currency === "USD" && defaultCurrency === "TRY") {
                return { amount: amount * (rates.usd || 34.5), symbol: "₺" };
            }
        }
        return { amount, symbol: currency === "USD" ? "$" : "₺" };
    };

    const { amount: displayAmount, symbol: displaySymbol } = convertAmount(op.amount, op.currency);
    const isIncome = op.transactionType === 'INCOME';
    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">İşlem Detayları</h4>
                <div className="h-px flex-1 bg-border/20 mx-4" />
                <span className="text-[10px] font-mono opacity-40">#{op.number}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <p className="text-[14px] text-muted-foreground/80 leading-relaxed italic">"{op.description}"</p>
                    {op.items.length > 0 && (
                        <div className="space-y-3">
                            {op.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-background/50 border border-border/40 group/sub">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[13px]">{item.quantity}x</div>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-black tracking-tight">{item.name}</span>
                                            <span className="text-[12px] text-muted-foreground font-bold">{convertAmount(item.price || 0, op.currency).symbol}{convertAmount(item.price || 0, op.currency).amount.toLocaleString('tr-TR')} / birim</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-500/10 hover:text-orange-600"
                                            onClick={() => handleReturn(op, item)}
                                        >
                                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                                            İADE
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-600"
                                            onClick={() => handleSendWhatsApp(op, item)}
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            MSJ
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-background/40 rounded-[2rem] p-8 border border-border/40 space-y-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">İŞLEM ÖZETİ</span>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className={cn(
                                "text-3xl font-black tracking-tighter",
                                isIncome ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {isIncome ? "+" : "-"}{displaySymbol}{displayAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] font-black tracking-[0.1em] px-3 py-1 uppercase rounded-lg border-2", getTypeColor(op.type))}>
                                {getTypeLabel(op.type)}
                            </Badge>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/40 border border-border/20">
                            <span className="text-[10px] font-black text-muted-foreground opacity-60 uppercase tracking-widest">ÖDEME YÖNTEMİ</span>
                            <span className="text-[13px] font-black">{getPaymentLabel(op.paymentMethod)}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/40 border border-border/20">
                            <span className="text-[10px] font-black text-muted-foreground opacity-60 uppercase tracking-widest">HESAP / KASA</span>
                            <span className="text-[13px] font-black truncate">{translateLabel(op.accountName) || "Nakit Kasa"}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-[11px] tracking-widest uppercase shadow-xl shadow-emerald-500/20"
                            onClick={() => handlePrintReceipt(op)}
                        >
                            <Printer className="w-5 h-5 mr-3" />
                            FİŞ YAZDIR
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-14 rounded-2xl font-black text-[11px] tracking-widest uppercase border-border/40 hover:bg-background"
                            onClick={() => handleSendWhatsApp(op)}
                        >
                            <MessageCircle className="w-5 h-5 mr-3 text-emerald-500" />
                            WHATSAPP
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
