import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Wrench, AlertTriangle } from "lucide-react";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { getFinancialSummary } from "@/lib/actions/finance-actions";
import { getDashboardStats, getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";

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

export default async function RaporlarPage() {
  const summary = await getFinancialSummary();
  const stats = await getDashboardStats();
  const salesData = await getSalesReport();
  const serviceMetricsRaw = await getServiceMetrics();

  const serviceMetrics = serviceMetricsRaw.map((m: any) => ({
    ...m,
    status: m.name,
    name: {
      PENDING: "Beklemede", APPROVED: "Onay Bekliyor", REPAIRING: "Tamirde",
      WAITING_PART: "Parça Bekliyor", READY: "Hazır", DELIVERED: "Teslim Edildi", CANCELLED: "İptal"
    }[m.name as string] || m.name,
    color: statusColors[m.name] || "#cbd5e1"
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Raporlar ve Analizler</h1>
        <p className="text-muted-foreground">İşletmenizin performansını profesyonel grafiklerle analiz edin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ayki Net Satış</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{stats.currentMonthRevenue?.toLocaleString('tr-TR') || 0}</div>
            <p className="text-xs text-muted-foreground">
              Önceki aya göre {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}% {stats.revenueGrowth >= 0 ? 'artış' : 'düşüş'}.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Servis Adedi</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedServicesThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Bu ay içerisinde teslim edilenler.</p>
          </CardContent>
        </Card>
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Müşteriler</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Toplam kayıtlı portföy.</p>
          </CardContent>
        </Card>
        <Card className="bg-card hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Stok Uyarıları</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalStockCount}</div>
            <p className="text-xs text-muted-foreground">Stokta azalan ürün adedi.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="sales" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Satış Trendi
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="h-4 w-4" />
            Servis Durumu
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Günlük Satış Trendi</CardTitle>
              <CardDescription>Bu ayın günlük satış performans grafiği.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <SalesTrendChart data={salesData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="services" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Servis Dağılımı</CardTitle>
              <CardDescription>Teknik servis işlemlerinin statü bazlı dağılımı.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ServiceStatusChart data={serviceMetrics} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
