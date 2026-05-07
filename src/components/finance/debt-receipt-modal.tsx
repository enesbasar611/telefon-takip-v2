"use client";

import { useRef, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Download,
    Printer,
    MessageCircle,
    Receipt,
    CheckCircle2,
    TrendingDown,
    TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

interface DebtReceiptModalProps {
    open: boolean;
    onClose: () => void;
    customer: {
        id: string;
        name: string;
        phone?: string;
    };
    debts: any[];
    shopName?: string;
    shopPhone?: string;
    rates?: {
        usd: number;
    };
}

const ReceiptContent = ({ customer, debts, shopName, shopPhone, rates }: any) => {
    // Only count DEBT types for totals, as transactions/payments are subtracted from balance
    const totalTRY = debts
        .filter((d: any) => d.type === 'DEBT' && d.currency !== 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

    const totalUSD = debts
        .filter((d: any) => d.type === 'DEBT' && d.currency === 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

    const portfolioTotal = Math.ceil(totalTRY + (totalUSD * (rates?.usd || 32.5)));

    // Group items by date
    const groupedItems = debts.reduce((groups: any, item: any) => {
        const date = format(new Date(item.createdAt), "dd MMM yyyy", { locale: tr });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {});

    return (
        <div className="bg-white p-10 w-[420px] font-sans text-slate-900 relative">
            {/* Top Right Date */}
            <div className="absolute top-6 right-8 text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                {format(new Date(), "dd.MM.yyyy HH:mm", { locale: tr })}
            </div>

            {/* Header */}
            <div className="text-center pb-6 border-b-2 border-dashed border-slate-100 mb-8">
                <h1 className="text-xl font-black uppercase tracking-widest text-slate-950 mb-1">{shopName || "TELEFON DÜNYASI"}</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">HESAP EKSTRESİ</p>

                <div className="mt-4">
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight inline-block border-b-2 border-indigo-600 pb-1">
                        {customer.name}
                    </p>
                </div>
            </div>

            {/* Table based List */}
            <div className="space-y-8 mb-10 min-h-[100px]">
                {Object.keys(groupedItems).map((date) => {
                    const dailyTRY = groupedItems[date]
                        .filter((item: any) => item.type === 'DEBT' && item.currency !== 'USD')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);
                    const dailyUSD = groupedItems[date]
                        .filter((item: any) => item.type === 'DEBT' && item.currency === 'USD')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);
                    const dailyPayment = groupedItems[date]
                        .filter((item: any) => item.type === 'PAYMENT')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);

                    return (
                        <div key={date}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{date}</span>
                                    <div className="h-[2px] w-8 bg-slate-50" />
                                </div>
                                <div className="text-[10px] font-black text-slate-950 bg-slate-100/80 px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                    <span className="text-slate-400 text-[8px] tracking-widest uppercase">GÜNLÜK:</span>
                                    {dailyTRY > 0 && <span className="text-slate-900 font-black">₺{dailyTRY.toLocaleString('tr-TR')}</span>}
                                    {dailyTRY > 0 && dailyUSD > 0 && <span className="text-slate-400 font-normal">+</span>}
                                    {dailyUSD > 0 && <span className="text-blue-600 font-black">${dailyUSD.toLocaleString('tr-TR')}</span>}
                                    {dailyPayment > 0 && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1 text-[9px]">(- ₺{dailyPayment.toLocaleString('tr-TR')} Ödeme)</span>}
                                </div>
                            </div>

                            <table className="w-full border-collapse border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="border border-slate-200 px-4 py-2 text-left">İŞLEM / DETAY</th>
                                        <th className="border border-slate-200 px-4 py-2 text-right w-24">TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedItems[date].map((item: any, idx: number) => (
                                        <tr key={idx} className={cn(
                                            "transition-colors",
                                            item.type === 'PAYMENT' ? "bg-emerald-50/20" : "bg-white hover:bg-slate-50/50"
                                        )}>
                                            <td className="border border-slate-200 px-4 py-3 text-xs font-bold leading-tight">
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'PAYMENT' ? (
                                                        <TrendingDown className="w-3 h-3 text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <TrendingUp className="w-3 h-3 text-rose-500 shrink-0" />
                                                    )}
                                                    <div className={cn("flex flex-col gap-1", item.type === 'PAYMENT' ? "text-emerald-700 font-black italic" : "text-slate-700")}>
                                                        {(item.notes || (item.type === 'PAYMENT' ? 'Tahsilat' : 'Ürün/Hizmet')).split(',').map((note: string, nIdx: number) => (
                                                            <span key={nIdx} className="block">{note.trim()}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={cn(
                                                "border border-slate-200 px-4 py-3 text-sm font-black tabular-nums text-right",
                                                item.type === 'PAYMENT' ? "text-emerald-600" : (item.currency === 'USD' ? "text-blue-600" : "text-slate-950")
                                            )}>
                                                {item.type === 'PAYMENT' ? '-' : (item.currency === 'USD' ? '$' : '₺')}
                                                {Number(item.amount).toLocaleString('tr-TR')}
                                                {item.type === 'PAYMENT' && <span className="text-[10px] ml-0.5">₺</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            {/* Totals Section */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200">
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">TL BORCU</span>
                        <span className="font-black text-slate-900 tabular-nums">₺{totalTRY.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">USD BORCU</span>
                        <span className="font-black text-blue-600 tabular-nums">${totalUSD.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">GENEL KUR: $1 = ₺{rates?.usd || '32.5'}</span>
                                <span className="block text-xs font-black text-slate-900 uppercase">GENEL TOPLAM</span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-950 tabular-nums">₺{portfolioTotal.toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                    </div>

                    {portfolioTotal <= 0 && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">HESAP KAPALIDIR / BORCU YOKTUR</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Minimal Footer */}
            <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] mb-1">{shopName}</p>
                {shopPhone && <p className="text-[9px] font-bold text-slate-300 italic">{shopPhone}</p>}
                <div className="w-12 h-1 bg-indigo-600 mx-auto rounded-full mt-6" />
            </div>
        </div>
    );
};

export function DebtReceiptModal({ open, onClose, customer, debts, shopName, shopPhone, rates }: DebtReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateImage = useCallback(async () => {
        if (!receiptRef.current) return null;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 3,
                backgroundColor: "#ffffff",
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('.font-sans') as HTMLElement;
                    if (el) el.style.fontFamily = "Inter, system-ui, sans-serif";
                }
            });
            return new Promise<Blob | null>((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
            });
        } catch (err) {
            console.error("Receipt generation failed", err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const handleDownload = useCallback(async () => {
        const blob = await generateImage();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ekstre-${customer.name.replace(/\s+/g, "-")}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [generateImage, customer.name]);

    const handleWhatsApp = useCallback(async () => {
        const phoneClean = customer.phone?.replace(/[^0-9]/g, "") || "";
        const waUrl = phoneClean
            ? `https://wa.me/90${phoneClean.replace(/^0/, "")}`
            : "https://web.whatsapp.com";

        const waWindow = window.open(waUrl, "_blank");

        const blob = await generateImage();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ekstre-${customer.name}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        if (waWindow) waWindow.focus();
    }, [generateImage, customer]);

    const handlePrint = useCallback(async () => {
        const blob = await generateImage();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head><title>Borç Ekstresi</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;padding:20px;background:#f0f0f0}
img{max-width:420px;border-radius:12px;box-shadow:0 4px 30px rgba(0,0,0,0.15)}
@media print{body{background:white;padding:0}img{max-width:100%;box-shadow:none;border-radius:0}@page{margin:0;size:80mm auto}}</style>
</head><body><img src="${url}" /></body></html>`);
        w.document.close();
        setTimeout(() => { w.print(); }, 500);
    }, [generateImage]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[500px] p-0 gap-0 bg-background border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Header Action Bar */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/10 bg-muted/20 pr-16 text-foreground">
                    <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest">{customer.name} - EKSTRE</h2>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="bg-muted/10 p-8">
                    <div className="max-h-[55vh] overflow-y-auto rounded-3xl border border-border bg-white shadow-2xl custom-scrollbar shadow-black/5">
                        <div ref={receiptRef}>
                            <ReceiptContent customer={customer} debts={debts} shopName={shopName} shopPhone={shopPhone} rates={rates} />
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-8 grid grid-cols-3 gap-4 bg-muted/20 border-t border-border/10">
                    <Button variant="outline" onClick={handleDownload} disabled={isGenerating} className="h-16 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                        <Download className="h-4 w-4" /> İNDİR
                    </Button>
                    <Button variant="outline" onClick={handlePrint} disabled={isGenerating} className="h-16 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                        <Printer className="h-4 w-4" /> YAZDIR
                    </Button>
                    <Button onClick={handleWhatsApp} disabled={isGenerating} className="h-16 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                        <MessageCircle className="h-5 w-5" /> WHATSAPP
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
