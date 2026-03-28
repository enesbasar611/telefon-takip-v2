import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function BildirimlerPage() {
  const notifications = await getSystemNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL_STOCK': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'OVERDUE_SERVICE': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Sistem Bildirimleri</h1>
        <p className="text-muted-foreground">İşletmenizin kritik uyarılarını ve operasyonel hatırlatıcılarını takip edin.</p>
      </div>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center py-12">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
              <CardTitle className="mt-4 text-muted-foreground font-medium">Şu an için yeni bir bildirim bulunmuyor.</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          notifications.map((n: any) => (
            <Card key={n.id} className={`hover:shadow-md transition-shadow border-l-4 ${n.priority === 'HIGH' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(n.type)}
                    <div>
                      <CardTitle className="text-lg font-extrabold">{n.title}</CardTitle>
                      <CardDescription className="text-sm">{n.message}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={n.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px] font-bold">
                      {n.priority === 'HIGH' ? 'KRİTİK' : 'NORMAL'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(n.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
