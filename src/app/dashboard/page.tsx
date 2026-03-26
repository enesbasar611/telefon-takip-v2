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
import { cn } from "@/lib/utils";
import { getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";
import { getLiveActivity } from "@/lib/actions/live-actions";
import { getProfitMatrix, getTopRepairedModels } from "@/lib/actions/analytics-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed";
import { SmartInsights } from "@/components/dashboard/smart-insights";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";

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

export default async function DashboardOzetPage() {
  const statsData = await getDashboardStats();
  const recentTicketsRaw = await getRecentServiceTickets();
  const recentTransactions = await getRecentTransactions();
  const topProducts = await getTopSellingProducts();
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
    { label: "Günlük satış", value: statsData?.todaySales || "₺0", icon: ShoppingCart, color: "text-white", bg: "bg-blue-600", trend: "+12%" },
    { label: "Tamir gelirleri", value: statsData?.todayRepairIncome || "₺0", icon: Wrench, color: "text-white", bg: "bg-emerald-600", trend: "+8%" },
    { label: "Tahsilatlar", value: statsData?.collectedPayments || "₺0", icon: Banknote, color: "text-white", bg: "bg-amber-600" },
    { label: "Bekleyen servisler", value: statsData?.pendingServices || "0", icon: Clock, color: "text-blue-500", bg: "bg-card", badge: "Acil" },
    { label: "Hazır cihazlar", value: statsData?.readyDevices || "0", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-card" },
    { label: "Kritik stok", value: statsData?.criticalStock || "0", icon: AlertTriangle, color: "text-rose-500", bg: "bg-card", badge: "Kritik" },
    { label: "Toplam borçlar", value: statsData?.totalDebts || "₺0", icon: ArrowDownCircle, color: "text-blue-500", bg: "bg-card" },
    { label: "Kasa bakiyesi", value: statsData?.cashBalance || "₺0", icon: Wallet, color: "text-white", bg: "bg-slate-900 dark:bg-slate-950" },
  ];

  if (!statsData) return <div className="p-12 text-center text-muted-foreground animate-pulse">Analitik veriler hazırlanıyor...</div>;

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
                <LayoutDashboard className="h-7 w-7 text-blue-500" />
            </div>
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Komuta merkezi</h1>
                <p className="text-xs text-muted-foreground font-medium mt-1">Operasyonel kontrol ve canlı analitik</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex flex-col text-right">
                 <span className="text-[10px] font-bold text-muted-foreground">Sistem durumu</span>
                 <div className="flex items-center gap-2 justify-end mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-500">Aktif ve stabil</span>
                 </div>
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
            <div className="flex items-center gap-6">
              <div>
                <CardTitle className="text-lg font-bold">Net kar analizi</CardTitle>
                <p className="text-xs text-muted-foreground font-medium mt-1">Bu ayki finansal verimlilik performansı</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex gap-8">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground">Toplam gelir</span>
                      <span className="text-sm font-bold">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground">Net kar</span>
                      <span className="text-sm font-bold text-emerald-500">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
                  </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-2xl border border-border">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-muted-foreground">Bu ay</span>
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
              <CardTitle className="text-lg font-bold">Servis kapasite analizi</CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">İş yükü dağılımı ve verimlilik</p>
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
                <span className="text-xs text-muted-foreground font-bold">Cihaz yükü</span>
             </div>
          </CardContent>
        </Card>

        {/* Predictive Smart Insights */}
        <div className="lg:col-span-2">
            <SmartInsights stats={statsData} />
        </div>
      </div>

      {/* Operational Hub */}
      <div className="grid gap-8 lg:grid-cols-2 grid-cols-1">
        {/* Recent Transactions Table */}
        <Card className="matte-card border-border shadow-sm overflow-hidden rounded-[2rem] bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 ">
                    <History className="h-5 w-5 text-emerald-500" />
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
                  <tr className="text-[10px] font-bold text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-8 py-5">Müşteri & Tarih</th>
                    <th className="px-6 py-5">İşlem Detayı</th>
                    <th className="px-6 py-5">Net Tutar</th>
                    <th className="px-8 py-5 text-right">Durum sınıfı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTransactions.map((t: any) => (
                    <tr key={t.id} className="text-sm group hover:bg-muted/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-foreground text-xs group-hover:text-blue-500 transition-colors">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                        <div className="text-[9px] text-muted-foreground font-bold mt-0.5">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                      </td>
                      <td className="px-6 py-5 text-[10px] text-muted-foreground font-bold">{t.description}</td>
                      <td className="px-6 py-5">
                         <RevealFinancial amount={t.amount} className="text-sm font-bold" />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Badge variant="outline" className={`text-[9px] font-bold border-none px-3 py-1.5 rounded-xl ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-500 shadow-rose-500/5'}`}>
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

        {/* Recent Service Tickets List */}
        <Card className="matte-card border-border shadow-sm overflow-hidden rounded-[2rem] bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
                    <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold">Servis kuyruğu</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-1">İşlemdeki son cihazlar</p>
                </div>
            </div>
            <Link href="/servis/liste">
                <Button variant="ghost" className="text-xs font-bold text-blue-500 hover:bg-blue-500/10 group h-10 rounded-2xl px-6 transition-all border border-blue-500/10">
                    Kuyruğu yönet <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-5 p-8">
            {(recentTicketsRaw ?? []).map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-6 bg-muted/30 border border-border rounded-[2rem] group hover:bg-muted/50 transition-all">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.25rem] bg-muted border border-border flex items-center justify-center group-hover:scale-105 transition-transform relative">
                    <Smartphone className="h-8 w-8 text-blue-500" />
                    <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-4 border-background" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-blue-500 transition-colors">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-1.5">
                      {ticket.customer?.name} • <span className="text-blue-500 italic">#{ticket.ticketNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-none mb-2 px-5 py-2 rounded-2xl"
                    style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}
                  >
                    {statusLabels[ticket.status]}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground font-bold italic">
                    {ticket.technician?.name || "Atanmamış"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Grid */}
      <Card className="matte-card border-border shadow-sm overflow-hidden mt-4 rounded-[2rem] bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
          <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                  <CardTitle className="text-lg font-bold">Trend ürünler</CardTitle>
                  <p className="text-xs text-muted-foreground font-medium mt-1">En çok talep gören stok kalemleri</p>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {(topProducts ?? []).map((product: any) => (
              <div key={product.id} className="flex flex-col gap-6 group">
                <div className="aspect-square rounded-[2.5rem] bg-muted border border-border flex items-center justify-center group-hover:bg-muted/80 transition-all relative overflow-hidden">
                   <Package className="h-20 w-20 text-muted-foreground/30 group-hover:text-blue-500/30 group-hover:scale-110 transition-transform" />
                   {product.stock <= product.criticalStock && (
                      <div className="absolute top-6 right-6 bg-rose-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-2xl">Azalan stok</div>
                   )}
                </div>
                <div>
                  <h4 className="font-bold text-base truncate text-foreground group-hover:text-blue-500 transition-colors">{product.name}</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-2 flex items-center gap-3">
                     {product.category} <span className="h-1 w-1 rounded-full bg-border" /> {product.sales} satış
                  </p>
                  <div className="flex items-center justify-between mt-5">
                    <span className="text-xl font-extrabold text-blue-500">₺{product.price.toLocaleString('tr-TR')}</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 border-emerald-500/10 bg-emerald-500/5 px-4 py-1.5 rounded-2xl">Stokta var</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
