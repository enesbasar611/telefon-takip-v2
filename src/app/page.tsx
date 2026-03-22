import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Package, ShoppingCart, Users, CreditCard, Smartphone, TrendingUp, DollarSign } from "lucide-react";
import { getDashboardStats, getRecentServiceTickets } from "@/lib/actions/dashboard-actions";
import { getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  PENDING: "#94a3b8",
  APPROVED: "#3b82f6",
  REPAIRING: "#f59e0b",
  WAITING_PART: "#8b5cf6",
  READY: "#10b981",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
};

export default async function Dashboard() {
  const statsData = await getDashboardStats();
  const recentTicketsRaw = await getRecentServiceTickets();
  const salesTrend = await getSalesReport();
  const serviceMetricsRaw = await getServiceMetrics();

  const serviceMetrics = serviceMetricsRaw.map(m => ({
    ...m,
    color: statusColors[m.name] || "#cbd5e1"
  }));

  const stats = [
    { label: "Bugünkü Satış", value: statsData.todaySales, icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Tamir Cirosu", value: statsData.repairRevenue, icon: Wrench, color: "text-green-500", bg: "bg-green-50" },
    { label: "Aktif Servis", value: statsData.activeServices, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Kritik Stok", value: statsData.criticalStock, icon: Package, color: "text-red-500", bg: "bg-red-50" },
    { label: "Toplam Müşteri", value: statsData.totalCustomers, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Genel Ciro", value: statsData.totalIncome, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ana Panel</h1>
          <p className="text-muted-foreground">İşletmenizin anlık performans ve teknik servis özeti.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">{format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}</p>
          <Badge variant="outline" className="mt-1 bg-primary/5 text-primary border-primary/20">Sistem Aktif</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-all border-none bg-card shadow-sm group hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg transition-transform group-hover:rotate-12`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Haftalık Satış Trendi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <SalesTrendChart data={salesTrend} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Servis Durum Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ServiceStatusChart data={serviceMetrics} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4 shadow-lg border-none overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-lg">Son Servis İşlemleri</CardTitle>
            <CardDescription>Teknik masadaki son hareketler.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentTicketsRaw.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Henüz servis kaydı bulunmuyor.</p>
              ) : (
                recentTicketsRaw.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl shadow-inner">
                        {ticket.deviceBrand[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{ticket.deviceBrand} {ticket.deviceModel}</div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {ticket.customer?.name} • {ticket.customer?.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-black px-2 py-0.5 tracking-tighter"
                        style={{ backgroundColor: `${statusColors[ticket.status]}20`, color: statusColors[ticket.status], borderColor: `${statusColors[ticket.status]}40` }}
                      >
                        {ticket.status}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {format(new Date(ticket.createdAt), "HH:mm")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-lg border-none">
          <CardHeader className="bg-primary/5 border-b pb-4 text-primary">
            <CardTitle className="text-lg">Kısayol İşlemleri</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 pt-6">
            <Button variant="outline" className="h-28 flex flex-col gap-3 group border-2 hover:border-primary hover:bg-primary/5 shadow-sm">
              <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                <Wrench className="h-6 w-6" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em]">Yeni Servis</span>
            </Button>
            <Button variant="outline" className="h-28 flex flex-col gap-3 group border-2 hover:border-emerald-500 hover:bg-emerald-500/5 shadow-sm">
              <div className="p-3 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em]">Hızlı Satış</span>
            </Button>
            <Button variant="outline" className="h-28 flex flex-col gap-3 group border-2 hover:border-blue-500 hover:bg-blue-500/5 shadow-sm">
              <div className="p-3 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                <Users className="h-6 w-6" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em]">Müşteri Ekle</span>
            </Button>
            <Button variant="outline" className="h-28 flex flex-col gap-3 group border-2 hover:border-amber-500 hover:bg-amber-500/5 shadow-sm">
              <div className="p-3 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                <Smartphone className="h-6 w-6" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em]">2. El Cihaz</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
