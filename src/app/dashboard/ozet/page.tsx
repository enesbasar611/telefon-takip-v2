import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinancialSummary } from "@/lib/actions/finance-actions";
import { getRecentServiceTickets, getDashboardStats } from "@/lib/actions/dashboard-actions";
import { TrendingUp, Users, Wrench, ShoppingBag, Banknote } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardOzetPage() {
  const stats = await getDashboardStats();
  const summary = await getFinancialSummary();
  const recentTickets = await getRecentServiceTickets();

  return (
    <div className="flex flex-col gap-8 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Günlük Özet</h1>
        <p className="text-muted-foreground">İşletmenizin bugünkü performansına hızlıca göz atın.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Günlük Ciro</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncome}</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Düne göre %8 artış
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Yeni Müşteriler</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Son 24 saatte eklenen.</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tamamlanan Servis</CardTitle>
            <Wrench className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Bugün teslim edilen cihazlar.</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Satış Adedi</CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">Aksesuar ve yedek parça satışı.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finansal Özet</CardTitle>
            <CardDescription>Bu ayın toplam gelir ve gider dengesi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Toplam Gelir:</span>
              <span className="text-lg font-bold text-green-600">₺{summary.totalIncome.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Toplam Gider:</span>
              <span className="text-lg font-bold text-red-600">₺{summary.totalExpense.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-bold">Kasa Bakiyesi:</span>
              <span className="text-xl font-black text-primary">₺{(summary.cashBalance + summary.bankBalance).toLocaleString('tr-TR')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Servis İşlemleri</CardTitle>
            <CardDescription>Son 5 teknik servis kaydı.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket: any) => (
                <div key={ticket.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{ticket.deviceBrand} {ticket.deviceModel}</span>
                    <span className="text-xs text-muted-foreground">{ticket.customer?.name}</span>
                  </div>
                  <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {ticket.ticketNumber}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
