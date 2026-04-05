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
import { useEffect, useState } from "react";

interface StockReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: any[];
}

export function StockReceiptModal({ isOpen, onClose, items }: StockReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            getReceiptSettings("stock").then(setSettings);
        }
    }, [isOpen]);

    const handlePrint = () => {
        window.print();
    };

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
                    <div className="bg-muted/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px]  text-slate-500">OLUŞTURULMA TARİHİ</span>
                        </div>
                        <p className="text-xs font-extrabold text-foreground">{format(new Date(), "dd MMM yyyy HH:mm", { locale: tr })}</p>
                    </div>

                    {/* Thermal Preview */}
                    <div className="receipt-preview bg-white text-black p-6 rounded-xl border border-slate-200 font-mono text-[9px] leading-relaxed shadow-inner">
                        <div className="text-center border-b border-black border-dashed pb-3 mb-3">
                            <h3 className="font-medium  text-xs">{settings?.title || "BAŞAR TEKNİK"}</h3>
                            <p className=" text-[8px] mt-0.5">{settings?.subtitle || "EKSİK ÜRÜN & TEDARİK LİSTESİ"}</p>
                            <p className="text-[8px] mt-1">Tel: {settings?.phone}</p>
                        </div>

                        <div className="mb-3">
                            <div className="grid grid-cols-12 gap-2  border-b border-black pb-1 mb-1 text-[8px]">
                                <span className="col-span-6">ÜRÜN ADI</span>
                                <span className="col-span-2 text-center">MEVCUT</span>
                                <span className="col-span-2 text-center">ALINACAK</span>
                                <span className="col-span-2 text-right">DURUM</span>
                            </div>
                            <div className="space-y-1">
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 py-1 border-b border-black/5 last:border-0 items-center">
                                        <span className="col-span-6 truncate  leading-tight">{item.name}</span>
                                        <span className="col-span-2 text-center  text-slate-500">{item.product?.stock || 0}</span>
                                        <span className="col-span-2 text-center  text-black">{item.quantity || 1}</span>
                                        <span className="col-span-2 text-right opacity-50 px-1 border border-black/20 rounded-[2px] text-[7px] h-3 flex items-center justify-center"> [ ] </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center mt-6 pt-3 border-t border-black border-dashed opacity-70">
                            <p className="">{settings?.footer || "Tedarik Listesi Otomatik Oluşturulmuştur"}</p>
                            <p className="text-[7px] mt-0.5">{settings?.website || "v2.basarteknik.com"}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-900/50 border-t border-white/5 gap-3">
                    <Button variant="ghost" onClick={onClose} className="h-12 rounded-xl  text-slate-500 hover:text-white hover:bg-white/5">Kapat</Button>
                    <Button onClick={handlePrint} className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-black  gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Printer className="h-4 w-4" />
                        LİSTEYİ YAZDIR
                    </Button>
                </DialogFooter>

                <style dangerouslySetInnerHTML={{
                    __html: `
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





