"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    AlertTriangle,
    Clock,
    CheckCheck,
    Smartphone,
    TrendingDown,
    ShieldAlert
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
import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await getSystemNotifications();
            setNotifications(data);
            setUnreadCount(data.length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'CRITICAL_STOCK': return <TrendingDown className="h-5 w-5 text-rose-500" />;
            case 'OVERDUE_SERVICE': return <Clock className="h-5 w-5 text-amber-500" />;
            case 'SERVICE': return <Smartphone className="h-5 w-5 text-blue-500" />;
            default: return <Bell className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <DropdownMenu>
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
            <DropdownMenuContent align="end" className="w-[420px] bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden font-sans">
                <DropdownMenuLabel className="p-6 flex items-center justify-between bg-muted/20">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Sistem Bildirimleri</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[11px] text-muted-foreground font-medium">{unreadCount} Yeni Bildirim</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnreadCount(0)}
                        className="h-9 text-xs font-bold text-primary hover:bg-primary/5 border border-primary/10 rounded-xl px-4 group transition-all"
                    >
                        <CheckCheck className="h-3.5 w-3.5 mr-2 group-hover:scale-110 transition-transform" />
                        Okundu İşaretle
                    </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border m-0" />

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {isLoading && notifications.length === 0 ? (
                        <div className="p-10 text-center animate-pulse">
                            <div className="h-4 w-3/4 bg-muted rounded mx-auto mb-2" />
                            <div className="h-4 w-1/2 bg-muted rounded mx-auto" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto opacity-10 mb-6" />
                            <p className="text-[12px] font-bold text-muted-foreground">Şu an bildirim bulunmuyor</p>
                        </div>
                    ) : (
                        notifications.map((n, i) => (
                            <DropdownMenuItem key={n.id} className="p-6 border-b border-border/40 last:border-none focus:bg-muted/30 cursor-pointer group transition-all outline-none">
                                <div className="flex gap-5 w-full">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-sm transition-transform group-hover:scale-105",
                                        n.type === 'CRITICAL_STOCK' ? "bg-rose-500/10 border-rose-500/20" : "bg-primary/10 border-primary/20"
                                    )}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[13px] font-bold text-foreground truncate pr-4">{n.title}</span>
                                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-md">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr })}
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed group-hover:text-foreground transition-colors line-clamp-2">
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="bg-border m-0" />
                <Link href="/bildirimler" className="w-full">
                    <div className="p-5 text-center text-xs font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer">
                        Tüm Arşivi Görüntüle
                    </div>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
