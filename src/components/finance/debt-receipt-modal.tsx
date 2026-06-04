"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
import { getReceiptSettings } from "@/lib/actions/receipt-settings";

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
    initialShowPaid?: boolean;
    logoUrl?: string;
}

const ReceiptContent = ({ customer, debts, shopName, shopPhone, rates, showPaid, logoUrl, settings }: any) => {
    const unpaidDebts = debts.filter((d: any) => (d.type === 'DEBT' || !d.type) && !d.isPaid);

    const totalTRY = unpaidDebts
        .filter((d: any) => d.currency !== 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

    const totalUSD = unpaidDebts
        .filter((d: any) => d.currency === 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

    const currentUsdRate = Number(rates?.usd) || 34.5;
    const portfolioTotal = Math.ceil(totalTRY + (totalUSD * currentUsdRate));

    const unpaid = debts.filter((d: any) => (d.type === 'DEBT' || !d.type) && !d.isPaid);
    const earliestDate = (() => {
        if (unpaid.length === 0) return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sorted = [...unpaid].sort((a: any, b: any) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return da - db;
        });
        const first = new Date(sorted[0].createdAt);
        return !isNaN(first.getTime()) ? first : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    })();

    const displayDebts = debts.filter((d: any) => {
        if (showPaid) return true;
        if (d.type === 'PAYMENT') {
            const date = new Date(d.createdAt);
            if (isNaN(date.getTime())) return false;
            return date >= earliestDate;
        }
        return !d.isPaid;
    });

    const groups = displayDebts
        .sort((a: any, b: any) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return da - db;
        })
        .reduce((groups: any, item: any) => {
            const date = (() => {
                const d = new Date(item.createdAt);
                return !isNaN(d.getTime()) ? format(d, "dd MMM yyyy", { locale: tr }) : "-";
            })();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(item);
            return groups;
        }, {});

    const sortedDates = Object.keys(groups);
    const currentPaperSize = settings?.paperSize || "72mm";

    return (
        <div
            className={cn(
                "bg-white font-mono text-black relative",
                currentPaperSize === "58mm" ? "w-[58mm] p-1" :
                    currentPaperSize === "80mm" ? "w-[80mm] p-4" :
                        "w-[72mm] p-3"
            )}
            style={{ width: currentPaperSize, boxSizing: "border-box" }}
        >
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-black mb-4 mt-2">
                {/* Date in Flow */}
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-4 text-right">
                    {format(new Date(), "dd.MM.yyyy HH:mm", { locale: tr })}
                </div>
                {logoUrl && (
                    <div className="mb-2 flex justify-center">
                        <img src={logoUrl} alt="Logo" className="h-10 w-auto grayscale contrast-150" />
                    </div>
                )}
                <h1 className="text-lg font-black uppercase tracking-widest text-black mb-0.5">{shopName || "TELEFON DÜNYASI"}</h1>
                <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] mb-2">{settings?.subtitle || "HESAP EKSTRESİ"}</p>

                <div className="mt-2">
                    <p className="text-sm font-black text-black uppercase tracking-tight inline-block border-b-4 border-black pb-1">
                        {customer.name}
                    </p>
                </div>
            </div>

            {/* Table based List */}
            <div className="space-y-4 mb-6 min-h-[50px]">
                {sortedDates.map((date) => {
                    const dailyTRY = groups[date]
                        .filter((item: any) => item.type !== 'PAYMENT' && item.currency !== 'USD')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);
                    const dailyUSD = groups[date]
                        .filter((item: any) => item.type !== 'PAYMENT' && item.currency === 'USD')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);
                    const dailyPayment = groups[date]
                        .filter((item: any) => item.type === 'PAYMENT')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);

                    return (
                        <div key={date}>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-black uppercase tracking-[0.1em]">{date}</span>
                                    <div className="h-[1px] w-6 bg-slate-200" />
                                </div>
                                <div className="text-[9px] font-black text-black bg-slate-100 px-2 py-1 rounded-lg border border-slate-300 shadow-sm flex items-center gap-1.5">
                                    <span className="text-black text-[7px] tracking-widest uppercase">GÜNLÜK:</span>
                                    {dailyTRY > 0 && <span className="text-slate-900 font-black">₺{dailyTRY.toLocaleString('tr-TR')}</span>}
                                    {dailyTRY > 0 && dailyUSD > 0 && <span className="text-slate-400 font-normal">+</span>}
                                    {dailyUSD > 0 && (
                                        <span className="text-black font-black flex items-center gap-1">
                                            <span className="text-[6.5px] font-bold text-black">(~₺{(dailyUSD * currentUsdRate).toLocaleString('tr-TR', { maximumFractionDigits: 0 })})</span>
                                            ${dailyUSD.toLocaleString('tr-TR')}
                                        </span>
                                    )}
                                    {dailyPayment > 0 && <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 text-[8px]">(-₺{dailyPayment.toLocaleString('tr-TR')})</span>}
                                </div>
                            </div>

                            <table className="w-full border-collapse border border-slate-200 rounded-md overflow-hidden shadow-sm">
                                <thead>
                                    <tr className="bg-black text-[9px] font-black text-white uppercase tracking-widest border border-black">
                                        <th className="border border-white/40 px-2 py-1.5 text-left font-black">İŞLEM / DETAY</th>
                                        <th className="border border-white/40 px-2 py-1.5 text-right w-20 font-black">TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups[date].map((item: any, idx: number) => {
                                        const isDebt = item.type !== 'PAYMENT';
                                        return (
                                            <tr key={idx} className={cn(
                                                "transition-colors",
                                                !isDebt ? "bg-emerald-50" : "bg-white"
                                            )}>
                                                <td className="border border-slate-300 px-2 py-2 text-[10px] font-bold leading-tight">
                                                    <div className="flex items-start gap-1.5">
                                                        {!isDebt ? (
                                                            <TrendingDown className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                                        ) : (
                                                            <TrendingUp className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                                        )}
                                                        <div className={cn("flex flex-col gap-1", !isDebt ? "text-black italic" : "text-black")}>
                                                            <span className="text-black font-black uppercase text-[10px] leading-tight flex items-center gap-1.5 break-words whitespace-normal">
                                                                {(() => {
                                                                    const desc = item.description || item.notes || (isDebt ? 'Ürün/Hizmet' : 'Tahsilat');
                                                                    if (desc.includes('(Kurye Teslimatı)')) {
                                                                        return desc.replace('(Kurye Teslimatı)', '').trim();
                                                                    }
                                                                    return desc;
                                                                })()}
                                                                {item.isPaid && <span className="text-[6px] bg-emerald-100 text-emerald-700 px-1 rounded-sm">ÖDENDİ</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "border border-black px-2 py-2 text-[11px] font-black tabular-nums text-right align-middle",
                                                    !isDebt ? "text-black" : "text-black"
                                                )}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {item.currency === 'USD' && (
                                                            <span className="text-[8px] font-black text-black uppercase tracking-tighter">
                                                                (~₺{(Number(item.amount) * currentUsdRate).toLocaleString('tr-TR', { maximumFractionDigits: 0 })})
                                                            </span>
                                                        )}
                                                        <span>
                                                            {!isDebt && '-'}
                                                            {item.currency === 'USD' ? '$' : '₺'}
                                                            {Number(item.amount).toLocaleString('tr-TR')}
                                                        </span>
                                                    </div>
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
            <div className="mt-4 pt-3 border-t-2 border-black mb-2">
                <div className="space-y-0.5 text-[10px] font-black">
                    <div className="flex justify-between">
                        <span className="uppercase text-black">TL BORCU:</span>
                        <span className="tabular-nums text-black">₺{totalTRY.toLocaleString('tr-TR')}</span>
                    </div>
                    {totalUSD > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="uppercase text-black">USD BORCU:</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[8px] text-black font-black tracking-tighter">
                                    (~₺{(totalUSD * currentUsdRate).toLocaleString('tr-TR', { maximumFractionDigits: 1 })})
                                </span>
                                <span className="tabular-nums text-black">${totalUSD.toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-1.5 mt-1 border-t-2 border-black flex justify-between items-end">
                        <div className="flex flex-col gap-0">
                            <span className="text-[7px] font-black text-black uppercase tracking-tighter">KUR: $1 = ₺{currentUsdRate}</span>
                            <span className="text-xs font-black uppercase">🔴 GENEL TOPLAM:</span>
                        </div>
                        <span className="text-lg font-black tabular-nums leading-none">₺{portfolioTotal.toLocaleString('tr-TR')}</span>
                    </div>

                    {portfolioTotal <= 0 && (
                        <div className="mt-3 py-1.5 border border-slate-400 border-dashed text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest">HESAP KAPALIDIR / BORCU YOKTUR</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Section */}
            <div className="mt-8 text-center pt-4 border-t-2 border-dashed border-black">
                <p className="text-[10px] font-black text-black uppercase mb-1">{settings?.footer || "TEŞEKKÜRLER"}</p>
                <p className="text-[8px] font-black text-black opacity-60 italic">{settings?.website || "v2.basarteknik.com"}</p>
                <div className="w-8 h-0.5 bg-black mx-auto rounded-full mt-4" />
            </div>
        </div>
    );
};

export function DebtReceiptModal({ open, onClose, customer, debts, shopName, shopPhone, rates, initialShowPaid = false, logoUrl }: DebtReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPaid, setShowPaid] = useState(initialShowPaid);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (open) {
            getReceiptSettings("debt").then(setSettings);
        }
    }, [open]);

    const handlePrint = useCallback(() => {
        if (!receiptRef.current) return;

        const currentPaperSize = settings?.paperSize || "72mm";
        const content = receiptRef.current.innerHTML;
        const w = window.open("", "_blank");
        if (!w) return;

        w.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Borç Ekstresi - ${customer.name}</title>
                    <style>
                        @page { 
                            size: ${currentPaperSize} auto; 
                            margin: 0; 
                        }
                        html, body {
                            margin: 0;
                            padding: 0;
                            height: auto !important;
                            width: ${currentPaperSize};
                            background: white;
                            -webkit-print-color-adjust: exact;
                        }
                        body { 
                            font-family: 'Courier New', Courier, monospace;
                        }
                        .receipt-container { 
                            width: 100%;
                            padding: 0;
                            margin: 0;
                            display: block;
                            box-sizing: border-box;
                        }
                        
                        /* Layout Utilities */
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .justify-center { justify-content: center; }
                        .flex-col { flex-direction: column; }
                        .items-center { align-items: center; }
                        .items-start { align-items: flex-start; }
                        .items-end { align-items: flex-end; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .text-left { text-align: left; }
                        .font-black { font-weight: 900; }
                        .font-bold { font-weight: bold; }
                        .font-normal { font-weight: normal; }
                        .uppercase { text-transform: uppercase; }
                        .italic { font-style: italic; }
                        .mt-1 { margin-top: 2px; }
                        .mt-2 { margin-top: 4px; }
                        .mt-3 { margin-top: 6px; }
                        .mt-4 { margin-top: 10px; }
                        .mt-8 { margin-top: 20px; }
                        .mb-0\\.5 { margin-bottom: 2px; }
                        .mb-1 { margin-bottom: 2px; }
                        .mb-1\\.5 { margin-bottom: 3px; }
                        .mb-2 { margin-bottom: 4px; }
                        .mb-4 { margin-bottom: 8px; }
                        .mb-6 { margin-bottom: 12px; }
                        .pb-1 { padding-bottom: 2px; }
                        .pb-4 { padding-bottom: 8px; }
                        .pt-1\\.5 { padding-top: 3px; }
                        .pt-3 { padding-top: 6px; }
                        .pt-4 { padding-top: 10px; }
                        .px-1 { padding-left: 2px; padding-right: 2px; }
                        .px-2 { padding-left: 4px; padding-right: 4px; }
                        .py-0\\.5 { padding-top: 1px; padding-bottom: 1px; }
                        .py-1 { padding-top: 2px; padding-bottom: 2px; }
                        .py-1\\.5 { padding-top: 3px; padding-bottom: 3px; }
                        .py-2 { padding-top: 4px; padding-bottom: 4px; }
                        .p-4 { padding: 4mm; }
                        .p-3 { padding: 3mm; }
                        .p-1 { padding: 1mm; }
                        .gap-0 { gap: 0; }
                        .gap-1 { gap: 2px; }
                        .gap-0\\.5 { gap: 1px; }
                        .gap-1\\.5 { gap: 3px; }
                        .gap-2 { gap: 4px; }
                        .space-y-0\\.5 > * + * { margin-top: 1px; }
                        .space-y-4 > * + * { margin-top: 8px; }
                        .border-b-2 { border-bottom: 1.5px solid black; }
                        .border-b-4 { border-bottom: 3px solid black; }
                        .border-t-2 { border-top: 1.5px solid black; }
                        .border { border: 1px solid #e2e8f0; }
                        .border-black { border-color: black; }
                        .border-white\\/40 { border-color: rgba(255, 255, 255, 0.4); }
                        .border-dashed { border-style: dashed; }
                        .border-collapse { border-collapse: collapse; }
                        .w-full { width: 100%; }
                        .w-3 { width: 12px; }
                        .w-6 { width: 24px; }
                        .w-8 { width: 32px; }
                        .w-20 { width: 80px; }
                        .h-3 { height: 12px; }
                        .h-0\\.5 { height: 2px; }
                        .h-\\[1px\\] { height: 1px; }
                        .h-10 { height: 35px; }
                        .min-h-\\[50px\\] { min-height: 50px; }
                        .grayscale { filter: grayscale(1); }
                        .contrast-150 { filter: contrast(1.5); }
                        .tabular-nums { font-variant-numeric: tabular-nums; }
                        .mx-auto { margin-left: auto; margin-right: auto; }
                        .rounded-full { border-radius: 9999px; }
                        .rounded-sm { border-radius: 2px; }
                        .rounded-md { border-radius: 4px; }
                        .rounded-lg { border-radius: 6px; }
                        .overflow-hidden { overflow: hidden; }
                        .shrink-0 { flex-shrink: 0; }
                        .inline-block { display: inline-block; }
                        .break-words { word-break: break-word; }
                        .whitespace-normal { white-space: normal; }
                        .whitespace-nowrap { white-space: nowrap; }
                        .align-middle { vertical-align: middle; }
                        .relative { position: relative; }
                        .absolute { position: absolute; }
                        .top-4 { top: 8px; }
                        .right-4 { right: 8px; }
                        .opacity-60 { opacity: 0.6; }

                        .bg-white { background: white; }
                        .bg-black { background: black; }
                        .bg-slate-100 { background: #f1f5f9; }
                        .bg-emerald-50 { background: #ecfdf5; }
                        .bg-emerald-100 { background: #d1fae5; }
                        .text-white { color: white; }
                        .text-black { color: black; }
                        .text-slate-400 { color: #94a3b8; }
                        .text-slate-900 { color: #0f172a; }
                        .text-emerald-600 { color: #059669; }
                        .text-emerald-700 { color: #047857; }
                        .text-rose-600 { color: #e11d48; }
                        .border-slate-200 { border-color: #e2e8f0; }
                        .border-slate-300 { border-color: #cbd5e1; }
                        .border-slate-400 { border-color: #94a3b8; }
                        .border-emerald-100 { border-color: #d1fae5; }
                        .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

                        /* Absolute Font Sizes for Thermal Printers */
                        .text-lg { font-size: 11pt !important; }
                        .text-sm { font-size: 10pt !important; }
                        .text-xs { font-size: 9pt !important; }
                        .text-\\[6px\\] { font-size: 5pt !important; }
                        .text-\\[6\\.5px\\] { font-size: 5.5pt !important; }
                        .text-\\[7px\\] { font-size: 6pt !important; }
                        .text-\\[8px\\] { font-size: 7pt !important; }
                        .text-\\[9px\\] { font-size: 7.5pt !important; }
                        .text-\\[10px\\] { font-size: 8.5pt !important; }
                        .text-\\[11px\\] { font-size: 9.5pt !important; }
                        
                        .leading-tight { line-height: 1.1; }
                        .leading-none { line-height: 1; }
                        .tracking-widest { letter-spacing: 0.1em; }
                        .tracking-tighter { letter-spacing: -0.05em; }
                        .tracking-tight { letter-spacing: -0.025em; }
                        .tracking-\\[0\\.1em\\] { letter-spacing: 0.1em; }
                        .tracking-\\[0\\.3em\\] { letter-spacing: 0.3em; }

                        /* SVG icons in print */
                        svg { display: none !important; }

                        @media print {
                            body { background: white; }
                            .print-hide { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        ${content}
                    </div>
                </body>
            </html>
        `);

        w.document.close();
        setTimeout(() => {
            w.print();
            w.close();
        }, 300);
    }, [settings?.paperSize, customer.name]);

    const generateImage = useCallback(async () => {
        if (!receiptRef.current) return null;
        setIsGenerating(true);
        try {
            const html2canvasModule = await import("html2canvas");
            const html2canvas = html2canvasModule.default;
            const canvas = await html2canvas(receiptRef.current, {
                scale: 4,
                backgroundColor: "#ffffff",
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('.font-mono') as HTMLElement;
                    if (el) el.style.fontFamily = "'Courier New', monospace";
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
                    <div className="max-h-[55vh] overflow-y-auto rounded-3xl border border-border bg-white shadow-2xl custom-scrollbar shadow-black/5 flex justify-center py-8">
                        <div ref={receiptRef}>
                            <ReceiptContent
                                customer={customer}
                                debts={debts}
                                shopName={settings?.title || shopName}
                                shopPhone={settings?.phone || shopPhone}
                                rates={rates}
                                showPaid={showPaid}
                                logoUrl={settings?.logoUrl || logoUrl}
                                settings={settings}
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
