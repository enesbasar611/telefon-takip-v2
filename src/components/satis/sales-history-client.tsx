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
    Loader2
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

    const getTypeLabel = (type: OperationType) => {
        switch (type) {
            case 'SALE': return "SATIŞ";
            case 'DEBT_DIRECT': return "VERESİYE";
            case 'PAYMENT': return "TAHSİLAT";
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
                                {(["ALL", "SALE", "DEBT", "PAYMENT"] as const).map((type) => (
                                    <Button
                                        key={type}
                                        variant={typeFilter === type ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "h-10 rounded-xl px-4 text-[10px] tracking-widest uppercase transition-all",
                                            typeFilter === type ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" : "border-border/40"
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
                                        <tr
                                            key={op.id}
                                            className="group hover:bg-muted/5 transition-colors duration-200"
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
                                                        <span className="text-[9px] uppercase tracking-wider font-bold">{op.paymentMethod}</span>
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
                                                            onClick={() => handlePrintReceipt(op)}
                                                        >
                                                            {receiptLoading === op.id
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <Printer className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
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
