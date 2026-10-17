"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Truck,
    Trash2,
    MessageCircle,
    Package,
    Plus,
    Minus,
    ChevronDown,
    ChevronRight,
    ShoppingBasket,
    Sparkles,
    CheckCircle2,
    ClipboardList,
    Loader2,
    User,
    ArrowRight,
    ExternalLink,
    XCircle,
    Clock,
    Layers
} from "lucide-react";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";
import { getStaffShell } from "@/lib/actions/staff-actions";
import { bulkAssignProductsToCourier } from "@/lib/actions/shortage-actions";
import { getPurchaseOrders, cancelPurchaseOrder } from "@/lib/actions/supplier-actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { MalKabulModal } from "@/components/supplier/mal-kabul-modal";
import { PurchaseOrderDetailModal } from "@/components/supplier/purchase-order-detail-modal";
import { sanitizeWhatsAppPhone } from "@/lib/utils/notifications";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Beklemede", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    ORDERED: { label: "Sipariş Verildi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    DELIVERED: { label: "Teslim Alındı", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    CANCELLED: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

interface SupplierOrderListsPanelProps {
    isOpen?: boolean;
    onClose?: () => void;
    isInline?: boolean;
    defaultTab?: "orders" | "drafts";
}

export function SupplierOrderListsPanel({ isOpen, onClose, isInline, defaultTab }: SupplierOrderListsPanelProps) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { orders, updateQty, removeProduct, clearSupplier, totalItemCount, markSeen } = useSupplierOrders();
    const supplierIds = Object.keys(orders);

    // Tab state (orders = Gerçek DB Siparişleri, drafts = İhtiyaç Sepeti/Taslaklar)
    const [activeTab, setActiveTab] = useState<"orders" | "drafts">(
        defaultTab || (supplierIds.length > 0 ? "drafts" : "orders")
    );

    // Taslaklara yeni ürün eklendiğinde otomatik olarak sepet sekmesine geç
    const prevCountRef = useRef(totalItemCount);
    useEffect(() => {
        if (totalItemCount > prevCountRef.current) {
            setActiveTab("drafts");
        }
        prevCountRef.current = totalItemCount;
    }, [totalItemCount]);

    // Veritabanındaki Satın Alma / Tedarikçi Siparişleri (Tüm sayfalarla senkronize)
    const { data: purchaseOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: () => getPurchaseOrders(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });

    // Açık / Bekleyen Siparişler
    const activePurchaseOrders = purchaseOrders.filter(
        (o: any) => o.status === "PENDING" || o.status === "ORDERED"
    );

    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set(Object.keys(orders)));
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [orderingStatus, setOrderingStatus] = useState<Record<string, "idle" | "loading" | "success">>({});
    const [couriers, setCouriers] = useState<any[]>([]);
    const [isAssigning, setIsAssigning] = useState<Record<string, boolean>>({});

    // Modallar
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [selectedSupplierForWhatsApp, setSelectedSupplierForWhatsApp] = useState<{
        name: string;
        phone: string;
        message: string;
    } | null>(null);

    const [isMalKabulOpen, setIsMalKabulOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedOrderForAction, setSelectedOrderForAction] = useState<any>(null);

    const [cancelConfirmOrder, setCancelConfirmOrder] = useState<any | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        getStaffShell().then(data => {
            setCouriers(data.filter((u: any) => u.role === "COURIER" || u.role === "ADMIN" || u.role === "SHOP_MANAGER"));
        });
    }, []);

    const toggleExpandDraft = (id: string) => {
        markSeen(id);
        setExpandedSuppliers((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleExpandOrder = (id: string) => {
        setExpandedOrders((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Taslak Sepetinden WhatsApp Açma
    const handleDraftWhatsAppClick = (supplierId: string) => {
        const list = orders[supplierId];
        if (!list) return;

        const lines = list.items
            .map((item) => `- ${item.name} x${item.quantity}`)
            .join("\n");

        const initialMessage = `*Sipariş Listesi — ${list.supplierName}*\n\n${lines}\n\n_TakipV2 sistemi üzerinden gönderildi._`;

        setSelectedSupplierForWhatsApp({
            name: list.supplierName,
            phone: sanitizeWhatsAppPhone(list.supplierPhone),
            message: initialMessage
        });
        setWhatsappModalOpen(true);
    };

    // Gerçek Sipariş İçin WhatsApp Açma (Fiyatsız, temiz ürün listesi kuralı)
    const handleOrderWhatsAppClick = (order: any) => {
        const supplierName = order.supplier?.name || "Tedarikçi";
        const phone = sanitizeWhatsAppPhone(order.supplier?.phone);
        const items = (order.items || []).map((it: any) => `• ${it.name} — ${it.quantity} Adet`).join("\n");
        const msg = `*Sipariş Talebi*\n*Tedarikçi:* ${supplierName}\n*Sipariş No:* #${order.orderNo}\n\n*Sipariş Edilen Ürünler:*\n${items}\n\n_Lütfen siparişin onayını ve teslimat bilgisini iletiniz._`;

        setSelectedSupplierForWhatsApp({
            name: supplierName,
            phone,
            message: msg
        });
        setWhatsappModalOpen(true);
    };

    // Taslaktan Sipariş Oluşturma (DB'ye kaydeder, @stok/siparisler ile anında senkronize olur)
    const handleCreateOrder = async (supplierId: string, items: any[], supplierName: string) => {
        setOrderingStatus((prev) => ({ ...prev, [supplierId]: "loading" }));
        try {
            const res = await createPurchaseOrderAction({
                supplierId,
                orderNo: `PO-${Date.now()}`,
                items: items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    buyPrice: 0,
                })),
                totalAmount: 0,
                vatAmount: 0,
                netAmount: 0,
                description: "Eksikler listesinden otomatik oluşturuldu",
            });

            if (res.success) {
                setOrderingStatus((prev) => ({ ...prev, [supplierId]: "success" }));
                toast.success(`${supplierName} siparişi oluşturuldu ve sisteme işlendi!`);

                // Query cache'i anında yenile (@stok/siparisler ile senkronizasyon)
                queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                queryClient.invalidateQueries({ queryKey: ["replenishment-data"] });
                queryClient.invalidateQueries({ queryKey: ["critical-products"] });

                setTimeout(() => {
                    setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
                    clearSupplier(supplierId);
                    // Oluşturulan siparişi anında görmek için Aktif Siparişler sekmesine geç
                    setActiveTab("orders");
                }, 1000);
            } else {
                toast.error(res.error || "Sipariş oluşturulamadı.");
                setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
            }
        } catch (err) {
            setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
            toast.error("Beklenmeyen bir hata oluştu.");
        }
    };

    // Kuryeye Toplu Atama
    const handleAssignToCourier = async (supplierId: string, items: any[], courierId: string, courierName: string) => {
        const assignmentItems = items
            .filter(i => i.productId)
            .map(i => ({ productId: i.productId, quantity: i.quantity }));

        if (assignmentItems.length === 0) {
            toast.error("Atanacak geçerli ürün bulunamadı.");
            return;
        }

        setIsAssigning(prev => ({ ...prev, [supplierId]: true }));
        try {
            const res = await bulkAssignProductsToCourier(assignmentItems, courierId);
            if (res.success) {
                toast.success(`Ürünler ${courierName} kuryesine atandı!`);
                clearSupplier(supplierId);
            } else {
                toast.error(res.error || "Atama işlemi başarısız.");
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsAssigning(prev => ({ ...prev, [supplierId]: false }));
        }
    };

    // Sipariş İptal Etme
    const handleCancelOrder = async (orderId: string) => {
        setIsCancelling(true);
        try {
            const res = await cancelPurchaseOrder(orderId);
            if (res.success) {
                toast.success("Sipariş iptal edildi. Ürünler ihtiyaç listesine geri aktarıldı.");
                queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                queryClient.invalidateQueries({ queryKey: ["critical-products"] });
            } else {
                toast.error(res.error || "Sipariş iptal edilemedi.");
            }
        } catch {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsCancelling(false);
            setCancelConfirmOrder(null);
        }
    };

    const handleClearSupplier = (supplierId: string, name: string) => {
        clearSupplier(supplierId);
        toast.success(`${name} sipariş listesi temizlendi.`);
    };

    const content = (
        <div className={cn(
            "flex flex-col overflow-hidden",
            isInline ? "bg-card border border-border/50 rounded-[2rem]" : "h-full w-full"
        )}>
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-border/50 shrink-0 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <span>Tedarikçi Siparişleri</span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium">
                                @stok/siparisler merkezi ile tam senkronize
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/stok/siparisler"
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl transition-all border border-blue-500/20 shrink-0"
                        title="Tüm tedarikçi siparişlerini ve geçmişi görüntüle"
                    >
                        <span>Tümünü Gör</span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>

                {/* Senkronize Sekme Seçici (Aktif Siparişler vs Taslak Sepet) */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-border/50 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 rounded-lg transition-all",
                            activeTab === "orders"
                                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-xs font-extrabold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Aktif Siparişler</span>
                        <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px]",
                            activePurchaseOrders.length > 0
                                ? "bg-blue-500 text-white font-extrabold"
                                : "bg-zinc-200 dark:bg-zinc-700 text-muted-foreground"
                        )}>
                            {activePurchaseOrders.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("drafts")}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 rounded-lg transition-all",
                            activeTab === "drafts"
                                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-xs font-extrabold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ShoppingBasket className="h-3.5 w-3.5" />
                        <span>Taslak Sepet</span>
                        {totalItemCount > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-extrabold animate-pulse">
                                {totalItemCount}
                            </span>
                        ) : (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-muted-foreground">
                                0
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[640px] custom-scrollbar">

                {/* SEKME 1: AKTİF TEDARİKÇİ SİPARİŞLERİ (DB - @stok/siparisler İLE BİREBİR AYNI) */}
                {activeTab === "orders" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                        {isLoadingOrders ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                <span className="text-xs font-medium">Siparişler senkronize ediliyor...</span>
                            </div>
                        ) : activePurchaseOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-border flex items-center justify-center text-muted-foreground">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Bekleyen Açık Sipariş Yok</h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 max-w-56 leading-relaxed">
                                        Şu anda yolda olan açık tedarikçi siparişi bulunmuyor. Taslak sepetinden yeni sipariş verebilirsiniz.
                                    </p>
                                </div>
                                {totalItemCount > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={() => setActiveTab("drafts")}
                                        className="h-8 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm mt-2"
                                    >
                                        <ShoppingBasket className="h-3.5 w-3.5" />
                                        Taslak Sepete Git ({totalItemCount} Kalem)
                                    </Button>
                                )}
                            </div>
                        ) : (
                            activePurchaseOrders.map((order: any) => {
                                const isExpanded = expandedOrders.has(order.id);
                                const statusCfg = ORDER_STATUS_MAP[order.status] || {
                                    label: order.status,
                                    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                };
                                const items = order.items || [];
                                const totalQty = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

                                return (
                                    <div
                                        key={order.id}
                                        className="rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-border/70 hover:border-blue-500/30 transition-all overflow-hidden shadow-2xs"
                                    >
                                        {/* Sipariş Başlığı */}
                                        <button
                                            type="button"
                                            onClick={() => toggleExpandOrder(order.id)}
                                            className="w-full flex items-center gap-3 p-3.5 hover:bg-zinc-50/50 dark:hover:bg-white/[0.03] transition-all text-left"
                                        >
                                            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-500">
                                                <Truck className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-xs text-foreground truncate">
                                                        {order.supplier?.name || "Tedarikçi"}
                                                    </p>
                                                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                                                        #{order.orderNo}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <span>{items.length} çeşit · {totalQty} adet</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: tr })}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge className={cn("border text-[9px] px-2 py-0.5 font-bold rounded-lg", statusCfg.color)}>
                                                    {statusCfg.label}
                                                </Badge>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Açılır Kalem Listesi */}
                                        {isExpanded && (
                                            <div className="border-t border-border/50 p-3 space-y-2 bg-zinc-50/40 dark:bg-black/20">
                                                <div className="space-y-1.5">
                                                    {items.map((it: any, idx: number) => (
                                                        <div
                                                            key={it.id || idx}
                                                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/60 dark:bg-white/[0.02] border border-border/40"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Package className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                                                <span className="font-semibold text-foreground truncate">{it.name}</span>
                                                            </div>
                                                            <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 text-[11px] ml-2">
                                                                {it.quantity} Adet
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Aksiyon Butonları */}
                                                <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
                                                    {/* Mal Kabul (Teslim Al & Stoğa Ekle) */}
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrderForAction(order);
                                                            setIsMalKabulOpen(true);
                                                        }}
                                                        className="flex-1 h-8 px-2.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-sm"
                                                        title="Mal kabul yapın, adetleri kontrol edip envantere işleyin"
                                                    >
                                                        <Package className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">Teslim Al</span>
                                                    </Button>

                                                    {/* WhatsApp Bildirimi */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOrderWhatsAppClick(order);
                                                        }}
                                                        className="h-8 px-2.5 rounded-lg text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 gap-1"
                                                        title="Tedarikçiye sipariş listesini WhatsApp'tan ilet"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                                        <span>WhatsApp</span>
                                                    </Button>

                                                    {/* Detay & Yazdır */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrderForAction(order);
                                                            setIsDetailOpen(true);
                                                        }}
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                                        title="Sipariş Detayı / Yazdır"
                                                    >
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {/* Sipariş İptal */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCancelConfirmOrder(order);
                                                        }}
                                                        className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                        title="Siparişi İptal Et"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* SEKME 2: TASLAK SİPARİŞ SEPETİ (Smart Replenishment & Manuel Eklenenler) */}
                {activeTab === "drafts" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                        {supplierIds.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-border flex items-center justify-center text-muted-foreground">
                                    <ShoppingBasket className="h-7 w-7 text-zinc-400" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Taslak Sepetiniz Boş</h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 max-w-56 leading-relaxed">
                                        Üstteki Akıllı Stok Yenileme panelinden veya eksik listesinden ürün ekleyerek sipariş taslağı oluşturabilirsiniz.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            supplierIds.map((supplierId) => {
                                const list = orders[supplierId];
                                const isExpanded = expandedSuppliers.has(supplierId);
                                const totalQty = list.items.reduce((s, i) => s + i.quantity, 0);

                                return (
                                    <div key={supplierId} className="rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-border/70 overflow-hidden shadow-2xs">
                                        {/* Supplier header row */}
                                        <button
                                            type="button"
                                            onClick={() => toggleExpandDraft(supplierId)}
                                            className="w-full flex items-center gap-3 p-3.5 hover:bg-zinc-50/50 dark:hover:bg-white/[0.03] transition-all text-left"
                                        >
                                            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                                                <ShoppingBasket className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-xs text-foreground truncate">{list.supplierName}</p>
                                                    {list.hasNewItems && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <span>{list.items.length} çeşit · {totalQty} adet</span>
                                                    {list.hasNewItems && (
                                                        <span className="text-emerald-500 font-semibold animate-pulse">Yeni Eklendi</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge className={cn("border-none text-[9px] px-2", list.hasNewItems ? "bg-emerald-500/20 text-emerald-400 font-bold" : "bg-blue-500/10 text-blue-400")}>
                                                    {list.items.length}
                                                </Badge>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded items */}
                                        {isExpanded && (
                                            <div className="border-t border-border/50 bg-zinc-50/40 dark:bg-black/20">
                                                <div className="p-3 space-y-2">
                                                    {list.items.map((item, idx) => (
                                                        <div
                                                            key={`${item.productId ?? item.name}-${idx}`}
                                                            className="flex items-center gap-2 p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-border/50 group"
                                                        >
                                                            <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-white/5 border border-border flex items-center justify-center shrink-0">
                                                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </div>
                                                            <span className="flex-1 text-xs text-foreground truncate font-medium">{item.name}</span>

                                                            {/* Qty controls */}
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(supplierId, item.productId, item.name, item.quantity - 1)}
                                                                    className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-200 transition-all"
                                                                >
                                                                    <Minus className="h-2.5 w-2.5" />
                                                                </button>
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateQty(supplierId, item.productId, item.name, parseInt(e.target.value) || 1)}
                                                                    className="h-6 w-10 text-center bg-white dark:bg-zinc-900 border-border text-[11px] font-bold text-blue-600 dark:text-blue-400 px-1 rounded-md focus-visible:ring-blue-500"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(supplierId, item.productId, item.name, item.quantity + 1)}
                                                                    className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-200 transition-all"
                                                                >
                                                                    <Plus className="h-2.5 w-2.5" />
                                                                </button>
                                                            </div>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="h-6 w-6 rounded-md text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                                        title="Kuryeye Ata"
                                                                    >
                                                                        <User className="h-3 w-3" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                                                    {couriers.length === 0 ? (
                                                                        <div className="p-2 text-[10px] text-center text-muted-foreground">Aktif kurye yok</div>
                                                                    ) : (
                                                                        couriers.map((courier) => (
                                                                            <DropdownMenuItem
                                                                                key={courier.id}
                                                                                onClick={() => handleAssignToCourier(supplierId, [item], courier.id, `${courier.name} ${courier.surname || ""}`)}
                                                                                className="text-[11px] cursor-pointer rounded-lg flex items-center gap-2"
                                                                            >
                                                                                <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center">
                                                                                    <User className="h-3 w-3 text-orange-500" />
                                                                                </div>
                                                                                {courier.name} {courier.surname}
                                                                            </DropdownMenuItem>
                                                                        ))
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeProduct(supplierId, item.productId, item.name)}
                                                                className="h-6 w-6 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                                title="Listeden Kaldır"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Actions */}
                                                <div className="px-3 pb-3 flex items-center gap-1.5 pt-1">
                                                    <Button
                                                        onClick={() => handleDraftWhatsAppClick(supplierId)}
                                                        className="flex-1 h-9 rounded-xl bg-[#25D366] hover:bg-[#22c55e] text-white text-[10px] font-bold gap-1.5 shadow-sm"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">WhatsApp</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleCreateOrder(supplierId, list.items, list.supplierName)}
                                                        disabled={orderingStatus[supplierId] !== undefined && orderingStatus[supplierId] !== "idle"}
                                                        className={cn(
                                                            "flex-1 text-white text-[10px] font-bold h-9 rounded-xl gap-1.5 transition-all shadow-sm",
                                                            orderingStatus[supplierId] === "success"
                                                                ? "bg-emerald-600 hover:bg-emerald-700"
                                                                : "bg-blue-600 hover:bg-blue-700"
                                                        )}
                                                    >
                                                        {orderingStatus[supplierId] === "loading" ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                                        ) : orderingStatus[supplierId] === "success" ? (
                                                            <>
                                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">Sipariş Verildi</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">Sipariş Ver</span>
                                                            </>
                                                        )}
                                                    </Button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                disabled={isAssigning[supplierId]}
                                                                className="h-9 px-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold gap-1 shadow-sm shrink-0"
                                                                title="Tüm listeyi kuryeye ata"
                                                            >
                                                                {isAssigning[supplierId] ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                                                ) : (
                                                                    <User className="h-3.5 w-3.5 shrink-0" />
                                                                )}
                                                                <span>Kurye</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                                            {couriers.length === 0 ? (
                                                                <div className="p-2 text-xs text-center text-muted-foreground">Aktif kurye yok</div>
                                                            ) : (
                                                                couriers.map((courier) => (
                                                                    <DropdownMenuItem
                                                                        key={courier.id}
                                                                        onClick={() => handleAssignToCourier(supplierId, list.items, courier.id, `${courier.name} ${courier.surname || ""}`)}
                                                                        className="text-xs cursor-pointer rounded-lg"
                                                                    >
                                                                        {courier.name} {courier.surname}
                                                                    </DropdownMenuItem>
                                                                ))
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleClearSupplier(supplierId, list.supplierName)}
                                                        className="h-9 px-2.5 shrink-0 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 border border-border/50 text-xs"
                                                        title="Listeyi Temizle"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* MODALLAR */}

            {/* WhatsApp Gönderim Onay Modalı */}
            {selectedSupplierForWhatsApp && (
                <WhatsAppConfirmModal
                    isOpen={whatsappModalOpen}
                    onClose={() => {
                        setWhatsappModalOpen(false);
                        setSelectedSupplierForWhatsApp(null);
                    }}
                    phone={selectedSupplierForWhatsApp.phone || ""}
                    customerName={selectedSupplierForWhatsApp.name}
                    initialMessage={selectedSupplierForWhatsApp.message}
                />
            )}

            {/* Mal Kabul Modalı (Teslim Alma & Stok Girişi & Fiyat Güncelleme) */}
            {isMalKabulOpen && selectedOrderForAction && (
                <MalKabulModal
                    isOpen={isMalKabulOpen}
                    onClose={() => {
                        setIsMalKabulOpen(false);
                        setSelectedOrderForAction(null);
                        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                        queryClient.invalidateQueries({ queryKey: ["critical-products"] });
                        queryClient.invalidateQueries({ queryKey: ["replenishment-data"] });
                        router.refresh();
                    }}
                    order={selectedOrderForAction}
                />
            )}

            {/* Sipariş Detay & Yazdırma Modalı */}
            {isDetailOpen && selectedOrderForAction && (
                <PurchaseOrderDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setSelectedOrderForAction(null);
                    }}
                    order={selectedOrderForAction}
                />
            )}

            {/* Sipariş İptal Onay Diyaloğu */}
            <AlertDialog open={!!cancelConfirmOrder} onOpenChange={(open) => !open && setCancelConfirmOrder(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold">
                            Siparişi İptal Etmek İstiyor Musunuz?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground">
                            <strong>#{cancelConfirmOrder?.orderNo}</strong> nolu siparişi iptal ettiğinizde, içindeki ürünler eksik listesine geri aktarılacaktır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling} className="rounded-xl text-xs font-bold">
                            Vazgeç
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isCancelling}
                            onClick={() => cancelConfirmOrder && handleCancelOrder(cancelConfirmOrder.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-2"
                        >
                            {isCancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Siparişi İptal Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    if (isInline) return content;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:w-[480px] bg-card border-l border-border/50 p-0">
                {content}
            </SheetContent>
        </Sheet>
    );
}
