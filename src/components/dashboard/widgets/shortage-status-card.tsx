"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getShortageItems } from "@/lib/actions/shortage-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    RefreshCcw,
    Truck,
    CheckCircle2,
    ChevronRight,
    Store,
    User,
    Package,
    Clock,
    ArrowRightCircle,
    CircleDashed,
    Phone,
    MessageSquare,
    ExternalLink,
    Loader2
} from "lucide-react";
import { cn, getInitials, getDeterministicColor } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface GroupedShortage {
    label: string;
    id: string;
    type: "SHOP" | "CUSTOMER" | "NEW";
    items: any[];
    totalCount: number;
    takenCount: number;
    phone?: string;
    description?: string;
    courierData?: { name?: string, phone?: string };
}

export function ShortageStatusCard() {
    const [selectedGroup, setSelectedGroup] = useState<GroupedShortage | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const VISIBLE_LIMIT = 4;
    const { data: items = [], isPending: isInitialLoading, isFetching: isBackgroundFetching, refetch } = useQuery<any[]>({
        queryKey: ["shortages"],
        queryFn: getShortageItems,
        placeholderData: keepPreviousData,
        refetchInterval: 30000,
        staleTime: 1000 * 60, // 1 minute
    });

    const isLoading = isInitialLoading && items.length === 0;
    const isUpdating = isBackgroundFetching && items.length > 0;
    const refreshData = async (isManual = false) => {
        try {
            await refetch();
            if (isManual) toast.success("Veriler guncellendi.");
        } catch (error) {
            console.error("Error fetching shortage status:", error);
            toast.error("Baglanti hatasi.");
        }
    };
    // Grouping logic
    const grouped = useMemo(() => items.reduce((acc: Record<string, GroupedShortage>, item) => {
        const key = item.customerId || item.requesterName || "DÜKKAN";
        if (!acc[key]) {
            acc[key] = {
                id: key,
                label: item.customer?.name || item.requesterName || "DÜKKAN",
                type: item.customerId ? "CUSTOMER" : (item.requesterName ? "NEW" : "SHOP"),
                items: [],
                totalCount: 0,
                takenCount: 0
            };
        }
        acc[key].items.push(item);
        acc[key].totalCount++;
        if (item.isTaken) acc[key].takenCount++;

        if (!acc[key].phone) {
            acc[key].phone = item.customer?.phone || item.requesterPhone || item.shop?.phone;
        }

        // Cache courier data
        if (!acc[key].courierData && item.assignedTo) {
            acc[key].courierData = item.assignedTo;
        }
        return acc;
    }, {}), [items]);

    const groupList = Object.values(grouped);

    return (
        <>
            <Card className="h-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-30" />

                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Truck className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                Kurye Sipariş Durumu
                                {items.length > 0 && (
                                    <Badge className="bg-blue-500 text-black text-[10px] font-black h-5 px-1.5 animate-pulse">
                                        {items.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-tight mt-0.5">Siparişlerin kurye sürecini anlık takip edin</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refreshData(true)}
                        disabled={isBackgroundFetching}
                        className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95"
                    >
                        <RefreshCcw className={cn("w-4 h-4", isBackgroundFetching && "animate-spin")} />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-3 relative">
                    {isUpdating && (
                        <div className="absolute top-0 right-8 z-50">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500 opacity-50" />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3">
                            <RefreshCcw className="w-8 h-8 text-blue-500/20 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Siparişler Getiriliyor...</p>
                        </div>
                    ) : groupList.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-30 grayscale">
                            <div className="h-16 w-16 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center animate-spin-slow">
                                <CircleDashed className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Aktif kurye siparişi bulunamadı</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 relative">
                            {groupList.slice(0, VISIBLE_LIMIT).map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        setModalOpen(true);
                                    }}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-500/5 dark:bg-white/[0.02] border border-zinc-500/10 dark:border-white/[0.03] hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group/item overflow-hidden relative"
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center border text-white font-black text-xs shadow-lg uppercase",
                                            getDeterministicColor(group.label)
                                        )}>
                                            {getInitials(group.label)}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase tracking-tight truncate max-w-[200px]">{group.label}</p>

                                            {/* Phone & Courier Grid */}
                                            {(group.phone || group.courierData) && (
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 mb-1.5">
                                                    {group.phone && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <Phone className="w-3 h-3 text-amber-500" />
                                                            <span className="truncate max-w-[80px]">{group.phone}</span>
                                                        </div>
                                                    )}
                                                    {group.courierData && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                                            <Truck className="w-3 h-3 text-blue-500" />
                                                            <span className="truncate max-w-[80px]">{group.courierData.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 text-muted-foreground border-zinc-200 dark:border-white/5 text-[9px] px-1.5 py-0 font-bold h-4">
                                                    {group.totalCount} KALEM
                                                </Badge>
                                                {group.takenCount === group.totalCount ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black h-4 px-1.5 border-none">TAMAMI ALINDI</Badge>
                                                ) : group.takenCount > 0 ? (
                                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-black h-4 px-1.5 border-none">{group.takenCount} ALINMIŞ</Badge>
                                                ) : (
                                                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-500 text-[8px] font-black h-4 px-1.5 border-none">BEKLİYOR</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="h-8 w-8 rounded-lg bg-card/40 border border-border/50 flex items-center justify-center group-hover/item:bg-blue-500 group-hover/item:text-black group-hover/item:border-blue-500 transition-all translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Progress background bar */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500/10 w-full">
                                        <div
                                            className="h-full bg-blue-500/40 transition-all duration-1000"
                                            style={{ width: `${(group.takenCount / group.totalCount) * 100}%` }}
                                        />
                                    </div>
                                </button>
                            ))}

                            {groupList.length > VISIBLE_LIMIT && (
                                <div className="flex flex-col items-center justify-center pt-2 pb-1 relative group/more cursor-pointer" onClick={() => refreshData(true)}>
                                    <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] group-hover/more:text-blue-500 transition-colors">
                                        +{groupList.length - VISIBLE_LIMIT} KAYIT DAHA VAR
                                    </span>
                                    <motion.div
                                        animate={{ y: [0, 4, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                        <ChevronRight className="w-3 h-3 text-muted-foreground/40 rotate-90" />
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                {groupList.length > 0 && (
                    <div className="p-4 pt-0">
                        <Link href="/kurye">
                            <Button className="w-full h-11 bg-zinc-900 dark:bg-white/5 hover:bg-blue-600 hover:text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl group/btn transition-all gap-2">
                                <ArrowRightCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                TÜM DETAYLAR VE YÖNETİM
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl bg-background border-none rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                    {selectedGroup && (
                        <>
                            <DialogHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-14 w-14 rounded-2xl flex items-center justify-center border-4 border-white dark:border-zinc-900 text-white font-black text-xl shadow-2xl uppercase",
                                        getDeterministicColor(selectedGroup.label)
                                    )}>
                                        {getInitials(selectedGroup.label)}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{selectedGroup.label}</DialogTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black uppercase">
                                                {selectedGroup.type === 'SHOP' ? 'BAYİ SİPARİŞİ' : 'MÜŞTERİ SİPARİŞİ'}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-bold">•</span>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase">{selectedGroup.totalCount} KALEM ÜRÜN</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => refreshData(true)}
                                    disabled={isBackgroundFetching}
                                    className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 transition-all border border-transparent hover:border-blue-500/20"
                                >
                                    <RefreshCcw className={cn("w-5 h-5", isBackgroundFetching && "animate-spin")} />
                                </Button>
                            </DialogHeader>

                            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {selectedGroup.items.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={cn(
                                                "p-4 rounded-3xl border transition-all flex items-center justify-between gap-4",
                                                item.isTaken
                                                    ? "bg-emerald-500/5 border-emerald-500/20 shadow-inner"
                                                    : "bg-white dark:bg-zinc-900 border-border/50 shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                                                    item.isTaken ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-white/5 text-muted-foreground"
                                                )}>
                                                    {item.isTaken ? <CheckCircle2 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-sm font-black uppercase tracking-tight truncate",
                                                        item.isTaken && "text-muted-foreground line-through opacity-60"
                                                    )}>
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge className="bg-blue-500/10 text-blue-500 border-none text-[9px] font-black h-4 px-1.5">
                                                            {item.quantity} ADET
                                                        </Badge>
                                                        {item.assignedTo && (
                                                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-black uppercase">
                                                                <Truck className="w-3 h-3" />
                                                                {item.assignedTo.name}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-black uppercase">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex flex-col items-end gap-1">
                                                {item.isTaken ? (
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                        ALINDI
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded-lg">
                                                        BEKLİYOR
                                                    </span>
                                                )}
                                                {item.isTaken && item.product?.stock !== undefined && (
                                                    <span className="text-[8px] text-muted-foreground font-bold uppercase">Stok: {item.product.stock}</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border-t border-border/40 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Courier Contact */}
                                    <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/50 shadow-sm flex items-center justify-between group/card hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Kuryeye Sor</span>
                                                <p className="text-xs font-black tracking-tight text-foreground">
                                                    {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.name || "ATANMADI"}
                                                </p>
                                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500 mt-0.5">
                                                    {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone || "+90 (---) --- -- --"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone && (
                                            <div className="flex gap-2">
                                                <a href={`tel:${selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone}`} className="h-9 w-9 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Requester/Shop Contact */}
                                    <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/50 shadow-sm flex items-center justify-between group/card hover:border-amber-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                <Store className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">İrtibat No</span>
                                                <p className="text-xs font-black tracking-tight truncate max-w-[120px] text-foreground">{selectedGroup.label}</p>
                                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-0.5">
                                                    {selectedGroup.phone || "+90 (---) --- -- --"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedGroup.phone && (
                                            <div className="flex gap-2">
                                                <a href={`tel:${selectedGroup.phone}`} className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 h-px bg-border/50" />
                                    <span className="shrink-0 text-[10px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-1.5"><Truck className="w-3 h-3" /> Bilgi</span>
                                    <div className="flex-1 h-px bg-border/50" />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-[10px] text-muted-foreground font-medium max-w-[300px]">
                                        * Kurye siparişi aldığında buradan anlık olarak görebilirsiniz. Diğer tüm işlemler için kurye sayfasına gidin.
                                    </p>
                                    <Button
                                        onClick={() => setModalOpen(false)}
                                        className="bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest rounded-2xl h-12 px-10 hover:opacity-90 transition-all shadow-xl shadow-zinc-900/10"
                                    >
                                        Kapat
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog >
        </>
    );
}
