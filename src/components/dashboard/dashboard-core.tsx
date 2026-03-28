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

export function DashboardCore({
  statsData,
  recentTicketsRaw,
  recentTransactions,
  topProducts,
  salesTrend,
  serviceMetricsRaw,
  liveActivity,
  profitMatrix,
  title = "Komuta Merkezi",
  subtitle = "Operasyonel kontrol ve anlık iş zekası raporu",
  showFullDetails = true
}: any) {
  const serviceMetrics = serviceMetricsRaw.map((m: any) => ({
    ...m,
    name: statusLabels[m.name] || m.name,
    color: statusColors[m.name] || "#cbd5e1"
  }));

  const totalServiceUnits = serviceMetricsRaw.reduce((acc: number, m: any) => acc + m.value, 0);

  const stats = [
    { label: "Günlük satış", value: statsData?.todaySales || "₺0", icon: ShoppingCart, accent: "primary", colorClass: "text-primary", bgClass: "bg-primary/10", trend: "+12%" },
    { label: "Tamir gelirleri", value: statsData?.todayRepairIncome || "₺0", icon: Wrench, accent: "secondary", colorClass: "text-secondary", bgClass: "bg-secondary/10", trend: "+8%" },
    { label: "Tahsilatlar", value: statsData?.collectedPayments || "₺0", icon: Banknote, accent: "tertiary", colorClass: "text-amber-500", bgClass: "bg-amber-500/10" },
    { label: "Bekleyen servisler", value: statsData?.pendingServices || "0", icon: Clock, accent: "primary", colorClass: "text-blue-500", bgClass: "bg-blue-500/10", badge: "Acil" },
    { label: "Hazır cihazlar", value: statsData?.readyDevices || "0", icon: CheckCircle2, accent: "secondary", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { label: "Kritik stok", value: statsData?.criticalStock || "0", icon: AlertTriangle, accent: "destructive", colorClass: "text-rose-500", bgClass: "bg-rose-500/10", badge: "Kritik" },
    { label: "Toplam borçlar", value: statsData?.totalDebts || "₺0", icon: ArrowDownCircle, accent: "primary", colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10" },
    { label: "Kasa bakiyesi", value: statsData?.cashBalance || "₺0", icon: Wallet, accent: "primary", colorClass: "text-primary", bgClass: "bg-primary/10" },
  ];

  return (
    <div className="flex flex-col gap-12 pb-24 bg-background text-foreground min-h-screen lg:p-14 p-8 font-sans">
      {/* Editorial Header Section - Reference: Image 2 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground font-sans">
            Panel Özeti
          </h1>
          <p className="text-[15px] text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Atölyenizin operasyonel sağlığını ve finansal performansını gerçek zamanlı izleyin, veriye dayalı kararlar alın.
          </p>
        </div>
        <div className="flex items-center gap-6 bg-card border border-border/50 px-6 py-4 rounded-[1.5rem] shadow-sm">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-muted-foreground leading-none mb-1.5">SİSTEM DURUMU</span>
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-sm font-bold text-emerald-500">Aktif ve Stabil</span>
            </div>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-muted-foreground leading-none mb-1.5">GÜNCELLEME</span>
            <span className="text-sm font-bold text-foreground">ANLIK</span>
          </div>
        </div>
      </div>

      {/* 8 Luminous Stats Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className={cn(
            "rounded-[2.5rem] bg-card border border-border/40 transition-all duration-500 hover:-translate-y-3 group relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/40 hover:shadow-2xl hover:shadow-primary/5"
          )}>
            <CardContent className="p-10 flex flex-col justify-between min-h-[260px] relative z-10">
              {/* Background Ghost Icon */}
              <stat.icon className="absolute top-6 right-6 h-28 w-28 opacity-[0.03] -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

              <div className="flex items-center justify-between relative">
                <div className={cn(
                  "p-4 rounded-2xl border border-border/50 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                  stat.bgClass
                )}>
                  <stat.icon className={cn("h-8 w-8", stat.colorClass)} />
                </div>
                <div className="flex flex-col items-end">
                  {stat.trend && (
                    <span className="text-[11px] font-bold bg-muted px-4 py-1.5 rounded-full border border-border/50 text-secondary-foreground/80">
                      {stat.trend}
                    </span>
                  )}
                  {stat.badge && (
                    <span className={cn(
                      "text-[11px] font-bold px-4 py-1.5 rounded-full border border-border/50",
                      stat.colorClass,
                      stat.bgClass
                    )}>
                      {stat.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-12 relative">
                <p className="text-[11px] font-bold mb-3 text-muted-foreground tracking-[0.2em]">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                    <RevealFinancial amount={stat.value} className={cn("text-5xl font-bold font-sans", stat.colorClass)} />
                  ) : (
                    <h3 className={cn("text-6xl font-bold font-sans", stat.colorClass)}>{stat.value}</h3>
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
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-8 p-10 bg-muted/10">
            <div className="flex items-center gap-8">
              <div>
                <CardTitle className="text-2xl font-bold font-sans">Gelir Analizi</CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-1">Son 30 günlük trend ve büyüme verileri.</p>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div className="flex gap-12">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-muted-foreground tracking-[0.2em] mb-1">Toplam gelir</span>
                  <span className="text-xl font-bold text-foreground">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-muted-foreground tracking-[0.2em] mb-1">Net kar</span>
                  <span className="text-xl font-bold text-secondary">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
              <Activity className="h-5 w-5 text-primary" strokeWidth={2.5} />
              <span className="text-xs font-bold text-slate-600">Canlı Veri</span>
            </div>
          </CardHeader>
          <CardContent className="pt-8 w-full">
            <SalesTrendChart data={salesTrend} />
          </CardContent>
        </Card>

        <LiveActivityFeed activity={liveActivity} />
      </div>

      {/* Operational Overview & Predictive Insights */}
      <div className="grid gap-10 lg:grid-cols-3 grid-cols-1">
        <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-black/40 overflow-hidden group rounded-2xl bg-card border border-border/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl">
          <CardHeader className="flex flex-row items-center justify-between border-none p-10 pb-4">
            <div>
              <CardTitle className="text-xl font-extrabold font-sans">Servis kapasite analizi</CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1 font-bold">Anlık iş yükü ve kuyruk dağılımı</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-6 w-full">
            <ServiceStatusChart data={serviceMetrics} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-10 pointer-events-none">
              <span className="text-5xl font-extrabold block text-foreground drop-shadow-none font-sans">{totalServiceUnits}</span>
              <span className="text-xs text-muted-foreground font-bold">Cihaz yükü</span>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <SmartInsights stats={statsData} />
        </div>
      </div>

      {showFullDetails && (
        <>
          {/* Operational Hub */}
          <div className="grid gap-6 lg:grid-cols-2 grid-cols-1">
            {/* Recent Transactions Table */}
            <Card className="border border-border/5 shadow-2xl shadow-slate-200/40 overflow-hidden rounded-2xl bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                    <History className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Finansal kayıtlar</CardTitle>
                    <p className="text-[13px] text-muted-foreground font-medium mt-1">Gerçek zamanlı işlemler</p>
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
                      <tr className="text-[12px] font-bold text-muted-foreground bg-muted/20 tracking-[0.1em]">
                        <th className="px-8 py-5">Müşteri & Tarih</th>
                        <th className="px-6 py-5">İşlem Detayı</th>
                        <th className="px-6 py-5">Net Tutar</th>
                        <th className="px-8 py-5 text-right">Durum sınıfı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((t: any, idx: number) => (
                        <tr key={t.id} className={cn(
                          "text-sm group transition-all duration-300",
                          idx % 2 === 0 ? "bg-transparent" : "bg-slate-50 dark:bg-white/[0.03]"
                        )}>
                          <td className="px-8 py-6">
                            <div className="font-bold text-foreground text-[14px] group-hover:text-primary transition-colors">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                            <div className="text-[11px] text-muted-foreground font-bold mt-1">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                          </td>
                          <td className="px-6 py-6 text-[13px] text-foreground/80 font-medium">{t.description}</td>
                          <td className="px-6 py-6">
                            <RevealFinancial amount={t.amount} className="text-sm font-bold" />
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold border-none px-4 py-1.5 rounded-full shadow-sm",
                              t.type === 'INCOME' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'
                            )}>
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
            <Card className="border border-border/5 shadow-2xl shadow-slate-200/40 overflow-hidden rounded-2xl bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Servis kuyruğu</CardTitle>
                    <p className="text-[13px] text-muted-foreground font-medium mt-1">İşlemdeki son cihazlar</p>
                  </div>
                </div>
                <Link href="/servis/liste">
                  <Button variant="ghost" className="text-xs font-bold text-primary hover:bg-primary/10 group h-10 rounded-2xl px-6 transition-all">
                    Kuyruğu yönet <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 p-8">
                {(recentTicketsRaw ?? []).map((ticket: any, idx: number) => (
                  <div key={ticket.id} className={cn(
                    "flex items-center justify-between p-6 rounded-3xl group transition-all duration-300 shadow-none border-none",
                    idx % 2 === 0 ? "bg-slate-50 dark:bg-white/[0.03]" : "bg-transparent"
                  )}>
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform relative shadow-inner">
                        <Smartphone className="h-8 w-8 text-primary" />
                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-secondary border-4 border-white dark:border-slate-900 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors font-sans">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                        <p className="text-xs text-muted-foreground font-bold mt-1.5">
                          {ticket.customer?.name} • <span className="text-primary font-bold">#{ticket.ticketNumber}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold border-none mb-2 px-5 py-2 rounded-2xl"
                        style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}
                      >
                        {statusLabels[ticket.status]}
                      </Badge>
                      <p className="text-[11px] text-muted-foreground font-bold">
                        {ticket.technician?.name || "Atanmamış"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top Products Grid */}
          <Card className="border border-border/5 shadow-2xl shadow-slate-200/40 overflow-hidden mt-4 rounded-2xl bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Trend ürünler</CardTitle>
                  <p className="text-xs text-muted-foreground font-medium mt-1">En çok talep gören stok kalemleri</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {(topProducts ?? []).map((product: any) => (
                  <div key={product.id} className="flex flex-col gap-4 group">
                    <div className="aspect-square rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:bg-muted/80 transition-all relative overflow-hidden">
                      <Package className="h-16 w-16 text-muted-foreground/30 group-hover:text-primary/30 group-hover:scale-110 transition-transform" />
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
        </>
      )}
    </div>
  );
}
