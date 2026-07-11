"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Trophy,
    Target,
    Zap,
    TrendingUp,
    Wallet,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Users,
    Wrench,
    ShoppingCart,
    Activity
} from "lucide-react";
import { getDashboardStaffOverview, redeemCareerPointsAsBonus } from "@/lib/actions/staff-finance-actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Milestone {
    id: string;
    targetType: string;
    targetValue: number;
    currentValue: number;
    bonusAmount: number;
    remaining: number;
    progressPercent: number;
}

interface FinanceData {
    baseSalary: number;
    approvedCommissions: number;
    pendingCommissions: number;
    totalExpenses: number;
    netPayout: number;
}

export function StaffDashboardClient({
    data,
    teamData,
    defaultCurrency = "TRY",
    usdRate = 1
}: {
    data: { finance: FinanceData; milestones: Milestone[] };
    teamData?: any;
    defaultCurrency?: string;
    usdRate?: number;
}) {
    const { finance, milestones } = data;
    const [rangeMode, setRangeMode] = useState<"month" | "week">(teamData?.mode || "month");
    const [referenceDate, setReferenceDate] = useState(() => {
        const raw = teamData?.periodStart || new Date();
        return new Date(raw).toISOString().slice(0, 10);
    });
    const [isRedeeming, startRedeeming] = useTransition();
    const { data: filteredTeamData, refetch: refetchTeamData, isFetching } = useQuery({
        queryKey: ["dashboard-staff-overview", rangeMode, referenceDate],
        queryFn: () => getDashboardStaffOverview({ mode: rangeMode, referenceDate }),
        initialData: teamData,
        enabled: !!teamData,
    });
    const activeTeamData = filteredTeamData || teamData;
    const formatMoney = (amount: any) => {
        const value = Number(amount || 0);
        return defaultCurrency === "TRY"
            ? value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
            : (value / usdRate).toLocaleString("tr-TR", { style: "currency", currency: "USD" });
    };
    const formatDate = (date: any) => date ? new Date(date).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";
    const topStaff = useMemo(() => [...(activeTeamData?.staff || [])].sort((a: any, b: any) => Number(b.finance?.netPayout || 0) - Number(a.finance?.netPayout || 0)), [activeTeamData]);
    const currentStaffRow = activeTeamData?.staff?.find((row: any) => row.isCurrentUser);
    const personalFinance = currentStaffRow?.finance || finance;
    const personalMilestones = currentStaffRow?.milestones || milestones;
    const currentCareer = currentStaffRow?.career;
    const handleRedeemCareerPoints = () => {
        if (!currentCareer || currentCareer.redeemed || Number(currentCareer.redeemableBonus || 0) <= 0) return;
        startRedeeming(async () => {
            await redeemCareerPointsAsBonus({ mode: rangeMode, referenceDate });
            await refetchTeamData();
        });
    };

    return (
        <div className="space-y-8">
            {activeTeamData && (
                <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-[2rem] border border-border/30 bg-card p-4 shadow-sm">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest">Personel Dönem Filtresi</h2>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1">
                                Haftalık veya aylık performansı seç; geçmiş dönemleri ayrı ayrı incele.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex rounded-xl bg-muted/50 p-1">
                                <Button type="button" size="sm" variant={rangeMode === "month" ? "default" : "ghost"} className="rounded-lg text-[10px] font-black" onClick={() => setRangeMode("month")}>
                                    Aylık
                                </Button>
                                <Button type="button" size="sm" variant={rangeMode === "week" ? "default" : "ghost"} className="rounded-lg text-[10px] font-black" onClick={() => setRangeMode("week")}>
                                    Haftalık
                                </Button>
                            </div>
                            <input
                                type={rangeMode === "month" ? "month" : "date"}
                                value={rangeMode === "month" ? referenceDate.slice(0, 7) : referenceDate}
                                onChange={(event) => setReferenceDate(rangeMode === "month" ? `${event.target.value}-01` : event.target.value)}
                                className="h-9 rounded-xl border border-border/40 bg-background px-3 text-xs font-bold outline-none"
                            />
                            <Badge className="h-9 rounded-xl bg-primary/10 px-3 text-[9px] font-black text-primary border-none">
                                {isFetching ? "YENİLENİYOR" : activeTeamData.period}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <Card className="rounded-[2rem] border-border/30 bg-card shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <Users className="h-5 w-5 text-primary" />
                                    <Badge variant="outline" className="text-[9px] font-black">{activeTeamData.period}</Badge>
                                </div>
                                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ekip Net Hakediş</p>
                                <h3 className="mt-1 text-2xl font-black">{formatMoney(activeTeamData.totals?.netPayout)}</h3>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[2rem] border-border/30 bg-card shadow-sm">
                            <CardContent className="p-6">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Onaylı Prim</p>
                                <h3 className="mt-1 text-2xl font-black text-emerald-600">{formatMoney(activeTeamData.totals?.approvedCommissions)}</h3>
                                <p className="mt-2 text-[10px] font-bold text-amber-600">Bekleyen: {formatMoney(activeTeamData.totals?.pendingCommissions)}</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[2rem] border-border/30 bg-card shadow-sm">
                            <CardContent className="p-6">
                                <Wrench className="h-5 w-5 text-blue-500" />
                                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Servis İşlemi</p>
                                <h3 className="mt-1 text-2xl font-black">{activeTeamData.totals?.serviceCount || 0}</h3>
                                <p className="mt-2 text-[10px] font-bold text-muted-foreground">Görev: {activeTeamData.totals?.taskCount || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[2rem] border-border/30 bg-card shadow-sm">
                            <CardContent className="p-6">
                                <ShoppingCart className="h-5 w-5 text-violet-500" />
                                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Satış / Ciro</p>
                                <h3 className="mt-1 text-2xl font-black">{activeTeamData.totals?.salesCount || 0}</h3>
                                <p className="mt-2 text-[10px] font-bold text-violet-600">{formatMoney(activeTeamData.totals?.totalRevenue)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6">
                        <Card className="rounded-[2rem] border-border/30 bg-card shadow-sm overflow-hidden">
                            <CardHeader className="px-6 py-5 border-b border-border/40">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest">Personel Performansı</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground mt-1">Bu ay yapılan işlemler, primler ve hakedişler</p>
                                    </div>
                                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">{activeTeamData.staff?.length || 0} kişi</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/40">
                                    {topStaff.map((row: any) => (
                                        <div key={row.user.id} className={cn("grid grid-cols-1 lg:grid-cols-[1.1fr_0.8fr_0.8fr] gap-4 px-6 py-4", row.isCurrentUser && "bg-primary/5")}>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-xs font-black">
                                                        {(row.user.name || row.user.email || "?").slice(0, 1)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate text-sm font-black">{`${row.user.name || ""} ${row.user.surname || ""}`.trim() || row.user.email}</p>
                                                            {row.isCurrentUser && <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px]">SEN</Badge>}
                                                        </div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{row.user.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="rounded-xl bg-muted/40 p-2">
                                                    <p className="text-[9px] font-black text-muted-foreground">Servis</p>
                                                    <p className="text-sm font-black">{row.metrics.serviceCount}</p>
                                                </div>
                                                <div className="rounded-xl bg-muted/40 p-2">
                                                    <p className="text-[9px] font-black text-muted-foreground">Satış</p>
                                                    <p className="text-sm font-black">{row.metrics.salesCount}</p>
                                                </div>
                                                <div className="rounded-xl bg-muted/40 p-2">
                                                    <p className="text-[9px] font-black text-muted-foreground">Görev</p>
                                                    <p className="text-sm font-black">{row.metrics.completedTaskCount}/{row.metrics.taskCount}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between lg:justify-end gap-4">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Net / Prim</p>
                                                    <p className="text-sm font-black">{formatMoney(row.finance?.netPayout)}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600">+{formatMoney(row.finance?.approvedCommissions)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2rem] border-border/30 bg-card shadow-sm overflow-hidden">
                            <CardHeader className="px-6 py-5 border-b border-border/40">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" /> Son Personel İşlemleri
                                </h2>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/40">
                                    {(activeTeamData.recentActions || []).length === 0 ? (
                                        <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Henüz işlem yok</div>
                                    ) : activeTeamData.recentActions.map((action: any) => (
                                        <div key={`${action.user?.id}-${action.id}`} className="px-6 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black truncate">{action.label} - {action.description}</p>
                                                    <p className="mt-1 text-[10px] font-bold text-muted-foreground truncate">
                                                        {`${action.user?.name || ""} ${action.user?.surname || ""}`.trim() || action.user?.email} - {formatDate(action.createdAt)}
                                                    </p>
                                                </div>
                                                {Number(action.amount || 0) !== 0 && (
                                                    <span className={cn("shrink-0 text-[10px] font-black", Number(action.amount) > 0 ? "text-emerald-600" : "text-rose-600")}>
                                                        {formatMoney(Math.abs(Number(action.amount)))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Finansal Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                    <CardContent className="p-8 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[10px] font-black uppercase tracking-widest">BU AY</Badge>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Net Hakediş</p>
                        <h3 className="text-3xl font-black mt-1">
                            {defaultCurrency === "TRY"
                                ? personalFinance.netPayout.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                                : (personalFinance.netPayout / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })
                            }
                        </h3>
                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                            <span className="opacity-80">Onaylı Kazanım: {personalFinance.approvedCommissions} TL</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card group hover:scale-[1.02] transition-all duration-300">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Bekleyen Primler</p>
                        <h3 className="text-3xl font-black mt-1 text-foreground">
                            {defaultCurrency === "TRY"
                                ? personalFinance.pendingCommissions.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                                : (personalFinance.pendingCommissions / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })
                            }
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground mt-4 italic">Mağaza sahibi onayı bekleniyor...</p>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card group">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Gider & Avans</p>
                        <h3 className="text-2xl font-black mt-1 text-foreground">
                            {defaultCurrency === "TRY"
                                ? `-${personalFinance.totalExpenses.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`
                                : `-${(personalFinance.totalExpenses / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })}`
                            }
                        </h3>
                        <div className="mt-6 flex items-center gap-1.5 overflow-hidden">
                            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card group">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sabit Maaş</p>
                        <h3 className="text-2xl font-black mt-1 text-foreground">
                            {defaultCurrency === "TRY"
                                ? personalFinance.baseSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                                : (personalFinance.baseSalary / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })
                            }
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase">SÖZLEŞMELİ TUTAR</p>
                    </CardContent>
                </Card>
            </div>

            {/* Prim Hedefleri (Milestones) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Kazanım Hedefleri</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {personalMilestones.length > 0 ? personalMilestones.map((m: Milestone, idx: number) => (
                            <Card key={m.id} className="rounded-[2rem] border-border/20 shadow-lg group hover:border-violet-500/30 transition-all overflow-hidden bg-card">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 group-hover:bg-violet-500/10 transition-colors">
                                            {m.targetType === 'SALES_AMOUNT' ? <Zap className="w-5 h-5 text-amber-500" /> : <Target className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-black border-violet-500/20 text-violet-600 bg-violet-500/5">
                                            +{m.bonusAmount} TL BONUS
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-foreground uppercase tracking-wider">
                                            {m.targetType === 'SALES_AMOUNT' ? 'Satış Hedefi' :
                                                m.targetType === 'SERVICE_COUNT' ? 'Hizmet Hedefi' : 'Görev Hedefi'}
                                        </p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Hedef: {m.targetValue} {m.targetType === 'SALES_AMOUNT' ? 'TL' : 'Adet'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-muted-foreground">{m.currentValue} Tamamlandı</span>
                                            <span className="text-violet-600">%{Math.round(m.progressPercent)}</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-border/10">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${m.progressPercent}%` }}
                                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        Bonusa kalan: <span className="text-foreground">{m.remaining} {m.targetType === 'SALES_AMOUNT' ? 'TL' : 'Adet'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-border/20">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    Henüz aktif bir ödül hedefi <br /> tanımlanmamış.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-[#09090b] text-white overflow-hidden p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Kariyer Puanı</h2>
                        </div>

                        <div className="space-y-2 text-center py-6">
                            <h4 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent italic">
                                Level {currentCareer?.level || 1}
                            </h4>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                                {currentCareer?.points || 0} dönem puanı
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
                                <span>Ertesi Seviye</span>
                                <span>%{currentCareer?.progressPercent || 0}</span>
                            </div>
                            <Progress value={currentCareer?.progressPercent || 0} className="h-2 bg-white/10" />
                            <p className="text-[9px] font-bold text-white/40 leading-relaxed italic">Servis, satış, görev ve onaylı primler seçili dönemin kariyer puanını oluşturur.</p>
                        </div>

                        <button
                            className="w-full h-14 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!currentCareer || currentCareer.redeemed || Number(currentCareer.redeemableBonus || 0) <= 0 || isRedeeming}
                            onClick={handleRedeemCareerPoints}
                        >
                            {currentCareer?.redeemed
                                ? `${formatMoney(currentCareer.redeemedAmount)} PRİME EKLENDİ`
                                : `${formatMoney(currentCareer?.redeemableBonus || 0)} PRİME ÇEVİR`}
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
