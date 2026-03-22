import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Package, ShoppingCart, Users, CreditCard, Smartphone } from "lucide-react";
import { getDashboardStats, getRecentServiceTickets } from "@/lib/actions/dashboard-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const statsData = await getDashboardStats();
  const recentTickets = await getRecentServiceTickets();

  const stats = [
    { label: "Aktif Servis", value: statsData.activeServices, icon: Wrench, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Toplam Gelir", value: statsData.totalIncome, icon: ShoppingCart, color: "text-green-500", bg: "bg-green-50" },
    { label: "Kritik Stok", value: statsData.criticalStock, icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Müşteriler", value: statsData.totalCustomers, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Toplam Alacak", value: "₺0", icon: CreditCard, color: "text-red-500", bg: "bg-red-50" },
    { label: "2. El Stok", value: "0", icon: Smartphone, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>
        <p className="text-muted-foreground">İşletmenizin bugünkü özeti.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-md`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Son Servis Kayıtları</CardTitle>
            <CardDescription>Son 5 teknik servis işlemi.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz servis kaydı bulunmuyor.</p>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{ticket.deviceBrand} {ticket.deviceModel}</div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.customer.name} • {ticket.customer.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{ticket.status}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(ticket.createdAt, "HH:mm", { locale: tr })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hızlı Aksiyonlar</CardTitle>
            <CardDescription>Sık kullanılan işlemler.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Wrench className="h-6 w-6" />
              <span>Yeni Servis</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span>Hızlı Satış</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Müşteri Ekle</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Smartphone className="h-6 w-6" />
              <span>2. El Cihaz Gir</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
