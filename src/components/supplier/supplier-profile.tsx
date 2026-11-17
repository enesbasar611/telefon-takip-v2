"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import {
    Phone,
    Mail,
    MapPin,
    Edit3,
    Wallet,
    PlusCircle,
    CheckCircle2,
    Clock,
    ShoppingBag,
    CreditCard,
    History,
    FileText,
    ChevronRight,
    ChevronLeft,
    ArrowLeft,
    Truck,
    PackageCheck,
    Landmark,
    Loader2,
    Printer,
    Package,
    RefreshCcw,
    User,
    ChevronDown,
    Trash2,
    Zap,
    Copy,
    XCircle,
    FileSpreadsheet,
    Search,
    X,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MalKabulModal } from "./mal-kabul-modal";
import { SupplierPaymentModal } from "./supplier-payment-modal";
import { PurchaseOrderDetailModal } from "./purchase-order-detail-modal";
import { TedarikciCariEkstreModal } from "./tedarikci-cari-ekstre-modal";
import { SupplierPaymentHistoryModal } from "./supplier-payment-history-modal";
import { EditSupplierModal } from "./edit-supplier-modal";
import { deleteSupplier, cancelPurchaseOrder, getSupplierById } from "@/lib/actions/supplier-actions";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";
import { toast } from "sonner";
import { PurchaseForm } from "./purchase-form";
import { WholesalerImportModal } from "@/components/stock/wholesaler-import-modal";
import { UndoLastImportButton } from "@/components/stock/undo-last-import-button";
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

interface SupplierProfileProps {
    supplier: any;
    onBack: () => void;
    suppliers: any[];
    shop?: any;
    couriers?: any[];
}

