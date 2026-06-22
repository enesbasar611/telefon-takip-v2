"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, Info, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { toast } from "sonner";
import {
    getBrowserNotificationPreference,
    updateBrowserNotificationPreference
} from "../../../lib/actions/notification-actions";

export function NotificationsTab() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [permission, setPermission] = useState<any>("default");

    useEffect(() => {
        async function loadPreference() {
            try {
                const pref = await getBrowserNotificationPreference();
                setIsEnabled(pref);
                if (typeof window !== "undefined" && "Notification" in window) {
                    setPermission(Notification.permission);
                }
            } catch (error) {
                console.error("Failed to load notification preference:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPreference();
    }, []);

    const requestPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            toast.error("Tarayıcınız bildirimleri desteklemiyor.");
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === "granted") {
            toast.success("Bildirim izni verildi.");
            return true;
        } else {
            toast.error("Bildirim izni reddedildi.");
            return false;
        }
    };

    const handleToggle = async (checked: boolean) => {
        if (checked && typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
            const granted = await requestPermission();
            if (!granted) return;
        }

        startTransition(() => {
            updateBrowserNotificationPreference(checked).then(result => {
                if (result.success) {
                    setIsEnabled(checked);
                    toast.success(checked ? "Tarayıcı bildirimleri açıldı." : "Tarayıcı bildirimleri kapatıldı.");
                } else {
                    toast.error("Ayar kaydedilemedi.");
                }
            });
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Bell className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Tarayıcı Bildirimleri</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Önemli stok uyarıları, servis durumu güncellemeleri ve finansal hatırlatıcılar için anlık tarayıcı bildirimleri alın.
                            Bu ayar sadece bu tarayıcı için geçerlidir.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl border border-border bg-card/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Anlık Bildirimler</span>
                            {permission === "granted" ? (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="h-3 w-3" /> İzin Verildi
                                </span>
                            ) : permission === "denied" ? (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                    <ShieldAlert className="h-3 w-3" /> Reddedildi
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    <Info className="h-3 w-3" /> İzin Bekleniyor
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                            Tarayıcı üzerinden gönderilen native bildirimler.
                        </p>
                    </div>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                    />
                </div>

                {permission === "denied" && (
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                        <Info className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium leading-relaxed">
                            Bildirim izni tarayıcı ayarlarından engellenmiş durumda. Bildirim alabilmek için tarayıcı adres barındaki kilit simgesine tıklayarak bildirim iznini sıfırlamanız gerekmektedir.
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold">Test Bildirimi</h3>
                <p className="text-xs text-muted-foreground">
                    Sistem bildirimlerinin doğru çalıştığından emin olmak için bir test bildirimi gönderebilirsiniz.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                            new Notification("Sistem Test Bildirimi", {
                                body: "Tarayıcı bildirimleriniz başarıyla yapılandırıldı.",
                                icon: "/favicon.ico"
                            });
                        } else {
                            toast.error("Önce bildirim izni vermelisiniz.");
                        }
                    }}
                    className="rounded-xl h-10 px-6 font-medium"
                >
                    Test Bildirimi Gönder
                </Button>
            </div>
        </div>
    );
}
