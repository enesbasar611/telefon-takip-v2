"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
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
    Download,
    Printer
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    staffList: any[];
}

const typeFilters = [
    { key: "ALL", label: "Hepsi" },
    { key: "SALE", label: "Satışlar" },
    { key: "EXPENSE", label: "Giderler" },
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
    staffList = [],
}: SalesHistoryClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>("charts");
    const [comparisonMode, setComparisonMode] = useState<"TTD" | "ROLLING_SPAN">("TTD");
    const [page, setPage] = useState(currentPage || 1);
    const [searchTerm, setSearchTerm] = useState(propSearch);
    const [appliedSearch, setAppliedSearch] = useState(propSearch);
    const [typeFilter, setTypeFilter] = useState(propType || "ALL");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
    const [staffFilter, setStaffFilter] = useState("ALL");
    const [activeQuickFilter, setActiveQuickFilter] = useState<string>("today");
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
    const [calendarOpen, setCalendarOpen] = useState(false);

    const { rates, defaultCurrency } = useDashboardData();
    const rangeStart = appliedRange?.from?.toISOString();
    const rangeEnd = (appliedRange?.to || appliedRange?.from)?.toISOString();

    const { data: historyData = initialData, isFetching: historyFetching } = useQuery({
        queryKey: ["sales-history", page, appliedSearch, typeFilter, rangeStart, rangeEnd, paymentMethodFilter, staffFilter],
        queryFn: () => getUnifiedHistory({
            page,
            pageSize: 30,
            searchTerm: appliedSearch,
            typeFilter,
            startDate: rangeStart,
            endDate: rangeEnd,
            paymentMethod: paymentMethodFilter,
            staffId: staffFilter,
        }),
        placeholderData: keepPreviousData,
    });

    const { data: activeReport = reportData, isFetching: reportFetching } = useQuery({
        queryKey: ["sales-history-report", rangeStart, rangeEnd, comparisonMode],
        queryFn: () => getSalesHistoryReport({ startDate: rangeStart, endDate: rangeEnd, comparisonMode }),
        placeholderData: keepPreviousData,
    });

    const applySearch = () => {
        setPage(1);
        setAppliedSearch(searchTerm.trim());
        if (dateRange?.from) {
            setAppliedRange({ from: dateRange.from, to: dateRange.to || dateRange.from });
        }
    };

    const applyDateRange = () => {
        if (!dateRange?.from) {
            toast.error("Başlangıç tarihi seçin.");
            return;
        }
        setPage(1);
        setActiveQuickFilter("custom");
        setAppliedRange({ from: dateRange.from, to: dateRange.to || dateRange.from });
        setCalendarOpen(false);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setAppliedSearch("");
        setTypeFilter("ALL");
        setPaymentMethodFilter("ALL");
        setStaffFilter("ALL");
        setPage(1);
        setQuickRange("today");
    };

    const setQuickRange = (type: "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisMonthTTD" | "lastMonthTTD" | "lastMonth") => {
        setActiveQuickFilter(type);
        const now = new Date();
        let range = { from: now, to: now };
        switch (type) {
            case "today":
                range = { from: startOfDay(now), to: endOfDay(now) };
                break;
            case "yesterday":
                const yesterday = subDays(now, 1);
                range = { from: startOfDay(yesterday), to: endOfDay(yesterday) };
                break;
            case "thisWeek":
                const weekStart = startOfWeek(now, { weekStartsOn: 1 });
                range = { from: weekStart, to: endOfDay(now) };
                break;
            case "thisMonth":
            case "thisMonthTTD":
                // 1st of month to today (true MTD)
                range = { from: startOfMonth(now), to: endOfDay(now) };
                break;
            case "lastMonthTTD": {
                // Equivalent calendar days in previous month (e.g. 1-15 Sep)
                const prevM = subMonths(now, 1);
                const prevStart = startOfMonth(prevM);
                const prevDay = Math.min(now.getDate(), endOfMonth(prevM).getDate());
                const prevEnd = new Date(prevM.getFullYear(), prevM.getMonth(), prevDay);
                range = { from: startOfDay(prevStart), to: endOfDay(prevEnd) };
                break;
            }
            case "lastMonth": {
                const prevMonth = subMonths(now, 1);
                range = { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
                break;
            }
        }
        setDateRange(range);
        setAppliedRange(range);
        setPage(1);
        setCalendarOpen(false);
    };

    const handleDrilldownNavigation = (params: { searchTerm?: string; startDate?: string; endDate?: string; paymentMethod?: string }) => {
        if (params.searchTerm) {
            setSearchTerm(params.searchTerm);
            setAppliedSearch(params.searchTerm);
        }
        if (params.paymentMethod) {
            setPaymentMethodFilter(params.paymentMethod);
        }
        if (params.startDate) {
            const from = new Date(params.startDate);
            const to = params.endDate ? new Date(params.endDate) : from;
            setDateRange({ from, to });
            setAppliedRange({ from, to });
        }
        setPage(1);
        setActiveTab("list");
        toast.info("İşlem listesi filtrelendi.");
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
            case "SALE": return "Satış";
            case "EXPENSE": return "Gider";
            case "DEBT_DIRECT": return "Veresiye";
            case "PAYMENT": return "Tahsilat";
            default: return "İşlem";
        }
    };

    const getTypeColor = (type: OperationType) => {
        switch (type) {
            case "SALE": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
            case "EXPENSE": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
            case "DEBT_DIRECT": return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
            case "PAYMENT": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
            default: return "bg-slate-500/10 text-slate-600 border-slate-500/30";
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

    const exportToExcel = async () => {
        try {
            toast.info("Excel dosyası hazırlanıyor...");
            const data = await getUnifiedHistory({
                page: 1,
                pageSize: 10000,
                searchTerm: appliedSearch,
                typeFilter,
                startDate: rangeStart,
                endDate: rangeEnd,
                paymentMethod: paymentMethodFilter,
                staffId: staffFilter,
            });
            
            if (!data.items || data.items.length === 0) {
                toast.warning("Dışa aktarılacak veri bulunamadı.");
                return;
            }

            const exportData = data.items.map((op: any) => ({
                "İşlem No": op.number || (op.id ? op.id.substring(0, 8) : ""),
                "Tarih": format(new Date(op.date), "dd.MM.yyyy HH:mm"),
                "İşlem Tipi": getTypeLabel(op.type as any),
                "Müşteri": op.customerName || "-",
                "Kategori/Ürün": op.title || op.type,
                "Ödeme Yöntemi": getPaymentLabel(op.paymentMethod || ""),
                "Personel": op.staffName || "-",
                "Tutar": op.amount,
                "Para Birimi": op.currency || "TRY"
            }));

            const XLSX = await import("xlsx");
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Satis_Gecmisi");
            XLSX.writeFile(workbook, `Satis_Gecmisi_${format(new Date(), "dd_MM_yyyy_HHmm")}.xlsx`);
            toast.success("Excel dosyası başarıyla indirildi.");
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error("Dışa aktarma başarısız oldu.");
        }
    };

    const handlePrintEndOfDay = () => {
        // Open print view in new window with current dates
        const qs = new URLSearchParams();
        if (rangeStart) qs.set("startDate", rangeStart);
        if (rangeEnd) qs.set("endDate", rangeEnd);
        window.open(`/satis/gun-sonu?${qs.toString()}`, "_blank");
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
            {/* Page Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <span>Finansal Kokpit & Satış Arşivi</span>
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-bold">
                            Executive
                        </Badge>
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Canlı ciro akışı, Time-to-Date eşdeğer gün analizleri ve işlem arşivi.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 rounded-xl border-border/60 bg-background/60 shadow-sm font-semibold gap-2 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30" 
                        onClick={exportToExcel}
                    >
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>Excel'e Aktar</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 rounded-xl border-border/60 bg-background/60 shadow-sm font-semibold gap-2 text-xs hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30" 
                        onClick={handlePrintEndOfDay}
                    >
                        <Printer className="h-4 w-4 text-blue-600" />
                        <span>Gün Sonu PDF</span>
                    </Button>
                </div>
            </div>

            {/* Top Shared Filter Bar: Quick Range Pills + Date Picker + Time-to-Date Toggle */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Quick Range Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                        {[
                            { key: "today", label: "Bugün" },
                            { key: "yesterday", label: "Dün" },
                            { key: "thisWeek", label: "Bu Hafta" },
                            { key: "thisMonthTTD", label: "🎯 Ay Başından Bugüne (MTD)" },
                            { key: "lastMonthTTD", label: "🔄 Geçen Ay Eşdeğer Gün" },
                            { key: "lastMonth", label: "Geçen Ay (Tam)" },
                        ].map((item) => {
                            const isActive = activeQuickFilter === item.key;
                            return (
                                <Button 
                                    key={item.key}
                                    variant={isActive ? "default" : "outline"} 
                                    size="sm" 
                                    className={cn(
                                        "h-8 rounded-lg px-3 text-xs transition-all shrink-0 border",
                                        isActive
                                            ? "bg-primary text-primary-foreground font-extrabold shadow-sm ring-2 ring-primary/40 border-primary" 
                                            : "border-border/60 text-muted-foreground font-semibold hover:bg-muted hover:text-foreground"
                                    )} 
                                    onClick={() => setQuickRange(item.key as any)}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Date Picker Popover + Comparison Mode Button */}
                    <div className="flex items-center gap-2">
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("h-9 rounded-xl border-border/60 justify-start gap-2 text-xs flex-1 sm:flex-none sm:min-w-[230px]", activeQuickFilter === "custom" && "ring-2 ring-primary/40 border-primary font-bold")}>
                                    <CalendarIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{formattedRange}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl flex flex-col md:flex-row" align="end">
                                <div className="flex flex-row md:flex-col p-2 gap-1 border-b md:border-b-0 md:border-r border-border bg-muted/20 overflow-x-auto md:w-36 justify-start items-stretch">
                                    {[
                                        { key: "today", label: "Bugün" },
                                        { key: "yesterday", label: "Dün" },
                                        { key: "thisWeek", label: "Bu Hafta" },
                                        { key: "thisMonthTTD", label: "Ay Başından Bugüne" },
                                        { key: "lastMonthTTD", label: "Geçen Ay Eşdeğer" },
                                        { key: "lastMonth", label: "Geçen Ay (Tam)" },
                                    ].map((item) => (
                                        <Button 
                                            key={item.key} 
                                            variant={activeQuickFilter === item.key ? "default" : "ghost"} 
                                            size="sm" 
                                            className={cn("justify-start rounded-lg text-xs", activeQuickFilter === item.key ? "font-bold bg-primary text-primary-foreground" : "font-medium")} 
                                            onClick={() => setQuickRange(item.key as any)}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={(range) => {
                                            setDateRange(range);
                                            if (range?.from && range?.to) {
                                                setAppliedRange(range);
                                                setPage(1);
                                            }
                                        }}
                                        numberOfMonths={2}
                                        defaultMonth={dateRange?.from}
                                        locale={tr}
                                        weekStartsOn={1}
                                    />
                                    <div className="flex items-center justify-end gap-2 border-t border-border p-3">
                                        <Button variant="cancel" size="sm" className="rounded-xl" onClick={() => { setDateRange(appliedRange); setCalendarOpen(false); }}>
                                            Vazgeç
                                        </Button>
                                        <Button size="sm" className="rounded-xl" onClick={applyDateRange}>
                                            Uygula
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setComparisonMode(prev => prev === "TTD" ? "ROLLING_SPAN" : "TTD")}
                            className={cn(
                                "h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all shrink-0",
                                comparisonMode === "TTD" 
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" 
                                    : "bg-muted/30 text-muted-foreground border-border/60"
                            )}
                            title="Önceki ayın aynı takvim günleri ile kıyaslar"
                        >
                            <span>⏱️ TTD: {comparisonMode === "TTD" ? "Eşdeğer Gün" : "Sürekli Aralık"}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs for Charts vs Detailed Operation Archive */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 rounded-xl p-1 h-12 border border-border/40 shadow-sm w-full sm:w-auto grid grid-cols-2 mb-4">
                    <TabsTrigger value="charts" className="rounded-lg px-4 sm:px-8 text-xs sm:text-sm font-bold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Grafikler ve Raporlar
                    </TabsTrigger>
                    <TabsTrigger value="list" className="rounded-lg px-4 sm:px-8 text-xs sm:text-sm font-bold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        İşlem Arşivi ({historyData.total})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="mt-0 outline-none">
                    <SalesHistoryReportPanel 
                        report={activeReport} 
                        isLoading={reportFetching} 
                        onNavigateToListWithFilter={handleDrilldownNavigation}
                    />
                </TabsContent>

                <TabsContent value="list" className="mt-0 outline-none space-y-6">
                    <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card/70 backdrop-blur-xl">
                        <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/5">
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_auto] gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Müşteri, fiş, ürün veya telefon ara..."
                                            className="pl-12 h-11 rounded-xl bg-background border-border/60 text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && applySearch()}
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Select value={paymentMethodFilter} onValueChange={(val) => { setPage(1); setPaymentMethodFilter(val); }}>
                                            <SelectTrigger className="w-[150px] h-11 rounded-xl border-border/60 text-xs">
                                                <SelectValue placeholder="Ödeme Tipi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Tüm Ödemeler</SelectItem>
                                                <SelectItem value="CASH">Nakit</SelectItem>
                                                <SelectItem value="CARD">Kredi Kartı</SelectItem>
                                                <SelectItem value="TRANSFER">Havale/EFT</SelectItem>
                                                <SelectItem value="DEBT">Veresiye</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={staffFilter} onValueChange={(val) => { setPage(1); setStaffFilter(val); }}>
                                            <SelectTrigger className="w-[150px] h-11 rounded-xl border-border/60 text-xs">
                                                <SelectValue placeholder="Personel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Tüm Personeller</SelectItem>
                                                {staffList.map((staff) => (
                                                    <SelectItem key={staff.id} value={staff.id}>{staff.name} {staff.surname || ""}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button type="button" className="h-11 rounded-xl px-5 text-xs font-semibold" onClick={applySearch}>
                                            Ara
                                        </Button>
                                        <Button type="button" variant="ghost" className="h-11 rounded-xl px-3 text-xs font-semibold" onClick={clearFilters}>
                                            Temizle
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/30">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {typeFilters.map((filter) => {
                                            const isSelected = typeFilter === filter.key || (filter.key === "ALL" && !typeFilter);
                                            let btnClasses = "";

                                            if (filter.key === "ALL") {
                                                btnClasses = isSelected
                                                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md ring-2 ring-slate-400/30 font-bold"
                                                    : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground font-medium";
                                            } else if (filter.key === "SALE") {
                                                btnClasses = isSelected
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/40 font-bold"
                                                    : "border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-semibold";
                                            } else if (filter.key === "EXPENSE") {
                                                btnClasses = isSelected
                                                    ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/40 font-bold"
                                                    : "border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold";
                                            } else if (filter.key === "DEBT") {
                                                btnClasses = isSelected
                                                    ? "bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-500/40 font-bold"
                                                    : "border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 font-semibold";
                                            } else if (filter.key === "PAYMENT") {
                                                btnClasses = isSelected
                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40 font-bold"
                                                    : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold";
                                            }

                                            return (
                                                <Button
                                                    key={filter.key}
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 rounded-xl px-3.5 text-xs transition-all",
                                                        btnClasses
                                                    )}
                                                    onClick={() => {
                                                        setPage(1);
                                                        setTypeFilter(filter.key);
                                                    }}
                                                >
                                                    {filter.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    {historyFetching && (
                                        <span className="text-xs text-muted-foreground animate-pulse">Liste güncelleniyor...</span>
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
            </TabsContent>
            </Tabs>

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
