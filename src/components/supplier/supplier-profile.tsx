"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
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
    XCircle
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
import { deleteSupplier, cancelPurchaseOrder } from "@/lib/actions/supplier-actions";
import { toast } from "sonner";
import { PurchaseForm } from "./purchase-form";
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
    const [supplier, setSupplier] = useState(initialSupplier);
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingOrdersToDelete, setPendingOrdersToDelete] = useState<any[]>([]);
    const [isPendingOrdersModalOpen, setIsPendingOrdersModalOpen] = useState(false);
    const [isGroupedByDay, setIsGroupedByDay] = useState(true);
    const [cancelConfirmOrder, setCancelConfirmOrder] = useState<any>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Recovery & UI states
    const [selectedReturnForCourier, setSelectedReturnForCourier] = useState<any>(null);
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        setSupplier(initialSupplier);
    }, [initialSupplier]);

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

    const stats = [
        { id: "history", label: "Toplam Alışveriş", value: `₺${Math.round(Number(supplier.totalShopping || 0)).toLocaleString("tr-TR")}`, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
        { id: "cari", label: "Güncel Borç", value: `₺${Math.round(Number(supplier.balance || 0)).toLocaleString("tr-TR")}`, icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10" },
        { id: "payment", label: "Toplam Ödenen", value: `₺${Math.round(Number(supplier.totalShopping || 0) - Number(supplier.balance || 0)).toLocaleString("tr-TR")}`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "orders", label: "Aktif Siparişler", value: `${supplier.purchases?.filter((p: any) => p.status !== "COMPLETED").length || 0} Adet`, icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    const products = useMemo(() => {
        const prodMap = new Map<string, any>();
        supplier.purchases?.forEach((p: any) => {
            p.items?.forEach((item: any) => {
                if (item.productId) {
                    const existing = prodMap.get(item.productId);
                    if (existing) {
                        existing.quantity += item.quantity;
                        existing.totalAmount += Number(item.totalAmount);
                    } else {
                        prodMap.set(item.productId, {
                            id: item.productId,
                            name: item.product?.name,
                            quantity: item.quantity,
                            totalAmount: Number(item.totalAmount),
                        });
                    }
                }
            });
        });
        return Array.from(prodMap.values());
    }, [supplier.purchases]);

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
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onBack}
                        variant="outline"
                        size="icon"
                        className="rounded-xl border border-border/40 hover:border-border/100 hover:bg-card transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
                                {supplier.name}
                            </h1>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 rounded-xl text-[10px] uppercase font-black tracking-widest animate-pulse">
                                Aktif Partner
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-70">
                            {supplier.category && <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {supplier.category}</span>}
                            {supplier.contactName && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {supplier.contactName}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl border-border/50 hover:border-primary/50 text-xs font-bold uppercase transition-all bg-card/30"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <Edit3 className="w-4 h-4 mr-2 text-primary" />
                        Düzenle
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-xl border-border/50 hover:border-rose-500/50 text-xs font-bold uppercase text-rose-500 transition-all bg-card/30"
                        onClick={() => setIsDeleteAlertOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                    </Button>
                    <Button
                        className="rounded-xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => setIsPurchaseFormOpen(true)}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Yeni Sipariş
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.id} className="bg-card/50 border-border/40 overflow-hidden relative group hover:border-border transition-all">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 ${stat.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-all`} />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                {stat.trend && (
                                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5 px-2 rounded-xl font-black">
                                        {stat.trend}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</span>
                                <span className="text-xl font-black text-foreground tabular-nums tracking-tight">{stat.value}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Column - Contact & Details */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="p-6 border-b border-border/50 bg-white/[0.01]">
                            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">İletişim & Bilgiler</h3>
                        </div>
                        <CardContent className="p-6 flex flex-col gap-5">
                            <div className="group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Telefon</span>
                                        <span className="text-sm font-bold text-foreground">{supplier.phone || "—"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">E-Posta</span>
                                        <span className="text-sm font-bold text-foreground">{supplier.email || "—"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Adres</span>
                                        <p className="text-sm font-bold text-foreground line-clamp-2">{supplier.address || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="p-6 border-b border-border/50 bg-white/[0.01] flex items-center justify-between">
                            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Banka Hesapları</h3>
                        </div>
                        <CardContent className="p-6 flex flex-col gap-4">
                            {supplier.iban ? (
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-border/30 hover:border-border transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{supplier.bankName || "Banka Belirtilmemiş"}</span>
                                        <div className="flex items-center gap-2">
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
                                    <p className="text-xs font-mono font-bold text-foreground tracking-tight break-all cursor-copy hover:text-blue-500 transition-colors">
                                        {supplier.iban}
                                    </p>
                                    <span className="text-[9px] text-muted-foreground mt-2 block font-medium uppercase tracking-widest">
                                        {supplier.name}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Landmark className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Banka bilgisi eklenmemiş</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Transactions & Activity */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-card border border-border/50 p-1.5 rounded-2xl h-14">
                                <TabsTrigger value="orders" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest h-full transition-all">
                                    <History className="w-4 h-4 mr-2" />
                                    İşlemler
                                </TabsTrigger>
                                <TabsTrigger value="returns" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest h-full transition-all">
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    İadeler
                                </TabsTrigger>
                                <TabsTrigger value="prods" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest h-full transition-all">
                                    <Package className="w-4 h-4 mr-2" />
                                    Ürünler
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPaymentHistoryOpen(true)}
                                    className="rounded-xl border-border/50 text-[10px] font-black uppercase tracking-widest h-10 px-4"
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Ödeme Geçmişi
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEkstreOpen(true)}
                                    className="rounded-xl border-border/50 text-[10px] font-black uppercase tracking-widest h-10 px-4"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Cari Ekstre
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                            <Card className="bg-card border-border/50 overflow-hidden">
                                <div className="p-6 border-b border-border/50 bg-white/[0.01] flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Sipariş & Alım Hareketleri</h3>
                                        <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-primary border-primary/20">
                                            {supplier.purchases?.length || 0} Toplam Kayıt
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-border/40">
                                        <Button
                                            variant={isGroupedByDay ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setIsGroupedByDay(true)}
                                            className="text-[9px] h-7 px-3 rounded-lg font-black uppercase tracking-tight"
                                        >
                                            Günlük
                                        </Button>
                                        <Button
                                            variant={!isGroupedByDay ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setIsGroupedByDay(false)}
                                            className="text-[9px] h-7 px-3 rounded-lg font-black uppercase tracking-tight"
                                        >
                                            Tek Liste
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/50 text-left bg-white/[0.01]">
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">Sipariş No</th>
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">Tarih</th>
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">Miktar</th>
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">Toplam</th>
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">Kalan</th>
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">Durum</th>
                                                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {Object.entries(groupedOrders).map(([date, orders]: [string, any]) => (
                                                <div key={date} className="contents underline-none">
                                                    {isGroupedByDay && (
                                                        <tr className="bg-white/[0.02]">
                                                            <td colSpan={7} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 border-l-2 border-primary">
                                                                {date}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {orders.map((order: any) => (
                                                        <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group border-b border-border/30 last:border-0">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                        <ShoppingBag className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-foreground tabular-nums tracking-wider uppercase">#{order.orderNumber}</span>
                                                                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">{order.type === 'INITIAL' ? 'Stok Devir' : 'Alım'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                                {format(new Date(order.createdAt), "HH:mm", { locale: tr })}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-black text-foreground tabular-nums">
                                                                    {order.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)} Adet
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-black text-foreground tabular-nums border-b-2 border-emerald-500/20 pb-0.5">
                                                                    ₺{Number(order.totalAmount || 0).toLocaleString("tr-TR")}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={cn(
                                                                    "text-xs font-black tabular-nums border-b-2 pb-0.5",
                                                                    Number(order.remainingAmount) > 0 ? "text-rose-500 border-rose-500/20" : "text-emerald-500 border-emerald-500/20"
                                                                )}>
                                                                    ₺{Number(order.remainingAmount || 0).toLocaleString("tr-TR")}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge className={cn(
                                                                    "text-[9px] font-black uppercase tracking-widest border-none px-2 rounded-xl",
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
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2 shrink-0">
                                                                    <Button
                                                                        onClick={() => handleDetail(order)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 rounded-lg text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                                                            className="h-8 rounded-lg text-[10px] uppercase font-black tracking-widest text-blue-500 hover:bg-blue-500/10 border border-blue-500/20 shadow-sm"
                                                                        >
                                                                            Teslim Al
                                                                        </Button>
                                                                    )}
                                                                    {(order.status === "PENDING" || order.status === "ORDERED" || order.status === "ON_WAY") && (
                                                                        <Button
                                                                            onClick={() => {
                                                                                setCancelConfirmOrder(order);
                                                                            }}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 rounded-lg text-[10px] uppercase font-black tracking-widest text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 shadow-sm"
                                                                        >
                                                                            İptal Et
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
                                                                            className="h-8 rounded-lg text-[10px] uppercase font-black tracking-widest text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20"
                                                                        >
                                                                            Ödeme
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </div>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="returns" className="m-0 focus-visible:outline-none">
                            <Card className="bg-card border-border/50 overflow-hidden">
                                <div className="p-6 border-b border-border/50 bg-white/[0.01] flex items-center justify-between">
                                    <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Tedarikçiye Gönderilen İadeler</h3>
                                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-primary border-primary/20">
                                        {(supplier.returns || []).length} İşlem
                                    </Badge>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/50 text-left bg-white/[0.01]">
                                                {["Bilet No", "Tarih", "Ürün", "Müşteri", "Maliyet", "Durum", "Aksiyon"].map((h) => (
                                                    <th key={h} className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {(!supplier.returns || supplier.returns.length === 0) ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                                        Henüz bu tedarikçiye gönderilen iade bulunmuyor.
                                                    </td>
                                                </tr>
                                            ) : (
                                                supplier.returns.map((retTicket: any) => (
                                                    <tr key={retTicket.id} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="px-6 py-4 text-[11px] font-black text-foreground tabular-nums tracking-widest">
                                                            #{retTicket.ticketNumber}
                                                        </td>
                                                        <td className="px-6 py-4 text-[10px] font-black text-muted-foreground/70 uppercase">
                                                            {format(new Date(retTicket.createdAt), "dd MMM yyyy", { locale: tr })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                                                    {retTicket.product?.name ||
                                                                        (retTicket.serviceTicket ? `${retTicket.serviceTicket.deviceBrand} ${retTicket.serviceTicket.deviceModel}` : "Ürün Belirtilmemiş")}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground font-black font-mono tracking-widest">{retTicket.product?.sku || "SKU-YOK"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-[11px] font-black text-foreground uppercase">
                                                            {retTicket.customer?.name || "Cari Kart Yok"}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-foreground tabular-nums">
                                                                    ₺{((retTicket.product?.buyPrice || 0) * retTicket.quantity).toLocaleString("tr-TR")}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground font-black uppercase">Fiyatı: ₺{(retTicket.product?.buyPrice || 0).toLocaleString("tr-TR")} x {retTicket.quantity}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest border-none px-2 rounded-xl",
                                                                retTicket.returnStatus === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                                                                    retTicket.returnStatus === "SENT_TO_SUPPLIER" ? "bg-blue-500/10 text-blue-500" :
                                                                        "bg-emerald-500/10 text-emerald-500"
                                                            )}>
                                                                {retTicket.returnStatus === "PENDING" ? "BEKLEMEDE" :
                                                                    retTicket.returnStatus === "SENT_TO_SUPPLIER" ? "TEDARİKÇİDE" : "SONUÇLANDI"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {retTicket.returnStatus === "PENDING" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedReturnForCourier(retTicket);
                                                                        setIsCourierModalOpen(true);
                                                                    }}
                                                                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-purple-500 border border-purple-500/20 hover:bg-purple-500/10"
                                                                >
                                                                    <Truck className="w-3 h-3 mr-2" />
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

                        <TabsContent value="prods" className="m-0 focus-visible:outline-none">
                            <Card className="bg-card border-border/50 overflow-hidden">
                                <div className="p-6 border-b border-border/50 bg-white/[0.01] flex items-center justify-between">
                                    <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Alınan Ürün Özetleri</h3>
                                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-primary border-primary/20">
                                        {products.length} Çeşit Ürün
                                    </Badge>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/50 text-left bg-white/[0.01]">
                                                {["Ürün Adı", "Toplam Miktar", "Toplam Tutar", "Ortalama Fiyat"].map((h) => (
                                                    <th key={h} className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {products.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest opacity-50">
                                                        Henüz bir ürün alımı gerçekleşmemiş.
                                                    </td>
                                                </tr>
                                            ) : (
                                                products.map((prod) => (
                                                    <tr key={prod.id} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                    <Package className="w-3.5 h-3.5" />
                                                                </div>
                                                                <span className="text-xs font-black text-foreground uppercase tracking-tight">{prod.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-black tabular-nums text-foreground">
                                                            {prod.quantity} Adet
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-black tabular-nums text-foreground">
                                                            ₺{prod.totalAmount.toLocaleString("tr-TR")}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="text-[10px] font-black tabular-nums bg-white/5 border border-border/50 rounded-lg px-2">
                                                                ₺{Math.round(prod.totalAmount / prod.quantity).toLocaleString("tr-TR")}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
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
                    setIsPaymentOpen(false);
                }}
                supplierId={supplier.id}
                supplierName={supplier.name}
                initialOrderId={initialPaymentOrderId}
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
            />

            <SupplierPaymentHistoryModal
                isOpen={isPaymentHistoryOpen}
                onClose={() => setIsPaymentHistoryOpen(false)}
                supplier={supplier}
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
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">
                            {supplier.name} tedarikçisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm geçmiş veriler etkilenebilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-2xl border-border/50 font-black uppercase text-[10px] tracking-widest h-12">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest h-12"
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">
                            İadeyi hangi kuryeye atamak istiyorsunuz?
                        </p>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        {couriers.length === 0 ? (
                            <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-border">
                                <p className="text-xs font-black text-muted-foreground uppercase opacity-50">Sistemde aktif kurye bulunamadı</p>
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
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Aktif Kurye</span>
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
                                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest italic">Tıkla ve Kopyala</p>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20"
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
                        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed font-medium uppercase tracking-widest">
                            <strong className="text-foreground">#{cancelConfirmOrder?.orderNumber}</strong> nolu sipariş iptal edilecektir.
                            <br /><br />
                            Siparişteki ürünler otomatik olarak <strong className="text-blue-400">Akıllı Stok Yenileme</strong> listesine (Eksik Ürünler) geri dönecektir.
                            <br /><br />
                            Devam etmek istiyor musunuz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="h-11 rounded-xl border-border bg-accent/5 hover:bg-accent/10 text-xs font-bold transition-all uppercase tracking-widest">VAZGEÇ</AlertDialogCancel>
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
                                        // Refresh current view if possible, otherwise reload
                                        window.location.reload();
                                    } else {
                                        toast.error(res.error || "Sipariş iptal edilemedi.");
                                    }
                                } catch (error) {
                                    toast.error("Bir hata oluştu.");
                                } finally {
                                    setIsCancelling(false);
                                }
                            }}
                            className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border-none text-xs font-bold shadow-lg shadow-rose-600/20 transition-all px-6 uppercase tracking-widest"
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
