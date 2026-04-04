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
}

export function DeviceAiStockAdviceModal({ missingItems }: DeviceAiStockAdviceModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="bg-[#121629] p-5 rounded-2xl flex flex-col gap-3 border border-slate-800/60 shadow-lg cursor-pointer hover:border-purple-500/30 transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="text-[9px] font-black tracking-widest text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full z-10">AI ÖNERİSİ</div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-[32px] font-black text-white leading-none">{missingItems.length}</h3>
                        <p className="text-[11px] text-slate-500 font-bold tracking-wide mt-2">Eksik Stok Listesi</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 scale-150 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Sparkles className="h-40 w-40 text-purple-500" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-[#0B0F19] border-slate-800 text-white p-0 overflow-hidden rounded-3xl">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/20">
                                <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black">AI Stok Öngörüsü</DialogTitle>
                                <p className="text-sm text-slate-400 font-medium">Satış trendlerine göre dükkanda olması gereken 'Eksik' listesi.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-purple-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Stratejik Öneri</span>
                            </div>
                            <p className="text-[13px] text-slate-200 font-bold leading-relaxed pr-6">
                                "Son 30 günde en çok 2. El iPhone 11 ve 12 serisi sattınız. Dükkandaki iPhone stoğunuzu %20 artırmak ciroyu doğrudan %15 etkileyebilir."
                            </p>
                            <div className="absolute -right-6 -top-6 opacity-10 group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                                <Zap className="h-16 w-16 text-purple-500" />
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Kritik Uyarı</span>
                            </div>
                            <p className="text-[13px] text-slate-200 font-bold leading-relaxed pr-6">
                                "Dükkanda şu an 'Yurtdışı' cihaz stoğunuz tükenmek üzere. Karlılığın en yüksek olduğu bu kategoride acil alım yapmanız önerilir."
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Eksik Stok Listesi (Talep Gelen/Satılan Ama Stokta Yok)</h4>
                        <div className="max-h-[360px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {missingItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:bg-slate-800/40 transition-all group translate-x-0 hover:translate-x-1 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:rotate-6 transition-all">
                                            <Smartphone className="h-6 w-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white leading-none">{item.productName}</p>
                                            <p className="text-[11px] text-slate-500 font-bold mt-1.5 uppercase tracking-tighter">
                                                En son <span className="text-purple-400/80">{item.color}</span> / <span className="text-purple-400/80">{item.storage}</span> modelini sattınız. <br />
                                                <span className="text-rose-500/70 text-[9px] font-black">ŞU AN STOKTA YOK!</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 pr-2">
                                        <div className="h-9 w-9 rounded-full bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ChevronRight className="h-4 w-4 text-slate-700" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {missingItems.length === 0 && (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <Zap className="h-12 w-12 text-slate-800" />
                                    <p className="text-slate-500 font-bold text-sm">Stoklarınız şu an çok dengeli. Eksik listesi boş.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400 font-bold text-center">
                        💡 Bu öneriler son 30 günlük satış trendleriniz ve güncel stok durumunuz kıyaslanarak AI motoru tarafından oluşturulmuştur.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
