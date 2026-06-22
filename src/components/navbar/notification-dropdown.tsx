"use client";

import { useEffect, useRef, useState } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
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
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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
    // Track ALL notification IDs we've already seen/shown browser notifications for.
    // Using a Set prevents re-notifying when the list changes due to snooze/dismiss.
    const seenNotificationIdsRef = useRef<Set<string> | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["system-notifications"],
        queryFn: async () => {
            return await getSystemNotifications({ limit: 10 });
        },
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchInterval: 60 * 1000,
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

        // Initial load: seed the seen set with all current notification IDs (don't notify for existing ones)
        if (seenNotificationIdsRef.current === null) {
            seenNotificationIdsRef.current = new Set(notifications.map((n: SystemNotification) => n.id));
            return;
        }

        // Find truly NEW unread notifications (IDs we haven't seen before)
        const newUnreadNotifications = notifications.filter(
            (n: SystemNotification) => !n.isRead && !seenNotificationIdsRef.current!.has(n.id)
        );

        // Show browser notification only for genuinely new ones
        if (newUnreadNotifications.length > 0) {
            const latest = newUnreadNotifications[0];
            new Notification(latest.title, {
                body: latest.message,
                icon: "/favicon.ico"
            });
        }

        // Update seen set with all current notification IDs
        notifications.forEach((n: SystemNotification) => seenNotificationIdsRef.current!.add(n.id));
    }, [notifications, browserEnabled]);

    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
        };

        window.addEventListener("notification-update", handleUpdate);

        const unsubscribe = subscribeToNotificationEvents((event) => {
            if (event.type === "SNOOZE_NOTIFICATION" && event.notificationId) {
                // Optimistic: remove snoozed notification from cache immediately
                queryClient.setQueryData(["system-notifications"], (oldData: any) => {
                    if (!oldData) return oldData;
                    const wasUnread = oldData.notifications.find((n: SystemNotification) => n.id === event.notificationId && !n.isRead);
                    return {
                        ...oldData,
                        notifications: oldData.notifications.filter((n: SystemNotification) => n.id !== event.notificationId),
                        unreadCount: wasUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount,
                    };
                });
            }
            queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
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

    const handleSnooze = async (id: string, hours: number) => {
        try {
            // Optimistic update: immediately remove notification from dropdown list
            queryClient.setQueryData(["system-notifications"], (oldData: any) => {
                if (!oldData) return oldData;
                const wasUnread = oldData.notifications.find((n: SystemNotification) => n.id === id && !n.isRead);
                return {
                    ...oldData,
                    notifications: oldData.notifications.filter((n: SystemNotification) => n.id !== id),
                    unreadCount: wasUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount,
                    total: Math.max(0, (oldData.total || 0) - 1),
                };
            });

            await snoozeNotificationAction(id, hours);
            queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
            broadcastNotificationEvent({ type: "SNOOZE_NOTIFICATION", notificationId: id });

            let message = "Bildirim ertelendi";
            if (hours === 24) message = "Bildirim 24 saat ertelendi";
            else if (hours === 168) message = "Bildirim 1 hafta ertelendi";
            else if (hours > 100000) message = "Bildirim süresiz olarak gizlendi";

            toast.success(message, {
                icon: <Clock className="h-4 w-4 text-amber-500" />
            });

            window.dispatchEvent(new CustomEvent("notification-update"));
        } catch (error) {
            // Rollback on error: refetch to restore the original state
            queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
            toast.error("Bildirim ertelenirken bir hata oluştu");
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

                <div className="max-h-[450px] overflow-y-auto no-scrollbar py-1">
                    {isLoading && notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <Clock className="h-8 w-8 text-muted-foreground mx-auto animate-spin opacity-20" />
                            <p className="text-xs text-muted-foreground font-medium">Bildirimler kontrol ediliyor...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-20 px-4 text-center">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border/50">
                                <Bell className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground/80 mb-1">Yeni bildirim yok</h3>
                            <p className="text-[11px] text-muted-foreground/50 max-w-[180px] mx-auto">Tüm güncel haberler burada görünecektir.</p>
                        </div>
                    ) : (
                        notifications.map((n: SystemNotification) => (
                            <div key={n.id} className="relative group border-b border-white/[0.03] last:border-0 overflow-hidden">
                                {/* Main Action Area */}
                                <div
                                    className={cn(
                                        "p-4 pr-12 hover:bg-white/[0.03] cursor-pointer transition-all block w-full !ring-0 !outline-none relative z-10",
                                        !n.isRead && "bg-blue-500/[0.02]"
                                    )}
                                    onClick={() => handleAction(n)}
                                >
                                    <div className="flex gap-4 w-full text-left">
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {!n.isRead && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0 animate-pulse" />
                                                    )}
                                                    <span className={cn(
                                                        "text-[13px] font-bold truncate tracking-tight transition-colors",
                                                        n.isRead ? "text-muted-foreground/40" : "text-foreground"
                                                    )}>
                                                        {n.title}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-muted-foreground whitespace-nowrap opacity-40 font-medium">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr }).toUpperCase()}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-[12px] font-medium leading-relaxed line-clamp-2",
                                                n.isRead ? "text-muted-foreground/30" : "text-muted-foreground/80"
                                            )}>
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Snooze Submenu */}
                                <div className="absolute right-2 top-4 z-40">
                                    <DropdownMenuSub>
                                        <DropdownMenuPrimitive.SubTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg !bg-transparent hover:!bg-amber-500/10 data-[state=open]:!bg-amber-500/20 transition-all border-0 shadow-none ring-0 focus:ring-0 outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                <Clock className="h-4 w-4 text-muted-foreground/40 group-hover:text-amber-500/60 transition-colors" />
                                            </Button>
                                        </DropdownMenuPrimitive.SubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent
                                                sideOffset={8}
                                                className="w-40 border-amber-500/20 bg-background/95 backdrop-blur-xl shadow-2xl p-1.5 z-[110]"
                                            >
                                                <DropdownMenuItem
                                                    onSelect={async (e) => {
                                                        e.preventDefault();
                                                        await handleSnooze(n.id, 24);
                                                    }}
                                                    className="cursor-pointer gap-2 py-2 rounded-lg"
                                                >
                                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="text-xs font-medium">24 Saat</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={async (e) => {
                                                        e.preventDefault();
                                                        await handleSnooze(n.id, 168);
                                                    }}
                                                    className="cursor-pointer gap-2 py-2 rounded-lg"
                                                >
                                                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="text-xs font-medium">1 Hafta</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={async (e) => {
                                                        e.preventDefault();
                                                        await handleSnooze(n.id, 876000);
                                                    }}
                                                    className="cursor-pointer gap-2 py-2 rounded-lg"
                                                >
                                                    <TimerOff className="h-3.5 w-3.5 text-rose-500" />
                                                    <span className="text-xs font-medium">Süresiz</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="bg-border m-0" />
                <Link href="/bildirimler" className="w-full">
                    <div className="p-5 text-center text-[11px] uppercase tracking-widest text-primary hover:bg-primary/5 transition-all cursor-pointer">
                        Bildirim Merkezine Git
                    </div>
                </Link>
            </DropdownMenuContent >
        </DropdownMenu >
    );
}