import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";

const notifications = [
  { id: 1, title: "Kritik Stok Uyarısı", description: "iPhone 13 Ekran stoğu 2 adetin altına düştü.", type: "critical", time: "10 dakika önce", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10" },
  { id: 2, title: "Servis Hazır", description: "Ali Yılmaz'a ait Samsung S21 cihazı hazırlandı.", type: "success", time: "1 saat önce", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/10" },
  { id: 3, title: "Yeni Randevu", description: "Yarın saat 14:00 için yeni bir servis randevusu oluşturuldu.", type: "info", time: "3 saat önce", icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
];

export default function BildirimlerPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildirimler ve Hatırlatmalar</h1>
        <p className="text-muted-foreground">Sistem tarafından üretilen önemli uyarıları takip edin.</p>
      </div>

      <div className="grid gap-4">
        {notifications.map((n) => (
          <Card key={n.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div className={`${n.bg} ${n.color} p-3 rounded-full`}>
                <n.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">{n.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
                <CardDescription className="text-sm mt-1">{n.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-end gap-2 py-2">
              <Badge variant="outline">Görüldü İşaretle</Badge>
              <Badge variant="secondary">Detay Gör</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
