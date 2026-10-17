"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ShoppingBasket,
    Truck,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    MessageCircle,
    ArrowRight,
    Trash2,
    Search,
    Plus,
    Filter,
    Layers,
    Calendar,
    ChevronRight,
    TrendingUp,
    Store
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, normalizeSearchText } from "@/lib/utils";
import { sanitizeWhatsAppPhone } from "@/lib/utils/notifications";
import { toast } from "sonner";
import { getPurchaseOrders, getSuppliers, cancelPurchaseOrder } from "@/lib/actions/supplier-actions";
import { deletePurchaseOrdersAction } from "@/lib/actions/purchase-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { MalKabulModal } from "@/components/supplier/mal-kabul-modal";
import { PurchaseOrderDetailModal } from "@/components/supplier/purchase-order-detail-modal";
import { PurchaseForm } from "@/components/supplier/purchase-form";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { SupplierOrderListsPanel } from "@/components/supplier/supplier-order-lists-panel";

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Beklemede", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    ORDERED: { label: "Sipariş Verildi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    DELIVERED: { label: "Teslim Alındı", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    CANCELLED: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

interface StockOrdersClientProps {
    initialOrders?: any[];
    initialSuppliers?: any[];
}

export function StockOrdersClient({ initialOrders = [], initialSuppliers = [] }: StockOrdersClientProps) {
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<"orders" | "drafts">("orders");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

    // Modal States
    const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
    const [isMalKabulOpen, setIsMalKabulOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Cancel & Delete Dialogs
    const [cancelConfirmOrder, setCancelConfirmOrder] = useState<any | null>(null);
    const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // WhatsApp Modal State
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [whatsAppSupplierName, setWhatsAppSupplierName] = useState("");
    const [whatsAppPhone, setWhatsAppPhone] = useState("");
    const [whatsAppMessage, setWhatsAppMessage] = useState("");

    // Queries
    const { data: purchaseOrders = initialOrders } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: () => getPurchaseOrders(),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const { data: suppliers = initialSuppliers } = useQuery({
        queryKey: ["suppliers"],
        queryFn: () => getSuppliers(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const { data: shop } = useQuery({
        queryKey: ["shop"],
        queryFn: () => getShop(),
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // KPI Metrics
    const metrics = useMemo(() => {
        const totalCount = purchaseOrders.length;
        const pendingCount = purchaseOrders.filter((o: any) => o.status === "PENDING" || o.status === "ORDERED").length;
        const deliveredCount = purchaseOrders.filter((o: any) => o.status === "DELIVERED").length;
        const totalSpent = purchaseOrders
            .filter((o: any) => o.status !== "CANCELLED")
            .reduce((acc: number, o: any) => acc + Number(o.totalAmount || 0), 0);

        return { totalCount, pendingCount, deliveredCount, totalSpent };
    }, [purchaseOrders]);

    // Filtered Orders
    const filteredOrders = useMemo(() => {
        let list = [...purchaseOrders];

        // Status Filter
        if (statusFilter !== "ALL") {
            if (statusFilter === "ACTIVE") {
                list = list.filter((o: any) => o.status === "PENDING" || o.status === "ORDERED");
            } else {
                list = list.filter((o: any) => o.status === statusFilter);
            }
        }

        // Supplier Filter
        if (supplierFilter !== "ALL") {
            list = list.filter((o: any) => o.supplierId === supplierFilter);
        }

        // Search Query (Turkish insensitive)
        if (searchQuery.trim()) {
            const normalizedQuery = normalizeSearchText(searchQuery.trim());
            list = list.filter((o: any) => {
                const orderNo = normalizeSearchText(o.orderNo || "");
                const supplierName = normalizeSearchText(o.supplier?.name || "");
                const itemsMatch = (o.items || []).some((item: any) =>
                    normalizeSearchText(item.name || "").includes(normalizedQuery)
                );
                return orderNo.includes(normalizedQuery) || supplierName.includes(normalizedQuery) || itemsMatch;
            });
        }

        return list;
    }, [purchaseOrders, statusFilter, supplierFilter, searchQuery]);

    // WhatsApp Gönderim Modalı Açma
    const handleOpenWhatsApp = (order: any) => {
        const supplier = order.supplier || suppliers.find((s: any) => s.id === order.supplierId);
        const supplierName = supplier?.name || "Tedarikçi";
        const phone = sanitizeWhatsAppPhone(supplier?.phone);

        // Kullanıcının kuralı: Sadece ürün adı ve adet bilgisi, kesinlikle fiyat yok!
        const items = (order.items || []).map((it: any) => `• ${it.name} — ${it.quantity} Adet`).join("\n");
        const msg = `*Sipariş Talebi*\n*Tedarikçi:* ${supplierName}\n*Sipariş No:* #${order.orderNo}\n\n*Sipariş Edilen Ürünler:*\n${items}\n\n_Lütfen siparişin onayını ve teslimat bilgisini iletiniz._`;

        setWhatsAppSupplierName(supplierName);
        setWhatsAppPhone(phone);
        setWhatsAppMessage(msg);
        setWhatsAppModalOpen(true);
    };

    // İptal İşlemi
    const handleCancelOrder = async (orderId: string) => {
        try {
            const res = await cancelPurchaseOrder(orderId);
            if (res.success) {
                toast.success("Sipariş iptal edildi. Eksik ürünler ihtiyaç listesine geri aktarıldı.");
                queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            } else {
                toast.error(res.error || "Sipariş iptal edilemedi.");
            }
        } catch {
            toast.error("Bir hata oluştu.");
        } finally {
            setCancelConfirmOrder(null);
        }
    };

    // Silme İşlemi
    const handleDeleteOrder = async (orderId: string) => {
        setIsDeleting(true);
        try {
            const res = await deletePurchaseOrdersAction([orderId]);
            if (res.success) {
                toast.success("Sipariş başarıyla silindi.");
                queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            } else {
                toast.error(res.error || "Sipariş silinemedi.");
            }
        } catch {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOrder(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* KPI İstatistik Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Toplam Sipariş</span>
                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Truck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground">{metrics.totalCount}</span>
                        <span className="text-xs text-zinc-400 font-medium">Kayıt</span>
                    </div>
                </Card>

                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Açık / Bekleyen</span>
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.pendingCount}</span>
                        <span className="text-xs text-zinc-400 font-medium">Mal Kabul Bekliyor</span>
                    </div>
                </Card>

                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teslim Alınanlar</span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.deliveredCount}</span>
                        <span className="text-xs text-zinc-400 font-medium">Stoğa Eklendi</span>
                    </div>
                </Card>

                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Toplam Satın Alma</span>
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground">
                            ₺{Math.round(metrics.totalSpent).toLocaleString("tr-TR")}
                        </span>
                    </div>
                </Card>
            </div>

            {/* Üst Sekmeler ve Yeni Sipariş Butonu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                            activeTab === "orders"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                    >
                        <Truck className="h-4 w-4" />
                        Tedarikçi Siparişleri & Satın Almalar ({purchaseOrders.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("drafts")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                            activeTab === "drafts"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                    >
                        <ShoppingBasket className="h-4 w-4" />
                        Eksik Stok Sipariş Sepeti / Taslaklar
                    </button>
                </div>

                <Button
                    onClick={() => setIsPurchaseFormOpen(true)}
                    className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-md shadow-blue-500/20"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Satın Alma / Sipariş Formu
                </Button>
            </div>

            {/* TAB 1: TEDARİKÇİ SİPARİŞLERİ LİSTESİ */}
            {activeTab === "orders" && (
                <div className="space-y-4">
                    {/* Arama ve Filtre Çubuğu */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-zinc-200 dark:border-zinc-800 shadow-xs">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Sipariş no, tedarikçi adı veya ürün ara..."
                                className="pl-10 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-black/30 border-zinc-200 dark:border-zinc-800"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Durum Filtresi */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="h-10 text-xs font-bold rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-800 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="ALL">Tüm Durumlar</option>
                                <option value="ACTIVE">Açık / Bekleyenler</option>
                                <option value="DELIVERED">Teslim Alınanlar</option>
                                <option value="CANCELLED">İptal Edilenler</option>
                            </select>

                            {/* Tedarikçi Filtresi */}
                            <select
                                value={supplierFilter}
                                onChange={e => setSupplierFilter(e.target.value)}
                                className="h-10 text-xs font-bold rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-800 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                            >
                                <option value="ALL">Tüm Tedarikçiler</option>
                                {suppliers.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Masaüstü Tablo Görünümü */}
                    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-card overflow-hidden shadow-xs">
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-6 py-4">Sipariş No</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-4 py-4">Tedarikçi</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-4 py-4">Sipariş Kalemleri</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-4 py-4">Tutar</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-4 py-4">Durum</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-4 py-4">Ödeme</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-4 py-4">Tarih</TableHead>
                                        <TableHead className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest px-6 py-4 text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-40 text-center text-sm font-medium text-zinc-400">
                                                {searchQuery || statusFilter !== "ALL" || supplierFilter !== "ALL"
                                                    ? "Arama ve filtre kriterlerine uygun sipariş bulunamadı."
                                                    : "Henüz oluşturulmuş tedarikçi siparişi bulunmuyor. Yeni sipariş oluşturabilirsiniz."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order: any) => {
                                            const statusInfo = ORDER_STATUS_MAP[order.status] || {
                                                label: order.status,
                                                color: "bg-slate-500/10 text-muted-foreground border-slate-500/20"
                                            };
                                            const itemsSummary = (order.items || [])
                                                .map((it: any) => `${it.name} (x${it.quantity})`)
                                                .join(", ");

                                            return (
                                                <TableRow key={order.id} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all">
                                                    <TableCell className="px-6 py-4 font-mono font-bold text-xs text-foreground">
                                                        #{order.orderNo}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs text-foreground">{order.supplier?.name || "Tedarikçi"}</span>
                                                            <span className="text-[10px] text-zinc-400">{order.supplier?.phone || "İletişim yok"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4 max-w-[280px]">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-foreground font-medium truncate" title={itemsSummary}>
                                                                {itemsSummary || "—"}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">
                                                                {(order.items || []).length} Farklı Kalem · {(order.items || []).reduce((a: number, it: any) => a + Number(it.quantity || 0), 0)} Adet
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4 font-bold text-xs text-foreground">
                                                        ₺{Math.round(Number(order.totalAmount || 0)).toLocaleString("tr-TR")}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Badge className={cn("text-[10px] font-bold border px-2 py-0.5 rounded-lg", statusInfo.color)}>
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Badge className={cn(
                                                            "text-[10px] font-bold border px-2 py-0.5 rounded-lg",
                                                            order.paymentStatus === "PAID"
                                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                : order.paymentStatus === "PARTIAL"
                                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                        )}>
                                                            {order.paymentStatus === "PAID" ? "Ödendi" : order.paymentStatus === "PARTIAL" ? "Kısmi" : "Ödenmedi"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4 text-xs text-zinc-400 font-medium">
                                                        {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Teslim Al (Mal Kabul) */}
                                                            {(order.status === "PENDING" || order.status === "ORDERED") && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setIsMalKabulOpen(true);
                                                                    }}
                                                                    className="h-8 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs"
                                                                >
                                                                    <Package className="h-3.5 w-3.5" />
                                                                    Teslim Al
                                                                </Button>
                                                            )}

                                                            {/* WhatsApp ile Gönder */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenWhatsApp(order)}
                                                                className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                                                                title="WhatsApp ile Sipariş Gönder"
                                                            >
                                                                <MessageCircle className="h-4 w-4" />
                                                            </Button>

                                                            {/* İncele */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setIsDetailOpen(true);
                                                                }}
                                                                className="h-8 w-8 text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                                                title="Sipariş Detayı / Fiş"
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>

                                                            {/* İptal Et */}
                                                            {(order.status === "PENDING" || order.status === "ORDERED") && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => setCancelConfirmOrder(order)}
                                                                    className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                                    title="Siparişi İptal Et"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {/* Sil */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeleteConfirmOrder(order)}
                                                                className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                                title="Siparişi Sil"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobil Kart Görünümü */}
                        <div className="block lg:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredOrders.length === 0 ? (
                                <div className="p-8 text-center text-sm font-medium text-zinc-400">
                                    Sipariş kaydı bulunamadı.
                                </div>
                            ) : (
                                filteredOrders.map((order: any) => {
                                    const statusInfo = ORDER_STATUS_MAP[order.status] || {
                                        label: order.status,
                                        color: "bg-slate-500/10 text-muted-foreground border-slate-500/20"
                                    };
                                    return (
                                        <div key={order.id} className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs text-foreground">#{order.orderNo}</span>
                                                    <Badge className={cn("text-[9px] font-bold border px-2 py-0.5 rounded-lg", statusInfo.color)}>
                                                        {statusInfo.label}
                                                    </Badge>
                                                </div>
                                                <span className="font-black text-sm text-foreground">
                                                    ₺{Math.round(Number(order.totalAmount || 0)).toLocaleString("tr-TR")}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">{order.supplier?.name || "Tedarikçi"}</span>
                                                <span className="text-zinc-400 text-[11px]">
                                                    {format(new Date(order.createdAt), "dd MMM yyyy", { locale: tr })}
                                                </span>
                                            </div>

                                            <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-black/30 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                {(order.items || []).map((it: any) => `• ${it.name} (x${it.quantity})`).join(", ") || "Kalem yok"}
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    {(order.status === "PENDING" || order.status === "ORDERED") && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setIsMalKabulOpen(true);
                                                            }}
                                                            className="h-8 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                                        >
                                                            <Package className="h-3.5 w-3.5" />
                                                            Teslim Al
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenWhatsApp(order)}
                                                        className="h-8 px-2.5 rounded-lg text-xs font-bold text-emerald-600 border-emerald-500/20 gap-1"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        WhatsApp
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsDetailOpen(true);
                                                        }}
                                                        className="h-8 w-8 text-zinc-400"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteConfirmOrder(order)}
                                                        className="h-8 w-8 text-rose-500"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB 2: EKSİK STOK SİPARİŞ SEPETİ / TASLAKLAR */}
            {activeTab === "drafts" && (
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <ShoppingBasket className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-foreground">Hazırlanan Tedarikçi Sipariş Listeleri</h4>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Kritik stok veya servis eksiklerinden otomatik/manuel toplanan, kuryeye atanmayı veya siparişe dönüştürülmeyi bekleyen listeler.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto w-full">
                        <SupplierOrderListsPanel isInline={true} />
                    </div>
                </div>
            )}

            {/* MODALLAR */}

            {/* Yeni Satın Alma Formu */}
            {isPurchaseFormOpen && (
                <PurchaseForm
                    isOpen={isPurchaseFormOpen}
                    onClose={() => setIsPurchaseFormOpen(false)}
                    suppliers={suppliers}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                        setIsPurchaseFormOpen(false);
                    }}
                />
            )}

            {/* Mal Kabul Modalı (Teslim Alma & Stoğa Ekleme & Fiyat Güncelleme) */}
            {isMalKabulOpen && selectedOrder && (
                <MalKabulModal
                    isOpen={isMalKabulOpen}
                    onClose={() => {
                        setIsMalKabulOpen(false);
                        setSelectedOrder(null);
                        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                        queryClient.invalidateQueries({ queryKey: ["critical-products"] });
                    }}
                    order={selectedOrder}
                />
            )}

            {/* Sipariş Detay & Yazdırma Modalı */}
            {isDetailOpen && selectedOrder && (
                <PurchaseOrderDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setSelectedOrder(null);
                    }}
                    order={selectedOrder}
                />
            )}

            {/* WhatsApp Önizleme ve Gönderim Modalı */}
            <WhatsAppConfirmModal
                isOpen={whatsAppModalOpen}
                onClose={() => setWhatsAppModalOpen(false)}
                phone={whatsAppPhone}
                customerName={whatsAppSupplierName}
                initialMessage={whatsAppMessage}
            />

            {/* Sipariş İptal Onay Dialogu */}
            <AlertDialog open={!!cancelConfirmOrder} onOpenChange={() => setCancelConfirmOrder(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Siparişi İptal Etmek İstiyor Musunuz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            #{cancelConfirmOrder?.orderNo} numaralı sipariş iptal edilecek ve siparişteki eksik ürünler otomatik olarak ihtiyaç listesine geri dönecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cancelConfirmOrder && handleCancelOrder(cancelConfirmOrder.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                        >
                            Siparişi İptal Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Sipariş Silme Onay Dialogu */}
            <AlertDialog open={!!deleteConfirmOrder} onOpenChange={() => setDeleteConfirmOrder(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Siparişi Silmek İstiyor Musunuz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            #{deleteConfirmOrder?.orderNo} numaralı sipariş kaydı sistemden kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={() => deleteConfirmOrder && handleDeleteOrder(deleteConfirmOrder.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
