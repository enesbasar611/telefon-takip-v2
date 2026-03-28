"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, ShoppingBag, Calendar, User, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { useEffect, useState } from "react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      getReceiptSettings("pos").then(setSettings);
    }
  }, [isOpen]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-none p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-10 bg-emerald-500/10 border-b border-emerald-500/10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Success Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 relative z-10 animate-in zoom-in-50 duration-500">
            <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce-short">
              <CheckCircle2 className="h-8 w-8 text-white scale-125 transition-transform" />
            </div>
          </div>

          <DialogTitle className="text-3xl font-black text-white tracking-tight leading-none z-10">SATIŞ BAŞARILI</DialogTitle>
          <p className="text-[10px] font-black text-emerald-400 mt-3 tracking-[0.3em] uppercase z-10">{sale.saleNumber} KAYDEDİLDİ</p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500">TARİH</span>
              </div>
              <p className="text-xs font-extrabold text-foreground">{sale.createdAt ? format(new Date(sale.createdAt), "dd MMM yyyy", { locale: tr }) : ""}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500">ÖDEME</span>
              </div>
              <p className="text-xs font-extrabold text-foreground">{sale.paymentMethod}</p>
            </div>
          </div>

          {/* Receipt Preview (Thermal Layout) */}
          <div className="receipt-preview bg-white text-black p-8 rounded-2xl shadow-inner border border-slate-200 font-mono text-[10px] leading-relaxed">
            <div className="text-center border-b border-black border-dashed pb-4 mb-4">
              <h3 className="font-bold text-sm uppercase italic tracking-tighter">{settings?.title || "BAŞAR TEKNİK"}</h3>
              <p className="font-bold text-[9px] mt-0.5">{settings?.subtitle || "PROFESYONEL TEKNİK SERVİS"}</p>
              <p className="mt-1">Tel: {settings?.phone || "+90 (5xx) xxx xx xx"}</p>
              {settings?.address && <p className="text-[8px] opacity-70 italic">{settings.address}</p>}
            </div>

            <div className="space-y-1 mb-4 border-b border-black border-dashed pb-3">
              <div className="flex justify-between">
                <span>Fiş No:</span>
                <span className="font-bold">{sale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarih:</span>
                <span>{sale.createdAt ? format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm") : ""}</span>
              </div>
              <div className="flex justify-between">
                <span>Müşteri:</span>
                <span className="font-bold uppercase">{sale.customer?.name || "HIZLI SATIŞ"}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {sale.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between gap-4">
                  <span className="flex-1 truncate">{item.product?.name}</span>
                  <span className="whitespace-nowrap">{item.quantity} x {Number(item.unitPrice).toFixed(2)}</span>
                  <span className="font-bold">₺{Number(item.totalPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-black border-dashed pt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span>GENEL TOPLAM:</span>
                <span className="text-sm">₺{Number(sale.finalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between opacity-80">
                <span>Ödeme Yöntemi:</span>
                <span>{sale.paymentMethod}</span>
              </div>
            </div>

            <div className="text-center mt-8 pt-4 border-t border-black border-dashed opacity-70">
              <p className="font-bold">{settings?.footer || "Bizi Tercih Ettiğiniz İçin Teşekkürler"}</p>
              <p className="text-[8px] mt-1">{settings?.website || "v2.basarteknik.com"}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-900/50 border-t border-white/5 gap-3">
          <Button variant="ghost" onClick={onClose} className="h-14 rounded-2xl font-bold text-slate-500 hover:text-white hover:bg-white/5">Vazgeç</Button>
          <Button onClick={handlePrint} className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
            <Printer className="h-5 w-5" />
            FİŞİ YAZDIR
          </Button>
        </DialogFooter>

        {/* Custom Animation Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes bounce-short {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-bounce-short {
            animation: bounce-short 1s ease-in-out infinite;
          }
          @media print {
            body * { visibility: hidden !important; }
            .receipt-preview, .receipt-preview * { visibility: visible !important; }
            .receipt-preview {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              padding: 5mm !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            @page { size: 80mm auto; margin: 0; }
          }
        `}} />
      </DialogContent>
    </Dialog>
  );
}
