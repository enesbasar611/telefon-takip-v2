"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Truck,
    PackageSearch,
    CreditCard,
    TrendingUp,
    ChevronRight,
    ShoppingCart,
    CreditCard as PayIcon,
    UserPlus,
    Zap,
    Activity,
    AlertCircle,
    Brain,
    Sparkles,
    ArrowRight,
    ShoppingBasket,
} from "lucide-react";
import { CreateSupplierModal } from "@/components/supplier/create-supplier-modal";
import { SupplierAnalysisModal } from "@/components/supplier/supplier-analysis-modal";
import { SupplierOrderListsPanel } from "@/components/supplier/supplier-order-lists-panel";
import { MalKabulModal } from "@/components/supplier/mal-kabul-modal";
import { toast } from "sonner";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SupplierPaymentModal } from "./supplier-payment-modal";

interface TedarikcilerPageClientProps {
    suppliers: any[];
    purchaseOrders: any[];
    aiAlerts: any[];
    criticalProducts: any[];
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Beklemede", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    DELIVERED: { label: "Teslim Alındı", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    CANCELLED: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    ORDERED: { label: "Sipariş Verildi", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

import { SupplierProfile } from "./supplier-profile";
import { PurchaseForm } from "./purchase-form";
import { PurchaseOrderDetailModal } from "./purchase-order-detail-modal";

export function TedarikcilerPageClient({ suppliers, purchaseOrders: initialPurchaseOrders, aiAlerts, criticalProducts }: TedarikcilerPageClientProps) {
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
    const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
    const [isGlobalMalKabulOpen, setIsGlobalMalKabulOpen] = useState(false);
    const [isGlobalDetailOpen, setIsGlobalDetailOpen] = useState(false);
    const [isGlobalPaymentOpen, setIsGlobalPaymentOpen] = useState(false);
    const [globalSelectedOrder, setGlobalSelectedOrder] = useState<any>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const { totalItemCount } = useSupplierOrders();

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    // If a supplier is selected, show the profile view
    if (selectedSupplierId && selectedSupplier) {
        return (
            <SupplierProfile
                supplier={selectedSupplier}
                onBack={() => setSelectedSupplierId(null)}
            />
        );
    }

    const pendingOrders = purchaseOrders.filter((o: any) => o.status === "PENDING" || o.status === "ORDERED");
    const totalDebt = purchaseOrders
        .filter((o: any) => o.status === "PENDING" || o.status === "ORDERED")
        .reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
    const lastMonthPurchase = purchaseOrders.slice(0, 3).reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);

    const criticalAlerts = aiAlerts.filter((a: any) => a.type === "CRITICAL" || a.type === "LOW_STOCK");
    const hasCritical = criticalAlerts.length > 0 || criticalProducts.length > 0;
    const totalUrgent = criticalAlerts.length + criticalProducts.filter(
        (p: any) => !criticalAlerts.some((a: any) => a.productId === p.id)
    ).length;

    const deliveredCount = purchaseOrders.filter((o: any) => o.status === "COMPLETED" || o.status === "DELIVERED").length;
    const totalOrderCount = purchaseOrders.length;

    // 1. Sevk Süresi Hızı: Ortalama tedarikçi sevk hızı
    const avgDeliverySpeed = suppliers.length > 0
        ? Math.round(suppliers.reduce((sum, s) => sum + (s.deliverySpeed || 0), 0) / suppliers.length)
        : 0;
    const deliveryRate = avgDeliverySpeed;

    // 2. Tedarikçi Memnuniyeti: Ortalama güven skoru
    const avgTrustScore = suppliers.length > 0
        ? Math.round(suppliers.reduce((sum, s) => sum + (s.trustScore || 0), 0) / suppliers.length)
        : 0;
    const supplierSatisfaction = avgTrustScore;

    // 3. Ödeme Performansı (Gecikme Skoru): Gecikmemiş borçların oranı
    const unpaidOrders = purchaseOrders.filter((o: any) => o.paymentStatus !== "PAID");
    const overdueCount = unpaidOrders.filter((o: any) => {
        const diffDays = Math.floor((new Date().getTime() - new Date(o.createdAt).getTime()) / (1000 * 3600 * 24));
        return diffDays > 15;
    }).length;
    const paymentDelayScore = unpaidOrders.length > 0
        ? Math.round(((unpaidOrders.length - overdueCount) / unpaidOrders.length) * 100)
        : (suppliers.length > 0 ? 100 : 0);

