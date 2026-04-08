"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceStatusUpdater } from "./service-status-updater";
import { ServiceReceiptModal } from "./service-receipt-modal";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { Printer, MessageCircle, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceDetailActionsProps {
    ticket: any;
}

export function ServiceDetailActions({ ticket }: ServiceDetailActionsProps) {
    const [showReceipt, setShowReceipt] = useState(false);
    const [showWhatsapp, setShowWhatsapp] = useState(false);

    const formatParts = () => {
        if (!ticket.usedParts || ticket.usedParts.length === 0) return "Kullanılan parça bulunmuyor.";
        return ticket.usedParts.map((p: any) => `- ${p.product?.name || p.name || 'Parça'}: ₺${Number(p.unitPrice).toLocaleString('tr-TR')}`).join("\n");
    };

    const formatLogs = () => {
        if (!ticket.logs || ticket.logs.length === 0) return "İşlem kaydı bulunmuyor.";
        return ticket.logs.slice(0, 5).map((l: any) => `- ${format(new Date(l.createdAt), 'dd.MM HH:mm')}: ${l.message}`).join("\n");
    };

    const totalAmount = (ticket.usedParts?.reduce((acc: number, p: any) => acc + (Number(p.unitPrice) * (p.quantity || 1)), 0) || 0) + (Number(ticket.laborCost || ticket.actualCost || ticket.estimatedCost) || 0);

    const whatsappMessage = `🤝 Sayın *${ticket.customer?.name}*,\n\n*${ticket.deviceBrand} ${ticket.deviceModel}* cihazınızın servis işlemleri hakkındaki güncel bilgiler aşağıdadır:\n\n*📋 Yapılan İşlemler:*\n${formatLogs()}\n\n*🏷️ Kullanılan Parçalar:*\n${formatParts()}\n\n*💰 Toplam Tutar:* ₺${totalAmount.toLocaleString('tr-TR')}\n\n*Durum:* ${ticket.status === 'READY' ? '✅ Cihazınız Hazır' : '⏳ İşlemler Devam Ediyor'}\n\nBizi tercih ettiğiniz için teşekkür ederiz. 😊`;

    return (
        <div className="space-y-4">
            <div className="space-y-3 pt-2">
                <ServiceStatusUpdater ticket={ticket} />

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={() => setShowReceipt(true)}
                        variant="outline"
                        className="w-full h-12 rounded-2xl border-border/50 bg-white/[0.03] text-white hover:bg-white/5 transition-all gap-2"
                    >
                        <Printer className="h-4 w-4 text-blue-500" />
                        FİŞ YAZDIR
                    </Button>

                    <Button
                        onClick={() => setShowWhatsapp(true)}
                        variant="outline"
                        className="w-full h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all gap-2"
                    >
                        <MessageCircle className="h-4 w-4" />
                        WHATSAPP
                    </Button>
                </div>
            </div>

            <ServiceReceiptModal
                ticket={ticket}
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
            />

            <WhatsAppConfirmModal
                isOpen={showWhatsapp}
                onClose={() => setShowWhatsapp(false)}
                phone={ticket.customer?.phone || ""}
                customerName={ticket.customer?.name}
                initialMessage={whatsappMessage}
            />
        </div>
    );
}
