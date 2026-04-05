"use client";

import { useState, useMemo, useTransition } from "react";
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
    Calendar
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import Link from "next/link";

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

import { collectDebtPayment, startTrackingDebt } from "@/lib/actions/debt-actions";
import { cn } from "@/lib/utils";
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
    createdAt: string;
    customer: { id: string; name: string; phone?: string; photo?: string };
};

interface VeresiyeClientProps {
    debts: Debt[];
    thisMonthCollected: number;
    accounts?: any[];
}

export function VeresiyeClient({ debts, thisMonthCollected, accounts = [] }: VeresiyeClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'tracking'>('all');
    const [isPending, startTransition] = useTransition();
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

    // Tracking Modal State
    const [trackingDebt, setTrackingDebt] = useState<Debt | null>(null);
    const [trackingDate, setTrackingDate] = useState("");

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
            customer: Debt['customer'];
            totalAmount: number;
            remainingAmount: number;
            lastTransactionDate: string;
            lastTransactionNote: string;
            status: 'GECİKMİŞ' | 'BEKLEMEDE' | 'KISMI ÖDENDİ';
            debtItems: Debt[];
        }> = {};

        debts.forEach(d => {
            if (d.isPaid) return;
            const cid = d.customer.id;
            if (!groups[cid]) {
                groups[cid] = {
                    customer: d.customer,
                    totalAmount: 0,
                    remainingAmount: 0,
                    lastTransactionDate: d.createdAt,
                    lastTransactionNote: d.notes || "Ürün/Servis Borcu",
                    status: 'BEKLEMEDE',
                    debtItems: []
                };
            }

            groups[cid].totalAmount += Number(d.amount);
            groups[cid].remainingAmount += Number(d.remainingAmount);
            groups[cid].debtItems.push(d);

            if (new Date(d.createdAt) > new Date(groups[cid].lastTransactionDate)) {
                groups[cid].lastTransactionDate = d.createdAt;
                groups[cid].lastTransactionNote = d.notes || groups[cid].lastTransactionNote;
            }

            // Status Logic
            const isOverdue = d.dueDate && new Date(d.dueDate) < now;
            if (isOverdue) {
                groups[cid].status = 'GECİKMİŞ';
            } else if (groups[cid].status !== 'GECİKMİŞ' && d.remainingAmount < d.amount) {
                groups[cid].status = 'KISMI ÖDENDİ';
            }
        });

        // Apply Active Filters
        let result = Object.values(groups);

        if (filterStatus === 'overdue') {
            result = result.filter(item => item.status === 'GECİKMİŞ');
        } else if (filterStatus === 'tracking') {
            result = result.filter(item => item.debtItems.some(di => di.isTracking));
        } else if (filterStatus === 'pending') {
            result = result.filter(item => item.status === 'BEKLEMEDE' || item.status === 'KISMI ÖDENDİ');
        }

        return result.filter(item =>
            item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.customer.phone && item.customer.phone.includes(searchTerm))
        );
    }, [debts, searchTerm, now, filterStatus]);

    // 2. Global Stats
    const totalReceivable = useMemo(() =>
        debts.filter(d => !d.isPaid).reduce((sum, d) => sum + Number(d.remainingAmount), 0),
        [debts]);

    const totalOverdue = useMemo(() =>
        debts.filter(d => !d.isPaid && d.dueDate && new Date(d.dueDate) < now)
            .reduce((sum, d) => sum + Number(d.remainingAmount), 0),
        [debts, now]);

    const activeDebtorCount = new Set(debts.filter(d => !d.isPaid).map(d => d.customer.id)).size;

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
    const handleCollectPayment = async () => {
        if (!selectedDebt || !paymentAmount) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Lütfen geçerli bir tutar giriniz.");
            return;
        }

        startTransition(async () => {
            const res = await collectDebtPayment(selectedDebt.id, amount, paymentMethod, selectedAccountId || undefined);
            if (res.success) {
                toast.success("Ödeme başarıyla tahsil edildi.");
                setSelectedDebt(null);
                setPaymentAmount("");
                setPaymentMethod("CASH");
                setSelectedAccountId("");
            } else {
                toast.error(res.error || "Tahsilat sırasında bir hata oluştu.");
            }
        });
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

    const handleWhatsAppMessage = (customer: any, amount: number) => {
        if (!customer.phone) {
            toast.error("Müşterinin telefon numarası sistemde kayıtlı değil.");
            return;
        }
        let phone = customer.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = phone.slice(1);
        if (!phone.startsWith('90')) phone = '90' + phone;

        const message = `Merhaba ${customer.name}, işletmemizdeki ${amount.toLocaleString('tr-TR')} TL tutarındaki veresiye borcunuz için hatırlatma mesajıdır. En kısa sürede ödemenizi bekler, iyi günler dileriz.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const exportToExcel = () => {
        const data = aggregatedData.map(item => ({
            Müşteri: item.customer.name,
            Telefon: item.customer.phone || "-",
            "Toplam Borç": item.totalAmount,
            "Kalan Borç": item.remainingAmount,
            Durum: item.status,
            "Son İşlem": format(new Date(item.lastTransactionDate), "dd MMMM yyyy", { locale: tr })
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Veresiye Listesi");
        XLSX.writeFile(wb, "Veresiye_Listesi.xlsx");
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-12 space-y-12 pb-40 font-sans">
            {/* --- Premium Header Section --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-500/10 rounded-[1.5rem] border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                            <CreditCard className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase">Veresiye Terminali</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-indigo-500/10 text-indigo-400 border-none px-3 py-1 font-bold text-[9px] uppercase">FİNANSAL DENETİM</Badge>
                                <span className="text-slate-500 font-bold text-[10px]">Dükkan alacak takibi ve analiz merkezi</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={exportToExcel}
                        variant="ghost"
                        className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl gap-3 font-bold text-xs hover:bg-white/10 transition-all text-white"
                    >
                        <Download className="w-4 h-4 text-indigo-400" />
                        Tabloyu İndir
                    </Button>
                </div>
            </div>

            {/* --- Stats Row with Premium Accents --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "TOPLAM ALACAK", value: `₺${totalReceivable.toLocaleString('tr-TR')}`, subValue: "Son 30 gün: +14%", icon: Star, color: "indigo", delay: 0.1, trend: "up" },
                    { label: "GECİKEN TUTAR", value: `₺${totalOverdue.toLocaleString('tr-TR')}`, subValue: `${debts.filter(d => d.dueDate && new Date(d.dueDate) < now && !d.isPaid).length} gecikmiş kayıt`, icon: AlertCircle, color: "rose", delay: 0.2, pulse: true },
                    { label: "AYLIK TAHSİLAT", value: `₺${thisMonthCollected.toLocaleString('tr-TR')}`, subValue: `Hedef gerçekleşme: %${Math.min(100, Math.round((thisMonthCollected / 75000) * 100))}`, icon: Wallet, color: "emerald", delay: 0.3 },
                    { label: "BORÇLU SAYISI", value: activeDebtorCount.toString(), subValue: `Ortalama: ₺${activeDebtorCount > 0 ? Math.round(totalReceivable / activeDebtorCount).toLocaleString('tr-TR') : 0}`, icon: Users, color: "amber", delay: 0.4 }
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay }}>
                        <Card className={cn(
                            "relative overflow-hidden border-none shadow-2xl shadow-black/20 backdrop-blur-3xl transition-all hover:scale-[1.03] duration-500 cursor-default group",
                            stat.color === 'indigo' ? "bg-indigo-500/5 border border-indigo-500/10" :
                                stat.color === 'rose' ? "bg-rose-500/5 border border-rose-500/10" :
                                    stat.color === 'emerald' ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-amber-500/5 border border-amber-500/10"
                        )}>
                            <div className={cn("absolute top-0 left-0 w-[2px] h-0 group-hover:h-full transition-all duration-700 opacity-60", `bg-${stat.color}-500`)} />
                            <CardHeader className="flex flex-row items-center justify-between pb-4 px-8 pt-8">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{stat.label}</span>
                                <div className={cn("p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110", `bg-${stat.color}-500/10`, stat.pulse && "animate-pulse")}>
                                    <stat.icon className={cn("w-5 h-5", `text-${stat.color}-500`)} />
                                </div>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 mt-2">
                                <div className={cn("text-4xl font-bold tabular-nums", stat.color === 'rose' ? "text-rose-500" : stat.color === 'emerald' ? "text-emerald-500" : stat.color === 'amber' ? "text-amber-500" : "text-white")}>
                                    {stat.value}
                                </div>
                                <div className={cn("flex items-center gap-2 mt-4 font-bold text-[10px] opacity-60 group-hover:opacity-100 transition-opacity", `text-${stat.color}-400`)}>
                                    {stat.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                                    <span>{stat.subValue}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* --- Main Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Sidebar: Aging Analysis & Insights */}
                <div className="lg:col-span-3 space-y-10">
                    <Card className="border-none bg-white/[0.03] backdrop-blur-3xl shadow-2xl shadow-black/20 overflow-hidden rounded-[2.5rem] border border-white/5">
                        <CardHeader className="px-8 pt-8 pb-4">
                            <CardTitle className="text-[10px] font-bold uppercase flex items-center gap-4 text-slate-500">
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
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{g.label}</span>
                                        <span className={cn("text-xs font-bold tabular-nums", `text-${g.color}-500 px-3 py-1 rounded-full bg-${g.color}-500/10 border border-${g.color}-500/10`)}>₺{g.amount.toLocaleString('tr-TR')}</span>
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

                            <div className="p-6 bg-white/[0.02] rounded-[1.5rem] border border-white/5 relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-500">
                                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 dark:opacity-5 transition-all duration-700">
                                    <AlertCircle className="w-24 h-24 text-indigo-500 -rotate-12" />
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold italic leading-relaxed relative z-10 antialiased">
                                    "{aging['60+'].percentage > 30 ? 'Dikkat seviyesi yüksek! Ödeme süresi geciken alacaklar nakit akışını zorlayabilir. ' : 'Portföy sağlığı stabil. 60 gün üzeri alacak payınız güvenli baremde. '} Mevcut risk oranı: %{Math.round(aging['60+'].percentage)}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Insight Card: Futuristic */}
                    <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Card className="border-none bg-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.3)] text-white overflow-hidden rounded-[2.5rem] relative group cursor-pointer border border-white/5">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125">
                                <CalendarClock className="w-32 h-32 rotate-12" />
                            </div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                            <CardHeader className="px-8 pt-10 pb-4">
                                <CardTitle className="text-[10px] font-bold uppercase flex items-center gap-3 opacity-90">
                                    <TrendingDown className="w-4 h-4" />
                                    AI PROJEKSİYON
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-12 pt-2">
                                <h3 className="text-2xl font-bold leading-tight mb-4 uppercase">Ay Sonu Tahsilat Öngörüsü</h3>
                                <p className="text-sm font-bold leading-relaxed opacity-80 antialiased">
                                    Algoritmik analiz, toplam alacaklarınızın <span className="underline decoration-white/40 underline-offset-8">%{Math.max(10, 100 - Math.round(aging['60+'].percentage))}</span>'lik kısmının mevcut tahsilat ivmesiyle bu dönem içinde kasaya gireceğini öngörüyor.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Right: Premium Customer Table */}
                <div className="lg:col-span-9 space-y-8">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 px-2">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white uppercase">Müşteri Portföyü</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 opacity-80">Aktif alacaklar ve cari hareketler listesi</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto mt-2">
                            <div className="relative group flex-1 md:flex-none md:w-80">
                                <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors z-20" />
                                <Input
                                    placeholder="İsim veya telefon numarası..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-14 h-14 bg-white/[0.03] border-white/5 shadow-2xl rounded-2xl focus-visible:ring-indigo-500/20 focus-visible:bg-white/[0.06] transition-all font-bold text-sm text-white relative z-10"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-white/[0.02] backdrop-blur-3xl rounded-[1.5rem] border border-white/5 shadow-2xl">
                                {[
                                    { id: 'all', label: 'TÜMÜ' },
                                    { id: 'pending', label: 'BEKLEYEN' },
                                    { id: 'overdue', label: 'GECİKEN' },
                                    { id: 'tracking', label: 'TAKİPTE' }
                                ].map((tab) => (
                                    <Button
                                        key={tab.id}
                                        onClick={() => handleFilterChange(tab.id as any)}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-10 px-5 rounded-2xl text-[10px] font-bold transition-all uppercase",
                                            filterStatus === tab.id
                                                ? "bg-indigo-500 text-white shadow-2xl shadow-indigo-500/20"
                                                : "text-slate-500 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        {tab.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Card className="bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 relative z-10 min-h-[600px]">
                        <div className={cn("transition-all duration-500 flex flex-col h-full", isPending ? "opacity-30 blur-md grayscale pointer-events-none scale-[0.99]" : "opacity-100 blur-0 grayscale-0 scale-100")}>
                            <Table>
                                <TableHeader className="bg-white/[0.03]">
                                    <TableRow className="hover:bg-transparent border-b border-white/5">
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500 py-8 px-10">Müşteri Profili</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500">Son Hareket</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500">Güncel Bakıye</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500">Durum</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-500 text-right pr-10">Hızlı İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {aggregatedData.map((item, idx) => (
                                            <motion.tr
                                                key={item.customer.id}
                                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03, type: "spring", stiffness: 200 }}
                                                className="group hover:bg-indigo-500/[0.04] border-b border-white/[0.02] transition-all duration-300"
                                            >
                                                <TableCell className="py-7 px-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-[1.75rem] bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 text-lg shadow-2xl shadow-indigo-500/10 border border-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                                                            {item.customer.name.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col space-y-1.5">
                                                            <span className="font-bold text-[16px] text-white capitalize group-hover:text-indigo-400 transition-colors">{item.customer.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-3 h-3 text-slate-600" />
                                                                <span className="text-[10px] font-bold text-slate-500">
                                                                    {item.customer.phone || "Kayıt bulunamadı"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-indigo-500/60" />
                                                            <span className="text-[12px] font-bold text-slate-300 font-mono tabular-nums">
                                                                {format(new Date(item.lastTransactionDate), "dd MMM yyyy", { locale: tr })}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className="w-fit text-[9px] font-bold px-2 py-0.5 bg-white/5 border-white/5 text-slate-500 group-hover:text-slate-300 transition-colors">
                                                            {item.lastTransactionNote.substring(0, 20)}...
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-xl text-white tabular-nums">₺{item.remainingAmount.toLocaleString('tr-TR')}</span>
                                                        <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 w-1/2 opacity-50" />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Badge className={cn(
                                                            "font-bold text-[9px] px-3 py-1 rounded-[0.75rem] border-none shadow-xl",
                                                            item.status === 'GECİKMİŞ' ? "bg-rose-500/20 text-rose-500" :
                                                                item.status === 'KISMI ÖDENDİ' ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-slate-400"
                                                        )}>
                                                            {item.status === 'GECİKMİŞ' ? 'Gecikmiş' : item.status === 'KISMI ÖDENDİ' ? 'Kısmi Ödendi' : 'Beklemede'}
                                                        </Badge>
                                                        {item.debtItems.some(di => di.isTracking) && (
                                                            <Badge className="font-bold text-[9px] px-3 py-1 rounded-[0.75rem] border-none bg-indigo-500/20 text-indigo-400 shadow-xl animate-pulse">
                                                                Takipte
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform duration-500">
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDebt(item.debtItems[0]);
                                                            }}
                                                            className="h-12 px-6 rounded-[1.25rem] bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-[0_10px_30px_rgba(16,185,129,0.3)] font-bold text-[10px] gap-2 active:scale-95 transition-all"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                            Ödeme Al
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-[1.25rem] bg-white/5 shadow-2xl hover:bg-white/10 transition-all border border-white/5">
                                                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white rounded-[1.75rem] p-3 w-56 shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                                                                <div className="text-[9px] font-bold text-slate-500 uppercase px-4 py-2 border-b border-white/5 mb-2">SEÇENEKLER</div>
                                                                <DropdownMenuItem className="gap-4 py-3.5 px-4 rounded-xl focus:bg-white/10 cursor-pointer" asChild>
                                                                    <Link href={`/musteriler/${item.customer.id}`}>
                                                                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                                                            <History className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="font-bold text-[11px]">Tüm geçmişi görüntüle</span>
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleWhatsAppMessage(item.customer, item.remainingAmount)}
                                                                    className="gap-4 py-3.5 px-4 rounded-xl focus:bg-emerald-500/10 group cursor-pointer"
                                                                >
                                                                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                                        <MessageCircle className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="font-bold text-[11px]">WhatsApp ile hatırlat</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setTrackingDebt(item.debtItems[0])}
                                                                    className="gap-4 py-3.5 px-4 rounded-xl focus:bg-rose-500/10 group cursor-pointer"
                                                                >
                                                                    <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                                        <AlertCircle className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="font-bold text-[11px]">Takip listesine al</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>

                            {aggregatedData.length === 0 && !isPending && (
                                <div className="flex-1 flex flex-col items-center justify-center py-40 gap-8 grayscale opacity-40">
                                    <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center border border-white/5 shadow-2xl">
                                        <CheckCircle2 className="w-14 h-14 text-slate-500" />
                                    </div>
                                    <div className="text-center space-y-3 px-6">
                                        <h3 className="text-2xl font-bold text-white uppercase">Borç Kaydı Yok</h3>
                                        <p className="text-[10px] font-bold text-slate-500 max-w-sm mx-auto leading-relaxed">Şu anda seçili filtrelere uygun herhangi bir alacak kaydı bulunmuyor.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Decoration */}
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                    </Card>
                </div>
            </div>

            {/* --- Payment Dialogs --- */}
            <AlertDialog open={!!selectedDebt} onOpenChange={(o) => { if (!o) setSelectedDebt(null); }}>
                <AlertDialogContent className="bg-white dark:bg-black border-none shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[2.5rem] max-w-md p-8 overflow-hidden relative">
                    {/* Spinning Aura Background */}
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-full blur-[100px] pointer-events-none z-0"
                    />

                    <AlertDialogHeader className="relative z-10">
                        <AlertDialogTitle className="text-2xl font-bold text-slate-900 dark:text-white uppercase">Tahsilat İşlemi</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-bold text-xs pt-2">
                            {selectedDebt?.customer.name} için ödeme alınıyor • <span className="text-indigo-500">Kalan: ₺{selectedDebt?.remainingAmount.toLocaleString('tr-TR')}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-8 space-y-8 relative z-10">
                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-slate-400">Tahsilat tutarı (₺)</Label>
                            <div className="relative group">
                                <span className={cn(
                                    "absolute left-6 top-1/2 -translate-y-1/2 font-bold text-2xl transition-all duration-300",
                                    paymentAmount ? "text-indigo-500 scale-125" : "text-slate-400"
                                )}>₺</span>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-14 h-20 bg-slate-50 dark:bg-white/[0.05] border-none rounded-[1.5rem] text-3xl font-bold focus-visible:ring-4 focus-visible:ring-indigo-500/10 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-slate-400">Ödeme yöntemi seçin</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'CASH', label: 'Nakit', icon: Wallet },
                                    { id: 'CARD', label: 'Kart', icon: CreditCard },
                                    { id: 'TRANSFER', label: 'Havale', icon: RefreshCcw }
                                ].map((method) => (
                                    <Button
                                        key={method.id}
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setPaymentMethod(method.id as any);
                                            if (method.id === 'CASH') setSelectedAccountId("");
                                        }}
                                        className={cn(
                                            "flex flex-col h-20 gap-2 rounded-2xl border-none transition-all duration-300",
                                            paymentMethod === method.id
                                                ? "bg-indigo-500 text-white shadow-[0_15px_30px_rgba(99,102,241,0.3)] scale-105 font-bold"
                                                : "bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <method.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase">{method.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {paymentMethod !== 'CASH' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="space-y-4"
                                >
                                    <Label className="text-[11px] font-bold text-slate-400">
                                        Hesap seçimi yapın
                                    </Label>
                                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                        <SelectTrigger className="h-14 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold text-sm text-slate-300 shadow-inner group transition-all">
                                            <SelectValue placeholder="Aktarılacak hesabı seçin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 rounded-[1.5rem] p-2 shadow-2xl">
                                            {accounts
                                                .filter(acc =>
                                                    paymentMethod === 'CARD'
                                                        ? (acc.type === 'POS' || acc.type === 'BANK')
                                                        : (acc.type === 'BANK')
                                                )
                                                .map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="text-white focus:bg-indigo-500 rounded-xl py-3 px-4 transition-all">
                                                        <div className="flex justify-between items-center w-full gap-8">
                                                            <span className="font-bold text-sm">{acc.name}</span>
                                                            <span className="opacity-50 text-[10px] font-mono">₺{Number(acc.balance).toLocaleString('tr-TR')}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AlertDialogFooter className="flex-col md:flex-row gap-4 pt-4 relative z-10">
                        <AlertDialogCancel className="h-14 flex-1 rounded-2xl border-none bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-white/10 transition-all">Vazgeç</AlertDialogCancel>
                        <Button
                            onClick={handleCollectPayment}
                            disabled={isPending}
                            className="h-14 flex-[2] rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-[0_15px_40px_rgba(16,185,129,0.3)] font-bold text-[11px] transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tahsilatı Tamamla"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Tracking Dialog --- */}
            <AlertDialog open={!!trackingDebt} onOpenChange={(o) => !o && setTrackingDebt(null)}>
                <AlertDialogContent className="bg-white dark:bg-black border-none shadow-[20px_50px_100px_rgba(0,0,0,0.5)] rounded-[2.5rem] max-w-sm p-8 overflow-hidden relative">
                    {/* Spinning Aura Background */}
                    <motion.div
                        animate={{
                            rotate: -360,
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.1, 0.05]
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-rose-500 to-rose-800 rounded-full blur-[100px] pointer-events-none z-0"
                    />

                    <AlertDialogHeader className="relative z-10">
                        <AlertDialogTitle className="text-2xl font-bold text-slate-900 dark:text-white uppercase">İzleme & Takip</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-bold text-xs pt-2">
                            Ödeme sözü takip sistemi
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-8 space-y-6 relative z-10">
                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-slate-400">Hatırlatma tarihi seçin</Label>
                            <Input
                                type="date"
                                value={trackingDate}
                                onChange={(e) => setTrackingDate(e.target.value)}
                                className="h-14 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold text-white focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer"
                            />
                        </div>
                        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 backdrop-blur-md">
                            <p className="text-[11px] font-bold text-rose-500/80 leading-relaxed italic antialiased">Sistem bu tarihte müşteri için öncelikli bildirim oluşturacak ve finansal radar kapsamına alacaktır.</p>
                        </div>
                    </div>
                    <AlertDialogFooter className="flex-col gap-4 relative z-10">
                        <Button
                            onClick={handleStartTracking}
                            disabled={isPending || !trackingDate}
                            className="h-14 w-full rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-none shadow-[0_15px_40px_rgba(244,63,94,0.3)] font-bold text-[11px] transition-all active:scale-95"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Takibi Başlat"}
                        </Button>
                        <AlertDialogCancel className="h-12 w-full rounded-2xl border-none bg-white/5 text-slate-500 font-bold text-[11px] active:scale-95 transition-all">İptal Et</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
