"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeftRight,
    Calendar,
    Clock,
    FileText,
    MessageCircle,
    Pencil,
    Printer,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UnifiedOperation } from "@/lib/actions/activity-actions";
import { EditTransactionWrapper } from "@/components/finance/edit-transaction-wrapper";

interface OperationDetailsProps {
    op: UnifiedOperation;
    getTypeColor: (type: any) => string;
    getTypeLabel: (type: any) => string;
    getPaymentLabel: (method: string) => string;
    translateLabel: (text: string | null | undefined) => string;
    handleReturn: (op: UnifiedOperation, item?: any) => void;
    handleSendWhatsApp: (op: UnifiedOperation, item?: any) => void;
    handlePrintReceipt: (op: UnifiedOperation) => void;
    handleDeleteSale?: (op: UnifiedOperation) => void;
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
    handleDeleteSale,
    rates,
    defaultCurrency = "TRY"
}: OperationDetailsProps) {
    const convertAmount = (amount: number, currency: string) => {
        let converted = amount;
        let symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
        if (defaultCurrency !== currency && rates) {
            if (currency === "TRY" && defaultCurrency === "USD") {
                converted = amount / (rates.usd || 34.5);
                symbol = "$";
            } else if (currency === "USD" && defaultCurrency === "TRY") {
                converted = amount * (rates.usd || 34.5);
                symbol = "₺";
            }
        }
        return { amount: converted, symbol };
    };

    const isFullyReturned = op.isReturned || op.status === "İADE EDİLDİ" || (op.amount === 0 && (op.type === "SALE" || !!op.saleId));
    const isSale = op.type === "SALE" || !!op.saleId;

    const transactionForEdit = {
        id: op.id,
        amount: op.amount,
        currency: op.currency,
        type: op.transactionType || (op.type === "EXPENSE" ? "EXPENSE" : "INCOME"),
        description: op.description,
        category: op.status,
        customerId: op.customerId,
        customer: op.customerId ? { id: op.customerId, name: op.customerName } : undefined,
        paymentMethod: op.paymentMethod,
        financeAccountId: op.financeAccountId,
        saleId: op.saleId,
        debtId: op.debtId,
        createdAt: op.date,
    };

    return (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/40 space-y-4 animate-in fade-in duration-200">
            {/* Üst Kısım: Tarih & Saat ve Fiş / İşlem Numarası */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1.5 bg-background/70 px-3 py-1.5 rounded-xl border border-border/30 shadow-xs">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>{format(new Date(op.date), "dd MMMM yyyy", { locale: tr })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-background/70 px-3 py-1.5 rounded-xl border border-border/30 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{format(new Date(op.date), "HH:mm")}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-background/70 border border-border/30 text-muted-foreground">
                        #{op.number}
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2.5 py-1 rounded-lg border", getTypeColor(op.type))}>
                        {op.status || getTypeLabel(op.type)}
                    </Badge>
                </div>
            </div>

            {/* Ürün Bilgisi ve Açıklama Bölümü */}
            <div className="space-y-2.5">
                {op.description && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/50 border border-border/20 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block mb-0.5">Ürün Açıklaması / Not</span>
                            <span className="italic text-foreground/90 font-medium text-xs sm:text-sm">"{op.description}"</span>
                        </div>
                    </div>
                )}

                {op.items.length > 0 ? (
                    <div className="space-y-2">
                        {op.items.map((item, idx) => {
                            const { amount: itemPrice, symbol } = convertAmount(item.price || 0, op.currency);
                            return (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-background/80 border border-border/30 gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground block">{item.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                Birim Fiyat: {symbol}{itemPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right sm:self-center font-bold text-sm text-foreground/90 pl-11 sm:pl-0">
                                        {symbol}{(itemPrice * (item.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl bg-background/80 border border-border/30 text-xs sm:text-sm font-semibold text-muted-foreground">
                        {op.description || "Kayıtlı ürün bilgisi bulunmuyor."}
                    </div>
                )}
            </div>

            {/* Aksiyon Butonları Çubuğu: WhatsApp, İade, Düzenle, Fiş Yazdır, Satışı Sil */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/20">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-4 rounded-xl font-bold text-xs tracking-wider uppercase border-border/40 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all"
                    onClick={() => handleSendWhatsApp(op)}
                >
                    <MessageCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    WHATSAPP
                </Button>

                {isSale && !isFullyReturned && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-4 rounded-xl font-bold text-xs tracking-wider uppercase border-border/40 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30 transition-all"
                        onClick={() => handleReturn(op, op.items.length === 1 ? op.items[0] : undefined)}
                    >
                        <ArrowLeftRight className="w-4 h-4 mr-2 text-orange-500" />
                        İADE ET
                    </Button>
                )}

                <EditTransactionWrapper
                    transaction={transactionForEdit}
                    trigger={
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-10 px-4 rounded-xl font-bold text-xs tracking-wider uppercase border-border/40 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-all"
                        >
                            <Pencil className="w-4 h-4 mr-2 text-blue-500" />
                            DÜZENLE
                        </Button>
                    }
                />

                {isSale && (
                    <Button
                        size="sm"
                        className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-emerald-600/20 transition-all"
                        onClick={() => handlePrintReceipt(op)}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        FİŞ YAZDIR
                    </Button>
                )}

                {isSale && handleDeleteSale && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-4 rounded-xl font-bold text-xs tracking-wider uppercase border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white transition-all ml-auto"
                        onClick={() => handleDeleteSale(op)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        SATIŞI SİL
                    </Button>
                )}
            </div>
        </div>
    );
}
