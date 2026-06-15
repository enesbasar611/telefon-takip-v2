"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ClipboardList, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { useEffect, useState, useRef, useCallback } from "react";

interface StockReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: any[];
}

export function StockReceiptModal({ isOpen, onClose, items }: StockReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            getReceiptSettings("stock").then(setSettings);
        }
    }, [isOpen]);

    const currentPaperSize = settings?.paperSize || "72mm";

    const handlePrint = useCallback(() => {
        if (!receiptRef.current) return;

        const content = receiptRef.current.innerHTML;
        const w = window.open("", "_blank");
        if (!w) return;

        w.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Eksik Listesi</title>
                    <style>
                        @page { 
                            size: ${currentPaperSize} auto; 
                            margin: 0; 
                        }
                        html, body {
                            margin: 0;
                            padding: 0;
                            height: auto !important;
                            min-height: 0 !important;
                            width: ${currentPaperSize};
                            background: white;
                            overflow: hidden;
                            -webkit-print-color-adjust: exact;
                        }
                        body { 
                            font-family: 'Courier New', Courier, monospace;
                        }
                        .receipt-container { 
                            width: 100%;
                            padding: 2mm 4mm;
                            box-sizing: border-box;
                            background: white;
                            color: black;
                            margin: 0;
                            display: block;
                            page-break-inside: avoid;
                            page-break-after: avoid;
                            page-break-before: avoid;
                        }
                        
                        /* Layout Utilities */
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .justify-center { justify-content: center; }
                        .items-center { align-items: center; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-black { font-weight: 900; }
                        .uppercase { text-transform: uppercase; }
                        .mt-0\\.5 { margin-top: 2px; }
                        .mt-1 { margin-top: 2px; }
                        .mt-6 { margin-top: 14px; }
                        .mb-1 { margin-bottom: 2px; }
                        .mb-3 { margin-bottom: 6px; }
                        .pb-1 { padding-bottom: 2px; }
                        .pb-3 { padding-bottom: 6px; }
                        .pt-3 { padding-top: 6px; }
                        .py-1 { padding-top: 2px; padding-bottom: 2px; }
                        .gap-1 { gap: 2px; }
                        .border-b-2 { border-bottom: 1.5px solid black; }
                        .border-t-2 { border-top: 1.5px solid black; }
                        .border-b { border-bottom: 1px solid rgba(0,0,0,0.1); }
                        .border-dashed { border-style: dashed; }
                        .w-full { width: 100%; }
                        .grayscale { filter: grayscale(1); }
                        .contrast-150 { filter: contrast(1.5); }
                        .h-8 { height: 28px; }
                        .col-span-2 { grid-column: span 2; }
                        .col-span-8 { grid-column: span 8; }
                        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                        .space-y-1 > * + * { margin-top: 2px; }
                        .grid { display: grid; }
                        .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

                        /* Absolute Font Sizes for Thermal Printers */
                        .text-sm { font-size: 10pt !important; }
                        .text-xs { font-size: 9pt !important; }
                        .text-\\[8px\\] { font-size: 7pt !important; }
                        .text-\\[9px\\] { font-size: 7.5pt !important; }
                        .text-\\[10px\\] { font-size: 8.5pt !important; }
                        
                        .tracking-wider { letter-spacing: 0.05em; }
                        .tracking-widest { letter-spacing: 0.1em; }
                        .leading-tight { line-height: 1.1; }

                        @media print {
                            body { background: white; }
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
    }, [currentPaperSize]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card border-none p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-blue-500/10 border-b border-blue-500/10 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                        <ClipboardList className="h-8 w-8 text-blue-500" />
                    </div>
                    <DialogTitle className="font-medium text-2xl  text-white">EKSİK LİSTESİ</DialogTitle>
                    <p className="text-[10px]  text-blue-400 mt-2 tracking-[0.2em]">TEDARİK VE SATIN ALMA FORMU</p>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Date Info */}
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground/80" />
                            <span className="text-[10px]  text-muted-foreground/80">OLUŞTURULMA TARİHİ</span>
                        </div>
                        <p className="text-xs font-extrabold text-foreground">{format(new Date(), "dd MMM yyyy HH:mm", { locale: tr })}</p>
                    </div>

                    {/* Thermal Preview */}
                    <div className="bg-slate-50 dark:bg-slate-900/20 p-4 flex justify-center rounded-2xl border border-border/40">
                        <div
                            ref={receiptRef}
                            className={`receipt-preview bg-white text-black p-4 font-mono shadow-xl ${currentPaperSize === "58mm" ? "w-[58mm]" :
                                currentPaperSize === "80mm" ? "w-[80mm]" :
                                    "w-[72mm]"
                                }`}
                            style={{ width: currentPaperSize }}
                        >
                            <div className="text-center border-b-2 border-black pb-3 mb-3">
                                {settings?.logoUrl && (
                                    <div className="mb-2 flex justify-center">
                                        <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                                    </div>
                                )}
                                <h3 className="font-black text-sm uppercase">{settings?.title || "BAŞAR TEKNİK"}</h3>
                                <p className="font-black text-[9px] mt-0.5 uppercase tracking-wider">{settings?.subtitle || "EKSİK ÜRÜN & TEDARİK LİSTESİ"}</p>
                                <p className="font-black text-[9px] mt-1">Tel: {settings?.phone}</p>
                            </div>

                            <div className="mb-3">
                                <div className="grid grid-cols-12 gap-1 border-b-2 border-black pb-1 mb-1 text-[9px] font-black">
                                    <span className="col-span-8">ÜRÜN ADI</span>
                                    <span className="col-span-2 text-center">MEV</span>
                                    <span className="col-span-2 text-right">ALIN</span>
                                </div>
                                <div className="space-y-1">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-1 py-1 border-b border-black/10 last:border-0 items-center text-[10px] font-black">
                                            <span className="col-span-8 truncate uppercase">{item.name}</span>
                                            <span className="col-span-2 text-center">{item.product?.stock || 0}</span>
                                            <span className="col-span-2 text-right">{item.quantity || 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center mt-6 pt-3 border-t-2 border-black border-dashed">
                                <p className="font-black text-[10px] uppercase">{settings?.footer || "Tedarik Listesi Otomatik Oluşturulmuştur"}</p>
                                <p className="text-[8px] font-black mt-1 uppercase">{settings?.website || "v2.basarteknik.com"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-card/50 border-t border-border/50 gap-3">
                    <Button variant="ghost" onClick={onClose} className="h-12 rounded-xl  text-muted-foreground/80 hover:text-white hover:bg-white/5">Kapat</Button>
                    <Button onClick={handlePrint} className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-black  gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Printer className="h-4 w-4" />
                        LİSTEYİ YAZDIR
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
