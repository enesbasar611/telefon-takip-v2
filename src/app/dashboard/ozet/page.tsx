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
  Search,
  Bell,
  Settings,
  Plus
} from "lucide-react";
import {
  getDashboardStats,
  getRecentServiceTickets,
  getRecentTransactions,
  getTopSellingProducts
} from "@/lib/actions/dashboard-actions";
import { getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  PENDING: "#94a3b8",      // Grey
  APPROVED: "#3b82f6",     // Blue
  REPAIRING: "#f59e0b",    // Orange
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

  const serviceMetrics = serviceMetricsRaw.map((m: any) => ({
    ...m,
    name: statusLabels[m.name] || m.name,
    color: statusColors[m.name] || "#cbd5e1"
  }));

  const totalServiceUnits = serviceMetricsRaw.reduce((acc: number, m: any) => acc + m.value, 0);

  const stats = [
    { label: "GÜNLÜK SATIŞ", value: statsData.todaySales, icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+12%" },
    { label: "TAMİR GELİRLERİ", value: statsData.todayRepairIncome, icon: Wrench, color: "text-cyan-500", bg: "bg-cyan-500/10", trend: "+8%" },
    { label: "TAHSİLATLAR", value: statsData.collectedPayments, icon: Banknote, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "BEKLEYEN SERVİSLER", value: statsData.pendingServices, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", badge: "Urgent" },
    { label: "HAZIR CİHAZLAR", value: statsData.readyDevices, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "KRİTİK STOK UYARILARI", value: statsData.criticalStock, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", badge: "Low" },
    { label: "TOPLAM BORÇLAR", value: statsData.totalDebts, icon: ArrowDownCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "KASA BAKİYESİ", value: statsData.cashBalance, icon: Wallet, color: "text-blue-600", bg: "bg-blue-600/10" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10 bg-[#0a0a0b] text-white min-h-screen p-6">
      {/* 8 Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="bg-[#141416] border-none shadow-sm hover:ring-1 hover:ring-white/10 transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                {stat.trend && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {stat.trend}
                  </span>
                )}
                {stat.badge && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${stat.badge === 'Urgent' ? 'text-orange-500 bg-orange-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                    {stat.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gelir Analizi Bar Chart */}
        <Card className="lg:col-span-2 bg-[#141416] border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Gelir Analizi</CardTitle>
              <p className="text-xs text-gray-500">Günlük performans karşılaştırması</p>
            </div>
            <Badge variant="outline" className="bg-white/5 border-none text-[10px] text-gray-400 font-bold px-3">Son 7 Gün</Badge>
          </CardHeader>
          <CardContent>
             <SalesTrendChart data={salesTrend} />
          </CardContent>
        </Card>

        {/* Servis Durumları Donut Chart */}
        <Card className="bg-[#141416] border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Servis Durumları</CardTitle>
            <p className="text-xs text-gray-500">İş yükü dağılımı</p>
          </CardHeader>
          <CardContent className="relative">
             <div className="h-[250px]">
                <ServiceStatusChart data={serviceMetrics} />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-4">
                <span className="text-3xl font-black block">{totalServiceUnits}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Toplam Cihaz</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tables Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Son İşlemler */}
        <Card className="bg-[#141416] border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Son İşlemler</CardTitle>
            <Link href="/finans" className="text-xs font-bold text-blue-500 hover:underline">Hepsini Gör</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">İşlem</th>
                    <th className="px-6 py-4">Tutar</th>
                    <th className="px-6 py-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTransactions.map((t: any) => (
                    <tr key={t.id} className="text-sm group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{t.sale?.customer?.name || "Hızlı Satış"}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{t.description}</td>
                      <td className="px-6 py-4 font-black">₺{Number(t.amount).toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`text-[9px] font-bold uppercase border-none ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {t.type === 'INCOME' ? 'TAHSİLAT' : 'GİDER'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-xs">Son işlem bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Son Servis Kayıtları */}
        <Card className="bg-[#141416] border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Son Servis Kayıtları</CardTitle>
            <Link href="/servis/liste" className="text-xs font-bold text-blue-500 hover:underline">Tümünü Gör</Link>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {recentTicketsRaw.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl group hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {ticket.customer?.name} • <span className="text-blue-400">{ticket.problemDesc.substring(0, 20)}...</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase border-none mb-1"
                    style={{ backgroundColor: `${statusColors[ticket.status]}20`, color: statusColors[ticket.status] }}
                  >
                    {statusLabels[ticket.status]}
                  </Badge>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                    Teknisyen: {ticket.technician?.name || "Atanmamış"}
                  </p>
                </div>
              </div>
            ))}
            {recentTicketsRaw.length === 0 && (
              <p className="text-center text-gray-500 text-xs py-10">Son servis kaydı bulunamadı.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* En Çok Satan Ürünler */}
      <Card className="bg-[#141416] border-none mt-4">
        <CardHeader>
          <CardTitle className="text-lg font-bold">En Çok Satan Ürünler</CardTitle>
          <p className="text-xs text-gray-500">Bu ay en çok işlem gören ürünler</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topProducts.map((product: any) => (
              <div key={product.id} className="flex flex-col gap-3 group">
                <div className="aspect-square rounded-3xl bg-white/[0.03] flex items-center justify-center border border-white/5 overflow-hidden relative">
                   <Package className="h-12 w-12 text-gray-700 group-hover:scale-110 transition-transform" />
                   {product.stock <= product.criticalStock && (
                      <span className="absolute top-3 right-3 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">AZALAN STOK</span>
                   )}
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate">{product.name}</h4>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{product.category} • {product.sales} Satış</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-black text-blue-400">₺{product.price.toLocaleString('tr-TR')}</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Stokta Var</span>
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="col-span-full text-center text-gray-500 text-xs py-10">Henüz satış verisi yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
