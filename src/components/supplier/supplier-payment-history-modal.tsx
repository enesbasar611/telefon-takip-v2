"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Package,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierPaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
}

export function SupplierPaymentHistoryModal({ isOpen, onClose, supplier }: SupplierPaymentHistoryModalProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    if (!supplier) return null;

    const transactions = supplier.transactions || [];
    const purchases = supplier.purchases || [];

    // Create a list of "Payment Records"
    const paymentRecords: any[] = [];

    // 1. Paid Orders (Orders with any payment)
    purchases.forEach((order: any) => {
        const paidAmount = Number(order.totalAmount) - Number(order.remainingAmount);
        if (paidAmount > 0) {
            paymentRecords.push({
                type: "ORDER",
                date: order.createdAt,
                id: order.id,
                orderNo: order.orderNo,
                items: order.items || [],
                totalAmount: Number(order.totalAmount),
                paidAmount: paidAmount,
                remainingAmount: Number(order.remainingAmount),
                paymentStatus: order.paymentStatus,
                description: `${order.orderNo} nolu sipariş`
            });
        }
    });

    // 2. Direct Payments (Transactions not linked to orders)
    transactions.forEach((t: any) => {
        if (!t.purchaseOrderId && t.type === "EXPENSE") {
            paymentRecords.push({
                type: "PAYMENT",
                date: t.date || t.createdAt,
                id: t.id,
                amount: Number(t.amount),
                description: t.description || "Genel Ödeme",
                items: []
            });
        }
    });

    // Sort by date descending
    const sortedRecords = paymentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPages = Math.ceil(sortedRecords.length / pageSize);
    const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-w-full w-full h-[90vh] sm:h-auto flex flex-col bg-card border-border/50 p-0 overflow-hidden sm:rounded-3xl">
                <DialogHeader className="p-6 border-b border-border/50 bg-accent/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <History className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="font-medium text-xl text-foreground">Ödeme & Parça Geçmişi</DialogTitle>
                                <p className="text-xs font-semibold text-muted-foreground mt-1">
                                    {supplier.name} - Tüm ödenen parçalar ve cari işlemler.
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] px-3 py-1">
                            TOPLAM ÖDENEN: ₺{Math.round(Number(supplier.totalShopping || 0) - Number(supplier.balance || 0)).toLocaleString("tr-TR")}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6">
                        {sortedRecords.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground">
                                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Henüz ödeme kaydı bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {paginatedRecords.map((record) => (
                                    <div key={record.id} className="bg-accent/5 border border-border/50 rounded-2xl overflow-hidden transition-all hover:border-border">
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center",
                                                    record.type === "ORDER" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                                                )}>
                                                    {record.type === "ORDER" ? <Package className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">
                                                        {record.type === "ORDER" ? `#${record.orderNo}` : "Cari Ödeme"}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {format(new Date(record.date), "dd MMMM yyyy HH:mm", { locale: tr })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {record.type === "ORDER" && (
                                                    <Badge className={cn(
                                                        "text-[9px] border-none px-2 rounded-lg",
                                                        record.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {record.paymentStatus === "PAID" ? "ÖDENDİ" : "KISMİ ÖDEME"}
                                                    </Badge>
                                                )}
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-foreground">
                                                        ₺{Math.round(record.type === "ORDER" ? record.paidAmount : record.amount).toLocaleString("tr-TR")}
                                                    </p>
                                                    {record.type === "ORDER" && record.remainingAmount > 0 && (
                                                        <p className="text-[9px] text-rose-500 font-medium">Kalan: ₺{Math.round(record.remainingAmount).toLocaleString("tr-TR")}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            {record.type === "ORDER" ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {record.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-background/50 border border-border/30">
                                                            <div className="h-6 w-6 rounded-md bg-blue-500/5 flex items-center justify-center shrink-0">
                                                                <Package className="h-3 w-3 text-blue-400/50" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-medium text-foreground truncate">{item.name}</p>
                                                                <p className="text-[9px] text-muted-foreground">{item.quantity} Adet • ₺{Math.round(item.buyPrice).toLocaleString("tr-TR")}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic px-2">
                                                    {record.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="p-6 border-t border-border/50 bg-accent/5 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium">Toplam {sortedRecords.length} kayıt • Sayfa {currentPage}/{totalPages}</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-9 px-3 rounded-xl border-border/50 bg-background hover:bg-accent/10"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="h-9 px-3 rounded-xl border-border/50 bg-background hover:bg-accent/10"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-6 border-t border-border/50 bg-card sm:rounded-b-3xl">
                    <Button onClick={onClose} className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium">
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
