"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Wallet, Landmark, CreditCard, History, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, PieChart as PieIcon, Activity, Loader2 } from "lucide-react";
import { getAccountAnalytics } from "@/lib/actions/finance-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

export function AccountDetailModal({ account }: { account: Account }) {
    const [open, setOpen] = useState(false);
    const [period, setPeriod] = useState<"DAY" | "WEEK" | "MONTH">("WEEK");
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadAnalytics();
        }
    }, [open, period]);

    const loadAnalytics = async () => {
        setLoading(true);
        const data = await getAccountAnalytics(account.id, period);
        setAnalytics(data);
        setLoading(false);
    };

    const icons: any = {
        CASH: Wallet,
        BANK: Landmark,
        POS: CreditCard,
        CREDIT_CARD: CreditCard,
    };

    const colors: any = {
        CASH: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        BANK: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        POS: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        CREDIT_CARD: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };

    const CHART_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b"];

    const Icon = icons[account.type] || Wallet;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold rounded-lg px-2 flex-1 hover:bg-blue-500/5 hover:text-blue-500">
                    DETAYLARI GÖR
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] h-[85vh] border-border/40 p-0 overflow-hidden bg-background/80 backdrop-blur-3xl flex flex-col rounded-[2.5rem] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

                <div className="p-10 pb-6 border-b border-border/40 shrink-0 bg-muted/10">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 text-left">
                        <div className="flex items-center gap-6">
                            <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center border text-2xl shadow-xl transition-transform hover:scale-110 duration-500", colors[account.type])}>
                                <Icon className="h-8 w-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-bold tracking-tight text-foreground">{account.name}</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-muted-foreground mt-1.5 flex items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] font-bold tracking-widest h-6 px-3 bg-background/50">{account.type}</Badge>
                                    <span className="opacity-60 font-mono tracking-tighter">ID: {account.id}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">GÜNCEL BAKİYE</p>
                            <p className={cn("text-4xl font-bold tracking-tight", account.balance >= 0 ? "text-foreground" : "text-rose-500")}>
                                ₺{Number(account.balance).toLocaleString('tr-TR')}
                            </p>
                        </div>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
                    {/* Analytics Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 opacity-[0.03] rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                            <h4 className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-4 tracking-widest">
                                <TrendingUp className="h-4 w-4 text-emerald-500" /> TOPLAM GELİR
                            </h4>
                            <p className="text-3xl font-bold text-emerald-500 tracking-tight">₺{analytics?.chartData.reduce((s: any, d: any) => s + d.income, 0).toLocaleString('tr-TR') || "0"}</p>
                            <p className="text-[11px] text-muted-foreground font-bold mt-2 opacity-80 uppercase tracking-tighter">Seçili periyottaki toplam giriş</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 opacity-[0.03] rounded-full bg-rose-500 group-hover:scale-125 transition-transform" />
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-3">
                                <TrendingDown className="h-3 w-3 text-rose-500" /> TOPLAM GİDER
                            </h4>
                            <p className="text-2xl font-bold text-rose-500">₺{analytics?.chartData.reduce((s: any, d: any) => s + d.expense, 0).toLocaleString('tr-TR') || "0"}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">Seçili periyottaki toplam çıkış</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 opacity-[0.03] rounded-full bg-orange-500 group-hover:scale-125 transition-transform" />
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-3">
                                <Activity className="h-3 w-3 text-orange-500" /> İŞLEM SAYISI
                            </h4>
                            <p className="text-2xl font-bold">{analytics?.transactions.length || "0"}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">Seçili periyottaki hareket sayısı</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Main Line Chart */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                                    <Activity className="h-4 w-4 text-blue-500" /> NAKİT AKIŞI
                                </h4>
                                <Tabs value={period} onValueChange={(v: any) => setPeriod(v)} className="w-[200px]">
                                    <TabsList className="grid grid-cols-3 h-8 p-1 rounded-xl bg-muted/30">
                                        <TabsTrigger value="DAY" className="text-[9px] font-bold rounded-lg uppercase">GÜN</TabsTrigger>
                                        <TabsTrigger value="WEEK" className="text-[9px] font-bold rounded-lg uppercase">HAFTA</TabsTrigger>
                                        <TabsTrigger value="MONTH" className="text-[9px] font-bold rounded-lg uppercase">AY</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div className="h-[350px] w-full p-6 bg-card/50 rounded-[2.5rem] border border-border/40 shadow-inner relative group">
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px] z-10 rounded-[2.5rem]">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.chartData || []}>
                                            <defs>
                                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} vertical={false} />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#888' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#888' }} tickFormatter={(v) => `₺${v}`} dx={-10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(26, 27, 30, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '24px', fontSize: '12px', fontWeight: 900, backdropFilter: 'blur(10px)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
                                                itemStyle={{ fontWeight: 900 }}
                                            />
                                            <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                                            <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Distribution Pie Chart */}
                        <div className="lg:col-span-4 space-y-4">
                            <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                                <PieIcon className="h-4 w-4 text-purple-500" /> KATEGORİ DAĞILIMI
                            </h4>
                            <div className="h-[350px] w-full p-6 bg-card/50 rounded-[2.5rem] border border-border/40 shadow-inner flex flex-col">
                                <div className="flex-1 min-h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics?.distributionData || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {(analytics?.distributionData || []).map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
                                    {(analytics?.distributionData || []).slice(0, 3).map((entry: any, index: number) => (
                                        <div key={entry.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                                            </div>
                                            <span className="text-[10px] font-extrabold">₺{entry.value.toLocaleString('tr-TR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mini Transaction List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                                <History className="h-4 w-4 text-orange-500" /> SON İŞLEMLER
                            </h4>
                            <Button variant="ghost" size="sm" className="text-[10px] font-bold h-7 rounded-lg">
                                TÜMÜNÜ GÖR
                            </Button>
                        </div>
                        <div className="rounded-[2rem] border border-border/40 overflow-hidden bg-card/50">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border/40 bg-muted/20">
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">TARİH</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AÇIKLAMA</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">TÜR/KATEGORİ</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">TUTAR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {analytics?.transactions.map((t: any) => (
                                            <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-[11px] font-bold">{format(new Date(t.createdAt), "dd MMM yyyy", { locale: tr })}</p>
                                                    <p className="text-[9px] font-medium text-muted-foreground mt-0.5">{format(new Date(t.createdAt), "HH:mm")}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[11px] font-bold group-hover:text-blue-500 transition-colors">{t.description}</p>
                                                    <p className="text-[9px] font-medium text-muted-foreground mt-0.5">{t.paymentMethod}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase py-0 px-2 rounded-lg", t.type === 'INCOME' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-rose-500 border-rose-500/20 bg-rose-500/5")}>
                                                            {t.type === 'INCOME' ? 'Giriş' : 'Çıkış'}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-muted-foreground border-l border-border/40 pl-2 uppercase">{t.category || "Genel"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className={cn("text-[13px] font-bold", t.type === 'INCOME' ? "text-emerald-500" : "text-rose-500")}>
                                                        {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!analytics || analytics.transactions.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-[11px] font-bold text-muted-foreground opacity-50">
                                                    İşlem bulunamadı.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border/40 shrink-0 bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)} className="h-11 text-xs font-bold rounded-2xl px-6 border-border/40 hover:bg-muted/30 uppercase tracking-widest">
                        KAPAT
                    </Button>
                    <Button disabled={loading} onClick={loadAnalytics} className="h-11 text-xs font-bold rounded-2xl px-6 shadow-md uppercase tracking-widest">
                        REFRESH
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
