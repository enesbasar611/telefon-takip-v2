"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, ShoppingBag, Calendar, User, CreditCard, Smartphone, ShieldCheck, MessageCircle, Edit3, Check } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, formatPhone, formatCurrency } from "@/lib/utils";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryLabel } from "@/lib/industry-utils";
import { useEffect, useState } from "react";
import { Barcode } from "@/components/barcode/barcode";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";

interface ServiceReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: any;
}

export function ServiceReceiptModal({ isOpen, onClose, ticket }: ServiceReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableTicket, setEditableTicket] = useState(ticket);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [shop, setShop] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            getReceiptSettings("service").then(setSettings);
            getShop().then(setShop);
            setEditableTicket(ticket);
        }
    }, [isOpen, ticket]);

    if (!ticket || !editableTicket) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsApp = () => {
        setWhatsappModalOpen(true);
    };

    const updateField = (field: string, value: any) => {
        setEditableTicket((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card border-none p-0 shadow-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="p-8 bg-blue-500/10 border-b border-blue-500/10 flex flex-col items-center text-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                    <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 relative z-10">
                        <Printer className="h-8 w-8 text-blue-500" />
                    </div>

                    <DialogTitle className="font-medium text-2xl  text-white leading-none z-10">Servis Fişi Önizleme</DialogTitle>
                    <div className="flex gap-2 mt-3 z-10">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className={cn(
                                "h-8 px-4 rounded-xl text-[10px] border-white/10 gap-2 transition-all",
                                isEditing ? "bg-emerald-500 text-white border-none" : "bg-white/5 text-white hover:bg-white/10"
                            )}
                        >
                            {isEditing ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                            {isEditing ? "Tamam" : "Düzenle"}
                        </Button>
                        <p className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                            {editableTicket.ticketNumber} Hazırlandı
                        </p>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {/* Thermal Print Preview Container */}
                    <div className="flex justify-center bg-slate-100 p-4 border-y border-border/40">
                        <div className="receipt-preview bg-white text-black p-4 w-[384px] font-mono shadow-xl">
                            <div className="text-center border-b-2 border-black pb-3 mb-3">
                                {settings?.logoUrl && (
                                    <div className="mb-2 flex justify-center">
                                        <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto grayscale contrast-150" />
                                    </div>
                                )}
                                <h3 className="font-black text-lg uppercase">{settings?.title || "BAŞAR TEKNİK"}</h3>
                                <p className="text-[10px] font-black mt-0.5 uppercase tracking-wider">{settings?.subtitle || "TEKNİK SERVİS FİŞİ"}</p>
                                <p className="text-xs font-black mt-1">Tel: {settings?.phone}</p>
                            </div>

                            <div className="space-y-1 mb-3 border-b-2 border-black pb-2">
                                <div className="flex justify-between">
                                    <span className="font-black">SERVİS NO:</span>
                                    <span className="font-black text-xs">{editableTicket.ticketNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-black">TARİH:</span>
                                    <span className="font-black">{format(new Date(editableTicket.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-black">MÜŞTERİ:</span>
                                    <span className="font-black uppercase">{editableTicket.customer?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-black">TELEFON:</span>
                                    <span className="font-black">{editableTicket.customer?.phone}</span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-3 border-b-2 border-black pb-2 italic">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-black/60">CİHAZ:</p>
                                    <p className="text-[11px] font-black uppercase">{editableTicket.deviceBrand} {editableTicket.deviceModel}</p>
                                </div>
                                {editableTicket.imei && (
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-black/60">SERİ NO/IMEI:</p>
                                        <p className="text-[11px] font-black">{editableTicket.imei}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[9px] font-black uppercase text-black/60">ŞİKAYET:</p>
                                    <p className="text-[11px] font-black uppercase leading-tight">{editableTicket.problemDesc}</p>
                                </div>
                            </div>

                            <div className="flex justify-between border-t-2 border-black pt-3 items-center">
                                <span className="font-black text-sm">TAHMİNİ ÜCRET:</span>
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <span className="font-black text-lg">₺</span>
                                        <input
                                            type="number"
                                            className="w-20 border-b border-black text-lg focus:outline-none text-right font-black"
                                            value={editableTicket.estimatedCost}
                                            onChange={(e) => updateField("estimatedCost", e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <span className="font-black text-lg">₺{formatCurrency(editableTicket.estimatedCost)}</span>
                                )}
                            </div>

                            <div className="text-center mt-6 pt-3 border-t-2 border-black border-dashed">
                                <p className="font-black text-[10px] uppercase">{settings?.footer || "Cihazınızı bu fiş ile teslim alınız."}</p>
                                <p className="text-[9px] font-black mt-1 uppercase">Bizi Tercih Ettiğiniz İçin Teşekkürler</p>
                                <p className="text-[8px] font-black mt-2">{settings?.website || "v2.basarteknik.com"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-card/50 border-t border-border/50 gap-3 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="h-14 rounded-2xl  text-muted-foreground/80 hover:text-white hover:bg-white/5">Kapat</Button>
                    <Button
                        onClick={handleWhatsApp}
                        className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white gap-3 active:scale-95 transition-all px-6"
                    >
                        <MessageCircle className="h-5 w-5" />
                        WhatsApp
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white  gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        <Printer className="h-5 w-5" />
                        Hemen Yazdır
                    </Button>
                </DialogFooter>

                {/* Custom Printing Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          @media print {
            body * { visibility: hidden !important; }
            .receipt-preview, .receipt-preview * { 
              visibility: visible !important; 
              color: black !important;
              background: white !important;
              font-family: 'Courier New', monospace !important;
            }
            .receipt-preview {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 58mm !important;
              padding: 4mm !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            @page { size: 58mm auto; margin: 0; }
          }
        `}} />
            </DialogContent>
            <WhatsAppConfirmModal
                isOpen={whatsappModalOpen}
                onClose={() => setWhatsappModalOpen(false)}
                phone={editableTicket.customer?.phone || ""}
                customerName={editableTicket.customer?.name}
                initialMessage={replacePlaceholders(
                    WHATSAPP_TEMPLATES.SERVICE_RECEIPT,
                    {
                        customer: editableTicket.customer?.name || "",
                        device: `${editableTicket.deviceBrand} ${editableTicket.deviceModel}`,
                        ticket: editableTicket.ticketNumber || "",
                        problem: editableTicket.problemDesc || "",
                        price: formatCurrency(editableTicket.estimatedCost)
                    }
                )}
            />
        </Dialog>
    );
}





