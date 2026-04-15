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

    // Deep Analysis State
    const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleDeepAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const { getSmartAIStockAnalysis } = await import("@/lib/actions/gemini-actions");
            const res = await getSmartAIStockAnalysis();
            if (res.success) {
                setDeepAnalysis(res.analysis);
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Stratejik rapor oluşturulamadı.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const fetchAlerts = async () => {
        setLoading(true);
        const data = await getAIAlerts();
        // @ts-ignore
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
                return { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]", label: "KRİTİK" };
            case "TRENDING":
                return { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]", label: "TREND" };
            case "STAGNANT":
                return { icon: History, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]", label: "DURGUN" };
            default:
                return { icon: Info, color: "text-muted-foreground", bg: "bg-slate-400/10", border: "border-slate-400/20", glow: "", label: "İLGİLİ" };
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-700 max-w-full overflow-x-hidden">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden px-6 py-10 md:p-12 rounded-[2rem] md:rounded-[3.5rem] bg-gradient-to-br from-blue-600/[0.05] to-transparent border border-border/50">
                <div className="absolute top-[-50%] left-[-10%] h-[200%] w-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none rotate-45" />
                <section className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                            <Brain className="h-5 w-5 text-blue-500" />
                        </div>
                        <Badge className="bg-blue-600/10 text-blue-500 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold">BAŞAR AI ANALİZ</Badge>
                    </div>
                    <h1 className="font-bold text-3xl md:text-5xl text-white tracking-tighter leading-none">
                        Stok <span className="text-blue-500">Önerileri</span>
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-xl text-sm md:text-base leading-relaxed line-clamp-2">
                        Veri odaklı kararlar alarak dükkan verimliliğini artırın.
                    </p>
                </section>
                <div className="relative z-10 shrink-0">
                    <Button
                        onClick={handleRunAnalysis}
                        disabled={isPending}
                        className="w-full md:w-auto h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest gap-3 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        SİSTEMİ ANALİZ ET
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <main className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Aktif Kayıtlar</h2>
                        <span className="text-[10px] bg-white/5 border border-border/50 px-3 py-1 rounded-full text-white">{alerts.length} LİSTE</span>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-3xl bg-white/[0.03]" />)}
                        </div>
                    ) : alerts.length === 0 ? (
                        <Card className="rounded-[2.5rem] border-dashed py-16 bg-transparent">
                            <CardContent className="flex flex-col items-center justify-center text-center gap-2">
                                <Zap className="h-10 w-10 text-muted-foreground/20" />
                                <h3 className="font-bold text-muted-foreground uppercase tracking-widest text-sm">Tertemiz</h3>
                                <p className="text-[11px] text-muted-foreground/60 uppercase">Şu an için herhangi bir uyarı bulunmuyor.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        alerts.map((alert) => {
                            const style = getTypeStyles(alert.type);
                            return (
                                <Card key={alert.id} className={cn("rounded-[2rem] bg-white/[0.02] border-border/50 group hover:bg-white/[0.03] transition-all duration-300", style.glow, style.border)}>
                                    <CardContent className="p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 md:gap-6 w-full">
                                            <div className={cn("h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center border shrink-0", style.bg, style.color, style.border)}>
                                                <style.icon className="h-6 w-6 md:h-7 md:w-7" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", style.color)}>{style.label}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">{format(new Date(alert.createdAt), "dd MMM HH:mm", { locale: tr })}</span>
                                                </div>
                                                <h3 className="font-bold text-sm md:text-base text-slate-100 leading-tight line-clamp-2">{alert.message}</h3>
                                                {alert.product && (
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 truncate">REF: {alert.product.name} ({alert.product.stock} Adet)</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <Button variant="ghost" className="h-12 w-12 rounded-xl bg-white/5 border border-border/50 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" onClick={() => handleDelete(alert.id)}>
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                className="h-12 px-6 rounded-xl bg-white text-black hover:bg-white/90 text-[10px] font-bold uppercase tracking-widest flex-1 gap-2 shrink-0"
                                                onClick={async () => {
                                                    if (!alert.product) return;
                                                    if (alert.type === "CRITICAL") {
                                                        const res = await addShortageItem({ productId: alert.product.id, name: alert.product.name, quantity: 1 });
                                                        toast.success(`${alert.product.name} listeye eklendi.`);
                                                        handleDelete(alert.id);
                                                    } else if (alert.type === "STAGNANT") {
                                                        setSelectedProduct(alert.product);
                                                        setIsEditModalOpen(true);
                                                    } else if (alert.productId) {
                                                        window.location.href = `/stok?search=${alert.product?.name}`;
                                                    }
                                                }}
                                            >
                                                İNCELE <ArrowRightCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </main>

                <aside className="space-y-6">
                    <Card className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-900 border-none shadow-2xl p-1 text-white group overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                        <CardHeader className="p-8 pb-4 relative z-10">
                            <Sparkles className="h-10 w-10 opacity-50 mb-4" />
                            <CardTitle className="font-bold text-xl tracking-tight">AI Nasıl Çalışır?</CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-3 relative z-10">
                            {[
                                { icon: ShoppingCart, t: "Trend" },
                                { icon: Clock, t: "Hız" },
                                { icon: Package, t: "Sınır" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/5">
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.t} Analizi</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {deepAnalysis && (
                        <Card className="rounded-[2rem] bg-white/[0.04] border-blue-500/20 overflow-hidden animate-in slide-in-from-bottom">
                            <CardHeader className="p-6 border-b border-border/50 bg-blue-600/[0.03]">
                                <CardTitle className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5" /> STRATEJİK RAPOR
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-10 mb-6">{deepAnalysis}</p>
                                <Button variant="outline" onClick={() => setDeepAnalysis(null)} className="w-full rounded-xl text-[10px] font-bold uppercase tracking-widest h-10">Kapat</Button>
                            </CardContent>
                        </Card>
                    )}

                    {!deepAnalysis && (
                        <Card className="rounded-[2rem] bg-white/[0.01] border border-border/50">
                            <CardContent className="p-8 flex flex-col gap-4">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-blue-500" /> Tahmini Öngörü
                                </h4>
                                <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-bold">15 günlük gelecek raporu oluşturulsun mu?</p>
                                <Button onClick={handleDeepAnalysis} disabled={isAnalyzing} className="w-full rounded-xl h-12 bg-white/5 border border-border/50 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest gap-2">
                                    {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4 text-blue-500" />}
                                    STRATEJİK RAPORU BAŞLAT
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </aside>
            </div>

            <EditProductModal
                product={selectedProduct}
                categories={categories}
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); fetchAlerts(); }}
            />
        </div>
    );
}
