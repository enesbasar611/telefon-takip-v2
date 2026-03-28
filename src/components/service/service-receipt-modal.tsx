"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, ShoppingBag, Calendar, User, CreditCard, Smartphone, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, formatPhone } from "@/lib/utils";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { useEffect, useState } from "react";
import { Barcode } from "@/components/barcode/barcode";

interface ServiceReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: any;
}

export function ServiceReceiptModal({ isOpen, onClose, ticket }: ServiceReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            getReceiptSettings("service").then(setSettings);
        }
    }, [isOpen]);

    if (!ticket) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card border-none p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-blue-500/10 border-b border-blue-500/10 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                    <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 relative z-10">
                        <Printer className="h-8 w-8 text-blue-500" />
                    </div>

                    <DialogTitle className="text-2xl font-bold text-white leading-none z-10">Servis Fişi Önizleme</DialogTitle>
                    <p className="text-[10px] font-bold text-blue-400 mt-2 z-10">{ticket.ticketNumber} Hazırlandı</p>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {/* Receipt Preview (Thermal Layout) */}
                    <div className="receipt-preview bg-white text-black p-8 rounded-2xl shadow-inner border border-slate-200 font-sans text-[10px] leading-snug">
                        <div className="text-center border-b-2 border-black pb-4 mb-4">
                            <h3 className="font-bold text-sm">{settings?.title || "BAŞAR TEKNİK"}</h3>
                            <p className="font-bold text-[8px] mt-0.5 opacity-80">{settings?.subtitle || "Mobil servis & teknik destek"}</p>
                            <div className="mt-2 text-[7px] font-bold space-y-0.5">
                                <p>{settings?.phone}</p>
                                {settings?.address && <p className="opacity-70">{settings.address}</p>}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-black text-white px-2 py-1.5 mb-4">
                            <span className="font-bold text-[9px]">KAYIT NO</span>
                            <span className="text-xs font-bold">{ticket.ticketNumber}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 border-b border-black border-dashed pb-3">
                            <div>
                                <p className="text-[7px] font-bold text-gray-500 mb-0.5">Müşteri</p>
                                <p className="font-bold text-[10px]">{ticket.customer?.name}</p>
                                <p className="text-[8px] font-bold mt-0.5">{formatPhone(ticket.customer?.phone)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px] font-bold text-gray-500 mb-0.5">Tarih</p>
                                <p className="font-bold text-[9px]">{format(new Date(ticket.createdAt), "dd.MM.yyyy")}</p>
                                <p className="text-[7px] opacity-60">{format(new Date(ticket.createdAt), "HH:mm")}</p>
                            </div>
                        </div>

                        <div className="mb-4 space-y-2">
                            <div className="bg-gray-100 px-2 py-1 mb-2 font-bold text-[8px] text-center shadow-sm border border-gray-200">CİHAZ VE ARIZA BİLGİLERİ</div>
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="text-gray-500 text-[8px] font-bold">MARKA / MODEL:</span>
                                <span className="font-bold">{ticket.deviceBrand} {ticket.deviceModel}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="text-gray-500 text-[8px] font-bold">IMEI / SERİ NO:</span>
                                <span className="font-bold">{ticket.imei || ticket.serialNumber || "Belirtilmedi"}</span>
                            </div>
                            <div className="mt-2">
                                <p className="text-[8px] font-bold text-gray-500 mb-1">ARIZA TANIMI:</p>
                                <p className="bg-gray-50 p-2 border border-gray-200 rounded text-[9px] font-medium leading-tight select-all">{ticket.problemDesc}</p>
                            </div>
                        </div>

                        {/* Barcode */}
                        <div className="flex flex-col items-center justify-center my-6 py-4 border-y border-black/5 bg-gray-50/50">
                            <Barcode value={ticket.ticketNumber} height={35} fontSize={9} />
                            <p className="text-[7px] font-bold text-gray-400 mt-1">{settings?.website || "basarteknik.com"}</p>
                        </div>

                        {settings?.terms && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
                                <p className="text-[8px] font-bold mb-1.5 border-b border-gray-200 pb-1">Önemli Şartlar</p>
                                <div className="text-[6.5px] text-gray-600 font-medium leading-[1.4] whitespace-pre-line">
                                    {settings.terms}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between border-t-2 border-black pt-3 items-center">
                            <span className="font-bold text-[9px]">TAHMİNİ ÜCRET:</span>
                            <span className="text-lg font-bold">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</span>
                        </div>

                        <div className="flex justify-between items-end px-3 mt-8 pb-4 opacity-40">
                            <div className="text-center">
                                <p className="text-[6px] font-bold mb-6">MÜŞTERİ İMZA</p>
                                <div className="w-14 border-t border-black"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-[6px] font-bold mb-6">TEKNİSYEN İMZA</p>
                                <div className="w-14 border-t border-black"></div>
                            </div>
                        </div>

                        <div className="text-center mt-6 pt-4 border-t border-black border-dashed opacity-70">
                            <p className="font-bold text-[9px]">{settings?.footer || "Cihazınız güvenli ellerde."}</p>
                            <p className="text-[6px] mt-1 font-bold">TELEFON TAKİP V2 / WEBFONE</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-900/50 border-t border-white/5 gap-3">
                    <Button variant="ghost" onClick={onClose} className="h-14 rounded-2xl font-bold text-slate-500 hover:text-white hover:bg-white/5">İptal</Button>
                    <Button onClick={handlePrint} className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        <Printer className="h-5 w-5" />
                        Hemen Yazdır
                    </Button>
                </DialogFooter>

                {/* Custom Printing Styles */}
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
