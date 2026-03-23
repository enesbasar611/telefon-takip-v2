import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { AlertTriangle, AlertCircle, Wrench, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function DashboardUyarilarPage() {
  const notifications = await getSystemNotifications();

  return (
    <div className="flex flex-col gap-8 py-6 bg-[#0a0a0b] text-white min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kritik Uyarılar</h1>
          <p className="text-muted-foreground text-gray-400">İşletmenizin dikkat etmesi gereken önemli noktalar.</p>
        </div>
        <div className="bg-rose-500/10 text-rose-500 px-4 py-2 rounded-xl border border-rose-500/20 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold">Toplam {notifications.length} Kritik Uyarı</span>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="bg-[#141416] border-none border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold">Stok Seviyesi Kritik Ürünler</CardTitle>
            <Package className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardDescription className="px-6 text-gray-500 font-medium uppercase text-[10px] tracking-widest">Aşağıdaki ürünlerin stok miktarı kritik seviyenin altına düşmüştür.</CardDescription>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {notifications.filter((n: any) => n.type === 'CRITICAL_STOCK').length > 0 ? (
                notifications.filter((n: any) => n.type === 'CRITICAL_STOCK').map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold uppercase tracking-tight text-white">{n.title}</span>
                      <span className="text-sm text-gray-500">{n.message}</span>
                    </div>
                    <Badge variant="destructive" className="font-black uppercase text-[10px] px-3 py-1 tracking-tighter bg-rose-500 hover:bg-rose-600">Hemen Sipariş Ver</Badge>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-gray-500">
                  <Package className="h-10 w-10 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Kritik stok seviyesinde ürün bulunmuyor. Her şey yolunda!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-none border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold">Geciken Servis Kayıtları</CardTitle>
            <Wrench className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardDescription className="px-6 text-gray-500 font-medium uppercase text-[10px] tracking-widest">Aşağıdaki cihazların teknik servis süresi 3 günü aşmıştır.</CardDescription>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {notifications.filter((n: any) => n.type === 'OVERDUE_SERVICE').length > 0 ? (
                notifications.filter((n: any) => n.type === 'OVERDUE_SERVICE').map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{n.title}</span>
                      <span className="text-xs text-gray-500 font-medium">{n.message}</span>
                    </div>
                    <Badge className="bg-orange-500 font-black uppercase text-[10px] px-3 py-1 tracking-tighter hover:bg-orange-600">Hemen İncele</Badge>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-gray-500">
                  <Wrench className="h-10 w-10 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Geciken herhangi bir servis kaydı bulunmuyor. Teknik masa mükemmel çalışıyor!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-none border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold">Tahsilat & Ödeme Hatırlatmaları</CardTitle>
            <AlertCircle className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardDescription className="px-6 text-gray-500 font-medium uppercase text-[10px] tracking-widest">Vadesi yaklaşan veya geçen ödemeler.</CardDescription>
          <CardContent className="pt-4">
             <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-gray-500">
                <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Gelecek dönem ödemeleri ve taksit hatırlatmaları burada görünecektir.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
