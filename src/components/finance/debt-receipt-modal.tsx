"use client";

import { useRef, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Download,
    Printer,
    MessageCircle,
    Receipt,
    TrendingUp,
    TrendingDown,
    Eye,
    EyeOff
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

const ReceiptContent = ({ customer, debts, shopName, shopPhone, rates, showPaid }: any) => {
    // Totals always show current balance (unpaid only)
    const unpaidDebts = debts.filter((d: any) => d.type === 'DEBT' && !d.isPaid);

    const totalTRY = unpaidDebts
        .filter((d: any) => d.currency !== 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

    const totalUSD = unpaidDebts
        .filter((d: any) => d.currency === 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

    const portfolioTotal = Math.ceil(totalTRY + (totalUSD * (rates?.usd || 32.5)));

    // Filter items to display based on showPaid
    // If showPaid is false, only show UNPAID DEBTS (exclude payments and paid debts)
    const displayDebts = showPaid ? debts : debts.filter((d: any) => d.type === 'DEBT' && !d.isPaid);

    // Group items by date
    const groupedItems = displayDebts.reduce((groups: any, item: any) => {
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
                                    {groupedItems[date].map((item: any, idx: number) => {
                                        const isDebt = item.type !== 'PAYMENT';
                                        return (
                                            <tr key={idx} className={cn(
                                                "transition-colors",
                                                !isDebt ? "bg-emerald-50/20" : "bg-white hover:bg-slate-50/50"
                                            )}>
                                                <td className="border border-slate-200 px-4 py-3 text-xs font-bold leading-tight">
                                                    <div className="flex items-center gap-2">
                                                        {!isDebt ? (
                                                            <TrendingDown className="w-3 h-3 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <TrendingUp className="w-3 h-3 text-rose-500 shrink-0" />
                                                        )}
                                                        <div className={cn("flex flex-col gap-1", !isDebt ? "text-emerald-700 font-black italic" : "text-slate-700")}>
                                                            <span className="text-slate-900 font-extrabold uppercase truncate max-w-[140px] text-[11px] leading-tight flex items-center gap-2">
                                                                {item.description || item.notes || (isDebt ? 'Ürün/Hizmet' : 'Tahsilat')}
                                                                {item.isPaid && <span className="text-[7px] bg-emerald-100 text-emerald-600 px-1 rounded-sm">ÖDENDİ</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "border border-slate-200 px-4 py-3 text-sm font-black tabular-nums text-right",
                                                    !isDebt ? "text-emerald-600" : (item.currency === 'USD' ? "text-blue-600" : "text-slate-950")
                                                )}>
                                                    {!isDebt ? '-' : (item.currency === 'USD' ? '$' : '₺')}
                                                    {Number(item.amount).toLocaleString('tr-TR')}
                                                    {!isDebt && <span className="text-[10px] ml-0.5">₺</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            {/* Totals Section */}
            <div className="mt-8 pt-6 border-t border-black border-dashed">
                <div className="space-y-1 text-[11px] font-bold">
                    <div className="flex justify-between">
                        <span className="uppercase">TL BORCU:</span>
                        <span className="tabular-nums">₺{totalTRY.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="uppercase">USD BORCU:</span>
                        <span className="tabular-nums">${totalUSD.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="pt-2 mt-1 border-t border-black border-dashed flex justify-between items-end">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[7px] font-medium opacity-70 uppercase tracking-tighter">KUR: $1 = ₺{rates?.usd || '32.5'}</span>
                            <span className="text-sm font-black uppercase">GENEL TOPLAM:</span>
                        </div>
                        <span className="text-xl font-black tabular-nums">₺{portfolioTotal.toLocaleString('tr-TR')}</span>
                    </div>

                    {portfolioTotal <= 0 && (
                        <div className="mt-4 py-2 border border-black border-dashed text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">HESAP KAPALIDIR / BORCU YOKTUR</span>
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
    const [showPaid, setShowPaid] = useState(false);

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
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/10 bg-muted/20 pr-14 text-foreground relative">
                    <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest">{customer.name} - EKSTRE</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPaid(!showPaid)}
                        className={cn(
                            "rounded-xl gap-2 text-[9px] font-black uppercase tracking-widest h-10 px-4",
                            showPaid ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20"
                        )}
                    >
                        {showPaid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {showPaid ? "Ödenmişleri Gizle" : "Ödenmişleri Göster"}
                    </Button>
                </div>

                {/* Preview Area */}
                <div className="bg-muted/10 p-8">
                    <div className="max-h-[55vh] overflow-y-auto rounded-3xl border border-border bg-white shadow-2xl custom-scrollbar shadow-black/5">
                        <div ref={receiptRef}>
                            <ReceiptContent
                                customer={customer}
                                debts={debts}
                                shopName={shopName}
                                shopPhone={shopPhone}
                                rates={rates}
                                showPaid={showPaid}
                            />
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
