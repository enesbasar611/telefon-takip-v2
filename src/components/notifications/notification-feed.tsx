"use client";

import { useState, useEffect } from "react";
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
    Settings2
} from "lucide-react";
import {
    SystemNotification,
    NotificationCategory,
    getSystemNotifications,
    markNotificationAsReadAction,
    markAllNotificationsAsReadAction,
    dismissNotificationAction
} from "@/lib/actions/notification-actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReplenishStockModal } from "./replenish-stock-modal";
import { ReminderManagement } from "./reminder-management";

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
    const [showReminders, setShowReminders] = useState(false);

    // Track all notifications to calculate counts for all categories simultaneously
    const [allNotifications, setAllNotifications] = useState<SystemNotification[]>(initialNotifications.notifications || []);

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
        if (activeTab) {
            loadNotifications(1, activeTab, true);
        }
    }, [activeTab]);

    const loadNotifications = async (pageNum: number, category: NotificationCategory, reset = false) => {
        setIsLoading(true);
        try {
            const result = await getSystemNotifications({
                page: pageNum,
                limit: 10,
                category
            });

            if (reset) {
                setNotifications(result.notifications);
                setPage(1);
            } else {
                setNotifications(prev => [...prev, ...result.notifications]);
                setPage(pageNum);
            }
            setTotal(result.total);
            setHasMore(result.hasMore);
            setUnreadCount(result.unreadCount);
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
            router.push(`/finans?highlight=${notification.referenceId}`);
        }
    };

    const handleDismiss = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        setAllNotifications((prev: SystemNotification[]) => prev.filter(n => n.id !== id));
        await dismissNotificationAction(id);
        toast.success("Bildirim silindi");
    };

    const handleMarkAllRead = async () => {
        const promise = markAllNotificationsAsReadAction();
        toast.promise(promise, {
            loading: 'Tümü okunuyor...',
            success: () => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                window.dispatchEvent(new CustomEvent("notification-update"));
                router.refresh();
                return 'Tüm bildirimler okundu olarak işaretlendi';
            },
            error: 'Bir hata oluştu'
        });
    };

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {showReminders ? (
                <ReminderManagement onBack={() => setShowReminders(false)} />
            ) : (
                <>
                    {/* Header Area */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-white tracking-tighter">
                                Bildirimler <span className="text-blue-500 font-serif italic text-2xl">&</span> Hatırlatmalar
                            </h1>
                            <p className="text-slate-400 font-medium text-[13px] flex items-center gap-2">
                                <span className={cn("h-1.5 w-1.5 rounded-full", unreadCount > 0 ? "bg-blue-500 animate-pulse" : "bg-slate-600")} />
                                Şu an {unreadCount} adet okunmamış işleminiz var.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleMarkAllRead}
                                className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/5 font-bold text-[11px] gap-2 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                            >
                                <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> Tümünü Okundu İşaretle
                            </Button>
                            <Button
                                onClick={() => setShowReminders(true)}
                                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 font-bold text-[11px] gap-2 transition-all"
                            >
                                <Plus className="h-3.5 w-3.5" /> Hatırlatıcı Ekle
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl overflow-x-auto no-scrollbar scroll-smooth">
                        {(Object.keys(categoryConfigs) as NotificationCategory[]).map((cat) => {
                            const isActive = activeTab === cat;
                            const config = categoryConfigs[cat];
                            const count = categoryCounts[cat] || 0;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveTab(cat)}
                                    className={cn(
                                        "h-10 px-5 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all flex items-center gap-3 whitespace-nowrap group relative",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black scale-[1.02]"
                                            : "text-slate-500 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/20"
                                    )}
                                >
                                    <config.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                                    {cat}
                                    <div className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[9px] font-black transition-all",
                                        isActive
                                            ? "bg-white/20 text-white shadow-inner"
                                            : "bg-white/5 text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-400"
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
                            <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 matte-card rounded-3xl border-white/5 bg-white/[0.01]">
                                <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center relative">
                                    <Bell className="h-6 w-6 text-slate-700" />
                                    <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Her Şey Yolunda!</h3>
                                    <p className="text-slate-500 text-[13px] font-medium max-w-xs mx-auto">Şu an müdahale etmeniz gereken herhangi bir bildirim bulunmuyor.</p>
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
                                            "group relative p-4 matte-card rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer overflow-hidden animate-in slide-in-from-bottom-2 duration-500",
                                            !n.isRead && "border-blue-500/20 bg-blue-500/[0.02]",
                                            "hover:translate-x-1"
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
                                                        n.isRead ? "text-slate-400" : "text-white group-hover:text-blue-400 font-black"
                                                    )}>
                                                        {n.title}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr }).replace('yaklaşık ', '')}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-[12px] font-medium leading-tight truncate max-w-md",
                                                    n.isRead ? "text-slate-500" : "text-slate-400"
                                                )}>
                                                    {n.message}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-x-2 lg:group-hover:translate-x-0">
                                                <Button
                                                    className={cn(
                                                        "h-8 px-4 rounded-lg font-black text-[10px] shadow-lg transition-all uppercase tracking-tighter",
                                                        n.type === "CRITICAL_STOCK" ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20" :
                                                            "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                                                    )}
                                                >
                                                    İncele
                                                </Button>
                                                {/* Trash Icon Instead of MoreHorizontal */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleDismiss(e, n.id)}
                                                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
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
                                className="h-10 px-8 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/5 font-black text-[10px] text-blue-500 gap-2 transition-all active:scale-95 tracking-widest"
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
