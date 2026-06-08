"use client";

import {
    Printer,
    Smartphone,
    MessageCircle,
    Edit3,
    Check
} from "lucide-react";
import { format } from "date-fns";
import { cn, formatPhone, formatCurrency } from "@/lib/utils";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { getShop } from "@/lib/actions/setting-actions";
import { useEffect, useState, useCallback } from "react";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { Barcode } from "@/components/barcode/barcode";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import { ReceiptModalWrapper } from "@/components/common/receipt-modal-wrapper";
import { Button } from "@/components/ui/button";

interface ServiceReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: any;
}

const ServiceReceiptContent = ({ ticket, settings, isEditing, onCostChange }: any) => {
    if (!ticket) return null;

    return (
        <ReceiptTemplate
            settings={settings}
            subtitle={settings?.subtitle || "TEKNİK SERVİS FİŞİ"}
            date={ticket.createdAt ? new Date(ticket.createdAt) : undefined}
        >
            {/* Customer Info */}
            <div className="mb-4 border-b-[1.5px] border-black pb-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-black">MÜŞTERİ</span>
                    <span className="text-[13px] font-black uppercase text-black">{ticket.customer?.name}</span>
                    {ticket.customer?.phone && (
                        <span className="text-[11px] font-bold text-black">{formatPhone(ticket.customer.phone)}</span>
                    )}
                </div>
            </div>

            {/* Service Info */}
            <div className="mb-4 border-b-[1.5px] border-black pb-3">
                <div className="flex justify-between items-baseline">
                    <span className="font-black text-[9px] text-black uppercase">SERVİS NO:</span>
                    <span className="font-black text-sm text-black">{ticket.ticketNumber}</span>
                </div>
            </div>

            {/* Device Info */}
            <div className="space-y-4 mb-6">
                <div className="border-[1.5px] border-black p-2">
                    <span className="text-[9px] font-black text-black uppercase block mb-1">CİHAZ BİLGİSİ</span>
                    <span className="text-[13px] font-black uppercase text-black block leading-tight">
                        {ticket.deviceBrand} {ticket.deviceModel}
                    </span>
                    {ticket.imei && (
                        <span className="text-[10px] font-bold text-black mt-1 block">IMEI: {ticket.imei}</span>
                    )}
                </div>

                <div className="space-y-1">
                    <span className="text-[9px] font-black text-black uppercase block">ARIZA & ŞİKAYET:</span>
                    <span className="text-[11px] font-black uppercase text-black block leading-tight border-l-2 border-black pl-2">
                        {ticket.problemDesc || "BELİRTİLMEMİŞ"}
                    </span>
                </div>
            </div>

            {/* Totals Section */}
            <div className="border-t-[1.5px] border-black pt-4 space-y-2">
                <div className="flex justify-between items-center py-1">
                    <span className="text-[10px] font-black text-black uppercase">TAHMİNİ TUTAR:</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <span className="font-black text-xl text-black">₺</span>
                            <input
                                type="number"
                                className="w-24 border-b-2 border-black text-xl focus:outline-none text-right font-black bg-emerald-50 px-1"
                                value={ticket.estimatedCost}
                                onChange={(e) => onCostChange(e.target.value)}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <span className="text-[12px] font-black text-black">{formatCurrency(ticket.estimatedCost, true)}</span>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex justify-between items-center bg-black p-2 mt-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">TOPLAM</span>
                        <span className="text-xl font-black text-white">{formatCurrency(ticket.estimatedCost, true)}</span>
                    </div>
                )}
            </div>

            {/* Barcode */}
            <div className="mt-8 flex flex-col items-center gap-2 grayscale brightness-0">
                <Barcode value={ticket.ticketNumber} height={35} fontSize={10} />
            </div>
        </ReceiptTemplate>
    );
};

export function ServiceReceiptModal({ isOpen, onClose, ticket }: ServiceReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableTicket, setEditableTicket] = useState(ticket);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getReceiptSettings("service").then(setSettings);
            setEditableTicket(ticket);
            setIsEditing(false);
        }
    }, [isOpen, ticket]);

    const handleCostChange = (value: string) => {
        setEditableTicket((prev: any) => ({ ...prev, estimatedCost: value }));
    };

    if (!ticket || !editableTicket) return null;

    return (
        <>
            <ReceiptModalWrapper
                open={isOpen}
                onClose={onClose}
                title={editableTicket.customer?.name || "Servis Fişi"}
                subtitle={editableTicket.ticketNumber}
                printTitle={`Servis Fişi - ${editableTicket.ticketNumber}`}
                paperSize={settings?.paperSize || "72mm"}
                downloadFilename={`servis-fisi-${editableTicket.ticketNumber}.png`}
                whatsappPhone={editableTicket.customer?.phone}
                onWhatsApp={() => setWhatsappModalOpen(true)}
                icon={<Smartphone className="h-4 w-4 text-foreground" />}
                headerActions={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn(
                            "rounded-xl gap-2 text-[9px] font-black uppercase tracking-widest h-9 px-3 border transition-all",
                            isEditing
                                ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted border-border/30"
                        )}
                    >
                        {isEditing ? <Check className="h-3.5 h-3.5" /> : <Edit3 className="h-3.5 h-3.5" />}
                        {isEditing ? "Tamam" : "Düzenle"}
                    </Button>
                }
            >
                {(receiptRef) => (
                    <div ref={receiptRef}>
                        <ServiceReceiptContent
                            ticket={editableTicket}
                            settings={settings}
                            isEditing={isEditing}
                            onCostChange={handleCostChange}
                        />
                    </div>
                )}
            </ReceiptModalWrapper>

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
