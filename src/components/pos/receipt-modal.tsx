"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, Calendar, CreditCard, Download } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { useEffect, useState, useRef, useCallback } from "react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  const [settings, setSettings] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getReceiptSettings("pos").then(setSettings);
    }
  }, [isOpen]);

  const currentPaperSize = settings?.paperSize || "72mm";

  const handlePrint = useCallback(() => {
    if (!sale || !receiptRef.current) return;

    const content = receiptRef.current.innerHTML;
    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Satış Fişi - ${sale.saleNumber}</title>
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
              padding: 2mm 4mm;
              box-sizing: border-box;
              background: white;
              color: black;
              margin: 0;
              display: block;
            }
            
            /* Layout Utilities */
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .flex-col { flex-direction: column; }
            .flex-1 { flex: 1; }
            .items-center { align-items: center; }
            .items-baseline { align-items: baseline; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .mt-0\\.5 { margin-top: 2px; }
            .mt-1 { margin-top: 2px; }
            .mb-1 { margin-bottom: 2px; }
            .mb-2 { margin-bottom: 4px; }
            .mb-3 { margin-bottom: 6px; }
            .pb-3 { padding-bottom: 6px; }
            .pt-1 { padding-top: 2px; }
            .pt-3 { padding-top: 6px; }
            .gap-2 { gap: 4px; }
            .border-b-2 { border-bottom: 1.5px solid black; }
            .border-t-2 { border-top: 1.5px solid black; }
            .border-dashed { border-style: dashed; }
            .w-full { width: 100%; }
            .w-20 { width: 80px; }
            .shrink-0 { flex-shrink: 0; }
            .break-words { word-break: break-word; }
            .whitespace-normal { white-space: normal; }
            .whitespace-nowrap { white-space: nowrap; }
            .grayscale { filter: grayscale(1); }
            .contrast-150 { filter: contrast(1.5); }
            .h-10 { height: 35px; }
            .space-y-1 > * + * { margin-top: 2px; }
            .space-y-1\\.5 > * + * { margin-top: 3px; }

            /* Absolute Font Sizes for Thermal Printers */
            .text-lg { font-size: 11pt !important; }
            .text-sm { font-size: 10pt !important; }
            .text-xs { font-size: 9pt !important; }
            .text-\\[8px\\] { font-size: 7pt !important; }
            .text-\\[9px\\] { font-size: 7.5pt !important; }
            .text-\\[10px\\] { font-size: 8.5pt !important; }
            .text-\\[11px\\] { font-size: 9pt !important; }
            .text-\\[13px\\] { font-size: 10pt !important; }
            
            .leading-tight { line-height: 1.1; }
            .leading-relaxed { line-height: 1.4; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wider { letter-spacing: 0.05em; }

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
  }, [currentPaperSize, sale?.saleNumber]);

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
    if (!sale) return;
    const blob = await generateImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fis-${sale.saleNumber || "satis"}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [generateImage, sale?.saleNumber]);

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-none p-0 overflow-hidden shadow-2xl">
        {/* Success Overlay */}
        <div className="fixed inset-0 -z-50 bg-emerald-500/20 backdrop-blur-[2px] animate-pulse pointer-events-none transition-all duration-1000" />
        <div className="fixed inset-0 -z-50 bg-gradient-to-tr from-emerald-500/40 via-transparent to-emerald-500/40 pointer-events-none" />

        <DialogHeader className="p-10 bg-emerald-600 border-b border-emerald-700 flex flex-col items-center text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

          <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-6 relative z-10 animate-in zoom-in-50 duration-500">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 animate-bounce-short">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 scale-125 transition-transform" />
            </div>
          </div>

          <DialogTitle className="font-medium text-3xl text-white leading-none z-10 tracking-tight">SATIŞ BAŞARILI</DialogTitle>
          <p className="text-[11px] text-white/80 mt-3 tracking-[0.4em] z-10 uppercase">{sale.saleNumber} KAYDEDİLDİ</p>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-card">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/40 p-4 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <Calendar className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">TARİH</span>
              </div>
              <p className="text-[13px] text-foreground">{sale.createdAt ? format(new Date(sale.createdAt), "dd MMM yyyy", { locale: tr }) : ""}</p>
            </div>
            <div className="bg-muted/40 p-4 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <CreditCard className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">ÖDEME</span>
              </div>
              <p className="text-[13px] text-foreground">{sale.paymentMethod}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 p-4 flex justify-center border-y border-border/40 rounded-2xl">
            <div
              ref={receiptRef}
              className={`bg-white p-4 font-mono text-[11px] leading-relaxed text-black shadow-lg ${currentPaperSize === "58mm" ? "w-[58mm]" :
                currentPaperSize === "80mm" ? "w-[80mm]" :
                  "w-[72mm]"
                }`}
              style={{ width: currentPaperSize }}
            >
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-3 mb-3">
                {settings?.logoUrl && (
                  <div className="mb-2 flex justify-center">
                    <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto grayscale contrast-150" />
                  </div>
                )}
                <h3 className="font-black text-lg uppercase tracking-widest">{settings?.title || "BAŞAR TEKNİK"}</h3>
                <p className="font-black text-[10px] mt-0.5 uppercase tracking-wider">{settings?.subtitle || "PROFESYONEL TEKNİK SERVİS"}</p>
                <p className="font-black mt-1 text-xs">Tel: {settings?.phone || "+90 (5xx) xxx xx xx"}</p>
                {settings?.address && <p className="font-black text-[9px] leading-tight mt-1">{settings.address}</p>}
              </div>

              {/* Info */}
              <div className="space-y-1 mb-3 border-b-2 border-black pb-3">
                <div className="flex justify-between">
                  <span className="font-black">Fiş No:</span>
                  <span className="font-black text-xs">{sale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-black">Tarih:</span>
                  <span className="font-black">{sale.createdAt ? format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm") : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-black">Müşteri:</span>
                  <span className="font-black uppercase">{sale.customer?.name || "HIZLI SATIŞ"}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 mb-3 border-b-2 border-black pb-3">
                {sale.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="flex-1 font-black break-words whitespace-normal uppercase text-xs">{item.product?.name}</span>
                    <span className="whitespace-nowrap font-black shrink-0">{item.quantity}x</span>
                    <span className="font-black shrink-0 text-xs text-right w-20">₺{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between font-black text-sm pt-1">
                  <span>TOPLAM:</span>
                  <span>₺{Number(sale.finalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-[9px] uppercase mt-1">
                  <span>ÖDEME:</span>
                  <span>{sale.paymentMethod}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t-2 border-black">
                <p className="font-black uppercase tracking-widest text-[9px]">{settings?.footer || "Bizi Tercih Ettiğiniz İçin Teşekkürler"}</p>
                {settings?.website && <p className="font-bold text-[8px] mt-1">{settings.website}</p>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-card/50 border-t border-border/50 gap-3">
          <Button variant="ghost" onClick={onClose} className="h-14 rounded-2xl text-muted-foreground/80 hover:text-white hover:bg-white/5">Tamam</Button>
          <Button variant="outline" onClick={handleDownload} disabled={isGenerating} className="h-14 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest">
            <Download className="h-4 w-4" /> İNDİR
          </Button>
          <Button onClick={handlePrint} disabled={isGenerating} className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest">
            <Printer className="h-5 w-5" />
            FİŞİ YAZDIR
          </Button>
        </DialogFooter>

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes bounce-short {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-bounce-short {
            animation: bounce-short 1s ease-in-out infinite;
          }
        `}} />
      </DialogContent>
    </Dialog>
  );
}
