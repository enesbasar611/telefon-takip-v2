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
    Loader2
} from "lucide-react";
import { format } from "date-fns";
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
}

export function VeresiyeClient({ debts, thisMonthCollected }: VeresiyeClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'tracking'>('all');
    const [isPending, startTransition] = useTransition();
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    // Tracking Modal State
    const [trackingDebt, setTrackingDebt] = useState<Debt | null>(null);
    const [trackingDate, setTrackingDate] = useState("");

    // --- Data Aggregation & Calculations ---
    const now = new Date();

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
            const res = await collectDebtPayment(selectedDebt.id, amount);
            if (res.success) {
                toast.success("Ödeme başarıyla tahsil edildi.");
                setSelectedDebt(null);
                setPaymentAmount("");
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

        // Clean phone number: remove non-digits
        let phone = customer.phone.replace(/\D/g, '');

        // Ensure Turkey country code (90)
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
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 md:p-8 space-y-8 pb-32">
            {/* --- Stats Row --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="relative overflow-hidden border-none shadow-xl shadow-indigo-500/5 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOPLAM ALACAK</span>
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                                <CreditCard className="w-4 h-4 text-indigo-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">₺{totalReceivable.toLocaleString('tr-TR')}</div>
                            <div className="flex items-center gap-1 mt-2 text-indigo-500 font-bold text-[10px]">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Son 30 gün: +12%</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="relative overflow-hidden border-none shadow-xl shadow-rose-500/5 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GECİKEN ÖDEMELER</span>
                            <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl animate-pulse">
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-rose-600 dark:text-rose-500">₺{totalOverdue.toLocaleString('tr-TR')}</div>
                            <div className="mt-2 text-rose-500 font-bold text-[10px] bg-rose-500/10 inline-block px-2 py-0.5 rounded-full">
                                {debts.filter(d => d.dueDate && new Date(d.dueDate) < now && !d.isPaid).length} Müşteri gecikmede
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="relative overflow-hidden border-none shadow-xl shadow-emerald-500/5 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BU AY TAHSİL EDİLEN</span>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
                                <Wallet className="w-4 h-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₺{thisMonthCollected.toLocaleString('tr-TR')}</div>
                            <div className="mt-2 text-slate-400 font-bold text-[10px]">
                                Hedef: ₺75,000 ({Math.min(100, Math.round((thisMonthCollected / 75000) * 100))}%)
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="relative overflow-hidden border-none shadow-xl shadow-amber-500/5 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKTİF BORÇLU SAYISI</span>
                            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                                <Users className="w-4 h-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">{activeDebtorCount}</div>
                            <div className="mt-2 text-slate-400 font-bold text-[10px]">
                                Ortalama Borç: ₺{activeDebtorCount > 0 ? Math.round(totalReceivable / activeDebtorCount).toLocaleString('tr-TR') : 0}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* --- Main Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Sidebar: Aging Analysis */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none bg-white dark:bg-slate-900/50 shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-[13px] font-black tracking-tight flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                                Borç Yaşlandırma Analizi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">0 - 30 Gün</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">₺{aging['0-30'].amount.toLocaleString('tr-TR')}</span>
                                </div>
                                <Progress value={aging['0-30'].percentage} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">31 - 60 Gün</span>
                                    <span className="text-amber-500">₺{aging['31-60'].amount.toLocaleString('tr-TR')}</span>
                                </div>
                                <Progress value={aging['31-60'].percentage} className="h-1.5 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">60+ Gün</span>
                                    <span className="text-rose-500">₺{aging['60+'].amount.toLocaleString('tr-TR')}</span>
                                </div>
                                <Progress value={aging['60+'].percentage} className="h-1.5 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-rose-500" />
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-white/5">
                                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                    "{aging['60+'].percentage > 30 ? 'Dikkat! ' : ''}60 gün üzeri borçların toplam alacak içindeki payı %{Math.round(aging['60+'].percentage)}. Aksiyon alınması önerilir."
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Insight Card */}
                    <Card className="border-none bg-indigo-600 dark:bg-indigo-900 shadow-xl shadow-indigo-500/20 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CalendarClock className="w-24 h-24 rotate-12" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <TrendingDown className="w-3 h-3" />
                                Akıllı Tahmin
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs font-medium leading-relaxed opacity-90">
                                Mevcut tahsilat hızıyla bekleyen borçların %{Math.max(10, 100 - Math.round(aging['60+'].percentage))}'sinin bu ay içinde ödenmesi bekleniyor.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Customer Table */}
                <div className="lg:col-span-9 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Müşteri Veresiye Listesi</h2>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Müşteri veya telefon ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-xs"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm">
                                <SlidersHorizontal className="w-4 h-4" />
                            </Button>
                            <div className="hidden lg:flex items-center gap-1 p-1 bg-white/50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 mr-2">
                                <Button
                                    onClick={() => setFilterStatus('all')}
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-8 rounded-lg text-[10px] font-black", filterStatus === 'all' ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500")}
                                >
                                    TÜMÜ
                                </Button>
                                <Button
                                    onClick={() => setFilterStatus('pending')}
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-8 rounded-lg text-[10px] font-black", filterStatus === 'pending' ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500")}
                                >
                                    BEKLEYEN
                                </Button>
                                <Button
                                    onClick={() => setFilterStatus('overdue')}
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-8 rounded-lg text-[10px] font-black", filterStatus === 'overdue' ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500")}
                                >
                                    GECİKEN
                                </Button>
                                <Button
                                    onClick={() => setFilterStatus('tracking')}
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-8 rounded-lg text-[10px] font-black", filterStatus === 'tracking' ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500")}
                                >
                                    TAKİPTE
                                </Button>
                            </div>
                            <Button
                                onClick={exportToExcel}
                                variant="outline"
                                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm gap-2 font-black text-[11px]"
                            >
                                <Download className="w-4 h-4" />
                                Excel
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] shadow-xl shadow-black/5 border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-6 px-8">Müşteri</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Son İşlem</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Toplam Borç</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Durum</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right pr-8">Aksiyon</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {aggregatedData.map((item, idx) => (
                                        <motion.tr
                                            key={item.customer.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] border-b border-slate-50 dark:border-white/[0.02] transition-colors"
                                        >
                                            <TableCell className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500 text-sm">
                                                        {item.customer.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-sm text-slate-900 dark:text-white capitalize leading-tight">{item.customer.name}</span>
                                                        <span className="text-[11px] font-bold text-slate-400 mt-0.5">{item.customer.phone || "-"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                                        {format(new Date(item.lastTransactionDate), "dd MMM yyyy", { locale: tr })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-indigo-500/60 mt-0.5 max-w-[120px] truncate">
                                                        {item.lastTransactionNote}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-black text-base text-slate-900 dark:text-white">₺{item.remainingAmount.toLocaleString('tr-TR')}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "font-black text-[9px] px-2 py-0.5 border-none",
                                                    item.status === 'GECİKMİŞ' ? "bg-rose-500/10 text-rose-500" :
                                                        item.status === 'KISMI ÖDENDİ' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"
                                                )}>
                                                    {item.status}
                                                </Badge>
                                                {item.debtItems.some(di => di.isTracking) && (
                                                    <Badge className="ml-2 font-black text-[9px] px-2 py-0.5 border-none bg-indigo-500/10 text-indigo-500">
                                                        TAKİPTE
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        onClick={() => setSelectedDebt(item.debtItems[0])}
                                                        size="sm"
                                                        className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border-none shadow-none"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Button>
                                                    {item.debtItems[0].dueDate && (
                                                        <div className="flex flex-col items-end mr-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ÖDEME GÜNÜ</span>
                                                            <span className="text-[10px] font-bold text-indigo-500">
                                                                {Math.max(0, Math.ceil((new Date(item.debtItems[0].dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))} Gün Kaldı
                                                            </span>
                                                        </div>
                                                    )}
                                                    <Button
                                                        onClick={() => handleWhatsAppMessage(item.customer, item.remainingAmount)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-slate-400">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white">
                                                            <DropdownMenuItem className="gap-2" asChild>
                                                                <Link href={`/musteriler/${item.customer.id}`}>
                                                                    <History className="w-4 h-4" /> Detaylar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setTrackingDebt(item.debtItems[0])}
                                                                className="gap-2 text-rose-500"
                                                            >
                                                                <AlertCircle className="w-4 h-4" /> Takip Başlat
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {aggregatedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-slate-400">Aktif veresiye kaydı bulunamadı.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* --- Payment Dialog --- */}
            <AlertDialog open={!!selectedDebt} onOpenChange={(o) => !o && setSelectedDebt(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2rem] max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white">Tahsilat Ekle</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-bold text-xs">
                            {selectedDebt?.customer.name} için ödeme alınıyor. Kalan toplam: <span className="text-indigo-500">₺{selectedDebt?.remainingAmount.toLocaleString('tr-TR')}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">ÖDEME TUTARI (₺)</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-500">₺</span>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-10 h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg font-black"
                                />
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter className="flex-col md:flex-row gap-3">
                        <AlertDialogCancel className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest order-2 md:order-1">İptal</AlertDialogCancel>
                        <Button
                            onClick={handleCollectPayment}
                            disabled={isPending}
                            className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-8 order-1 md:order-2 shadow-lg shadow-emerald-500/20"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ödemeyi Onayla"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Tracking Dialog --- */}
            <AlertDialog open={!!trackingDebt} onOpenChange={(o) => !o && setTrackingDebt(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2rem] max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white">Takip Başlat</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-bold text-xs">
                            {trackingDebt?.customer.name} için ödeme sözü alınan tarihi belirleyin. Bu tarihte sistem otomatik bildirim oluşturacaktır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">ÖDEME SÖZÜ VERİLEN TARİH</Label>
                            <Input
                                type="date"
                                value={trackingDate}
                                onChange={(e) => setTrackingDate(e.target.value)}
                                className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter className="flex-col md:flex-row gap-3">
                        <AlertDialogCancel className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest order-2 md:order-1">Vazgeç</AlertDialogCancel>
                        <Button
                            onClick={handleStartTracking}
                            disabled={isPending || !trackingDate}
                            className="h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-8 order-1 md:order-2 shadow-lg shadow-rose-500/20"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Takibi Başlat"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
