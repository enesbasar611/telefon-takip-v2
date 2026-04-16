"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    ArrowLeft,
    Truck,
    PackageCheck,
    Landmark,
    Loader2,
    Printer
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MalKabulModal } from "./mal-kabul-modal";
import { SupplierPaymentModal } from "./supplier-payment-modal";
import { PurchaseOrderDetailModal } from "./purchase-order-detail-modal";
import { TedarikciCariEkstreModal } from "./tedarikci-cari-ekstre-modal";
import { EditSupplierModal } from "./edit-supplier-modal";
import { deleteSupplier } from "@/lib/actions/supplier-actions";
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
import { Trash2 } from "lucide-react";

interface SupplierProfileProps {
    supplier: any;
    onBack: () => void;
    suppliers: any[];
    shop?: any;
}

export function SupplierProfile({ supplier: initialSupplier, onBack, suppliers, shop }: SupplierProfileProps) {
    const [supplier, setSupplier] = useState(initialSupplier);
    const [activeTab, setActiveTab] = useState("orders");
    const [isMalKabulOpen, setIsMalKabulOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isIbanOpen, setIsIbanOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isEkstreOpen, setIsEkstreOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [initialPaymentOrderId, setInitialPaymentOrderId] = useState<string | undefined>(undefined);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingOrdersToDelete, setPendingOrdersToDelete] = useState<any[]>([]);
    const [isPendingOrdersModalOpen, setIsPendingOrdersModalOpen] = useState(false);

    // Keep state in sync if initialSupplier changes (though rare in this setup)
    useEffect(() => {
        setSupplier(initialSupplier);
    }, [initialSupplier]);

    const handleDetail = (order: any) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const stats = [
        { id: "history", label: "Toplam Alışveriş", value: `₺${Math.round(Number(supplier.totalShopping || 0)).toLocaleString("tr-TR")}`, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
        { id: "cari", label: "Güncel Borç", value: `₺${Math.round(Number(supplier.balance || 0)).toLocaleString("tr-TR")}`, icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10" },
        { id: "payment", label: "Toplam Ödenen", value: `₺${Math.round(Number(supplier.totalShopping || 0) - Number(supplier.balance || 0)).toLocaleString("tr-TR")}`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "orders", label: "Aktif Siparişler", value: `${supplier.purchases?.filter((p: any) => p.status !== "COMPLETED").length || 0} Adet`, icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    const handlePrintCari = () => {
        setIsEkstreOpen(true); // Open modal and trigger its print or we can do a dedicated print here
    };

    const handleMalKabul = (order: any) => {
        setSelectedOrder(order);
        setIsMalKabulOpen(true);
    };

    const handleDelete = async (force: boolean = false) => {
        setIsDeleting(true);
        const res = await deleteSupplier(supplier.id, force);
        if (res.success) {
            toast.success("Tedarikçi başarıyla silindi.");
            onBack();
        } else if (res.error === "PENDING_ORDERS") {
            setPendingOrdersToDelete(res.pendingOrders);
            setIsPendingOrdersModalOpen(true);
            setIsDeleteAlertOpen(false);
        } else {
            toast.error(res.error || "Tedarikçi silinirken bir hata oluştu.");
        }
        setIsDeleting(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back Button & Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs  text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Tedarikçi Listesine Dön
                </button>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card border border-border/50 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Truck className="h-32 w-32 rotate-12" />
                    </div>

                    <div className="flex items-start gap-6 relative z-10">
                        {/* Logo Placeholder */}
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center  text-2xl text-white shadow-xl shadow-blue-500/20 shrink-0">
                            {supplier.name[0]}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="font-medium text-2xl  text-foreground tracking-tight">{supplier.name}</h1>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]  uppercase tracking-wider py-0.5 px-2 rounded-lg">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Onaylı Tedarikçi
                                </Badge>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px]  text-emerald-500 uppercase tracking-widest">Aktif</span>
                            </div>

                            <p className="text-xs  text-muted-foreground">{supplier.category || "Yedek Parça & Aksesuar"} • {supplier.address?.split(',')[0] || "İstanbul, TR"}</p>

                            <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground pt-1">
                                <div className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer">
                                    <Phone className="h-3.5 w-3.5" />
                                    {supplier.phone || "Telefon Yok"}
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer">
                                    <Mail className="h-3.5 w-3.5" />
                                    {supplier.email || "E-posta Yok"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {supplier.address || "Adres Belirtilmemiş"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="hidden xl:flex flex-col items-end mr-6 pr-6 border-r border-border/50 space-y-3">
                            <div className="flex flex-col items-end">
                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest mb-1">Güven Skoru</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl  text-emerald-500">{supplier.trustScore || 98}/100</span>
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <PackageCheck className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Reliability Bars */}
                            <div className="w-48 space-y-2.5">
                                {[
                                    { label: "Güvenlik", value: Number(supplier.trustScore || 95) },
                                    { label: "Teslimat", value: Number(supplier.deliverySpeed || 80) },
                                    { label: "Kalite", value: Number(supplier.qualityScore || 90) }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between text-[8px]  uppercase tracking-tighter">
                                            <span className="text-muted-foreground/80">{item.label}</span>
                                            <span className={item.value >= 80 ? "text-emerald-500" : "text-amber-500"}>%{item.value}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000 rounded-full",
                                                    item.value >= 80 ? "bg-emerald-500" : "bg-amber-500"
                                                )}
                                                style={{ width: `${item.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(true)}
                            className="h-11 rounded-xl  text-xs gap-2 border-border/50 hover:bg-white/5"
                        >
                            <Edit3 className="h-4 w-4" />
                            Düzenle
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteAlertOpen(true)}
                            className="h-11 rounded-xl  text-xs gap-2 border-rose-500/10 hover:bg-rose-500/10 text-rose-500 bg-rose-500/5 px-4"
                        >
                            <Trash2 className="h-4 w-4" />
                            Sil
                        </Button>

                        {supplier.iban && (
                            <Button
                                variant="outline"
                                onClick={() => setIsIbanOpen(true)}
                                className="h-11 rounded-xl  text-xs gap-2 border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-400 bg-indigo-500/5 text-indigo-300"
                            >
                                <Landmark className="h-4 w-4" />
                                IBAN Göster
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => setIsPaymentOpen(true)}
                            className="h-11 rounded-xl  text-xs gap-2 border-border/50 hover:bg-white/5 px-4 bg-white/5"
                        >
                            <CreditCard className="h-4 w-4" />
                            Ödeme Yap
                        </Button>
                        <Button onClick={() => setIsPurchaseFormOpen(true)} className="h-11 rounded-xl  text-xs gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-6">
                            <PlusCircle className="h-4 w-4" />
                            Yeni Sipariş
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card
                        key={i}
                        className="bg-card border-border/50 overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer select-none ring-offset-background active:scale-[0.98]"
                        onClick={() => {
                            if (stat.id === "payment") setIsPaymentOpen(true);
                            else setActiveTab(stat.id);
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                {stat.trend && (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] ">
                                        {stat.trend}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs  text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-2xl  text-foreground tracking-tight">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-b border-border/50 w-full justify-start rounded-none h-auto p-0 gap-8">
                    {[
                        { id: "orders", label: "Sipariş Listeleri", icon: Truck },
                        { id: "history", label: "Satın Alma Geçmişi", icon: History },
                        { id: "cari", label: "Cari Hareketler", icon: Wallet },
                        { id: "notes", label: "Notlar & Belgeler", icon: FileText },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-foreground rounded-none px-0 py-4 text-xs  text-muted-foreground hover:text-foreground transition-all gap-2"
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="py-6">
                    <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                        <Card className="bg-card border-border/50 overflow-hidden">
                            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                                <h3 className="font-medium text-sm  text-foreground uppercase tracking-widest">Aktif ve Bekleyen Siparişler</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50 text-left bg-white/[0.01]">
                                            {["Sipariş No", "Tarih", "Toplam", "Ödeme", "Durum", "İşlem"].map((h) => (
                                                <th key={h} className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {supplier.purchases?.filter((p: any) => p.status !== "COMPLETED").length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                                                    Aktif sipariş bulunmuyor.
                                                </td>
                                            </tr>
                                        ) : (
                                            supplier.purchases?.filter((p: any) => p.status !== "COMPLETED").map((order: any) => (
                                                <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-6 py-4 text-sm  text-foreground group-hover:text-blue-400">#{order.orderNo}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{format(new Date(order.createdAt), "dd MMMM yyyy", { locale: tr })}</td>
                                                    <td className="px-6 py-4 text-sm  text-foreground">₺{Math.round(Number(order.totalAmount)).toLocaleString("tr-TR")}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={cn(
                                                            "text-[10px]  border-none px-2 rounded-xl",
                                                            order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                                                                order.paymentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                                                        )}>
                                                            {order.paymentStatus === "PAID" ? "ÖDENDİ" : order.paymentStatus === "PARTIAL" ? "KISMİ" : "BEKLİYOR"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={cn(
                                                            "text-[10px]  border-none px-2 rounded-xl",
                                                            order.status === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                                                                order.status === "ON_WAY" ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-muted-foreground"
                                                        )}>
                                                            {order.status === "PENDING" ? "Beklemede" : order.status === "ON_WAY" ? "Yolda" : order.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                onClick={() => {
                                                                    setInitialPaymentOrderId(order.id);
                                                                    setIsPaymentOpen(true);
                                                                }}
                                                                hidden={order.paymentStatus === "PAID"}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 rounded-lg text-[10px]  uppercase text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 border"
                                                            >
                                                                Ödeme Yap
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDetail(order)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 rounded-lg text-[10px]  uppercase text-muted-foreground hover:bg-white/5"
                                                            >
                                                                Detay
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="m-0">
                        <Card className="bg-card border-border/50 overflow-hidden">
                            <div className="p-6 border-b border-border/50">
                                <h3 className="font-medium text-sm  text-foreground uppercase tracking-widest">Tamamlanan Satın Almalar</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50 text-left bg-white/[0.01]">
                                            {["Sipariş No", "Tarih", "Toplam", "Ödeme", "Durum", "İşlem"].map((h) => (
                                                <th key={h} className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {supplier.purchases?.filter((p: any) => p.status === "COMPLETED").length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                                                    Henüz geçmiş işlem kaydı bulunmuyor.
                                                </td>
                                            </tr>
                                        ) : (
                                            supplier.purchases?.filter((p: any) => p.status === "COMPLETED").map((order: any) => (
                                                <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-6 py-4 text-sm  text-foreground group-hover:text-blue-400">#{order.orderNo}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{format(new Date(order.createdAt), "dd MMMM yyyy", { locale: tr })}</td>
                                                    <td className="px-6 py-4 text-sm  text-foreground">₺{Math.round(Number(order.totalAmount)).toLocaleString("tr-TR")}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={cn(
                                                            "text-[10px]  border-none px-2 rounded-xl",
                                                            order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                                                                order.paymentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                                                        )}>
                                                            {order.paymentStatus === "PAID" ? "ÖDENDİ" : order.paymentStatus === "PARTIAL" ? "KISMİ" : "BEKLİYOR"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className="text-[10px]  border-none px-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                                            Tamamlandı
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    setInitialPaymentOrderId(order.id);
                                                                    setIsPaymentOpen(true);
                                                                }}
                                                                disabled={order.paymentStatus === "PAID"}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 rounded-lg text-[10px]  uppercase text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 border"
                                                            >
                                                                {order.paymentStatus === "PAID" ? "Ödendi" : "Ödeme Yap"}
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDetail(order)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 rounded-lg text-[10px]  uppercase text-muted-foreground hover:bg-white/5"
                                                            >
                                                                Detay
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cari" className="m-0">
                        <Card className="bg-card border-border/50 overflow-hidden">
                            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-medium text-sm  text-foreground uppercase tracking-widest">Cari Hesap Ekstresi (Banka Tipi)</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground">Tüm alım ve ödeme hareketlerinin kümülatif bakiye dökümü.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl text-[10px]  uppercase gap-2 border-border hover:bg-white/5 bg-white/5"
                                    onClick={() => setIsEkstreOpen(true)}
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    Yazdır / Ekstre Al
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50 text-left bg-white/[0.01]">
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">Tarih</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">İşlem Tipi</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">Açıklama</th>
                                            <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest text-right">Eski Bakiye</th>
                                            <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest text-right">Tutar</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest text-right">Yeni Bakiye</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(!supplier.transactions || supplier.transactions.length === 0) ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-sm font-medium text-muted-foreground">
                                                    Henüz bir cari hareket bulunmuyor.
                                                </td>
                                            </tr>
                                        ) : (() => {
                                            let cumulativeBalance = 0;
                                            const sorted = [...(supplier.transactions || [])].sort((a, b) =>
                                                new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
                                            );

                                            return sorted.map((t: any) => {
                                                const prevBalance = cumulativeBalance;
                                                const amount = Number(t.amount);
                                                if (t.type === "INCOME") cumulativeBalance += amount;
                                                else cumulativeBalance -= amount;
                                                const currentBalance = cumulativeBalance;

                                                return (
                                                    <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                                                            {format(new Date(t.date || t.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge className={cn(
                                                                "text-[10px]  border-none px-2 rounded-xl",
                                                                t.type === "INCOME" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                                            )}>
                                                                {t.type === "INCOME" ? "Borç Alım" : "Borç Ödeme"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm  text-foreground">
                                                            {t.description}
                                                        </td>
                                                        <td className="px-4 py-4 text-xs  text-muted-foreground/80 text-right">
                                                            ₺{Math.round(prevBalance).toLocaleString("tr-TR")}
                                                        </td>
                                                        <td className={cn(
                                                            "px-4 py-4 text-sm  text-right",
                                                            t.type === "INCOME" ? "text-rose-400" : "text-emerald-400"
                                                        )}>
                                                            {t.type === "INCOME" ? "+" : "-"} ₺{Math.round(amount).toLocaleString("tr-TR")}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm  text-foreground text-right bg-white/[0.01]">
                                                            ₺{Math.round(currentBalance).toLocaleString("tr-TR")}
                                                        </td>
                                                    </tr>
                                                );
                                            }).reverse();
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Mal Kabul Modal */}
            {selectedOrder && (
                <MalKabulModal
                    isOpen={isMalKabulOpen}
                    onClose={() => {
                        setIsMalKabulOpen(false);
                        setSelectedOrder(null);
                        // If it's a purchase order receive, we might want to refresh the whole profile
                        // For now we rely on revalidatePath, but if we want instant state:
                        // window.location.reload(); // Simple way
                    }}
                    order={selectedOrder}
                />
            )}

            <SupplierPaymentModal
                isOpen={isPaymentOpen}
                onClose={() => {
                    setIsPaymentOpen(false);
                    setInitialPaymentOrderId(undefined);
                }}
                supplierId={supplier.id}
                supplierName={supplier.name}
                initialOrderId={initialPaymentOrderId}
                unpaidOrders={supplier.purchases?.filter((p: any) => p.paymentStatus !== "PAID")}
                onSuccess={(updatedSupplier) => {
                    if (updatedSupplier) setSupplier(updatedSupplier);
                }}
            />

            <TedarikciCariEkstreModal
                isOpen={isEkstreOpen}
                onClose={() => setIsEkstreOpen(false)}
                supplier={supplier}
            />

            <Dialog open={isIbanOpen} onOpenChange={setIsIbanOpen}>
                <DialogContent className="max-w-md w-11/12 sm:w-full bg-[#0F172A] border-border p-8 flex flex-col items-center justify-center text-center rounded-3xl">
                    <DialogTitle className="font-medium sr-only">IBAN Bilgisi</DialogTitle>
                    <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 shadow-inner shadow-indigo-500/20 border border-indigo-500/20">
                        <Landmark className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h2 className="font-medium text-2xl  text-white mb-2">{supplier.name}</h2>
                    <p className="text-sm  text-indigo-400 mb-8">{supplier.bankName || "Banka Adı Girilmemiş"}</p>

                    <div className="bg-[#0B101B] border border-border rounded-2xl py-8 px-4 sm:px-8 w-full">
                        <p className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest mb-4">IBAN NUMARASI</p>
                        <p className="text-[17px] sm:text-2xl font-mono  text-white tracking-widest break-all">
                            {supplier.iban}
                        </p>
                    </div>

                    <Button onClick={() => setIsIbanOpen(false)} className="w-full mt-8 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white  transition-all">
                        Kapat
                    </Button>
                </DialogContent>
            </Dialog>
            {selectedOrder && isDetailOpen && (
                <PurchaseOrderDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    order={selectedOrder}
                />
            )}

            <EditSupplierModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                supplier={supplier}
            />

            <PurchaseForm
                isOpen={isPurchaseFormOpen}
                onClose={() => setIsPurchaseFormOpen(false)}
                suppliers={suppliers}
                shop={shop}
                defaultSupplierId={supplier.id}
                onSuccess={(newOrder) => {
                    setSupplier({
                        ...supplier,
                        purchases: [newOrder, ...(supplier.purchases || [])]
                    });
                }}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="bg-[#0F172A] border-border rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl  text-white">Tedarikçiyi Sil</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium">
                            <span className=" text-white">"{supplier.name}"</span> isimli tedarikçiyi silmek istediğinize emin misiniz?
                            Bu işlem geri alınamaz ve tedarikçiye ait tüm geçmiş veriler silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-white/5 border-border/50 text-white  rounded-xl hover:bg-white/10 hover:text-white">
                            Vazgeç
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete(false);
                            }}
                            disabled={isDeleting}
                            className="bg-rose-600 hover:bg-rose-500 text-white  rounded-xl shadow-lg shadow-rose-600/20"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Onayla ve Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isPendingOrdersModalOpen} onOpenChange={setIsPendingOrdersModalOpen}>
                <DialogContent className="max-w-xl bg-[#0F172A] border-border rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="font-medium text-2xl  text-white flex items-center gap-3">
                            <Clock className="text-amber-500 h-6 w-6" />
                            Bekleyen İşlemler Var!
                        </DialogTitle>
                        <p className="text-muted-foreground font-medium pt-2">
                            Bu tedarikçiye ait henüz tamamlanmamış <span className="text-white ">{pendingOrdersToDelete.length}</span> adet sipariş bulunuyor.
                            Tedarikçiyi silmek için bu siparişlerdeki ürünleri ne yapmak istersiniz?
                        </p>
                    </DialogHeader>

                    <div className="my-6 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {pendingOrdersToDelete.map((order) => (
                            <div key={order.id} className="bg-white/5 border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs  text-white">#{order.orderNo}</p>
                                    <p className="text-[10px]  text-muted-foreground/80">{format(new Date(order.createdAt), "dd MMMM yyyy", { locale: tr })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs  text-amber-500">₺{Number(order.totalAmount).toLocaleString("tr-TR")}</p>
                                    <p className="text-[10px]  text-muted-foreground/80">{order.items?.length || 0} Kalem Ürün</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => handleDelete(true)}
                            disabled={isDeleting}
                            className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white  rounded-xl shadow-lg shadow-amber-600/20 gap-2"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                            Tümünü Eksik Listesine Gönder ve Sil
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsPendingOrdersModalOpen(false)}
                            className="w-full h-12 text-muted-foreground hover:text-white  bg-white/5 rounded-xl transition-all"
                        >
                            Vazgeç
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}







