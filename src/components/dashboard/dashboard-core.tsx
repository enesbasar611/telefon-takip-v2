"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  ShoppingCart,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  LayoutDashboard,
  Activity,
  Target,
  ChevronRight,
  ArrowDownCircle,
  Smartphone,
  History,
  TrendingUp,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed";
import { SmartInsights } from "@/components/dashboard/smart-insights";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";

const statusColors: Record<string, string> = {
  PENDING: "#94a3b8", APPROVED: "#3b82f6", REPAIRING: "#3b82f6", 
  WAITING_PART: "#8b5cf6", READY: "#10b981", DELIVERED: "#059669", CANCELLED: "#ef4444",
};

const statusLabels: Record<string, string> = {
  PENDING: "Beklemede", APPROVED: "Onaylandı", REPAIRING: "Tamirde", 
  WAITING_PART: "Parça bekliyor", READY: "Hazır", DELIVERED: "Teslim edildi", CANCELLED: "İptal edildi",
};

export function DashboardCore({
  statsData, recentTicketsRaw, recentTransactions, topProducts, 
  salesTrend, serviceMetricsRaw, liveActivity, profitMatrix, 
  title = "Komuta merkezi", subtitle = "Operasyonel kontrol ve anlık iş zekası raporu", showFullDetails = true
}: any) {
  const serviceMetrics = serviceMetricsRaw.map((m: any) => ({
    ...m, name: statusLabels[m.name] || m.name, color: statusColors[m.name] || "#cbd5e1"
  }));

  const totalServiceUnits = serviceMetricsRaw.reduce((acc: number, m: any) => acc + m.value, 0);

  // Yanyana ve Premium Tasarım Yapısı
  const stats = [
    { label: "Günlük satış", value: statsData?.todaySales || "₺0", icon: ShoppingCart, bg: "bg-gradient-to-br from-[#F5F7FF] to-[#EEF2FF] dark:from-[#1e2635] dark:to-[#0f172a] border-blue-100/50", color: "text-[#4C6FFF]", trend: "+12%" },
    { label: "Tamir gelirleri", value: statsData?.todayRepairIncome || "₺0", icon: Wrench, bg: "bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#064e3b]/20 dark:to-[#022c22]/20 border-emerald-100/50", color: "text-[#10B981]", trend: "+8%" },
    { label: "Tahsilatlar", value: statsData?.collectedPayments || "₺0", icon: Banknote, bg: "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#451a03]/20 dark:to-[#78350f]/10 border-amber-100/50", color: "text-[#F59E0B]" },
    { label: "Bekleyen servisler", value: statsData?.pendingServices || "0", icon: Clock, bg: "bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] dark:from-[#2e1065]/10 dark:to-[#4c1d95]/10 border-purple-100/50", color: "text-[#8B5CF6]", badge: "Acil" },
    { label: "Hazır cihazlar", value: statsData?.readyDevices || "0", icon: CheckCircle2, bg: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200/50", color: "text-[#10B981]" },
    { label: "Kritik stok", value: statsData?.criticalStock || "0", icon: AlertTriangle, bg: "bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-[#4c0519]/20 dark:to-[#881337]/10 border-rose-100/50", color: "text-[#F43F5E]", badge: "Kritik" },
    { label: "Toplam borçlar", value: statsData?.totalDebts || "₺0", icon: ArrowDownCircle, bg: "bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-900 border-slate-300/30", color: "text-[#64748b]" },
    { label: "Kasa bakiyesi", value: statsData?.cashBalance || "₺0", icon: Wallet, bg: "bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white shadow-xl shadow-blue-900/10", color: "text-blue-400" },
  ];

  return (
    <div className="flex flex-col gap-12 pb-20 bg-background text-foreground min-h-screen lg:p-16 p-8 font-inter animate-in fade-in duration-1000">
      
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-8">
            <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/5">
                <LayoutDashboard className="h-10 w-10 text-primary" />
            </div>
            <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-foreground font-manrope">{title}</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">{subtitle}</p>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-card p-4 rounded-3xl whisper-border shadow-sm">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-500 tracking-tight">Sistem Stabil</span>
        </div>
      </div>

      {/* 8-Card Engine - PREMIUM BIG TEXT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className={cn("rounded-[2.5rem] border whisper-border transition-all duration-500 hover:scale-[1.02] overflow-hidden shadow-none", stat.bg)}>
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <p className={cn("text-[14px] font-bold tracking-tight opacity-70 uppercase-none", stat.label === "Kasa bakiyesi" ? "text-blue-100" : "text-slate-500")}>
                    {stat.label}
                  </p>
                  <div className="space-y-2">
                    {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                      <RevealFinancial amount={stat.value} className={cn("text-3xl sm:text-4xl font-black tracking-tighter leading-none", stat.label === "Kasa bakiyesi" ? "text-white" : "text-foreground")} />
                    ) : (
                      <h3 className={cn("text-3xl sm:text-4xl font-black tracking-tighter leading-none", stat.label === "Kasa bakiyesi" ? "text-white" : "text-foreground")}>
                        {stat.value}
                      </h3>
                    )}
                    <div className="flex gap-2 pt-1">
                      {stat.trend && <div className="flex items-center gap-1 text-[13px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">{stat.trend}</div>}
                      {stat.badge && <Badge className="bg-rose-500/10 text-rose-500 text-[10px] font-black border-none px-3 py-1 rounded-full">{stat.badge}</Badge>}
                    </div>
                  </div>
                </div>
                <div className={cn("p-4 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 border border-white/20 shadow-sm transition-transform duration-500 group-hover:scale-110", stat.color)}>
                  <stat.icon className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Center & Rest of the Code... */}
      {/* (Kalan kısımlar aynı hiyerarşide devam ediyor) */}
      <div className="grid gap-10 lg:grid-cols-3 grid-cols-1">
        <Card className="lg:col-span-2 shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden group w-full bg-card border-none rounded-[2.5rem]">
          <CardHeader className="flex flex-row items-center justify-between border-none pb-10 p-10 bg-muted/20">
            <div className="flex items-center gap-8">
              <div>
                <CardTitle className="text-2xl font-extrabold font-manrope">Net kâr analizi</CardTitle>
                <p className="text-sm text-slate-500 font-medium mt-1 uppercase-none">Aylık finansal verimlilik raporu</p>
              </div>
              <div className="hidden sm:flex gap-10 ml-8 border-l border-slate-200 dark:border-white/10 pl-10">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase-none">Toplam gelir</span>
                      <span className="text-lg font-extrabold text-foreground">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase-none">Net kâr</span>
                      <span className="text-lg font-extrabold text-secondary">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
                  </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
             <div className="h-[320px]">
                <SalesTrendChart data={salesTrend} />
             </div>
          </CardContent>
        </Card>
        <LiveActivityFeed activity={liveActivity} />
      </div>

      <div className="grid gap-10 lg:grid-cols-3 grid-cols-1">
        <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden group rounded-[2.5rem] bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between border-none p-10 pb-4">
            <div>
              <CardTitle className="text-xl font-extrabold font-manrope">Servis kapasite analizi</CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-1 uppercase-none">İş yükü dağılımı</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <Target className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-6">
             <div className="h-[300px]">
                <ServiceStatusChart data={serviceMetrics} />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-10">
                <span className="text-5xl font-extrabold block text-foreground font-manrope">{totalServiceUnits}</span>
                <span className="text-xs text-muted-foreground font-bold">Cihaz yükü</span>
             </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
            <SmartInsights stats={statsData} />
        </div>
      </div>

      {showFullDetails && (
        <div className="grid gap-10 lg:grid-cols-2 grid-cols-1">
            <Card className="border-none shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden rounded-[2.5rem] bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 ">
                        <History className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Finansal kayıtlar</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Gerçek zamanlı işlemler</p>
                    </div>
                </div>
                <Link href="/finans">
                    <Button variant="ghost" className="text-xs font-bold text-blue-500 hover:bg-blue-500/10 group h-10 rounded-2xl px-6 transition-all border border-blue-500/10">
                        Arşive git <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-muted-foreground bg-muted/10 uppercase-none">
                        <th className="px-10 py-5">Müşteri & Tarih</th>
                        <th className="px-6 py-5">İşlem Detayı</th>
                        <th className="px-6 py-5">Net Tutar</th>
                        <th className="px-10 py-5 text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((t: any, idx: number) => (
                        <tr key={t.id} className={cn("text-sm group transition-all duration-300 border-b border-border/20 last:border-0", idx % 2 === 0 ? "bg-transparent" : "bg-slate-50/50 dark:bg-white/[0.02]")}>
                          <td className="px-10 py-6">
                            <div className="font-extrabold text-foreground group-hover:text-primary transition-colors">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase-none tracking-tight">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                          </td>
                          <td className="px-6 py-6 text-[11px] text-slate-500 font-medium">{t.description}</td>
                          <td className="px-6 py-6"><RevealFinancial amount={t.amount} className="text-sm font-black tracking-tight" /></td>
                          <td className="px-10 py-6 text-right">
                            <Badge variant="outline" className={cn("text-[9px] font-black border-none px-4 py-1.5 rounded-full shadow-sm", t.type === 'INCOME' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive')}>
                              {t.type === 'INCOME' ? 'Tahsilat' : 'Gider'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden rounded-[2.5rem] bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 ">
                        <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                    <CardTitle className="text-lg font-extrabold">Servis kuyruğu</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">İşlemdeki son cihazlar</p>
                    </div>
                </div>
                <Link href="/servis/liste">
                <Button variant="ghost" className="text-xs font-black text-primary hover:bg-primary/10 group h-10 rounded-2xl px-6 transition-all border border-primary/10">
                        Kuyruğu yönet <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 p-10">
                {(recentTicketsRaw ?? []).map((ticket: any, idx: number) => (
                  <div key={ticket.id} className={cn("flex items-center justify-between p-6 rounded-[1.5rem] group transition-all duration-300 border-none shadow-sm", idx % 2 === 0 ? "bg-slate-50/50 dark:bg-white/[0.02]" : "bg-transparent")}>
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                        <Smartphone className="h-7 w-7 text-primary" />
                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-secondary border-4 border-white dark:border-slate-900 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors font-manrope">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          {ticket.customer?.name} • <span className="text-primary font-bold">#{ticket.ticketNumber}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] font-bold border-none mb-2 px-5 py-2 rounded-2xl" style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}>
                        {statusLabels[ticket.status]}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground font-bold italic opacity-60">{ticket.technician?.name || "Atanmamış"}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
