"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Clock,
    Bell,
    ShoppingCart,
    Truck,
    CreditCard,
    ShieldAlert,
    ChevronRight,
    Plus,
    CheckCheck,
    Trash2,
    Loader2,
    MessageCircle,
    Calendar,
    TimerOff,
    Settings2,
    MoreVertical,
    Eye,
    BellOff,
    Check,
    Filter,
    MoreHorizontal,
} from "lucide-react";
import {
    SystemNotification,
    NotificationCategory,
    getSystemNotifications,
    markNotificationAsReadAction,
    markAllNotificationsAsReadAction,
    dismissNotificationAction,
    snoozeNotificationAction,
    unsnoozeNotificationAction,
} from "@/lib/actions/notification-actions";
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
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ReplenishStockModal } from "./replenish-stock-modal";
import { ReminderManagement } from "./reminder-management";
import { subscribeToNotificationEvents, broadcastNotificationEvent } from "@/lib/broadcast-events";

// Uniform icons for the feed
const categoryConfigs: Record<NotificationCategory, { color: string; icon: any }> = {
    "Tümü": { color: "blue", icon: Bell },
    "Stok": { color: "rose", icon: ShoppingCart },
    "Servis": { color: "blue", icon: Truck },
    "Finans": { color: "emerald", icon: CreditCard },
    "Garanti": { color: "purple", icon: ShieldAlert },
};

