"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    CreditCard,
    Wallet,
    AlertCircle,
    History,
    CalendarClock,
    TrendingDown,
    CheckCircle2,
    Users,
    Phone,
    MessageCircle,
    MoreVertical,
    Search,
    Download,
    SlidersHorizontal,
    ArrowUpRight,
    Loader2,
    RefreshCcw,
    TrendingUp,
    Star,
    Calendar,
    User,
    ChevronDown,
    FileText,
    Receipt,
    LayoutGrid,
    List,
    PlusCircle,
    Pencil,
    Trash2,
    DollarSign,
    RotateCcw,
    Printer,
    ArrowLeftRight,
    Eye
} from "lucide-react";

import { VeresiyeToolbar } from './veresiye/veresiye-toolbar';
import { VeresiyePaymentSummaryModal, type PaymentSummary } from './veresiye/veresiye-payment-summary-modal';
import { VeresiyePaymentModal } from './veresiye/veresiye-payment-modal';
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LayoutCustomizer } from "@/components/common/layout-customizer";
import {
    getDebts,
    getThisMonthCollected,
    getTodayCollected,
    getCustomerStatement,
    getDebtStatsDetails,
    collectGlobalCustomerPayment,
    startTrackingDebt,
    deleteCustomerPayment,
    updateCustomerPayment,
    updateDebt
} from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { getCustomerById } from "@/lib/actions/customer-actions";
import { VeresiyeStats } from "./veresiye/veresiye-stats";
import { VeresiyeAnalysisSide } from "./veresiye/veresiye-analysis-side";
import { VeresiyeCustomerCard } from "./veresiye/veresiye-customer-card";
import { VeresiyeEmptyState } from "./veresiye/veresiye-empty-state";
import { useQueryClient } from "@tanstack/react-query";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Combined imports above
import { cn, formatCurrency } from "@/lib/utils";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { AddDebtModal } from "./add-debt-modal";
import { AddReturnModal } from "@/components/stock/add-return-modal";
import { DebtReceiptModal } from "./debt-receipt-modal";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type Debt = {
    id: string;
    amount: number;
    remainingAmount: number;
    dueDate?: string | null;
    isPaid: boolean;
    notes?: string | null;
    isTracking?: boolean;
    currency?: string;
    createdAt: string;
    customer: { id: string; name: string; phone?: string; photo?: string };
};

interface VeresiyeClientProps {
    debts?: any[];
    thisMonthCollected?: number;
    accounts?: any[];
    rates?: {
        usd: number;
        eur: number;
        ga: number;
        lastUpdate: Date;
    };
    settings?: any[];
    shop?: any;
    shopId?: string | null;
    receiptSettings?: any;
}

const normalizeSearchText = (value: string) =>
    value
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i");

const safeExportDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd.MM.yyyy", { locale: tr });
};

const safeSheetName = (name: string, index: number) => {
    const cleanName = (name || `Musteri ${index + 1}`)
        .replace(/[\\/?*[\]:]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 28);
    return `${index + 1}-${cleanName || "Musteri"}`.slice(0, 31);
};

const csvCell = (value: any) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
};

const debtExportTitle = (debt: any) =>
    debt?.sale?.items?.length
        ? debt.sale.items
            .map((item: any) => `${item?.product?.name || item?.productName || "Ürün"} x${item?.quantity || 1}`)
            .join(", ")
        :
        debt?.product?.name ||
        debt?.productName ||
        debt?.itemName ||
        debt?.description ||
        debt?.notes ||
        "Veresiye kaydı";

const paymentExportTitle = (payment: any) =>
    payment?.description ||
    payment?.notes ||
    payment?.account?.name ||
    "Tahsilat";

const getSafeDebtRemaining = (debt: any) => {
    const amount = Number(debt?.amount);
    const remaining = Number(debt?.remainingAmount);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (!Number.isFinite(remaining)) return 0;
    return Math.min(Math.max(remaining, 0), amount);
};

