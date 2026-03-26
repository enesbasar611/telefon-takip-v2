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
  PENDING: "#94a3b8",      // Grey
  APPROVED: "#3b82f6",     // Blue
  REPAIRING: "#3b82f6",    // Orange
  WAITING_PART: "#8b5cf6", // Purple
  READY: "#10b981",        // Green
  DELIVERED: "#059669",    // Dark Green
  CANCELLED: "#ef4444",    // Red
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
  const recentTicketsRaw = await getRecentServiceTickets();
  const recentTransactions = await getRecentTransactions();
  const topProducts = await getTopSellingProducts();
  const salesTrend = await getSalesReport();
  const serviceMetricsRaw = await getServiceMetrics();
  const liveActivity = await getLiveActivity();

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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
                <LayoutDashboard className="h-7 w-7 text-blue-500" />
            </div>
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Özet rapor</h1>
                <p className="text-xs text-muted-foreground font-medium mt-1">İşletme genel durum analizi</p>
            </div>
        </div>
      </div>

      {/* 8 Stats Cards Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className={cn(
            "rounded-[2rem] border-none transition-all duration-300 hover:translate-y-[-4px]",
            stat.bg,
            idx < 3 || idx === 7 ? "text-white shadow-lg shadow-black/5" : "text-foreground border border-border shadow-sm bg-card"
          )}>
            <CardContent className="p-10 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div className={cn(
                    "p-4 rounded-[1.25rem] border",
                    idx < 3 || idx === 7 ? "bg-white/10 border-white/10" : "bg-muted border-border"
                )}>
                  <stat.icon className={cn("h-7 w-7", idx < 3 || idx === 7 ? "text-white" : stat.color)} />
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

              <div className="mt-10 relative z-10">
                <p className={cn(
                    "text-sm font-medium mb-3 opacity-60",
                    idx < 3 || idx === 7 ? "text-white" : "text-muted-foreground"
                )}>{stat.label}</p>
                <div className="flex items-baseline gap-2">
                    {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                        <RevealFinancial amount={stat.value} className="text-4xl font-extrabold tracking-tight" />
                    ) : (
                        <h3 className="text-4xl font-extrabold tracking-tight">{stat.value}</h3>
                    )}
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Center & Live Control */}
      <div className="grid gap-8 lg:grid-cols-3 grid-cols-1">
        {/* Sales Trend Bar Chart */}
        <Card className="lg:col-span-2 matte-card border-border shadow-sm overflow-hidden group w-full bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-8 p-8">
            <div>
              <CardTitle className="text-lg font-bold">Gelir eğilimi</CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">Günlük finansal performans</p>
            </div>
            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-2xl border border-border">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-muted-foreground">Son 7 gün</span>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
             <div className="h-[300px]">
                <SalesTrendChart data={salesTrend} />
             </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <LiveActivityFeed activity={liveActivity} />
      </div>

      {/* Operational Overview & Predictive Insights */}
      <div className="grid gap-8 lg:grid-cols-3 grid-cols-1">
        {/* Service Capacity Donut Chart */}
        <Card className="matte-card border-border shadow-sm overflow-hidden group rounded-[2rem] bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
            <div>
              <CardTitle className="text-lg font-bold">Servis dağılımı</CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">Durum bazlı cihaz yükü</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
                <Target className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-10">
             <div className="h-[300px]">
                <ServiceStatusChart data={serviceMetrics} />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-10">
                <span className="text-5xl font-extrabold block text-foreground drop-shadow-none">{totalServiceUnits}</span>
                <span className="text-xs text-muted-foreground font-bold">Toplam cihaz</span>
             </div>
          </CardContent>
        </Card>

        {/* Predictive Smart Insights */}
        <div className="lg:col-span-2">
            <SmartInsights stats={statsData} />
        </div>
      </div>
    </div>
  );
}