export function NotificationFeed({ notifications: initialNotifications }: { notifications: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<NotificationCategory>("Tümü");
    const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications.notifications || []);
    const [total, setTotal] = useState(initialNotifications.total || 0);
    const [hasMore, setHasMore] = useState(initialNotifications.hasMore || false);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(initialNotifications.unreadCount || 0);
    const [snoozedCount, setSnoozedCount] = useState(initialNotifications.snoozedCount || 0);
    const [showReminders, setShowReminders] = useState(false);

    // Track all notifications to calculate counts for all categories simultaneously
    const [allNotifications, setAllNotifications] = useState<SystemNotification[]>(initialNotifications.notifications || []);
    const [viewMode, setViewMode] = useState<"active" | "snoozed">("active");

    const categoryCounts = {
        "Tümü": allNotifications.length,
        "Stok": allNotifications.filter(n => n.category === "Stok").length,
        "Servis": allNotifications.filter(n => n.category === "Servis").length,
        "Finans": allNotifications.filter(n => n.category === "Finans").length,
        "Garanti": allNotifications.filter(n => n.category === "Garanti").length,
    };

    // Modal state
    const [replenishModal, setReplenishModal] = useState<{
        isOpen: boolean;
        productId: string;
        productName: string;
        notificationId: string;
    }>({
        isOpen: false,
        productId: "",
        productName: "",
        notificationId: ""
    });

    useEffect(() => {
        if (activeTab || viewMode) {
            loadNotifications(1, activeTab, true);
        }
    }, [activeTab, viewMode]);

    useEffect(() => {
        const unsubscribe = subscribeToNotificationEvents((event) => {
            if (event.type === "REFRESH_NOTIFICATIONS" || event.type === "MARK_ALL_READ") {
                loadNotifications(1, activeTab, true);
            } else if (event.type === "MARK_AS_READ") {
                setNotifications((prev: SystemNotification[]) => prev.map(n => n.id === event.notificationId ? { ...n, isRead: true } : n));
                setAllNotifications((prev: SystemNotification[]) => prev.map(n => n.id === event.notificationId ? { ...n, isRead: true } : n));
                setUnreadCount((prev: number) => Math.max(0, prev - 1));
            } else if (event.type === "SNOOZE_NOTIFICATION") {
                setNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== event.notificationId));
                setAllNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== event.notificationId));
                loadNotifications(1, activeTab, true);
            }
        });
        return unsubscribe;
    }, [activeTab]);

    const loadNotifications = async (pageNum: number, category: NotificationCategory, reset: boolean = false) => {
        setIsLoading(true);
        try {
            const result = await getSystemNotifications({
                page: pageNum,
                limit: 15,
                category,
                showSnoozed: viewMode === "snoozed"
            });

            if (reset) {
                setNotifications(result.notifications);
                setAllNotifications(result.notifications);
                setPage(1);
            } else {
                setNotifications((prev: SystemNotification[]) => [...prev, ...result.notifications]);
                setPage(pageNum);
            }
            setHasMore(result.hasMore);
            setTotal(result.total);
            setUnreadCount(result.unreadCount);
            setSnoozedCount(result.snoozedCount || 0);
        } catch (error) {
            toast.error("Bildirimler yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (notification: SystemNotification) => {
        if (!notification.isRead) {
            setNotifications((prev: SystemNotification[]) => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            setAllNotifications((prev: SystemNotification[]) => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            setUnreadCount((prev: number) => Math.max(0, prev - 1));
            await markNotificationAsReadAction(notification.id);
            broadcastNotificationEvent({ type: "MARK_AS_READ", notificationId: notification.id });
            window.dispatchEvent(new CustomEvent("notification-update"));
            router.refresh();
        }

        if (notification.type === "COMPLETED" || notification.type === "DELIVERY_TIME" || notification.type === "PENDING_APPROVAL") {
            router.push(`/servis?highlight=${notification.referenceId}`);
        } else if (notification.type === "CRITICAL_STOCK") {
            setReplenishModal({
                isOpen: true,
                productId: notification.referenceId || "",
                productName: notification.title.split('-')[0].trim(),
                notificationId: notification.id
            });
        } else if (notification.type === "FINANCIAL_DELAY") {
            router.push(`/satis/kasa?highlight=${notification.referenceId}`);
        }
    };

    const handleDismiss = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const notification = notifications.find(n => n.id === id);
        setNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        setAllNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        await dismissNotificationAction(id, notification?.metadata);
        broadcastNotificationEvent({ type: "REFRESH_NOTIFICATIONS" });
        toast.success("Bildirim silindi");
    };

    const handleSnooze = async (e: React.MouseEvent | undefined, id: string, hours: number) => {
        if (e) e.stopPropagation();
        const notification = allNotifications.find(n => n.id === id);
        setNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        setAllNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        await snoozeNotificationAction(id, hours, {
            title: notification?.title,
            message: notification?.message,
            category: notification?.category,
            type: notification?.type
        });
        broadcastNotificationEvent({ type: "SNOOZE_NOTIFICATION", notificationId: id });
        window.dispatchEvent(new CustomEvent("notification-update"));
        router.refresh();
    };

    const handleUnsnooze = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        setAllNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        await unsnoozeNotificationAction(id);
        broadcastNotificationEvent({ type: "REFRESH_NOTIFICATIONS" });
        toast.success("Bildirim ertelemesi kaldırıldı", {
            icon: <Bell className="h-4 w-4 text-blue-500" />
        });
        window.dispatchEvent(new CustomEvent("notification-update"));
        router.refresh();
    };

    const handleMarkAllRead = async () => {
        const promise = markAllNotificationsAsReadAction();
        toast.promise(promise, {
            loading: 'Tümü okunuyor...',
            success: () => {
                setNotifications((prev: SystemNotification[]) => prev.map(n => ({ ...n, isRead: true })));
                setAllNotifications((prev: SystemNotification[]) => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                broadcastNotificationEvent({ type: "MARK_ALL_READ" });
                window.dispatchEvent(new CustomEvent("notification-update"));
                router.refresh();
                return 'Tüm bildirimler okundu olarak işaretlendi';
            },
            error: 'Bir hata oluştu'
        });
    };

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
            {showReminders ? (
                <ReminderManagement onBack={() => setShowReminders(false)} />
            ) : (
                <>
                    {/* Action Bar (Refined) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setViewMode(viewMode === "active" ? "snoozed" : "active")}
                                className={cn(
                                    "flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-300 font-bold text-xs uppercase tracking-tight shadow-sm active:scale-95",
                                    viewMode === "snoozed"
                                        ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/20"
                                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                <Clock className={cn("h-4 w-4", viewMode === "snoozed" ? "animate-pulse" : "")} />
                                Ertelenenler
                                <span className={cn(
                                    "ml-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black min-w-[20px] text-center",
                                    viewMode === "snoozed" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {snoozedCount}
                                </span>
                                {viewMode === "snoozed" && (
                                    <div className="ml-1 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleMarkAllRead}
                                className="h-10 px-4 rounded-xl bg-muted/30 border border-border/50 text-[11px] font-bold gap-2 hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
                            >
                                <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> Tümünü Okundu İşaretle
                            </Button>
                            <Button
                                onClick={() => setShowReminders(true)}
                                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20  text-[11px] gap-2 transition-all"
                            >
                                <Plus className="h-3.5 w-3.5" /> Hatırlatıcı Ekle
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-muted/20 border border-border/50 rounded-2xl backdrop-blur-3xl overflow-x-auto no-scrollbar scroll-smooth">
                        {(Object.keys(categoryConfigs) as NotificationCategory[]).map((cat) => {
                            const isActive = activeTab === cat;
                            const config = categoryConfigs[cat];
                            const count = categoryCounts[cat] || 0;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveTab(cat)}
                                    className={cn(
                                        "h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-tighter transition-all flex items-center gap-3 whitespace-nowrap group relative",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50"
                                    )}
                                >
                                    <config.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground group-hover:text-blue-500")} />
                                    {cat}
                                    <div className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[9px] font-black transition-all",
                                        isActive
                                            ? "bg-white/20 text-white shadow-inner"
                                            : "bg-muted text-muted-foreground group-hover:bg-blue-500/20 group-hover:text-blue-500"
                                    )}>
                                        {count}
                                    </div>
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_white]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feed List */}
                    <div className="space-y-2.5">
                        {notifications.length === 0 && !isLoading ? (
                            <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl border border-white/5 bg-white/[0.02]">
                                <div className="h-16 w-16 rounded-full bg-card flex items-center justify-center relative">
                                    <Bell className="h-6 w-6 text-slate-700" />
                                    <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-foreground mb-1">Her Şey Yolunda!</h3>
                                    <p className="text-muted-foreground text-[13px] font-bold max-w-xs mx-auto">Şu an müdahale etmeniz gereken herhangi bir bildirim bulunmuyor.</p>
                                </div>
                            </div>
                        ) : (
                            notifications.map((n, idx) => {
                                const Config = categoryConfigs[n.category] || categoryConfigs["Tümü"];
                                return (
                                    <div
                                        key={`${n.id}-${idx}`}
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                        onClick={() => handleAction(n)}
                                        className={cn(
                                            "group relative p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/50 transition-all cursor-pointer overflow-hidden animate-in fade-in duration-500",
                                            !n.isRead && "border-blue-500/30 bg-blue-500/[0.03] dark:bg-blue-500/[0.05]",
                                            "hover:translate-x-1 shadow-sm"
                                        )}
                                    >
                                        <div className="flex gap-4 items-center">
                                            {/* Uniform Icons */}
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-all group-hover:rotate-6 duration-500",
                                                n.type === "CRITICAL_STOCK" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                                                    n.type === "FINANCIAL_DELAY" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                        "bg-blue-500/10 border-blue-500/20 text-blue-500",
                                                !n.isRead && "ring-2 ring-blue-500/20"
                                            )}>
                                                <Config.icon className="h-5 w-5" />
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "text-sm font-bold tracking-tight transition-colors truncate",
                                                        n.isRead ? "text-muted-foreground" : "text-foreground group-hover:text-blue-500 dark:group-hover:text-blue-400"
                                                    )}>
                                                        {n.title}
                                                    </h3>
                                                    <span className="text-[10px]  text-muted-foreground/80 shrink-0">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr }).replace('yaklaşık ', '')}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-[12px] font-medium leading-tight truncate max-w-md",
                                                    n.isRead ? "text-muted-foreground/80" : "text-muted-foreground"
                                                )}>
                                                    {n.message}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-x-2 lg:group-hover:translate-x-0">
                                                <Button
                                                    className={cn(
                                                        "h-8 px-4 rounded-lg  text-[10px] shadow-lg transition-all uppercase tracking-tighter",
                                                        n.type === "CRITICAL_STOCK" ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20" :
                                                            "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                                                    )}
                                                >
                                                    İncele
                                                </Button>
                                                {/* Snooze/Unsnooze Button */}
                                                {viewMode === "snoozed" ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => handleUnsnooze(e, n.id)}
                                                        className="h-8 w-8 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-500 transition-all border border-border/50"
                                                        title="Ertelemeyi Kaldır"
                                                    >
                                                        <Bell className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-500 transition-all border border-border/50"
                                                                title="Ertele..."
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Clock className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 border-amber-500/20 bg-background/95 backdrop-blur-sm">
                                                            <DropdownMenuItem onClick={() => handleSnooze(undefined, n.id, 24)} className="cursor-pointer">
                                                                <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                                                <span>24 Saat</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleSnooze(undefined, n.id, 168)} className="cursor-pointer">
                                                                <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                                                                <span>1 Hafta</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleSnooze(undefined, n.id, 876000)} className="cursor-pointer">
                                                                <TimerOff className="mr-2 h-4 w-4 text-rose-500" />
                                                                <span>Süresiz</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                                {/* Trash Icon Instead of MoreHorizontal */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleDismiss(e, n.id)}
                                                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-border/50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {isLoading && (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500/50" />
                            </div>
                        )}
                    </div>

                    {/* Load More Button */}
                    {hasMore && !isLoading && (
                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={() => loadNotifications(page + 1, activeTab)}
                                className="h-10 px-8 rounded-xl bg-white/[0.03] border border-border hover:bg-white/5  text-[10px] text-blue-500 gap-2 transition-all active:scale-95 tracking-widest"
                            >
                                DAHA FAZLA GÖR <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            <ReplenishStockModal
                isOpen={replenishModal.isOpen}
                onClose={() => {
                    setReplenishModal(prev => ({ ...prev, isOpen: false }));
                    loadNotifications(page, activeTab, true);
                }}
                productId={replenishModal.productId}
                productName={replenishModal.productName}
                notificationId={replenishModal.notificationId}
            />
        </div>
    );
}
