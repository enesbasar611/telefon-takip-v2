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
  title = "Komuta merkezi",
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
    { label: "Günlük satış", value: statsData?.todaySales || "₺0", icon: ShoppingCart, color: "text-white", bg: "bg-blue-600", trend: "+12%" },
    { label: "Tamir gelirleri", value: statsData?.todayRepairIncome || "₺0", icon: Wrench, color: "text-white", bg: "bg-emerald-600", trend: "+8%" },
    { label: "Tahsilatlar", value: statsData?.collectedPayments || "₺0", icon: Banknote, color: "text-white", bg: "bg-amber-600" },
    { label: "Bekleyen servisler", value: statsData?.pendingServices || "0", icon: Clock, color: "text-blue-500", bg: "bg-card", badge: "Acil" },
    { label: "Hazır cihazlar", value: statsData?.readyDevices || "0", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-card" },
    { label: "Kritik stok", value: statsData?.criticalStock || "0", icon: AlertTriangle, color: "text-rose-500", bg: "bg-card", badge: "Kritik" },
    { label: "Toplam borçlar", value: statsData?.totalDebts || "₺0", icon: ArrowDownCircle, color: "text-blue-500", bg: "bg-card" },
    { label: "Kasa bakiyesi", value: statsData?.cashBalance || "₺0", icon: Wallet, color: "text-white", bg: "bg-slate-900 dark:bg-slate-950" },
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
                <h1 className="text-5xl font-extrabold tracking-tighter text-foreground font-manrope">{title}</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>
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

      {/* 8 Luminous Stats Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className={cn(
            "rounded-2xl border-none transition-all duration-500 hover:translate-y-[-6px] group",
            stat.bg,
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
                    idx < 3 || idx === 7 ? "text-white" : "text-slate-500"
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
                <CardTitle className="text-2xl font-extrabold font-manrope">Net kar analizi</CardTitle>
                <p className="text-sm text-slate-500 font-medium mt-1">Aylık finansal verimlilik ve büyüme projeksiyonu</p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="flex gap-10">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Toplam gelir</span>
                      <span className="text-lg font-extrabold text-foreground">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Net kar</span>
                      <span className="text-lg font-extrabold text-secondary">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
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
              <CardTitle className="text-xl font-extrabold font-manrope">Servis kapasite analizi</CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-1">Anlık iş yükü ve kuyruk dağılımı</p>
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
            <Card className="border-none shadow-2xl shadow-slate-200/40 overflow-hidden rounded-2xl bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
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
                      <tr className="text-[10px] font-bold text-muted-foreground border-b border-border bg-muted/30">
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
                          idx % 2 === 0 ? "bg-transparent" : "bg-slate-50/50 dark:bg-white/[0.02]"
                        )}>
                          <td className="px-8 py-6">
                            <div className="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                          </td>
                          <td className="px-6 py-6 text-[11px] text-slate-500 font-medium">{t.description}</td>
                          <td className="px-6 py-6">
                             <RevealFinancial amount={t.amount} className="text-sm font-black tracking-tight" />
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black border-none px-4 py-1.5 rounded-full shadow-sm",
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
            <Card className="border-none shadow-2xl shadow-slate-200/40 overflow-hidden rounded-2xl bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 ">
                        <Smartphone className="h-5 w-5 text-primary" />
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
              <CardContent className="space-y-4 p-8">
                {(recentTicketsRaw ?? []).map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-3xl group hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 shadow-sm hover:shadow-md border-none">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform relative shadow-inner">
                        <Smartphone className="h-8 w-8 text-primary" />
                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-secondary border-4 border-white dark:border-slate-900 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors font-manrope">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                        <p className="text-xs text-slate-500 font-semibold mt-1.5">
                          {ticket.customer?.name} • <span className="text-primary font-bold">#{ticket.ticketNumber}</span>
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
          <Card className="border-none shadow-2xl shadow-slate-200/40 overflow-hidden mt-4 rounded-2xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
              <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 ">
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
