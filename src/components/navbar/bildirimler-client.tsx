"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Clock, ShieldAlert, X, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    priority: string;
};

export function BildirimlerClient({ notifications: initialNotifications }: { notifications: Notification[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = initialNotifications.filter((n) => !dismissed.has(n.id));

    const dismiss = (id: string) => setDismissed((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
    });
    const dismissAll = () => setDismissed(new Set(initialNotifications.map((n) => n.id)));

    const getIcon = (type: string) => {
        switch (type) {
            case "CRITICAL_STOCK": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case "OVERDUE_SERVICE": return <Clock className="h-5 w-5 text-orange-500" />;
            default: return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-medium text-3xl ">Sistem Bildirimleri</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        İşletmenizin kritik uyarılarını ve operasyonel hatırlatıcılarını takip edin.
                    </p>
                </div>
                {visible.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={dismissAll}
                        className="gap-2 text-xs  h-9 rounded-xl"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Tümünü Okundu İşaretle ({visible.length})
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-red-500 p-4">
                    <p className="text-xs  text-muted-foreground uppercase tracking-wide">Kritik Uyarılar</p>
                    <p className="text-2xl  text-red-500 mt-1">
                        {visible.filter((n) => n.priority === "HIGH").length}
                    </p>
                </Card>
                <Card className="border-l-4 border-l-orange-400 p-4">
                    <p className="text-xs  text-muted-foreground uppercase tracking-wide">Normal Uyarılar</p>
                    <p className="text-2xl  text-orange-400 mt-1">
                        {visible.filter((n) => n.priority !== "HIGH").length}
                    </p>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 p-4">
                    <p className="text-xs  text-muted-foreground uppercase tracking-wide">Okundu / Yok Sayıldı</p>
                    <p className="text-2xl  text-emerald-500 mt-1">{dismissed.size}</p>
                </Card>
            </div>

            <div className="grid gap-3">
                {visible.length === 0 ? (
                    <Card>
                        <CardHeader className="text-center py-16">
                            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                            <CardTitle className="font-medium mt-4 text-muted-foreground font-medium">
                                Tüm bildirimler okundu işaretlendi.
                            </CardTitle>
                            <CardDescription>Yeni uyarı veya kritik durum bulunmuyor.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    visible.map((n) => (
                        <Card
                            key={n.id}
                            className={`border-l-4 transition-all hover:shadow-md ${n.priority === "HIGH" ? "border-l-red-500" : "border-l-orange-400"
                                }`}
                        >
                            <CardHeader className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className={`p-2 rounded-xl flex-shrink-0 ${n.priority === "HIGH" ? "bg-red-500/10" : "bg-orange-400/10"}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className="font-medium text-sm ">{n.title}</CardTitle>
                                                <Badge
                                                    className={`text-[8px]  border-none px-2 py-0.5 ${n.priority === "HIGH"
                                                        ? "bg-red-500/10 text-red-600"
                                                        : "bg-orange-400/10 text-orange-600"
                                                        }`}
                                                >
                                                    {n.priority === "HIGH" ? "KRİTİK" : "NORMAL"}
                                                </Badge>
                                            </div>
                                            <CardDescription className="text-xs mt-1">{n.message}</CardDescription>
                                            <span className="text-[10px] text-muted-foreground mt-1.5 block">
                                                {format(new Date(n.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => dismiss(n.id)}
                                        className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 flex-shrink-0"
                                        title="Okundu olarak işaretle"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}





