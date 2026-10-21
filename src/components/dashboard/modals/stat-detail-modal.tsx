"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    getDebtDetails,
    getCollectionDetails,
    getDailySalesDetails,
    getRepairIncomeDetails,
    getPendingServicesDetails,
    getReadyDevicesDetails,
    getCriticalStockDetails,
    getAccountBalanceDetails
} from "@/lib/actions/dashboard-detail-actions";
import { Loader2, Plus, ChevronRight, ArrowRight, Wallet, Landmark, CreditCard, User, Package, Wrench, ShoppingCart, Banknote, Clock, CheckCircle2, AlertTriangle, ArrowDownCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useShortage } from "@/lib/context/shortage-context";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { getCouriers, bulkAssignProductsToCourier } from "@/lib/actions/shortage-actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CashBalanceDetailModal } from "./cash-balance-detail-modal";
import { VeresiyeDetailModal } from "./veresiye-detail-modal";

export type StatType =
    | "DAILY_SALES"
    | "REPAIR_INCOME"
    | "COLLECTIONS"
    | "PENDING_SERVICES"
    | "READY_DEVICES"
    | "CRITICAL_STOCK"
    | "TOTAL_DEBTS"
    | "CASH_BALANCE";

interface StatDetailModalProps {
    type: StatType | null;
    isOpen: boolean;
    onClose: () => void;
    statsData?: any;
}

