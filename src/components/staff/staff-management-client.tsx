"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { generatePayrollPDF } from "@/lib/utils/pdf-utils";
import {
    getPendingLeaves,
    approveLeaveRequest,
    rejectLeaveRequest
} from "@/lib/actions/staff-finance-actions";
import {
    Users,
    UserCheck,
    Calendar,
    TrendingUp,
    Search,
    ChevronDown,
    MoreVertical,
    Shield,
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowUpRight,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Lock,
    Phone,
    Mail,
    UserPlus,
    Trash2,
    Edit3,
    PlusCircle,
    Banknote,
    Wallet,
    Check,
    FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CreateStaffModal } from "./create-staff-modal";
import { StaffDetailModal } from "./staff-detail-modal";
import { StaffDeleteModal } from "./staff-delete-modal";
import { MilestoneManagement } from "./milestone-management";
import {
    getStaff,
    getStaffLogs,
    updateRoleTemplate,
    getRoleTemplates,
    updateStaff,
    getAllLogs
} from "@/lib/actions/staff-actions";
import {
    getPendingCommissions,
    approveCommission,
    addStaffExpense,
    getStaffFinanceSummary,
    getManagerFinanceStats,
    getAllStaffArchives,
    getDetailedArchive,
    closeFinancialPeriod,
    getMilestones,
    createMilestone,
    deleteMilestone
} from "@/lib/actions/staff-finance-actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    getDefaultStaffPermissions,
    STAFF_PERMISSION_FIELDS,
    STAFF_ROLE_LABELS,
    STAFF_ROLE_TEMPLATE_ROLES,
} from "@/lib/staff-permissions";
import { PageHeader } from "@/components/ui/page-header";

interface MemberFinance {
    totalEarnings: number;
    pendingCommissions: number;
    approvedCommissions: number;
    totalExpenses: number;
    currentBalance: number;
}

