"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    PackageCheck
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MalKabulModal } from "./mal-kabul-modal";

interface SupplierProfileProps {
    supplier: any;
    onBack: () => void;
}

export function SupplierProfile({ supplier, onBack }: SupplierProfileProps) {
    const [activeTab, setActiveTab] = useState("orders");
    const [isMalKabulOpen, setIsMalKabulOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const stats = [
        { label: "Toplam Alışveriş", value: `₺${Number(supplier.totalShopping || 0).toLocaleString("tr-TR")}`, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
        { label: "Güncel Borç", value: `₺${Number(supplier.balance || 0).toLocaleString("tr-TR")}`, icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10" },
        { label: "Geciken Ödemeler", value: "₺0", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Aktif Siparişler", value: `${supplier.purchases?.filter((p: any) => p.status !== "COMPLETED").length || 0} Adet`, icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    const handleMalKabul = (order: any) => {
        setSelectedOrder(order);
        setIsMalKabulOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back Button & Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Tedarikçi Listesine Dön
                </button>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card border border-white/5 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Truck className="h-32 w-32 rotate-12" />
                    </div>

                    <div className="flex items-start gap-6 relative z-10">
                        {/* Logo Placeholder */}
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/20 shrink-0">
                            {supplier.name[0]}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-foreground tracking-tight">{supplier.name}</h1>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-lg">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Onaylı Tedarikçi
                                </Badge>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Aktif</span>
                            </div>

                            <p className="text-xs font-bold text-muted-foreground">{supplier.category || "Yedek Parça & Aksesuar"} • {supplier.address?.split(',')[0] || "İstanbul, TR"}</p>

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
                        <div className="hidden xl:flex flex-col items-end mr-6 pr-6 border-r border-white/5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Güven Skoru</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-emerald-500">{supplier.trustScore || 98}/100</span>
                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <PackageCheck className="h-4 w-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" className="h-11 rounded-xl font-bold text-xs gap-2 border-white/5 hover:bg-white/5">
                            <Edit3 className="h-4 w-4" />
                            Düzenle
                        </Button>
                        <Button variant="outline" className="h-11 rounded-xl font-bold text-xs gap-2 border-white/5 hover:bg-white/5 px-4 bg-white/5">
                            <CreditCard className="h-4 w-4" />
                            Ödeme Yap
                        </Button>
                        <Button className="h-11 rounded-xl font-black text-xs gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-6">
                            <PlusCircle className="h-4 w-4" />
                            Yeni Sipariş
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-card border-white/5 overflow-hidden group hover:border-white/10 transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                {stat.trend && (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-black">
                                        {stat.trend}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-8">
                    {[
                        { id: "orders", label: "Sipariş Listeleri", icon: Truck },
                        { id: "history", label: "Satın Alma Geçmişi", icon: History },
                        { id: "cari", label: "Cari Hareketler", icon: Wallet },
                        { id: "notes", label: "Notlar & Belgeler", icon: FileText },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-foreground rounded-none px-0 py-4 text-xs font-bold text-muted-foreground hover:text-foreground transition-all gap-2"
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="py-6">
                    <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                        <Card className="bg-card border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Aktif ve Bekleyen Siparişler</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5 text-left bg-white/[0.01]">
                                            {["Sipariş No", "Tarih", "Toplam Tutar", "Durum", "İşlem"].map((h) => (
                                                <th key={h} className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{h}</th>
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
                                                    <td className="px-6 py-4 text-sm font-black text-foreground group-hover:text-blue-400">#{order.orderNo}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{format(new Date(order.createdAt), "dd MMMM yyyy", { locale: tr })}</td>
                                                    <td className="px-6 py-4 text-sm font-black text-foreground">₺{Number(order.totalAmount).toLocaleString("tr-TR")}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={cn(
                                                            "text-[10px] font-black border-none px-2 rounded-xl",
                                                            order.status === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                                                                order.status === "ON_WAY" ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-400"
                                                        )}>
                                                            {order.status === "PENDING" ? "Beklemede" : order.status === "ON_WAY" ? "Yolda" : order.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                onClick={() => handleMalKabul(order)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 rounded-lg text-[10px] font-black uppercase text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 border"
                                                            >
                                                                Teslim Al
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase text-muted-foreground">Detay</Button>
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
                        {/* History list - similar to orders but completed */}
                        <Card className="bg-card border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Tamamlanan Satın Almalar</h3>
                            </div>
                            <div className="p-12 text-center space-y-3">
                                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                                    <History className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground text-center">Henüz geçmiş işlem kaydı bulunmuyor.</p>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cari" className="m-0">
                        <Card className="bg-card border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Cari Hareket Kayıtları</h3>
                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    Ekstre Al
                                </Button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {supplier.transactions?.length === 0 ? (
                                    <div className="p-12 text-center text-sm font-medium text-muted-foreground">İşlem kaydı yok.</div>
                                ) : (
                                    supplier.transactions?.map((t: any) => (
                                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01]">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs",
                                                    t.type === "EXPENSE" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                                )}>
                                                    {t.type === "EXPENSE" ? "B" : "A"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{t.description}</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground">{format(new Date(t.date), "dd MMM yyyy HH:mm", { locale: tr })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn("text-sm font-black", t.type === "EXPENSE" ? "text-rose-400" : "text-emerald-400")}>
                                                    {t.type === "EXPENSE" ? "-" : "+"} ₺{Number(t.amount).toLocaleString("tr-TR")}
                                                </p>
                                                <p className="text-[10px] font-medium text-muted-foreground">Kalan Borç: ₺{Number(supplier.balance).toLocaleString("tr-TR")}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
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
                    }}
                    order={selectedOrder}
                />
            )}
        </div>
    );
}
