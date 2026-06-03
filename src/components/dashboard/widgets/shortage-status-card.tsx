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
            <Card className="h-full flex flex-col border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500 animate-in fade-in">
                <CardHeader className={cn(
                    "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6"
                )}>
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                            <Truck className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="font-medium text-lg tracking-tight font-sans uppercase flex items-center gap-3">
                                <span>Kurye Sipariş Durumu</span>
                                {items.length > 0 && (
                                    <Badge className="bg-blue-500 text-black text-[10px] font-black h-5 px-2 rounded-full animate-pulse border-none">
                                        {items.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Siparişlerin kurye sürecini anlık takip edin</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refreshData(true)}
                        disabled={isBackgroundFetching}
                        className="h-9 w-9 rounded-xl border-border/40 hover:bg-blue-500/5 hover:text-blue-500 transition-all active:scale-95"
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
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <RefreshCcw className="w-10 h-10 text-blue-500/20 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sipariş verileri yükleniyor...</p>
                        </div>
                    ) : groupList.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 opacity-30">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-center px-4">Aktif kurye siparişi bulunamadı</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 p-6 pb-2">
                            {groupList.slice(0, VISIBLE_LIMIT).map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        setModalOpen(true);
                                    }}
                                    className="flex items-center justify-between p-4 rounded-[1.5rem] bg-muted/10 border border-border/20 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group/item overflow-hidden relative shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center border text-white font-black text-xs shadow-lg uppercase transition-transform group-hover/item:scale-110",
                                            getDeterministicColor(group.label)
                                        )}>
                                            {getInitials(group.label)}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-medium tracking-tight truncate max-w-[200px] uppercase font-sans">{group.label}</p>

                                            {/* Phone & Courier Grid */}
                                            {(group.phone || group.courierData) && (
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 mb-2">
                                                    {group.phone && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                            <Phone className="w-3 h-3 text-amber-500/60" />
                                                            <span className="truncate">{group.phone}</span>
                                                        </div>
                                                    )}
                                                    {group.courierData && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium truncate">
                                                            <div className="h-1 w-1 rounded-full bg-border" />
                                                            <Truck className="w-3 h-3 text-blue-500/60" />
                                                            <span className="truncate">{group.courierData.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="bg-background/50 text-muted-foreground border-border/40 text-[9px] px-2 py-0.5 font-bold rounded-lg border-none">
                                                    {group.totalCount} KALEM
                                                </Badge>
                                                {group.takenCount === group.totalCount ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-lg border-none underline-none">TAMAMI ALINDI</Badge>
                                                ) : group.takenCount > 0 ? (
                                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black px-2 py-0.5 rounded-lg border-none">KISMİ ALINDI</Badge>
                                                ) : (
                                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-lg border-none">BEKLİYOR</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="h-10 w-10 rounded-2xl bg-background border border-border/50 flex items-center justify-center group-hover/item:bg-blue-500 group-hover/item:text-black group-hover/item:border-blue-500 transition-all translate-x-4 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 shadow-sm">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Progress background bar */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500/5 w-full">
                                        <div
                                            className="h-full bg-blue-500/30 transition-all duration-1000"
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
                    <div className="p-6 pt-0">
                        <Link href="/kurye">
                            <Button className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-black font-extrabold text-[10px] uppercase tracking-[0.2em] rounded-2xl group/btn transition-all gap-4 shadow-lg shadow-blue-500/10">
                                <span>Kurye Yönetim Paneli</span>
                                <ArrowRightCircle className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl bg-card border border-border/40 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden backdrop-blur-xl">
                    {selectedGroup && (
                        <>
                            <DialogHeader className="p-10 pb-6 flex flex-row items-center justify-between border-b border-border/40">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "h-16 w-16 rounded-[1.5rem] flex items-center justify-center border-4 border-background text-white font-black text-2xl shadow-xl uppercase",
                                        getDeterministicColor(selectedGroup.label)
                                    )}>
                                        {getInitials(selectedGroup.label)}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground font-sans">{selectedGroup.label}</DialogTitle>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black uppercase rounded-lg border-none">
                                                {selectedGroup.type === 'SHOP' ? 'BAYİ SİPARİŞİ' : 'MÜŞTERİ SİPARİŞİ'}
                                            </Badge>
                                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{selectedGroup.totalCount} KALEM ÜRÜN</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refreshData(true)}
                                    disabled={isBackgroundFetching}
                                    className="h-12 w-12 rounded-2xl border-border/40 hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95 shadow-sm"
                                >
                                    <RefreshCcw className={cn("w-5 h-5", isBackgroundFetching && "animate-spin")} />
                                </Button>
                            </DialogHeader>

                            <div className="p-10 max-h-[55vh] overflow-y-auto space-y-4 custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {selectedGroup.items.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={cn(
                                                "p-5 rounded-[1.5rem] border transition-all flex items-center justify-between gap-6",
                                                item.isTaken
                                                    ? "bg-emerald-500/5 border-emerald-500/10"
                                                    : "bg-muted/10 border-border/40 hover:bg-muted/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                                                    item.isTaken ? "bg-emerald-500 text-white" : "bg-card border border-border/40 text-muted-foreground"
                                                )}>
                                                    {item.isTaken ? <CheckCircle2 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-sm font-bold uppercase tracking-tight truncate font-sans",
                                                        item.isTaken ? "text-muted-foreground/50 line-through" : "text-foreground"
                                                    )}>
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-1.5">
                                                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[9px] font-black h-4 px-2 rounded-lg">
                                                            {item.quantity} ADET
                                                        </Badge>
                                                        {item.assignedTo && (
                                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tight">
                                                                <Truck className="w-3.5 h-3.5 text-blue-500/60" />
                                                                {item.assignedTo.name}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tight">
                                                            <Clock className="w-3.5 h-3.5 text-orange-500/60" />
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

                            <div className="p-10 bg-muted/20 border-t border-border/40 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Courier Contact */}
                                    <div className="p-5 rounded-[1.5rem] bg-card border border-border/40 shadow-sm flex items-center justify-between group/card hover:border-blue-500/30 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                                                <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Kurye Rehbari</span>
                                                <p className="text-sm font-bold tracking-tight text-foreground uppercase truncate max-w-[120px]">
                                                    {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.name || "ATANMADI"}
                                                </p>
                                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 tracking-tighter">
                                                    {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone || "+90 (---) --- -- --"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone && (
                                            <div className="flex gap-2">
                                                <a href={`tel:${selectedGroup.items.find(i => i.assignedTo)?.assignedTo?.phone}`} className="h-10 w-10 rounded-xl bg-blue-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Requester/Shop Contact */}
                                    <div className="p-5 rounded-[1.5rem] bg-card border border-border/40 shadow-sm flex items-center justify-between group/card hover:border-amber-500/30 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-inner">
                                                <Store className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">İrtibat Bilgisi</span>
                                                <p className="text-sm font-bold tracking-tight truncate max-w-[120px] text-foreground uppercase">{selectedGroup.label}</p>
                                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 tracking-tighter">
                                                    {selectedGroup.phone || "+90 (---) --- -- --"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedGroup.phone && (
                                            <div className="flex gap-2">
                                                <a href={`tel:${selectedGroup.phone}`} className="h-10 w-10 rounded-xl bg-amber-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
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
                                <div className="flex items-center justify-between gap-6">
                                    <p className="text-[11px] text-muted-foreground font-medium max-w-[340px] leading-relaxed">
                                        * Kurye siparişi aldığında buradan anlık olarak görebilirsiniz. Detaylı kurye yönetimi için lütfen ilgili sayfayı ziyaret edin.
                                    </p>
                                    <Button
                                        onClick={() => setModalOpen(false)}
                                        className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-[0.2em] rounded-2xl h-12 px-10 transition-all shadow-lg shadow-rose-500/10 active:scale-95"
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
