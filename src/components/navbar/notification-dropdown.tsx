"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    Clock,
    CheckCheck,
    Smartphone,
    TrendingDown,
    ShieldAlert,
    Truck,
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
    SystemNotification
} from "@/lib/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function NotificationDropdown() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await getSystemNotifications({ limit: 10 });
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const handleUpdate = () => fetchNotifications();
        window.addEventListener("notification-update", handleUpdate);

        const interval = setInterval(fetchNotifications, 2 * 60 * 1000); // 2 mins refresh
        return () => {
            clearInterval(interval);
            window.removeEventListener("notification-update", handleUpdate);
        };
    }, []);

    const handleAction = async (notification: SystemNotification) => {
        if (!notification.isRead) {
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await markNotificationAsReadAction(notification.id);
            window.dispatchEvent(new CustomEvent("notification-update"));
            router.refresh();
        }

        // Routing logic
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
                            <span className="text-[10px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[420px] bg-card/80 backdrop-blur-3xl border-border shadow-2xl rounded-2xl p-0 overflow-hidden font-sans z-[100]">
                <DropdownMenuLabel className="p-6 flex items-center justify-between bg-muted/20">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Sistem Bildirimleri</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[11px] text-muted-foreground font-medium">{unreadCount} Bekleyen İşlem</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                            await markAllNotificationsAsReadAction();
                            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            setUnreadCount(0);
                            window.dispatchEvent(new CustomEvent("notification-update"));
                            router.refresh();
                        }}
                        className="h-9 text-xs font-bold text-primary hover:bg-primary/5 border border-primary/10 rounded-xl px-4 transition-all"
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
                            <p className="text-[12px] font-bold text-muted-foreground">Şu an bildirim bulunmuyor</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleAction(n)}
                                className={cn(
                                    "p-6 border-b border-border/40 last:border-none hover:bg-muted/30 cursor-pointer group transition-all relative",
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
                                                "text-[13px] font-bold truncate pr-4 uppercase tracking-tighter",
                                                n.isRead ? "text-muted-foreground" : "text-foreground"
                                            )}>
                                                {n.title}
                                            </span>
                                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap opacity-60">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr }).toUpperCase()}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-[12px] font-medium leading-relaxed line-clamp-2",
                                            n.isRead ? "text-muted-foreground/60" : "text-slate-500"
                                        )}>
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="bg-border m-0" />
                <Link href="/bildirimler" className="w-full">
                    <div className="p-5 text-center text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-all cursor-pointer">
                        Bildirim Merkezine Git
                    </div>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