export function VeresiyeClient({
    debts: propsDebts,
    thisMonthCollected: propsThisMonthCollected,
    accounts: propsAccounts,
    rates: propsRates,
    settings: propsSettings,
    shop: propsShop,
    shopId,
    receiptSettings
}: VeresiyeClientProps) {
    // Data Fetching
    const { data: debtsData, isLoading: debtsLoading } = useQuery({
        queryKey: ["debts", shopId],
        queryFn: () => getDebts()
    });

    const { data: accountsData, isLoading: accountsLoading } = useQuery({
        queryKey: ["accounts", shopId],
        queryFn: () => getAccounts()
    });

    const { data: ratesData, isLoading: ratesLoading } = useQuery({
        queryKey: ["rates", shopId],
        queryFn: () => getExchangeRates(shopId || null)
    });

    const { data: collectedData, isLoading: collectedLoading } = useQuery({
        queryKey: ["thisMonthCollected", shopId],
        queryFn: () => getThisMonthCollected()
    });

    const { data: todayCollectedData } = useQuery({
        queryKey: ["todayCollected", shopId],
        queryFn: () => getTodayCollected()
    });

    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ["settings", shopId],
        queryFn: () => getSettings()
    });

    const { data: shopData, isLoading: shopLoading } = useQuery({
        queryKey: ["shop", shopId],
        queryFn: () => getShop()
    });

    const debts = debtsData || propsDebts || [];
    const accounts = accountsData || propsAccounts || [];
    const rates = ratesData || propsRates;
    const thisMonthCollected = collectedData || propsThisMonthCollected || 0;
    const settings = settingsData || propsSettings || [];
    const shop = shopData || propsShop;

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'tracking'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [debtFilter, setDebtFilter] = useState<'all' | 'hasDebt' | 'noDebt'>('all');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const defaultCurrency = settings?.find((s: any) => s.key === "defaultCurrency")?.value || "TRY";
    const usdRate = rates?.usd || 32.5;

    // Payment States
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [paymentCurrency, setPaymentCurrency] = useState<"TRY" | "USD">("TRY");
    const [ignoreBalance, setIgnoreBalance] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [paymentCustomer, setPaymentCustomer] = useState<any>(null);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappCustomer, setWhatsappCustomer] = useState<any>(null);
    const [whatsappMessageContent, setWhatsappMessageContent] = useState<string>("");


    // Bulk WhatsApp States
    const [bulkWhatsAppModalOpen, setBulkWhatsAppModalOpen] = useState(false);
    const [bulkCustomersToSend, setBulkCustomersToSend] = useState<any[]>([]);

    const filteredAccountsCount = (type: string) => accounts.filter((acc: any) => acc.type === type).length;

    // New History & Portfolio Modals
    const [historyCustomer, setHistoryCustomer] = useState<any>(null);
    const [historySearchTerm, setHistorySearchTerm] = useState("");
    const [historyPage, setHistoryPage] = useState(1);
    const historyItemsPerPage = 5;

    // Debt Edit State
    const [editingDebt, setEditingDebt] = useState<any>(null);
    const [editAmount, setEditAmount] = useState<string>("");

    const [receiptCustomer, setReceiptCustomer] = useState<any>(null);
    const [receiptDebts, setReceiptDebts] = useState<any[]>([]);
    const [receiptShowPaid, setReceiptShowPaid] = useState(false);

    // Stats Detail Modal State
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [statsModalType, setStatsModalType] = useState<'RECEIVABLE_TRY' | 'RECEIVABLE_USD' | 'OVERDUE' | 'COLLECTED' | null>(null);
    const [statsDates, setStatsDates] = useState<{ start?: string; end?: string }>({});
    const [editNotes, setEditNotes] = useState<string>("");
    const [editCurrency, setEditCurrency] = useState<string>("TRY");
    const [statsSearchQuery, setStatsSearchQuery] = useState("");
    const [statsViewMode, setStatsViewMode] = useState<'list' | 'grid'>('list');

    const [portfolioCustomer, setPortfolioCustomer] = useState<any>(null);

    const [bulkReturnModalOpen, setBulkReturnModalOpen] = useState(false);
    const [bulkReturnInitialData, setBulkReturnInitialData] = useState<any>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const queryClient = useQueryClient();

    const invalidateReceivables = () => {
        queryClient.invalidateQueries({ queryKey: ["debts"] });
        queryClient.invalidateQueries({ queryKey: ["customer-statement"] });
        queryClient.invalidateQueries({ queryKey: ["customer-portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["debt-stats"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["thisMonthCollected"] });
        queryClient.invalidateQueries({ queryKey: ["todayCollected"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-init"] });
    };

    const handleBulkReturn = () => {
        if (selectedDebtIds.length === 0) return;

        const debtsToProcess = (statementData?.debts || []).filter((d: any) => selectedDebtIds.includes(d.id));
        const returnItems: any[] = [];

        debtsToProcess.forEach((debt: any) => {
            const debtCurrency = debt.currency || "TRY";
            if (debt.sale?.items && debt.sale.items.length > 0) {
                debt.sale.items.forEach((si: any) => {
                    returnItems.push({
                        productId: si.productId,
                        name: si.product?.name || si.productName || "Ürün",
                        quantity: si.quantity,
                        refundAmount: Number(si.unitPrice) * si.quantity,
                        refundCurrency: debtCurrency,
                        unitPrice: Number(si.unitPrice),
                        saleNumber: debt.sale?.saleNumber,
                        soldAt: debt.sale?.createdAt,
                        debtId: debt.id,
                        saleId: debt.saleId,
                    });
                });
            } else {
                // Manuel borç ise (direkt borç satırı)
                returnItems.push({
                    productId: debt.productId || "",
                    name: debt.notes || "Ürün İadesi",
                    quantity: 1,
                    refundAmount: getSafeDebtRemaining(debt),
                    refundCurrency: debtCurrency,
                    debtId: debt.id,
                });
            }
        });

        if (returnItems.length === 0) {
            toast.error("İade edilecek ürün bulunamadı.");
            return;
        }

        setBulkReturnInitialData({
            sourceType: "CUSTOMER",
            sourceId: historyCustomer?.customerId || historyCustomer?.id,
            sourceName: historyCustomer?.name,
            items: returnItems
        });
        setBulkReturnModalOpen(true);
    };

    // Queries
    const { data: statementData } = useQuery({
        queryKey: ["customer-statement", historyCustomer?.id || historyCustomer?.customerId],
        queryFn: () => getCustomerStatement(historyCustomer?.id || historyCustomer?.customerId),
        enabled: !!(historyCustomer?.id || historyCustomer?.customerId),
    });

    const { data: statsModalResults, isLoading: statsIsLoading } = useQuery({
        queryKey: ["debt-stats", statsModalType, statsDates],
        queryFn: () => getDebtStatsDetails({
            type: statsModalType!,
            startDate: statsDates.start ? new Date(statsDates.start) : undefined,
            endDate: statsDates.end ? new Date(statsDates.end) : undefined
        }),
        enabled: !!statsModalType && statsModalOpen,
    });

    const statsModalData = useMemo(() => {
        const rawData = statsModalResults?.success ? statsModalResults.data : [];
        if (!statsSearchQuery) return rawData;

        const lowQuery = normalizeSearchText(statsSearchQuery);
        return rawData.filter((item: any) =>
            normalizeSearchText(item.customer?.name || "").includes(lowQuery) ||
            normalizeSearchText(item.description || item.notes || "").includes(lowQuery)
        );
    }, [statsModalResults, statsSearchQuery]);

    const { data: portfolioData } = useQuery({
        queryKey: ["customer-portfolio", portfolioCustomer?.id || portfolioCustomer?.customerId],
        queryFn: () => getCustomerById(portfolioCustomer?.id || portfolioCustomer?.customerId),
        enabled: !!(portfolioCustomer?.id || portfolioCustomer?.customerId),
    });

    // Tracking Modal State
    const [trackingDebt, setTrackingDebt] = useState<Debt | null>(null);
    const [trackingDate, setTrackingDate] = useState("");

    // Multi-select State for History
    const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);

    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    React.useEffect(() => {
        const savedViewMode = localStorage.getItem('veresiye_viewMode');
        if (savedViewMode === 'grid' || savedViewMode === 'list') {
            setViewMode(savedViewMode as 'list' | 'grid');
        }
        // Restore last-used currency preference
        const savedCurrency = localStorage.getItem('preferred_currency');
        if (savedCurrency === 'USD' || savedCurrency === 'TRY') {
            setPaymentCurrency(savedCurrency);
        }
    }, []);

    const handleViewModeChange = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        localStorage.setItem('veresiye_viewMode', mode);
    };

    // Transaction Edit State
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [editTxAmount, setEditTxAmount] = useState<string>("");
    const [editTxNotes, setEditTxNotes] = useState<string>("");

    const handleDeleteTransaction = async (txId: string) => {
        if (!confirm("Tahsilatı geri almak istiyor musunuz? Bu işlem kasanızdan tutarı düşecek ve borcu geri yükleyecektir.")) return;

        startTransition(async () => {
            const res = await deleteCustomerPayment(txId);
            if (res.success && res.before && res.after) {
                const diffTRY = res.after.totalRemainingTRY - res.before.totalRemainingTRY;
                const diffUSD = res.after.totalRemainingUSD - res.before.totalRemainingUSD;

                let impactMsg = "Tahsilat geri alındı.";
                if (diffTRY > 0) impactMsg += ` Borç: +₺${diffTRY.toLocaleString('tr-TR')}`;
                if (diffUSD > 0) impactMsg += ` Borç: +$${diffUSD.toLocaleString('tr-TR')}`;

                toast.success(impactMsg);
                invalidateReceivables();
                router.refresh();
            } else {
                toast.error(res.error || "İşlem geri alınamadı.");
            }
        });
    };

    const handleUpdateTransaction = async () => {
        if (!editingTransaction || !editTxAmount) return;

        startTransition(async () => {
            const res = await updateCustomerPayment(
                editingTransaction.id,
                Number(editTxAmount),
                editTxNotes,
                rates?.usd || 32.5
            );
            if (res.success && res.after) {
                toast.success(`Tahsilat güncellendi. Yeni Borç: ₺${res.after.totalRemainingTRY.toLocaleString('tr-TR')}${res.after.totalRemainingUSD > 0 ? ` + $${res.after.totalRemainingUSD.toLocaleString('tr-TR')}` : ""}`);
                setEditingTransaction(null);
                invalidateReceivables();
                router.refresh();
            } else {
                toast.error(res.error || "Güncelleme yapılamadı.");
            }
        });
    };

    const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);

    const [statementModalOpen, setStatementModalOpen] = useState(false);

    const hasActiveReturn = (debtId?: string, saleId?: string, productId?: string) => {
        const activeReturns = statementData?.activeReturns || [];
        return activeReturns.some((returnTicket: any) =>
            ["PENDING", "APPROVED", "SENT_TO_SUPPLIER"].includes(returnTicket.returnStatus) &&
            (!debtId || returnTicket.debtId === debtId) &&
            (!saleId || returnTicket.saleId === saleId) &&
            (!productId || returnTicket.productId === productId)
        );
    };

    const [needsRefresh, setNeedsRefresh] = useState(false);

    useEffect(() => {
        if (needsRefresh && !paymentSummary && !whatsappModalOpen && !receiptCustomer && !paymentCustomer) {
            router.refresh();
            setNeedsRefresh(false);
        }
    }, [needsRefresh, paymentSummary, whatsappModalOpen, receiptCustomer, paymentCustomer, router]);

    // Layout visibility checks
    const isAnalysisHidden = settings?.find((s: any) => s.key === "layout_hidden_veresiye_analysis")?.value === "true";

    // --- Data Aggregation & Calculations ---

    // --- Data Aggregation & Calculations ---
    const now = useMemo(() => new Date(), []);

    const handleFilterChange = (status: 'all' | 'pending' | 'overdue' | 'tracking') => {
        startTransition(() => {
            setFilterStatus(status);
        });
    };

    // 1. Group by Customer and Calculate Totals
    const aggregatedData = useMemo(() => {
        const groups: Record<string, {
            customerId: string;
            name: string;
            phone?: string | null;
            balance: number;
            balanceUsd: number;
            lastActivity: Date;
            totalRemainingTRY: number;
            totalRemainingUSD: number;
            debtCount: number;
            debtItems: any[];
        }> = {};

        debts.forEach((debt: any) => {
            const customerId = debt.customer.id;
            if (!groups[customerId]) {
                groups[customerId] = {
                    customerId,
                    name: debt.customer.name,
                    phone: debt.customer.phone,
                    balance: Number(debt.customer.balance || 0),
                    balanceUsd: Number(debt.customer.balanceUsd || 0),
                    lastActivity: new Date(debt.createdAt),
                    totalRemainingTRY: 0,
                    totalRemainingUSD: 0,
                    debtCount: 0,
                    debtItems: []
                };
            }

            const remainingAmount = getSafeDebtRemaining(debt);
            if (!debt.isPaid && remainingAmount > 0) {
                const amount = remainingAmount;
                if (debt.currency === 'USD') groups[customerId].totalRemainingUSD += amount;
                else groups[customerId].totalRemainingTRY += amount;
            }

            groups[customerId].debtCount++;
            groups[customerId].debtItems.push(debt);
            if (new Date(debt.createdAt) > groups[customerId].lastActivity) {
                groups[customerId].lastActivity = new Date(debt.createdAt);
            }
        });

        let filtered = Object.values(groups);

        // Arama Filtresi
        if (searchTerm) {
            const lowSearch = normalizeSearchText(searchTerm);
            filtered = filtered.filter(item =>
                normalizeSearchText(item.name).includes(lowSearch) ||
                (item.phone && normalizeSearchText(item.phone).includes(lowSearch))
            );
        }

        // Durum Filtresi (Borç Durumu)
        if (debtFilter === 'hasDebt') {
            filtered = filtered.filter(item => item.totalRemainingTRY > 0 || item.totalRemainingUSD > 0);
        } else if (debtFilter === 'noDebt') {
            filtered = filtered.filter(item => item.totalRemainingTRY <= 0 && item.totalRemainingUSD <= 0);
        }

        // Kategori Filtresi
        if (filterStatus === 'overdue') {
            filtered = filtered.filter(item =>
                item.debtItems.some((d: any) => d.dueDate && new Date(d.dueDate) < now)
            );
        } else if (filterStatus === 'tracking') {
            filtered = filtered.filter(item =>
                item.debtItems.some((d: any) => d.isTracking)
            );
        }

        // Sıralama
        return filtered.sort((a, b) => {
            if (sortOrder === 'newest') return b.lastActivity.getTime() - a.lastActivity.getTime();
            return a.lastActivity.getTime() - b.lastActivity.getTime();
        });
    }, [debts, searchTerm, filterStatus, debtFilter, sortOrder, now]);

    const totalReceivableTRY = useMemo(() =>
        debts.filter((d: any) => !d.isPaid && (!d.currency || d.currency === 'TRY')).reduce((sum: number, d: any) => sum + getSafeDebtRemaining(d), 0),
        [debts]);

    const totalReceivableUSD = useMemo(() =>
        debts.filter((d: any) => !d.isPaid && d.currency === 'USD').reduce((sum: number, d: any) => sum + getSafeDebtRemaining(d), 0),
        [debts]);

    const totalOverdue = useMemo(() =>
        debts.filter((d: any) => !d.isPaid && d.dueDate && new Date(d.dueDate) < now)
            .reduce((sum: number, d: any) => sum + getSafeDebtRemaining(d), 0),
        [debts, now]);

    const activeDebtorCount = new Set(debts.filter((d: any) => !d.isPaid && getSafeDebtRemaining(d) > 0).map((d: any) => d.customer.id)).size;

    const statsData = [
        {
            type: 'RECEIVABLE_TRY' as const,
            title: defaultCurrency === 'USD' ? "Toplam Alacak (USD)" : "Toplam Alacak (TL)",
            value: !mounted ? "--" : (defaultCurrency === 'USD'
                ? `$${totalReceivableUSD.toLocaleString('tr-TR')}`
                : `₺${totalReceivableTRY.toLocaleString('tr-TR')}`),
            subValue: !mounted ? "--" : (defaultCurrency === 'USD'
                ? `~₺${Math.round(totalReceivableUSD * usdRate).toLocaleString('tr-TR')}`
                : `${activeDebtorCount} Aktif Müşteri`),
            icon: CreditCard,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            type: 'RECEIVABLE_USD' as const,
            title: defaultCurrency === 'USD' ? "Toplam Alacak (TL)" : "Toplam Alacak (USD)",
            value: !mounted ? "--" : (defaultCurrency === 'USD'
                ? `₺${totalReceivableTRY.toLocaleString('tr-TR')}`
                : `$${totalReceivableUSD.toLocaleString('tr-TR')}`),
            subValue: !mounted ? "--" : (defaultCurrency === 'USD'
                ? `${activeDebtorCount} Aktif Müşteri`
                : `~₺${Math.round(totalReceivableUSD * usdRate).toLocaleString('tr-TR')}`),
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            type: 'GENERAL_TOTAL' as const,
            title: defaultCurrency === 'USD' ? "Genel Portfolio (USD)" : "Genel Portfolio (TL)",
            value: !mounted ? "--" : (defaultCurrency === 'USD'
                ? `$${Math.round(totalReceivableUSD + (totalReceivableTRY / usdRate)).toLocaleString('tr-TR')}`
                : `₺${Math.round(totalReceivableTRY + (totalReceivableUSD * usdRate)).toLocaleString('tr-TR')}`),
            subValue: "TL + USD Birleşik",
            icon: TrendingUp,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            type: 'COLLECTED' as const,
            title: "Tahsilat Performansı",
            value: !mounted ? "--" : `₺${thisMonthCollected.toLocaleString('tr-TR')}`,
            subValue: !mounted ? "--" : (
                <div className="flex items-center gap-2">
                    <span className="opacity-60 text-[9px]">BU AY</span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-emerald-500 font-black">BUGÜN: ₺{(todayCollectedData || 0).toLocaleString('tr-TR')}</span>
                </div>
            ),
            icon: CheckCircle2,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        }
    ];

    // 3. Aging Analysis (0-30, 31-60, 60+ Days)

    // 3. Aging Analysis (0-30, 31-60, 60+ Days)
    const aging = useMemo(() => {
        let g1 = 0, g2 = 0, g3 = 0;
        debts.filter((d: any) => !d.isPaid).forEach((d: any) => {
            const days = (now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            let amt = getSafeDebtRemaining(d);

            // Normalize to default currency for calculations
            if (defaultCurrency === 'TRY' && d.currency === 'USD') {
                amt = amt * usdRate;
            } else if (defaultCurrency === 'USD' && (!d.currency || d.currency === 'TRY')) {
                amt = amt / usdRate;
            }

            if (days <= 30) g1 += amt;
            else if (days <= 60) g2 += amt;
            else g3 += amt;
        });
        const total = g1 + g2 + g3 || 1;
        return {
            '0-30': { amount: g1, percentage: (g1 / total) * 100 },
            '31-60': { amount: g2, percentage: (g2 / total) * 100 },
            '60+': { amount: g3, percentage: (g3 / total) * 100 },
        };
    }, [debts, now, defaultCurrency, usdRate]);

    const historyTotals = useMemo(() => {
        if (!historyCustomer) return { try: 0, usd: 0 };
        const custId = historyCustomer.customerId || historyCustomer.id;
        const customerDebts = debts.filter((d: any) => d.customer.id === custId && !d.isPaid);

        let tryDebt = 0;
        let usdDebt = 0;
        customerDebts.forEach((d: any) => {
            const remaining = getSafeDebtRemaining(d);
            if (d.currency === 'USD') usdDebt += remaining;
            else tryDebt += remaining;
        });
        return { try: tryDebt, usd: usdDebt };
    }, [debts, historyCustomer]);

    // --- Actions ---
    const handleCurrencySwitch = (newCurrency: "TRY" | "USD") => {
        if (paymentCurrency === newCurrency) return;
        setIgnoreBalance(false);

        const usdRate = rates?.usd || 32.5;
        const currentAmount = Number(paymentAmount) || 0;

        let converted = 0;
        if (newCurrency === "USD" && paymentCurrency === "TRY") {
            converted = currentAmount / usdRate;
        } else if (newCurrency === "TRY" && paymentCurrency === "USD") {
            converted = currentAmount * usdRate;
        }

        setPaymentCurrency(newCurrency);
        localStorage.setItem('preferred_currency', newCurrency);
        if (converted > 0) {
            setPaymentAmount(String(parseFloat(converted.toFixed(2))));
        } else {
            setPaymentAmount("");
        }
    };

    const openCustomerStatement = async (item: any) => {
        setHistoryCustomer(item);
        setHistoryPage(1);
        setHistorySearchTerm("");
        setSelectedDebtIds([]);
    };

    const handleCollectPayment = async () => {
        if (!paymentCustomer || !paymentAmount) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Lütfen geçerli bir tutar giriniz.");
            return;
        }

        startTransition(async () => {
            // Use our new global action
            const { collectGlobalCustomerPayment } = await import("@/lib/actions/debt-actions");
            const res = await collectGlobalCustomerPayment({
                customerId: paymentCustomer.customerId || paymentCustomer.id,
                paymentAmount: amount,
                paymentCurrency,
                paymentMethod,
                accountId: selectedAccountId || undefined,
                usdRate: rates?.usd || 32.5,
                notes: paymentNotes,
                debtIds: selectedDebtIds,
                ignoreExcess: ignoreBalance
            });

            if (res.success && res.before && res.after) {
                toast.success("Ödeme başarıyla tahsil edildi.");
                invalidateReceivables();
                setNeedsRefresh(true);

                // Trigger whatsapp receipt if customer has phone
                if (paymentCustomer.phone) {
                    const { before, after, paidAmount, currency } = res;
                    const isUSD = currency === "USD";
                    const symbol = isUSD ? "$" : "₺";

                    let msg = `*${paymentCustomer.name} - Tahsilat Makbuzu*\n\n`;
                    msg += `✅ *Ödeme Alındı:* ${symbol}${paidAmount.toLocaleString('tr-TR')}\n`;
                    msg += `📅 *Tarih:* ${format(new Date(), "dd.MM.yyyy HH:mm")}\n\n`;

                    msg += `*📊 Borç Durum Özeti:*\n`;
                    msg += `--------------------\n`;

                    const beforeTotal = before.totalRemainingTRY + (before.totalRemainingUSD * (rates?.usd || 32.5));
                    const afterTotal = after.totalRemainingTRY + (after.totalRemainingUSD * (rates?.usd || 32.5));

                    if (before.totalRemainingTRY > 0 || after.totalRemainingTRY > 0) {
                        msg += `*Türk Lirası (₺):*\n`;
                        msg += `• Önceki Bakiye: ₺${before.totalRemainingTRY.toLocaleString('tr-TR')}\n`;
                        msg += `• Ödenen Tutarı: ${!isUSD ? '₺' + paidAmount.toLocaleString('tr-TR') : '-'}\n`;
                        msg += `• Kalan Bakiye: ₺${after.totalRemainingTRY.toLocaleString('tr-TR')}\n\n`;
                    }

                    if (before.totalRemainingUSD > 0 || after.totalRemainingUSD > 0) {
                        msg += `*Amerikan Doları ($):*\n`;
                        msg += `• Önceki Bakiye: $${before.totalRemainingUSD.toLocaleString('tr-TR')}\n`;
                        msg += `• Ödenen Tutarı: ${isUSD ? '$' + paidAmount.toLocaleString('tr-TR') : '-'}\n`;
                        msg += `• Kalan Bakiye: $${after.totalRemainingUSD.toLocaleString('tr-TR')}\n\n`;
                    }

                    if (after.balance > 0 || after.balanceUsd > 0) {
                        msg += `*🎁 Emanet Bakiye:*\n`;
                        if (after.balance > 0) msg += `• TL Emanet: ₺${after.balance.toLocaleString('tr-TR')}\n`;
                        if (after.balanceUsd > 0) msg += `• USD Emanet: $${after.balanceUsd.toLocaleString('tr-TR')}\n`;
                        msg += `\n`;
                    }

                    msg += `--------------------\n`;
                    if (after.totalRemainingTRY <= 0 && after.totalRemainingUSD <= 0) {
                        msg += `✅ *Borcunuz tamamen kapanmıştır.* Teşekkür ederiz.\n`;
                    } else {
                        msg += `*GÜNCEL TOPLAM:* ₺${Math.round(afterTotal).toLocaleString('tr-TR')}\n`;
                    }

                    msg += `\n_Hayırlı işler dileriz._`;

                    setWhatsappMessageContent(msg);
                    setWhatsappModalOpen(true);
                }

                // Prepare and show summary modal
                const itemsNames = selectedDebtIds.length > 0
                    ? paymentCustomer?.debtItems.filter((d: any) => selectedDebtIds.includes(d.id)).map((d: any) => d.notes || "İsimsiz Borç")
                    : ["Genel Tahsilat"];

                setPaymentSummary({
                    customerId: paymentCustomer.customerId || paymentCustomer.id,
                    customerName: paymentCustomer.name,
                    items: itemsNames,
                    paidAmount: amount,
                    currency: paymentCurrency,
                    previousTRY: res.before.totalRemainingTRY,
                    previousUSD: res.before.totalRemainingUSD,
                    remainingTRY: res.after.totalRemainingTRY,
                    remainingUSD: res.after.totalRemainingUSD
                });

                setPaymentCustomer(null);
                setPaymentAmount("");
                setPaymentNotes("");
                setPaymentMethod("CASH");
                setSelectedAccountId("");
                setSelectedDebtIds([]); // Reset selection after payment
            } else {
                toast.error(res.error || "Tahsilat sırasında bir hata oluştu.");
            }
        });
    };

    const handleDeleteDebt = async (debtId: string) => {
        if (!confirm("Bu borç kaydını kalıcı olarak silmek istediğinize emin misiniz?")) return;

        startTransition(async () => {
            const { deleteDebt } = await import("@/lib/actions/debt-actions");
            const res = await deleteDebt(debtId);
            if (res.success && res.before && res.after) {
                const diffTRY = res.before.totalRemainingTRY - res.after.totalRemainingTRY;
                const diffUSD = res.before.totalRemainingUSD - res.after.totalRemainingUSD;

                let impactMsg = "Borç silindi.";
                if (diffTRY > 0) impactMsg += ` ₺${diffTRY.toLocaleString('tr-TR')} düşüldü.`;
                if (diffUSD > 0) impactMsg += ` $${diffUSD.toLocaleString('tr-TR')} düşüldü.`;

                toast.success(impactMsg);
                invalidateReceivables();
                if (historyCustomer) {
                    setHistoryCustomer({
                        ...historyCustomer,
                        debtItems: historyCustomer.debtItems.filter((d: any) => d.id !== debtId),
                        debtCount: historyCustomer.debtCount - 1
                    });
                }
                router.refresh();
            } else {
                toast.error(res.error || "Borç silinirken bir hata oluştu.");
            }
        });
    };

    const submitDebtUpdate = async () => {
        if (!editingDebt || !editAmount) return;
        startTransition(async () => {
            const { updateDebt } = await import("@/lib/actions/debt-actions");
            const res = await updateDebt({
                id: editingDebt.id,
                amount: parseFloat(editAmount),
                currency: editCurrency,
                notes: editNotes
            });
            if (res.success) {
                toast.success("Borç kaydı güncellendi.");
                invalidateReceivables();
                setEditingDebt(null);
                router.refresh();
            } else {
                toast.error(res.error || "Borç güncellenemedi.");
            }
        });
    };

    const handleFetchPortfolio = async (customerId: string) => {
        // Query automaticly fetches when portfolioCustomer is set
    };

    const handleStartTracking = async () => {
        if (!trackingDebt || !trackingDate) return;

        startTransition(async () => {
            const res = await startTrackingDebt(trackingDebt.id, new Date(trackingDate));
            if (res.success) {
                toast.success("Takip başarıyla başlatıldı.");
                invalidateReceivables();
                setTrackingDebt(null);
                setTrackingDate("");
            } else {
                toast.error(res.error || "Takip başlatılırken hata oluştu.");
            }
        });
    };

    const handleWhatsAppMessage = async (customer: any) => {
        setWhatsappCustomer(customer);
        const toastId = toast.loading("Bilgiler hazırlanıyor...");

        try {
            const res = await getCustomerStatement(customer.customerId);

            if (!res.success) {
                toast.error("Hata: " + res.error, { id: toastId });
                return;
            }

            let message = `*${customer.name} - Hesap Özeti*\n\n`;

            const unpaid = (res.debts || []).filter((d: any) => !d.isPaid);
            const earliestDate = unpaid.length > 0
                ? new Date(unpaid.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const relevantTransactions = (res.transactions || []).filter((t: any) => new Date(t.createdAt) >= earliestDate);

            const combined = [
                ...unpaid.map((d: any) => ({
                    date: new Date(d.createdAt),
                    type: 'DEBT',
                    currency: d.currency || 'TRY',
                    amount: Number(d.amount),
                    notes: d.notes || 'Hizmet/Ürün'
                })),
                ...relevantTransactions.map((t: any) => ({
                    date: new Date(t.createdAt),
                    type: 'PAYMENT',
                    currency: t.currency || 'TRY',
                    amount: Number(t.amount),
                    notes: t.description || 'Tahsilat'
                }))
            ].sort((a, b) => a.date.getTime() - b.date.getTime());

            // Group by date
            const dateGroups: { [key: string]: any[] } = {};
            const orderedUniqueDates: string[] = [];

            combined.forEach(item => {
                const dateKey = format(item.date, "dd MMM yyyy", { locale: tr }).toUpperCase();
                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = [];
                    orderedUniqueDates.push(dateKey);
                }
                dateGroups[dateKey].push(item);
            });

            orderedUniqueDates.forEach(dateKey => {
                message += `*${dateKey}*\n`;
                dateGroups[dateKey].forEach(item => {
                    const isUSD = item.currency === 'USD';
                    const symbol = isUSD ? '$' : '₺';
                    const equivSymbol = isUSD ? '₺' : '$';

                    const originalAmt = Math.round(item.amount);
                    const equivalentAmt = isUSD ? (originalAmt * usdRate) : (originalAmt / usdRate);
                    const equivFormatted = Math.round(equivalentAmt).toLocaleString('tr-TR');

                    if (item.type === 'DEBT') {
                        message += `• ${item.notes}: ${symbol}${originalAmt.toLocaleString('tr-TR')} (~${equivSymbol}${equivFormatted})\n`;
                    } else {
                        message += `• 🟢 Ödeme: ${symbol}${originalAmt.toLocaleString('tr-TR')} (~${equivSymbol}${equivFormatted})\n`;
                    }
                });
                message += `\n`;
            });

            message += `*🔴 Toplam Güncel Borç:*\n`;
            const totalTRY = customer.totalRemainingTRY || 0;
            const totalUSD = customer.totalRemainingUSD || 0;

            if (totalTRY > 0) {
                const equivUSD = totalTRY / usdRate;
                message += `₺${totalTRY.toLocaleString('tr-TR')} (~$${Math.round(equivUSD).toLocaleString('tr-TR')})\n`;
            }
            if (totalUSD > 0) {
                const equivTRY = totalUSD * usdRate;
                message += `$${totalUSD.toLocaleString('tr-TR')} (~₺${Math.round(equivTRY).toLocaleString('tr-TR')})\n`;
            }

            if (totalTRY <= 0 && totalUSD <= 0) {
                message += `✅ Bakiyeniz kapanmıştır. Teşekkürler.\n`;
            } else {
                const combinedTotal = totalTRY + (totalUSD * usdRate);
                message += `--------------------\n`;
                message += `*Genel Toplam:* ₺${Math.round(combinedTotal).toLocaleString('tr-TR')}\n`;
                message += `\n_İyi çalışmalar._`;
            }

            setWhatsappMessageContent(message);
            setWhatsappModalOpen(true);
            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error("Bağlantı hatası oluştu.", { id: toastId });
        }
    };

    const handleBulkWhatsAppReminders = () => {
        if (selectedCustomerIds.length === 0) {
            toast.error("Lütfen en az bir müşteri seçin.");
            return;
        }

        const customersToSend = aggregatedData.filter(c => selectedCustomerIds.includes(c.customerId) && c.phone);

        if (customersToSend.length === 0) {
            toast.error("Seçilen müşterilerin telefon numarası bulunamadı.");
            return;
        }

        setBulkCustomersToSend(customersToSend);
        setBulkWhatsAppModalOpen(true);
    };

    const handleConfirmBulkWhatsApp = async () => {
        setBulkWhatsAppModalOpen(false);
        const toastId = toast.loading(`${bulkCustomersToSend.length} müşteri için detaylı borç ekstresi hazırlanıyor...`);

        try {
            for (const customer of bulkCustomersToSend) {
                const res = await getCustomerStatement(customer.customerId);
                if (!res.success) continue;

                let message = `*${customer.name} - Hesap Özeti*\n\n`;

                const unpaid = (res.debts || []).filter((d: any) => !d.isPaid);
                const earliestDate = unpaid.length > 0
                    ? new Date(unpaid.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt)
                    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

                const relevantTransactions = (res.transactions || []).filter((t: any) => new Date(t.createdAt) >= earliestDate);

                const combined = [
                    ...unpaid.map((d: any) => ({
                        date: new Date(d.createdAt),
                        type: 'DEBT',
                        currency: d.currency || 'TRY',
                        amount: Number(d.amount),
                        notes: d.notes || 'Hizmet/Ürün'
                    })),
                    ...relevantTransactions.map((t: any) => ({
                        date: new Date(t.createdAt),
                        type: 'PAYMENT',
                        currency: t.currency || 'TRY',
                        amount: Number(t.amount),
                        notes: t.description || 'Tahsilat'
                    }))
                ].sort((a, b) => a.date.getTime() - b.date.getTime());

                // Group by date
                const dateGroups: { [key: string]: any[] } = {};
                const orderedUniqueDates: string[] = [];

                combined.forEach(item => {
                    const dateKey = format(item.date, "dd MMM yyyy", { locale: tr }).toUpperCase();
                    if (!dateGroups[dateKey]) {
                        dateGroups[dateKey] = [];
                        orderedUniqueDates.push(dateKey);
                    }
                    dateGroups[dateKey].push(item);
                });

                orderedUniqueDates.forEach(dateKey => {
                    message += `*${dateKey}*\n`;
                    dateGroups[dateKey].forEach(item => {
                        const isUSD = item.currency === 'USD';
                        const symbol = isUSD ? '$' : '₺';
                        const equivSymbol = isUSD ? '₺' : '$';

                        const originalAmt = Math.round(item.amount);
                        const equivalentAmt = isUSD ? (originalAmt * usdRate) : (originalAmt / usdRate);
                        const equivFormatted = Math.round(equivalentAmt).toLocaleString('tr-TR');

                        if (item.type === 'DEBT') {
                            message += `• ${item.notes}: ${symbol}${originalAmt.toLocaleString('tr-TR')} (~${equivSymbol}${equivFormatted})\n`;
                        } else {
                            message += `• 🟢 Ödeme: ${symbol}${originalAmt.toLocaleString('tr-TR')} (~${equivSymbol}${equivFormatted})\n`;
                        }
                    });
                    message += `\n`;
                });

                message += `*🔴 Toplam Güncel Borç:*\n`;
                const totalTRY = customer.totalRemainingTRY || 0;
                const totalUSD = customer.totalRemainingUSD || 0;

                if (totalTRY > 0) {
                    const equivUSD = totalTRY / usdRate;
                    message += `₺${totalTRY.toLocaleString('tr-TR')} (~$${Math.round(equivUSD).toLocaleString('tr-TR')})\n`;
                }
                if (totalUSD > 0) {
                    const equivTRY = totalUSD * usdRate;
                    message += `$${totalUSD.toLocaleString('tr-TR')} (~₺${Math.round(equivTRY).toLocaleString('tr-TR')})\n`;
                }

                if (totalTRY <= 0 && totalUSD <= 0) {
                    message += `✅ Bakiyeniz kapanmıştır. Teşekkürler.\n`;
                } else {
                    const combinedTotal = totalTRY + (totalUSD * usdRate);
                    message += `--------------------\n`;
                    message += `*Genel Toplam:* ₺${Math.round(combinedTotal).toLocaleString('tr-TR')}\n`;
                    message += `\n_İyi çalışmalar._`;
                }

                const encodedMsg = encodeURIComponent(message);
                const url = `https://wa.me/90${(customer.phone ?? "").replace(/\D/g, '')}?text=${encodedMsg}`;
                window.open(url, '_blank');

                // Add a small delay so browser doesn't block popups completely
                await new Promise(resolve => setTimeout(resolve, 600));
            }
            toast.success("Tüm mesaj pencereleri açıldı.", { id: toastId });
            setSelectedCustomerIds([]);
        } catch (error) {
            console.error(error);
            toast.error("Bir hata oluştu.", { id: toastId });
        }
    };

    const getExportCustomers = () => {
        const selectedIds = new Set(selectedCustomerIds);
        const customers = selectedIds.size > 0
            ? aggregatedData.filter((item) => selectedIds.has(item.customerId))
            : aggregatedData;

        return customers.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    };

    const buildCustomerExportSections = async () => {
        const customers = getExportCustomers();

        if (customers.length === 0) {
            toast.error("Dışarı aktarılacak müşteri bulunamadı.");
            return [];
        }

        const toastId = toast.loading("Veresiye çıktısı hazırlanıyor...");

        try {
            const sections = await Promise.all(customers.map(async (customer) => {
                const statement = await getCustomerStatement(customer.customerId);
                const statementDebts = statement.success ? (statement.debts || []) : [];
                const statementPayments = statement.success ? (statement.transactions || []) : [];
                const debtsForExport = statementDebts.length > 0 ? statementDebts : customer.debtItems;

                return {
                    customer,
                    debts: debtsForExport,
                    payments: statementPayments,
                };
            }));

            toast.success("Çıktı hazırlandı.", { id: toastId });
            return sections;
        } catch (error) {
            console.error(error);
            toast.error("Çıktı hazırlanırken hata oluştu.", { id: toastId });
            return [];
        }
    };

    const exportRowsForCustomer = (section: any) => {
        const { customer, debts, payments } = section;
        const rows: any[][] = [
            ["Müşteri", customer.name],
            ["Telefon", customer.phone || "-"],
            ["Kalan Borç (TL)", Number(customer.totalRemainingTRY || 0)],
            ["Kalan Borç (USD)", Number(customer.totalRemainingUSD || 0)],
            ["Kayıt Sayısı", debts.length],
            [],
            ["ALINAN ÜRÜNLER / BORÇLAR"],
            ["Tarih", "Ürün / İşlem", "İşlem Tutarı", "Kalan Tutar", "Para Birimi", "Durum", "Vade"],
        ];

        if (debts.length === 0) {
            rows.push(["-", "Borç kaydı yok", 0, 0, "-", "-", "-"]);
        } else {
            debts.forEach((debt: any) => {
                rows.push([
                    safeExportDate(debt.createdAt),
                    debtExportTitle(debt),
                    Number(debt.amount || 0),
                    getSafeDebtRemaining(debt),
                    debt.currency || "TRY",
                    debt.isPaid ? "Ödendi" : "Açık",
                    safeExportDate(debt.dueDate),
                ]);
            });
        }

        rows.push([]);
        rows.push(["ÖDEMELER"]);
        rows.push(["Tarih", "Açıklama", "Tutar", "Para Birimi", "Ödeme Yöntemi"]);

        if (payments.length === 0) {
            rows.push(["-", "Ödeme kaydı yok", 0, "-", "-"]);
        } else {
            payments.forEach((payment: any) => {
                rows.push([
                    safeExportDate(payment.createdAt || payment.date),
                    paymentExportTitle(payment),
                    Number(payment.amount || 0),
                    payment.currency || "TRY",
                    payment.paymentMethod || payment.type || "-",
                ]);
            });
        }

        return rows;
    };

    const exportToExcel = async () => {
        const sections = await buildCustomerExportSections();
        if (sections.length === 0) return;

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        sections.forEach((section, index) => {
            const ws = XLSX.utils.aoa_to_sheet(exportRowsForCustomer(section));
            ws["!cols"] = [
                { wch: 16 },
                { wch: 42 },
                { wch: 16 },
                { wch: 16 },
                { wch: 14 },
                { wch: 14 },
                { wch: 14 },
            ];
            XLSX.utils.book_append_sheet(wb, ws, safeSheetName(section.customer.name, index));
        });

        const suffix = selectedCustomerIds.length > 0 ? "Secili_Musteriler" : "Tum_Musteriler";
        XLSX.writeFile(wb, `Veresiye_${suffix}.xlsx`);
    };

    const exportToCsv = async () => {
        const sections = await buildCustomerExportSections();
        if (sections.length === 0) return;

        const rows = sections.flatMap((section, index) => [
            [`SAYFA ${index + 1}: ${section.customer.name}`],
            ...exportRowsForCustomer(section),
            [],
            ["--- SAYFA SONU ---"],
            [],
        ]);

        const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const suffix = selectedCustomerIds.length > 0 ? "Secili_Musteriler" : "Tum_Musteriler";

        link.href = url;
        link.setAttribute("download", `Veresiye_${suffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (debtsLoading || accountsLoading || ratesLoading || collectedLoading || settingsLoading || shopLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground animate-pulse text-xs font-black uppercase tracking-widest">Veriler Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700 space-y-12">
            <PageHeader
                title="Veresiye Terminali"
                description="Dükkan alacak takibi, geciken ödemeler ve finansal risk analizi merkezi."
                icon={CreditCard}
                iconColor="text-indigo-500"
                iconBgColor="bg-indigo-500/10"
                badge={
                    <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border-none px-3 py-1 text-[9px] uppercase font-bold tracking-widest">FİNANSAL DENETİM</Badge>
                    </div>
                }
                actions={
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        {selectedCustomerIds.length > 0 && (
                            <Button
                                onClick={handleBulkWhatsAppReminders}
                                className="h-12 flex-1 sm:flex-none px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 gap-2 text-xs font-black uppercase tracking-widest text-white transition-all animate-in zoom-in-95"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {selectedCustomerIds.length} Kişiye Hatırlatma At
                            </Button>
                        )}
                        <AddDebtModal rates={rates} />
                        <Button
                            onClick={exportToExcel}
                            variant="ghost"
                            className="h-12 flex-1 sm:flex-none px-6 rounded-xl bg-muted/50 border border-border shadow-xl gap-2 text-xs hover:bg-muted transition-all text-foreground"
                        >
                            <Download className="w-4 h-4 text-indigo-400" />
                            <span className="hidden sm:inline">Tabloyu İndir (Excel)</span>
                            <span className="sm:hidden">Excel</span>
                        </Button>
                        <Button
                            onClick={exportToCsv}
                            variant="ghost"
                            className="h-12 flex-1 sm:flex-none px-6 rounded-xl bg-muted/50 border border-border shadow-xl gap-2 text-xs hover:bg-muted transition-all text-foreground"
                        >
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span className="hidden sm:inline">Dışarı Aktar (CSV)</span>
                            <span className="sm:hidden">CSV</span>
                        </Button>
                    </div>
                }
            />

            <LayoutCustomizer sectionKey="veresiye_stats" settings={settings} onUpdate={() => router.refresh()}>
                <VeresiyeStats
                    statsData={statsData}
                    onStatClick={(type) => {
                        setStatsModalType(type as any);
                        setStatsModalOpen(true);
                    }}
                />
            </LayoutCustomizer>

            {/* --- Main Section --- */}
            <div className={cn("grid grid-cols-1 gap-10", isAnalysisHidden ? "lg:grid-cols-1" : "lg:grid-cols-12")}>

                {/* Left Sidebar: Aging Analysis & Insights */}
                <LayoutCustomizer sectionKey="veresiye_analysis" settings={settings} onUpdate={() => router.refresh()} className="lg:col-span-3">
                    <VeresiyeAnalysisSide aging={aging} defaultCurrency={defaultCurrency} />
                </LayoutCustomizer>

                {/* Right: Premium Customer Table */}
                <LayoutCustomizer sectionKey="veresiye_table" settings={settings} onUpdate={() => router.refresh()} className={cn(isAnalysisHidden ? "lg:col-span-12" : "lg:col-span-9")}>
                    <div className="space-y-8">
                        <VeresiyeToolbar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            debtFilter={debtFilter}
                            onDebtFilterChange={(val: any) => setDebtFilter(val)}
                            sortOrder={sortOrder}
                            onSortOrderChange={(val: any) => setSortOrder(val)}
                            filterStatus={filterStatus}
                            onFilterStatusChange={handleFilterChange}
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                        />

                        <Card className="bg-muted/20 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-border relative z-10 min-h-[600px]">
                            <div className={cn("transition-all duration-500 flex flex-col h-full", isPending ? "opacity-30 blur-md grayscale pointer-events-none scale-[0.99]" : "opacity-100 blur-0 grayscale-0 scale-100")}>
                                {aggregatedData.length > 0 && !isPending && (
                                    <div className={cn(
                                        "transition-all duration-500",
                                        viewMode === 'grid'
                                            ? "grid grid-cols-1 lg:grid-cols-2 gap-3 p-4 md:p-6"
                                            : "flex flex-col"
                                    )}>
                                        <AnimatePresence mode="popLayout">
                                            {aggregatedData.map((item, idx) => (
                                                <VeresiyeCustomerCard
                                                    key={item.customerId}
                                                    item={item}
                                                    idx={idx}
                                                    viewMode={viewMode}
                                                    usdRate={usdRate}
                                                    rates={rates}
                                                    isSelected={selectedCustomerIds.includes(item.customerId)}
                                                    onSelect={(id) => {
                                                        setSelectedCustomerIds(prev =>
                                                            prev.includes(id)
                                                                ? prev.filter(x => x !== id)
                                                                : [...prev, id]
                                                        );
                                                    }}
                                                    onWhatsApp={handleWhatsAppMessage}
                                                    onReceipt={async (item) => {
                                                        const toastId = toast.loading("Hesap dökümü hazırlanıyor...");
                                                        try {
                                                            const res = await getCustomerStatement(item.customerId);
                                                            if (res.success) {
                                                                const combined = [
                                                                    ...(res.debts || []).map((d: any) => ({ ...d, type: 'DEBT' })),
                                                                    ...(res.transactions || []).map((t: any) => ({
                                                                        ...t,
                                                                        type: 'PAYMENT',
                                                                        notes: t.notes || 'Tahsilat / Ödeme',
                                                                        amount: t.amount,
                                                                        remainingAmount: t.amount
                                                                    }))
                                                                ];
                                                                setReceiptCustomer(item);
                                                                setReceiptDebts(combined);
                                                                toast.success("Hesap dökümü yüklendi.", { id: toastId });
                                                            } else {
                                                                toast.error("Hata: " + res.error, { id: toastId });
                                                            }
                                                        } catch (err) {
                                                            toast.error("Bağlantı hatası.", { id: toastId });
                                                        }
                                                    }}
                                                    onDetail={openCustomerStatement}
                                                    onPayment={(item) => {
                                                        setPaymentCustomer(item);
                                                        setPaymentCurrency("TRY");
                                                        setPaymentAmount((item.totalRemainingTRY + (item.totalRemainingUSD * (rates?.usd || 32.5))).toFixed(2));
                                                    }}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {aggregatedData.length === 0 && !isPending && <VeresiyeEmptyState />}

                            </div>

                            {/* Bottom Decoration */}
                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                        </Card>
                    </div>
                </LayoutCustomizer>
            </div>

            {/* --- Payment Dialogs --- */}
            <VeresiyePaymentModal
                paymentCustomer={paymentCustomer}
                onClose={() => setPaymentCustomer(null)}
                paymentAmount={paymentAmount}
                onAmountChange={setPaymentAmount}
                paymentCurrency={paymentCurrency}
                onCurrencyChange={(curr) => handleCurrencySwitch(curr as "TRY" | "USD")}
                paymentMethod={paymentMethod}
                onMethodChange={(method) => {
                    setPaymentMethod(method);
                    const fa = accounts.filter((acc: any) =>
                        method === "CASH" ? acc.type === "CASH" :
                            method === "CARD" ? (acc.type === "POS" || acc.type === "BANK") :
                                (acc.type === "BANK")
                    );
                    if (fa.length > 0) setSelectedAccountId(fa[0].id);
                    else setSelectedAccountId("");
                }}
                paymentNotes={paymentNotes}
                onNotesChange={setPaymentNotes}
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
                accounts={accounts}
                isPending={isPending}
                onConfirm={handleCollectPayment}
                rates={rates}
                setIgnoreBalance={setIgnoreBalance}
            />

            <AlertDialog open={!!historyCustomer} onOpenChange={(o) => { if (!o) { setHistoryCustomer(null); setSelectedDebtIds([]); } }}>
                <AlertDialogContent
                    className="max-w-[800px] h-[85vh] bg-card rounded-[2.5rem] p-0 overflow-hidden flex flex-col shadow-2xl border border-border/50"
                >
                    <div className="p-4 md:p-6 bg-muted/30 dark:bg-muted/10 border-b border-border/50 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 ml-3">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight truncate">{historyCustomer?.name}</h3>
                                <p className="text-[10px] text-muted-foreground font-bold">{historyCustomer?.phone || "Telefon Yok"}</p>
                            </div>
                            <div className="mx-4 flex-1 max-w-xs relative group hidden sm:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    value={historySearchTerm}
                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                    placeholder="İşlem veya ürün ara..."
                                    className="pl-9 h-9 bg-muted/20 border-border/50 rounded-xl text-[11px] focus:bg-background transition-all"
                                />
                            </div>
                        </div>
                        {/* Icon-only action buttons with tooltips */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Yeni Borç Ekle */}
                            {historyCustomer && (
                                <AddDebtModal rates={rates as any} initialData={{ name: historyCustomer.name, phone: historyCustomer.phone || "" }}>
                                    <button
                                        title="Yeni Alacak Ekle"
                                        className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white border border-indigo-500/10 transition-all"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">Yeni Alacak Ekle</span>
                                    </button>
                                </AddDebtModal>
                            )}
                            {/* Excel */}
                            <button
                                title="Ekstre (Excel)"
                                onClick={async () => {
                                    if (!statementData) { toast.error("Veriler yükleniyor, lütfen bekleyin..."); return; }
                                    const data = [
                                        ...statementData.debts.map((d: any) => ({ Tarih: format(new Date(d.createdAt), "dd.MM.yyyy"), İşlem: d.notes || "Borç", Tip: "BORÇ", Tutar: d.amount, ParaBirim: d.currency, Durum: d.isPaid ? "Ödendi" : "Açık" })),
                                        ...statementData.transactions.map((t: any) => ({ Tarih: format(new Date(t.createdAt), "dd.MM.yyyy"), İşlem: t.description || "Tahsilat", Tip: "TAHSİLAT", Tutar: t.amount, ParaBirim: t.currency || "TRY", Durum: "-" }))
                                    ].sort((a, b) => new Date(b.Tarih).getTime() - new Date(a.Tarih).getTime());
                                    const XLSX = await import("xlsx");
                                    const ws = XLSX.utils.json_to_sheet(data);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Ekstre");
                                    XLSX.writeFile(wb, `${historyCustomer?.name}_Ekstre.xlsx`);
                                }}
                                className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-muted/60 text-foreground hover:bg-muted border border-border/50 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">Ekstre (Excel)</span>
                            </button>
                            {/* WhatsApp */}
                            <button
                                title="WhatsApp Ekstre"
                                onClick={() => {
                                    if (!statementData) { toast.error("Veriler yükleniyor, lütfen bekleyin..."); return; }
                                    let message = `*${historyCustomer?.name} - Hesap Özeti*\n\n`;
                                    const unpaidDebts = (statementData.debts || []).filter((d: any) => !d.isPaid);
                                    const earliestDate = unpaidDebts.length > 0
                                        ? new Date(unpaidDebts.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt)
                                        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                                    const relevantTransactions = (statementData.transactions || []).filter((t: any) => new Date(t.createdAt) >= earliestDate);
                                    const combined = [
                                        ...unpaidDebts.map((d: any) => ({ date: new Date(d.createdAt), type: 'DEBT', currency: d.currency || 'TRY', amount: Number(d.amount), notes: d.notes || 'Hizmet/Ürün' })),
                                        ...relevantTransactions.map((t: any) => ({ date: new Date(t.createdAt), type: 'PAYMENT', currency: t.currency || 'TRY', amount: Number(t.amount), notes: t.description || 'Tahsilat' }))
                                    ].sort((a, b) => a.date.getTime() - b.date.getTime());
                                    const dateGroups: { [key: string]: any[] } = {};
                                    const orderedUniqueDates: string[] = [];
                                    combined.forEach(item => {
                                        const dateKey = format(item.date, "dd MMM yyyy", { locale: tr }).toUpperCase();
                                        if (!dateGroups[dateKey]) { dateGroups[dateKey] = []; orderedUniqueDates.push(dateKey); }
                                        dateGroups[dateKey].push(item);
                                    });
                                    orderedUniqueDates.forEach(dateKey => {
                                        message += `*${dateKey}*\n`;
                                        dateGroups[dateKey].forEach(item => {
                                            const isUSD = item.currency === 'USD';
                                            const symbol = isUSD ? '$' : '₺';
                                            const equivSymbol = isUSD ? '₺' : '$';
                                            const originalAmt = item.amount;
                                            const equivalentAmt = isUSD ? (originalAmt * usdRate) : (originalAmt / usdRate);
                                            const equivFormatted = equivSymbol === '$' ? equivalentAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(equivalentAmt).toLocaleString('tr-TR');
                                            if (item.type === 'DEBT') { message += `• ${item.notes}: ${symbol}${originalAmt.toLocaleString('tr-TR')} (~${equivSymbol}${equivFormatted})\n`; }
                                            else { message += `• 🟢 Ödeme: ${symbol}${originalAmt.toLocaleString('tr-TR')} (~${equivSymbol}${equivFormatted})\n`; }
                                        });
                                        message += `\n`;
                                    });
                                    message += `*Toplam Güncel Borç:*\n`;
                                    const totalTRY = historyCustomer?.totalRemainingTRY || 0;
                                    const totalUSD = historyCustomer?.totalRemainingUSD || 0;
                                    if (totalTRY > 0) { message += `🔴 ₺${totalTRY.toLocaleString('tr-TR')} (~$${(totalTRY / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`; }
                                    if (totalUSD > 0) { message += `🔴 $${totalUSD.toLocaleString('tr-TR')} (~₺${Math.round(totalUSD * usdRate).toLocaleString('tr-TR')})\n`; }
                                    if (Number(historyCustomer?.balance || 0) > 0) message += `🎁 TL Emanet: ₺${Number(historyCustomer.balance).toLocaleString('tr-TR')}\n`;
                                    if (Number(historyCustomer?.balanceUsd || 0) > 0) message += `🎁 USD Emanet: $${Number(historyCustomer.balanceUsd).toLocaleString('tr-TR')}\n`;
                                    if (totalTRY <= 0 && totalUSD <= 0) { message += `✅ Bakiyeniz tamamen kapanmıştır. Teşekkür ederiz.\n`; }
                                    else { const combinedTotalTRY = totalTRY + (totalUSD * usdRate); message += `--------------------\n*Genel Toplam:* ₺${Math.ceil(combinedTotalTRY).toLocaleString('tr-TR')}\n\n_İyi çalışmalar._`; }
                                    setWhatsappMessageContent(message);
                                    setWhatsappCustomer(historyCustomer);
                                    setWhatsappModalOpen(true);
                                }}
                                className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 transition-all"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">WhatsApp Ekstre</span>
                            </button>
                            {/* Fiş Yazdır */}
                            <button
                                title="Fiş Yazdır"
                                onClick={async () => {
                                    if (!statementData) { toast.error("Veriler yükleniyor..."); return; }
                                    const combined = [
                                        ...(statementData.debts || []).map((d: any) => ({ ...d, type: 'DEBT' })),
                                        ...(statementData.transactions || []).filter((t: any) => t.paymentMethod !== 'DEBT').map((t: any) => ({ ...t, type: 'PAYMENT', notes: t.description || 'Tahsilat / Ödeme', amount: t.amount, remainingAmount: t.amount }))
                                    ];
                                    setReceiptCustomer({ id: historyCustomer.customerId, name: historyCustomer.name, phone: historyCustomer.phone });
                                    setReceiptDebts(combined);
                                }}
                                className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white border border-indigo-500/10 transition-all"
                            >
                                <Printer className="w-4 h-4" />
                                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border px-2 py-1 text-[10px] font-bold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">Fiş Yazdır</span>
                            </button>
                            {/* Kapat */}
                            <button
                                title="Kapat"
                                onClick={() => { setHistoryCustomer(null); setSelectedDebtIds([]); }}
                                className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 transition-all ml-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="px-6 md:px-8 py-4 overflow-y-auto flex-1 space-y-2 scrollbar-hide">
                        {(() => {
                            const debtsToDisplay = statementData?.debts || (historyCustomer as any)?.debtItems || [];
                            let items = [
                                ...debtsToDisplay.map((d: any) => ({ ...d, listType: 'DEBT' })),
                                ...((statementData?.transactions || []) as any[]).filter((t: any) => t.paymentMethod !== 'DEBT').map((t: any) => ({ ...t, listType: 'PAYMENT' }))
                            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                            if (historySearchTerm) {
                                const lowQuery = normalizeSearchText(historySearchTerm);
                                items = items.filter((item: any) => {
                                    const notesMatch = normalizeSearchText(item.notes || item.description || "").includes(lowQuery);
                                    const dateMatch = format(new Date(item.createdAt), "dd.MM.yyyy", { locale: tr }).includes(historySearchTerm);
                                    let productsMatch = false;
                                    if (item.sale?.items) {
                                        productsMatch = item.sale.items.some((si: any) =>
                                            normalizeSearchText(si.product?.name || si.productName || "").includes(lowQuery) ||
                                            normalizeSearchText(si.product?.barcode || "").includes(lowQuery) ||
                                            normalizeSearchText(si.product?.sku || "").includes(lowQuery) ||
                                            (si.product?.deviceInfo?.imei && normalizeSearchText(si.product.deviceInfo.imei).includes(lowQuery))
                                        );
                                    }
                                    return notesMatch || productsMatch || dateMatch;
                                });
                            }

                            const isDataLoading = !statementData;

                            if (items.length === 0 && !isDataLoading) return <div className="text-center py-12 text-muted-foreground font-bold uppercase text-[10px]">Veri Bulunamadı</div>;

                            return (
                                <>
                                    {isDataLoading && (
                                        <div className="flex items-center justify-center py-8 gap-3 bg-muted/30 rounded-2xl border border-dashed border-border">
                                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tahsilat Verileri Yükleniyor...</span>
                                        </div>
                                    )}
                                    {items.map((item: any) => (
                                        item.listType === 'DEBT' ? (
                                            <div
                                                key={`debt-${item.id}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.isPaid) return;
                                                    setSelectedDebtIds(prev =>
                                                        prev.includes(item.id)
                                                            ? prev.filter(id => id !== item.id)
                                                            : [...prev, item.id]
                                                    );
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group",
                                                    item.isPaid ? "bg-muted/50 opacity-60 grayscale cursor-default" :
                                                        selectedDebtIds.includes(item.id)
                                                            ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/30"
                                                            : "bg-muted/20 border-border/50 hover:border-indigo-500/20"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {!item.isPaid ? (
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                            selectedDebtIds.includes(item.id)
                                                                ? "bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/30"
                                                                : "border-border bg-card"
                                                        )}>
                                                            {selectedDebtIds.includes(item.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                        </div>
                                                    ) : (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    )}
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-black text-foreground uppercase tracking-tight">{item.notes || "İsimsiz Borç"}</span>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{format(new Date(item.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                            {item.sale && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-full font-black border border-indigo-500/10">POS SATIŞI</span>
                                                            )}
                                                            {Number(item.amount) !== getSafeDebtRemaining(item) && (
                                                                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded italic">
                                                                    Orijinal: {item.currency === 'USD' ? '$' : '₺'}{Number(item.amount).toLocaleString('tr-TR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.sale?.items && item.sale.items.length > 0 && (
                                                            <div className="mt-2 pl-4 border-l-2 border-indigo-500/20 flex flex-col gap-1">
                                                                {item.sale.items.map((si: any, sidx: number) => {
                                                                    const itemCurrency = item.currency || "TRY";
                                                                    const returnAlreadyActive = hasActiveReturn(item.id, item.saleId || item.sale?.id, si.productId);
                                                                    return (
                                                                        <div key={sidx} className="text-[10px] text-muted-foreground flex items-center justify-between gap-2 group/item pr-1">
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <span className="w-1 h-1 rounded-full bg-indigo-500/40 shrink-0" />
                                                                                <span className="font-bold text-foreground/80">{si.quantity}x</span>
                                                                                <span className="truncate max-w-[160px]">{si.product?.name}</span>
                                                                                <span className="opacity-60 shrink-0">(@ {itemCurrency === "USD" ? "$" : "₺"}{formatCurrency(si.unitPrice)})</span>
                                                                            </div>
                                                                            {si.product && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    disabled={returnAlreadyActive}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (returnAlreadyActive) {
                                                                                            toast.error("Bu ürün için tamamlanmamış bir iade kaydı var.");
                                                                                            return;
                                                                                        }
                                                                                        const params = new URLSearchParams({
                                                                                            customerId: historyCustomer.customerId,
                                                                                            customerName: historyCustomer.name,
                                                                                            productId: si.productId,
                                                                                            productName: si.product.name,
                                                                                            quantity: String(si.quantity),
                                                                                            refundAmount: String(Number(si.unitPrice) * si.quantity),
                                                                                            refundCurrency: itemCurrency,
                                                                                            unitPrice: String(Number(si.unitPrice)),
                                                                                            saleNumber: item.sale?.saleNumber || "",
                                                                                            soldAt: item.sale?.createdAt || item.createdAt || "",
                                                                                            saleId: item.saleId || item.sale?.id || "",
                                                                                            debtId: item.id,
                                                                                        });
                                                                                        router.push(`/stok/iade?${params.toString()}`);
                                                                                    }}
                                                                                    className="h-5 px-2 text-[9px] font-bold rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white opacity-0 group-hover/item:opacity-100 transition-all shrink-0 uppercase tracking-widest disabled:opacity-60 disabled:hover:bg-muted disabled:hover:text-muted-foreground"
                                                                                >
                                                                                    {returnAlreadyActive ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <ArrowLeftRight className="w-2.5 h-2.5 mr-1" />}
                                                                                    {returnAlreadyActive ? "İadede" : "İadeye"}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{item.isPaid ? "ÖDENDİ" : "KALAN"}:</span>
                                                            <span className={cn("text-sm font-black tabular-nums", item.currency === 'USD' ? "text-blue-600" : "text-emerald-600")}>
                                                                {item.currency === 'USD' ? '$' : '₺'}{getSafeDebtRemaining(item).toLocaleString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!item.isPaid && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {(() => {
                                                                const returnAlreadyActive = hasActiveReturn(item.id);
                                                                return (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={returnAlreadyActive}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (returnAlreadyActive) {
                                                                                toast.error("Bu borç için tamamlanmamış bir iade kaydı var.");
                                                                                return;
                                                                            }
                                                                            const params = new URLSearchParams({
                                                                                customerId: historyCustomer.customerId,
                                                                                customerName: historyCustomer.name,
                                                                                debtId: item.id,
                                                                                productName: item.notes || 'Borç/Ürün İadesi',
                                                                                refundAmount: String(item.amount),
                                                                                refundCurrency: item.currency || "TRY",
                                                                                quantity: "1"
                                                                            });
                                                                            router.push(`/stok/iade?${params.toString()}`);
                                                                        }}
                                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-orange-600 bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-60"
                                                                        title={returnAlreadyActive ? "İade işlemi tamamlanmadan tekrar gönderilemez" : "İadeye Gönder"}
                                                                    >
                                                                        {returnAlreadyActive ? <CheckCircle2 className="w-3 h-3" /> : <ArrowLeftRight className="w-3 h-3" />}
                                                                    </Button>
                                                                );
                                                            })()}
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingDebt(item); setEditAmount(String(item.amount)); setEditNotes(item.notes || ""); setEditCurrency(item.currency || "TRY"); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-indigo-600 bg-muted hover:bg-muted/80 rounded-lg"><Pencil className="w-3 h-3" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteDebt(item.id); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 bg-muted hover:bg-muted/80 rounded-lg"><Trash2 className="w-3 h-3" /></Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={`tx-${item.id}`} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 transition-all border-dashed group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                                        <TrendingUp className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{item.description || "Tahsilat"}</span>
                                                        <span className="text-[9px] text-emerald-600/60 dark:text-emerald-400/60 font-medium">{format(new Date(item.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    <span className="text-sm font-black text-emerald-600 tabular-nums">
                                                        + {item.currency === 'USD' ? '$' : '₺'}{Number(item.amount).toLocaleString('tr-TR')}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTransaction(item);
                                                            setEditTxAmount(String(item.amount));
                                                            setEditTxNotes(item.description || "");
                                                        }} className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg">
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTransaction(item.id);
                                                        }} className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg">
                                                            <RotateCcw className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </>
                            );
                        })()}
                    </div>
                    <div className="p-4 md:p-5 bg-muted/10 border-t border-border/40 flex flex-wrap gap-2 items-center justify-between shrink-0">
                        {/* Sol: seçili kalem + ödeme butonu */}
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">İŞLEM MERKEZİ</span>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedDebtIds.length} Kalem Seçili</span>
                            </div>
                            {selectedDebtIds.length > 0 && (
                                <Button
                                    onClick={() => {
                                        let sumTRY = 0;
                                        let sumUSD = 0;
                                        (historyCustomer?.debtItems || []).forEach((d: any) => {
                                            if (selectedDebtIds.includes(d.id)) {
                                                if (d.currency === 'USD') sumUSD += getSafeDebtRemaining(d);
                                                else sumTRY += getSafeDebtRemaining(d);
                                            }
                                        });
                                        setPaymentCustomer(historyCustomer);
                                        setPaymentCurrency("TRY");
                                        setPaymentAmount(String(Math.round(sumTRY + (sumUSD * (rates?.usd || 32.5)))));
                                        setHistoryCustomer(null);
                                    }}
                                    className="h-9 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                >
                                    Seçilenleri Öde
                                </Button>
                            )}
                            {selectedDebtIds.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBulkReturn}
                                    className="h-9 px-4 rounded-xl border-orange-500/30 text-orange-600 hover:bg-orange-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <ArrowLeftRight className="w-3 h-3" />
                                    Seçilenleri İade Et
                                </Button>
                            )}
                        </div>

                        {/* Sağ: Borç özeti */}
                        <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30 rounded-2xl border border-border/40">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">TL BORCU</span>
                                <span className="text-sm font-black text-emerald-600 leading-none">₺{historyTotals.try.toLocaleString('tr-TR')}</span>
                                <span className="text-[7px] font-bold text-muted-foreground/50 uppercase mt-0.5">~${Math.round(historyTotals.try / usdRate).toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="flex flex-col items-end border-l border-border/40 pl-4">
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">USD BORCU</span>
                                <span className="text-sm font-black text-blue-600 leading-none">${historyTotals.usd.toLocaleString('tr-TR')}</span>
                                <span className="text-[7px] font-bold text-muted-foreground/50 uppercase mt-0.5">~₺{(historyTotals.usd * usdRate).toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="h-8 w-px bg-border/40" />
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">GENEL TOPLAM</span>
                                <span className="text-lg font-black text-indigo-600 tracking-tighter leading-none">
                                    ₺{Math.round(historyTotals.try + (historyTotals.usd * usdRate)).toLocaleString('tr-TR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Edit Debt Modal --- */}
            <AlertDialog open={!!editingDebt} onOpenChange={(o) => { if (!o) setEditingDebt(null); }}>
                <AlertDialogContent className="w-full max-w-[400px] h-auto rounded-[2rem] p-6 bg-card border border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Borç Kaydını Düzenle</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">TOPLAM TUTAR</Label>
                            <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-12 bg-muted/30 border-border/50 font-mono text-lg text-foreground" />
                            <p className="text-[10px] text-amber-500 italic">Not: Tutarı düşürürken dikkatli olun. Kalan borç, aradaki farka göre otomatik güncellenecektir.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">AÇIKLAMA</Label>
                            <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="h-12 bg-muted/30 border-border/50 text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">PARA BİRİMİ</Label>
                            <div className="flex bg-muted/50 p-1 rounded-xl h-12 border border-border/50">
                                <button type="button" onClick={() => setEditCurrency("TRY")} className={cn("flex-1 text-xs font-bold rounded-lg transition-all", editCurrency === "TRY" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border/50" : "text-muted-foreground")}>TÜRK LİRASI (₺)</button>
                                <button type="button" onClick={() => setEditCurrency("USD")} className={cn("flex-1 text-xs font-bold rounded-lg transition-all", editCurrency === "USD" ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border/50" : "text-muted-foreground")}>DOLAR ($)</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/50 mt-2">
                        <Button variant="ghost" onClick={() => setEditingDebt(null)}>İptal</Button>
                        <Button onClick={submitDebtUpdate} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl">Kaydet</Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Edit Transaction Modal --- */}
            <AlertDialog open={!!editingTransaction} onOpenChange={(o) => { if (!o) setEditingTransaction(null); }}>
                <AlertDialogContent className="w-full max-w-[400px] h-auto rounded-[2rem] p-6 bg-card border border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tahsilatı Düzenle</AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] text-muted-foreground uppercase font-bold">
                            Tahsilat miktarını ve açıklamasını buradan güncelleyebilirsiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                TAHSİLAT TUTARI ({editingTransaction?.currency === 'USD' ? 'USD' : 'TL'})
                            </Label>
                            <Input
                                type="number"
                                value={editTxAmount}
                                onChange={(e) => setEditTxAmount(e.target.value)}
                                className={cn(
                                    "h-12 bg-muted/30 border-border/50 font-mono text-lg",
                                    editingTransaction?.currency === 'USD' ? "text-blue-500" : "text-emerald-600"
                                )}
                            />
                            <p className="text-[10px] text-amber-500 italic">Dikkat: Tutar değişikliği borç bakiyesini otomatik olarak ayarlayacaktır.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">AÇIKLAMA</Label>
                            <Input value={editTxNotes} onChange={(e) => setEditTxNotes(e.target.value)} className="h-12 bg-muted/30 border-border/50 text-foreground" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/50 mt-2">
                        <Button variant="ghost" onClick={() => setEditingTransaction(null)}>İptal</Button>
                        <Button onClick={handleUpdateTransaction} disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl min-w-[100px]">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Güncelle"}
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!portfolioCustomer} onOpenChange={(o) => { if (!o) setPortfolioCustomer(null); }}>
                <AlertDialogContent className="max-w-[900px] h-[85vh] bg-background dark:bg-[#0f172a] rounded-[3rem] p-0 overflow-hidden flex flex-col shadow-[0_50px_200px_-50px_rgba(0,0,0,0.5)] border-none">
                    <div className="px-10 py-12 bg-slate-900 border-b border-white/5 relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-12 opacity-10"><User className="w-32 h-32 rotate-12 text-white" /></div>
                        <div className="relative z-10 flex items-center gap-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center text-white border border-white/10 text-4xl font-black">
                                {portfolioCustomer?.name[0].toUpperCase()}
                            </div>
                            <div className="space-y-2">
                                <AlertDialogTitle className="text-4xl font-black text-white uppercase tracking-tight">{portfolioCustomer?.name}</AlertDialogTitle>
                                <div className="flex items-center gap-4 text-white/60 text-xs">
                                    <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {portfolioCustomer?.phone}</span>
                                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Müşteri Katılımı: {new Date(portfolioCustomer?.lastActivity).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-10 right-10 z-20 flex gap-4">
                            <Button
                                onClick={async () => {
                                    const toastId = toast.loading("Fiş hazırlanıyor...");
                                    try {
                                        const res = await getCustomerStatement(portfolioCustomer.customerId || portfolioCustomer.id);
                                        if (res.success) {
                                            const combined = [
                                                ...(res.debts || []).map((d: any) => ({ ...d, type: 'DEBT' })),
                                                ...(res.transactions || []).map((t: any) => ({
                                                    ...t,
                                                    type: 'PAYMENT',
                                                    notes: t.description || 'Tahsilat / Ödeme',
                                                    amount: t.amount,
                                                    remainingAmount: t.amount
                                                }))
                                            ];
                                            setReceiptCustomer({
                                                id: portfolioCustomer.customerId || portfolioCustomer.id,
                                                name: portfolioCustomer.name,
                                                phone: portfolioCustomer.phone
                                            });
                                            setReceiptDebts(combined);
                                            toast.success("Fiş dökümü hazır.", { id: toastId });
                                        } else {
                                            toast.error("Hata: " + res.error, { id: toastId });
                                        }
                                    } catch (err) {
                                        toast.error("Bağlantı hatası.", { id: toastId });
                                    }
                                }}
                                className="h-14 px-8 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-3 transition-all active:scale-95 shadow-2xl"
                            >
                                <Printer className="w-6 h-6" />
                                <span className="text-xs font-black uppercase tracking-widest">FİŞ YAZDIR</span>
                            </Button>
                        </div>
                    </div>

                    <div className="p-10 overflow-y-auto flex-1 scrollbar-hide bg-slate-50 dark:bg-zinc-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Stats Column */}
                            <div className="space-y-6">
                                <div className="p-8 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">TOPLAM ALACAK (₺ KARŞILIĞI)</span>
                                    </div>
                                    <span className="text-4xl font-black tabular-nums tracking-tighter">
                                        ₺{Math.round((portfolioCustomer?.totalRemainingTRY || 0) + ((portfolioCustomer?.totalRemainingUSD || 0) * (rates?.usd || 32.5))).toLocaleString('tr-TR')}
                                    </span>
                                    <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black opacity-60 uppercase mb-1">TL Bakiye</span>
                                            <span className="font-bold">₺{(portfolioCustomer?.totalRemainingTRY || 0).toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="flex flex-col border-l border-white/20 pl-4">
                                            <span className="text-[9px] font-black opacity-60 uppercase mb-1">Dolar Bakiye</span>
                                            <span className="font-bold">${(portfolioCustomer?.totalRemainingUSD || 0).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-card border border-border">
                                    <span className="block text-[10px] font-black text-muted-foreground uppercase mb-2">SİSTEM HAREKETİ</span>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Satış</span><span className="text-xs font-black text-foreground">{portfolioData?.sales?.length ?? '-'}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Teknik Servis</span><span className="text-xs font-black text-foreground">{portfolioData?.tickets?.length ?? '-'}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Alacak Kaydı</span><span className="text-xs font-black text-foreground">{portfolioData?.debts?.length ?? '-'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Feed Column */}
                            <div className="md:col-span-2 space-y-8">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">SON İŞLEMLER</h4>
                                <div className="space-y-4">
                                    {!portfolioData ? (
                                        <div className="flex items-center justify-center h-32">
                                            <RefreshCcw className="w-6 h-6 text-muted-foreground animate-spin" />
                                        </div>
                                    ) : [
                                        ...(portfolioData.sales || []).map((s: any) => ({ ...s, type: 'SALE', label: 'Satış İşlemi', amount: s.finalAmount || 0, formattedDate: new Date(s.createdAt) })),
                                        ...(portfolioData.tickets || []).map((t: any) => ({ ...t, type: 'TICKET', label: 'Teknik Servis', amount: t.actualCost || 0, formattedDate: new Date(t.createdAt) })),
                                        ...(portfolioData.debts || []).map((d: any) => ({ ...d, type: 'DEBT', label: 'Alacak Kaydı', amount: d.amount || 0, formattedDate: new Date(d.createdAt) })),
                                        ...(portfolioData.transactions || []).filter((tx: any) => tx.type === 'INCOME').map((tx: any) => ({ ...tx, type: 'COLLECTION', label: 'Tahsilat', amount: tx.amount || 0, formattedDate: new Date(tx.createdAt) }))
                                    ]
                                        .sort((a: any, b: any) => b.formattedDate.getTime() - a.formattedDate.getTime())
                                        .slice(0, 9)
                                        .map((item: any, i) => (
                                            <div key={i} className={cn("flex items-center gap-5 p-4 md:p-6 bg-card rounded-3xl border border-border shadow-sm transition-all cursor-default", item.type === 'DEBT' && item.isPaid && "opacity-60")}>
                                                <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0",
                                                    item.type === 'SALE' ? "bg-indigo-100 text-indigo-600" :
                                                        item.type === 'TICKET' ? "bg-amber-100 text-amber-600" :
                                                            item.type === 'COLLECTION' ? "bg-emerald-100 text-emerald-600" :
                                                                "bg-rose-100 text-rose-600"
                                                )}>
                                                    {item.type === 'SALE' ? <CreditCard className="w-5 h-5 md:w-6 md:h-6" /> :
                                                        item.type === 'TICKET' ? <Phone className="w-5 h-5 md:w-6 md:h-6" /> :
                                                            item.type === 'COLLECTION' ? <Wallet className="w-5 h-5 md:w-6 md:h-6" /> :
                                                                <FileText className="w-5 h-5 md:w-6 md:h-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="block text-[9px] font-black text-muted-foreground uppercase">{item.label}</span>
                                                        {item.type === 'DEBT' && (
                                                            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", item.isPaid ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                                                {item.isPaid ? "ÖDENDİ" : "BEKLİYOR"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="block text-xs md:text-sm font-bold text-foreground truncate">{item.saleNumber || item.ticketNumber || item.deviceModel || item.notes || "Belirtilmemiş İşlem"}</span>
                                                    <span className="block text-[10px] text-muted-foreground mt-0.5">{item.formattedDate.toLocaleDateString('tr-TR')}</span>
                                                </div>
                                                <div className="text-right shrink-0 flex flex-col items-end">
                                                    <span className={cn("text-base md:text-lg font-black tabular-nums", item.type === 'COLLECTION' ? "text-emerald-600" : "text-foreground")}>
                                                        {item.type === 'COLLECTION' ? '+' : ''}{item.currency === 'USD' ? '$' : '₺'}{Number(item.amount).toLocaleString('tr-TR')}
                                                    </span>
                                                    {item.currency === 'USD' && (
                                                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                                            ~₺{Math.round(Number(item.amount) * (rates?.usd || 32.5)).toLocaleString('tr-TR')}
                                                        </span>
                                                    )}
                                                    {item.type === 'COLLECTION' && (
                                                        <div className="flex gap-1 mt-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-blue-500 rounded-lg hover:bg-blue-50"
                                                                onClick={() => {
                                                                    setEditingTransaction(item);
                                                                    setEditTxAmount(item.amount.toString());
                                                                    setEditTxNotes(item.description || "");
                                                                }}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-rose-500 rounded-lg hover:bg-rose-50"
                                                                onClick={() => handleDeleteTransaction(item.id)}
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 border-t border-slate-100 shrink-0 flex justify-end">
                        <Button variant="ghost" onClick={() => setPortfolioCustomer(null)} className="h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground">PENCEREYİ KAPAT</Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <VeresiyePaymentSummaryModal
                paymentSummary={paymentSummary}
                onClose={() => setPaymentSummary(null)}
                isPending={isPending}
                onPrintReceipt={async () => {
                    if (paymentSummary) {
                        startTransition(async () => {
                            const res = await getCustomerStatement(paymentSummary.customerId);
                            if (res.success) {
                                setNeedsRefresh(true);
                                const cust = (aggregatedData as any).find((d: any) => d.customerId === paymentSummary.customerId);
                                if (cust) {
                                    setReceiptCustomer({
                                        id: cust.customerId || cust.id,
                                        name: cust.name,
                                        phone: cust.phone || ""
                                    });
                                    const mergedDebts = [
                                        ...(res.debts || []).map((d: any) => ({ ...d, type: "DEBT" })),
                                        ...(res.transactions || []).map((t: any) => ({
                                            ...t,
                                            type: "PAYMENT",
                                            amount: t.amount,
                                            createdAt: t.createdAt,
                                            description: t.description || "Tahsilat"
                                        }))
                                    ];
                                    setReceiptDebts(mergedDebts);
                                    setReceiptShowPaid(true);
                                }
                            }
                            setPaymentSummary(null);
                        });
                    }
                }}
            />

            {/* --- WhatsApp Confirm Modal --- */}
            {
                whatsappCustomer && (
                    <WhatsAppConfirmModal
                        isOpen={whatsappModalOpen}
                        onClose={() => {
                            setWhatsappModalOpen(false);
                            setWhatsappCustomer(null);
                        }}
                        phone={whatsappCustomer.phone || ""}
                        customerName={whatsappCustomer.name}
                        initialMessage={whatsappMessageContent}
                    />
                )
            }
            {/* --- Stats Detail Modal --- */}
            <AlertDialog open={statsModalOpen} onOpenChange={(o) => {
                setStatsModalOpen(o);
                if (!o) {
                    setStatsSearchQuery("");
                    setStatsDates({});
                }
            }}>
                <AlertDialogContent className="max-w-[1000px] w-[95vw] bg-white/95 dark:bg-zinc-900/90 backdrop-blur-3xl rounded-[3rem] p-0 overflow-hidden shadow-[0_50px_200px_-50px_rgba(0,0,0,0.4)] border-border/50 border flex flex-col h-[90vh]">
                    {/* Header Section */}
                    <div className="bg-indigo-600 dark:bg-indigo-700 p-6 md:p-8 text-white relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <History className="w-48 h-48 rotate-12" />
                        </div>

                        <div className="flex justify-between items-start relative z-10 mb-6">
                            <div className="space-y-1">
                                <AlertDialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        {statsModalType === 'COLLECTED' ? <Wallet className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                    </div>
                                    {statsModalType === 'RECEIVABLE_TRY' && "TL Alacakları"}
                                    {statsModalType === 'RECEIVABLE_USD' && "USD Alacakları"}
                                    {statsModalType === 'OVERDUE' && "Vadesi Geçenler"}
                                    {statsModalType === 'COLLECTED' && "Tahsilat Detayları"}
                                </AlertDialogTitle>
                                <p className="text-indigo-100/80 text-sm font-medium tracking-wide">
                                    {statsModalData.length} Kayıt Listeleniyor • Detaylı Döküm ve Analiz
                                </p>
                            </div>
                            <Button variant="ghost" onClick={() => setStatsModalOpen(false)} className="text-white hover:bg-white/10 rounded-2xl h-10 w-10 p-0 flex items-center justify-center font-bold text-2xl transition-all active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                        </div>

                        {/* Controls Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end relative z-10">
                            {/* Search */}
                            <div className="md:col-span-5 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 ml-1">Kayıtlarda Ara</Label>
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
                                    <Input
                                        placeholder="Müşteri adı veya açıklama ile ara..."
                                        value={statsSearchQuery}
                                        onChange={(e) => setStatsSearchQuery(e.target.value)}
                                        className="h-12 pl-10 pr-4 bg-white/10 border-white/10 text-white placeholder:text-white/30 rounded-2xl focus:ring-2 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Date Picker Range */}
                            <div className="md:col-span-1 border-white/10 h-10 hidden md:block" /> {/* Spacer */}

                            <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 ml-1">Başlangıç</Label>
                                    <Input
                                        type="date"
                                        value={statsDates.start || ''}
                                        onChange={(e) => setStatsDates(d => ({ ...d, start: e.target.value }))}
                                        className="bg-white/10 border-white/10 text-white h-12 rounded-2xl focus:ring-2 focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 ml-1">Bitiş</Label>
                                    <Input
                                        type="date"
                                        value={statsDates.end || ''}
                                        onChange={(e) => setStatsDates(d => ({ ...d, end: e.target.value }))}
                                        className="bg-white/10 border-white/10 text-white h-12 rounded-2xl focus:ring-2 focus:ring-white/20"
                                    />
                                </div>
                            </div>

                            {/* View Toggle */}
                            <div className="md:col-span-2 flex items-center justify-end gap-2 pb-1">
                                <div className="bg-white/10 p-1.5 rounded-2xl flex gap-1 backdrop-blur-md">
                                    <button
                                        onClick={() => setStatsViewMode('list')}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                            statsViewMode === 'list' ? "bg-white text-indigo-600 shadow-xl" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setStatsViewMode('grid')}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                            statsViewMode === 'grid' ? "bg-white text-indigo-600 shadow-xl" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-[#1a2231]/30 scrollbar-hide">
                        {statsIsLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Veriler İşleniyor...</span>
                            </div>
                        ) : statsModalData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-5 opacity-40">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                                    <Search className="w-10 h-10 text-slate-400 dark:text-zinc-500" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-sm font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Kayıt Bulunamadı</h4>
                                    <p className="text-xs font-medium text-slate-400 mt-1">Farklı bir tarih veya arama terimi deneyin.</p>
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                "gap-3 md:gap-4",
                                statsViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col"
                            )}>
                                {statsModalData.map((item: any, idx: number) => {
                                    const isIncome = statsModalType === 'COLLECTED' || item.type === 'INCOME';
                                    const amount = item.remainingAmount !== undefined ? getSafeDebtRemaining(item) : Number(item.amount || 0);

                                    return (
                                        <div key={idx} className={cn(
                                            "group flex items-center gap-3 p-2 md:p-2.5 bg-white/40 dark:bg-[#1a2231]/40 border border-border/40 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 rounded-[1.5rem] transition-all cursor-default relative overflow-hidden",
                                            statsViewMode === 'grid' ? "w-full" : ""
                                        )}>
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20">
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                                    {item.customer?.name?.[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[11px] font-black text-foreground truncate uppercase tracking-tight">{item.customer?.name}</span>
                                                    {item.paymentMethod && (
                                                        <Badge variant="secondary" className="text-[6px] h-3 px-1 font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-500 border-none">
                                                            {item.paymentMethod}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-bold text-muted-foreground/60 flex items-center gap-1 shrink-0">
                                                        {format(new Date(item.createdAt), "dd.MM.yy", { locale: tr })}
                                                    </span>
                                                    <div className="w-0.5 h-0.5 rounded-full bg-border" />
                                                    <span className="text-[8px] font-medium text-muted-foreground/50 truncate max-w-[150px] italic">
                                                        {item.description || item.notes || "İşlem"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 pr-1">
                                                {/* Action Buttons - Now side by side with amount in a flex container */}
                                                {statsModalType === 'COLLECTED' && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                        <Button
                                                            variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                            onClick={(e) => { e.stopPropagation(); setEditingTransaction(item); setEditTxAmount(item.amount.toString()); setEditTxNotes(item.description || ""); }}
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(item.id); }}
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="text-right">
                                                    <span className={cn(
                                                        "text-xs font-black tabular-nums tracking-tighter",
                                                        isIncome ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {item.currency === 'USD' ? '$' : '₺'}{amount.toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer / Summary Info */}
                    <div className="p-6 md:p-8 border-t border-border/50 bg-white dark:bg-[#0f172a] flex flex-wrap items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Toplam Kayıt</span>
                                <span className="text-xl font-black text-foreground">{statsModalData.length} Adet</span>
                            </div>
                            <div className="w-px h-10 bg-border/50" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Dönem Toplamı (TRY)</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    ₺{statsModalData.reduce((acc: number, curr: any) => acc + (curr.currency === 'USD' ? 0 : (curr.remainingAmount !== undefined ? getSafeDebtRemaining(curr) : Number(curr.amount))), 0).toLocaleString('tr-TR')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    // Excel Export for stats
                                    const XLSX = await import("xlsx");
                                    const data = statsModalData.map((item: any) => ({
                                        Müşteri: item.customer?.name,
                                        Tarih: format(new Date(item.createdAt), "dd.MM.yyyy HH:mm"),
                                        İşlem: item.description || item.notes || "-",
                                        ÖdemeYöntemi: item.paymentMethod || "-",
                                        Tutar: item.amount || 0,
                                        Döviz: item.currency || "TRY"
                                    }));
                                    const ws = XLSX.utils.json_to_sheet(data);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Detayli_Liste");
                                    XLSX.writeFile(wb, `Filtrelenmiş_Döküm_${format(new Date(), "dd_MM_yyyy")}.xlsx`);
                                }}
                                className="h-12 px-6 rounded-2xl border-border text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-muted"
                            >
                                <Download className="w-4 h-4" /> Excel
                            </Button>
                            <Button
                                onClick={() => setStatsModalOpen(false)}
                                className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                Kapat
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent >
            </AlertDialog >

            {/* Borç Fişi Modal */}
            {
                receiptCustomer && (
                    <DebtReceiptModal
                        open={!!receiptCustomer}
                        onClose={() => { setReceiptCustomer(null); setReceiptDebts([]); setReceiptShowPaid(false); }}
                        customer={{ name: receiptCustomer.name, phone: receiptCustomer.phone, id: receiptCustomer.customerId }}
                        debts={receiptDebts}
                        shopName={receiptSettings?.title || shop?.name}
                        shopPhone={receiptSettings?.phone || shop?.phone}
                        rates={rates as any}
                        initialShowPaid={receiptShowPaid}
                        logoUrl={receiptSettings?.logoUrl}
                    />
                )
            }
            <AlertDialog open={bulkWhatsAppModalOpen} onOpenChange={setBulkWhatsAppModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplu WhatsApp Mesajı</AlertDialogTitle>
                        <AlertDialogDescription>
                            Aşağıdaki {bulkCustomersToSend.length} müşteriye ayrı ayrı güncel hesap ekstremeleri oluşturulacak ve WhatsApp pencereleri açılacaktır. Onaylıyor musunuz?
                            <div className="mt-4 max-h-40 overflow-y-auto w-full p-2 bg-slate-50 border rounded-md text-slate-800 text-sm">
                                <ul className="list-disc list-inside">
                                    {bulkCustomersToSend.map(c => (
                                        <li key={c.customerId}>{c.name} ({c.phone})</li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleConfirmBulkWhatsApp}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Mesajları Aç
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AddReturnModal
                open={bulkReturnModalOpen}
                onOpenChange={setBulkReturnModalOpen}
                initialData={bulkReturnInitialData}
                onSuccess={() => {
                    invalidateReceivables();
                    setSelectedDebtIds([]);
                }}
            />
        </div>
    );
}

