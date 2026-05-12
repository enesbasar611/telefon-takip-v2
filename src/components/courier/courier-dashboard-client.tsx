"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import {
    TrendingUp,
    MessageSquare,
    ListTodo as ListTodoIcon,
    Settings2,
    Share2,
    Bell,
    LogOut,
    CheckCircle,
    Trash,
    Plus,
    Minus,
    AlertCircle,
    AlertTriangle,
    ChevronDown,
    Loader2,
    Calendar,
    Filter,
    ChevronRight,
    CircleDashed,
    LayoutGrid,
    Columns,
    Package,
    CheckCircle2,
    Circle,
    Clock,
    Search,
    CheckSquare,
    StretchHorizontal,
    Phone,
    Check,
    ArrowUpCircle,
    User,
    ListTodo,
    X
} from "lucide-react";
import { markShortageAsTaken, markShortageAsNotFound, assignShortageToCourier, approveShortageItem, deleteShortageItem, finishMyDay, finishCourierDay, getCourierNotifications, deleteShortageItems as deleteShortageItemsAction } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { AddShortageForm } from "@/components/shortage/add-shortage-form";
import { signOut } from "next-auth/react";
import { ApproveShortageModal } from "@/components/shortage/approve-shortage-modal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn, getDeterministicColor, getInitials } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CourierDashboardClientProps {
    initialItems: any[];
    initialAllShortages?: any[];
    categories?: any[];
    userId: string;
    userRole?: string;
    couriers?: any[];
    initialNotifications?: any[];
    initialDate?: string;
}

const priorityWeight: Record<string, number> = {
    ACIL: 3,
    YUKSEK: 2,
    NORMAL: 1,
};

