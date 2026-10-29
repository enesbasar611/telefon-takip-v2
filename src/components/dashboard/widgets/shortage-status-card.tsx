"use client";

import { useMemo, useState, useEffect } from "react";
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

export function ShortageStatusCard({ onDataStatus }: { onDataStatus?: (isEmpty: boolean) => void }) {
    const [selectedGroup, setSelectedGroup] = useState<GroupedShortage | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const VISIBLE_LIMIT = 4;
    const { data: items = [], isPending: isInitialLoading, isFetching: isBackgroundFetching, isLoading: queryLoading, refetch } = useQuery<any[]>({
        queryKey: ["shortages"],
        queryFn: async () => {
            return await getShortageItems();
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    useEffect(() => {
        if (!queryLoading && onDataStatus) {
            onDataStatus(!items || items.length === 0);
        }
    }, [items, queryLoading, onDataStatus]);

    const isLoading = isInitialLoading && items.length === 0;
    const isUpdating = isBackgroundFetching && items.length > 0;
    const refreshData = async (isManual = false) => {
        try {
            await refetch();
            if (isManual) toast.success("Veriler güncellendi.");
        } catch (error) {
            console.error("Error fetching shortage status:", error);
            toast.error("Bağlantı hatası.");
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
            <Card className="h-full flex flex-col border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl dark:border-white/[0.08] transition-all duration-300 hover:shadow-md animate-in fade-in">
                <CardHeader className={cn(
                    "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 px-5 py-3.5 bg-muted/10"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                            <Truck className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="font-semibold text-sm tracking-tight uppercase text-foreground flex items-center gap-2">
                                <span>Kurye Sipariş Durumu</span>
                                {items.length > 0 && (
                                    <Badge className="bg-blue-500 text-white text-[9px] font-bold h-4 px-1.5 rounded-full border-none">
                                        {items.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Siparişlerin kurye sürecini anlık takip edin</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refreshData(true)}
                        disabled={isBackgroundFetching}
                        className="h-7 w-7 rounded-lg border-border/60 hover:bg-muted transition-all active:scale-95"
                    >
                        <RefreshCcw className={cn("w-3.5 h-3.5", isBackgroundFetching && "animate-spin")} />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-3 relative p-0">
                    {isUpdating && (
                        <div className="absolute top-2 right-4 z-50">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500 opacity-50" />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                            <RefreshCcw className="w-7 h-7 text-blue-500/30 animate-spin" />
                            <p className="text-[10px] font-semibold uppercase tracking-wider animate-pulse">Sipariş verileri yükleniyor...</p>
                        </div>
                    ) : groupList.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center space-y-2 text-muted-foreground opacity-50">
                            <div className="h-10 w-10 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-center px-4">Aktif kurye siparişi bulunamadı</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 sm:p-5 pb-3">
                            {groupList.slice(0, VISIBLE_LIMIT).map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        setModalOpen(true);
                                    }}
                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-border/40 hover:border-border transition-all duration-200 group/item overflow-hidden relative"
                                >
                                    <div className="flex items-center gap-3 relative z-10 min-w-0">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center border text-white font-bold text-xs uppercase transition-transform group-hover/item:scale-105 shrink-0",
                                            getDeterministicColor(group.label)
                                        )}>
                                            {getInitials(group.label)}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-xs font-semibold tracking-tight truncate max-w-[200px] uppercase text-foreground">{group.label}</p>

                                            {/* Phone & Courier Grid */}
                                            {(group.phone || group.courierData) && (
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                                    {group.phone && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <Phone className="w-3 h-3 text-amber-500/70" />
                                                            <span className="truncate">{group.phone}</span>
                                                        </div>
                                                    )}
                                                    {group.courierData && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                                            <Truck className="w-3 h-3 text-blue-500/70" />
                                                            <span className="truncate">{group.courierData.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge variant="outline" className="bg-muted text-muted-foreground border-border/40 text-[9px] px-2 py-0.5 font-semibold rounded-md border-none">
                                                    {group.totalCount} KALEM
                                                </Badge>
                                                {group.takenCount === group.totalCount ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md border-none">TAMAMI ALINDI</Badge>
                                                ) : group.takenCount > 0 ? (
                                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md border-none">KISMİ ALINDI</Badge>
                                                ) : (
                                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md border-none">BEKLİYOR</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10 shrink-0 ml-2">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover/item:text-foreground group-hover/item:translate-x-0.5 transition-all" />
                                    </div>

                                    {/* Progress background bar */}
                                    <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/10 w-full">
                                        <div
                                            className="h-full bg-blue-500/40 transition-all duration-700"
                                            style={{ width: `${(group.takenCount / group.totalCount) * 100}%` }}
                                        />
                                    </div>
                                </button>
                            ))}

                            {groupList.length > VISIBLE_LIMIT && (
                                <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider hover:text-blue-500 cursor-pointer transition-colors" onClick={() => refreshData(true)}>
                                    <span>+{groupList.length - VISIBLE_LIMIT} KAYIT DAHA VAR</span>
                                    <ChevronRight className="w-3 h-3 rotate-90" />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                {groupList.length > 0 && (
                    <div className="p-4 sm:p-5 pt-0">
                        <Link href="/kurye">
                            <Button size="sm" className="w-full h-8 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl group/btn transition-all gap-2 shadow-xs">
                                <span>Kurye Yönetim Paneli</span>
                                <ArrowRightCircle className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl p-0 overflow-hidden">
                    {selectedGroup && (
                        <>
                            <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center border text-white font-bold text-lg uppercase shadow-sm",
                                        getDeterministicColor(selectedGroup.label)
                                    )}>
                                        {getInitials(selectedGroup.label)}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold uppercase tracking-tight text-foreground font-sans">{selectedGroup.label}</DialogTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-bold uppercase rounded-md border-none">
                                                {selectedGroup.type === 'SHOP' ? 'BAYİ SİPARİŞİ' : 'MÜŞTERİ SİPARİŞİ'}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">• {selectedGroup.totalCount} Kalem</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refreshData(true)}
                                    disabled={isBackgroundFetching}
                                    className="h-8 w-8 rounded-lg border-border/60 hover:bg-muted transition-all active:scale-95"
                                >
                                    <RefreshCcw className={cn("w-4 h-4", isBackgroundFetching && "animate-spin")} />
                                </Button>
                            </DialogHeader>

                            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-2.5 custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {selectedGroup.items.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all flex items-center justify-between gap-4",
                                                item.isTaken
                                                    ? "bg-emerald-500/5 border-emerald-500/10"
                                                    : "bg-muted/20 border-border/40 hover:bg-muted/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                <div className={cn(
                                                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs",
                                                    item.isTaken ? "bg-emerald-500 text-white" : "bg-card border border-border/40 text-muted-foreground"
                                                )}>
                                                    {item.isTaken ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-xs font-semibold uppercase tracking-tight truncate",
                                                        item.isTaken ? "text-muted-foreground/50 line-through" : "text-foreground"
                                                    )}>
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[9px] font-bold h-4 px-1.5 rounded-md">
                                                            {item.quantity} Adet
                                                        </Badge>
                                                        {item.assignedTo && (
                                                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium uppercase">
                                                                <Truck className="w-3 h-3 text-blue-500/60" />
                                                                {item.assignedTo.name}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium uppercase">
                                                            <Clock className="w-3 h-3 text-orange-500/60" />
                                                            {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex flex-col items-end gap-1">
                                                {item.isTaken ? (
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                        ALINDI
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-md">
                                                        BEKLİYOR
                                                    </span>
                                                )}
                                                {item.isTaken && item.product?.stock !== undefined && (
                                                    <span className="text-[8px] text-muted-foreground font-medium uppercase">Stok: {item.product.stock}</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="p-6 bg-muted/20 border-t border-border/40 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Courier Contact */}
                                    <div className="p-3.5 rounded-xl bg-card border border-border/40 shadow-xs flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Kurye Rehberi</span>
                                                <p className="text-xs font-semibold tracking-tight text-foreground uppercase truncate max-w-[130px]">
                                                    {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.name || "ATANMADI"}
                                                </p>
                                                <p className="text-[10px] text-blue-500 font-medium">
                                                    {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone || "+90 (---) --- -- --"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone && (
                                            <a href={`tel:${selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone}`} className="h-8 w-8 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-xs">
                                                <Phone className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>

                                    {/* Requester/Shop Contact */}
                                    <div className="p-3.5 rounded-xl bg-card border border-border/40 shadow-xs flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Store className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">İrtibat Bilgisi</span>
                                                <p className="text-xs font-semibold tracking-tight truncate max-w-[130px] text-foreground uppercase">{selectedGroup.label}</p>
                                                <p className="text-[10px] text-amber-500 font-medium">
                                                    {selectedGroup.phone || "+90 (---) --- -- --"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedGroup.phone && (
                                            <a href={`tel:${selectedGroup.phone}`} className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shadow-xs">
                                                <Phone className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <p className="text-[10px] text-muted-foreground font-normal max-w-[340px] leading-snug">
                                        * Kurye siparişi aldığında buradan anlık olarak görebilirsiniz.
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setModalOpen(false)}
                                        className="h-8 px-4 text-xs font-semibold rounded-lg"
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
