"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Clock,
    Calendar,
    TimerOff,
    CheckCheck,
    ShieldAlert,
    ShoppingCart,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getSystemNotifications,
    markNotificationAsReadAction,
    markAllNotificationsAsReadAction,
    snoozeNotificationAction,
    SystemNotification,
    getBrowserNotificationPreference
} from "@/lib/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeToNotificationEvents, broadcastNotificationEvent } from "@/lib/broadcast-events";

export function NotificationDropdown() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [browserEnabled, setBrowserEnabled] = useState(false);
    const lastSeenIdRef = useRef<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["system-notifications"],
        queryFn: async () => {
            return await getSystemNotifications({ limit: 10 });
        },
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchInterval: 60 * 1000, // Reduced to 1 minute for better "real-time" feel without push
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    // Load browser preference
    useEffect(() => {
        getBrowserNotificationPreference().then(setBrowserEnabled);
    }, []);

    // Effect for handling browser notifications
    useEffect(() => {
        if (!notifications.length || !browserEnabled || Notification.permission !== "granted") return;

        const latest = notifications[0];

        // Initial load: just set the last seen ID
        if (lastSeenIdRef.current === null) {
            lastSeenIdRef.current = latest.id;
            return;
        }

        // Check if there are new unread notifications
        const unreadLatest = notifications.find((n: any) => !n.isRead);
        if (unreadLatest && unreadLatest.id !== lastSeenIdRef.current) {
            // New notification!
            new Notification(unreadLatest.title, {
                body: unreadLatest.message,
                icon: "/favicon.ico"
            });
            lastSeenIdRef.current = unreadLatest.id;
        }
    }, [notifications, browserEnabled]);

    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
        };

        window.addEventListener("notification-update", handleUpdate);

        const unsubscribe = subscribeToNotificationEvents((event) => {
            queryClient.invalidateQueries({ queryKey: ["system-notifications"] });

            // If it's a new notification event (not triggered by local action), 
            // the next query refetch will handle the browser notification.
        });

        return () => {
            window.removeEventListener("notification-update", handleUpdate);
            unsubscribe();
        };
    }, [queryClient]);

    const handleAction = async (notification: SystemNotification) => {
        if (!notification.isRead) {
            // OPTIMISTIC UPDATE
            queryClient.setQueryData(["system-notifications"], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    notifications: oldData.notifications.map((n: SystemNotification) =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                    ),
                    unreadCount: Math.max(0, oldData.unreadCount - 1)
                };
            });

            await markNotificationAsReadAction(notification.id);
            broadcastNotificationEvent({ type: "MARK_AS_READ", notificationId: notification.id });
        }

        if (notification.type === "COMPLETED" || notification.type === "DELIVERY_TIME" || notification.type === "PENDING_APPROVAL") {
            const statusMap: Record<string, string> = {
                "PENDING": "PENDING",
                "WAITING_PART": "WAITING_PART",
                "READY": "READY",
                "DELIVERED": "DELIVERED"
            };
            const status = statusMap[notification.status || ""] || "READY";
            router.push(`/servis?status=${status}&highlight=${notification.referenceId}`);
        } else if (notification.type === "CRITICAL_STOCK") {
            router.push(`/stok?highlight=${notification.referenceId}`);
        } else if (notification.type === "FINANCIAL_DELAY") {
            router.push(`/satis/kasa?highlight=${notification.referenceId}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CRITICAL_STOCK': return <ShoppingCart className="h-5 w-5 text-rose-500" />;
            case 'FINANCIAL_DELAY': return <CreditCard className="h-5 w-5 text-emerald-500" />;
            case 'COMPLETED': return <CheckCheck className="h-5 w-5 text-emerald-500" />;
            case 'DELIVERY_TIME': return <Clock className="h-5 w-5 text-amber-500" />;
            case 'WARRANTY_EXPIRY': return <ShieldAlert className="h-5 w-5 text-purple-500" />;
            default: return <Bell className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-xl bg-muted/40 border border-border text-foreground hover:text-primary hover:bg-primary/5 transition-all outline-none focus-visible:ring-0"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-600 border-2 border-background shadow-lg flex items-center justify-center">
                            <span className="text-[10px] text-white ">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[420px] bg-card/80 backdrop-blur-3xl border-border shadow-2xl rounded-2xl p-0 overflow-hidden font-sans z-[100]">
                <DropdownMenuLabel className="p-6 flex items-center justify-between bg-muted/20">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-foreground">Sistem Bildirimleri</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[11px] text-muted-foreground font-medium">{unreadCount} Bekleyen İşlem</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                            // Optimistic clear
                            queryClient.setQueryData(["system-notifications"], (oldData: any) => {
                                if (!oldData) return oldData;
                                return {
                                    ...oldData,
                                    notifications: oldData.notifications.map((n: SystemNotification) => ({ ...n, isRead: true })),
                                    unreadCount: 0
                                };
                            });
                            await markAllNotificationsAsReadAction();
                            broadcastNotificationEvent({ type: "MARK_ALL_READ" });
                        }}
                        className="h-9 text-xs text-primary hover:bg-primary/5 border border-primary/10 rounded-xl px-4 transition-all"
                    >
                        Tümünü Okundu İşaretle
                    </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border m-0" />

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {isLoading && notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <Clock className="h-8 w-8 text-muted-foreground mx-auto animate-spin opacity-20" />
                            <p className="text-xs text-muted-foreground font-medium">Bildirimler kontrol ediliyor...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto opacity-10 mb-6" />
                            <p className="text-[12px] text-muted-foreground">Şu an bildirim bulunmuyor</p>
                        </div>
                    ) : (
                        notifications.map((n: SystemNotification) => (
                            <DropdownMenuItem
                                key={n.id}
                                onClick={() => handleAction(n)}
                                className={cn(
                                    "p-6 border-b border-border/40 last:border-none hover:bg-muted/30 cursor-pointer group transition-all relative focus:bg-muted/40 block w-full text-left",
                                    !n.isRead && "bg-primary/[0.02]"
                                )}
                            >
                                {!n.isRead && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                )}
                                <div className="flex gap-5 w-full">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-105",
                                        n.type === 'CRITICAL_STOCK' ? "bg-rose-500/10 border-rose-500/20" :
                                            n.isRead ? "bg-muted border-border" : "bg-primary/10 border-primary/20"
                                    )}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={cn(
                                                "text-[13px] truncate pr-4 uppercase tracking-tighter font-semibold",
                                                n.isRead ? "text-muted-foreground" : "text-foreground"
                                            )}>
                                                {n.title}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground whitespace-nowrap opacity-60">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr }).toUpperCase()}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-[12px] font-medium leading-relaxed line-clamp-2",
                                            n.isRead ? "text-muted-foreground/60" : "text-muted-foreground/80"
                                        )}>
                                            {n.message}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all text-muted-foreground/40"
                                                    title="Ertele..."
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Clock className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 border-amber-500/20 bg-background/95 backdrop-blur-sm">
                                                <DropdownMenuItem onClick={() => {
                                                    snoozeNotificationAction(n.id, 24);
                                                    broadcastNotificationEvent({ type: "SNOOZE_NOTIFICATION", notificationId: n.id });
                                                    window.dispatchEvent(new CustomEvent("notification-update"));
                                                }} className="cursor-pointer">
                                                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                                    <span>24 Saat</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    snoozeNotificationAction(n.id, 168);
                                                    broadcastNotificationEvent({ type: "SNOOZE_NOTIFICATION", notificationId: n.id });
                                                    window.dispatchEvent(new CustomEvent("notification-update"));
                                                }} className="cursor-pointer">
                                                    <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                                                    <span>1 Hafta</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    snoozeNotificationAction(n.id, 876000);
                                                    broadcastNotificationEvent({ type: "SNOOZE_NOTIFICATION", notificationId: n.id });
                                                    window.dispatchEvent(new CustomEvent("notification-update"));
                                                }} className="cursor-pointer">
                                                    <TimerOff className="mr-2 h-4 w-4 text-rose-500" />
                                                    <span>Süresiz</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="bg-border m-0" />
                <Link href="/bildirimler" className="w-full">
                    <div className="p-5 text-center text-[11px] uppercase tracking-widest text-primary hover:bg-primary/5 transition-all cursor-pointer">
                        Bildirim Merkezine Git
                    </div>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}