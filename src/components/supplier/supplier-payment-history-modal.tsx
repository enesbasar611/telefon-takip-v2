"use client";

import { useState, useRef } from "react";
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
    History,
    Wallet,
    Landmark,
    FileText,
    ChevronDown,
    ChevronUp,
    Loader2,
    DollarSign,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPurchaseOrderItemsAction } from "@/lib/actions/purchase-actions";

interface SupplierPaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
    usdRate?: number;
}

// Siparişe ait ürünlerin yatay Carousel bileşeni
function OrderItemsCarousel({
    items,
    usdRate = 34.5
}: {
    items: any[];
    usdRate?: number;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -260 : 260;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (!items || items.length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic py-2">
                Bu siparişe ait ürün detayı bulunamadı.
            </p>
        );
    }

    return (
        <div className="relative group/carousel">
            {/* Scroll Navigation Buttons */}
            {items.length > 2 && (
                <div className="absolute -top-7 right-0 flex items-center gap-1 z-10">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("left")}
                        className="h-6 w-6 rounded-md border-border/50 bg-card hover:bg-white/10"
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("right")}
                        className="h-6 w-6 rounded-md border-border/50 bg-card hover:bg-white/10"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            )}

            {/* Carousel Container */}
            <div
                ref={scrollRef}
                className="flex items-center gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-0.5"
            >
                {items.map((item: any, idx: number) => {
                    const qty = Number(item.quantity || item.receivedQuantity || 1);
                    const unitPrice = Number(item.buyPrice || 0);
                    const unitPriceUsd = item.buyPriceUsd
                        ? Number(item.buyPriceUsd)
                        : (usdRate > 0 && unitPrice > 0 ? unitPrice / usdRate : null);
                    const total = qty * unitPrice;

                    return (
                        <div
                            key={item.id || idx}
                            className="w-56 shrink-0 snap-start p-3 rounded-xl bg-background/80 border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between gap-2 shadow-xs group/item"
                        >
                            <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                    <Package className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                                        {item.name || item.product?.name || "Ürün Tanımı"}
                                    </p>
                                    <span className="text-[9px] font-mono text-muted-foreground block truncate">
                                        {item.product?.sku || item.sku || "SKU-YOK"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/30 font-mono">
                                <span className="font-bold text-foreground">{qty} Adet</span>
                                <div className="text-right">
                                    <span className="font-bold text-emerald-400">
                                        ₺{Math.round(total).toLocaleString("tr-TR")}
                                    </span>
                                    {unitPriceUsd && (
                                        <span className="text-[9px] text-muted-foreground block">
                                            (${unitPriceUsd.toFixed(2)}/ad)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function SupplierPaymentHistoryModal({
    isOpen,
    onClose,
    supplier,
    usdRate = 34.5
}: SupplierPaymentHistoryModalProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
    const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
    const [orderItemsCache, setOrderItemsCache] = useState<Record<string, any[]>>({});
    const pageSize = 8;

    if (!supplier) return null;

    const transactions = supplier.transactions || supplier.SupplierTransaction || [];
    const purchases = supplier.purchases || [];

    // Ödeme Kayıtlarını Derle
    const paymentRecords: any[] = [];

    // 1. Ödenmiş veya Kısmi Ödenmiş Siparişler
    purchases.forEach((order: any) => {
        const total = Number(order.totalAmount || 0);
        const remaining = Number(order.remainingAmount || 0);
        const paidAmount = total - remaining;

        if (paidAmount > 0) {
            paymentRecords.push({
                type: "ORDER",
                date: order.createdAt,
                id: order.id,
                orderNo: order.orderNo,
                items: order.items || [],
                itemCount: (order.items || []).length,
                totalAmount: total,
                paidAmount: paidAmount,
                remainingAmount: remaining,
                paymentStatus: order.paymentStatus || (remaining === 0 ? "PAID" : "PARTIAL"),
                paymentMethod: order.paymentMethod || "CASH",
                description: order.description || `${order.orderNo} nolu toptancı alımı`,
            });
        }
    });

    // 2. Sipariş Dışı Doğrudan Cari Ödemeler
    transactions.forEach((t: any) => {
        if (!t.purchaseOrderId && t.type === "EXPENSE") {
            paymentRecords.push({
                type: "PAYMENT",
                date: t.date || t.createdAt,
                id: t.id,
                amount: Number(t.amount || 0),
                totalAmount: Number(t.amount || 0),
                paidAmount: Number(t.amount || 0),
                remainingAmount: 0,
                description: t.description || "Genel Tedarikçi Cari Borç Ödemesi",
                paymentMethod: t.paymentMethod || "CASH",
                items: [],
                itemCount: 0,
            });
        }
    });

    // Tarihe göre en yeniden eskiye sırala
    const sortedRecords = paymentRecords.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
    const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Ürünleri lazy load / on-demand açma
    const handleToggleOrderItems = async (orderId: string, preloadedItems?: any[]) => {
        const nextState = !expandedOrders[orderId];
        setExpandedOrders(prev => ({ ...prev, [orderId]: nextState }));

        if (!nextState) return;

        // Önbellekte varsa tekrar çekme
        if (orderItemsCache[orderId]) return;

        // Sipariş nesnesinde zaten items geldiyse onu kullan
        if (preloadedItems && preloadedItems.length > 0) {
            setOrderItemsCache(prev => ({ ...prev, [orderId]: preloadedItems }));
            return;
        }

        // Değilse on-demand sunucudan getir (gereksiz sorgu yapmamak için)
        setLoadingOrderId(orderId);
        try {
            const items = await getPurchaseOrderItemsAction(orderId);
            setOrderItemsCache(prev => ({ ...prev, [orderId]: items || [] }));
        } catch (error) {
            console.error("Sipariş ürünleri alınamadı:", error);
        } finally {
            setLoadingOrderId(null);
        }
    };

    const getPaymentMethodBadge = (method?: string) => {
        switch (method) {
            case "BANK":
            case "TRANSFER":
                return (
                    <Badge variant="outline" className="text-[10px] gap-1 font-bold text-blue-400 border-blue-500/30 bg-blue-500/10">
                        <Landmark className="w-3 h-3" />
                        <span>Havale / EFT</span>
                    </Badge>
                );
            case "CREDIT_CARD":
            case "POS":
                return (
                    <Badge variant="outline" className="text-[10px] gap-1 font-bold text-purple-400 border-purple-500/30 bg-purple-500/10">
                        <CreditCard className="w-3 h-3" />
                        <span>Kredi Kartı</span>
                    </Badge>
                );
            case "CASH":
            default:
                return (
                    <Badge variant="outline" className="text-[10px] gap-1 font-bold text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                        <Wallet className="w-3 h-3" />
                        <span>Nakit (Kasa)</span>
                    </Badge>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-w-full w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border/60 shadow-2xl rounded-2xl">
                {/* Header */}
                <DialogHeader className="p-5 border-b border-border/50 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-lg font-black tracking-tight text-foreground uppercase">
                                    Ödeme & Parça Geçmişi
                                </DialogTitle>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase text-primary border-primary/30">
                                    {supplier.name}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                Tedarikçiye yapılan tüm ödemeler, ödeme yöntemleri ve satın alınan ürün dökümü
                            </p>
                        </div>
                    </div>

                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[11px] font-black px-3 py-1 font-mono">
                        TOPLAM ÖDENEN: ₺{Math.round(Number(supplier.totalShopping || 0) - Number(supplier.balance || 0)).toLocaleString("tr-TR")}
                    </Badge>
                </DialogHeader>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto max-h-[60vh] p-4 sm:p-5 space-y-3.5 custom-scrollbar">
                    {sortedRecords.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-semibold text-foreground">Henüz bir ödeme kaydı bulunmuyor</p>
                            <p className="text-xs text-muted-foreground mt-1">Bu tedarikçiye yapılan ödemeler burada listelenir.</p>
                        </div>
                    ) : (
                        paginatedRecords.map((record) => {
                            const isOrder = record.type === "ORDER";
                            const isExpanded = !!expandedOrders[record.id];
                            const isLoading = loadingOrderId === record.id;
                            const items = orderItemsCache[record.id] || record.items || [];
                            const itemCount = record.itemCount || items.length;

                            return (
                                <div
                                    key={record.id}
                                    className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-border transition-all shadow-xs"
                                >
                                    {/* Record Card Header */}
                                    <div className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 bg-white/[0.01]">
                                        {/* Left: Info & Method */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                                    isOrder ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                                                )}
                                            >
                                                {isOrder ? <Package className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-foreground uppercase tracking-wide">
                                                        {isOrder ? `#${record.orderNo}` : "Cari Borç Ödemesi"}
                                                    </span>
                                                    {getPaymentMethodBadge(record.paymentMethod)}
                                                    {isOrder && (
                                                        <Badge
                                                            className={cn(
                                                                "text-[9px] font-black uppercase px-2 py-0 border-none",
                                                                record.paymentStatus === "PAID"
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : "bg-amber-500/10 text-amber-400"
                                                            )}
                                                        >
                                                            {record.paymentStatus === "PAID" ? "Tamamı Ödendi" : "Kısmi Ödeme"}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium mt-0.5 tabular-nums">
                                                    {format(new Date(record.date), "dd MMMM yyyy HH:mm", { locale: tr })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: Amounts */}
                                        <div className="flex items-center sm:justify-end gap-3 text-right">
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-1.5 sm:justify-end">
                                                    <span className="text-xs text-muted-foreground font-semibold">Ödenen:</span>
                                                    <span className="text-sm font-black text-emerald-400 font-mono tabular-nums">
                                                        ₺{Math.round(record.paidAmount).toLocaleString("tr-TR")}
                                                    </span>
                                                </div>
                                                {isOrder && record.remainingAmount > 0 && (
                                                    <span className="text-[10px] text-rose-400 font-bold font-mono tabular-nums">
                                                        Kalan Borç: ₺{Math.round(record.remainingAmount).toLocaleString("tr-TR")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Record Card Body: Description & Carousel Toggle */}
                                    <div className="p-3 px-4 flex flex-col gap-2.5">
                                        {/* Açıklama / Not Varsa Göster */}
                                        {record.description && (
                                            <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/30 text-xs">
                                                <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                                        Ödeme Açıklaması / Not
                                                    </span>
                                                    <p className="text-xs text-foreground/90 font-medium">
                                                        {record.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Eğer siparişse, ürünleri Carousel ile inceleme butonu */}
                                        {isOrder && (
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleOrderItems(record.id, record.items)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                                    >
                                                        <Package className="w-3.5 h-3.5" />
                                                        <span>
                                                            {isExpanded
                                                                ? "Ürün Listesini Kapat"
                                                                : `${itemCount > 0 ? `${itemCount} Kalem` : ""} Ödenen Ürünleri İncele (Carousel)`}
                                                        </span>
                                                        {isLoading ? (
                                                            <Loader2 className="w-3 h-3 animate-spin ml-1" />
                                                        ) : isExpanded ? (
                                                            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                                                        ) : (
                                                            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                                                        )}
                                                    </button>

                                                    {isExpanded && (
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {items.length} ürün
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Expanded Carousel View */}
                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t border-border/30 animate-in fade-in duration-200">
                                                        {isLoading ? (
                                                            <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                                <span>Ürünler yükleniyor...</span>
                                                            </div>
                                                        ) : (
                                                            <OrderItemsCarousel items={items} usdRate={usdRate} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Pagination */}
                {totalPages > 1 && (
                    <div className="p-3 px-5 border-t border-border/40 bg-white/[0.01] flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Toplam <strong className="text-foreground">{sortedRecords.length}</strong> işlem • Sayfa{" "}
                            <strong className="text-foreground">{currentPage}</strong> / {totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-7 w-7 p-0 rounded-lg"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-7 w-7 p-0 rounded-lg"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Bottom Close Bar */}
                <div className="p-3 px-5 border-t border-border/40 bg-card flex justify-end">
                    <Button
                        onClick={onClose}
                        variant="default"
                        size="sm"
                        className="h-8.5 rounded-xl text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
