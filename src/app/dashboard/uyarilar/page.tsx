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
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex items-center gap-5 mb-4">
        <div className="h-14 w-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
            <Bell className="h-7 w-7 text-blue-500" />
        </div>
        <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Sistem bildirimleri</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">İşletmenizin kritik uyarıları ve operasyonel hatırlatıcıları</p>
        </div>
      </div>

      <div className="grid gap-6">
        {notifications.length === 0 ? (
          <Card className="rounded-[2rem] border-border shadow-sm bg-card">
            <CardHeader className="text-center py-20">
              <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
              <CardTitle className="mt-6 text-muted-foreground font-bold">Şu an için yeni bir bildirim bulunmuyor</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          notifications.map((n: any) => (
            <Card key={n.id} className={`rounded-[2rem] border-border shadow-sm transition-all hover:translate-y-[-2px] bg-card border-l-8 ${n.priority === 'HIGH' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
              <CardHeader className="p-10">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                        "p-4 rounded-[1.25rem] border",
                        n.priority === 'HIGH' ? "bg-red-500/10 border-red-500/20" : "bg-blue-500/10 border-blue-500/20"
                    )}>
                        {getIcon(n.type)}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-extrabold">{n.title}</CardTitle>
                      <CardDescription className="text-base font-medium mt-1.5">{n.message}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <Badge variant={n.priority === 'HIGH' ? 'destructive' : 'secondary'} className="px-5 py-1.5 rounded-full font-bold text-xs">
                      {n.priority === 'HIGH' ? 'Kritik' : 'Normal'}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-bold">
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

// Utility for conditional classes since it was missing in imports
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
