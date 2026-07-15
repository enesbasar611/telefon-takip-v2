"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
    ArrowLeftRight,
    Banknote,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    History,
    Landmark,
    Package,
    Search,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SalesHistoryRow } from "./parts/sales-history-row";
import { OperationDetails } from "./parts/operation-details";
import { SalesHistoryReportPanel } from "./sales-history-report-panel";
import {
    getSalesHistoryReport,
    getUnifiedHistory,
    type OperationType,
    type SalesHistoryReport,
    type UnifiedOperation,
} from "@/lib/actions/activity-actions";
import { getSaleById } from "@/lib/actions/sale-actions";
import { UnifiedSaleModal } from "@/components/pos/unified-sale-modal";
import { AddReturnModal } from "@/components/stock/add-return-modal";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { toast } from "sonner";

interface SalesHistoryClientProps {
    initialData: {
        items: UnifiedOperation[];
        total: number;
        totalPages: number;
        currentPage: number;
    };
    reportData: SalesHistoryReport;
    currentPage: number;
    searchTerm: string;
    typeFilter: string;
    startDate: string;
    endDate: string;
}

const typeFilters = [
    { key: "ALL", label: "Hepsi" },
    { key: "SALE", label: "Satışlar" },
    { key: "DEBT", label: "Veresiyeler" },
    { key: "PAYMENT", label: "Tahsilatlar" },
] as const;

