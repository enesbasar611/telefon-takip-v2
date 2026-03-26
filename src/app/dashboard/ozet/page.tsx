import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  LayoutDashboard,
  Zap,
  Activity,
  History,
  Target,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import {
  getDashboardStats,
  getRecentServiceTickets,
  getRecentTransactions,
  getTopSellingProducts
} from "@/lib/actions/dashboard-actions";
import { getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";
import { getLiveActivity } from "@/lib/actions/live-actions";
import { getProfitMatrix } from "@/lib/actions/analytics-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed";
import { SmartInsights } from "@/components/dashboard/smart-insights";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  PENDING: "#94a3b8",
  APPROVED: "#3b82f6",
  REPAIRING: "#3b82f6",
  WAITING_PART: "#8b5cf6",
  READY: "#10b981",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
};

const statusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandı",
  REPAIRING: "Tamirde",
  WAITING_PART: "Parça bekliyor",
  READY: "Hazır",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

export default async function DashboardOzetSubPage() {
  const statsData = await getDashboardStats();
  const salesTrend = await getSalesReport();
  const serviceMetricsRaw = await getServiceMetrics();
  const liveActivity = await getLiveActivity();
  const profitMatrix = await getProfitMatrix("THIS_MONTH");

  const serviceMetrics = serviceMetricsRaw.map((m: any) => ({
    ...m,
    name: statusLabels[m.name] || m.name,
    color: statusColors[m.name] || "#cbd5e1"
  }));

  const totalServiceUnits = serviceMetricsRaw.reduce((acc: number, m: any) => acc + m.value, 0);

  const stats = [
    { label: "Günlük satış", value: statsData.todaySales, icon: ShoppingCart, color: "text-white", bg: "bg-blue-600", trend: "+12%" },
    { label: "Tamir gelirleri", value: statsData.todayRepairIncome, icon: Wrench, color: "text-white", bg: "bg-emerald-600", trend: "+8%" },
    { label: "Tahsilatlar", value: statsData.collectedPayments, icon: Banknote, color: "text-white", bg: "bg-amber-600" },
    { label: "Bekleyen servisler", value: statsData.pendingServices, icon: Clock, color: "text-blue-500", bg: "bg-card", badge: "Acil" },
    { label: "Hazır cihazlar", value: statsData.readyDevices, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-card" },
    { label: "Kritik stok", value: statsData.criticalStock, icon: AlertTriangle, color: "text-rose-500", bg: "bg-card", badge: "Kritik" },
    { label: "Toplam borçlar", value: statsData.totalDebts, icon: ArrowDownCircle, color: "text-blue-500", bg: "bg-card" },
    { label: "Kasa bakiyesi", value: statsData.cashBalance, icon: Wallet, color: "text-white", bg: "bg-slate-900 dark:bg-slate-950" },
  ];

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-foreground font-manrope">Özet rapor</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">İşletme genel durum ve verimlilik raporu</p>
            </div>
        </div>
      </div>

      {/* 8 Luminous Stats Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className={cn(
            "rounded-xl border-none transition-all duration-500 hover:translate-y-[-6px] group",
            idx < 3 || idx === 7
              ? "text-white shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary to-primary/80"
              : "text-foreground shadow-xl shadow-slate-200/50 dark:shadow-black/40 bg-card border-none"
          )}>
            <CardContent className="p-10 flex flex-col justify-between min-h-[240px] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700" />

              <div className="flex items-center justify-between relative z-10">
                <div className={cn(
                    "p-4 rounded-2xl border shadow-inner transition-transform duration-500 group-hover:scale-110",
                    idx < 3 || idx === 7 ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100"
                )}>
                  <stat.icon className={cn("h-8 w-8", idx < 3 || idx === 7 ? "text-white" : stat.color)} />
                </div>
                <div className="flex flex-col items-end">
                    {stat.trend && (
                    <span className="text-xs font-bold bg-white/20 px-4 py-1.5 rounded-full border border-white/10">
                        {stat.trend}
                    </span>
                    )}
                    {stat.badge && (
                    <span className={cn(
                        "text-xs font-bold px-4 py-1.5 rounded-full border",
                        idx < 3 || idx === 7 ? "bg-white/20 border-white/10" : "bg-muted border-border"
                    )}>
                        {stat.badge}
                    </span>
                    )}
                </div>
              </div>

              <div className="mt-12 relative z-10">
                <p className={cn(
                    "text-xs font-bold mb-3 uppercase tracking-widest opacity-70",
                    idx < 3 || idx === 7 ? "text-white" : "text-slate-400"
                )}>{stat.label}</p>
                <div className="flex items-baseline gap-2">
                    {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                        <RevealFinancial amount={stat.value} className="text-5xl font-extrabold tracking-tighter font-manrope" />
                    ) : (
                        <h3 className="text-5xl font-extrabold tracking-tighter font-manrope">{stat.value}</h3>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Center & Live Control */}
      <div className="grid gap-10 lg:grid-cols-3 grid-cols-1">
        <Card className="lg:col-span-2 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 overflow-hidden group w-full bg-card border-none rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-none pb-10 p-10 bg-muted/20">
            <div className="flex items-center gap-8">
              <div>
                <CardTitle className="text-2xl font-extrabold font-manrope">Gelir eğilimi</CardTitle>
                <p className="text-sm text-slate-500 font-medium mt-1">Günlük finansal performans ve operasyonel ivme</p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="flex gap-10">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Net ciro</span>
                      <span className="text-lg font-extrabold text-foreground">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                  </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
                <Activity className="h-5 w-5 text-primary" strokeWidth={2.5} />
                <span className="text-xs font-bold text-slate-600">Canlı Veri</span>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
             <div className="h-[300px]">
                <SalesTrendChart data={salesTrend} />
             </div>
          </CardContent>
        </Card>

        <LiveActivityFeed activity={liveActivity} />
      </div>

      {/* Operational Overview & Predictive Insights */}
      <div className="grid gap-10 lg:grid-cols-3 grid-cols-1">
        <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-black/40 overflow-hidden group rounded-2xl bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between border-none p-10 pb-4">
            <div>
              <CardTitle className="text-xl font-extrabold font-manrope">Servis dağılımı</CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-1">Durum bazlı anlık cihaz yükü dağılımı</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shadow-primary/5">
                <Target className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-6">
             <div className="h-[300px]">
                <ServiceStatusChart data={serviceMetrics} />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-10">
                <span className="text-5xl font-extrabold block text-foreground drop-shadow-none font-manrope">{totalServiceUnits}</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kuyruk</span>
             </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            <SmartInsights stats={statsData} />
        </div>
      </div>
    </div>
  );
}
