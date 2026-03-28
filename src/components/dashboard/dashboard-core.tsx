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
    status: m.name, // Orijinal status key'i sakla
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
    <div className="flex flex-col gap-10 pb-24 bg-background text-foreground min-h-screen lg:px-14 px-6 pt-10 font-sans">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans uppercase">
              KOMUTA MERKEZİ
            </h1>
          </div>
          <p className="text-[15px] text-muted-foreground font-semibold max-w-2xl leading-relaxed opacity-80">
            Operasyonel akış ve finansal performans verileri • {format(new Date(), "d MMMM yyyy", { locale: tr })}
          </p>
        </div>

        <div className="flex items-center gap-5 bg-card/40 backdrop-blur-md border border-border/40 p-1 rounded-[1.8rem] shadow-sm">
          <div className="flex items-center gap-4 px-5 py-3 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-600/70 tracking-tighter uppercase leading-none mb-1">Sistem Durumu</span>
              <span className="text-xs font-black text-emerald-600 tracking-tight">AKTİF & STABİL</span>
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter uppercase leading-none mb-1">Veri Akışı</span>
              <span className="text-xs font-black text-foreground tracking-tight uppercase">Gerçek Zamanlı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modernized Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className={cn(
            "rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/5"
          )}>
            <CardContent className="p-8 flex flex-col justify-between min-h-[220px] relative z-10 font-sans">
              <stat.icon className="absolute -bottom-4 -right-4 h-32 w-32 opacity-[0.03] -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

              <div className="flex items-start justify-between relative">
                <div className={cn(
                  "p-3.5 rounded-2xl border border-white/5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                  stat.bgClass
                )}>
                  <stat.icon className={cn("h-7 w-7", stat.colorClass)} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  {stat.trend && (
                    <span className="text-[10px] font-black bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-500 tracking-tighter uppercase">
                      {stat.trend} Δ
                    </span>
                  )}
                  {stat.badge && (
                    <span className={cn(
                      "text-[10px] font-black px-3 py-1.5 rounded-full border border-border/50 tracking-tighter uppercase shadow-sm",
                      stat.colorClass,
                      stat.bgClass
                    )}>
                      {stat.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 relative">
                <p className="text-[10px] font-black mb-2 text-muted-foreground/60 tracking-[0.2em] uppercase">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                    <RevealFinancial amount={stat.value} className={cn("text-4xl font-black tracking-tight", stat.colorClass)} />
                  ) : (
                    <h3 className={cn("text-5xl font-black tracking-tighter", stat.colorClass)}>{stat.value}</h3>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Center & Live Control */}
      <div className="grid gap-8 lg:grid-cols-3 grid-cols-1">
        <Card className="lg:col-span-2 shadow-xl border-border/40 overflow-hidden group w-full bg-card rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 p-8 bg-muted/5">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-black tracking-tight font-sans uppercase">Gelir Analizi</CardTitle>
                <p className="text-xs text-muted-foreground font-bold opacity-70 uppercase tracking-wider">Son 30 Günlük Performans</p>
              </div>
              <div className="h-10 w-px bg-border/40 hidden md:block" />
              <div className="hidden md:flex gap-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground/60 tracking-[0.2em] mb-1 uppercase">Brüt Gelir</span>
                  <span className="text-lg font-black text-foreground tracking-tight">₺{profitMatrix.totalRevenue.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground/60 tracking-[0.2em] mb-1 uppercase">Net Kâr</span>
                  <span className="text-lg font-black text-secondary tracking-tight">₺{profitMatrix.totalNetProfit.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20">
              <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Canlı Analitik</span>
            </div>
          </CardHeader>
          <CardContent className="p-8 w-full">
            <SalesTrendChart data={salesTrend} />
          </CardContent>
        </Card>

        <LiveActivityFeed activity={liveActivity} />
      </div>

      {/* Operational Overview & Predictive Insights */}
      <div className="grid gap-8 lg:grid-cols-3 grid-cols-1">
        <Card className="shadow-xl overflow-hidden group rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-black tracking-tight font-sans uppercase">Servis Durumu</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Kapasite Analizi</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-2xl font-black text-foreground leading-none">{totalServiceUnits}</div>
              <div className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">Cihaz</div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-2">
            <ServiceStatusChart data={serviceMetrics} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 shadow-xl rounded-[2rem] overflow-hidden">
          <SmartInsights stats={statsData} />
        </div>
      </div>

      {showFullDetails && (
        <>
          {/* Operational Hub */}
          <div className="grid gap-8 lg:grid-cols-2 grid-cols-1">
            {/* Recent Transactions Table */}
            <Card className="border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                    <History className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight font-sans uppercase">Finansal Kayıtlar</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">Son İşlemler</p>
                  </div>
                </div>
                <Link href="/finans">
                  <Button variant="outline" className="text-[10px] font-black uppercase tracking-tighter text-blue-500 border-blue-500/20 hover:bg-blue-500/5 h-9 rounded-xl px-5 transition-all">
                    TÜMÜ <ChevronRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-muted-foreground/60 bg-muted/20 tracking-[.15em] uppercase">
                        <th className="px-8 py-4">Müşteri / Zaman</th>
                        <th className="px-6 py-4 border-none lg:table-cell hidden">Detay</th>
                        <th className="px-6 py-4">Tutar</th>
                        <th className="px-8 py-4 text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {recentTransactions.map((t: any, idx: number) => (
                        <tr key={t.id} className="group hover:bg-muted/10 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-bold text-foreground text-sm tracking-tight">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                            <div className="text-[9px] font-black text-muted-foreground/60 mt-1 uppercase tracking-tight">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                          </td>
                          <td className="px-6 py-5 text-xs text-muted-foreground font-bold lg:table-cell hidden max-w-[150px] truncate">{t.description}</td>
                          <td className="px-6 py-5">
                            <RevealFinancial amount={t.amount} className="text-sm font-black tracking-tight" />
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Badge variant="outline" className={cn(
                              "text-[8px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg border-none",
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
            <Card className="border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight font-sans uppercase">Servis Kuyruğu</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">Aktif İş Emreleri</p>
                  </div>
                </div>
                <Link href="/servis/liste">
                  <Button variant="outline" className="text-[10px] font-black uppercase tracking-tighter text-primary border-primary/20 hover:bg-primary/5 h-9 rounded-xl px-5 transition-all">
                    YÖNET <ChevronRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {(recentTicketsRaw ?? []).map((ticket: any) => (
                  <Link
                    key={ticket.id}
                    href={`/servis/liste?status=${ticket.status}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/5 group hover:border-primary/20 hover:bg-card transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm relative shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="h-7 w-7 text-primary/80" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-foreground tracking-tight truncate font-sans uppercase group-hover:text-primary transition-colors">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight mt-1 truncate">
                          {ticket.customer?.name} • <span className="text-primary tracking-tighter">#{ticket.ticketNumber}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[8px] font-black uppercase tracking-tighter border-none px-3 py-1 rounded-lg mb-1"
                        style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}
                      >
                        {statusLabels[ticket.status]}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                        {ticket.technician?.name || "BOŞTA"}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top Products Grid */}
          <Card className="border border-border/40 shadow-xl overflow-hidden rounded-[2.5rem] bg-card mt-2 transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tight font-sans uppercase">Trend Ürünler</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">En Çok Tercih Edilenler</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {(topProducts ?? []).map((product: any) => (
                  <div key={product.id} className="group relative bg-muted/10 p-5 rounded-[1.8rem] border border-transparent hover:border-primary/10 transition-all">
                    <div className="aspect-square rounded-[1.5rem] bg-card border border-border/40 flex items-center justify-center mb-5 relative overflow-hidden group-hover:shadow-lg transition-all">
                      <Package className="h-14 w-14 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                      {product.stock <= product.criticalStock && (
                        <div className="absolute top-4 left-4 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg">KRİTİK STOK</div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="min-h-[44px]">
                        <h4 className="font-black text-sm text-foreground tracking-tight line-clamp-2 uppercase font-sans leading-tight">{product.name}</h4>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-70">{product.category}</p>
                      </div>
                      <div className="flex items-end justify-between pt-2 border-t border-border/20">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">Birim Fiyat</span>
                          <span className="text-xl font-black text-blue-500 tracking-tighter">₺{product.price.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block mb-1">Satış</span>
                          <span className="text-xs font-black text-foreground">{product.sales} ADET</span>
                        </div>
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