export function SalesHistoryClient({
    initialData,
    reportData,
    currentPage,
    searchTerm: propSearch,
    typeFilter: propType,
    startDate,
    endDate,
}: SalesHistoryClientProps) {
    const router = useRouter();
    const [page, setPage] = useState(currentPage || 1);
    const [searchTerm, setSearchTerm] = useState(propSearch);
    const [appliedSearch, setAppliedSearch] = useState(propSearch);
    const [typeFilter, setTypeFilter] = useState(propType || "ALL");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(startDate),
        to: new Date(endDate),
    });
    const [appliedRange, setAppliedRange] = useState<DateRange | undefined>({
        from: new Date(startDate),
        to: new Date(endDate),
    });
    const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
    const [receiptSale, setReceiptSale] = useState<any>(null);
    const [receiptLoading, setReceiptLoading] = useState<string | null>(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnInitialData, setReturnInitialData] = useState<any>(null);

    const { rates, defaultCurrency } = useDashboardData();
    const rangeStart = appliedRange?.from?.toISOString();
    const rangeEnd = (appliedRange?.to || appliedRange?.from)?.toISOString();

    const { data: historyData = initialData, isFetching: historyFetching } = useQuery({
        queryKey: ["sales-history", page, appliedSearch, typeFilter, rangeStart, rangeEnd],
        queryFn: () => getUnifiedHistory({
            page,
            pageSize: 30,
            searchTerm: appliedSearch,
            typeFilter,
            startDate: rangeStart,
            endDate: rangeEnd,
        }),
        initialData,
        placeholderData: keepPreviousData,
    });

    const { data: activeReport = reportData, isFetching: reportFetching } = useQuery({
        queryKey: ["sales-history-report", rangeStart, rangeEnd],
        queryFn: () => getSalesHistoryReport({ startDate: rangeStart, endDate: rangeEnd }),
        initialData: reportData,
        placeholderData: keepPreviousData,
    });

    const applySearch = () => {
        setPage(1);
        setAppliedSearch(searchTerm.trim());
    };

    const applyDateRange = () => {
        if (!dateRange?.from) {
            toast.error("Başlangıç tarihi seçin.");
            return;
        }
        setPage(1);
        setAppliedRange({ from: dateRange.from, to: dateRange.to || dateRange.from });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setAppliedSearch("");
        setTypeFilter("ALL");
        setPage(1);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const resetRange = { from: monthStart, to: now };
        setDateRange(resetRange);
        setAppliedRange(resetRange);
    };

    const handlePrintReceipt = async (op: UnifiedOperation) => {
        if (op.type !== "SALE" && !op.saleId) return;
        setReceiptLoading(op.id);
        try {
            const targetId = op.saleId || op.id;
            const sale = await getSaleById(targetId);
            if (sale) setReceiptSale(sale);
            else toast.error("Satış bulunamadı.");
        } catch (error) {
            console.error("Failed to load sale for receipt", error);
            toast.error("Hata: Fiş yüklenemedi.");
        } finally {
            setReceiptLoading(null);
        }
    };

    const getPaymentIcon = (method: string) => {
        switch ((method || "").toUpperCase()) {
            case "CASH": return <Banknote className="h-3.5 w-3.5" />;
            case "CARD": return <CreditCard className="h-3.5 w-3.5" />;
            case "TRANSFER": return <Landmark className="h-3.5 w-3.5" />;
            case "DEBT": return <History className="h-3.5 w-3.5 text-orange-500" />;
            default: return <Package className="h-4 w-4" />;
        }
    };

    const getPaymentLabel = (method: string) => {
        switch ((method || "").toUpperCase()) {
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
        if (lower === "cash") return "Nakit";
        if (lower === "bank") return "Banka";
        if (lower === "card") return "Kart";
        if (lower === "credit card") return "Kredi Kartı";
        if (lower === "pos") return "POS Hesabı";
        if (lower === "main cash") return "Ana Kasa";
        if (lower === "transfer") return "Havale";
        return text;
    };

    const getTypeLabel = (type: OperationType) => {
        switch (type) {
            case "SALE": return "Peşin Satış";
            case "DEBT_DIRECT": return "Veresiye";
            case "PAYMENT": return "Tahsilat";
            default: return "İşlem";
        }
    };

    const getTypeColor = (type: OperationType) => {
        switch (type) {
            case "SALE": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
            case "DEBT_DIRECT": return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
            case "PAYMENT": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
            default: return "bg-slate-500/10 text-slate-600";
        }
    };

    const handleSendWhatsApp = (op: UnifiedOperation, item?: any) => {
        if (!op.customerPhone) {
            toast.error("Müşterinin telefon numarası sistemde kayıtlı değil.");
            return;
        }

        let cleanPhone = op.customerPhone.replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) cleanPhone = `90${cleanPhone.substring(1)}`;
        if (!cleanPhone.startsWith("90") && cleanPhone.length === 10) cleanPhone = `90${cleanPhone}`;

        let message = `Merhaba ${op.customerName},\n\n`;
        message += item
            ? `*${item.name}* (${item.quantity} adet) işleminiz hakkında bilgilendirme.\n`
            : `*#${op.number}* numaralı işleminiz hakkında bilgilendirme.\n`;
        message += `Tutar: ${op.currency === "USD" ? "$" : "₺"}${op.amount.toLocaleString("tr-TR")}\n`;
        message += `Tarih: ${format(new Date(op.date), "dd MMMM yyyy HH:mm", { locale: tr })}\n\nİyi günler dileriz.`;

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const handleReturn = (op: UnifiedOperation, item?: any) => {
        setReturnInitialData({
            sourceType: "CUSTOMER",
            sourceId: op.customerId === "GUEST" ? "" : op.customerId,
            sourceName: op.customerName === "HIZLI SATIŞ" ? "PERAKENDE (HIZLI)" : op.customerName,
            items: item ? [{
                productId: item.productId,
                name: item.name,
                quantity: item.quantity || 1,
                refundAmount: (item.price || 0) * (item.quantity || 1),
                refundCurrency: op.currency || "TRY",
                unitPrice: item.price || 0,
                saleNumber: op.number,
                soldAt: op.date,
                saleId: op.saleId,
                debtId: op.debtId,
            }] : op.items.map((saleItem) => ({
                productId: saleItem.productId,
                name: saleItem.name,
                quantity: saleItem.quantity || 1,
                refundAmount: (saleItem.price || 0) * (saleItem.quantity || 1),
                refundCurrency: op.currency || "TRY",
                unitPrice: saleItem.price || 0,
                saleNumber: op.number,
                soldAt: op.date,
                saleId: op.saleId,
                debtId: op.debtId,
            })),
        });
        setIsReturnModalOpen(true);
    };

    const formattedRange = appliedRange?.from
        ? appliedRange.to
            ? `${format(appliedRange.from, "d MMM yyyy", { locale: tr })} - ${format(appliedRange.to, "d MMM yyyy", { locale: tr })}`
            : format(appliedRange.from, "d MMM yyyy", { locale: tr })
        : "Tarih seçin";

    return (
        <div className="space-y-6">
            <SalesHistoryReportPanel report={activeReport} isLoading={reportFetching} />

            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card/70 backdrop-blur-xl">
                <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/5">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">İşlem Arşivi</h2>
                                <p className="text-sm text-muted-foreground">Satış, veresiye ve tahsilat hareketlerini seçtiğiniz tarih aralığında inceleyin.</p>
                            </div>
                            <div className="text-xs text-muted-foreground rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                                Aktif aralık: <span className="font-semibold text-foreground">{formattedRange}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_auto] gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Müşteri, fiş, ürün veya telefon ara..."
                                    className="pl-12 h-12 rounded-xl bg-background border-border/60 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applySearch()}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-12 rounded-xl border-border/60 justify-start gap-2 min-w-[240px]">
                                            <CalendarIcon className="h-4 w-4 text-emerald-600" />
                                            {dateRange?.from
                                                ? dateRange.to
                                                    ? `${format(dateRange.from, "d MMM yyyy", { locale: tr })} - ${format(dateRange.to, "d MMM yyyy", { locale: tr })}`
                                                    : format(dateRange.from, "d MMM yyyy", { locale: tr })
                                                : "Tarih aralığı seç"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl" align="end">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                            defaultMonth={dateRange?.from}
                                            locale={tr}
                                            weekStartsOn={1}
                                        />
                                        <div className="flex items-center justify-end gap-2 border-t border-border p-3">
                                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setDateRange(appliedRange)}>
                                                Vazgeç
                                            </Button>
                                            <Button size="sm" className="rounded-xl" onClick={applyDateRange}>
                                                Uygula
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button type="button" className="h-12 rounded-xl px-5 text-sm font-semibold" onClick={applySearch}>
                                    Ara
                                </Button>
                                <Button type="button" variant="ghost" className="h-12 rounded-xl px-4 text-sm font-semibold" onClick={clearFilters}>
                                    Temizle
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {typeFilters.map((filter) => (
                                <Button
                                    key={filter.key}
                                    variant={(typeFilter === filter.key || (filter.key === "ALL" && !typeFilter)) ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "h-10 rounded-xl px-4 text-xs font-semibold",
                                        (typeFilter === filter.key || (filter.key === "ALL" && !typeFilter)) ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" : "border-border/60"
                                    )}
                                    onClick={() => {
                                        setPage(1);
                                        setTypeFilter(filter.key);
                                    }}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                            {historyFetching && (
                                <span className="text-xs text-muted-foreground ml-1">Liste güncelleniyor...</span>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/5">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16">Tür</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tarih</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Müşteri</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Açıklama / Ürünler</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tutar</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {historyData.items.length === 0 ? (
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
                                    historyData.items.map((op: UnifiedOperation) => (
                                        <Fragment key={op.id}>
                                            <SalesHistoryRow
                                                op={op}
                                                isExpanded={expandedOpId === op.id}
                                                onToggleExpand={() => setExpandedOpId(expandedOpId === op.id ? null : op.id)}
                                                getTypeLabel={getTypeLabel}
                                                getTypeColor={getTypeColor}
                                                getPaymentIcon={getPaymentIcon}
                                                getPaymentLabel={getPaymentLabel}
                                                translateLabel={translateLabel}
                                                handlePrintReceipt={handlePrintReceipt}
                                                handleReturn={(selectedOp, item) => {
                                                    if (selectedOp.items.length > 1 && expandedOpId !== selectedOp.id) {
                                                        setExpandedOpId(selectedOp.id);
                                                        toast.info("Lütfen iade etmek istediğiniz ürünü seçin.");
                                                    } else {
                                                        handleReturn(selectedOp, item);
                                                    }
                                                }}
                                                receiptLoading={receiptLoading}
                                                rates={rates}
                                                defaultCurrency={defaultCurrency}
                                            />
                                            {expandedOpId === op.id && (
                                                <tr className="bg-muted/10">
                                                    <td colSpan={6} className="px-8 py-4 border-b border-border/20">
                                                        <OperationDetails
                                                            op={op}
                                                            getTypeColor={getTypeColor}
                                                            getTypeLabel={getTypeLabel}
                                                            getPaymentLabel={getPaymentLabel}
                                                            translateLabel={translateLabel}
                                                            handleReturn={handleReturn}
                                                            handleSendWhatsApp={handleSendWhatsApp}
                                                            handlePrintReceipt={handlePrintReceipt}
                                                            rates={rates}
                                                            defaultCurrency={defaultCurrency}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                {historyData.totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-border/40 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground font-medium">
                            Toplam {historyData.total} işlem, sayfa {historyData.currentPage}/{historyData.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-border/40"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1 px-2">
                                {[...Array(Math.min(5, historyData.totalPages))].map((_, i) => {
                                    let pageNum = i + 1;
                                    if (historyData.totalPages > 5) {
                                        if (page > 3) pageNum = page - 2 + i;
                                        if (pageNum > historyData.totalPages) pageNum = historyData.totalPages - (4 - i);
                                    }
                                    if (pageNum <= 0) return null;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "default" : "ghost"}
                                            className={cn(
                                                "h-10 w-10 rounded-xl text-xs font-bold transition-all",
                                                page === pageNum ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30" : ""
                                            )}
                                            onClick={() => setPage(pageNum)}
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
                                onClick={() => setPage((prev) => Math.min(historyData.totalPages, prev + 1))}
                                disabled={page >= historyData.totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <UnifiedSaleModal
                isOpen={!!receiptSale}
                onClose={() => setReceiptSale(null)}
                sale={receiptSale}
                rates={rates as any}
            />

            <AddReturnModal
                open={isReturnModalOpen}
                onOpenChange={setIsReturnModalOpen}
                initialData={returnInitialData}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}
