"use client";

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
    ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
    defaultCurrency = "TRY",
    usdRate = 1
}: {
    data: { finance: FinanceData; milestones: Milestone[] };
    defaultCurrency?: string;
    usdRate?: number;
}) {
    const { finance, milestones } = data;

    return (
        <div className="space-y-8">
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
                                ? finance.netPayout.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                                : (finance.netPayout / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })
                            }
                        </h3>
                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                            <span className="opacity-80">Onaylı Kazanım: {finance.approvedCommissions} TL</span>
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
                                ? finance.pendingCommissions.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                                : (finance.pendingCommissions / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })
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
                                ? `-${finance.totalExpenses.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`
                                : `-${(finance.totalExpenses / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })}`
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
                                ? finance.baseSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                                : (finance.baseSalary / usdRate).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })
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
                        {milestones.length > 0 ? milestones.map((m, idx) => (
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
                            <h4 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent italic">Level 4</h4>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Usta teknisyen</p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
                                <span>Ertesi Seviye</span>
                                <span>%75</span>
                            </div>
                            <Progress value={75} className="h-2 bg-white/10" />
                            <p className="text-[9px] font-bold text-white/40 leading-relaxed italic">Bir sonraki seviyede tüm servis primleriniz %5 daha artacak!</p>
                        </div>

                        <button className="w-full h-14 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                            PUANLARINI KULLAN <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