export function StatDetailModal({ type, isOpen, onClose, statsData }: StatDetailModalProps) {
    if (type === "DAILY_SALES") {
        return <CashBalanceDetailModal isOpen={isOpen} onClose={onClose} />;
    }

    if (type === "TOTAL_DEBTS") {
        return <VeresiyeDetailModal isOpen={isOpen} onClose={onClose} />;
    }

    const { addShortage, refresh } = useShortage();
    const [addingToShortage, setAddingToShortage] = useState<string | null>(null);
    const [showZeroOnly, setShowZeroOnly] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedCourierId, setSelectedCourierId] = useState<string>("");
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const queryClient = useQueryClient();

    const detailQuery = useQuery<any[]>({
        queryKey: ["dashboard-stat-detail", type],
        queryFn: async () => {
            switch (type) {
                case "COLLECTIONS": return getCollectionDetails();
                case "REPAIR_INCOME": return getRepairIncomeDetails();
                case "PENDING_SERVICES": return getPendingServicesDetails();
                case "READY_DEVICES": return getReadyDevicesDetails();
                case "CRITICAL_STOCK": return getCriticalStockDetails();
                case "CASH_BALANCE": return getAccountBalanceDetails();
                default: return [];
            }
        },
        enabled: !!type && isOpen,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData
    });

    const couriersQuery = useQuery<any[]>({
        queryKey: ["couriers-list"],
        queryFn: getCouriers,
        enabled: type === "CRITICAL_STOCK" && isOpen,
        refetchOnMount: true,
        staleTime: 0,
    });

    const data = detailQuery.data || [];
    const isInitialLoading = detailQuery.isPending && !detailQuery.data;
    const isBackgroundFetching = detailQuery.isFetching && !!detailQuery.data;

    const handleAddShortage = async (product: any) => {
        setAddingToShortage(product.id);
        try {
            await addShortage({
                productId: product.id,
                name: product.name,
                quantity: product.criticalStock > product.stock ? (product.criticalStock - product.stock) : 5
            });
        } finally {
            setAddingToShortage(null);
        }
    };

    const handleBulkAction = async (courierId: string | null) => {
        if (selectedIds.length === 0) return;
        setIsBulkProcessing(true);
        try {
            const res = await bulkAssignProductsToCourier(selectedIds, courierId);
            if (res.success) {
                toast.success(courierId ? `${res.count} ürün kuryeye atandı.` : `${res.count} ürün eksik listesine eklendi.`);
                setSelectedIds([]);
                refresh();
                queryClient.invalidateQueries({ queryKey: ["dashboard-stat-detail"] });
            } else {
                toast.error(res.error || "İşlem başarısız.");
            }
        } catch (error) {
            toast.error("İşlem sırasında hata oluştu.");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const getModalConfig = () => {
        switch (type) {
            case "REPAIR_INCOME": return { title: "TAMİR GELİRLERİ", icon: Wrench, color: "text-secondary", route: "/servis/liste" };
            case "COLLECTIONS": return { title: "TAHSİLATLAR", icon: Banknote, color: "text-amber-500", route: "/satis/kasa" };
            case "PENDING_SERVICES": return { title: "BEKLEYEN SERVİSLER", icon: Clock, color: "text-blue-500", route: "/servis/liste" };
            case "READY_DEVICES": return { title: "HAZIR CİHAZLAR", icon: CheckCircle2, color: "text-emerald-500", route: "/servis/liste?status=READY" };
            case "CRITICAL_STOCK": return { title: "KRİTİK STOK", icon: AlertTriangle, color: "text-rose-500", route: "/stok" };
            case "CASH_BALANCE": return { title: "KASA & HESAPLAR", icon: Wallet, color: "text-primary", route: "/satis/kasa" };
            default: return { title: "DETAY", icon: LayoutDashboard, color: "text-primary", route: "/" };
        }
    };

    const getItemRoute = (item: any) => {
        const baseRoute = config.route.split('?')[0];
        const highlightParam = `highlight=${item.id}`;
        if (type === "REPAIR_INCOME" || type === "PENDING_SERVICES" || type === "READY_DEVICES") {
            return `${baseRoute}?${highlightParam}&ticket=${item.ticketNumber}`;
        }
        return `${baseRoute}?${highlightParam}`;
    };


    const config = getModalConfig();
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={cn(
                "border-border/40 p-0 overflow-hidden bg-background/95 dark:bg-zinc-900/98 backdrop-blur-3xl rounded-[2rem] shadow-2xl transition-all",
                type === "CRITICAL_STOCK" ? "sm:max-w-4xl" : "sm:max-w-2xl"
            )}>
                <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r",
                    type === "COLLECTIONS" ? "from-amber-500 to-orange-500" :
                        type === "CRITICAL_STOCK" ? "from-rose-500 to-red-600" :
                            "from-emerald-500 to-teal-600"
                )} />

                <div className="p-0">
                    <DialogHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border border-border/40 shadow-inner",
                                    config.color.replace("text-", "bg-").replace("-500", "-500/10").replace("-600", "-600/10")
                                )}>
                                    <Icon className={cn("h-7 w-7", config.color)} />
                                </div>
                                <div className="space-y-1">
                                    <DialogTitle className="font-bold text-2xl tracking-tight uppercase text-foreground">
                                        {config.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-60">
                                        Sistem Analizleri ve Raporlama
                                    </DialogDescription>
                                </div>
                            </div>
                            <Link href={config.route}>
                                <Button variant="outline" className="rounded-2xl h-10 text-[9px] font-black uppercase tracking-widest px-6 border-border/40 hover:bg-muted/50 transition-all shadow-sm">
                                    TÜM KAYITLAR <ChevronRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="h-[500px] relative">
                            {isBackgroundFetching && (
                                <div className="absolute top-0 right-0 z-50 p-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary opacity-50" />
                                </div>
                            )}

                            {isInitialLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-xs  uppercase tracking-[0.2em] animate-pulse">Veriler Getiriliyor...</p>
                                </div>
                            ) : data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/40 text-center uppercase">
                                    <div className="h-16 w-16 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <p className="text-xs  tracking-widest">Henüz bir kayıt bulunamadı</p>
                                </div>
                            ) : (
                                <div className="space-y-4 px-6 pb-6">
                                    {type === "COLLECTIONS" && (
                                        <div className="space-y-3">
                                            {data.map((item: any) => {
                                                const customerName = item.customer?.name || item.sale?.customer?.name;
                                                const supplierName = item.supplier?.name;
                                                const displayName = customerName || supplierName || item.description || "Hızlı Satış";
                                                const searchVal = customerName || supplierName || item.description;

                                                return (
                                                    <Link
                                                        key={item.id}
                                                        href={`/satis/kasa?search=${encodeURIComponent(searchVal || "")}`}
                                                        className="p-4 rounded-2xl bg-muted/20 border border-border/10 flex items-center justify-between group hover:bg-background/50 hover:border-amber-500/30 transition-all cursor-pointer block"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm transition-transform group-hover:scale-105">
                                                                {customerName ? <User className="h-5 w-5 text-amber-500" /> : <Banknote className="h-5 w-5 text-amber-500" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-sm  uppercase tracking-tight">{displayName}</h4>
                                                                <p className="text-[10px]  text-muted-foreground opacity-60 uppercase tracking-tighter">
                                                                    {item.createdAt ? format(new Date(item.createdAt), "HH:mm", { locale: tr }) : "00:00"} • {item.financeAccount?.name || "Kasa"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">TUTAR</p>
                                                            <p className="text-base  text-emerald-500 tracking-tight">₺{Number(item.amount).toLocaleString('tr-TR')}</p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {type === "CRITICAL_STOCK" && (
                                        <div className="space-y-4">
                                            {/* Filters & Bulk Controls */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowZeroOnly(!showZeroOnly)}
                                                        className={cn(
                                                            "h-8 text-[10px] uppercase tracking-widest px-3 rounded-lg",
                                                            showZeroOnly ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20" : "text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        {showZeroOnly ? "TÜMÜNÜ GÖSTER" : `BİTENLER (${data.filter(p => p.stock <= 0).length})`}
                                                    </Button>

                                                    {data.length > 0 && (
                                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                                                            <Checkbox
                                                                checked={selectedIds.length === (showZeroOnly ? data.filter(p => p.stock <= 0).length : data.length)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        const visible = showZeroOnly ? data.filter(p => p.stock <= 0) : data;
                                                                        setSelectedIds(visible.map(p => p.id));
                                                                    } else {
                                                                        setSelectedIds([]);
                                                                    }
                                                                }}
                                                            />
                                                            TÜMÜNÜ SEÇ
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedIds.length > 0 && (
                                                    <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                                        <div className="relative">
                                                            <select
                                                                value={selectedCourierId}
                                                                onChange={(e) => setSelectedCourierId(e.target.value)}
                                                                className="w-[160px] h-8 px-3 pr-8 text-[10px] rounded-lg border border-border/40 bg-background text-foreground uppercase outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50"
                                                                disabled={couriersQuery.isPending}
                                                            >
                                                                <option value="" disabled>
                                                                    {couriersQuery.isPending ? "YÜKLENİYOR..." : "KURYE SEÇ..."}
                                                                </option>
                                                                {(!couriersQuery.isPending && (!couriersQuery.data || couriersQuery.data.length === 0)) ? (
                                                                    <option value="" disabled>PERSONEL BULUNAMADI</option>
                                                                ) : couriersQuery.data?.map(c => (
                                                                    <option key={c.id} value={c.id} className="text-foreground bg-background">
                                                                        {c.name} {c.surname}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            disabled={isBulkProcessing || !selectedCourierId}
                                                            onClick={() => handleBulkAction(selectedCourierId)}
                                                            className="h-8 rounded-lg text-[9px] uppercase tracking-tight bg-primary text-primary-foreground hover:opacity-90"
                                                        >
                                                            {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "ATAMA YAP"}
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={isBulkProcessing}
                                                            onClick={() => handleBulkAction(null)}
                                                            className="h-8 rounded-lg text-[9px] uppercase tracking-tight border-border/40 hover:bg-muted"
                                                        >
                                                            {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "EKSİĞE EKLE"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {data
                                                    .filter(p => !showZeroOnly || p.stock <= 0)
                                                    .map((product: any) => (
                                                        <div key={product.id} className={cn(
                                                            "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                                                            selectedIds.includes(product.id) ? "bg-primary/5 border-primary/30" : "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10"
                                                        )}>
                                                            <div className="flex items-center gap-4">
                                                                <Checkbox
                                                                    checked={selectedIds.includes(product.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSelectedIds([...selectedIds, product.id]);
                                                                        } else {
                                                                            setSelectedIds(selectedIds.filter(id => id !== product.id));
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm relative overflow-hidden shrink-0">
                                                                    <Package className={cn("h-6 w-6", product.stock <= 0 ? "text-rose-500" : "text-amber-500")} />
                                                                    {product.stock <= 0 && <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-medium text-sm  uppercase tracking-tight line-clamp-1">{product.name}</h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        {product.stock <= 0 ? (
                                                                            <Badge variant="destructive" className="text-[8px] px-2 py-0 bg-rose-600">STOK YOK</Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-[8px] border-rose-500/30 text-rose-500 px-2 py-0">KRİTİK</Badge>
                                                                        )}
                                                                        <span className="text-[10px]  text-muted-foreground/60 uppercase truncate">{product.category?.name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 shrink-0 px-2">
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">STOK</p>
                                                                    <p className={cn("text-base tracking-tight font-medium", product.stock <= 0 ? "text-rose-600" : "text-amber-600")}>
                                                                        {product.stock} {product.unit || 'ADET'}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleAddShortage(product)}
                                                                    disabled={addingToShortage === product.id}
                                                                    className="h-9 w-9 p-0 rounded-full hover:bg-rose-500/20 text-rose-600 transition-all shadow-none shrink-0"
                                                                >
                                                                    {addingToShortage === product.id ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Plus className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* General purpose list for other types */}
                                    {["REPAIR_INCOME", "PENDING_SERVICES", "READY_DEVICES", "CASH_BALANCE"].includes(type || "") && (
                                        <div className="space-y-3">
                                            {data.map((item: any, idx: number) => {
                                                let title = item.customer?.name || item.name || (item.deviceBrand ? item.deviceBrand + " " + item.deviceModel : "Kayıt " + (idx + 1));
                                                let subtitle = item.ticketNumber ? "#" + item.ticketNumber : item.description || (item.type ? item.type : "Detaylar");
                                                const value = item.amount || item.finalAmount || item.actualCost || (item.balance !== undefined ? item.balance : null);

                                                return (
                                                    <Link
                                                        key={item.id || idx}
                                                        href={getItemRoute(item)}
                                                        className="p-4 rounded-2xl bg-muted/20 border border-border/10 flex items-center justify-between group hover:bg-background/50 hover:border-primary/30 transition-all cursor-pointer block"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105",
                                                                type === "READY_DEVICES" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-background border-border/40 text-muted-foreground"
                                                            )}>
                                                                {type === "CASH_BALANCE" ? (
                                                                    item.type === 'BANK' ? <Landmark className="h-5 w-5 text-emerald-500" /> :
                                                                        (item.type === 'POS' || item.type === 'CREDIT_CARD') ? <CreditCard className="h-5 w-5 text-purple-500" /> :
                                                                            <Wallet className="h-5 w-5 text-blue-500" />
                                                                ) : (
                                                                    <ChevronRight className="h-5 w-5 opacity-40" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-medium text-[13px]  uppercase tracking-tight line-clamp-1">{String(title || "Bilinmiyor")}</h4>
                                                                <p className="text-[10px]  text-muted-foreground opacity-60 uppercase tracking-tighter truncate mt-0.5">
                                                                    {String(subtitle || "Detay Yok")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {value !== null && (
                                                            <div className="text-right">
                                                                <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">TUTAR</p>
                                                                <p className={cn(
                                                                    "text-base  tracking-tight",
                                                                    type === "REPAIR_INCOME" || type === "CASH_BALANCE" ? "text-emerald-500" : "text-foreground"
                                                                )}>
                                                                    {type === "REPAIR_INCOME" ? "+" : ""}
                                                                    ₺{Number(value).toLocaleString('tr-TR')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const LayoutDashboard = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="15" rx="1" />
    </svg>
);
