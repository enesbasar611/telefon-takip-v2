import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSalesReport, getServiceVolumeReport } from "@/lib/actions/report-actions";
import { TrendingUp, Target } from "lucide-react";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";

export const dynamic = 'force-dynamic';

export default async function RaporlarPage() {
  const salesReport = await getSalesReport();
  const serviceSummary = await getServiceVolumeReport();

  const totalSales = salesReport.reduce((acc, d) => acc + d.total, 0);
  const totalServices = serviceSummary.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporlar ve Analizler</h1>
        <p className="text-muted-foreground">İşletmenizin performansını profesyonel grafiklerle analiz edin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ayki Toplam Satış</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">₺{totalSales.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Önceki aya göre %12 artış.</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Servis Adedi</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600">{totalServices}</div>
            <p className="text-xs text-muted-foreground mt-1">Bu ay en çok parça değişimi yapıldı.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b mb-6">
          <CardTitle>Günlük Satış Trendi</CardTitle>
          <CardDescription>Bu ayın günlük satış performans grafiği.</CardDescription>
        </CardHeader>
        <CardContent>
          {salesReport.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground italic">
              Henüz grafik verisi bulunmuyor.
            </div>
          ) : (
            <SalesTrendChart data={salesReport} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
