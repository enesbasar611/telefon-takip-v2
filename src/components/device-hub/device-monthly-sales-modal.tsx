"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { BarChart3, TrendingUp, Calendar, Zap, Smartphone, ChevronRight } from "lucide-react";
import { DeviceSalesChart } from "./device-sales-chart";

interface DeviceMonthlySalesModalProps {
    monthlyTotal: number;
    monthlyCount: number;
    chartData: any[];
    items: any[];
    comparisonHtml?: React.ReactNode;
}

export function DeviceMonthlySalesModal({ monthlyTotal, monthlyCount, chartData, items, comparisonHtml }: DeviceMonthlySalesModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="bg-card p-5 rounded-2xl flex flex-col gap-3 border border-border/60 shadow-lg cursor-pointer hover:border-emerald-500/30 transition-all group lg:min-h-[160px]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div className="text-[9px]  tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">BU AY</div>
                    </div>
                    <div className="mt-1">
                        <h3 className="font-medium text-[24px]  text-foreground leading-none tracking-tight">{monthlyTotal.toLocaleString("tr-TR")} ₺</h3>
                        {comparisonHtml}
                        <p className="text-[11px] text-muted-foreground/80  tracking-wide mt-2">{monthlyCount} Cihaz Satıldı</p>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-background border-border text-foreground p-0 overflow-hidden rounded-3xl">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <BarChart3 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <DialogTitle className="font-medium text-2xl ">Aylık Satış Analizi</DialogTitle>
                                <p className="text-sm text-muted-foreground font-medium">Bu dönemdeki performans verileri ve cihaz detayları.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-6 rounded-2xl bg-card/40 border border-border flex flex-col gap-1">
                            <span className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest underline decoration-emerald-500/50 underline-offset-4 mb-1">Toplam Ciro</span>
                            <span className="text-2xl  text-foreground">{monthlyTotal.toLocaleString("tr-TR")} ₺</span>
                            <span className="text-[10px] text-emerald-400  mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Hedefin %85'i</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-card/40 border border-border flex flex-col gap-1">
                            <span className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest underline decoration-blue-500/50 underline-offset-4 mb-1">Satılan Cihaz</span>
                            <span className="text-2xl  text-foreground">{monthlyCount} Adet</span>
                            <span className="text-[10px] text-blue-400  mt-1 flex items-center gap-1"><Zap className="h-3 w-3" /> Verimli Ay</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-card/40 border border-border flex flex-col gap-1">
                            <span className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest underline decoration-purple-500/50 underline-offset-4 mb-1">Ortalama Fiyat</span>
                            <span className="text-2xl  text-foreground">{monthlyCount > 0 ? (monthlyTotal / monthlyCount).toLocaleString("tr-TR", { maximumFractionDigits: 0 }) : 0} ₺</span>
                            <span className="text-[10px] text-purple-400  mt-1">Cihaz Başına</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-xs  text-muted-foreground/80 uppercase tracking-widest">Satış Grafiği (Son 7 Gün)</h4>
                        <div className="p-6 rounded-2xl bg-card/40 border border-border h-[240px]">
                            <DeviceSalesChart data={chartData} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-xs  text-muted-foreground/80 uppercase tracking-widest">Satılan Cihaz Listesi</h4>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card/60 border border-border/60 hover:bg-muted/40 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <Smartphone className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm  text-foreground leading-none">{item.product.name}</p>
                                            <p className="text-[10px] text-muted-foreground/80  mt-1 tracking-tight">IMEI: {item.product.deviceInfo?.imei?.slice(-4)}... | {new Date(item.sale.createdAt).toLocaleDateString("tr-TR")}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm  text-emerald-400">{item.totalPrice.toLocaleString("tr-TR")} ₺</p>
                                        <p className="text-[9px] text-slate-600  uppercase tracking-tighter">İşlem Tamam</p>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="p-10 text-center text-muted-foreground/80  text-sm">Bu ay henüz satış yapılmadı.</div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}






