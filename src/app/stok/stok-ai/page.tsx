"use client";

import { useEffect, useState, useTransition } from "react";
import {
    Brain,
    Sparkles,
    AlertCircle,
    TrendingUp,
    History,
    ShoppingCart,
    Zap,
    Trash2,
    RefreshCw,
    Package,
    ArrowRightCircle,
    Info,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getAIAlerts, triggerAIAnalysis, deleteAIAlert } from "@/lib/actions/stock-ai-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { EditProductModal } from "@/components/product/edit-product-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StockAIPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchAlerts = async () => {
        setLoading(true);
        const data = await getAIAlerts();
        // @ts-ignore - Ignore prisma types until generate is fixed
        setAlerts(data);
        setLoading(false);
    };

    const fetchCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    useEffect(() => {
        fetchAlerts();
        fetchCategories();
    }, []);

    const handleRunAnalysis = () => {
        startTransition(async () => {
            const result = await triggerAIAnalysis();
            if (result.success) {
                toast.success(`Analiz tamamlandı! ${result.count} yeni öneri bulundu.`);
                fetchAlerts();
            } else {
                toast.error("Analiz sırasında bir hata oluştu.");
            }
        });
    };

    const handleDelete = async (id: string) => {
        const result = await deleteAIAlert(id);
        if (result.success) {
            setAlerts(prev => prev.filter(a => a.id !== id));
            toast.success("Öneri gizlendi.");
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case "CRITICAL":
                return {
                    icon: AlertCircle,
                    color: "text-rose-500",
                    bg: "bg-rose-500/10",
                    border: "border-rose-500/20",
                    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
                    label: "KRİTİK UYARI"
                };
            case "TRENDING":
                return {
                    icon: TrendingUp,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
                    label: "TREND ÖNERİSİ"
                };
            case "STAGNANT":
                return {
                    icon: History,
                    color: "text-amber-500",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
                    label: "STOK ANALİZİ"
                };
            default:
                return {
                    icon: Info,
                    color: "text-slate-400",
                    bg: "bg-slate-400/10",
                    border: "border-slate-400/20",
                    glow: "",
                    label: "BİLGİLENDİRME"
                };
        }
    };

    return (
        <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden p-12 rounded-[3.5rem] bg-gradient-to-br from-blue-600/[0.05] to-transparent border border-white/5">
                <div className="absolute top-[-50%] left-[-10%] h-[200%] w-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none rotate-45" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                            <Brain className="h-6 w-6 text-blue-500" />
                        </div>
                        <Badge className="bg-blue-600/10 text-blue-500 border-none px-4 py-1.5 font-black text-[10px] uppercase tracking-[0.2em]">Yapay Zeka Destekli Envanter</Badge>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                        AI <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent opacity-90 pb-2 pr-2">Önerileri</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
                        Sistemimiz stok hareketlerini, satış trendlerini ve kritik seviyeleri analiz ederek dükkanınız için en kârlı kararları almanıza yardımcı olur.
                    </p>
                </div>

                <div className="relative z-10 transition-all hover:scale-105 active:scale-95 group">
                    <div className="absolute inset-0 bg-blue-600/30 blur-2xl rounded-full scale-[1.2] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-soft pointer-events-none" />
                    <Button
                        onClick={handleRunAnalysis}
                        disabled={isPending}
                        className="relative z-10 h-16 px-8 rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-[0_20px_40px_rgba(37,99,235,0.3)] animate-pulse-soft transition-all"
                    >
                        {isPending ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                        )}
                        ŞİMDİ ANALİZ ET
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Alerts Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">AKTİF ÖNERİLER</h2>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            {alerts.length} KAYIT BULUNDU
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-white/[0.03]" />
                            ))}
                        </div>
                    ) : alerts.length === 0 ? (
                        <Card className="rounded-[3rem] border-dashed border-white/10 bg-transparent py-20">
                            <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                                <Zap className="h-16 w-16 text-slate-700 animate-pulse" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-500 uppercase">Her Şey Yolunda</h3>
                                    <p className="text-sm text-slate-600 font-medium mt-1">Şu an için kritik bir stok uyarısı veya sistem önerisi bulunmuyor.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        alerts.map((alert) => {
                            const style = getTypeStyles(alert.type);
                            return (
                                <Card key={alert.id} className={cn(
                                    "rounded-[2.5rem] bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all duration-500",
                                    style.glow,
                                    style.border
                                )}>
                                    <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex gap-6 items-start md:items-center">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                                                style.bg,
                                                style.color,
                                                style.border
                                            )}>
                                                <style.icon className="h-7 w-7" />
                                            </div>
                                            <div className="space-y-1.5 max-w-md">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", style.color)}>
                                                        {style.label}
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                                                        {format(new Date(alert.createdAt), "dd MMMM HH:mm", { locale: tr })}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-extrabold text-slate-100 leading-tight">
                                                    {alert.message}
                                                </h3>
                                                {alert.product && (
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        REF: {alert.product.name} ({alert.product.stock} Adet)
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <Button
                                                variant="ghost"
                                                className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                                                onClick={() => handleDelete(alert.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                className="h-12 px-6 rounded-2xl bg-white border border-white/10 text-black hover:bg-white/90 font-black text-[11px] uppercase tracking-widest flex-1 md:flex-none gap-2"
                                                onClick={async () => {
                                                    if (!alert.product) return;

                                                    if (alert.type === "CRITICAL") {
                                                        // Send to Shortage List
                                                        try {
                                                            await addShortageItem({ productId: alert.product.id, name: alert.product.name, quantity: 1 });
                                                            toast.success(`${alert.product.name} eksikler listesine eklendi.`);
                                                            handleDelete(alert.id);
                                                        } catch (error) {
                                                            toast.error("Eksikler listesine eklenirken hata oluştu.");
                                                        }
                                                    } else if (alert.type === "STAGNANT") {
                                                        // Prompt for edit to adjust price
                                                        setSelectedProduct(alert.product);
                                                        setIsEditModalOpen(true);
                                                    } else {
                                                        // Fallback search navigation
                                                        if (alert.productId) window.location.href = `/stok?search=${alert.product?.name}`;
                                                    }
                                                }}
                                            >
                                                İNCELE VE ÇÖZ
                                                <ArrowRightCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                    <div className="h-1 w-full bg-white/[0.02]">
                                        <div
                                            className={cn("h-full opacity-50 transition-all duration-1000", style.bg.replace('/10', '/30'))}
                                            style={{ width: "100%" }} // This could be tied to expiry time (expiresIn/totalTime)
                                        />
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Info Panels */}
                <div className="space-y-8">
                    <Card className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-900 border-none shadow-[0_20px_50px_rgba(37,99,235,0.3)] p-1 text-white group overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-150 transition-transform duration-1000" />
                        <CardHeader className="p-8 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 mb-6">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight">AI Nasıl Çalışır?</CardTitle>
                            <CardDescription className="text-blue-100/70 font-medium">Yerel yapay zeka sistemimiz aşağıdaki kriterleri 7/24 izler:</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-4 relative z-10">
                            {[
                                { icon: ShoppingCart, title: "Satış Hızı", desc: "Hızlı tükenen ürünleri tespit eder." },
                                { icon: Clock, title: "Durgunluk", desc: "Sirkülasyonu duran stokları bildirir." },
                                { icon: Package, title: "Kritik Seviye", desc: "Minimum stok sınırına yaklaşanlar." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white/10 border border-white/10">
                                    <item.icon className="h-5 w-5 mt-1 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm uppercase tracking-wider">{item.title}</h4>
                                        <p className="text-xs text-blue-100/60 font-medium mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] bg-white/[0.01] border border-white/5 overflow-hidden">
                        <CardHeader className="p-8 border-b border-white/5">
                            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-500" /> SİSTEM BİLGİSİ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span>BİLDİRİM SÜRESİ</span>
                                <span className="text-white">48 SAAT (2 GÜN)</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-blue-500/50" />
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed uppercase">
                                Tüm öneriler 2 gün sonra otomatik olarak silinir. Bu, verilerinizin her zaman taze kalmasını sağlar.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <EditProductModal
                product={selectedProduct}
                categories={categories}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    // Refresh AI alerts just in case
                    fetchAlerts();
                }}
            />
        </div>
    );
}

