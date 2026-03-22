import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { AlertTriangle, AlertCircle, Wrench, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function DashboardUyarilarPage() {
  const notifications = await getSystemNotifications();

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kritik Uyarılar</h1>
          <p className="text-muted-foreground">İşletmenizin dikkat etmesi gereken önemli noktalar.</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold">Toplam {notifications.length} Kritik Uyarı</span>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold">Stok Seviyesi Kritik Ürünler</CardTitle>
            <Package className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardDescription className="px-6">Aşağıdaki ürünlerin stok miktarı kritik seviyenin altına düşmüştür.</CardDescription>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {notifications.filter((n: any) => n.type === 'CRITICAL_STOCK').length > 0 ? (
                notifications.filter((n: any) => n.type === 'CRITICAL_STOCK').map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-red-50/10 hover:bg-red-50/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold uppercase tracking-tight">{n.title}</span>
                      <span className="text-sm text-muted-foreground">{n.message}</span>
                    </div>
                    <Badge variant="destructive" className="font-bold">Hemen Sipariş Ver</Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                  Kritik stok seviyesinde ürün bulunmuyor. Her şey yolunda!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold">Geciken Servis Kayıtları</CardTitle>
            <Wrench className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardDescription className="px-6">Aşağıdaki cihazların teknik servis süresi 3 günü aşmıştır.</CardDescription>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {notifications.filter((n: any) => n.type === 'OVERDUE_SERVICE').length > 0 ? (
                notifications.filter((n: any) => n.type === 'OVERDUE_SERVICE').map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50/10 hover:bg-orange-50/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                    </div>
                    <Badge className="bg-orange-500 font-bold hover:bg-orange-600">Hemen İncele</Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                  Geciken herhangi bir servis kaydı bulunmuyor. Teknik masa mükemmel çalışıyor!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold">Tahsilat & Ödeme Hatırlatmaları</CardTitle>
            <AlertCircle className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardDescription className="px-6">Vadesi yaklaşan veya geçen ödemeler.</CardDescription>
          <CardContent className="pt-4">
             <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                Gelecek dönem ödemeleri ve taksit hatırlatmaları burada görünecektir.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