    // Smart Alım Önerisi
    const topSupplier = [...suppliers].sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))[0];

    const recentActivity = purchaseOrders.slice(0, 3).map((o: any) => ({
        id: o.id,
        title: o.supplier?.name || "Bilinmeyen Tedarikçi",
        desc: `₺${Number(o.totalAmount || 0).toLocaleString("tr-TR")} sipariş`,
        time: o.createdAt,
        dot: o.status === "DELIVERED" ? "bg-emerald-500" : "bg-blue-500",
    }));

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Operasyonel Genel Bakış</p>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Tedarikçi &amp; Satın Alma</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                    {/* Supplier Order Lists Button with badge */}
                    <Button
                        variant="outline"
                        onClick={() => setIsOrderPanelOpen(true)}
                        className="relative h-10 px-4 rounded-xl font-bold text-xs gap-2 border-white/10 hover:bg-white/5"
                    >
                        <ShoppingBasket className="h-4 w-4" />
                        Sipariş Listeleri
                        {totalItemCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-blue-600 text-[9px] font-black text-white flex items-center justify-center border-2 border-background">
                                {totalItemCount}
                            </span>
                        )}
                    </Button>
                    <Button
                        onClick={() => setIsAnalysisOpen(true)}
                        className={cn(
                            "h-10 px-4 rounded-xl font-black text-xs gap-2 transition-all",
                            hasCritical
                                ? "bg-rose-600/10 border border-rose-500/30 text-rose-400 hover:bg-rose-600/20"
                                : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10"
                        )}
                    >
                        <Brain className="h-4 w-4" />
                        Tedarik Analizi
                        {totalUrgent > 0 && (
                            <Badge className="bg-rose-500/20 text-rose-400 border-none text-[9px] font-black px-1.5 py-0 ml-1">
                                {totalUrgent}
                            </Badge>
                        )}
                    </Button>
                    <CreateSupplierModal />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Toplam Tedarikçi",
                        value: suppliers.length,
                        icon: Truck,
                        color: "text-blue-500",
                        bg: "bg-blue-500/10",
                        badge: suppliers.length > 0 ? `${suppliers.length} kayıt` : null,
                        badgeColor: "bg-emerald-500/10 text-emerald-400",
                    },
                    {
                        label: "Aktif Siparişler",
                        value: pendingOrders.length,
                        icon: PackageSearch,
                        color: "text-orange-500",
                        bg: "bg-orange-500/10",
                        badge: pendingOrders.length > 0 ? `${pendingOrders.length} bekliyor` : null,
                        badgeColor: "bg-orange-500/10 text-orange-400",
                    },
                    {
                        label: "Toplam Borç",
                        value: `₺${totalDebt.toLocaleString("tr-TR")}`,
                        icon: CreditCard,
                        color: "text-rose-500",
                        bg: "bg-rose-500/10",
                        badge: pendingOrders.length > 0 ? `${pendingOrders.length} bekliyor` : "₺0",
                        badgeColor: totalDebt > 0 ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-muted-foreground",
                    },
                    {
                        label: "Son Alım Tutarı",
                        value: `₺${lastMonthPurchase.toLocaleString("tr-TR")}`,
                        icon: TrendingUp,
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                        badge: `Son ${Math.min(purchaseOrders.length, 3)} sipariş`,
                        badgeColor: "bg-emerald-500/10 text-emerald-400",
                    },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card border-white/5 hover:border-white/10 transition-all duration-300 group overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                {stat.badge && (
                                    <Badge className={cn("text-[9px] font-black border-none px-2 py-0.5 rounded-lg", stat.badgeColor)}>
                                        {stat.badge}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-foreground">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                {/* LEFT */}
                <div className="space-y-6">
                    {/* Suppliers Table */}
                    <Card className="bg-card border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div>
                                <h2 className="text-sm font-black text-foreground">Öne Çıkan Tedarikçiler</h2>
                                <p className="text-xs text-muted-foreground font-medium">En sık işlem yaptığınız tedarik ortakları</p>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-white/5 hover:bg-transparent">
                                    {["Tedarikçi Adı", "İletişim", "Aktif Sipariş", "Son Alım", "Güvenilirlik", ""].map((h) => (
                                        <TableHead key={h} className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-sm font-medium text-muted-foreground">
                                            Henüz tedarikçi eklenmedi.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.slice(0, 5).map((supplier: any, idx: number) => {
                                        const supplierOrders = purchaseOrders.filter((o: any) => o.supplierId === supplier.id);
                                        const activeOrders = supplierOrders.filter((o: any) => o.status === "PENDING" || o.status === "ORDERED");
                                        const lastOrder = supplierOrders[0];
                                        const reliability = Math.min(99, 75 + idx * 5);
                                        const initials = supplier.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
                                        const colors = ["bg-blue-500/20 text-blue-400", "bg-emerald-500/20 text-emerald-400", "bg-amber-500/20 text-amber-400", "bg-purple-500/20 text-purple-400", "bg-rose-500/20 text-rose-400"];
                                        return (
                                            <TableRow key={supplier.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all group cursor-pointer" onClick={() => setSelectedSupplierId(supplier.id)}>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-9 w-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0", colors[idx % colors.length])}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-foreground group-hover:text-blue-400 transition-colors">{supplier.name}</p>
                                                            <p className="text-[10px] font-medium text-muted-foreground">{supplier.phone || supplier.email || "—"}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-black px-2.5 rounded-lg">
                                                        {supplier.contact || "Genel"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-black text-foreground">
                                                        {activeOrders.length > 0 ? `${activeOrders.length} sipariş` : "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-muted-foreground">
                                                    {lastOrder ? format(new Date(lastOrder.createdAt), "dd MMM yyyy", { locale: tr }) : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-16">
                                                            <div className={cn("h-full rounded-full", reliability >= 80 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${reliability}%` }} />
                                                        </div>
                                                        <span className={cn("text-[10px] font-black", reliability >= 80 ? "text-emerald-400" : "text-amber-400")}>+{reliability}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Purchase Orders Table */}
                    <Card className="bg-card border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div>
                                <h2 className="text-sm font-black text-foreground">Son Satın Alma İşlemleri</h2>
                                <p className="text-xs text-muted-foreground font-medium">Tüm tedarikçilerle gerçekleştirilen son işlemler</p>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-white/5 hover:bg-transparent">
                                    {["Sipariş No", "Tedarikçi", "Ödeme", "Durum", "Toplam Tutar", "Tarih", "İşlem"].map((h) => (
                                        <TableHead key={h} className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-sm font-medium text-muted-foreground">
                                            Henüz satın alma kaydı yok.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchaseOrders.slice(0, 8).map((order: any, idx: number) => {
                                        const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
                                        const orderNum = `TPR-${String(idx + 1001).padStart(3, "0")}`;
                                        return (
                                            <TableRow key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all">
                                                <TableCell className="px-6 py-4 font-bold text-sm text-foreground">{orderNum}</TableCell>
                                                <TableCell className="font-medium text-sm text-foreground">{order.supplier?.name || "—"}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "text-[9px] font-black border px-2 py-0.5 rounded-lg",
                                                        order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                            order.paymentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    )}>
                                                        {order.paymentStatus === "PAID" ? "Ödendi" :
                                                            order.paymentStatus === "PARTIAL" ? "Kısmi" : "Ödenmedi"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-[9px] font-black border px-2 py-0.5 rounded-lg", statusInfo.color)}>{statusInfo.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-black text-foreground">
                                                    ₺{Math.round(Number(order.totalAmount || 0)).toLocaleString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-muted-foreground">
                                                    {format(new Date(order.createdAt), "dd MMM yyyy", { locale: tr })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setGlobalSelectedOrder(order);
                                                                setIsGlobalPaymentOpen(true);
                                                            }}
                                                            className="h-8 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                                            disabled={order.paymentStatus === "PAID"}
                                                        >
                                                            Ödeme Yap
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (order.status === "PENDING" || order.status === "ORDERED") {
                                                                    setGlobalSelectedOrder(order);
                                                                    setIsGlobalMalKabulOpen(true);
                                                                } else {
                                                                    setGlobalSelectedOrder(order);
                                                                    setIsGlobalDetailOpen(true);
                                                                }
                                                            }}
                                                            className="h-8 text-xs font-bold text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                                        >
                                                            {order.status === "PENDING" || order.status === "ORDERED" ? "Tahsil Et" : "İncele"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* RIGHT Sidebar */}
                <div className="space-y-5">
                    <Card className="bg-card border-white/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/5">
                            <h2 className="text-sm font-black text-foreground">Hızlı Aksiyonlar</h2>
                        </div>
                        <CardContent className="p-4 space-y-2">
                            {[
                                { icon: ShoppingCart, label: "Yeni Alım Formu", color: "text-blue-400", bg: "bg-blue-500/10", onClick: () => setIsPurchaseFormOpen(true) },
                                { icon: PayIcon, label: "Ödeme Yap", color: "text-emerald-400", bg: "bg-emerald-500/10", onClick: () => setIsGlobalPaymentOpen(true) },
                                { icon: UserPlus, label: "Tedarikçi Ekle", color: "text-purple-400", bg: "bg-purple-500/10", onClick: () => document.getElementById("create-supplier-trigger")?.click() },
                            ].map((action, i) => (
                                <button key={i} onClick={action.onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", action.bg)}>
                                        <action.icon className={cn("h-4 w-4", action.color)} />
                                    </div>
                                    <span className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">{action.label}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}

                            {/* Supplier Order Lists shortcut */}
                            <button onClick={() => setIsOrderPanelOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-500/5 border border-blue-500/10 transition-all group text-left mt-2">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 relative">
                                    <ShoppingBasket className="h-4 w-4 text-blue-400" />
                                    {totalItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[8px] font-black text-white flex items-center justify-center">
                                            {totalItemCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors">Sipariş Listelerim</span>
                                <ArrowRight className="h-3 w-3 text-blue-400 ml-auto" />
                            </button>
                        </CardContent>
                    </Card>

                    {/* Analytics */}
                    <Card className="bg-card border-white/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/5">
                            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-blue-500" />
                                Analiz Özeti
                            </h2>
                        </div>
                        <CardContent className="p-6 space-y-5">
                            {[
                                { label: "Sevk Süresi Hızı", value: deliveryRate, color: "bg-emerald-500" },
                                { label: "Tedarikçi Memnuniyeti", value: supplierSatisfaction, color: "bg-blue-500" },
                                { label: "Ödeme Performansı", value: paymentDelayScore, color: "bg-amber-500" },
                            ].map((metric, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground">{metric.label}</span>
                                        <span className="text-xs font-black text-foreground">{metric.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", metric.color)} style={{ width: `${metric.value}%` }} />
                                    </div>
                                </div>
                            ))}
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mt-2">
                                <div className="flex items-start gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Smart Alım</p>
                                        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                            {topSupplier
                                                ? `En yüksek güven skoruna sahip ${topSupplier.name} ile toplu alım planlayarak maliyetlerinizi düşürebilirsiniz.`
                                                : "Tedarikçi ekleyerek akıllı alım önerilerinden yararlanmaya başlayın."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity */}
                    <Card className="bg-card border-white/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/5">
                            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-blue-500" />
                                Son Hareketler
                            </h2>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6 font-medium">Henüz hareket yok.</p>
                            ) : (
                                recentActivity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", item.dot)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground shrink-0">
                                            {item.time ? format(new Date(item.time), "dd MMM", { locale: tr }) : "—"}
                                        </span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <SupplierAnalysisModal
                isOpen={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
                alerts={aiAlerts}
                suppliers={suppliers}
                criticalProducts={criticalProducts}
            />
            <SupplierOrderListsPanel
                isOpen={isOrderPanelOpen}
                onClose={() => setIsOrderPanelOpen(false)}
            />
            <PurchaseForm
                isOpen={isPurchaseFormOpen}
                onClose={() => setIsPurchaseFormOpen(false)}
                suppliers={suppliers}
                onSuccess={(newOrder) => {
                    setPurchaseOrders([newOrder, ...purchaseOrders]);
                }}
            />
            <MalKabulModal
                isOpen={isGlobalMalKabulOpen}
                onClose={() => {
                    setIsGlobalMalKabulOpen(false);
                    setGlobalSelectedOrder(null);
                }}
                order={globalSelectedOrder}
            />
            <SupplierPaymentModal
                isOpen={isGlobalPaymentOpen}
                onClose={() => {
                    setIsGlobalPaymentOpen(false);
                    setGlobalSelectedOrder(null);
                }}
                supplierId={globalSelectedOrder?.supplierId || ""}
                supplierName={globalSelectedOrder?.supplier?.name || "Bir Tedarikçi Seçin"}
                unpaidOrders={globalSelectedOrder ? [globalSelectedOrder] : []}
                suppliers={suppliers}
                allPurchaseOrders={purchaseOrders}
                onSuccess={() => {
                    // Refresh data or update local state
                    window.location.reload();
                }}
            />
            {globalSelectedOrder && isGlobalDetailOpen && (
                <PurchaseOrderDetailModal
                    isOpen={isGlobalDetailOpen}
                    onClose={() => setIsGlobalDetailOpen(false)}
                    order={globalSelectedOrder}
                />
            )}
        </div>
    );
}
