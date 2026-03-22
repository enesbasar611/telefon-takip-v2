import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Package, ShoppingCart, Users, CreditCard, Smartphone } from "lucide-react";

const stats = [
  { label: "Aktif Servis", value: "12", icon: Wrench, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Bugünkü Satış", value: "₺2,450", icon: ShoppingCart, color: "text-green-500", bg: "bg-green-50" },
  { label: "Stok Uyarısı", value: "4", icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
  { label: "Yeni Müşteriler", value: "8", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
  { label: "Toplam Alacak", value: "₺1,200", icon: CreditCard, color: "text-red-500", bg: "bg-red-50" },
  { label: "2. El Stok", value: "15", icon: Smartphone, color: "text-amber-500", bg: "bg-amber-50" },
];

export default function Dashboard() {
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
              {/* Mock placeholder */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">iPhone 13 - Ekran Değişimi</div>
                    <div className="text-xs text-muted-foreground">Ali Yılmaz • 0532 123 45 67</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Onay Bekliyor</div>
                    <div className="text-xs text-muted-foreground">14:30</div>
                  </div>
                </div>
              ))}
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