export function SupplierProfile({ supplier: initialSupplier, onBack, suppliers, shop, couriers = [] }: SupplierProfileProps) {
    const queryClient = useQueryClient();
    const [supplierState, setSupplierState] = useState(initialSupplier);

    // Canlı tedarikçi sorgusu - Ön bellek temizlendiğinde anında güncellenir
    const { data: liveSupplier, refetch: refetchSupplier } = useQuery({
        queryKey: ["supplier", initialSupplier.id],
        queryFn: async () => {
            const res = await getSupplierById(initialSupplier.id);
            if (res) setSupplierState(res);
            return res;
        },
        initialData: initialSupplier,
        staleTime: 5 * 1000,
        refetchOnWindowFocus: true,
    });

    // Canlı döviz kuru sorgusu (Dolar karşılıkları için)
    const { data: exchangeRates } = useQuery({
        queryKey: ["currentExchangeRates"],
        queryFn: () => getCurrentExchangeRates(),
        staleTime: 60 * 1000,
    });
    const usdRate = (exchangeRates?.usd && exchangeRates.usd > 1) ? exchangeRates.usd : 34.5;

    const supplier = supplierState || liveSupplier || initialSupplier;
    const setSupplier = (newVal: any) => {
        setSupplierState(newVal);
        queryClient.setQueryData(["supplier", initialSupplier.id], newVal);
    };

    const [activeTab, setActiveTab] = useState("orders");
    const [isMalKabulOpen, setIsMalKabulOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isIbanOpen, setIsIbanOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isEkstreOpen, setIsEkstreOpen] = useState(false);
    const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [initialPaymentOrderId, setInitialPaymentOrderId] = useState<string | undefined>(undefined);
    const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | undefined>(undefined);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGroupedByDay, setIsGroupedByDay] = useState(true);
    const [cancelConfirmOrder, setCancelConfirmOrder] = useState<any>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Recovery & UI states
    const [selectedReturnForCourier, setSelectedReturnForCourier] = useState<any>(null);
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // Ürünler sekmesi filtreleme ve sayfalama state'leri
    const [productSearch, setProductSearch] = useState("");
    const [productCategory, setProductCategory] = useState("ALL");
    const [productPage, setProductPage] = useState(1);
    const [productPageSize, setProductPageSize] = useState(10);

    useEffect(() => {
        if (initialSupplier?.id) {
            setSupplierState(initialSupplier);
            refetchSupplier();
        }
    }, [initialSupplier?.id, refetchSupplier]);

    const handleDetail = (order: any) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const handleAssignToCourier = async (courierId: string) => {
        if (!selectedReturnForCourier) return;
        setIsAssigning(true);
        try {
            const { assignReturnToCourier } = await import("@/lib/actions/return-actions");
            const result = await assignReturnToCourier(selectedReturnForCourier.id, courierId);
            if (result.success) {
                toast.success("İade başarıyla kuryeye atandı.");
                setIsCourierModalOpen(false);
            } else {
                toast.error(result.error || "Atama yapılamadı.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsAssigning(false);
        }
    };

    // Döviz dönüştürme yardımcısı (Varsayılan TL ise Dolar göster, Dolar ise TL göster)
    const isUsdBase = supplier.currency === "USD";
    const formatDualCurrency = (amount: number) => {
        const val = Number(amount || 0);
        if (isUsdBase) {
            const tryVal = Math.round(val * usdRate);
            return {
                primary: `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                secondary: `(~₺${tryVal.toLocaleString("tr-TR")})`
            };
        } else {
            const usdVal = usdRate > 0 ? (val / usdRate) : 0;
            return {
                primary: `₺${Math.round(val).toLocaleString("tr-TR")}`,
                secondary: `(~$${usdVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`
            };
        }
    };

    const totalShoppingDual = formatDualCurrency(supplier.totalShopping || 0);
    const balanceDual = formatDualCurrency(supplier.balance || 0);
    const totalPaidDual = formatDualCurrency(Number(supplier.totalShopping || 0) - Number(supplier.balance || 0));

    const stats = [
        {
            id: "history",
            label: "Toplam Alışveriş",
            primary: totalShoppingDual.primary,
            secondary: totalShoppingDual.secondary,
            icon: ShoppingBag,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            id: "cari",
            label: "Güncel Borç",
            primary: balanceDual.primary,
            secondary: balanceDual.secondary,
            icon: Wallet,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            action: Number(supplier.balance || 0) > 0 ? (
                <button
                    type="button"
                    onClick={() => {
                        setInitialPaymentOrderId("manual");
                        setInitialPaymentAmount(Number(supplier.balance));
                        setIsPaymentOpen(true);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-500 hover:text-emerald-400 transition-colors tracking-wider cursor-pointer w-fit"
                >
                    <span>⚡ Borcu Kapat</span>
                    <span>→</span>
                </button>
            ) : null,
        },
        {
            id: "payment",
            label: "Toplam Ödenen",
            primary: totalPaidDual.primary,
            secondary: totalPaidDual.secondary,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            id: "orders",
            label: "Aktif Siparişler",
            primary: `${supplier.purchases?.filter((p: any) => p.status !== "COMPLETED").length || 0} Adet`,
            secondary: "(Bekleyen / Yolda)",
            icon: Truck,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
    ];

    // Ürünleri siparişlerden detaylı biçimde topla (en son alış fiyatı, dolar karşılığı, kategori ve son tarih)
    const aggregatedProducts = useMemo(() => {
        const prodMap = new Map<string, any>();
        (supplier.purchases || []).forEach((p: any) => {
            const orderDate = p.createdAt;
            const orderNo = p.orderNo || p.id?.slice(-6);

            (p.items || []).forEach((item: any) => {
                const key = item.productId || item.name;
                if (!key) return;

                const itemName = item.name || item.product?.name || "İsimsiz Ürün";
                const qty = Number(item.quantity || item.receivedQuantity || 1);
                const unitBuy = Number(item.buyPrice || 0);
                const unitBuyUsd = item.buyPriceUsd
                    ? Number(item.buyPriceUsd)
                    : (usdRate > 0 && unitBuy > 0 ? unitBuy / usdRate : null);
                const totalItemAmount = Number(item.totalAmount ?? (unitBuy * qty));
                const category = item.product?.category?.name || item.category || "Genel";
                const sku = item.product?.sku || item.sku || "—";

                const existing = prodMap.get(key);
                if (existing) {
                    existing.quantity += qty;
                    existing.totalAmount += totalItemAmount;
                    existing.orderCount += 1;
                } else {
                    prodMap.set(key, {
                        id: key,
                        name: itemName,
                        category,
                        sku,
                        quantity: qty,
                        totalAmount: totalItemAmount,
                        latestBuyPrice: unitBuy,
                        latestBuyPriceUsd: unitBuyUsd,
                        lastOrderDate: orderDate,
                        lastOrderNo: orderNo,
                        orderCount: 1,
                    });
                }
            });
        });
        return Array.from(prodMap.values());
    }, [supplier.purchases, usdRate]);

    // Ürün kategorileri listesi
    const productCategories = useMemo(() => {
        const cats = new Set<string>();
        aggregatedProducts.forEach((p: any) => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).sort();
    }, [aggregatedProducts]);

    // Arama ve kategori filtrelemesi
    const filteredProducts = useMemo(() => {
        const q = productSearch.toLowerCase().trim();
        return aggregatedProducts.filter((p: any) => {
            if (productCategory !== "ALL" && p.category !== productCategory) return false;
            if (q) {
                const matchName = p.name.toLowerCase().includes(q);
                const matchSku = p.sku.toLowerCase().includes(q);
                const matchCat = p.category.toLowerCase().includes(q);
                return matchName || matchSku || matchCat;
            }
            return true;
        });
    }, [aggregatedProducts, productSearch, productCategory]);

    // Sayfalama (1000 ürün olsa bile takılmadan temiz görünür)
    const totalProductPages = Math.ceil(filteredProducts.length / productPageSize) || 1;
    const paginatedProducts = useMemo(() => {
        const start = (productPage - 1) * productPageSize;
        return filteredProducts.slice(start, start + productPageSize);
    }, [filteredProducts, productPage, productPageSize]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteSupplier(supplier.id);
            if (res.success) {
                toast.success("Tedarikçi başarıyla silindi");
                onBack();
            } else {
                toast.error(res.error || "Tedarikçi silinemedi");
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu");
        } finally {
            setIsDeleting(false);
            setIsDeleteAlertOpen(false);
        }
    };

    const groupedOrders = useMemo(() => {
        if (!isGroupedByDay) return { "Tüm Siparişler": supplier.purchases || [] };
        const groups: any = {};
        (supplier.purchases || []).forEach((p: any) => {
            const date = format(new Date(p.createdAt), "dd MMMM yyyy", { locale: tr });
            if (!groups[date]) groups[date] = [];
            groups[date].push(p);
        });
        return groups;
    }, [supplier.purchases, isGroupedByDay]);

    return (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-300 pb-12">
            {/* Header & Compact Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3.5">
                    <Button
                        onClick={onBack}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-border/50 hover:bg-card hover:border-border transition-all shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
                                {supplier.name}
                            </h1>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 rounded-lg text-[9px] uppercase font-black tracking-wider">
                                Aktif Partner
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">
                            {supplier.category && (
                                <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3 text-primary" /> {supplier.category}
                                </span>
                            )}
                            {supplier.contactName && (
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-muted-foreground" /> {supplier.contactName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Compact, Uniform Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Button: Yeni Sipariş */}
                    <Button
                        size="sm"
                        className="h-8.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-wider px-3.5 shadow-sm transition-all"
                        onClick={() => setIsPurchaseFormOpen(true)}
                    >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        Yeni Sipariş
                    </Button>

                    {/* Fiş / Fatura Yükle */}
                    <WholesalerImportModal
                        suppliers={suppliers}
                        initialSupplierId={supplier.id}
                        lockSupplier={true}
                        defaultAddToStock={false}
                        onSuccess={() => {
                            refetchSupplier();
                            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
                        }}
                        trigger={
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8.5 rounded-xl border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-black uppercase tracking-wider px-3 gap-1.5 transition-all shadow-xs"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Fiş / Fatura Yükle</span>
                            </Button>
                        }
                    />

                    {/* Borcu Kapat (Borç varsa) */}
                    {Number(supplier.balance || 0) > 0 && (
                        <Button
                            size="sm"
                            className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-wider px-3 shadow-sm transition-all"
                            onClick={() => {
                                setInitialPaymentOrderId("manual");
                                setInitialPaymentAmount(Number(supplier.balance));
                                setIsPaymentOpen(true);
                            }}
                        >
                            <Wallet className="w-3.5 h-3.5 mr-1.5" />
                            Borcu Kapat (₺{Math.round(Number(supplier.balance)).toLocaleString("tr-TR")})
                        </Button>
                    )}

                    {/* Son Girişi Geri Al (Undo Import) */}
                    <UndoLastImportButton
                        size="sm"
                        className="h-8.5 rounded-xl text-[11px] font-bold"
                        onSuccess={() => {
                            refetchSupplier();
                            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
                        }}
                    />

                    {/* Düzenle */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 rounded-xl border-border/50 hover:border-primary/50 text-[11px] font-bold uppercase transition-all bg-card/40 px-2.5"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-primary" />
                        Düzenle
                    </Button>

                    {/* Sil */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 rounded-xl border-border/50 hover:border-rose-500/50 text-[11px] font-bold uppercase text-rose-500 hover:bg-rose-500/10 transition-all bg-card/40 px-2.5"
                        onClick={() => setIsDeleteAlertOpen(true)}
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Sil
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid with Dual Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {stats.map((stat) => (
                    <Card
                        key={stat.id}
                        className="bg-card/60 border-border/40 overflow-hidden relative group hover:border-border transition-all"
                    >
                        <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 ${stat.bg} rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-all`} />
                        <CardContent className="p-4 sm:p-4.5 relative flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    {stat.label}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">
                                        {stat.primary}
                                    </span>
                                    {stat.secondary && (
                                        <span className="text-xs font-semibold text-muted-foreground/80 tabular-nums">
                                            {stat.secondary}
                                        </span>
                                    )}
                                </div>
                                {stat.action}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* Left Column - Contact & Details */}
                <div className="xl:col-span-4 flex flex-col gap-4">
                    <Card className="bg-card/70 border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-white/[0.01]">
                            <h3 className="font-black text-xs uppercase tracking-wider text-foreground">
                                İletişim & Bilgiler
                            </h3>
                        </div>
                        <CardContent className="p-4 flex flex-col gap-3.5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Phone className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        Telefon
                                    </span>
                                    <span className="text-xs font-bold text-foreground">{supplier.phone || "—"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                    <Mail className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        E-Posta
                                    </span>
                                    <span className="text-xs font-bold text-foreground">{supplier.email || "—"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        Adres
                                    </span>
                                    <p className="text-xs font-bold text-foreground line-clamp-2">{supplier.address || "—"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/70 border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-white/[0.01] flex items-center justify-between">
                            <h3 className="font-black text-xs uppercase tracking-wider text-foreground">
                                Banka Hesapları
                            </h3>
                        </div>
                        <CardContent className="p-4 flex flex-col gap-3">
                            {supplier.iban ? (
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-border/30 hover:border-border transition-all group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                                            {supplier.bankName || "Banka Belirtilmemiş"}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6 rounded-lg text-blue-500 hover:bg-blue-500/10"
                                                onClick={() => setIsIbanOpen(true)}
                                            >
                                                <Zap className="w-3 h-3" />
                                            </Button>
                                            <CreditCard className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                    <p
                                        className="text-xs font-mono font-bold text-foreground tracking-tight break-all cursor-copy hover:text-blue-400 transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(supplier.iban || "");
                                            toast.success("IBAN Kopyalandı");
                                        }}
                                        title="Kopyalamak için tıklayın"
                                    >
                                        {supplier.iban}
                                    </p>
                                    <span className="text-[9px] text-muted-foreground mt-1.5 block font-medium uppercase tracking-wider">
                                        {supplier.name}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <Landmark className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1.5" />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        Banka bilgisi eklenmemiş
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Transactions, Activity & Products */}
                <div className="xl:col-span-8 flex flex-col gap-4">
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                        {/* Compact Tabs Bar & Quick Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                            <TabsList className="bg-card border border-border/50 p-1 rounded-xl h-10 w-full sm:w-auto">
                                <TabsTrigger
                                    value="orders"
                                    className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold uppercase tracking-wider h-full transition-all"
                                >
                                    <History className="w-3.5 h-3.5 mr-1.5" />
                                    İşlemler
                                </TabsTrigger>
                                <TabsTrigger
                                    value="returns"
                                    className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold uppercase tracking-wider h-full transition-all"
                                >
                                    <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                                    İadeler
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prods"
                                    className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold uppercase tracking-wider h-full transition-all"
                                >
                                    <Package className="w-3.5 h-3.5 mr-1.5" />
                                    Ürünler
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPaymentHistoryOpen(true)}
                                    className="rounded-xl border-border/50 text-[11px] font-bold uppercase tracking-wider h-9 px-3 hover:bg-card"
                                >
                                    <CreditCard className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                    Ödeme Geçmişi
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEkstreOpen(true)}
                                    className="rounded-xl border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider h-9 px-3"
                                >
                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                    Cari Ekstre
                                </Button>
                            </div>
                        </div>

                        {/* Tab 1: Sipariş & Alım Hareketleri */}
                        <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                            <Card className="bg-card border-border/50 overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-white/[0.01] flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black text-xs uppercase tracking-wider text-foreground">
                                            Sipariş & Alım Hareketleri
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-primary border-primary/30">
                                            {supplier.purchases?.length || 0} Toplam Kayıt
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-border/40">
                                        <Button
                                            variant={isGroupedByDay ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setIsGroupedByDay(true)}
                                            className="text-[10px] h-6 px-2.5 rounded-md font-bold uppercase"
                                        >
                                            Günlük
                                        </Button>
                                        <Button
                                            variant={!isGroupedByDay ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setIsGroupedByDay(false)}
                                            className="text-[10px] h-6 px-2.5 rounded-md font-bold uppercase"
                                        >
                                            Tek Liste
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-white/[0.01] text-[10px] text-muted-foreground uppercase tracking-wider font-black">
                                                <th className="px-4 py-3">Sipariş No</th>
                                                <th className="px-4 py-3">Tarih</th>
                                                <th className="px-4 py-3">Miktar</th>
                                                <th className="px-4 py-3">Toplam Tutar</th>
                                                <th className="px-4 py-3">Kalan Borç</th>
                                                <th className="px-4 py-3">Durum</th>
                                                <th className="px-4 py-3 text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs">
                                            {(!supplier.purchases || supplier.purchases.length === 0) ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                                                            <span className="text-xs font-bold text-foreground/80">
                                                                Henüz sipariş veya alım kaydı bulunmuyor
                                                            </span>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                Yukarıdaki &quot;Fiş / Fatura Yükle&quot; butonunu kullanarak toptancı fişlerini içe aktarabilirsiniz.
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                Object.entries(groupedOrders).map(([date, orders]: [string, any]) => (
                                                    <div key={date} className="contents">
                                                        {isGroupedByDay && (
                                                            <tr className="bg-white/[0.02]">
                                                                <td colSpan={7} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/5 border-l-2 border-primary">
                                                                    {date}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {orders.map((order: any) => (
                                                            <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                            <ShoppingBag className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-black text-foreground tabular-nums tracking-wider uppercase">
                                                                                #{order.orderNo || order.orderNumber}
                                                                            </span>
                                                                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                                {order.type === 'INITIAL' ? 'Stok Devir' : 'Alım'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-[11px] font-medium text-muted-foreground tabular-nums">
                                                                    {format(new Date(order.createdAt), "HH:mm", { locale: tr })}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs font-black text-foreground tabular-nums">
                                                                    {order.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)} Adet
                                                                </td>
                                                                <td className="px-4 py-3 font-mono font-bold text-foreground tabular-nums">
                                                                    ₺{Number(order.totalAmount || 0).toLocaleString("tr-TR")}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono font-bold tabular-nums">
                                                                    <span className={cn(
                                                                        Number(order.remainingAmount) > 0 ? "text-rose-400" : "text-emerald-400"
                                                                    )}>
                                                                        ₺{Number(order.remainingAmount || 0).toLocaleString("tr-TR")}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Badge className={cn(
                                                                        "text-[9px] font-black uppercase tracking-wider border-none px-2 rounded-lg",
                                                                        order.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" :
                                                                            order.status === "DELIVERED" ? "bg-blue-500/10 text-blue-500" :
                                                                                order.status === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                                                                                    "bg-rose-500/10 text-rose-500"
                                                                    )}>
                                                                        {order.status === "COMPLETED" ? "Tamamlandı" :
                                                                            order.status === "DELIVERED" ? "Teslim Alındı" :
                                                                                order.status === "PENDING" ? "Bekliyor" : "Yolda"}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                                                                        <Button
                                                                            onClick={() => handleDetail(order)}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 rounded-lg text-[10px] uppercase font-bold tracking-wider px-2 hover:bg-white/5"
                                                                        >
                                                                            Detay
                                                                        </Button>
                                                                        {(order.status === "PENDING" || order.status === "ON_WAY") && (
                                                                            <Button
                                                                                onClick={() => {
                                                                                    setSelectedOrder(order);
                                                                                    setIsMalKabulOpen(true);
                                                                                }}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7 rounded-lg text-[10px] uppercase font-bold tracking-wider text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 px-2"
                                                                            >
                                                                                Teslim Al
                                                                            </Button>
                                                                        )}
                                                                        {(order.status === "PENDING" || order.status === "ORDERED" || order.status === "ON_WAY") && (
                                                                            <Button
                                                                                onClick={() => setCancelConfirmOrder(order)}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7 rounded-lg text-[10px] uppercase font-bold tracking-wider text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 px-2"
                                                                            >
                                                                                İptal
                                                                            </Button>
                                                                        )}
                                                                        {Number(order.remainingAmount) > 0 && (
                                                                            <Button
                                                                                onClick={() => {
                                                                                    setInitialPaymentOrderId(order.id);
                                                                                    setIsPaymentOpen(true);
                                                                                }}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7 rounded-lg text-[10px] uppercase font-bold tracking-wider text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 px-2"
                                                                            >
                                                                                Ödeme
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </div>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Tab 2: İadeler */}
                        <TabsContent value="returns" className="m-0 focus-visible:outline-none">
                            <Card className="bg-card border-border/50 overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-white/[0.01] flex items-center justify-between">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-foreground">
                                        Tedarikçiye Gönderilen İadeler
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-primary border-primary/30">
                                        {(supplier.returns || []).length} İşlem
                                    </Badge>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-white/[0.01] text-[10px] text-muted-foreground uppercase tracking-wider font-black">
                                                {["Bilet No", "Tarih", "Ürün", "Müşteri", "Maliyet", "Durum", "Aksiyon"].map((h) => (
                                                    <th key={h} className="px-4 py-3">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs">
                                            {(!supplier.returns || supplier.returns.length === 0) ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-12 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                        Henüz bu tedarikçiye gönderilen iade bulunmuyor.
                                                    </td>
                                                </tr>
                                            ) : (
                                                supplier.returns.map((retTicket: any) => (
                                                    <tr key={retTicket.id} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="px-4 py-3 text-[11px] font-black text-foreground tabular-nums tracking-wider">
                                                            #{retTicket.ticketNumber}
                                                        </td>
                                                        <td className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                                                            {format(new Date(retTicket.createdAt), "dd MMM yyyy", { locale: tr })}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                                                                    {retTicket.product?.name ||
                                                                        (retTicket.serviceTicket ? `${retTicket.serviceTicket.deviceBrand} ${retTicket.serviceTicket.deviceModel}` : "Ürün Belirtilmemiş")}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground font-mono tracking-wider">
                                                                    {retTicket.product?.sku || "SKU-YOK"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-bold text-foreground uppercase">
                                                            {retTicket.customer?.name || "Cari Kart Yok"}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono font-bold text-foreground tabular-nums">
                                                            ₺{((retTicket.product?.buyPrice || 0) * retTicket.quantity).toLocaleString("tr-TR")}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase tracking-wider border-none px-2 rounded-lg",
                                                                retTicket.returnStatus === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                                                                    retTicket.returnStatus === "SENT_TO_SUPPLIER" ? "bg-blue-500/10 text-blue-500" :
                                                                        "bg-emerald-500/10 text-emerald-500"
                                                                )}>
                                                                {retTicket.returnStatus === "PENDING" ? "BEKLEMEDE" :
                                                                    retTicket.returnStatus === "SENT_TO_SUPPLIER" ? "TEDARİKÇİDE" : "SONUÇLANDI"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {retTicket.returnStatus === "PENDING" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedReturnForCourier(retTicket);
                                                                        setIsCourierModalOpen(true);
                                                                    }}
                                                                    className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 px-2"
                                                                >
                                                                    <Truck className="w-3 h-3 mr-1" />
                                                                    Kuryeye Ver
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Tab 3: Ürünler (Canlı Arama, Kategori Filtresi & Sayfalama) */}
                        <TabsContent value="prods" className="m-0 focus-visible:outline-none">
                            <Card className="bg-card border-border/50 overflow-hidden">
                                {/* Header with Live Search & Category Filter */}
                                <div className="p-4 border-b border-border/50 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="font-black text-xs uppercase tracking-wider text-foreground">
                                            Alınan Ürünler Listesi
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-primary border-primary/30">
                                            {aggregatedProducts.length} Çeşit
                                        </Badge>
                                    </div>

                                    {/* Live Search & Filter Controls */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="relative min-w-[180px] sm:min-w-[220px]">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Ürün adı veya SKU ara..."
                                                value={productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value);
                                                    setProductPage(1);
                                                }}
                                                className="h-8 pl-8 pr-7 text-xs rounded-xl bg-background/50 border-border/50"
                                            />
                                            {productSearch && (
                                                <button
                                                    onClick={() => {
                                                        setProductSearch("");
                                                        setProductPage(1);
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        {productCategories.length > 0 && (
                                            <select
                                                value={productCategory}
                                                onChange={(e) => {
                                                    setProductCategory(e.target.value);
                                                    setProductPage(1);
                                                }}
                                                className="h-8 px-2.5 text-xs rounded-xl bg-card border border-border/50 text-foreground font-semibold focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="ALL">Tüm Kategoriler ({productCategories.length})</option>
                                                {productCategories.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-white/[0.01] text-[10px] text-muted-foreground uppercase tracking-wider font-black">
                                                <th className="px-4 py-3">Ürün Tanımı & Kategori</th>
                                                <th className="px-4 py-3">Son Alış Tarihi</th>
                                                <th className="px-4 py-3">Toplam Miktar</th>
                                                <th className="px-4 py-3">Son Alış Fiyatı</th>
                                                <th className="px-4 py-3">Ortalama Alış</th>
                                                <th className="px-4 py-3 text-right">Toplam Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs">
                                            {paginatedProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                                            <Package className="w-7 h-7 text-muted-foreground/30" />
                                                            <span className="font-semibold text-xs">
                                                                {productSearch || productCategory !== "ALL"
                                                                    ? "Aramanıza uygun ürün bulunamadı."
                                                                    : "Henüz bir ürün alımı gerçekleşmemiş."}
                                                            </span>
                                                            {(productSearch || productCategory !== "ALL") && (
                                                                <button
                                                                    onClick={() => {
                                                                        setProductSearch("");
                                                                        setProductCategory("ALL");
                                                                    }}
                                                                    className="text-[11px] text-primary hover:underline font-bold mt-1"
                                                                >
                                                                    Filtreleri Temizle
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedProducts.map((prod) => {
                                                    const avgBuy = prod.quantity > 0 ? Math.round(prod.totalAmount / prod.quantity) : 0;
                                                    return (
                                                        <tr key={prod.id} className="hover:bg-white/[0.01] transition-colors group">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                        <Package className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-foreground uppercase tracking-tight">
                                                                            {prod.name}
                                                                        </span>
                                                                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
                                                                            <span>{prod.sku}</span>
                                                                            <span>•</span>
                                                                            <span className="text-primary/80 font-bold uppercase">{prod.category}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-[11px] font-medium text-muted-foreground tabular-nums">
                                                                {prod.lastOrderDate ? format(new Date(prod.lastOrderDate), "dd.MM.yyyy", { locale: tr }) : "—"}
                                                                <span className="block text-[9px] opacity-70">#{prod.lastOrderNo}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-black tabular-nums text-foreground">
                                                                {prod.quantity} Adet
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className="text-xs font-bold text-foreground font-mono tabular-nums">
                                                                        ₺{Math.round(prod.latestBuyPrice).toLocaleString("tr-TR")}
                                                                    </span>
                                                                    {prod.latestBuyPriceUsd && (
                                                                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                                                                            (${Number(prod.latestBuyPriceUsd).toFixed(2)})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Badge variant="outline" className="text-[10px] font-mono font-bold tabular-nums bg-white/5 border border-border/50 rounded-md px-1.5 py-0.5">
                                                                    ₺{avgBuy.toLocaleString("tr-TR")}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums">
                                                                ₺{Math.round(prod.totalAmount).toLocaleString("tr-TR")}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {filteredProducts.length > 0 && (
                                    <div className="p-3 px-4 border-t border-border/40 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span>
                                                Toplam <strong className="text-foreground">{filteredProducts.length}</strong> üründen{" "}
                                                <strong className="text-foreground">
                                                    {(productPage - 1) * productPageSize + 1}-{Math.min(productPage * productPageSize, filteredProducts.length)}
                                                </strong>{" "}
                                                arası gösteriliyor
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Sayfa boyutu seçici */}
                                            <div className="flex items-center gap-1 mr-2 text-[11px]">
                                                <span>Sayfa boyutu:</span>
                                                <select
                                                    value={productPageSize}
                                                    onChange={(e) => {
                                                        setProductPageSize(Number(e.target.value));
                                                        setProductPage(1);
                                                    }}
                                                    className="h-7 px-1.5 text-xs rounded-lg bg-card border border-border/50 text-foreground font-bold focus:outline-none"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>

                                            {/* Önceki - Sonraki */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={productPage <= 1}
                                                onClick={() => setProductPage(p => Math.max(1, p - 1))}
                                                className="h-7 w-7 p-0 rounded-lg"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            </Button>

                                            <span className="text-xs font-bold text-foreground px-1">
                                                Sayfa {productPage} / {totalProductPages}
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={productPage >= totalProductPages}
                                                onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
                                                className="h-7 w-7 p-0 rounded-lg"
                                            >
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Modals */}
            <EditSupplierModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                supplier={supplier}
            />

            <MalKabulModal
                isOpen={isMalKabulOpen}
                onClose={() => setIsMalKabulOpen(false)}
                order={selectedOrder}
            />

            <SupplierPaymentModal
                isOpen={isPaymentOpen}
                onClose={() => {
                    setInitialPaymentOrderId(undefined);
                    setInitialPaymentAmount(undefined);
                    setIsPaymentOpen(false);
                }}
                supplierId={supplier.id}
                supplierName={supplier.name}
                supplierBalance={Number(supplier.balance || 0)}
                initialAmount={initialPaymentAmount}
                initialOrderId={initialPaymentOrderId}
                onSuccess={(updated) => {
                    if (updated) setSupplier(updated);
                }}
            />

            <PurchaseOrderDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                order={selectedOrder}
            />

            <TedarikciCariEkstreModal
                isOpen={isEkstreOpen}
                onClose={() => setIsEkstreOpen(false)}
                supplier={supplier}
                usdRate={usdRate}
            />

            <SupplierPaymentHistoryModal
                isOpen={isPaymentHistoryOpen}
                onClose={() => setIsPaymentHistoryOpen(false)}
                supplier={supplier}
                usdRate={usdRate}
            />

            <PurchaseForm
                isOpen={isPurchaseFormOpen}
                onClose={() => setIsPurchaseFormOpen(false)}
                suppliers={[supplier]}
                defaultSupplierId={supplier.id}
                shop={shop}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Tedarikçiyi Sil?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground uppercase tracking-wider leading-relaxed">
                            {supplier.name} tedarikçisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm geçmiş veriler etkilenebilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-2xl border-border/50 font-black uppercase text-[10px] tracking-wider h-11">
                            Vazgeç
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-wider h-11"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Courier Selection Modal */}
            <Dialog open={isCourierModalOpen} onOpenChange={setIsCourierModalOpen}>
                <DialogContent className="rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Truck className="w-5 h-5 text-purple-500" />
                            Kurye Seçin
                        </DialogTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-70">
                            İadeyi hangi kuryeye atamak istiyorsunuz?
                        </p>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        {couriers.length === 0 ? (
                            <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-border">
                                <p className="text-xs font-black text-muted-foreground uppercase opacity-50">
                                    Sistemde aktif kurye bulunamadı
                                </p>
                            </div>
                        ) : (
                            couriers.map((courier: any) => (
                                <Button
                                    key={courier.id}
                                    variant="outline"
                                    onClick={() => handleAssignToCourier(courier.id)}
                                    disabled={isAssigning}
                                    className="h-14 justify-start gap-4 rounded-2xl border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-black text-xs">
                                        {courier.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight">{courier.name}</span>
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider opacity-60">Aktif Kurye</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-purple-500 transition-colors" />
                                </Button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* IBAN Quick View Modal */}
            <Dialog open={isIbanOpen} onOpenChange={setIsIbanOpen}>
                <DialogContent className="rounded-3xl border-border/50 bg-card/95 backdrop-blur-3xl max-w-lg p-0 overflow-hidden border-2 border-primary/20">
                    <div className="p-8 flex flex-col items-center text-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-2xl shadow-primary/20">
                            <Landmark className="w-8 h-8" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Banka Adı</h2>
                            <p className="text-2xl font-black text-foreground uppercase tracking-tight">{supplier.bankName || "BELİRTİLMEMİŞ"}</p>
                        </div>

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                        <div className="space-y-4 w-full px-4">
                            <div className="space-y-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Hesap Sahibi</h2>
                                <p className="text-xl font-black text-foreground uppercase tracking-tight">{supplier.name}</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">IBAN Numarası</h2>
                                <p
                                    className="text-2xl font-mono font-black text-primary tracking-tighter cursor-pointer break-all"
                                    onClick={() => {
                                        navigator.clipboard.writeText(supplier.iban || "");
                                        toast.success("IBAN Kopyalandı");
                                    }}
                                >
                                    {supplier.iban?.match(/.{1,4}/g)?.join(' ')}
                                </p>
                                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-wider italic">Tıkla ve Kopyala</p>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-wider text-[11px] shadow-xl shadow-primary/20"
                            onClick={() => setIsIbanOpen(false)}
                        >
                            Kapat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!cancelConfirmOrder} onOpenChange={(open) => !open && setCancelConfirmOrder(null)}>
                <AlertDialogContent className="bg-card border-border sm:rounded-3xl shadow-2xl">
                    <AlertDialogHeader>
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                            <XCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">Siparişi İptal Et</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed font-medium uppercase tracking-wider">
                            <strong className="text-foreground">#{cancelConfirmOrder?.orderNo || cancelConfirmOrder?.orderNumber}</strong> nolu sipariş iptal edilecektir.
                            <br /><br />
                            Siparişteki ürünler otomatik olarak <strong className="text-blue-400">Akıllı Stok Yenileme</strong> listesine (Eksik Ürünler) geri dönecektir.
                            <br /><br />
                            Devam etmek istiyor musunuz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="h-11 rounded-xl border-border bg-accent/5 hover:bg-accent/10 text-xs font-bold transition-all uppercase tracking-wider">
                            VAZGEÇ
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async (e) => {
                                e.preventDefault();
                                if (!cancelConfirmOrder || isCancelling) return;

                                setIsCancelling(true);
                                try {
                                    const res = await cancelPurchaseOrder(cancelConfirmOrder.id);
                                    if (res.success) {
                                        toast.success("Sipariş iptal edildi ve ürünler eksik listesine geri döndü.");
                                        setCancelConfirmOrder(null);
                                        refetchSupplier();
                                    } else {
                                        toast.error(res.error || "Sipariş iptal edilemedi.");
                                    }
                                } catch (error) {
                                    toast.error("Bir hata oluştu.");
                                } finally {
                                    setIsCancelling(false);
                                }
                            }}
                            className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border-none text-xs font-bold shadow-lg shadow-rose-600/20 transition-all px-6 uppercase tracking-wider"
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                            )}
                            SİPARİŞİ İPTAL ET
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