const sortByCourierPriority = (list: any[]) =>
    [...list].sort((a, b) => {
        const scoreDiff = (b.courierPriorityScore || 0) - (a.courierPriorityScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

const getPriorityClassName = (label?: string) => {
    if (label === "ACIL") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (label === "YUKSEK") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
};

const getPriorityLabel = (label?: string) => {
    if (label === "ACIL") return "ACIL";
    if (label === "YUKSEK") return "YUKSEK";
    return "NORMAL";
};

const cleanCourierNote = (notes?: string | null) =>
    String(notes || "")
        .replace("[BULUNMADI]", "")
        .replace(/\[ONCELIK:(ACIL|YUKSEK|NORMAL)\]/gi, "")
        .trim();

export function CourierDashboardClient({ initialItems, initialAllShortages = [], categories = [], userId, userRole, couriers = [], initialNotifications = [], initialDate }: CourierDashboardClientProps) {
    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [allShortages, setAllShortages] = useState(initialAllShortages);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [lastRefreshCount, setLastRefreshCount] = useState(initialItems.length);
    const [showNewBadge, setShowNewBadge] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
    const [isUnassignedOpen, setIsUnassignedOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'single' | 'double'>('double');
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(userRole || "");
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(initialDate || "");
    const [mounted, setMounted] = useState(false);
    const [shortcutCourierId, setShortcutCourierId] = useState<string>("");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            setShortcutCourierId(userId);
            return;
        }

        const savedCourierId = typeof window !== "undefined" ? localStorage.getItem("lastSelectedCourierId") : null;
        const savedCourierExists = savedCourierId && couriers.some((courier: any) => courier.id === savedCourierId);
        const defaultCourierId = savedCourierExists ? savedCourierId : couriers[0]?.id;

        if (defaultCourierId) {
            setShortcutCourierId(defaultCourierId);
            localStorage.setItem("lastSelectedCourierId", defaultCourierId);
        }
    }, [couriers, isAdmin, userId]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSelectedDate(val);
        const searchParams = new URLSearchParams(window.location.search);
        if (val) searchParams.set("date", val);
        else searchParams.delete("date");
        router.push(`/kurye?${searchParams.toString()}`);
    };

    // Polling for live updates
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 5000);
        return () => clearInterval(interval);
    }, [router]);

    // Update state and detect new items
    useEffect(() => {
        if (initialItems.length > lastRefreshCount) {
            setShowNewBadge(true);
            // Only toast if courier, admins might just be viewing
            if (!isAdmin) {
                toast("YENİ SİPARİŞ ATANDI!", {
                    description: "Listeniz otomatik güncellendi.",
                    icon: <Bell className="h-5 w-5 text-red-500" />
                });
            }
        }
        setItems(initialItems);
        setAllShortages(initialAllShortages);
        setLastRefreshCount(initialItems.length);
    }, [initialItems, initialAllShortages, lastRefreshCount, isAdmin]);

    // Admin notification detector & Polling
    const [activeCourierNotifications, setActiveCourierNotifications] = useState<any[]>(initialNotifications);

    useEffect(() => {
        if (!isAdmin) return;

        const pollNotifications = async () => {
            const res = await getCourierNotifications();
            if (res.success) {
                // Check if any new notification arrived to toast it
                res.notifications.forEach((notif: any) => {
                    const lsKey = `notif_seen_${notif.id}`;
                    if (!localStorage.getItem(lsKey)) {
                        localStorage.setItem(lsKey, "true");
                        toast.success("Kurye Günü Bitirdi", {
                            description: notif.message,
                            duration: 10000,
                            icon: <Bell className="h-5 w-5 text-orange-500" />
                        });
                    }
                });
                setActiveCourierNotifications(res.notifications);
            }
        };

        const interval = setInterval(pollNotifications, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [isAdmin]);

    const filteredItems = sortByCourierPriority(items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.shop?.name && item.shop.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.customer?.name && item.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.requesterName && item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()))
    ));

    const pendingShortages = sortByCourierPriority(allShortages.filter(s => !s.assignedToId));
    const nextRouteItems = sortByCourierPriority(items.filter((item: any) => !item.isResolved)).slice(0, 3);
    const highPriorityCount = items.filter((item: any) => ["ACIL", "YUKSEK"].includes(item.courierPriorityLabel)).length;
    const resolveCriticalShortcutQuantity = (item: any, requestedQuantity: number) => {
        const stock = Number(item.product?.stock ?? item.stock ?? 0);
        const criticalStock = Number(item.product?.criticalStock ?? item.criticalStock ?? 0);
        if (!item.productId || !criticalStock || stock > criticalStock || stock + requestedQuantity > criticalStock) {
            return requestedQuantity;
        }

        const suggestedQuantity = Math.max(requestedQuantity, criticalStock + 1 - stock);
        const nextStock = stock + requestedQuantity;
        const suggestedStock = stock + suggestedQuantity;
        const useSuggested = confirm(
            `${item.name} için kritik stok seviyesi ${criticalStock}. ${requestedQuantity} adet gönderirseniz güncel stok ${nextStock} olacak ve ürün eksik listesinde kalacak.\n\nStoğu ${suggestedStock} yapmak ister misiniz?\n\nTamam: Evet, miktarı ${suggestedQuantity} yap\nİptal: Hayır, yine de gönder`
        );

        return useSuggested ? suggestedQuantity : requestedQuantity;
    };
    const getCourierWorkload = (courierId: string) => {
        const activeItems = items.filter((st: any) => st.assignedToId === courierId && !st.isResolved);
        const priorityScore = activeItems.reduce((sum: number, item: any) => sum + (priorityWeight[item.courierPriorityLabel] || 1), 0);
        return {
            activeItems,
            priorityScore,
            highPriority: activeItems.filter((item: any) => ["ACIL", "YUKSEK"].includes(item.courierPriorityLabel)).length
        };
    };

    const handleToggleTaken = async (id: string, currentStatus: boolean) => {
        setLoadingId(id);

        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isTaken: !currentStatus, takenAt: !currentStatus ? new Date().toISOString() : null } : item
        ));

        try {
            const res = await markShortageAsTaken(id, !currentStatus);
            if (res.success) {
                toast.success(!currentStatus ? "Ürün alındı." : "Geri alındı.");
                // Background sync
                router.refresh();
            } else {
                toast.error("İşlem başarısız.");
                router.refresh(); // Sync back
            }
        } catch (error) {
            toast.error("Hata oluştu.");
            router.refresh();
        } finally {
            setLoadingId(null);
        }
    };

    const handleAssignShortcut = async (shortageId: string) => {
        setAssigningId(shortageId);

        // Optimistic update
        const movedItem = allShortages.find(s => s.id === shortageId);
        const targetCourierId = isAdmin ? shortcutCourierId : userId;
        if (!targetCourierId) {
            toast.error("Atama için kurye seçin.");
            setAssigningId(null);
            return;
        }
        const requestedQty = itemQuantities[shortageId] || movedItem?.quantity || 1;
        const customQty = movedItem ? resolveCriticalShortcutQuantity(movedItem, requestedQty) : requestedQty;

        if (movedItem) {
            const updatedItem = { ...movedItem, assignedToId: targetCourierId, isTaken: false, quantity: customQty, requesterName: movedItem.requesterName || "Dükkan" };
            setItems(prev => [updatedItem, ...prev]);
            setAllShortages(prev => prev.filter(s => s.id !== shortageId));
        }

        try {
            const res = await assignShortageToCourier(shortageId, targetCourierId, customQty);
            if (res.success) {
                toast.success("Görev listenize eklendi.");
                router.refresh();
            } else {
                toast.error("Atama başarısız.");
                router.refresh();
            }
        } catch (error) {
            toast.error("Hata oluştu.");
            router.refresh();
        } finally {
            setAssigningId(null);
        }
    };

    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approvingItem, setApprovingItem] = useState<any>(null);

    const handleApprove = async (id: string, quantity: number, mode: "STOCK" | "SALE" | "DEBT" = "STOCK", paymentMethod?: any, customPrice?: number, currency?: "TL" | "USD") => {
        setLoadingId(id);

        // Optimistic update
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            const res = await approveShortageItem(id, quantity, mode, paymentMethod, customPrice, currency);
            if (res.success) {
                toast.success(mode === "STOCK" ? "Ürün stoğa eklendi." : "Ürün stoğa eklendi ve işlem gerçekleştirildi.");
                router.refresh();
            } else {
                toast.error(res.error || "Onay başarısız.");
                router.refresh(); // Sync back
            }
        } catch (err) {
            toast.error("Hata oluştu.");
            router.refresh();
        } finally {
            setLoadingId(null);
            setApprovingItem(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu siparişi silmek istediğinizden emin misiniz?")) return;
        setLoadingId(id);

        try {
            let res = await deleteShortageItem(id);
            if ((res as any).needsStockApproval) {
                const forceDelete = confirm(`${res.error}\n\nTamam: Yine de sil\nİptal: Stok kaydını yapmaya dön`);
                if (!forceDelete) {
                    router.refresh();
                    return;
                }
                res = await deleteShortageItem(id, true);
            }
            if (res.success) {
                setItems(prev => prev.filter(i => i.id !== id));
                setAllShortages(prev => prev.filter(i => i.id !== id));
                setSelectedIds(prev => prev.filter(sid => sid !== id));
                toast.success("Sipariş silindi.");
                router.refresh();
            } else {
                toast.error(res.error || "Silme işlemi başarısız.");
                router.refresh();
            }
        } catch (err) {
            router.refresh();
        } finally {
            setLoadingId(null);
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        if (!confirm(`${ids.length} adet siparişi silmek istediğinizden emin misiniz?`)) return;
        setLoadingId("bulk");

        try {
            let res = await deleteShortageItemsAction(ids);
            if ((res as any).needsStockApproval) {
                const forceDelete = confirm(`${res.error}\n\nTamam: Yine de sil\nİptal: Stok kaydını yapmaya dön`);
                if (!forceDelete) {
                    router.refresh();
                    return;
                }
                res = await deleteShortageItemsAction(ids, true);
            }
            if (res.success) {
                setItems(prev => prev.filter(i => !ids.includes(i.id)));
                setAllShortages(prev => prev.filter(i => !ids.includes(i.id)));
                setSelectedIds(prev => prev.filter(sid => !ids.includes(sid)));
                if (selectedIds.length <= ids.length) {
                    setIsSelectionMode(false);
                }
                toast.success("Seçili siparişler silindi.");
                router.refresh();
            } else {
                toast.error(res.error || "Toplu silme başarısız.");
                router.refresh();
            }
        } catch (err) {
            router.refresh();
        } finally {
            setLoadingId(null);
        }
    };

    const handleFinishMyDay = async () => {
        if (!confirm("Günlük siparişlerinizi bitirmek istediğinize emin misiniz? Bu işlem yöneticiye bildirim gönderecektir.")) return;
        try {
            const res = await finishMyDay();
            if (res.success) {
                toast.success("Gününüzü bitirdiğinize dair yöneticiye bildirim gönderildi.");
            } else {
                toast.error(res.error || "Bildirim gönderilemedi.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        }
    };

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [finishingCourier, setFinishingCourier] = useState<any>(null);
    const [transferTargetId, setTransferTargetId] = useState<string>("pool");

    const handleFinishDayClick = (courier: any) => {
        setFinishingCourier(courier);
        setIsTransferModalOpen(true);
        setTransferTargetId("pool");
    };

    const handleConfirmFinishDay = async () => {
        if (!finishingCourier) return;
        try {
            const res = await finishCourierDay(finishingCourier.id);
            if (res.success) {
                // If transfer target is another courier, we need to assign them
                if (transferTargetId !== "pool") {
                    const remainingItems = items.filter((st: any) => st.assignedToId === finishingCourier.id && !st.isResolved);
                    if (remainingItems.length > 0) {
                        const ids = remainingItems.map((i: any) => i.id);
                        const { assignShortageBulkToCourier } = await import("@/lib/actions/shortage-actions");
                        await assignShortageBulkToCourier(ids, transferTargetId);
                        toast.success(`${remainingItems.length} ürün ${couriers.find(c => c.id === transferTargetId)?.name} kuryesine aktarıldı.`);
                    }
                }

                toast.success(`${finishingCourier.name} kuryesinin günü bitirildi.`);
                setIsTransferModalOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "İşlem başarısız.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        }
    };

    const handleFinishCourierDay = async (courierId: string) => {
        const courier = couriers.find(c => c.id === courierId);
        if (courier) handleFinishDayClick(courier);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleGroupSelect = (groupId: string, groupItems: any[]) => {
        const itemIds = groupItems.map(i => i.id);
        const allSelected = itemIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...itemIds])));
        }
    };

    const stats = {
        total: items.length,
        taken: items.filter(i => i.isTaken || i.isResolved).length,
        remaining: items.filter(i => !i.isTaken && !i.isResolved).length
    };

    const handleToggleNotFound = async (id: string, currentStatus: boolean) => {
        setLoadingId(id);

        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isNotFound: !currentStatus, isTaken: false, takenAt: null } : item
        ));

        try {
            const res = await markShortageAsNotFound(id, !currentStatus);
            if (res.success) {
                toast.success(!currentStatus ? "Ürün bulunmadı olarak işaretlendi." : "Bulunmadı işareti kaldırıldı.");
                router.refresh();
            } else {
                toast.error(res.error || "İşlem başarısız.");
                router.refresh();
            }
        } catch (error) {
            toast.error("Hata oluştu.");
            router.refresh();
        } finally {
            setLoadingId(null);
        }
    };

    const isCourierOnly = userRole === "COURIER";

    return (
        <div className="animate-in fade-in duration-500 pb-24 relative">
            {/* Dedicated Mobile Courier Header */}
            {isCourierOnly && (
                <div className="sticky top-0 z-[60] bg-background/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/10 dark:bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <ListTodo className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-tight leading-none mb-1">Kurye Paneli</h1>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">SİSTEM CANLI</span>
                                {couriers.find(c => c.id === userId)?.points > 0 && (
                                    <>
                                        <span className="text-[8px] opacity-20 mr-1">•</span>
                                        <TrendingUp className="w-2.5 h-2.5 text-blue-500" />
                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{couriers.find(c => c.id === userId).points} PUAN</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {showNewBadge && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewBadge(false)}
                                className="relative rounded-full h-9 w-9 bg-red-500/10 dark:bg-red-500/10 hover:bg-red-500/20"
                            >
                                <Bell className="h-4 w-4 text-red-500" />
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background animate-bounce" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut()}
                            className="rounded-full h-9 w-9 bg-zinc-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="px-4 pt-6 space-y-6 max-w-[1600px] mx-auto">
                {!isCourierOnly && (
                    <PageHeader
                        title="Kurye Kontrol"
                        description="Görev yönetimi ve eksik listesi takibi."
                        icon={ListTodo}
                        badge={
                            <Badge className="bg-blue-500 text-black border-none px-4 py-1 text-[10px] uppercase font-black tracking-widest shadow-lg">
                                {stats.remaining} AKTİF
                            </Badge>
                        }
                    />
                )}

                {(isAdmin || isCourierOnly) && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Quick Add Form Card - ONLY FOR ADMIN */}
                        {isAdmin && (
                            <>
                                <Card className="rounded-3xl border-none bg-card/60 dark:bg-card/40 backdrop-blur-3xl shadow-xl overflow-visible group hover:bg-card/80 dark:hover:bg-card/50 transition-all border border-zinc-200 dark:border-white/5 relative z-50 lg:col-span-4">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Plus className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-tight">Yeni Sipariş</h3>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">HIZLI SİPARİŞ KARTI</p>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-100 dark:bg-white/5 p-4 rounded-2xl border border-zinc-200 dark:border-white/5">
                                            <AddShortageForm categories={categories} />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-3xl border-none bg-card/60 dark:bg-card/40 backdrop-blur-3xl shadow-xl overflow-hidden group hover:bg-card/80 dark:hover:bg-card/50 transition-all border border-zinc-200 dark:border-white/5 relative z-40 lg:col-span-5 flex flex-col">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <User className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-tight">Kurye Kontrolü</h3>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">GÜNLÜK İŞLEM BİTİRME & TAKİP</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                            {couriers.map(c => {
                                                const courierItems = items.filter((st: any) => st.assignedToId === c.id);
                                                const workload = getCourierWorkload(c.id);
                                                const totalToday = courierItems.length;
                                                const resolvedToday = courierItems.filter((st: any) => st.isTaken || st.isResolved).length;
                                                const remainingCount = courierItems.filter((st: any) => !st.isTaken && !st.isResolved).length;
                                                const successRate = totalToday > 0 ? Math.round((resolvedToday / totalToday) * 100) : 0;
                                                const isWaitingApproval = activeCourierNotifications.some(n => n.referenceId === c.id);

                                                return (
                                                    <div key={c.id} className={cn(
                                                        "bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 p-4 rounded-3xl flex flex-col gap-4 group/courier relative transition-all hover:shadow-md",
                                                        isWaitingApproval && "border-orange-500/50 bg-orange-500/[0.03] ring-1 ring-orange-500/10 shadow-lg shadow-orange-500/5 transition-all duration-500"
                                                    )}>
                                                        <div className="flex justify-between items-center -mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center font-black text-[10px]">
                                                                    {getInitials(`${c.name} ${c.surname}`)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-xs uppercase tracking-tight truncate max-w-[80px] leading-tight">{c.name} {c.surname}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <TrendingUp className="w-2.5 h-2.5 text-blue-500" />
                                                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{c.points || 0} PUAN</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isWaitingApproval && (
                                                                <div className="flex items-center gap-1 bg-orange-500 text-white text-[7px] font-black px-2 py-1 rounded-full shadow-lg shadow-orange-500/20 animate-pulse">
                                                                    ONAY
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 p-2 rounded-2xl flex flex-col items-center">
                                                                <span className="text-[7px] font-black text-emerald-500/70 uppercase tracking-widest">TAMAM</span>
                                                                <span className="text-sm font-black text-emerald-500">{resolvedToday}</span>
                                                            </div>
                                                            <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 p-2 rounded-2xl flex flex-col items-center">
                                                                <span className="text-[7px] font-black text-orange-500/70 uppercase tracking-widest">KALAN</span>
                                                                <span className="text-sm font-black text-orange-500">{remainingCount}</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-blue-500/5 border border-blue-500/10 p-2 rounded-2xl flex items-center justify-between">
                                                            <span className="text-[7px] font-black text-blue-500/70 uppercase tracking-widest">YUK</span>
                                                            <span className="text-sm font-black text-blue-500">{workload.priorityScore}</span>
                                                            {workload.highPriority > 0 && (
                                                                <Badge className="bg-red-500/10 text-red-500 border-none text-[7px] font-black">
                                                                    {workload.highPriority} ONCELIK
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <Button
                                                            variant={isWaitingApproval ? "default" : "outline"}
                                                            onClick={() => handleFinishCourierDay(c.id)}
                                                            className={cn(
                                                                "w-full text-[10px] font-black uppercase h-10 transition-all shadow-sm rounded-2xl",
                                                                isWaitingApproval
                                                                    ? "bg-orange-500 hover:bg-orange-600 text-white border-none shadow-orange-500/20"
                                                                    : "border-zinc-200 dark:border-white/10 text-muted-foreground hover:border-orange-500/50 hover:text-orange-500"
                                                            )}
                                                        >
                                                            {isWaitingApproval ? "Bitir" : "Bitir"}
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                            {couriers.length === 0 && (
                                                <span className="text-xs text-muted-foreground font-black uppercase">Aktif kurye bulunamadı.</span>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <div className="lg:col-span-3 flex flex-col gap-4">
                                    {[
                                        { label: "GÜNCEL", val: stats.total, color: "blue", icon: Package },
                                        { label: "TAMAM", val: stats.taken, color: "emerald", icon: CheckCircle2 },
                                        { label: "KALAN", val: stats.remaining, color: "orange", icon: Clock }
                                    ].map((s, i) => (
                                        <Card key={i} className="rounded-3xl border-none shadow-xl bg-card/80 dark:bg-card/60 backdrop-blur-xl overflow-hidden group hover:scale-[1.01] transition-all p-1 border border-zinc-200 dark:border-white/5 flex-1 min-h-[100px]">
                                            <CardContent className="h-full p-6 flex items-center gap-6">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                                                    s.color === "blue" ? "bg-blue-500 text-white shadow-blue-500/20" :
                                                        s.color === "emerald" ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                                                            "bg-orange-500 text-white shadow-orange-500/20"
                                                )}>
                                                    <s.icon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50 mb-1">{s.label}</p>
                                                    <h3 className="font-black text-3xl tracking-tighter leading-tight">{s.val}</h3>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Mobile Courier "GÜNÜ BİTİR" */}
                {isCourierOnly && (
                    <Button
                        onClick={handleFinishMyDay}
                        disabled={stats.remaining === 0}
                        className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20"
                    >
                        {stats.remaining > 0 ? "GÜNÜ BİTİR VE BİLDİR" : "SİPARİŞ YOK"}
                    </Button>
                )}

                {nextRouteItems.length > 0 && (
                    <Card className="rounded-3xl border border-blue-500/10 bg-blue-500/[0.03] shadow-sm">
                        <CardContent className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <ArrowUpCircle className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">Onerilen Rota</h3>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        {highPriorityCount} oncelikli gorev sirada
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 lg:max-w-3xl">
                                {nextRouteItems.map((item: any, index: number) => (
                                    <div key={item.id} className="rounded-2xl bg-background/70 border border-border/60 p-3 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">#{index + 1}</span>
                                            <Badge variant="outline" className={cn("text-[8px] font-black border", getPriorityClassName(item.courierPriorityLabel))}>
                                                {getPriorityLabel(item.courierPriorityLabel)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-black uppercase truncate">{item.name}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground truncate mt-1">
                                            {(item.courierPriorityReasons || []).join(" / ") || "Standart siralama"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                        <Input
                            placeholder="ÜRÜN VEYA BAYİ ARA..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 rounded-2xl h-14 font-black uppercase text-xs tracking-widest focus:ring-blue-500/20"
                        />
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <div className="flex items-center bg-zinc-100 dark:bg-white/5 px-4 rounded-2xl border border-zinc-200 dark:border-white/5 h-14 min-w-[200px]">
                                <span className="text-[10px] uppercase font-black text-muted-foreground mr-2 shrink-0">GÜN:</span>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 font-black uppercase text-xs"
                                />
                            </div>
                            <div className="flex gap-2 bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200 dark:border-white/5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        if (isSelectionMode) setSelectedIds([]);
                                    }}
                                    className={cn(
                                        "rounded-xl h-12 w-12",
                                        isSelectionMode ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-muted-foreground hover:text-indigo-500"
                                    )}
                                    title={isSelectionMode ? "Seçimi Kapat" : "Seçim Modunu Aç"}
                                >
                                    <CheckSquare className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode('single')}
                                    className={cn(
                                        "rounded-xl h-12 w-12",
                                        viewMode === 'single' ? "bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm" : "text-muted-foreground hover:text-blue-600 dark:hover:text-white"
                                    )}
                                >
                                    <StretchHorizontal className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode('double')}
                                    className={cn(
                                        "rounded-xl h-12 w-12",
                                        viewMode === 'double' ? "bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm" : "text-muted-foreground hover:text-blue-600 dark:hover:text-white"
                                    )}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={cn(
                    "grid gap-8",
                    isAdmin && viewMode === "double" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                )}>
                    {(() => {
                        const groupsMap = new Map();
                        filteredItems.forEach((item: any) => {
                            // Group by customer if available, then by requesterName, then by shop
                            const groupKey = item.customerId
                                ? `customer-${item.customerId}`
                                : item.requesterName
                                    ? `requester-${item.requesterName}`
                                    : `shop-${item.shopId || 'default'}`;

                            if (!groupsMap.has(groupKey)) {
                                groupsMap.set(groupKey, {
                                    id: groupKey,
                                    title: item.customer?.name || item.requesterName || item.shop?.name || 'GENEL',
                                    customer: item.customer,
                                    shop: item.shop,
                                    requesterName: item.requesterName,
                                    items: []
                                });
                            }
                            groupsMap.get(groupKey).items.push(item);
                        });

                        return Array.from(groupsMap.values()).map((group, idx) => (
                            <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center border text-white font-black text-xs shadow-lg uppercase",
                                            getDeterministicColor(group.customer?.name || group.requesterName || group.shop?.name || "DÜKKAN")
                                        )}>
                                            {getInitials(group.customer?.name || group.requesterName || group.shop?.name || "DÜKKAN")}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">
                                                {group.customer?.name || group.requesterName || group.shop?.name || "DÜKKAN"}
                                            </h3>
                                            {(group.customer?.phone || group.shop?.phone) && (
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                                    <Phone className="w-3 h-3" />
                                                    {group.customer?.phone || group.shop?.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <div className="flex items-center bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/5 mr-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!isSelectionMode) setIsSelectionMode(true);
                                                        toggleGroupSelect(idx.toString(), group.items);
                                                    }}
                                                    className={cn(
                                                        "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                        group.items.every((i: any) => selectedIds.includes(i.id))
                                                            ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {group.items.every((i: any) => selectedIds.includes(i.id)) ? "Bırak" : "Seç"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleBulkDelete(group.items.map((i: any) => i.id))}
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/5 font-black text-[10px]">
                                            {group.items.length} KALEM
                                        </Badge>
                                    </div>
                                </div>

                                <div className={cn(
                                    "flex flex-col gap-2 ml-4 pl-6 border-l-2 border-zinc-500/10", // Single list for items inside shop
                                    !isAdmin && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ml-0 pl-0 border-none" // Cards for courier
                                )}>
                                    <AnimatePresence mode="popLayout">
                                        {group.items.map((item: any) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={cn(
                                                    "group transition-all duration-300 border shadow-sm relative overflow-hidden",
                                                    isAdmin ? "p-3 rounded-xl flex items-center gap-4" : "p-4 rounded-2xl flex flex-col",
                                                    item.isNotFound
                                                        ? "bg-red-500/10 dark:bg-red-500/10 border-red-500/30"
                                                        : item.isTaken
                                                        ? "bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20"
                                                        : "bg-card dark:bg-card/40 border-zinc-200 dark:border-white/5 hover:border-blue-500/30",
                                                    selectedIds.includes(item.id) && "border-blue-500/50 bg-blue-500/5"
                                                )}
                                            >
                                                {isAdmin && isSelectionMode && (
                                                    <button
                                                        onClick={() => toggleSelect(item.id)}
                                                        className={cn(
                                                            "h-6 w-6 rounded-lg flex items-center justify-center transition-all border shrink-0",
                                                            selectedIds.includes(item.id)
                                                                ? "bg-blue-500 border-blue-500 text-black"
                                                                : "border-zinc-300 dark:border-white/10 hover:border-blue-500"
                                                        )}
                                                    >
                                                        {selectedIds.includes(item.id) && <Check className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                <div className={cn("flex items-center gap-4", isAdmin ? "flex-1" : "w-full")}>
                                                    <button
                                                        onClick={() => !item.isNotFound && handleToggleTaken(item.id, item.isTaken)}
                                                        disabled={loadingId === item.id}
                                                        className={cn(
                                                            "rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg group-active:scale-90",
                                                            isAdmin ? "h-10 w-10" : "h-12 w-12",
                                                            item.isNotFound
                                                                ? "bg-red-500 text-white"
                                                                : item.isTaken
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-white/5 text-muted-foreground hover:bg-blue-500 hover:text-white border border-white/5"
                                                        )}
                                                    >
                                                        {loadingId === item.id ? (
                                                            <Clock className={cn(isAdmin ? "w-4 h-4" : "w-6 h-6", "animate-spin")} />
                                                        ) : item.isNotFound ? (
                                                            <X className={isAdmin ? "w-5 h-5" : "w-6 h-6"} />
                                                        ) : item.isTaken ? (
                                                            <CheckCircle2 className={isAdmin ? "w-5 h-5" : "w-6 h-6"} />
                                                        ) : (
                                                            <Circle className={isAdmin ? "w-5 h-5 opacity-20" : "w-6 h-6 opacity-20"} />
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn("flex items-center gap-3", isAdmin ? "justify-between" : "flex-col items-start")}>
                                                            <div className="min-w-0">
                                                                <h4 className={cn(
                                                                    "font-black text-sm tracking-tight truncate leading-none mb-1 uppercase",
                                                                    item.isTaken ? "text-muted-foreground line-through opacity-40" : "text-zinc-900 dark:text-zinc-100"
                                                                )}>
                                                                    {item.name}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {item.isNotFound && (
                                                                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[8px] px-2 py-0.5 font-black">
                                                                            BULUNMADI
                                                                        </Badge>
                                                                    )}
                                                                    {!item.isNotFound && getPriorityLabel(item.courierPriorityLabel) !== "NORMAL" && (
                                                                        <Badge variant="outline" className={cn("text-[8px] px-2 py-0.5 font-black border", getPriorityClassName(item.courierPriorityLabel))}>
                                                                            {getPriorityLabel(item.courierPriorityLabel)}
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-[9px] font-black text-blue-400 uppercase">{item.quantity} adet</span>
                                                                    <span className="text-[9px] font-black opacity-30 uppercase">
                                                                        {mounted ? new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                                    </span>
                                                                    {isAdmin && item.assignedTo && (
                                                                        <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/20 text-[8px] font-black uppercase">
                                                                            {item.assignedTo.name} {item.assignedTo.surname}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isAdmin && (
                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    {cleanCourierNote(item.notes) && (
                                                                        <div className="max-w-[200px] truncate bg-black/10 px-2 py-1 rounded-lg border border-white/5 text-[9px] text-muted-foreground font-bold italic">
                                                                            {cleanCourierNote(item.notes)}
                                                                        </div>
                                                                    )}
                                                                    {item.isTaken && (
                                                                        <Button
                                                                            onClick={() => {
                                                                                if (item.customerId) {
                                                                                    setApprovingItem(item);
                                                                                    setApproveModalOpen(true);
                                                                                } else {
                                                                                    handleApprove(item.id, item.quantity);
                                                                                }
                                                                            }}
                                                                            disabled={loadingId === item.id}
                                                                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] tracking-widest rounded-lg h-8 px-4 shadow-lg shadow-emerald-500/20 gap-2 uppercase group"
                                                                        >
                                                                            {loadingId === item.id ? (
                                                                                <Clock className="w-3 h-3 animate-spin" />
                                                                            ) : (
                                                                                <>
                                                                                    <ArrowUpCircle className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                                                    STOK ONAY
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    )}
                                                                    {!item.isTaken && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDelete(item.id)}
                                                                            disabled={loadingId === item.id}
                                                                            className="h-8 w-8 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                                                        >
                                                                            <Trash className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!isAdmin && (
                                                    <div className="mt-3 flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleToggleNotFound(item.id, item.isNotFound)}
                                                            disabled={loadingId === item.id || item.isTaken}
                                                            className={cn(
                                                                "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest flex-1",
                                                                item.isNotFound
                                                                    ? "bg-red-500 text-white border-red-500"
                                                                    : "border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                                                            )}
                                                        >
                                                            <X className="w-3 h-3 mr-1" />
                                                            {item.isNotFound ? "İşareti Kaldır" : "Bulunmadı"}
                                                        </Button>
                                                    </div>
                                                )}
                                                {!isAdmin && cleanCourierNote(item.notes) && (
                                                    <div className="mt-3 bg-zinc-100 dark:bg-black/10 p-2 rounded-lg border border-zinc-200 dark:border-white/5 text-[10px] text-muted-foreground font-bold italic flex items-start gap-1.5 line-clamp-2">
                                                        <AlertCircle className="w-3 h-3 mt-0.5 text-orange-500 shrink-0" />
                                                        {cleanCourierNote(item.notes)}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                {/* Atanmamış Eksikler - Collapsible at Bottom */}
                <Card className="rounded-3xl border-none bg-card/80 dark:bg-card/40 backdrop-blur-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-white/5">
                    <button
                        onClick={() => setIsUnassignedOpen(!isUnassignedOpen)}
                        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <Package className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                    Atanmamış Eksikler
                                    {pendingShortages.length > 0 && (
                                        <Badge className="bg-orange-500 text-black text-[10px] h-5 px-1.5 font-black">{pendingShortages.length}</Badge>
                                    )}
                                </h3>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">HEMEN ALABİLECEĞİNİZ ÜRÜNLER</p>
                            </div>
                        </div>
                        <div className={cn(
                            "h-10 w-10 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300",
                            isUnassignedOpen && "rotate-180"
                        )}>
                            <ChevronDown className="h-5 w-5" />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: isUnassignedOpen ? "auto" : 0, opacity: isUnassignedOpen ? 1 : 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar border-t border-white/5 pt-4">
                            {pendingShortages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 opacity-20 space-y-2">
                                    <Package className="w-12 h-12" />
                                    <span className="font-black uppercase tracking-widest text-[10px]">HİÇ EKSİK YOK</span>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {pendingShortages.map((s) => (
                                        <motion.div
                                            key={s.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className={cn(
                                                "flex items-center justify-between p-4 border transition-all rounded-2xl group/item",
                                                s.isAlert
                                                    ? "bg-red-500/5 dark:bg-red-500/5 border-red-500/10 hover:bg-red-500/10"
                                                    : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:bg-orange-500/10 hover:border-orange-500/30"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={cn(
                                                        "text-sm font-black uppercase truncate",
                                                        s.isAlert ? "text-red-500" : "text-foreground group-hover/item:text-orange-600"
                                                    )}>
                                                        {s.name}
                                                    </h4>
                                                    {s.isAlert && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={cn(
                                                        "px-2 py-0.5 text-[8px] font-black",
                                                        s.isAlert ? "bg-red-500" : "bg-orange-500 text-black"
                                                    )}>
                                                        {s.isAlert ? "KRİTİK" : "EKSİK"}
                                                    </Badge>
                                                    <Badge variant="outline" className={cn("text-[8px] px-2 py-0.5 font-black border", getPriorityClassName(s.courierPriorityLabel))}>
                                                        {getPriorityLabel(s.courierPriorityLabel)}
                                                    </Badge>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase truncate">
                                                        {s.requesterName || (s.isAlert ? (s.shopName || "SİSTEM") : (s.shopName || "Dükkan"))}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-zinc-100 dark:bg-card/60 p-1 rounded-lg border border-zinc-200 dark:border-white/5 h-10">
                                                    <button
                                                        onClick={() => {
                                                            const current = itemQuantities[s.id] || s.quantity || 1;
                                                            setItemQuantities(prev => ({ ...prev, [s.id]: Math.max(1, current - 1) }));
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all"
                                                    >
                                                        <Minus className="h-3 w-3 text-muted-foreground" />
                                                    </button>
                                                    <span className="w-10 text-center text-xs font-black">{itemQuantities[s.id] || s.quantity || 1}</span>
                                                    <button
                                                        onClick={() => {
                                                            const current = itemQuantities[s.id] || s.quantity || 1;
                                                            setItemQuantities(prev => ({ ...prev, [s.id]: current + 1 }));
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all"
                                                    >
                                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(s.id)}
                                                            className="h-10 w-10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleAssignShortcut(s.id)}
                                                        disabled={assigningId === s.id || (isAdmin && !shortcutCourierId)}
                                                        size="sm"
                                                        className={cn(
                                                            "h-10 px-4 rounded-xl font-black text-[10px] tracking-widest",
                                                            s.isAlert
                                                                ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                                                : "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white"
                                                        )}
                                                    >
                                                        {assigningId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "KURYEYE ATA"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                </Card>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] w-full max-w-sm px-4"
                    >
                        <div className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-3xl p-4 shadow-2xl flex items-center justify-between border border-white/10 dark:border-black/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">SEÇİLİ</span>
                                <span className="text-xl font-black tabular-nums tracking-tighter">{selectedIds.length} SİPARİŞ</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSelectedIds([]);
                                        setIsSelectionMode(false);
                                    }}
                                    className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 dark:hover:bg-black/5"
                                >
                                    İPTAL
                                </Button>
                                <Button
                                    onClick={() => handleBulkDelete(selectedIds)}
                                    className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                                >
                                    HEPSİNİ SİL
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ApproveShortageModal
                open={approveModalOpen}
                onOpenChange={setApproveModalOpen}
                itemName={approvingItem?.name || ""}
                quantity={approvingItem?.quantity || 1}
                requesterName={approvingItem?.customer?.name || approvingItem?.requesterName || ""}
                isCustomer={!!approvingItem?.customerId}
                productId={approvingItem?.productId}
                onApprove={(mode, paymentMethod, customPrice, currency) => {
                    if (approvingItem) {
                        handleApprove(approvingItem.id, approvingItem.quantity, mode, paymentMethod, customPrice, currency);
                    }
                }}
            />

            {/* Transfer Unfinished Tasks Modal */}
            <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6 border-zinc-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Siparişi Bitir</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium">
                            {finishingCourier?.name} {finishingCourier?.surname} kuryesinin gününü bitirmek istiyorsunuz.
                            Alınmayan ürünleri ne yapmak istersiniz?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">İşlem Yapılacak Yer</Label>
                            <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                                <SelectTrigger className="h-12 rounded-2xl border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 shadow-sm font-black text-xs uppercase">
                                    <SelectValue placeholder="Seçiniz..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-white/10">
                                    <SelectItem value="pool" className="rounded-xl font-black text-xs uppercase cursor-pointer">Yarına Aktar (Boş Havuz)</SelectItem>
                                    {couriers
                                        .filter(c => c.id !== finishingCourier?.id)
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-xl font-black text-xs uppercase cursor-pointer">
                                                {c.name} {c.surname} (Hemen Aktar)
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 leading-relaxed">
                                {items.filter((st: any) => st.assignedToId === finishingCourier?.id && !st.isResolved).length} adet
                                ürün seçilen kuryeye veya boş havuza aktarılacaktır.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsTransferModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleConfirmFinishDay}
                            className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20"
                        >
                            İşlemi Bitir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
