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
}

export function OperationDetails({
    op,
    getTypeColor,
    getTypeLabel,
    getPaymentLabel,
    translateLabel,
    handleReturn,
    handleSendWhatsApp,
    handlePrintReceipt
}: OperationDetailsProps) {
    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">İşlem Detayları</h4>
                <div className="h-px flex-1 bg-border/20 mx-4" />
                <span className="text-[10px] font-mono opacity-40">#{op.number}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">"{op.description}"</p>
                    {op.items.length > 0 && (
                        <div className="space-y-2">
                            {op.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-border/40 group/sub">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px]">{item.quantity}x</div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold">{item.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{op.currency === 'USD' ? '$' : '₺'}{(item.price || 0).toLocaleString('tr-TR')} / birim</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-3 rounded-xl text-[10px] font-bold hover:bg-orange-500/10 hover:text-orange-600"
                                            onClick={() => handleReturn(op, item)}
                                        >
                                            <ArrowLeftRight className="h-3 w-3 mr-1.5" />
                                            İADE
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-3 rounded-xl text-[10px] font-bold hover:bg-emerald-500/10 hover:text-emerald-600"
                                            onClick={() => handleSendWhatsApp(op, item)}
                                        >
                                            <MessageCircle className="h-3 w-3 mr-1.5" />
                                            MSJ
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-background/40 rounded-3xl p-6 border border-border/40 space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">İŞLEM ÖZETİ</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black">{op.currency === 'USD' ? '$' : '₺'}{op.amount.toLocaleString('tr-TR')}</span>
                            <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest", getTypeColor(op.type))}>
                                {getTypeLabel(op.type)}
                            </Badge>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-muted/20 border border-border/20">
                            <span className="text-[8px] font-black text-muted-foreground opacity-50 uppercase">ÖDEME YÖNTEMİ</span>
                            <span className="text-[10px] font-bold">{getPaymentLabel(op.paymentMethod)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-muted/20 border border-border/20">
                            <span className="text-[8px] font-black text-muted-foreground opacity-50 uppercase">HESAP / KASA</span>
                            <span className="text-[10px] font-bold truncate">{translateLabel(op.accountName) || "Nakit Kasa"}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                            onClick={() => handlePrintReceipt(op)}
                        >
                            <Printer className="w-3.5 h-3.5 mr-2" />
                            FİŞ YAZDIR
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-2xl font-bold text-[10px] tracking-widest"
                            onClick={() => handleSendWhatsApp(op)}
                        >
                            <MessageCircle className="w-3.5 h-3.5 mr-2" />
                            WHATSAPP
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
