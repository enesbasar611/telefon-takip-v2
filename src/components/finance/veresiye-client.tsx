"use client";

import React, { useState, useMemo, useTransition } from "react";
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
    PlusCircle,
    Pencil,
    Trash2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LayoutCustomizer } from "@/components/common/layout-customizer";

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

import { collectGlobalCustomerPayment, startTrackingDebt, getCustomerStatement, getDebtStatsDetails } from "@/lib/actions/debt-actions";
import { cn } from "@/lib/utils";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { AddDebtModal } from "./add-debt-modal";
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
    debts: any[];
    thisMonthCollected: number;
    accounts: any[];
    rates?: {
        usd: number;
        eur: number;
        ga: number;
        lastUpdate: Date;
    };
    settings?: any[];
}

export function VeresiyeClient({ debts, thisMonthCollected, accounts, rates, settings }: VeresiyeClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'tracking'>('all');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Payment States
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappCustomer, setWhatsappCustomer] = useState<any>(null);
    const [whatsappMessageContent, setWhatsappMessageContent] = useState<string>("");

    const filteredAccountsCount = (type: string) => accounts.filter(acc => acc.type === type).length;

    // New History & Portfolio Modals
    const [historyCustomer, setHistoryCustomer] = useState<any>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const historyItemsPerPage = 5;

    // Debt Edit State
    const [editingDebt, setEditingDebt] = useState<any>(null);
    const [editAmount, setEditAmount] = useState<string>("");

    // Stats Detail Modal State
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [statsModalType, setStatsModalType] = useState<'RECEIVABLE_TRY' | 'RECEIVABLE_USD' | 'OVERDUE' | 'COLLECTED' | null>(null);
    const [statsModalData, setStatsModalData] = useState<any[]>([]);
    const [statsIsLoading, setStatsIsLoading] = useState(false);
    const [statsDates, setStatsDates] = useState<{ start?: string; end?: string }>({});
    const [editNotes, setEditNotes] = useState<string>("");
    const [editCurrency, setEditCurrency] = useState<string>("TRY");


    const [portfolioCustomer, setPortfolioCustomer] = useState<any>(null);
    const [portfolioData, setPortfolioData] = useState<{ tickets: any[], sales: any[], debts: any[] }>({ tickets: [], sales: [], debts: [] });

    // Global Payment State
    const [paymentCustomer, setPaymentCustomer] = useState<any>(null);
    const [paymentCurrency, setPaymentCurrency] = useState<"TRY" | "USD">("TRY");

    // Tracking Modal State
    const [trackingDebt, setTrackingDebt] = useState<Debt | null>(null);
    const [trackingDate, setTrackingDate] = useState("");

    // Multi-select State for History
    const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);

    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

    const [paymentSummary, setPaymentSummary] = useState<{
        customerName: string;
        items: string[];
        paidAmount: number;
        currency: string;
        remainingTRY: number;
        remainingUSD: number;
    } | null>(null);

    const [statementData, setStatementData] = useState<{
        debts: any[];
        transactions: any[];
    } | null>(null);

    // Layout visibility checks
    const isAnalysisHidden = settings?.find(s => s.key === "layout_hidden_veresiye_analysis")?.value === "true";

    const fetchStatsDetails = async () => {
        if (!statsModalType) return;
        setStatsIsLoading(true);
        try {
            const res = await getDebtStatsDetails({
                type: statsModalType,
                startDate: statsDates.start ? new Date(statsDates.start) : undefined,
                endDate: statsDates.end ? new Date(statsDates.end) : undefined
            });
            if (res.success) {
                setStatsModalData(res.data || []);
            } else {
                toast.error(res.error || "Veriler alınamadı");
            }
        } catch (error) {
            console.error(error);
            toast.error("Beklenmedik bir hata oluştu");
        } finally {
            setStatsIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (statsModalOpen && statsModalType) {
            fetchStatsDetails();
        }
    }, [statsModalOpen, statsModalType, statsDates]);

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
            lastActivity: Date;
            totalRemainingTRY: number;
            totalRemainingUSD: number;
            debtCount: number;
            debtItems: any[];
        }> = {};

        debts.forEach(debt => {
            if (debt.isPaid) return;
            const customerId = debt.customer.id;
            if (!groups[customerId]) {
                groups[customerId] = {
                    customerId,
                    name: debt.customer.name,
                    phone: debt.customer.phone,
                    lastActivity: new Date(debt.createdAt),
                    totalRemainingTRY: 0,
                    totalRemainingUSD: 0,
                    debtCount: 0,
                    debtItems: []
                };
            }

            const amount = Number(debt.remainingAmount);
            if (debt.currency === 'USD') groups[customerId].totalRemainingUSD += amount;
            else groups[customerId].totalRemainingTRY += amount;

            groups[customerId].debtCount++;
            groups[customerId].debtItems.push(debt);
            if (new Date(debt.createdAt) > groups[customerId].lastActivity) {
                groups[customerId].lastActivity = new Date(debt.createdAt);
            }
        });

        let filtered = Object.values(groups);

        // Arama Filtresi
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(lowSearch) ||
                (item.phone && item.phone.includes(lowSearch))
            );
        }

        // Durum Filtresi
        if (filterStatus === 'pending') {
            // Sadece bekleyenler (isPaid: false zaten yukarda filtrelenmişti)
        } else if (filterStatus === 'overdue') {
            filtered = filtered.filter(item =>
                item.debtItems.some((d: any) => d.dueDate && new Date(d.dueDate) < now)
            );
        } else if (filterStatus === 'tracking') {
            filtered = filtered.filter(item =>
                item.debtItems.some((d: any) => d.isTracking)
            );
        }

        return filtered.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }, [debts, searchTerm, filterStatus, now]);

    const totalReceivableTRY = useMemo(() =>
        debts.filter(d => !d.isPaid && (!d.currency || d.currency === 'TRY')).reduce((sum, d) => sum + Number(d.remainingAmount), 0),
        [debts]);

    const totalReceivableUSD = useMemo(() =>
        debts.filter(d => !d.isPaid && d.currency === 'USD').reduce((sum, d) => sum + Number(d.remainingAmount), 0),
        [debts]);

    const totalOverdue = useMemo(() =>
        debts.filter(d => !d.isPaid && d.dueDate && new Date(d.dueDate) < now)
            .reduce((sum, d) => sum + Number(d.remainingAmount), 0),
        [debts, now]);

    const activeDebtorCount = new Set(debts.filter(d => !d.isPaid).map(d => d.customer.id)).size;

    const statsData = [
        {
            type: 'RECEIVABLE_TRY' as const,
            title: "Toplam Alacak (TL)",
            value: `₺${totalReceivableTRY.toLocaleString('tr-TR')}`,
            subValue: `${activeDebtorCount} Aktif Müşteri`,
            icon: CreditCard,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            type: 'RECEIVABLE_USD' as const,
            title: "Toplam Alacak (USD)",
            value: `$${totalReceivableUSD.toLocaleString('tr-TR')}`,
            subValue: `~₺${Math.round(totalReceivableUSD * (rates?.usd || 32.5)).toLocaleString('tr-TR')}`,
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            type: 'OVERDUE' as const,
            title: "Vadesi Geçen",
            value: `₺${totalOverdue.toLocaleString('tr-TR')}`,
            subValue: "Kritik Alacaklar",
            icon: AlertCircle,
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        },
        {
            type: 'COLLECTED' as const,
            title: "Bu Ay Tahsilat",
            value: `₺${thisMonthCollected.toLocaleString('tr-TR')}`,
            subValue: "Tahsil Edilen Tutar",
            icon: CheckCircle2,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        }
    ];

    // 3. Aging Analysis (0-30, 31-60, 60+ Days)

    // 3. Aging Analysis (0-30, 31-60, 60+ Days)
    const aging = useMemo(() => {
        let g1 = 0, g2 = 0, g3 = 0;
        debts.filter(d => !d.isPaid).forEach(d => {
            const days = (now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            const amt = Number(d.remainingAmount);
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
    }, [debts, now]);

    // --- Actions ---
    const handleCurrencySwitch = (newCurrency: "TRY" | "USD") => {
        if (paymentCurrency === newCurrency) return;

        const usdRate = rates?.usd || 32.5;
        const currentAmount = Number(paymentAmount) || 0;

        let converted = 0;
        if (newCurrency === "USD" && paymentCurrency === "TRY") {
            converted = currentAmount / usdRate;
        } else if (newCurrency === "TRY" && paymentCurrency === "USD") {
            converted = currentAmount * usdRate;
        }

        setPaymentCurrency(newCurrency);
        if (converted > 0) {
            setPaymentAmount(String(parseFloat(converted.toFixed(2))));
        } else {
            setPaymentAmount("");
        }
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
            const res = await collectGlobalCustomerPayment(
                paymentCustomer.customerId,
                amount,
                paymentCurrency,
                paymentMethod,
                selectedAccountId || undefined,
                rates?.usd || 32.5,
                paymentNotes,
                selectedDebtIds
            );

            if (res.success) {
                toast.success("Ödeme başarıyla tahsil edildi.");

                // Trigger whatsapp receipt if customer has phone
                if (paymentCustomer.phone) {
                    setWhatsappCustomer(paymentCustomer);
                    const paidText = paymentCurrency === "USD" ? `$${amount.toLocaleString('tr-TR')}` : `₺${amount.toLocaleString('tr-TR')}`;
                    let msg = `Merhaba ${paymentCustomer.name},\n\n`;
                    msg += `${paidText} tutarındaki ödemeniz (Tahsilat) başarıyla alınmış ve açık hesabınızdan düşülmüştür.\n`;
                    if (paymentNotes) {
                        msg += `Açıklama: ${paymentNotes}\n`;
                    }

                    msg += `\n*Güncel Kalan Bakiyeniz:*\n`;
                    if (res.remainingTRY && Number(res.remainingTRY) > 0) msg += `TL: ₺${Number(res.remainingTRY).toLocaleString('tr-TR')}\n`;
                    if (res.remainingUSD && Number(res.remainingUSD) > 0) msg += `Dolar: $${Number(res.remainingUSD).toLocaleString('tr-TR')}\n`;
                    if ((!res.remainingTRY || Number(res.remainingTRY) <= 0) && (!res.remainingUSD || Number(res.remainingUSD) <= 0)) {
                        msg += `Tüm borçlarınız kapanmıştır. (Bakiye: 0)\n`;
                    }
                    msg += `\nBizi tercih ettiğiniz için teşekkür ederiz. İyi çalışmalar.`;

                    setWhatsappMessageContent(msg);
                    setWhatsappModalOpen(true);
                }

                // Prepare and show summary modal
                const itemsNames = selectedDebtIds.length > 0
                    ? paymentCustomer?.debtItems.filter((d: any) => selectedDebtIds.includes(d.id)).map((d: any) => d.notes || "İsimsiz Borç")
                    : ["Genel Tahsilat"];

                setPaymentSummary({
                    customerName: paymentCustomer.name,
                    items: itemsNames,
                    paidAmount: amount,
                    currency: paymentCurrency,
                    remainingTRY: res.remainingTRY || 0,
                    remainingUSD: res.remainingUSD || 0
                });

                setPaymentCustomer(null);
                setPaymentAmount("");
                setPaymentNotes("");
                setPaymentMethod("CASH");
                setSelectedAccountId("");
                setSelectedDebtIds([]); // Reset selection after payment
                router.refresh();
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
            if (res.success) {
                toast.success("Borç kaydı başarıyla silindi.");
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
                if (historyCustomer) {
                    const updatedItems = historyCustomer.debtItems.map((d: any) => d.id === editingDebt.id ? res.debt : d);
                    setHistoryCustomer({ ...historyCustomer, debtItems: updatedItems });
                }
                setEditingDebt(null);
                router.refresh();
            } else {
                toast.error(res.error || "Borç güncellenemedi.");
            }
        });
    };

    const handleFetchPortfolio = async (customerId: string) => {
        const { getCustomerById } = await import("@/lib/actions/customer-actions");
        const fullInfo = await getCustomerById(customerId);
        if (fullInfo) {
            setPortfolioData({
                tickets: fullInfo.tickets || [],
                sales: fullInfo.sales || [],
                debts: fullInfo.debts || []
            });
        }
    };

    const handleStartTracking = async () => {
        if (!trackingDebt || !trackingDate) return;

        startTransition(async () => {
            const res = await startTrackingDebt(trackingDebt.id, new Date(trackingDate));
            if (res.success) {
                toast.success("Takip başarıyla başlatıldı.");
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

            let message = `*${customer.name} - GÜNCEL HESAP EKSTRESİ*\n\n`;
            message += `_Aşağıda dükkanımıza olan borçlarınız ve yaptığınız ödemelerin detaylı dökümü bulunmaktadır:_\n\n`;

            const combined = [
                ...(res.debts || []).map((d: any) => ({
                    date: new Date(d.createdAt),
                    text: `🔴 Borç: ${d.notes || 'Hizmet/Ürün'} - ${d.currency === 'USD' ? '$' : '₺'}${Number(d.amount).toLocaleString('tr-TR')} ${d.isPaid ? '(Ödendi)' : `(Kalan: ${d.currency === 'USD' ? '$' : '₺'}${Number(d.remainingAmount).toLocaleString('tr-TR')})`}`
                })),
                ...(res.transactions || []).map((t: any) => ({
                    date: new Date(t.createdAt),
                    text: `🟢 Ödeme: ${Number(t.amount).toLocaleString('tr-TR')} TL`
                }))
            ].sort((a, b) => a.date.getTime() - b.date.getTime());

            combined.forEach((item, index) => {
                const dateStr = item.date.toLocaleDateString('tr-TR');
                message += `${index + 1}. ${dateStr}\n   ${item.text}\n\n`;
            });

            message += `*--------------------------*\n`;
            message += `*TOPLAM GÜNCEL BORÇ:*\n`;
            if (customer.totalRemainingTRY > 0) message += `💰 TL: ₺${customer.totalRemainingTRY.toLocaleString('tr-TR')}\n`;
            if (customer.totalRemainingUSD > 0) message += `💰 Dolar: $${customer.totalRemainingUSD.toLocaleString('tr-TR')}\n`;

            if (customer.totalRemainingTRY <= 0 && customer.totalRemainingUSD <= 0) {
                message += `✅ Bakiyeniz tamamen kapanmıştır. Teşekkür ederiz.\n`;
            } else {
                message += `\n_En kısa sürede ödeme yapmanızı rica ederiz. İyi çalışmalar._`;
            }

            setWhatsappMessageContent(message);
            setWhatsappModalOpen(true);
            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error("Bağlantı hatası oluştu.", { id: toastId });
        }
    };

    const handleBulkWhatsAppReminders = async () => {
        if (selectedCustomerIds.length === 0) {
            toast.error("Lütfen en az bir müşteri seçin.");
            return;
        }

        const customersToSend = aggregatedData.filter(c => selectedCustomerIds.includes(c.customerId) && c.phone);

        if (customersToSend.length === 0) {
            toast.error("Seçilen müşterilerin telefon numarası bulunamadı.");
            return;
        }

        toast.info(`${customersToSend.length} müşteri için hatırlatma pencereleri açılıyor...`);

        // We can't really "bulk send" automatically without an API, but we can open them one by one or show a summary.
        // User asked for "toplu mesaj atma özelliği" - I'll implement a logic that iterates and prompts.
        for (const customer of customersToSend) {
            let msg = `*Borç Hatırlatması*\n\nMerhaba ${customer.name},\n\nDükkanımızda kayıtlı güncel borç bakiyeniz bulunmaktadır:\n`;
            if (customer.totalRemainingTRY > 0) msg += `- ₺${customer.totalRemainingTRY.toLocaleString('tr-TR')}\n`;
            if (customer.totalRemainingUSD > 0) msg += `- $${customer.totalRemainingUSD.toLocaleString('tr-TR')}\n`;
            msg += `\nÖdeme durumunuzu kontrol etmenizi rica ederiz. İyi çalışmalar.`;

            const encodedMsg = encodeURIComponent(msg);
            const url = `https://wa.me/90${(customer.phone ?? "").replace(/\D/g, '')}?text=${encodedMsg}`;
            window.open(url, '_blank');
        }

        setSelectedCustomerIds([]);
    };

    const exportToExcel = () => {
        const data = aggregatedData.map(item => ({
            Müşteri: item.name,
            Telefon: item.phone || "-",
            "Toplam Borç": item.totalRemainingTRY,
            "Son İşlem": format(item.lastActivity, "dd MMMM yyyy", { locale: tr })
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Veresiye Listesi");
        XLSX.writeFile(wb, "Veresiye_Listesi.xlsx");
    };

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
                            onClick={() => {
                                const data = aggregatedData.map(item => ({
                                    Müşteri: item.name,
                                    Telefon: item.phone || "-",
                                    "Borç (TL)": item.totalRemainingTRY,
                                    "Borç (USD)": item.totalRemainingUSD,
                                    "Son İşlem": format(item.lastActivity, "dd.MM.yyyy", { locale: tr })
                                }));
                                const ws = XLSX.utils.json_to_sheet(data);
                                const csv = XLSX.utils.sheet_to_csv(ws);
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", "Veresiye_Listesi.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {statsData.map((stat: any, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => {
                                setStatsModalType(stat.type);
                                setStatsModalOpen(true);
                            }}
                            className="cursor-pointer"
                        >
                            <Card className="border-none bg-muted/40 backdrop-blur-2xl shadow-xl shadow-black/5 overflow-hidden rounded-[2.5rem] group hover:bg-muted/50 transition-all duration-500 border border-border">
                                <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-2">
                                    <CardTitle className="text-[10px] font-black  uppercase tracking-[0.2em] text-muted-foreground/70">{stat.title}</CardTitle>
                                    <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter mb-1">{stat.value}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{stat.subValue}</p>
                                </CardContent>
                                <div className={cn("absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity", stat.bg)} />
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </LayoutCustomizer>

            {/* --- Main Section --- */}
            <div className={cn("grid grid-cols-1 gap-10", isAnalysisHidden ? "lg:grid-cols-1" : "lg:grid-cols-12")}>

                {/* Left Sidebar: Aging Analysis & Insights */}
                <LayoutCustomizer sectionKey="veresiye_analysis" settings={settings} onUpdate={() => router.refresh()} className="lg:col-span-3">
                    <div className="space-y-10">
                        <Card className="border-none bg-muted/30 backdrop-blur-3xl shadow-2xl shadow-black/5 overflow-hidden rounded-[2.5rem] border border-border">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="font-medium text-[10px]  uppercase flex items-center gap-4 text-muted-foreground/80">
                                    <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                                    ANALİZ MERKEZİ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 px-8 pb-10 pt-4">
                                {[
                                    { label: "0 - 30 GÜNLÜK", amount: aging['0-30'].amount, percent: aging['0-30'].percentage, color: "indigo" },
                                    { label: "31 - 60 GÜNLÜK", amount: aging['31-60'].amount, percent: aging['31-60'].percentage, color: "amber" },
                                    { label: "60 GÜN+ KRİTİK", amount: aging['60+'].amount, percent: aging['60+'].percentage, color: "rose" }
                                ].map((g, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px]  text-muted-foreground/80 uppercase">{g.label}</span>
                                            <span className={cn("text-xs  tabular-nums", `text-${g.color}-500 px-3 py-1 rounded-full bg-${g.color}-500/10 border border-${g.color}-500/10`)}>₺{g.amount.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${g.percent}%` }}
                                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 + (i * 0.2) }}
                                                className={cn("h-full rounded-full relative overflow-hidden", `bg-${g.color}-500`)}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}

                                <div className="p-6 bg-muted/20 rounded-[1.5rem] border border-border relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-500">
                                    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 dark:opacity-5 transition-all duration-700">
                                        <AlertCircle className="w-24 h-24 text-indigo-500 -rotate-12" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground  italic leading-relaxed relative z-10 antialiased">
                                        "{aging['60+'].percentage > 30 ? 'Dikkat seviyesi yüksek! Ödeme süresi geciken alacaklar nakit akışını zorlayabilir. ' : 'Portföy sağlığı stabil. 60 gün üzeri alacak payınız güvenli baremde. '} Mevcut risk oranı: %{Math.round(aging['60+'].percentage)}"
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Insight Card: Futuristic */}
                        <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Card className="border-none bg-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.3)] text-white overflow-hidden rounded-[2.5rem] relative group cursor-pointer border border-border/50">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125">
                                    <CalendarClock className="w-32 h-32 rotate-12" />
                                </div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                                <CardHeader className="px-8 pt-10 pb-4">
                                    <CardTitle className="font-medium text-[10px]  uppercase flex items-center gap-3 opacity-90">
                                        <TrendingDown className="w-4 h-4" />
                                        AI PROJEKSİYON
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-8 pb-12 pt-2">
                                    <h3 className="font-medium text-2xl  leading-tight mb-4 uppercase">Ay Sonu Tahsilat Öngörüsü</h3>
                                    <p className="text-sm  leading-relaxed opacity-80 antialiased">
                                        Algoritmik analiz, toplam alacaklarınızın <span className="underline decoration-white/40 underline-offset-8">%{Math.max(10, 100 - Math.round(aging['60+'].percentage))}</span>'lik kısmının mevcut tahsilat ivmesiyle bu dönem içinde kasaya gireceğini öngörüyor.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </LayoutCustomizer>

                {/* Right: Premium Customer Table */}
                <LayoutCustomizer sectionKey="veresiye_table" settings={settings} onUpdate={() => router.refresh()} className={cn(isAnalysisHidden ? "lg:col-span-12" : "lg:col-span-9")}>
                    <div className="space-y-8">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 px-2">
                            <div className="space-y-2">
                                <h2 className="font-medium text-3xl text-foreground uppercase">Müşteri Portföyü</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px]  text-muted-foreground/80 opacity-80">Aktif alacaklar ve cari hareketler listesi</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto mt-2">
                                <div className="relative group flex-1 md:flex-none md:w-80">
                                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 group-focus-within:text-indigo-400 transition-colors z-20" />
                                    <Input
                                        placeholder="İsim veya telefon numarası..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-14 h-14 bg-muted/50 border-border shadow-2xl rounded-2xl focus-visible:ring-indigo-500/20 focus-visible:bg-muted transition-all text-sm text-foreground relative z-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <Card className="bg-muted/20 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-border relative z-10 min-h-[600px]">
                            <div className={cn("transition-all duration-500 flex flex-col h-full", isPending ? "opacity-30 blur-md grayscale pointer-events-none scale-[0.99]" : "opacity-100 blur-0 grayscale-0 scale-100")}>
                                <div className="flex flex-col">
                                    <AnimatePresence mode="popLayout">
                                        {aggregatedData.map((item, idx) => (
                                            <React.Fragment key={item.customerId}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    onClick={async () => {
                                                        setHistoryCustomer(item);
                                                        setHistoryPage(1);
                                                        setSelectedDebtIds([]);
                                                        setStatementData(null);
                                                        try {
                                                            const res = await getCustomerStatement(item.customerId);
                                                            if (res.success) {
                                                                setStatementData({
                                                                    debts: res.debts || [],
                                                                    transactions: res.transactions || []
                                                                });
                                                            } else {
                                                                toast.error(res.error || "Geçmiş verileri alınamadı.");
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            toast.error("Bağlantı hatası: Geçmiş verileri yüklenemedi.");
                                                        }
                                                    }}
                                                    className={cn(
                                                        "group relative p-3 md:px-6 py-2 md:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-all",
                                                        selectedCustomerIds.includes(item.customerId) && "bg-indigo-500/[0.03] dark:bg-indigo-500/10",
                                                        idx !== aggregatedData.length - 1 && "border-b border-border/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-6 min-w-0 flex-1">
                                                        <div className="shrink-0 relative flex items-center gap-4">
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCustomerIds(prev =>
                                                                        prev.includes(item.customerId)
                                                                            ? prev.filter(id => id !== item.customerId)
                                                                            : [...prev, item.customerId]
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                                                                    selectedCustomerIds.includes(item.customerId)
                                                                        ? "bg-indigo-500 border-indigo-500 shadow-md"
                                                                        : "border-border bg-card group-hover:border-indigo-500/50"
                                                                )}
                                                            >
                                                                {selectedCustomerIds.includes(item.customerId) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPortfolioCustomer(item);
                                                                    handleFetchPortfolio(item.customerId);
                                                                }}
                                                                className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-110 active:scale-95 transition-all cursor-pointer border border-indigo-500/5"
                                                            >
                                                                <User className="w-4 h-4 md:w-5 md:h-5" />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-bold text-sm md:text-base text-foreground tracking-tight truncate">{item.name}</h3>
                                                                <div className="flex gap-1.5 shrink-0">
                                                                    {item.totalRemainingTRY > 0 && <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded-full uppercase tracking-tighter border border-emerald-500/20">TL</span>}
                                                                    {item.totalRemainingUSD > 0 && <span className="px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[9px] font-black rounded-full uppercase tracking-tighter border border-blue-500/20">USD</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 opacity-80">
                                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                    <Phone className="w-3 h-3 text-muted-foreground/70" /> {item.phone || 'Sayı Yok'}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                    <Calendar className="w-3 h-3 text-muted-foreground/70" /> {new Date(item.lastActivity).toLocaleDateString('tr-TR')} <span className="opacity-40 text-[10px]">{new Date(item.lastActivity).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </span>
                                                                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                                                                    {item.debtCount} KALEM
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 md:min-w-[120px]">
                                                        <div className="flex flex-col items-end">
                                                            {item.totalRemainingTRY > 0 && (
                                                                <span className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tighter">
                                                                    ₺{item.totalRemainingTRY.toLocaleString('tr-TR')}
                                                                </span>
                                                            )}
                                                            {item.totalRemainingUSD > 0 && (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-sm md:text-base font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter opacity-80">
                                                                        ${item.totalRemainingUSD.toLocaleString('tr-TR')}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                                                        ~₺{Math.round(item.totalRemainingUSD * (rates?.usd || 32.5)).toLocaleString('tr-TR')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!item.phone) {
                                                                        toast.error("Bu müşteriye ait bir telefon numarası bulunmuyor. Lütfen düzenleyerek ekleyin.");
                                                                        return;
                                                                    }
                                                                    handleWhatsAppMessage(item);
                                                                }}
                                                                title="WhatsApp'tan Ekstre Gönder"
                                                                className="h-9 w-9 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/10 transition-all p-0 flex shrink-0"
                                                            >
                                                                <MessageCircle className="w-5 h-5" />
                                                            </Button>
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <AddDebtModal rates={rates} initialData={{ name: item.name, phone: item.phone || "" }}>
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/10 transition-all p-0 flex shrink-0"
                                                                    >
                                                                        <PlusCircle className="w-5 h-5" />
                                                                    </Button>
                                                                </AddDebtModal>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPaymentCustomer(item);
                                                                    setPaymentCurrency("TRY");
                                                                    setPaymentAmount(String(item.totalRemainingTRY + (item.totalRemainingUSD * (rates?.usd || 32.5))));
                                                                }}
                                                                className="h-9 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 px-4 text-[9px] uppercase font-bold tracking-widest transition-all shadow-lg shadow-emerald-500/10"
                                                            >
                                                                Ödeme Al
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <ChevronDown className="w-5 h-5 text-muted-foreground/30 -rotate-90" />
                                                    </div>
                                                </motion.div>
                                            </React.Fragment>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {aggregatedData.length === 0 && !isPending && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-40 gap-8 grayscale opacity-40">
                                        <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center border border-border/50 shadow-2xl">
                                            <CheckCircle2 className="w-14 h-14 text-muted-foreground/80" />
                                        </div>
                                        <div className="text-center space-y-3 px-6">
                                            <h3 className="font-medium text-2xl text-foreground uppercase">Borç Kaydı Yok</h3>
                                            <p className="text-[10px]  text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">Şu anda seçili filtrelere uygun herhangi bir alacak kaydı bulunmuyor.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Decoration */}
                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                        </Card>
                    </div>
                </LayoutCustomizer>
            </div>

            {/* --- Payment Dialogs --- */}
            < AlertDialog open={!!paymentCustomer} onOpenChange={(o) => { if (!o) { setPaymentCustomer(null); setPaymentAmount(""); setPaymentNotes(""); setPaymentMethod("CASH"); setSelectedAccountId(""); } }}>
                <AlertDialogContent className="fixed z-[100] w-full max-w-[95vw] md:max-w-[600px] h-auto max-h-[95vh] bg-card border border-border/50 p-0 overflow-hidden bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col transition-all duration-500">
                    {/* Header */}
                    <div className="p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 via-card to-card border-b border-border/50 relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.04]"><Wallet className="w-28 h-28 rotate-12" /></div>
                        <div className="md:hidden w-12 h-1 bg-border rounded-full mx-auto mb-4" />
                        <AlertDialogHeader className="relative z-10">
                            <AlertDialogTitle className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight">TAHSİLAT İŞLEMİ</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-sm font-medium pt-2 flex flex-wrap items-center gap-2">
                                <span className="font-bold text-foreground">{paymentCustomer?.name}</span> için ödeme •
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">₺{paymentCustomer?.totalRemainingTRY?.toLocaleString('tr-TR')}</span>
                                {paymentCustomer?.totalRemainingUSD > 0 && (
                                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold">
                                        ${paymentCustomer?.totalRemainingUSD?.toLocaleString('tr-TR')}
                                    </span>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 scrollbar-hide">
                        {/* Currency Switch */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME BİRİMİ</Label>
                            <div className="flex bg-muted/50 dark:bg-muted/30 p-1.5 rounded-2xl h-14 border border-border/50">
                                <button onClick={() => handleCurrencySwitch("TRY")} className={cn("flex-1 text-xs font-bold rounded-xl transition-all duration-200", paymentCurrency === "TRY" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}>TÜRK LİRASI (₺)</button>
                                <button onClick={() => handleCurrencySwitch("USD")} className={cn("flex-1 text-xs font-bold rounded-xl transition-all duration-200", paymentCurrency === "USD" ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}>DOLAR ($)</button>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME TUTARI</Label>
                            <div className="relative group overflow-hidden rounded-2xl bg-muted/30 dark:bg-muted/20 border-2 border-border/60 focus-within:border-emerald-500/40 transition-all">
                                <span className={cn(
                                    "absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black transition-all duration-300",
                                    paymentCurrency === "USD" ? "text-blue-500" : "text-emerald-500"
                                )}>{paymentCurrency === "USD" ? '$' : '₺'}</span>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-16 pr-8 h-20 bg-transparent border-none text-3xl font-black focus-visible:ring-0 tabular-nums text-foreground"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setPaymentAmount(String(paymentCurrency === 'TRY' ? (paymentCustomer?.totalRemainingTRY + (paymentCustomer?.totalRemainingUSD * (rates?.usd || 32.5))) : (paymentCustomer?.totalRemainingUSD + (paymentCustomer?.totalRemainingTRY / (rates?.usd || 32.5)))))}
                                        className="h-9 text-[9px] font-black text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-all uppercase tracking-wider"
                                    >
                                        BORCU KAPAT
                                    </Button>
                                </div>
                            </div>
                            {paymentCurrency === 'TRY' && paymentCustomer?.totalRemainingUSD > 0 && (
                                <p className="text-[10px] text-muted-foreground italic px-1">
                                    Not: Tutar önce TL borçlarına, artan kısım güncel kurdan ($1 = ₺{rates?.usd || 32.5}) çevrilerek Dolar borçlarına sayılır.
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">AÇIKLAMA (OPSİYONEL)</Label>
                            <Input
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Tahsilat için ek açıklama yazın..."
                                className="h-12 bg-muted/30 dark:bg-muted/20 border border-border/50 rounded-xl px-5 focus-visible:ring-1 focus-visible:ring-indigo-500/20 text-sm text-foreground placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME YÖNTEMİ</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'CASH', label: 'Nakit', icon: Wallet, desc: 'Nakit Kasa' },
                                    { id: 'CARD', label: 'Kart', icon: CreditCard, desc: 'POS / Banka' },
                                    { id: 'TRANSFER', label: 'Havale/EFT', icon: RefreshCcw, desc: 'Banka Hesabı' }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(method.id as any);
                                            const fa = accounts.filter(acc =>
                                                method.id === 'CASH' ? acc.type === 'CASH' :
                                                    method.id === 'CARD' ? (acc.type === 'POS' || acc.type === 'BANK') :
                                                        (acc.type === 'BANK')
                                            );
                                            if (fa.length > 0) setSelectedAccountId(fa[0].id);
                                            else setSelectedAccountId("");
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center h-[4.5rem] gap-1.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer",
                                            paymentMethod === method.id
                                                ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25 scale-[1.03]"
                                                : "bg-card border-border/60 text-muted-foreground hover:border-indigo-500/30 hover:bg-muted/30"
                                        )}
                                    >
                                        <method.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Account Selection */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={paymentMethod}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-3"
                            >
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                    {paymentMethod === 'CASH' ? 'KASA SEÇİMİ' : paymentMethod === 'CARD' ? 'POS / HESAP SEÇİMİ' : 'BANKA HESABI SEÇİMİ'}
                                </Label>
                                {(() => {
                                    const filteredAccounts = accounts.filter(acc =>
                                        paymentMethod === 'CASH' ? acc.type === 'CASH' :
                                            paymentMethod === 'CARD' ? (acc.type === 'POS' || acc.type === 'BANK') :
                                                (acc.type === 'BANK')
                                    );

                                    if (filteredAccounts.length === 0) {
                                        const isCash = paymentMethod === 'CASH';
                                        return (
                                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                                        {isCash ? 'NAKİT KASA BULUNAMADI' : 'BANKA / POS HESABI BULUNAMADI'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-medium text-amber-700/80 dark:text-amber-300/70 pl-6">
                                                    Tahsilat yapabilmek için Finans panelinden {isCash ? 'bir nakit kasa' : 'bir banka veya POS hesabı'} oluşturmalısınız.
                                                </p>
                                                {!isCash && (
                                                    <p className="text-[9px] italic text-amber-600/60 dark:text-amber-400/50 pl-6 mt-1">
                                                        * Havale/EFT işlemleri için en az bir banka hesabı gereklidir. Şimdilik sadece nakit kasa kullanabilirsiniz.
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {filteredAccounts.map(acc => (
                                                <button
                                                    key={acc.id}
                                                    type="button"
                                                    onClick={() => setSelectedAccountId(acc.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                                                        selectedAccountId === acc.id
                                                            ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/40 shadow-sm"
                                                            : "bg-card border-border/50 hover:border-border hover:bg-muted/20"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                        selectedAccountId === acc.id
                                                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/50 text-muted-foreground"
                                                    )}>
                                                        {acc.type === 'CASH' ? <Wallet className="w-5 h-5" /> : acc.type === 'POS' ? <CreditCard className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-sm font-bold truncate", selectedAccountId === acc.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>{acc.name}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{acc.type === 'CASH' ? 'Nakit Kasa' : acc.type === 'POS' ? 'POS Cihazı' : 'Banka Hesabı'}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs font-bold text-muted-foreground tabular-nums">₺{Number(acc.balance).toLocaleString('tr-TR')}</p>
                                                        <p className="text-[9px] text-muted-foreground/60">Bakiye</p>
                                                    </div>
                                                    {selectedAccountId === acc.id && (
                                                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-3 border-t border-border/50 bg-muted/5 shrink-0">
                        <AlertDialogCancel className="h-12 flex-1 rounded-2xl border border-border bg-card text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted/50 transition-all">Vazgeç</AlertDialogCancel>
                        <Button
                            onClick={handleCollectPayment}
                            disabled={isPending || !selectedAccountId}
                            className="h-12 flex-[2] rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tahsilatı Tamamla"}
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog >

            <AlertDialog open={!!historyCustomer} onOpenChange={(o) => { if (!o) { setHistoryCustomer(null); setStatementData(null); setSelectedDebtIds([]); } }}>
                <AlertDialogContent className="max-w-[800px] h-[85vh] bg-card rounded-[2.5rem] p-0 overflow-hidden flex flex-col shadow-2xl border border-border/50">
                    <div className="p-6 md:p-8 bg-muted/30 dark:bg-muted/10 border-b border-border/50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{historyCustomer?.name}</h3>
                                <p className="text-[10px] text-muted-foreground font-bold">{historyCustomer?.phone || "Telefon Yok"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    if (!statementData) { toast.error("Veriler yükleniyor, lütfen bekleyin..."); return; }
                                    const data = [
                                        ...statementData.debts.map(d => ({ Tarih: format(new Date(d.createdAt), "dd.MM.yyyy"), İşlem: d.notes || "Borç", Tip: "BORÇ", Tutar: d.amount, ParaBirim: d.currency, Durum: d.isPaid ? "Ödendi" : "Açık" })),
                                        ...statementData.transactions.map(t => ({ Tarih: format(new Date(t.createdAt), "dd.MM.yyyy"), İşlem: t.description || "Tahsilat", Tip: "TAHSİLAT", Tutar: t.amount, ParaBirim: "TRY", Durum: "-" }))
                                    ].sort((a, b) => new Date(b.Tarih).getTime() - new Date(a.Tarih).getTime());

                                    const ws = XLSX.utils.json_to_sheet(data);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Ekstre");
                                    XLSX.writeFile(wb, `${historyCustomer?.name}_Ekstre.xlsx`);
                                }}
                                variant="outline" className="rounded-xl h-10 px-4 text-[10px] font-bold border-border hover:bg-muted gap-2 text-foreground"
                            >
                                <Download className="w-3.5 h-3.5" /> EKSTRE (EXCEL)
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!statementData) { toast.error("Veriler yükleniyor, lütfen bekleyin..."); return; }
                                    let message = `*${historyCustomer?.name} - GÜNCEL HESAP EKSTRESİ*\n\n`;
                                    message += `_Aşağıda dükkanımıza olan borçlarınız ve yaptığınız ödemelerin detaylı dökümü bulunmaktadır:_\n\n`;

                                    const combined = [
                                        ...(statementData.debts || []).map((d: any) => ({
                                            date: new Date(d.createdAt),
                                            text: `🔴 Borç: ${d.notes || 'Hizmet/Ürün'} - ${d.currency === 'USD' ? '$' : '₺'}${Number(d.amount).toLocaleString('tr-TR')} ${d.isPaid ? '(Ödendi)' : `(Kalan: ${d.currency === 'USD' ? '$' : '₺'}${Number(d.remainingAmount).toLocaleString('tr-TR')})`}`
                                        })),
                                        ...(statementData.transactions || []).map((t: any) => ({
                                            date: new Date(t.createdAt),
                                            text: `🟢 Ödeme: ${Number(t.amount).toLocaleString('tr-TR')} TL`
                                        }))
                                    ].sort((a, b) => a.date.getTime() - b.date.getTime());

                                    combined.forEach((item, index) => {
                                        const dateStr = item.date.toLocaleDateString('tr-TR');
                                        message += `${index + 1}. ${dateStr}\n   ${item.text}\n\n`;
                                    });

                                    message += `*--------------------------*\n`;
                                    message += `*TOPLAM GÜNCEL BORÇ:*\n`;
                                    if (historyCustomer?.totalRemainingTRY > 0) message += `💰 TL: ₺${historyCustomer.totalRemainingTRY.toLocaleString('tr-TR')}\n`;
                                    if (historyCustomer?.totalRemainingUSD > 0) message += `💰 Dolar: $${historyCustomer.totalRemainingUSD.toLocaleString('tr-TR')}\n`;

                                    if (historyCustomer?.totalRemainingTRY <= 0 && historyCustomer?.totalRemainingUSD <= 0) {
                                        message += `✅ Bakiyeniz tamamen kapanmıştır. Teşekkür ederiz.\n`;
                                    } else {
                                        message += `\n_En kısa sürede ödeme yapmanızı rica ederiz. İyi çalışmalar._`;
                                    }

                                    setWhatsappMessageContent(message);
                                    setWhatsappCustomer(historyCustomer);
                                    setWhatsappModalOpen(true);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 px-4 text-[10px] font-bold gap-2"
                            >
                                <MessageCircle className="w-3.5 h-3.5" /> WHATSAPP EKSTRE
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setHistoryCustomer(null)} className="rounded-xl text-muted-foreground font-bold hover:bg-muted transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                        </div>
                    </div>
                    <div className="px-6 md:px-8 py-4 overflow-y-auto flex-1 space-y-2 scrollbar-hide">
                        {(() => {
                            const items = [
                                ...((historyCustomer as any)?.debtItems || []).map((d: any) => ({ ...d, listType: 'DEBT' })),
                                ...(statementData?.transactions || []).map((t: any) => ({ ...t, listType: 'PAYMENT' }))
                            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                            const isDataLoading = !statementData;

                            if (items.length === 0 && !isDataLoading) return <div className="text-center py-12 text-slate-400 font-bold uppercase text-[10px]">Veri Bulunamadı</div>;

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
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-foreground">{item.notes || "İsimsiz Borç"}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] text-muted-foreground">{format(new Date(item.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                            {Number(item.amount) !== Number(item.remainingAmount) && (
                                                                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded italic">
                                                                    Orijinal: {item.currency === 'USD' ? '$' : '₺'}{Number(item.amount).toLocaleString('tr-TR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{item.isPaid ? "ÖDENDİ" : "KALAN"}:</span>
                                                            <span className={cn("text-sm font-black tabular-nums", item.currency === 'USD' ? "text-blue-600" : "text-emerald-600")}>
                                                                {item.currency === 'USD' ? '$' : '₺'}{Number(item.remainingAmount).toLocaleString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!item.isPaid && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingDebt(item); setEditAmount(String(item.amount)); setEditNotes(item.notes || ""); setEditCurrency(item.currency || "TRY"); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-indigo-600 bg-muted hover:bg-muted/80 rounded-lg"><Pencil className="w-3 h-3" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteDebt(item.id); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 bg-muted hover:bg-muted/80 rounded-lg"><Trash2 className="w-3 h-3" /></Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={`tx-${item.id}`} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 transition-all border-dashed">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                                        <TrendingUp className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{item.description || "Tahsilat"}</span>
                                                        <span className="text-[9px] text-emerald-600/60 dark:text-emerald-400/60 font-medium">{format(new Date(item.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-emerald-600 tabular-nums">
                                                        + ₺{Number(item.amount).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </>
                            );
                        })()}
                    </div>
                    <div className="p-4 md:p-6 bg-muted/20 dark:bg-muted/10 border-t border-border/50 flex items-center justify-between shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SEÇİM</span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedDebtIds.length} Kalem Seçildi</span>
                        </div>
                        {selectedDebtIds.length > 0 && (
                            <Button
                                onClick={() => {
                                    // Sum selected amounts
                                    let sumTRY = 0;
                                    let sumUSD = 0;
                                    historyCustomer.debtItems.forEach((d: any) => {
                                        if (selectedDebtIds.includes(d.id)) {
                                            if (d.currency === 'USD') sumUSD += Number(d.remainingAmount);
                                            else sumTRY += Number(d.remainingAmount);
                                        }
                                    });

                                    setPaymentCustomer(historyCustomer);
                                    setPaymentCurrency("TRY");
                                    // Pre-fill with the total converted to TRY for easy payment
                                    setPaymentAmount(String((sumTRY + (sumUSD * (rates?.usd || 32.5))).toFixed(2)));
                                    setHistoryCustomer(null);
                                }}
                                className="h-11 px-6 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                Seçilenleri Öde
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setHistoryCustomer(null)} className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold text-muted-foreground">Kapat</Button>
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

            {/* --- Portfolio Modal --- */}
            <AlertDialog open={!!portfolioCustomer} onOpenChange={(o) => { if (!o) setPortfolioCustomer(null); }}>
                <AlertDialogContent className="max-w-[900px] h-[85vh] bg-white rounded-[3rem] p-0 overflow-hidden flex flex-col shadow-[0_50px_200px_-50px_rgba(0,0,0,0.5)] border-none">
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
                    </div>

                    <div className="p-10 overflow-y-auto flex-1 scrollbar-hide bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Stats Column */}
                            <div className="space-y-6">
                                <div className="p-8 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">TOPLAM ALACAK (₺ KARŞILIĞI)</span>
                                    </div>
                                    <span className="text-4xl font-black tabular-nums tracking-tighter">
                                        ₺{((portfolioCustomer?.totalRemainingTRY || 0) + ((portfolioCustomer?.totalRemainingUSD || 0) * (rates?.usd || 32.5))).toLocaleString('tr-TR')}
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
                                <div className="p-8 rounded-[2rem] bg-white border border-slate-200">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-2">SİSTEM HAREKETİ</span>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Satış</span><span className="text-xs font-black text-slate-900">{portfolioData.sales.length}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Teknik Servis</span><span className="text-xs font-black text-slate-900">{portfolioData.tickets.length}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Alacak Kaydı</span><span className="text-xs font-black text-slate-900">{portfolioData.debts.length}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Feed Column */}
                            <div className="md:col-span-2 space-y-8">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">SON İŞLEMLER</h4>
                                <div className="space-y-4">
                                    {[
                                        ...portfolioData.sales.map(s => ({ ...s, type: 'SALE', label: 'Satış İşlemi', amount: s.finalAmount || 0, formattedDate: new Date(s.createdAt) })),
                                        ...portfolioData.tickets.map(t => ({ ...t, type: 'TICKET', label: 'Teknik Servis', amount: t.actualCost || 0, formattedDate: new Date(t.createdAt) })),
                                        ...portfolioData.debts.map(d => ({ ...d, type: 'DEBT', label: 'Alacak Kaydı', amount: d.amount || 0, formattedDate: new Date(d.createdAt) }))
                                    ]
                                        .sort((a: any, b: any) => b.formattedDate.getTime() - a.formattedDate.getTime())
                                        .slice(0, 9)
                                        .map((item: any, i) => (
                                            <div key={i} className={cn("flex items-center gap-5 p-4 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all cursor-default", item.type === 'DEBT' && item.isPaid && "opacity-60")}>
                                                <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0",
                                                    item.type === 'SALE' ? "bg-indigo-100 text-indigo-600" :
                                                        item.type === 'TICKET' ? "bg-amber-100 text-amber-600" :
                                                            "bg-rose-100 text-rose-600"
                                                )}>
                                                    {item.type === 'SALE' ? <CreditCard className="w-5 h-5 md:w-6 md:h-6" /> : item.type === 'TICKET' ? <Phone className="w-5 h-5 md:w-6 md:h-6" /> : <FileText className="w-5 h-5 md:w-6 md:h-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="block text-[9px] font-black text-slate-400 uppercase">{item.label}</span>
                                                        {item.type === 'DEBT' && (
                                                            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", item.isPaid ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                                                {item.isPaid ? "ÖDENDİ" : "BEKLİYOR"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">{item.saleNumber || item.ticketNumber || item.deviceModel || item.notes || "Belirtilmemiş İşlem"}</span>
                                                    <span className="block text-[10px] text-slate-400 mt-0.5">{item.formattedDate.toLocaleDateString('tr-TR')}</span>
                                                </div>
                                                <div className="text-right shrink-0 flex flex-col items-end">
                                                    <span className="text-base md:text-lg font-black text-slate-900 tabular-nums">
                                                        {item.currency === 'USD' ? '$' : '₺'}{Number(item.amount).toLocaleString('tr-TR')}
                                                    </span>
                                                    {item.currency === 'USD' && (
                                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                                            ~₺{Math.round(Number(item.amount) * (rates?.usd || 32.5)).toLocaleString('tr-TR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 border-t border-slate-100 shrink-0 flex justify-end">
                        <Button variant="ghost" onClick={() => setPortfolioCustomer(null)} className="h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400">PENCEREYİ KAPAT</Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Payment Summary Confirmation Dialog --- */}
            <AlertDialog open={!!paymentSummary} onOpenChange={(o) => { if (!o) setPaymentSummary(null); }}>
                <AlertDialogContent className="max-w-[500px] bg-white rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none">
                    <div className="p-8 bg-emerald-500 text-white flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-1">
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Tahsilat Başarılı</AlertDialogTitle>
                            <p className="text-emerald-50 opacity-90 text-sm">Ödeme kaydı başarıyla oluşturuldu ve borçlardan düşüldü.</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ÖDEME YAPILAN KALEMLER</span>
                            <div className="space-y-1.5">
                                {paymentSummary?.items.map((it, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                        {it}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Tahsil Edilen</span>
                                <span className="text-lg font-black text-indigo-600 font-mono">
                                    {paymentSummary?.currency === 'USD' ? '$' : '₺'}{(paymentSummary?.paidAmount ?? 0).toLocaleString('tr-TR')}
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kalan Bakiye (TRY)</span>
                                <span className="text-lg font-black text-slate-900 font-mono">
                                    ₺{(paymentSummary?.remainingTRY ?? 0).toLocaleString('tr-TR')}
                                </span>
                            </div>
                        </div>

                        {(paymentSummary?.remainingUSD ?? 0) > 0 && (
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                <span className="block text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Kalan Bakiye (USD)</span>
                                <span className="text-lg font-black text-blue-600 font-mono">
                                    ${(paymentSummary?.remainingUSD ?? 0).toLocaleString('tr-TR')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <Button onClick={() => setPaymentSummary(null)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-xs">Tamam</Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

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
            <AlertDialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
                <AlertDialogContent className="max-w-[900px] w-[95vw] bg-white rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none flex flex-col max-h-[85vh]">
                    <div className="p-8 bg-indigo-600 text-white flex flex-col gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><History className="w-48 h-48 rotate-12" /></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    {statsModalType === 'RECEIVABLE_TRY' && "Türk Lirası Alacakları"}
                                    {statsModalType === 'RECEIVABLE_USD' && "Dolar Alacakları"}
                                    {statsModalType === 'OVERDUE' && "Vadesi Geçen Alacaklar"}
                                    {statsModalType === 'COLLECTED' && "Tahsilat Detayları"}
                                </AlertDialogTitle>
                                <p className="text-indigo-100 opacity-90 text-sm italic">Filtrelenmiş detaylı döküm ve analiz</p>
                            </div>
                            <Button variant="ghost" onClick={() => setStatsModalOpen(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0 flex items-center justify-center font-bold text-xl">×</Button>
                        </div>

                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm relative z-10">
                            <div className="flex-1 space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 pl-1">Başlangıç</span>
                                <Input
                                    type="date"
                                    value={statsDates.start || ''}
                                    onChange={(e) => setStatsDates(d => ({ ...d, start: e.target.value }))}
                                    className="bg-white/10 border-white/20 text-white h-10 rounded-xl"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 pl-1">Bitiş</span>
                                <Input
                                    type="date"
                                    value={statsDates.end || ''}
                                    onChange={(e) => setStatsDates(d => ({ ...d, end: e.target.value }))}
                                    className="bg-white/10 border-white/20 text-white h-10 rounded-xl"
                                />
                            </div>
                            <Button
                                onClick={fetchStatsDetails}
                                className="mt-5 bg-white text-indigo-600 hover:bg-indigo-50 h-10 rounded-xl px-6 font-bold text-xs uppercase"
                            >
                                Uygula
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
                        {statsIsLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-4">
                                <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Veriler Yükleniyor...</span>
                            </div>
                        ) : statsModalData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-40">
                                <Users className="w-12 h-12 text-slate-300" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kayıt Bulunamadı</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {statsModalData.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-slate-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 font-bold text-xs border border-slate-100">
                                                {item.customer?.name?.[0] || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{item.customer?.name || "Bilinmeyen Müşteri"}
                                                    {(statsModalType === 'COLLECTED') && <Badge variant="secondary" className="ml-2 text-[8px] px-1.5 h-4">{item.paymentMethod}</Badge>}
                                                </span>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                                                        <span className="opacity-40">{new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 italic font-medium">
                                                        {item.description || item.notes || "Alacak Kaydı"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 md:mt-0 justify-between md:justify-end border-t md:border-none pt-2 md:pt-0 border-slate-200">
                                            <div className="flex flex-col items-end">
                                                <span className={cn(
                                                    "text-lg font-black font-mono",
                                                    (statsModalType === 'COLLECTED' || item.type === 'INCOME') ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {item.currency === 'USD' ? '$' : '₺'}{Number(item.remainingAmount || item.amount).toLocaleString('tr-TR')}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {(statsModalType === 'COLLECTED' || item.type === 'INCOME') ? "Tahsil Edildi" : "Kalan Borç"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-slate-100 flex justify-end bg-slate-50 border-b">
                        <Button variant="ghost" onClick={() => setStatsModalOpen(false)} className="h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                            Kapat
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}

