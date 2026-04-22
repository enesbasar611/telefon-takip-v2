"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
    Calendar,
    History,
    Filter,
    Layers,
    ListFilter
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
    shop?: any;
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Beklemede", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    DELIVERED: { label: "Teslim Alındı", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    CANCELLED: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    ORDERED: { label: "Sipariş Verildi", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

import { PageHeader } from "@/components/ui/page-header";
import { SupplierProfile } from "./supplier-profile";
import { PurchaseForm } from "./purchase-form";
import { PurchaseOrderDetailModal } from "./purchase-order-detail-modal";

export function TedarikcilerPageClient({ suppliers, purchaseOrders: initialPurchaseOrders, aiAlerts, criticalProducts, shop }: TedarikcilerPageClientProps) {
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);

    useEffect(() => {
        setPurchaseOrders(initialPurchaseOrders);
    }, [initialPurchaseOrders]);

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
    const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
    const [isGlobalMalKabulOpen, setIsGlobalMalKabulOpen] = useState(false);
    const [isGlobalDetailOpen, setIsGlobalDetailOpen] = useState(false);
    const [isGlobalPaymentOpen, setIsGlobalPaymentOpen] = useState(false);
    const [isGroupedByDay, setIsGroupedByDay] = useState(false);
    const [globalSelectedOrder, setGlobalSelectedOrder] = useState<any>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // React to URL changes for selected supplier
    const selectedSupplierId = searchParams.get("id");

    const setSelectedSupplierId = (id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set("id", id);
        } else {
            params.delete("id");
        }
        router.push(`${pathname}?${params.toString()}`);
    };
    const { totalItemCount } = useSupplierOrders();

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    // If a supplier is selected, show the profile view
    if (selectedSupplierId && selectedSupplier) {
        return (
            <SupplierProfile
                supplier={selectedSupplier}
                onBack={() => setSelectedSupplierId(null)}
                suppliers={suppliers}
                shop={shop}
            />
        );
    }

    const pendingOrders = purchaseOrders.filter((o: any) => o.status === "PENDING" || o.status === "ORDERED");
    const totalDebtTry = suppliers.reduce((sum: number, s: any) => sum + Number(s.balance || 0), 0);
    const totalDebtUsd = suppliers.reduce((sum: number, s: any) => sum + Number(s.balanceUsd || 0), 0);
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

    // Grouping Logic
    const groupedOrders = isGroupedByDay
        ? purchaseOrders.reduce((groups: any, order: any) => {
            const date = format(new Date(order.createdAt), "yyyy-MM-dd");
            if (!groups[date]) groups[date] = [];
            groups[date].push(order);
            return groups;
        }, {})
        : null;

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700">
            <PageHeader
                title="Tedarikçi & Satın Alma"
                description="Operasyonel genel bakış, tedarikçi yönetimi ve satın alma süreçleri."
                icon={Truck}
                badge={
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1 text-[9px] uppercase font-bold tracking-widest">OPERASYONEL</Badge>
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setIsOrderPanelOpen(true)}
                            className="relative h-12 px-6 rounded-xl text-xs gap-3 border-border/40 hover:bg-white/5 shadow-xl"
                        >
                            <ShoppingBasket className="h-5 w-5" />
                            Sipariş Listeleri
                            {totalItemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center border-2 border-background font-bold shadow-lg">
                                    {totalItemCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => setIsAnalysisOpen(true)}
                            className={cn(
                                "h-12 px-6 rounded-xl text-xs gap-3 transition-all shadow-xl",
                                hasCritical
                                    ? "bg-rose-600/10 border border-rose-500/30 text-rose-400 hover:bg-rose-600/20"
                                    : "bg-white/5 border border-border/40 text-foreground hover:bg-white/10"
                            )}
                        >
                            <Brain className="h-5 w-5" />
                            Tedarik Analizi
                            {totalUrgent > 0 && (
                                <Badge className="bg-rose-500/20 text-rose-400 border-none text-[10px] px-2 py-0.5 ml-1 font-bold">
                                    {totalUrgent}
                                </Badge>
                            )}
                        </Button>
                        <CreateSupplierModal />
                    </div>
                }
            />

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
                        value: `₺${totalDebtTry.toLocaleString("tr-TR")}`,
                        icon: CreditCard,
                        color: "text-rose-500",
                        bg: "bg-rose-500/10",
                        badge: totalDebtUsd > 0 ? `$${totalDebtUsd.toLocaleString()}` : "₺0",
                        badgeColor: totalDebtTry > 0 ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-muted-foreground",
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
                    <Card key={i} className="bg-card border-border/50 hover:border-border transition-all duration-300 group overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                {stat.badge && (
                                    <Badge className={cn("text-[9px]  border-none px-2 py-0.5 rounded-lg", stat.badgeColor)}>
                                        {stat.badge}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs  text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                            <p className="text-2xl  text-foreground">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                {/* LEFT */}
                <div className="space-y-6">
                    {/* Suppliers Table */}
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                            <div>
                                <h2 className="font-medium text-sm  text-foreground">Öne Çıkan Tedarikçiler</h2>
                                <p className="text-xs text-muted-foreground font-medium">En sık işlem yaptığınız tedarik ortakları</p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                                        {["Tedarikçi Adı", "İletişim", "Aktif Sipariş", "Son Alım", "Güvenilirlik", ""].map((h) => (
                                            <TableHead key={h} className="font-medium px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">{h}</TableHead>
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
                                                            <div className={cn("h-9 w-9 rounded-xl  text-xs flex items-center justify-center shrink-0", colors[idx % colors.length])}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className=" text-sm text-foreground group-hover:text-blue-400 transition-colors">{supplier.name}</p>
                                                                    <span className="text-[10px] text-muted-foreground/40 font-mono">#{supplier.id.slice(-6).toUpperCase()}</span>
                                                                </div>
                                                                <p className="text-[10px] font-medium text-muted-foreground">{supplier.phone || supplier.email || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px]  px-2.5 rounded-lg">
                                                            {supplier.contact || "Genel"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm  text-foreground">
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
                                                            <span className={cn("text-[10px] ", reliability >= 80 ? "text-emerald-400" : "text-amber-400")}>+{reliability}%</span>
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
                        </div>

                        {/* Mobile Suppliers Card List */}
                        <div className="flex flex-col divide-y divide-border/20 md:hidden">
                            {suppliers.length === 0 ? (
                                <div className="py-20 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                                    TEDARİKÇİ BULUNAMADI
                                </div>
                            ) : (
                                suppliers.slice(0, 10).map((supplier: any, idx: number) => {
                                    const supplierOrders = purchaseOrders.filter((o: any) => o.supplierId === supplier.id);
                                    const activeOrders = supplierOrders.filter((o: any) => o.status === "PENDING" || o.status === "ORDERED");
                                    const initials = supplier.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
                                    const colors = ["bg-blue-500/20 text-blue-400", "bg-emerald-500/20 text-emerald-400", "bg-amber-500/20 text-amber-400", "bg-purple-500/20 text-purple-400", "bg-rose-500/20 text-rose-400"];
                                    const reliability = Math.min(99, 75 + idx * 3);
                                    return (
                                        <div key={supplier.id} onClick={() => setSelectedSupplierId(supplier.id)} className="p-4 flex flex-col gap-3 active:bg-muted/30 transition-colors relative">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-10 w-10 rounded-xl text-xs flex items-center justify-center shrink-0", colors[idx % colors.length])}>
                                                    {initials}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm text-foreground">{supplier.name}</p>
                                                        <span className="text-[9px] text-muted-foreground/40 font-mono">#{supplier.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">{supplier.phone || supplier.email || "İletişim yok"}</p>
                                                </div>
                                                <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] px-2 rounded-lg">
                                                    {supplier.contact || "Genel"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] mt-1 pt-3 border-t border-border/10">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-muted-foreground uppercase tracking-tighter">Aktif Sipariş</span>
                                                    <span className="text-foreground font-medium">{activeOrders.length} Sipariş</span>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end text-right">
                                                    <span className="text-muted-foreground uppercase tracking-tighter">Güvenilirlik</span>
                                                    <span className={cn("font-bold", reliability >= 80 ? "text-emerald-400" : "text-amber-400")}>%{reliability}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    {/* Purchase Orders Table */}
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                            <div>
                                <h2 className="font-medium text-sm  text-foreground">Son Satın Alma İşlemleri</h2>
                                <p className="text-xs text-muted-foreground font-medium">Tüm tedarikçilerle gerçekleştirilen son işlemler</p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                                        {["Sipariş No", "Tedarikçi", "Ödeme", "Durum", "Toplam Tutar", "Tarih", "İşlem"].map((h) => (
                                            <TableHead key={h} className="font-medium px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-widest">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-sm font-medium text-muted-foreground">
                                                Henüz satın alma kaydı yok.
                                            </TableCell>
                                        </TableRow>
                                    ) : isGroupedByDay ? (
                                        Object.entries(groupedOrders).map(([date, orders]: [string, any]) => (
                                            <div key={date} className="contents">
                                                <TableRow className="bg-white/[0.02] border-none hover:bg-white/[0.02]">
                                                    <TableCell colSpan={7} className="px-6 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 text-blue-400" />
                                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                                                                {format(new Date(date), "dd MMMM yyyy", { locale: tr })}
                                                            </span>
                                                            <div className="h-px flex-1 bg-white/[0.05] ml-2" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {orders.map((order: any, idx: number) => {
                                                    const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: "bg-slate-500/10 text-muted-foreground border-slate-500/20" };
                                                    const orderNum = `TPR-${String(idx + 1001).padStart(3, "0")}`;
                                                    return (
                                                        <TableRow key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all">
                                                            <TableCell className="px-6 py-4 text-sm font-bold text-foreground">#{order.orderNo}</TableCell>
                                                            <TableCell className="font-medium text-sm text-foreground">{order.supplier?.name || "—"}</TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(
                                                                    "text-[9px] border px-2 py-0.5 rounded-lg",
                                                                    order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                        order.paymentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                            "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                                )}>
                                                                    {order.paymentStatus === "PAID" ? "Ödendi" :
                                                                        order.paymentStatus === "PARTIAL" ? "Kısmi" : "Ödenmedi"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={cn("text-[9px] border px-2 py-0.5 rounded-lg", statusInfo.color)}>{statusInfo.label}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-foreground">
                                                                ₺{Math.round(Number(order.totalAmount || 0)).toLocaleString("tr-TR")}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-medium text-muted-foreground">
                                                                {format(new Date(order.createdAt), "HH:mm", { locale: tr })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {(order.status === "PENDING" || order.status === "ORDERED") && (
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setGlobalSelectedOrder(order);
                                                                                setIsGlobalMalKabulOpen(true);
                                                                            }}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 rounded-lg text-[10px] uppercase text-blue-400 border-blue-500/20 hover:bg-blue-500/10 border"
                                                                        >
                                                                            Teslim Al
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setGlobalSelectedOrder(order);
                                                                            setIsGlobalDetailOpen(true);
                                                                        }}
                                                                        className="h-8 text-xs text-muted-foreground hover:bg-white/5 rounded-lg"
                                                                    >
                                                                        İncele
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    ) : (
                                        purchaseOrders.slice(0, 8).map((order: any, idx: number) => {
                                            const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: "bg-slate-500/10 text-muted-foreground border-slate-500/20" };
                                            const orderNum = `TPR-${String(idx + 1001).padStart(3, "0")}`;
                                            return (
                                                <TableRow key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all">
                                                    <TableCell className="px-6 py-4 text-sm font-bold text-foreground">#{order.orderNo}</TableCell>
                                                    <TableCell className="font-medium text-sm text-foreground">{order.supplier?.name || "—"}</TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(
                                                            "text-[9px]  border px-2 py-0.5 rounded-lg",
                                                            order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                order.paymentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                    "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                        )}>
                                                            {order.paymentStatus === "PAID" ? "Ödendi" :
                                                                order.paymentStatus === "PARTIAL" ? "Kısmi" : "Ödenmedi"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("text-[9px]  border px-2 py-0.5 rounded-lg", statusInfo.color)}>{statusInfo.label}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm  text-foreground">
                                                        ₺{Math.round(Number(order.totalAmount || 0)).toLocaleString("tr-TR")}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium text-muted-foreground">
                                                        {format(new Date(order.createdAt), "dd MMM yyyy", { locale: tr })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setGlobalSelectedOrder(order);
                                                                    setIsGlobalPaymentOpen(true);
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 rounded-lg text-[10px] uppercase text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 border"
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
                                                                className="h-8 text-xs  text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                                            >
                                                                {order.status === "PENDING" || order.status === "ORDERED" ? "Teslim Al" : "İncele"}
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

                        {/* Mobile Purchase Orders Card List */}
                        <div className="flex flex-col divide-y divide-border/20 md:hidden">
                            {purchaseOrders.length === 0 ? (
                                <div className="py-20 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                                    SİPARİŞ KAYDI YOK
                                </div>
                            ) : (
                                purchaseOrders.slice(0, 10).map((order: any, idx: number) => {
                                    const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: "bg-slate-500/10 text-muted-foreground border-slate-500/20" };
                                    const orderNum = `TPR-${String(idx + 1001).padStart(3, "0")}`;
                                    return (
                                        <div key={order.id} className="p-4 flex flex-col gap-3 active:bg-muted/30 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{orderNum}</span>
                                                    <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">{order.supplier?.name || "Bilinmeyen Tedarikçi"}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-base font-bold text-foreground">₺{Math.round(Number(order.totalAmount || 0)).toLocaleString("tr-TR")}</span>
                                                    <span className="text-[9px] text-muted-foreground">{format(new Date(order.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge className={cn("text-[9px] border px-2 py-0.5 rounded-lg", statusInfo.color)}>{statusInfo.label}</Badge>
                                                <Badge className={cn(
                                                    "text-[9px] border px-2 py-0.5 rounded-lg",
                                                    order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                        order.paymentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                            "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                )}>
                                                    {order.paymentStatus === "PAID" ? "Ödendi" :
                                                        order.paymentStatus === "PARTIAL" ? "Kısmi" : "Ödenmedi"}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 pt-3 border-t border-border/10">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setGlobalSelectedOrder(order);
                                                        setIsGlobalPaymentOpen(true);
                                                    }}
                                                    className="flex-1 h-9 text-[10px] uppercase font-bold text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                                                    disabled={order.paymentStatus === "PAID"}
                                                >
                                                    ÖDEME YAP
                                                </Button>
                                                <Button
                                                    variant="outline"
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
                                                    className="flex-1 h-9 text-[10px] uppercase font-bold text-blue-400 border-blue-500/20 hover:bg-blue-500/10"
                                                >
                                                    {order.status === "PENDING" || order.status === "ORDERED" ? "TAHSİL ET" : "İNCELE"}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* RIGHT Sidebar */}
                <div className="space-y-5">
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <ListFilter className="h-4 w-4 text-blue-400" />
                                </div>
                                <h2 className="font-medium text-sm text-foreground">Son Satın Alma Emirleri</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsGroupedByDay(!isGroupedByDay)}
                                className={cn(
                                    "h-8 rounded-lg text-[10px] uppercase font-bold tracking-widest gap-2 transition-all",
                                    isGroupedByDay ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-white/5 text-muted-foreground hover:text-foreground border border-white/5"
                                )}
                            >
                                <Layers className="h-3 w-3" />
                                {isGroupedByDay ? "GRUPLAMAYI KALDIR" : "GÜNLÜK GRUPLA"}
                            </Button>
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
                                    <span className="text-sm  text-foreground group-hover:text-blue-400 transition-colors">{action.label}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}

                            {/* Supplier Order Lists shortcut */}
                            <button onClick={() => setIsOrderPanelOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-500/5 border border-blue-500/10 transition-all group text-left mt-2">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 relative">
                                    <ShoppingBasket className="h-4 w-4 text-blue-400" />
                                    {totalItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[8px]  text-white flex items-center justify-center">
                                            {totalItemCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm  text-blue-400 group-hover:text-blue-300 transition-colors">Sipariş Listelerim</span>
                                <ArrowRight className="h-3 w-3 text-blue-400 ml-auto" />
                            </button>
                        </CardContent>
                    </Card>

                    {/* Analytics */}
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-border/50">
                            <h2 className="font-medium text-xs  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
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
                                        <span className="text-xs  text-muted-foreground">{metric.label}</span>
                                        <span className="text-xs  text-foreground">{metric.value}%</span>
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
                                        <p className="text-[10px]  text-blue-400 uppercase tracking-wider mb-1">Smart Alım</p>
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
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-border/50">
                            <h2 className="font-medium text-xs  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
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
                                            <p className="text-xs  text-foreground truncate">{item.title}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <span className="text-[9px]  text-muted-foreground shrink-0">
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
                shop={shop}
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
                initialOrderId={globalSelectedOrder?.id}
                unpaidOrders={globalSelectedOrder ? [globalSelectedOrder] : []}
                suppliers={suppliers}
                allPurchaseOrders={purchaseOrders}
                onSuccess={() => {
                    // Refetch or update state
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