export function StaffManagementClient({
    staff: initialStaff,
    logs: initialLogs,
    userRole,
    defaultCurrency = "TRY",
    usdRate = 1
}: any) {
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<any>("all");
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [selectedDetailMember, setSelectedDetailMember] = useState<any | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState<any | null>(null);
    const [isPeriodPending, startPeriodTransition] = useTransition();
    const [isCommPending, startCommTransition] = useTransition();
    const [isActionPending, setIsActionPending] = useState(false);

    // Data fetching
    const { data: staffData, refetch: refetchStaff } = useQuery({
        queryKey: ["staff"],
        queryFn: () => getStaff(),
    });

    const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
        queryKey: ["manager-stats"],
        queryFn: () => getManagerFinanceStats(),
        enabled: (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "SHOP_MANAGER") && typeof window !== 'undefined'
    });

    const { data: archives, isLoading: isArchivesLoading, refetch: refetchArchives } = useQuery({
        queryKey: ["all-archives"],
        queryFn: () => getAllStaffArchives(),
        enabled: (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "SHOP_MANAGER") && typeof window !== 'undefined'
    });

    const { data: pendingCommissions, refetch: refetchCommissions } = useQuery({
        queryKey: ["pending-commissions"],
        queryFn: () => getPendingCommissions(),
        enabled: (userRole === "ADMIN" || userRole === "SHOP_MANAGER" || userRole === "SUPER_ADMIN") && typeof window !== 'undefined'
    });

    const { data: milestones, refetch: refetchMilestones } = useQuery({
        queryKey: ["milestones"],
        queryFn: () => getMilestones(),
        enabled: (userRole === "ADMIN" || userRole === "SHOP_MANAGER" || userRole === "SUPER_ADMIN") && typeof window !== 'undefined'
    });

    const { data: pendingLeaves, refetch: refetchPendingLeaves } = useQuery({
        queryKey: ["pending-leaves"],
        queryFn: () => getPendingLeaves(),
        enabled: (userRole === "ADMIN" || userRole === "SHOP_MANAGER" || userRole === "SUPER_ADMIN") && typeof window !== 'undefined'
    });

    const localStaff = staffData || initialStaff || [];

    const handleApprove = async (id: string) => {
        startCommTransition(async () => {
            try {
                const res = await approveCommission(id);
                if (res.success) {
                    toast({ title: "Başarılı", description: "Prim onaylandı." });
                    refetchCommissions();
                    refetchStaff();
                }
            } catch (error: any) {
                toast({ title: "Hata", description: error.message, variant: "destructive" });
            }
        });
    };

    const handleApproveLeave = async (leaveId: string) => {
        setIsActionPending(true);
        try {
            const res = await approveLeaveRequest(leaveId);
            if (res.success) {
                toast({ title: "Başarılı", description: "İzin onaylandı." });
                refetchStaff();
                refetchPendingLeaves();
            }
        } catch (error: any) {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        } finally {
            setIsActionPending(false);
        }
    };

    const handleRejectLeave = async (leaveId: string) => {
        setIsActionPending(true);
        try {
            const res = await rejectLeaveRequest(leaveId);
            if (res.success) {
                toast({ title: "Başarılı", description: "İzin reddedildi." });
                refetchStaff();
                refetchPendingLeaves();
            }
        } catch (error: any) {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        } finally {
            setIsActionPending(false);
        }
    };

    const getPerformanceStatus = (member: any) => {
        const ticketCount = member.assignedTickets?.length || 0;
        const totalSalesAmount = (member.sales || []).reduce((acc: number, s: any) => acc + Number(s.totalAmount || 0), 0);
        const commissionCount = (member.staffCommissions || []).length;

        // Find relevant milestones for this role
        const roleMilestones = (milestones || []).filter((m: any) => m.role === member.role && m.isActive);

        let score = 0;

        if (roleMilestones.length > 0) {
            // Calculate progress based on milestones
            const progressions = roleMilestones.map((m: any) => {
                const targetValue = Number(m.targetValue);
                if (targetValue <= 0) return 0;

                if (m.targetType === "SERVICE_COUNT") {
                    return (ticketCount / targetValue) * 100;
                } else if (m.targetType === "SALES_AMOUNT") {
                    return (totalSalesAmount / targetValue) * 100;
                }
                return 0;
            });

            // Weighted scoring: if they meet multiple goals, they score higher.
            // But we use an average to be fair, capped at 100 per indicator.
            const totalProgress = progressions.reduce((acc: number, curr: number) => acc + Math.min(100, curr), 0);
            score = totalProgress / progressions.length;

            // Bonus points for overachieving (up to 120%)
            const overAchievement = progressions.some((p: number) => p > 100);
            if (overAchievement) {
                score *= 1.1;
            }
        } else {
            // Balanced Fallback if no milestones defined
            // Improved weights for more dynamic range
            const isTech = member.role === "TECHNICIAN";
            const ticketWeight = isTech ? 15 : 5;
            const saleWeight = isTech ? 0.01 : 0.05; // Amount based
            const commWeight = 5;

            // Score = (Tickets * weight) + (Sales Amount * weight) + (Approved Commissions * weight)
            score = (ticketCount * ticketWeight) + (totalSalesAmount * saleWeight) + (commissionCount * commWeight);
        }

        const cappedScore = Math.min(100, Math.round(score));

        if (cappedScore >= 95) return { label: "Efsane", color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400", icon: TrendingUp, score: cappedScore };
        if (cappedScore >= 75) return { label: "Çok İyi", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400", icon: CheckCircle2, score: cappedScore };
        if (cappedScore >= 50) return { label: "İyi", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400", icon: Activity, score: cappedScore };
        if (cappedScore >= 25) return { label: "Normal", color: "text-slate-600 bg-slate-50 dark:bg-slate-700/10 dark:text-slate-400", icon: Activity, score: cappedScore };
        return { label: "Gelişmeli", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400", icon: Clock, score: cappedScore };
    };

    const filteredStaff = useMemo(() => {
        return (localStaff || []).filter((member: any) => {
            const searchBase = searchTerm.toLowerCase().trim();
            if (!searchBase) {
                const matchesTab = filter === "all" || member.role === filter;
                return matchesTab;
            }

            const nameMatch = (member.name || "").toLowerCase().includes(searchBase);
            const surnameMatch = (member.surname || "").toLowerCase().includes(searchBase);
            const emailMatch = (member.email || "").toLowerCase().includes(searchBase);

            const matchesSearch = nameMatch || surnameMatch || emailMatch;
            const matchesTab = filter === "all" || member.role === filter;
            return matchesSearch && matchesTab;
        });
    }, [localStaff, searchTerm, filter]);

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Personel & Finans"
                description="Personel maaş, prim ve gider yönetim merkezi."
                icon={Users}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl border-amber-500/20 text-amber-600 hover:bg-amber-50"
                            onClick={() => {
                                if (confirm("Mevcut dönemi kapatıp arşivlemek istediğinize emin misiniz?")) {
                                    startPeriodTransition(async () => {
                                        const res = await closeFinancialPeriod();
                                        if (res.success) {
                                            toast({ title: "Başarılı", description: `${res.period} dönemi arşivlendi.` });
                                            refetchArchives();
                                            refetchStats();
                                        }
                                    });
                                }
                            }}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Dönemi Kapat
                        </Button>
                        <CreateStaffModal onSuccess={refetchStaff} />
                    </div>
                }
            />

            {/* Finansal Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Banknote className="h-8 w-8 opacity-50" />
                            <Badge className="bg-white/20 border-none text-white font-black">TOPLAM MAAŞ</Badge>
                        </div>
                        <h3 className="text-3xl font-black">
                            {defaultCurrency === "TRY"
                                ? `${(stats?.monthlyFixedCost || 0).toLocaleString('tr-TR')} ₺`
                                : `$${((stats?.monthlyFixedCost || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            }
                        </h3>
                        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest leading-tight">
                            {defaultCurrency === "TRY"
                                ? `$${((stats?.monthlyFixedCost || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${(stats?.monthlyFixedCost || 0).toLocaleString('tr-TR')} ₺`
                            }
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="h-8 w-8 opacity-50" />
                            <Badge className="bg-white/20 border-none text-white font-black">ÖDENEN PRİM</Badge>
                        </div>
                        <h3 className="text-3xl font-black">
                            {defaultCurrency === "TRY"
                                ? `${(stats?.monthlyVariableComm || 0).toLocaleString('tr-TR')} ₺`
                                : `$${((stats?.monthlyVariableComm || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            }
                        </h3>
                        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest leading-tight">
                            {defaultCurrency === "TRY"
                                ? `$${((stats?.monthlyVariableComm || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${(stats?.monthlyVariableComm || 0).toLocaleString('tr-TR')} ₺`
                            }
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="h-8 w-8 opacity-50" />
                            <Badge className="bg-white/20 border-none text-white font-black">EKİP GİDERLERİ</Badge>
                        </div>
                        <h3 className="text-3xl font-black">
                            {defaultCurrency === "TRY"
                                ? `${(stats?.monthlyExpenses || 0).toLocaleString('tr-TR')} ₺`
                                : `$${((stats?.monthlyExpenses || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            }
                        </h3>
                        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest leading-tight">
                            {defaultCurrency === "TRY"
                                ? `$${((stats?.monthlyExpenses || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${(stats?.monthlyExpenses || 0).toLocaleString('tr-TR')} ₺`
                            }
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4 text-emerald-600">
                            <Activity className="h-8 w-8 opacity-50" />
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 font-black">NET MALİYET</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                            {defaultCurrency === "TRY"
                                ? `${(stats?.totalMonthlyLiability || 0).toLocaleString('tr-TR')} ₺`
                                : `$${((stats?.totalMonthlyLiability || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            }
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-tight">
                            {defaultCurrency === "TRY"
                                ? `$${((stats?.totalMonthlyLiability || 0) / usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${(stats?.totalMonthlyLiability || 0).toLocaleString('tr-TR')} ₺`
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="current" className="space-y-8">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl h-12 border border-white/5">
                        <TabsTrigger value="current" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">AKTİF DÖNEM</TabsTrigger>
                        <TabsTrigger value="archives" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">ARŞİV & BORDRO</TabsTrigger>
                        <TabsTrigger value="milestones" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">HEDEFLER</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="current" className="m-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Personel Listesi */}
                        <Card className="lg:col-span-8 rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                            {/* ... (Previous Table Code) */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase">EKİP ÜYELERİ</h2>
                                <div className="flex gap-2">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            placeholder="İsim veya e-posta..."
                                            className="pl-10 h-10 w-64 bg-white/50 dark:bg-muted/50 border-none rounded-xl text-xs"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400 pl-8">PERSONEL</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">ROL</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">BAŞARI</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">MAAŞ</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right pr-8">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!staffData && !initialStaff ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                                    <Loader2 className="h-8 w-8 text-emerald-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">PERSONEL YÜKLENİYOR...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredStaff.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                                    <Users className="h-8 w-8 opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">PERSONEL BULUNAMADI</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStaff.map((member: any) => {
                                            const isOnLeave = member.leaveRequests?.some((l: any) => {
                                                const now = new Date();
                                                return new Date(l.startDate) <= now && new Date(l.endDate) >= now;
                                            });

                                            const performance = getPerformanceStatus(member);

                                            return (
                                                <TableRow key={member.id} className="border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all group">
                                                    <TableCell className="pl-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <Avatar className="h-12 w-12 rounded-2xl ring-4 ring-white dark:ring-slate-900 shadow-xl group-hover:scale-110 transition-all duration-500">
                                                                    <AvatarImage src={member.image} className="object-cover" />
                                                                    <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm">
                                                                        {(member.name?.[0] || "?") + (member.surname?.[0] || "")}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className={cn(
                                                                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                                                                    isOnLeave ? "bg-amber-500" : "bg-emerald-500"
                                                                )} />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-black text-slate-900 dark:text-white text-[13px] tracking-tight">{member.name} {member.surname}</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-slate-400 font-bold lowercase tracking-tight leading-tight">{member.email}</span>
                                                                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">
                                                                        İşe Giriş: {new Date(member.createdAt).toLocaleDateString('tr-TR')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-none rounded-md text-[8px] font-black uppercase tracking-[0.1em] px-1.5 py-0">
                                                            {member.role === "ADMIN" ? "YÖNETİCİ" :
                                                                member.role === "TECHNICIAN" ? "TEKNİSYEN" :
                                                                    member.role === "CASHIER" ? "KASİYER" :
                                                                        member.role === "COURIER" ? "KURYE" :
                                                                            member.role === "SHOP_MANAGER" ? "MAĞAZA MÜDÜRÜ" :
                                                                                member.role === "STAFF" ? "PERSONEL" :
                                                                                    member.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-2 min-w-[140px]">
                                                            <div className="flex items-center justify-between">
                                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", performance.color.split(' ')[0])}>
                                                                    {performance.label}
                                                                </span>
                                                                <span className="text-[10px] font-black text-slate-400">%{performance.score}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px]">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all duration-1000 ease-out",
                                                                        performance.score >= 90 ? "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.4)]" :
                                                                            performance.score >= 70 ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                                                                performance.score >= 40 ? "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" :
                                                                                    "bg-slate-300 dark:bg-slate-700"
                                                                    )}
                                                                    style={{ width: `${performance.score}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                                                                    {member.salaryCurrency === "USD" ? "$" : ""}
                                                                    {(member.baseSalary || 0).toLocaleString('tr-TR', { minimumFractionDigits: member.salaryCurrency === "USD" ? 2 : 0 })}
                                                                    {member.salaryCurrency === "TRY" ? " ₺" : ""}
                                                                </span>
                                                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5 leading-none">SABİT MAAŞ</span>
                                                            </div>
                                                            {Number(member.serviceCommissionAmount || 0) > 0 && (
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[11px] text-emerald-600 tabular-nums">
                                                                        +{(member.serviceCommissionAmount || 0).toLocaleString('tr-TR')} ₺
                                                                    </span>
                                                                    <span className="text-[7px] text-slate-400 font-black uppercase tracking-[0.1em] leading-none">SERVİS PRİMİ</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8">
                                                        <div className="flex justify-end gap-2 items-center">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 shadow-sm text-slate-600 hover:text-emerald-600 hover:border-emerald-500/20 transition-all"
                                                                onClick={() => {
                                                                    setSelectedDetailMember(member);
                                                                    setIsDetailOpen(true);
                                                                }}
                                                            >
                                                                <Activity className="h-4 w-4" />
                                                            </Button>
                                                            <CreateStaffModal staff={member} onSuccess={refetchStaff} />
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-9 w-9 rounded-xl border border-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-all"
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setIsDeleteOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Yan Panel: Prim ve İzin Talepleri */}
                        <div className="lg:col-span-4 space-y-8 flex flex-col">
                            {/* Prim Onay Havuzu */}
                            <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-amber-500/5">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase">PRİM HAVUZU</h2>
                                    </div>
                                    <Badge className="bg-amber-500 text-white border-none">{pendingCommissions?.length || 0}</Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 max-h-[400px]">
                                    {!pendingCommissions || pendingCommissions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-50">
                                            <CheckCircle2 className="h-12 w-12 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">BEKLEYEN İŞLEM YOK</span>
                                        </div>
                                    ) : (
                                        pendingCommissions.map((comm: any) => (
                                            <div key={comm.id} className="p-4 rounded-3xl bg-white dark:bg-muted/10 border border-slate-100 dark:border-white/5 space-y-3 hover:shadow-lg transition-all group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8 rounded-lg">
                                                            <AvatarImage src={comm.staff?.image || comm.user?.image} />
                                                            <AvatarFallback className="text-[10px] font-bold">{(comm.staff?.name?.[0] || comm.user?.name?.[0] || "?")}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col leading-none">
                                                            <span className="font-bold text-xs">{comm.staff?.name || comm.user?.name} {comm.staff?.surname || comm.user?.surname}</span>
                                                            <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                                                                {new Date(comm.createdAt).toLocaleDateString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-black text-emerald-600 block text-sm">+{Number(comm.amount).toLocaleString('tr-TR')} ₺</span>
                                                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">{comm.type === 'SERVICE' ? 'TEKNİK SERVİS' : 'SATIŞ PRİMİ'}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{comm.description || "Referans belirtilmedi"}"</p>
                                                <Button
                                                    disabled={isCommPending}
                                                    onClick={() => handleApprove(comm.id)}
                                                    className="w-full h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
                                                >
                                                    {isCommPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                    ONAYLA
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* BEKLEYEN İZİNLER */}
                            <Card className="flex flex-col border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-blue-500/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase">İZİN TALEPLERİ</h2>
                                    </div>
                                    <Badge className="bg-blue-500 text-white border-none">{pendingLeaves?.length || 0}</Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 max-h-[400px]">
                                    {!pendingLeaves || pendingLeaves.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-50">
                                            <CheckCircle2 className="h-12 w-12 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">BEKLEYEN TALEP YOK</span>
                                        </div>
                                    ) : (
                                        pendingLeaves.map((leave: any) => (
                                            <div key={leave.id} className="p-4 rounded-3xl bg-white dark:bg-muted/10 border border-slate-100 dark:border-white/5 space-y-3 hover:shadow-lg transition-all group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8 rounded-lg">
                                                            <AvatarImage src={leave.user?.image} />
                                                            <AvatarFallback className="text-[10px] font-bold">{(leave.user?.name?.[0] || "?")}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col leading-none">
                                                            <span className="font-bold text-xs">{leave.user?.name} {leave.user?.surname}</span>
                                                            <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                                                                {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-blue-500/10 text-blue-600 border-none rounded-lg font-black text-[8px]">
                                                        {leave.type === "ANNUAL" && "YILLIK"}
                                                        {leave.type === "DAILY" && "GÜNLÜK"}
                                                        {leave.type === "PAID" && "ÜCRETLİ"}
                                                        {leave.type === "UNPAID" && "ÜCRETSİZ"}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{leave.note || "Açıklama yok"}"</p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        disabled={isActionPending}
                                                        onClick={() => handleApproveLeave(leave.id)}
                                                        className="flex-1 h-9 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
                                                    >
                                                        ONAYLA
                                                    </Button>
                                                    <Button
                                                        disabled={isActionPending}
                                                        variant="outline"
                                                        onClick={() => handleRejectLeave(leave.id)}
                                                        className="flex-1 h-9 rounded-2xl bg-white dark:bg-white/5 text-rose-600 border-rose-100 dark:border-white/5 font-black text-[10px] uppercase tracking-widest gap-2"
                                                    >
                                                        REDDET
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="archives" className="m-0">
                    <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-wider">GEÇMİŞ DÖNEM ARŞİVLERİ (BORDROLAR)</h2>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400 pl-8">DÖNEM</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400">PERSONEL</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400">MAAŞ</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400">TOPLAM PRİM</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400">GİDERLER</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400">NET ÖDENEN</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right pr-8">İŞLEMLER</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {archives?.map((archive: any) => (
                                    <TableRow key={archive.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="pl-8 py-4">
                                            <Badge className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-black px-3 py-1 rounded-xl">
                                                {archive.period}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-lg">
                                                    <AvatarImage src={archive.user?.image} />
                                                    <AvatarFallback className="text-[10px] font-bold">{archive.user?.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-xs">{archive.user?.name} {archive.user?.surname}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">{(archive.baseSalary || 0).toLocaleString('tr-TR')} ₺</TableCell>
                                        <TableCell className="text-xs font-medium text-emerald-600">+{(archive.totalCommissions || 0).toLocaleString('tr-TR')} ₺</TableCell>
                                        <TableCell className="text-xs font-medium text-rose-500">-{(archive.totalExpenses || 0).toLocaleString('tr-TR')} ₺</TableCell>
                                        <TableCell className="font-black text-xs">{(archive.netPayout || 0).toLocaleString('tr-TR')} ₺</TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 bg-white/50 dark:bg-white/5 border-none h-8 px-4"
                                                onClick={async () => {
                                                    const detailed = await getDetailedArchive(archive.id);
                                                    setSelectedArchive(detailed);
                                                }}
                                            >
                                                <Activity className="h-3 w-3" />
                                                DETAY
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {(!archives || archives.length === 0) && (
                            <div className="p-20 text-center text-slate-400 opacity-50 flex flex-col items-center">
                                <Archive className="h-16 w-16 mb-4" />
                                <h3 className="font-black uppercase tracking-widest text-sm">HÜNÜZ ARŞİVLENMİŞ DÖNEM BULUNMUYOR</h3>
                                <p className="text-xs mt-2 font-medium">Ay sonunda "Dönemi Kapat" butonu ile ilk arşivinizi oluşturabilirsiniz.</p>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="milestones" className="m-0">
                    <MilestoneManagement
                        milestones={milestones || []}
                        onSuccess={refetchMilestones}
                    />
                </TabsContent>
            </Tabs>

            {/* Bordro Detay Modalı */}
            <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2.5rem]">
                    {selectedArchive && (
                        <div className="flex flex-col">
                            <div className="p-8 bg-emerald-600 text-white space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge className="bg-white/20 text-white border-none font-black text-[10px]">{selectedArchive.period} DÖNEMİ BORDROSU</Badge>
                                        <h2 className="text-3xl font-black">{selectedArchive.user?.name} {selectedArchive.user?.surname}</h2>
                                        <p className="text-xs opacity-70 font-medium uppercase tracking-widest">
                                            {selectedArchive.user?.role === "ADMIN" ? "YÖNETİCİ" :
                                                selectedArchive.user?.role === "TECHNICIAN" ? "TEKNİSYEN" :
                                                    selectedArchive.user?.role === "CASHIER" ? "KASİYER" :
                                                        selectedArchive.user?.role === "COURIER" ? "KURYE" :
                                                            selectedArchive.user?.role === "SHOP_MANAGER" ? "MAĞAZA MÜDÜRÜ" :
                                                                selectedArchive.user?.role === "STAFF" ? "PERSONEL" :
                                                                    selectedArchive.user?.role}
                                        </p>
                                    </div>
                                    <Download className="h-6 w-6 opacity-50" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                                    <div className="text-center">
                                        <span className="block text-[8px] opacity-70 font-black uppercase tracking-widest">SABİT MAAŞ</span>
                                        <span className="text-sm font-bold">{(selectedArchive.baseSalary || 0).toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[8px] opacity-70 font-black uppercase tracking-widest">EK PRİMLER</span>
                                        <span className="text-sm font-bold">{(selectedArchive.totalCommissions || 0).toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[8px] opacity-70 font-black uppercase tracking-widest">KESİNTİLER</span>
                                        <span className="text-sm font-bold">{(selectedArchive.totalExpenses || 0).toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> NET ÖDEME DETAYI
                                    </h3>
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex justify-between items-center">
                                        <span className="font-bold text-slate-600 dark:text-slate-400">TOPLAM HAKEDİŞ:</span>
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">{(selectedArchive.netPayout || 0).toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" /> SİSTEM NOTLARI & METADATA
                                    </h3>
                                    <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[10px] font-medium text-slate-500 leading-relaxed italic">
                                        Bu kayıt ilgili ayın {new Date(selectedArchive.createdAt).toLocaleDateString('tr-TR')} tarihindeki finansal snapshot verilerine dayanılarak otomatik oluşturulmuştur. Onaylı tüm primler ve o aya ait giderler net ödemeye dahil edilmiştir.
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex gap-4">
                                <Button
                                    className="flex-1 rounded-2xl h-12 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest gap-2"
                                    onClick={() => generatePayrollPDF(selectedArchive)}
                                >
                                    <Download className="h-4 w-4" /> BORDRO İNDİR (PDF)
                                </Button>
                                <Button variant="outline" className="rounded-2xl h-12 bg-white dark:bg-slate-800 font-black text-[10px] uppercase tracking-widest" onClick={() => setSelectedArchive(null)}>
                                    KAPAT
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <StaffDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setSelectedMember(null);
                }}
                member={selectedMember}
                otherStaff={localStaff || []}
                onDeleted={refetchStaff}
            />
            <StaffDetailModal
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedDetailMember(null);
                }}
                member={selectedDetailMember}
            />
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Activity className={cn("animate-spin", className)} />;
}

const Archive = ({ className }: { className?: string }) => <Activity className={className} />;
