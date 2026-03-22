import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    { label: "Toplam Alacak", value: "₺0", icon: CreditCard, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10" },
    { label: "2. El Stok", value: "0", icon: Smartphone, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>
        <p className="text-muted-foreground">İşletmenizin bugünkü özeti.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow border-none bg-card shadow-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-md transition-transform group-hover:scale-110`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-md overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 border-b mb-4">
            <CardTitle>Son Servis Kayıtları</CardTitle>
            <CardDescription>Son 5 teknik servis işlemi.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz servis kaydı bulunmuyor.</p>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/50 transition-colors p-2 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {ticket.deviceBrand[0]}
                      </div>
                      <div>
                        <div className="font-bold">{ticket.deviceBrand} {ticket.deviceModel}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.customer.name} • {ticket.customer.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                        {ticket.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground font-medium">
                        {format(ticket.createdAt, "HH:mm", { locale: tr })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-md overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 border-b mb-4">
            <CardTitle>Hızlı Aksiyonlar</CardTitle>
            <CardDescription>Sık kullanılan işlemler.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2 group hover:border-primary hover:bg-primary/5 transition-all">
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <Wrench className="h-6 w-6" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider">Yeni Servis</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 group hover:border-emerald-500 hover:bg-emerald-500/5 transition-all">
              <div className="p-2 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider">Hızlı Satış</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 group hover:border-blue-500 hover:bg-blue-500/5 transition-all">
              <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider">Müşteri Ekle</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 group hover:border-amber-500 hover:bg-amber-500/5 transition-all">
              <div className="p-2 rounded-full bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Smartphone className="h-6 w-6" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider">2. El Cihaz Gir</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
