"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Search,
    ChevronLeft,
    ChevronRight,
    User,
    Package,
    Banknote,
    CreditCard,
    Landmark,
    Filter,
    History,
    Calendar,
    ArrowRight,
    Printer,
    Loader2,
    MessageCircle,
    ArrowLeftRight,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    UnifiedOperation,
    OperationType
} from "@/lib/actions/activity-actions";
import { getSaleById } from "@/lib/actions/sale-actions";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { toast } from "sonner";

interface SalesHistoryClientProps {
    initialData: {
        items: UnifiedOperation[];
        total: number;
        totalPages: number;
        currentPage: number;
    };
    currentPage: number;
    searchTerm: string;
    typeFilter: string;
}

export function SalesHistoryClient({
    initialData,
    currentPage,
    searchTerm: propSearch,
    typeFilter: propType
}: SalesHistoryClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(propSearch);
    const [typeFilter, setTypeFilter] = useState(propType);
    const [isPending, setIsPending] = useState(false);
    const [expandedOpId, setExpandedOpId] = useState<string | null>(null);

    // Receipt modal state
    const [receiptSale, setReceiptSale] = useState<any>(null);
    const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

    const updateParams = (newParams: Record<string, string | number>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === "ALL" || value === "" || value === undefined) params.delete(key);
            else params.set(key, String(value));
        });

        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = () => {
        updateParams({ search: searchTerm, page: 1 });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= initialData.totalPages) {
            updateParams({ page: newPage });
        }
    };

    const handlePrintReceipt = async (op: UnifiedOperation) => {
        if (op.type !== 'SALE') return;
        setReceiptLoading(op.id);
        try {
            const sale = await getSaleById(op.id);
            if (sale) setReceiptSale(sale);
        } catch (e) {
            console.error("Failed to load sale for receipt", e);
        } finally {
            setReceiptLoading(null);
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case "CASH": return <Banknote className="h-3.5 w-3.5" />;
            case "CARD": return <CreditCard className="h-3.5 w-3.5" />;
            case "TRANSFER": return <Landmark className="h-3.5 w-3.5" />;
            case "DEBT": return <History className="h-3.5 w-3.5 text-orange-500" />;
            default: return <Package className="h-4 w-4" />;
        }
    };

    const getPaymentLabel = (method: string) => {
        const m = (method || "").toUpperCase();
        switch (m) {
            case "CASH": return "Nakit";
            case "CARD": return "Kart";
            case "TRANSFER": return "Havale";
            case "DEBT": return "Veresiye";
            default: return method;
        }
    };

    const translateLabel = (text: string | null | undefined) => {
        if (!text) return "";
        const lower = text.toLowerCase().trim();
        if (lower === 'cash') return 'Nakit';
        if (lower === 'bank') return 'Banka';
        if (lower === 'card') return 'Kart';
        if (lower === 'credit card') return 'Kredi Kartı';
        if (lower === 'pos') return 'POS Hesabı';
        if (lower === 'main cash') return 'Ana Kasa';
        if (lower === 'transfer') return 'Havale';
        return text;
    };

    const getTypeLabel = (type: OperationType) => {
        switch (type) {
            case 'SALE': return "Peşin Satış";
            case 'DEBT_DIRECT': return "Veresiye";
            case 'PAYMENT': return "Tahsilat";
            default: return "İŞLEM";
        }
    };

    const getTypeColor = (type: OperationType) => {
        switch (type) {
            case 'SALE': return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
            case 'DEBT_DIRECT': return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
            case 'PAYMENT': return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
            default: return "bg-slate-500/10 text-slate-600";
        }
    };

    const handleSendWhatsApp = (op: UnifiedOperation, item?: any) => {
        if (!op.customerPhone) {
            toast.error("Müşterinin telefon numarası sistemde kayıtlı değil.");
            return;
        }

        let cleanPhone = op.customerPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1);
        if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) cleanPhone = '90' + cleanPhone;

        let message = `Merhaba ${op.customerName},\n\n`;
        if (item) {
            message += `*${item.name}* (${item.quantity} adet) işleminiz hakkında bilgilendirme.\n`;
        } else {
            message += `*#${op.number}* numaralı işleminiz hakkında bilgilendirme.\n`;
        }
        message += `Tutar: ${op.currency === 'USD' ? '$' : '₺'}${op.amount.toLocaleString('tr-TR')}\n`;
        message += `Tarih: ${format(new Date(op.date), "dd MMMM yyyy HH:mm", { locale: tr })}\n\nİyi günler dileriz.`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

    const handleReturn = (op: UnifiedOperation, item: any) => {
        const params = new URLSearchParams({
            customerId: op.customerId || "",
            customerName: op.customerName,
            productId: item.productId || "",
            productName: item.name,
            quantity: String(item.quantity),
            refundAmount: String((item.price || 0) * item.quantity),
            refundCurrency: op.currency,
            unitPrice: String(item.price || 0),
            saleNumber: op.number,
            soldAt: op.date.toString(),
            saleId: op.saleId || "",
            debtId: op.debtId || "",
        });
        router.push(`/stok/iade?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden bg-card/50 backdrop-blur-xl">
                <CardHeader className="p-8 border-b border-border/40 bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-semibold tracking-tight">İşlem Arşivi</h2>
                            <p className="text-xs text-muted-foreground">Tüm satış, veresiye ve ödeme hareketlerini buradan takip edebilirsiniz.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Her türlü işlemde ara..."
                                    className="pl-12 h-12 rounded-2xl bg-background border-border/40 text-[11px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={searchParams.get("dateRange") === "TODAY" ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "h-10 rounded-xl px-4 text-[10px] tracking-widest uppercase transition-all",
                                        searchParams.get("dateRange") === "TODAY" ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" : "border-border/40"
                                    )}
                                    onClick={() => {
                                        updateParams({ dateRange: searchParams.get("dateRange") === "TODAY" ? "ALL" : "TODAY", page: 1 });
                                    }}
                                >
                                    <Calendar className="mr-2 h-3.5 w-3.5" />
                                    BUGÜN
                                </Button>
                                <div className="w-[1px] h-8 bg-border/40 mx-1 self-center" />
                                {(["ALL", "SALE", "DEBT", "PAYMENT"] as const).map((type) => (
                                    <Button
                                        key={type}
                                        variant={(typeFilter === type || (type === "ALL" && !typeFilter)) ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "h-10 rounded-xl px-4 text-[10px] tracking-widest uppercase transition-all",
                                            (typeFilter === type || (type === "ALL" && !typeFilter)) ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" : "border-border/40"
                                        )}
                                        onClick={() => {
                                            setTypeFilter(type);
                                            updateParams({ type, page: 1 });
                                        }}
                                    >
                                        {type === "ALL" ? "HEPSİ" : type === "SALE" ? "SATIŞLAR" : type === "DEBT" ? "VERESİYELER" : "TAHSİLATLAR"}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/5">
                                    <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">Tür</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tarih</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Müşteri</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Açıklama / Ürünler</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tutar</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-28">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {initialData.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 rounded-full bg-muted/20">
                                                    <Search className="h-8 w-8 text-muted-foreground/40" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">Aradığınız kriterlere uygun işlem bulunamadı.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    initialData.items.map((op) => (
                                        <>
                                            <tr
                                                key={op.id}
                                                className="group hover:bg-muted/5 transition-colors duration-200 cursor-pointer"
                                                onClick={() => setExpandedOpId(expandedOpId === op.id ? null : op.id)}
                                            >
                                                <td className="px-8 py-6">
                                                    <Badge variant="outline" className={cn("text-[8px] font-bold px-2 py-0.5 rounded-md border", getTypeColor(op.type))}>
                                                        {getTypeLabel(op.type)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[11px] font-medium leading-none">{format(new Date(op.date), "dd MMMM yyyy", { locale: tr })}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(op.date), "HH:mm")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-orange-600" />
                                                        </div>
                                                        <span className="text-[11px] font-semibold">{op.customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col gap-1.5 max-w-md">
                                                        {op.items.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {op.items.slice(0, 2).map((item, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-muted-foreground border-none">
                                                                        {item.quantity}x {item.name}
                                                                    </Badge>
                                                                ))}
                                                                {op.items.length > 2 && (
                                                                    <span className="text-[9px] text-muted-foreground ml-1">+{op.items.length - 2} ürün</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground line-clamp-1">{op.description}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-sm font-bold tracking-tight">
                                                            {op.currency === 'USD' ? '$' : '₺'}{op.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-50">
                                                            {getPaymentIcon(op.paymentMethod)}
                                                            <span className="text-[9px] uppercase tracking-wider font-bold">
                                                                {op.accountName
                                                                    ? `${translateLabel(op.accountName)} (${getPaymentLabel(op.paymentMethod)})`
                                                                    : getPaymentLabel(op.paymentMethod)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {op.type === 'SALE' && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                title="Fiş Yazdır"
                                                                disabled={receiptLoading === op.id}
                                                                className="h-10 w-10 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all"
                                                                onClick={(e) => { e.stopPropagation(); handlePrintReceipt(op); }}
                                                            >
                                                                {receiptLoading === op.id
                                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                    : <Printer className="h-4 w-4" />
                                                                }
                                                            </Button>
                                                        )}
                                                        {(op.type === 'SALE' || op.type === 'DEBT_DIRECT') && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                title="İade İşlemi"
                                                                className="h-10 w-10 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-none"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (op.items.length === 1) {
                                                                        handleReturn(op, op.items[0]);
                                                                    } else {
                                                                        setExpandedOpId(expandedOpId === op.id ? null : op.id);
                                                                        toast.info("Lütfen iade etmek istediğiniz ürünü seçin.");
                                                                    }
                                                                }}
                                                            >
                                                                <ArrowLeftRight className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            title="Detaylar"
                                                            className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-none"
                                                            onClick={(e) => { e.stopPropagation(); setExpandedOpId(expandedOpId === op.id ? null : op.id); }}
                                                        >
                                                            {expandedOpId === op.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedOpId === op.id && (
                                                <tr className="bg-muted/10">
                                                    <td colSpan={6} className="px-8 py-4 border-b border-border/20">
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
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                {initialData.totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                            TOPLAM {initialData.total} İŞLEM // SAYFA {initialData.currentPage}/{initialData.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-border/40"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1 px-2">
                                {[...Array(Math.min(5, initialData.totalPages))].map((_, i) => {
                                    let pageNum = i + 1;
                                    if (initialData.totalPages > 5) {
                                        if (currentPage > 3) pageNum = currentPage - 2 + i;
                                        if (pageNum > initialData.totalPages) pageNum = initialData.totalPages - (4 - i);
                                    }
                                    if (pageNum <= 0) return null;

                                    return (
                                        <Button
                                            key={i}
                                            variant={currentPage === pageNum ? "default" : "ghost"}
                                            className={cn(
                                                "h-10 w-10 rounded-xl text-[11px] font-bold transition-all",
                                                currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30" : ""
                                            )}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-border/40"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= initialData.totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={!!receiptSale}
                onClose={() => setReceiptSale(null)}
                sale={receiptSale}
            />
        </div>
    );
}
