"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, ShoppingCart, Smartphone, AlertTriangle, ChevronRight, Zap, Target } from "lucide-react";

interface DeviceAiStockAdviceModalProps {
    missingItems: any[];
    monthlySales: any[];
    stockDevices: any[];
}

export function DeviceAiStockAdviceModal({ missingItems, monthlySales, stockDevices }: DeviceAiStockAdviceModalProps) {
    const [open, setOpen] = useState(false);

    // Analysis Logic
    const hasSales = monthlySales.length > 0;

    // 1. Get Top Selling Brand/Model
    const saleBrands = monthlySales.reduce((acc: any, item: any) => {
        const brand = item.product.brand || item.product.name.split(" ")[0];
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
    }, {});
    const topBrand = Object.entries(saleBrands).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
    const topBrandSalesCount = Object.entries(saleBrands).sort((a: any, b: any) => b[1] - a[1])[0]?.[1];

    // 2. Check stock for top brand
    const topBrandStockCount = stockDevices.filter(d => (d.brand === topBrand || d.name.startsWith(topBrand))).length;

    // 3. Check International (Yurtdışı) Status
    const intlSold = monthlySales.filter(item => item.product.deviceInfo?.condition === "INTERNATIONAL").length;
    const intlInStock = stockDevices.filter(d => d.deviceInfo?.condition === "INTERNATIONAL").length;

    const strategicAdvice = topBrand
        ? `Son dönemde en çok ${topBrand} cihazları (${topBrandSalesCount} adet) sattınız. Mevcut ${topBrand} stoğunuz ${topBrandStockCount} adet ile sınırlı. Bu markaya odaklanmak karlılığınızı artıracaktır.`
        : "";

    const criticalWarning = intlSold > 0 && intlInStock < 2
        ? "Dükkanda şu an 'Yurtdışı' cihaz stoğunuz tükenmek üzere. Geçmişte talep gören bu kategoride acil alım yapmanız önerilir."
        : intlInStock === 0 && intlSold > 0
            ? "Yurtdışı cihaz satışlarınız olmasına rağmen şu an stoğunuzda hiç ürün bulunmuyor. Fırsatları kaçırıyor olabilirsiniz."
            : "";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="bg-card p-5 rounded-2xl flex flex-col gap-3 border border-border/60 shadow-lg cursor-pointer hover:border-purple-500/30 transition-all group overflow-hidden relative lg:min-h-[160px]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="text-[9px]  tracking-widest text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full z-10">AI ÖNERİSİ</div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="font-medium text-[32px]  text-foreground leading-none">{missingItems.length}</h3>
                        <p className="text-[11px] text-muted-foreground/80  tracking-wide mt-2">Eksik Stok Listesi</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 scale-150 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Sparkles className="h-40 w-40 text-purple-500" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-background border-border text-foreground p-0 overflow-hidden rounded-3xl">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/20">
                                <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
                            </div>
                            <div>
                                <DialogTitle className="font-medium text-2xl ">AI Stok Öngörüsü</DialogTitle>
                                <p className="text-sm text-muted-foreground font-medium">Satış trendlerine göre dükkanda olması gereken 'Eksik' listesi.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    {(strategicAdvice || criticalWarning) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {strategicAdvice && (
                                <div className="p-6 rounded-2xl bg-card/40 border border-border flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-purple-400" />
                                        <span className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest leading-none">Stratejik Öneri</span>
                                    </div>
                                    <p className="text-[13px] text-foreground/90  leading-relaxed pr-6">
                                        "{strategicAdvice}"
                                    </p>
                                    <div className="absolute -right-6 -top-6 opacity-10 group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                                        <Zap className="h-16 w-16 text-purple-500" />
                                    </div>
                                </div>
                            )}

                            {criticalWarning && (
                                <div className="p-6 rounded-2xl bg-card/40 border border-border flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                                        <span className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest leading-none">Kritik Uyarı</span>
                                    </div>
                                    <p className="text-[13px] text-foreground/90  leading-relaxed pr-6">
                                        "{criticalWarning}"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="font-medium text-xs  text-muted-foreground/80 uppercase tracking-widest pl-1">Eksik Stok Listesi (Talep Gelen/Satılan Ama Stokta Yok)</h4>
                        <div className="max-h-[360px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {missingItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-card/60 border border-border/60 hover:bg-muted/40 transition-all group translate-x-0 hover:translate-x-1 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:rotate-6 transition-all">
                                            <Smartphone className="h-6 w-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm  text-foreground leading-none">{item.productName}</p>
                                            <p className="text-[11px] text-muted-foreground/80  mt-1.5 uppercase tracking-tighter">
                                                En son <span className="text-purple-400/80">{item.color}</span> / <span className="text-purple-400/80">{item.storage}</span> modelini sattınız. <br />
                                                <span className="text-rose-500/70 text-[9px] ">ŞU AN STOKTA YOK!</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 pr-2">
                                        <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ChevronRight className="h-4 w-4 text-slate-700" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {missingItems.length === 0 && (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <Zap className="h-12 w-12 text-slate-800" />
                                    <p className="text-muted-foreground/80  text-sm">Stoklarınız şu an çok dengeli. Eksik listesi boş.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400  text-center">
                        💡 Bu öneriler son 30 günlük satış trendleriniz ve güncel stok durumunuz kıyaslanarak AI motoru tarafından oluşturulmuştur.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}






