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

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-none p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 bg-primary/10 border-b border-primary/10 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground font-manrope">SATIŞ BAŞARILI</DialogTitle>
          <p className="text-xs font-bold text-primary mt-1 tracking-widest">{sale.saleNumber} KAYDEDİLDİ</p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400">TARİH</span>
                </div>
                <p className="text-xs font-extrabold text-foreground">{format(new Date(sale.createdAt), "dd MMM yyyy", { locale: tr })}</p>
             </div>
             <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400">ÖDEME</span>
                </div>
                <p className="text-xs font-extrabold text-foreground">{sale.paymentMethod}</p>
             </div>
          </div>

          {/* Receipt Preview (Thermal Layout) */}
          <div className="receipt-preview bg-white text-black p-8 rounded-xl shadow-inner border border-slate-200 font-mono text-[10px] leading-relaxed">
             <div className="text-center border-b border-black border-dashed pb-4 mb-4">
                <h3 className="font-bold text-sm uppercase">TECH ATELIER</h3>
                <p>PROFESYONEL TEKNİK SERVİS</p>
                <p>Tel: +90 (5xx) xxx xx xx</p>
             </div>

             <div className="flex justify-between mb-1">
                <span>Fiş No:</span>
                <span className="font-bold">{sale.saleNumber}</span>
             </div>
             <div className="flex justify-between border-b border-black border-dashed pb-2 mb-4">
                <span>Tarih:</span>
                <span>{format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm")}</span>
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

             <div className="border-t border-black border-dashed pt-4 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                    <span>TOPLAM:</span>
                    <span>₺{Number(sale.finalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Ödeme Tipi:</span>
                    <span>{sale.paymentMethod}</span>
                </div>
             </div>

             <div className="text-center mt-8 pt-4 border-t border-black border-dashed opacity-70">
                <p>Bizi Tercih Ettiğiniz İçin Teşekkürler</p>
                <p>www.techatelier.com</p>
             </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/50 gap-3">
          <Button variant="ghost" onClick={onClose} className="h-12 rounded-2xl font-bold text-slate-500 hover:text-foreground">Kapat</Button>
          <Button onClick={handlePrint} className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black gap-3 shadow-xl shadow-primary/20">
            <Printer className="h-5 w-5" />
            FİŞİ YAZDIR
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Hidden Thermal Print Area */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-preview, .receipt-preview * {
            visibility: visible;
          }
          .receipt-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}} />
    </Dialog>
  );
}
