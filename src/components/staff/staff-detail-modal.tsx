"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    User,
    Wallet,
    History,
    Calendar,
    Target,
    Plus,
    Loader2,
    TrendingUp,
    TrendingDown,
    CircleDollarSign,
    Briefcase,
    FileText,
    CheckCircle2,
    XCircle
} from "lucide-react";
import {
    getEmployeeDashboardData,
    getStaffArchives,
    addStaffExpense,
    createCommission,
    createLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    addStaffDeduction
} from "@/lib/actions/staff-finance-actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface StaffDetailModalProps {
    member: any;
    isOpen: boolean;
    onClose: () => void;
}

export function StaffDetailModal({ member, isOpen, onClose }: StaffDetailModalProps) {
    const [data, setData] = useState<any>(null);
    const [archives, setArchives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bonusAmount, setBonusAmount] = useState("");
    const [bonusDesc, setBonusDesc] = useState("");
    const [deductionAmount, setDeductionAmount] = useState("");
    const [deductionDesc, setDeductionDesc] = useState("");

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 1),
    });
    const [leaveType, setLeaveType] = useState("ANNUAL");
    const [leaveDesc, setLeaveDesc] = useState("");

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen && member) {
            loadData();
        }
    }, [isOpen, member]);

    async function loadData() {
        setLoading(true);
        try {
            const [stats, history] = await Promise.all([
                getEmployeeDashboardData(member.id),
                getStaffArchives(member.id),
            ]);
            setData(stats);
            setArchives(history);
        } catch (error) {
            console.error("Error loading staff detail:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleAddBonus = () => {
        if (!bonusAmount || isNaN(Number(bonusAmount))) return;

        startTransition(async () => {
            try {
                await createCommission({
                    userId: member.id,
                    amount: Number(bonusAmount),
                    description: bonusDesc || "Yönetici Tarafından Eklenen Prim",
                    type: "SERVICE", // Or default to general
                });
                toast.success("Prim başarıyla eklendi.");
                setBonusAmount("");
                setBonusDesc("");
                await loadData();
            } catch (err) {
                toast.error("Prim eklenemedi.");
            }
        });
    };

    const handleAddDeduction = () => {
        if (!deductionAmount || isNaN(Number(deductionAmount))) return;

        startTransition(async () => {
            try {
                await addStaffDeduction({
                    userId: member.id,
                    amount: Number(deductionAmount),
                    description: deductionDesc || "Yönetici Tarafından Eklenen Kesinti",
                });
                toast.success("Kesinti başarıyla eklendi.");
                setDeductionAmount("");
                setDeductionDesc("");
                await loadData();
            } catch (err) {
                toast.error("Kesinti eklenemedi.");
            }
        });
    };

    const handleAddLeave = () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Lütfen tarih aralığını seçin.");
            return;
        }

        startTransition(async () => {
            try {
                await createLeaveRequest({
                    userId: member?.id,
                    startDate: dateRange.from!,
                    endDate: dateRange.to!,
                    type: leaveType as any,
                    description: leaveDesc,
                });
                toast.success("İzin talebi başarıyla işlendi.");
                setDateRange({ from: new Date(), to: addDays(new Date(), 1) });
                setLeaveDesc("");
                await loadData();
            } catch (err: any) {
                toast.error(err.message || "İzin talebi oluşturulamadı.");
            }
        });
    };


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: member.salaryCurrency || 'TRY',
        }).format(amount);
    };

    if (!member) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border-none rounded-[2rem] shadow-2xl h-[90vh]">
                <div className="bg-white dark:bg-slate-900 px-8 py-6 flex items-center justify-between border-b dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <User className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                {member.name} {member.surname}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold border-emerald-500/20 text-emerald-600">
                                    {member.role}
                                </Badge>
                                <span className="text-xs text-slate-500 font-medium">{member.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-8 bg-white dark:bg-slate-900 border-b dark:border-white/5">
                        <TabsList className="bg-transparent border-none gap-8 h-12">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 rounded-none px-0 font-bold text-xs uppercase tracking-widest">Gözetim</TabsTrigger>
                            <TabsTrigger value="finance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 rounded-none px-0 font-bold text-xs uppercase tracking-widest">Finansal Detay</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 rounded-none px-0 font-bold text-xs uppercase tracking-widest">Bordro Geçmişi</TabsTrigger>
                            <TabsTrigger value="leaves" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 rounded-none px-0 font-bold text-xs uppercase tracking-widest">İzinler</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-8">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="overview" className="mt-0 space-y-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                                        <Wallet className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/10 text-emerald-600">
                                                        {data?.finance?.activeDays || 0}/30 GÜN
                                                    </Badge>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NET HAKEDİŞ (BU AY)</p>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                                        {formatCurrency(data?.finance?.netPayout || 0)}
                                                    </h3>
                                                    <p className="text-[9px] text-slate-400 font-medium mt-1">Hakedilen Maaş: {formatCurrency(data?.finance?.proRatedSalary || 0)}</p>
                                                </div>
                                            </CardContent>
                                        </Card>


                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOPLAM PRİM</p>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                                        {formatCurrency(data?.finance?.approvedCommissions || 0)}
                                                    </h3>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="p-3 bg-amber-500/10 rounded-xl">
                                                        <Calendar className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İSTİRAHAT/İZİN</p>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                                        {data?.finance?.leaveDays || 0} Gün
                                                    </h3>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Milestones Progress */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Target className="h-4 w-4" /> HEDEF İLERLEMELERİ
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {data?.milestones?.map((m: any) => (
                                                <Card key={m.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                                                    <CardContent className="p-5">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase">{m.targetType === "SERVICE_COUNT" ? "Servis Adedi" : "Satış Tutarı"}</p>
                                                                <p className="text-lg font-black text-slate-900 dark:text-white">{m.currentValue} / {m.targetValue}</p>
                                                            </div>
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none">+{formatCurrency(m.bonusAmount)}</Badge>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-emerald-500 h-full transition-all duration-500"
                                                                style={{ width: `${m.progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="finance" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                                            <CardContent className="p-8">
                                                <div className="flex items-center gap-2 mb-8">
                                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">EKSTRA PRİM EKLE</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">PRİM TUTARI ({member.salaryCurrency})</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={bonusAmount}
                                                            onChange={(e) => setBonusAmount(e.target.value)}
                                                            className="h-12 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">AÇIKLAMA</Label>
                                                        <Input
                                                            placeholder="Performans ödülü vb."
                                                            value={bonusDesc}
                                                            onChange={(e) => setBonusDesc(e.target.value)}
                                                            className="h-12 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleAddBonus}
                                                        disabled={isPending || !bonusAmount}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                                                    >
                                                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "PRİMİ TANIMLA"}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                                            <CardContent className="p-8">
                                                <div className="flex items-center gap-2 mb-8">
                                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">KESİNTİ EKLE</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">KESİNTİ TUTARI ({member.salaryCurrency})</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={deductionAmount}
                                                            onChange={(e) => setDeductionAmount(e.target.value)}
                                                            className="h-12 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">AÇIKLAMA</Label>
                                                        <Input
                                                            placeholder="Hatalı işlem, ceza vb."
                                                            value={deductionDesc}
                                                            onChange={(e) => setDeductionDesc(e.target.value)}
                                                            className="h-12 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleAddDeduction}
                                                        disabled={isPending || !deductionAmount}
                                                        className="w-full bg-red-600 hover:bg-red-700 h-12 rounded-xl font-bold shadow-lg shadow-red-500/20"
                                                    >
                                                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "KESİNTİYİ TANIMLA"}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
                                            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-4">MAAŞ YAPISI</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b dark:border-white/5 font-medium text-xs">
                                                    <span className="text-slate-500">Net Maaş</span>
                                                    <span className="text-slate-900 dark:text-white">{formatCurrency(member.baseSalary || 0)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b dark:border-white/5 font-medium text-xs">
                                                    <span className="text-slate-500">Komisyon Oranı</span>
                                                    <span className="text-emerald-600">%{member.commissionRate || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 font-medium text-xs">
                                                    <span className="text-slate-500">Servis Başı Sabit Prim</span>
                                                    <span className="text-emerald-600">{formatCurrency(member.serviceCommissionAmount || 0)}</span>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
                                            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-4">BU AY KESİNTİLER</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b dark:border-white/5 font-medium text-xs">
                                                    <span className="text-slate-500">Avanslar</span>
                                                    <span className="text-red-500">-{formatCurrency(data?.finance?.totalExpenses || 0)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 font-medium text-xs">
                                                    <span className="text-slate-500">Diğer Kesintiler</span>
                                                    <span>₺0,00</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="mt-0">
                                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                                        <CardContent className="p-0">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-white/5 border-b dark:border-white/5">
                                                    <tr>
                                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Dönem</th>
                                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Maaş</th>
                                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Primler</th>
                                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Kesintiler</th>
                                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 text-right">Net Ödenen</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y dark:divide-white/5">
                                                    {archives.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-xs font-medium italic">Geçmiş bordro kaydı bulunamadı.</td>
                                                        </tr>
                                                    ) : (
                                                        archives.map((archive) => (
                                                            <tr key={archive.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                                <td className="px-6 py-4 font-bold text-xs text-slate-900 dark:text-white uppercase">{archive.period}</td>
                                                                <td className="px-6 py-4 text-xs font-medium">{formatCurrency(archive.baseSalary)}</td>
                                                                <td className="px-6 py-4 text-xs font-medium text-emerald-600">+{formatCurrency(archive.totalCommissions)}</td>
                                                                <td className="px-6 py-4 text-xs font-medium text-red-500">-{formatCurrency(archive.totalExpenses)}</td>
                                                                <td className="px-6 py-4 text-xs font-black text-right">{formatCurrency(archive.netPayout)}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="leaves" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1 space-y-6">
                                            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6 flex-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-6">İZİN DURUMU</h4>
                                                <div className="space-y-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BU AY KULLANILAN</span>
                                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{data?.finance?.leaveDays || 0} Gün</span>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
                                                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-6 text-emerald-600">YENİ İZİN TANIMLA</h4>
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">İzin Türü</Label>
                                                        <Select value={leaveType} onValueChange={setLeaveType}>
                                                            <SelectTrigger className="h-10 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="border-none bg-white dark:bg-slate-900 text-xs">
                                                                <SelectItem value="ANNUAL">YILLIK İZİN</SelectItem>
                                                                <SelectItem value="DAILY">GÜNLÜK İZİN</SelectItem>
                                                                <SelectItem value="PAID">ÜCRETLİ İZİN</SelectItem>
                                                                <SelectItem value="UNPAID">ÜCRETSİZ İZİN</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">İzin Tarih Aralığı</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal h-10 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-[10px]",
                                                                        !dateRange && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <Calendar className="mr-2 h-4 w-4" />
                                                                    {dateRange?.from ? (
                                                                        dateRange.to ? (
                                                                            <>
                                                                                {format(dateRange.from, "d MMM yyyy", { locale: tr })} -{" "}
                                                                                {format(dateRange.to, "d MMM yyyy", { locale: tr })}
                                                                            </>
                                                                        ) : (
                                                                            format(dateRange.from, "d MMM yyyy", { locale: tr })
                                                                        )
                                                                    ) : (
                                                                        <span>Tarih seçin</span>
                                                                    )}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                                                                <CalendarComponent
                                                                    initialFocus
                                                                    mode="range"
                                                                    defaultMonth={dateRange?.from}
                                                                    selected={dateRange}
                                                                    onSelect={setDateRange}
                                                                    numberOfMonths={2}
                                                                    locale={tr}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Açıklama</Label>
                                                        <Input value={leaveDesc} onChange={(e) => setLeaveDesc(e.target.value)} placeholder="Örn: Sağlık raporu" className="h-10 border-none bg-slate-50 dark:bg-white/5 rounded-xl text-xs" />
                                                    </div>
                                                    <Button
                                                        onClick={handleAddLeave}
                                                        disabled={isPending || !dateRange?.from || !dateRange?.to}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl font-bold text-xs"
                                                    >
                                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "İZNİ KAYDET"}
                                                    </Button>
                                                </div>
                                            </Card>
                                        </div>

                                        <Card className="md:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden self-start">
                                            <CardContent className="p-0">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 dark:bg-white/5 border-b dark:border-white/5">
                                                        <tr>
                                                            <th className="px-6 py-3 font-black uppercase tracking-widest text-[10px] text-slate-500">Tür</th>
                                                            <th className="px-6 py-3 font-black uppercase tracking-widest text-[10px] text-slate-500">Başlangıç</th>
                                                            <th className="px-6 py-3 font-black uppercase tracking-widest text-[10px] text-slate-500">Bitiş</th>
                                                            <th className="px-6 py-3 font-black uppercase tracking-widest text-[10px] text-slate-500 text-right">Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y dark:divide-white/5">
                                                        {data?.leaves?.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 py-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">HENÜZ KAYITLI İZİN YOK</td>
                                                            </tr>
                                                        ) : (
                                                            data?.leaves?.map((leave: any) => (
                                                                <tr key={leave.id} className="text-[11px] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                                                        {leave.type === "ANNUAL" ? "Yıllık İzin" :
                                                                            leave.type === "DAILY" ? "Günlük İzin" :
                                                                                leave.type === "PAID" ? "Ücretli İzin" :
                                                                                    leave.type === "UNPAID" ? "Ücretsiz İzin" :
                                                                                        leave.type}
                                                                    </td>
                                                                    <td className="px-6 py-4 font-medium text-slate-500">{format(new Date(leave.startDate), "d MMM yyyy", { locale: tr })}</td>
                                                                    <td className="px-6 py-4 font-medium text-slate-500">{format(new Date(leave.endDate), "d MMM yyyy", { locale: tr })}</td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {leave.status === "PENDING" ? (
                                                                                <>
                                                                                    <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg font-black text-[8px]">BEKLEMEDE</Badge>
                                                                                    <div className="flex gap-1">
                                                                                        <Button
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="h-6 w-6 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                                            onClick={() => {
                                                                                                startTransition(async () => {
                                                                                                    await approveLeaveRequest(leave.id);
                                                                                                    await loadData();
                                                                                                });
                                                                                            }}
                                                                                        >
                                                                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="h-6 w-6 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                                            disabled={isPending}
                                                                                            onClick={() => {
                                                                                                startTransition(async () => {
                                                                                                    await rejectLeaveRequest(leave.id);
                                                                                                    await loadData();
                                                                                                });
                                                                                            }}
                                                                                        >
                                                                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                                                        </Button>
                                                                                    </div>
                                                                                </>
                                                                            ) : leave.status === "APPROVED" ? (
                                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg font-black text-[8px]">ONAYLANDI</Badge>
                                                                            ) : (
                                                                                <Badge className="bg-rose-500/10 text-rose-600 border-none rounded-lg font-black text-[8px]">REDDEDİLDİ</Badge>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
