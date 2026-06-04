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
import { cn, formatPhone, formatCurrency } from "@/lib/utils";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { getShop } from "@/lib/actions/setting-actions";
import { useEffect, useState, useRef, useCallback } from "react";
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
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            getReceiptSettings("service").then(setSettings);
            getShop().then(setShop);
            setEditableTicket(ticket);
        }
    }, [isOpen, ticket]);

    const handlePrint = useCallback(() => {
        if (!receiptRef.current) return;

        const currentPaperSize = settings?.paperSize || "72mm";
        const content = receiptRef.current.innerHTML;
        const w = window.open("", "_blank");
        if (!w) return;

        // Note: Using PT (points) for font-size in print for absolute scaling control
        w.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Servis Fişi - ${editableTicket.ticketNumber}</title>
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
                        .items-center { align-items: center; }
                        .items-start { align-items: flex-start; }
                        .items-baseline { align-items: baseline; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .uppercase { text-transform: uppercase; }
                        .mt-1 { margin-top: 2px; }
                        .mt-2 { margin-top: 4px; }
                        .mt-4 { margin-top: 10px; }
                        .mb-1 { margin-bottom: 2px; }
                        .mb-2 { margin-bottom: 4px; }
                        .mb-4 { margin-bottom: 8px; }
                        .mb-6 { margin-bottom: 12px; }
                        .pb-2 { padding-bottom: 4px; }
                        .pb-4 { padding-bottom: 8px; }
                        .pt-4 { padding-top: 10px; }
                        .border-b-2 { border-bottom: 1.5px solid black; }
                        .border-t-2 { border-top: 1.5px solid black; }
                        .border-2 { border: 1.5px solid black; }
                        .border-dashed { border-style: dashed; }
                        .w-full { width: 100%; }
                        .grayscale { filter: grayscale(1); }
                        .contrast-\\[2\\] { filter: contrast(2); }
                        .h-10 { height: 35px; }

                        /* Absolute Font Sizes for Thermal Printers */
                        .text-xl { font-size: 13pt !important; } /* Title */
                        .text-2xl { font-size: 16pt !important; } /* Price */
                        .text-sm { font-size: 10pt !important; } /* Main Info */
                        .text-xs { font-size: 9pt !important; } /* Metadata Labels */
                        .text-\\[10px\\] { font-size: 8.5pt !important; }
                        .text-\\[11px\\] { font-size: 9pt !important; }
                        .text-\\[9px\\] { font-size: 7.5pt !important; }
                        .text-\\[14px\\] { font-size: 11pt !important; }
                        
                        .leading-tight { line-height: 1.1; }
                        .leading-relaxed { line-height: 1.4; }
                        
                        .print-hide-decoration { display: none !important; }
                        
                        @media print {
                            body { background: white; }
                            .receipt-container { 
                                box-shadow: none;
                                border: none;
                            }
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
    }, [settings?.paperSize, editableTicket.ticketNumber, editableTicket.createdAt, editableTicket.customer, editableTicket.deviceBrand, editableTicket.deviceModel, editableTicket.imei, editableTicket.problemDesc, editableTicket.estimatedCost]);

    if (!ticket || !editableTicket) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md bg-card border-none p-0 shadow-2xl flex flex-col max-h-[90vh]">
                    <DialogHeader className="p-8 bg-blue-500/10 border-b border-blue-500/10 flex flex-col items-center text-center relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                        <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 relative z-10">
                            <Printer className="h-8 w-8 text-blue-500" />
                        </div>

                        <DialogTitle className="font-medium text-2xl text-white leading-none z-10">Servis Fişi Önizleme</DialogTitle>
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
                            <div className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                                {editableTicket.ticketNumber} Hazırlandı
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-900/20">
                        <div className="flex justify-center py-6 px-4">
                            <div
                                ref={receiptRef}
                                className={cn(
                                    "receipt-preview relative bg-white text-black p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500",
                                    settings?.paperSize === "58mm" ? "w-[58mm] text-[11px]" :
                                        settings?.paperSize === "80mm" ? "w-[80mm] text-[13px]" :
                                            "w-[72mm] text-[12px]"
                                )}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                <div className="print-hide-decoration absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }} />

                                <div className="print-hide-decoration absolute top-0 left-0 right-0 h-2 bg-white print:hidden" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }} />

                                <div className="text-center border-b-2 border-black pb-4 mb-4">
                                    {settings?.logoUrl && (
                                        <div className="mb-3 flex justify-center">
                                            <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto grayscale contrast-[2]" />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-xl uppercase text-black leading-tight">{settings?.title || "BAŞAR TEKNİK"}</h3>
                                    <p className="text-[10px] font-bold mt-1 uppercase text-black leading-relaxed">{settings?.subtitle || "TEKNİK SERVİS FİŞİ"}</p>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <div className="h-[1.5px] w-3 bg-black" />
                                        <p className="text-xs font-black text-black">Tel: {settings?.phone}</p>
                                        <div className="h-[1.5px] w-3 bg-black" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 mb-4 border-b-2 border-black pb-2 text-[11px]">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-[9px] text-black uppercase">SERVİS NO:</span>
                                        <span className="font-bold text-sm text-black">{editableTicket.ticketNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-[9px] text-black">TARİH:</span>
                                        <span className="font-bold text-black">{format(new Date(editableTicket.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                    </div>
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="font-bold text-[9px] text-black whitespace-nowrap">MÜŞTERİ:</span>
                                        <span className="font-bold uppercase text-right text-black break-words leading-tight">{editableTicket.customer?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-[9px] text-black">TELEFON:</span>
                                        <span className="font-bold text-black">{formatPhone(editableTicket.customer?.phone || "")}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4 border-b-2 border-black pb-4">
                                    <div className="bg-white p-2 rounded-sm border-2 border-black">
                                        <p className="text-[9px] font-bold uppercase text-black mb-1">CİHAZ BİLGİSİ</p>
                                        <p className="text-[14px] font-bold uppercase leading-tight text-black">{editableTicket.deviceBrand} {editableTicket.deviceModel}</p>
                                    </div>

                                    {editableTicket.imei && (
                                        <div>
                                            <p className="text-[9px] font-bold uppercase text-black">SERİ NO/IMEI:</p>
                                            <p className="text-[11px] font-bold text-black">{editableTicket.imei}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-[9px] font-bold uppercase text-black mb-0.5">ARIZA & ŞİKAYET:</p>
                                        <p className="text-[11px] font-bold uppercase leading-relaxed text-black">{editableTicket.problemDesc}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between border-t-2 border-black pt-4 items-center mb-4">
                                    <span className="font-bold text-xs uppercase text-black">TAHMİNİ TUTAR:</span>
                                    {isEditing ? (
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-xl text-black">₺</span>
                                            <input
                                                type="number"
                                                className="w-24 border-b-2 border-black text-xl focus:outline-none text-right font-bold bg-emerald-50 px-1"
                                                value={editableTicket.estimatedCost}
                                                onChange={(e) => setEditableTicket((prev: any) => ({ ...prev, estimatedCost: e.target.value }))}
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-bold text-2xl text-black">₺{formatCurrency(editableTicket.estimatedCost)}</span>
                                    )}
                                </div>

                                <div className="mb-6 flex flex-col items-center gap-2">
                                    <Barcode value={editableTicket.ticketNumber} height={40} fontSize={10} />
                                </div>

                                <div className="text-center pt-4 border-t-2 border-black border-dashed">
                                    <p className="font-bold text-[11px] uppercase mb-1 text-black leading-normal">
                                        {settings?.footer || "Bizi Tercih Ettiğiniz İçin Teşekkürler"}
                                    </p>

                                    <div className="mt-4 flex flex-col items-center gap-2">
                                        <div className="h-[1.5px] w-full bg-black/10" />
                                        <p className="text-[9px] font-bold uppercase text-black tracking-widest">{settings?.website || "v2.basarteknik.com"}</p>
                                    </div>
                                </div>

                                <div className="print-hide-decoration absolute bottom-0 left-0 right-0 h-2 bg-white print:hidden" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-card/50 border-t border-border/50 gap-3 shrink-0">
                        <Button variant="ghost" onClick={onClose} className="h-14 rounded-2xl text-muted-foreground/80 hover:text-white hover:bg-white/5">Kapat</Button>
                        <Button
                            onClick={() => setWhatsappModalOpen(true)}
                            className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white gap-3 active:scale-95 transition-all px-6"
                        >
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all font-black text-xs uppercase tracking-widest"
                        >
                            <Printer className="h-5 w-5" />
                            Hemen Yazdır
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
        </>
    );
}
