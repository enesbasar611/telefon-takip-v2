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
  PENDING: "BEKLEMEDE",
  APPROVED: "ONAYLANDI",
  REPAIRING: "TAMİRDE",
  WAITING_PART: "PARÇA BEKLİYOR",
  READY: "HAZIR",
  DELIVERED: "TESLİM EDİLDİ",
  CANCELLED: "İPTAL EDİLDİ",
};

export default async function DashboardOzetPage() {
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
    { label: "GÜNLÜK SATIŞ", value: statsData.todaySales, icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/10", trend: "+12%" },
    { label: "TAMİR GELİRLERİ", value: statsData.todayRepairIncome, icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/10", trend: "+8%" },
    { label: "TAHSİLATLAR", value: statsData.collectedPayments, icon: Banknote, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/10" },
    { label: "BEKLEYEN SERVİSLER", value: statsData.pendingServices, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/10", badge: "URGENT" },
    { label: "HAZIR CİHAZLAR", value: statsData.readyDevices, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/10" },
    { label: "KRİTİK STOK UYARILARI", value: statsData.criticalStock, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/10", badge: "CRITICAL" },
    { label: "TOPLAM BORÇLAR", value: statsData.totalDebts, icon: ArrowDownCircle, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/10" },
    { label: "KASA BAKİYESİ", value: statsData.cashBalance, icon: Wallet, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/10" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-20 bg-[#020617] text-white min-h-screen lg:p-8 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-blue-sm">
                <LayoutDashboard className="h-6 w-6 text-blue-500" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase">Komuta <span className="text-blue-500">Merkezi</span></h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1 italic">Operasyonel Kontrol ve Canlı Analitik</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex flex-col text-right mr-4">
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">SİSTEM DURUMU</span>
                 <div className="flex items-center gap-2 justify-end">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/20" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Aktif ve Stabil</span>
                 </div>
             </div>
        </div>
      </div>

      {/* 8 Stats Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="matte-card hover:bg-slate-900/40 group overflow-hidden relative border-slate-800/50">
            <div className={`absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full ${stat.bg}`} />
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl border ${stat.border} shadow-sm group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    {stat.trend && (
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-blue-sm">
                        {stat.trend}
                    </span>
                    )}
                    {stat.badge && (
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-blue-sm ${stat.badge === 'URGENT' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                        {stat.badge}
                    </span>
                    )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                    {typeof stat.value === 'string' && stat.value.includes('₺') ? (
                        <RevealFinancial amount={stat.value} className="text-2xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors" />
                    ) : (
                        <h3 className="text-2xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">{stat.value}</h3>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Center & Live Control */}
      <div className="grid gap-8 lg:grid-cols-3 grid-cols-1">
        {/* Sales Trend Bar Chart */}
        <Card className="lg:col-span-2 matte-card border-slate-800/50 overflow-hidden group w-full">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 bg-slate-900/20">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Gelir Analizi & Tahminleme</CardTitle>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Günlük finansal performans eğrisi</p>
            </div>
            <div className="flex items-center gap-2 bg-[#0a0a0b] px-3 py-1.5 rounded-xl border border-white/5">
                <Activity className="h-3 w-3 text-blue-500" />
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Son 7 Gün</span>
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
        {/* Service Metrics Chart */}
        <Card className="matte-card border-slate-800/50 overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 bg-slate-900/20">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Servis Kapasite Analizi</CardTitle>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">İş yükü dağılımı ve verimlilik</p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-blue-sm">
                <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-8">
             <div className="h-[250px]">
                <ServiceStatusChart data={serviceMetrics} />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-8">
                <span className="text-4xl font-black block text-white drop-shadow-2xl">{totalServiceUnits}</span>
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Cihaz Yükü</span>
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
        <Card className="matte-card border-slate-800/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 bg-slate-900/20">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-blue-sm">
                    <History className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Finansal Kayıtlar</CardTitle>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Gerçek zamanlı işlemler</p>
                </div>
            </div>
            <Link href="/finans">
                <Button variant="ghost" className="text-[10px] font-black uppercase text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 group h-8 rounded-xl px-4 transition-all">
                    Arşive Git <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/[0.03] bg-white/[0.01]">
                    <th className="px-8 py-5">Müşteri & Tarih</th>
                    <th className="px-6 py-5">İşlem Detayı</th>
                    <th className="px-6 py-5">Net Tutar</th>
                    <th className="px-8 py-5 text-right">Durum Sınıfı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {recentTransactions.map((t: any) => (
                    <tr key={t.id} className="text-sm group hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black text-white text-xs uppercase tracking-tight group-hover:text-blue-400 transition-colors">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                        <div className="text-[9px] text-gray-600 font-bold uppercase mt-0.5">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                      </td>
                      <td className="px-6 py-5 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t.description}</td>
                      <td className="px-6 py-5">
                         <RevealFinancial amount={t.amount} className="text-sm font-black text-white" />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Badge variant="outline" className={`text-[9px] font-black uppercase border-none px-3 py-1.5 rounded-xl shadow-blue-sm ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-500 shadow-rose-500/5'}`}>
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
        <Card className="matte-card border-slate-800/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 bg-slate-900/20">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-blue-sm">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Servis Kuyruğu</CardTitle>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">İşlemdeki son cihazlar</p>
                </div>
            </div>
            <Link href="/servis/liste">
                <Button variant="ghost" className="text-[10px] font-black uppercase text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 group h-8 rounded-xl px-4 transition-all">
                    Kuyruğu Yönet <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pt-8 pb-8">
            {recentTicketsRaw.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-5 bg-white/[0.02] whisper-border border-white/5 rounded-3xl group hover:bg-white/[0.04] hover:border-white/10 transition-all shadow-xl">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform relative">
                    <Smartphone className="h-7 w-7 text-blue-500" />
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse border-2 border-[#141416] shadow-blue-sm" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">
                      {ticket.customer?.name} • <span className="text-blue-400 italic">#{ticket.ticketNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black uppercase border-none mb-2 px-4 py-1.5 rounded-xl shadow-lg"
                    style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}
                  >
                    {statusLabels[ticket.status]}
                  </Badge>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] italic">
                    {ticket.technician?.name || "ATANMAMIŞ"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Grid */}
      <Card className="matte-card border-slate-800/50 overflow-hidden mt-4">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 bg-slate-900/20">
          <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-blue-sm">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Trend Ürünler</CardTitle>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">En çok talep gören stok kalemleri</p>
              </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {topProducts.map((product: any) => (
              <div key={product.id} className="flex flex-col gap-4 group">
                <div className="aspect-square rounded-[2rem] bg-white/[0.02] whisper-border border-white/5 flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-blue-500/20 transition-all relative shadow-2xl overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Package className="h-16 w-16 text-gray-800 group-hover:text-blue-500/40 group-hover:scale-110 transition-transform" />
                   {product.stock <= product.criticalStock && (
                      <div className="absolute top-4 right-4 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-xl shadow-rose-500/20 uppercase tracking-widest">AZALAN STOK</div>
                   )}
                </div>
                <div>
                  <h4 className="font-black text-sm truncate text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{product.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                     {product.category} <span className="h-1 w-1 rounded-full bg-gray-700" /> {product.sales} Satış
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-black text-blue-500 tracking-tighter shadow-blue-sm">₺{product.price.toLocaleString('tr-TR')}</span>
                    <Badge variant="outline" className="text-[8px] font-black text-emerald-500 uppercase tracking-widest border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 rounded-lg">Stokta Var</Badge>
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
