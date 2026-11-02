"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceStatusUpdater } from "./service-status-updater";
import { ServiceReceiptModal } from "./service-receipt-modal";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { Printer, MessageCircle, MoreVertical, Barcode as BarcodeIcon, History } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ServiceTicketLabelPrintArea,
    buildServiceTicketLabelData,
    type ServiceTicketLabelData
} from "./service-ticket-label-print";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceDetailActionsProps {
    ticket: any;
}

export function ServiceDetailActions({ ticket }: ServiceDetailActionsProps) {
    const [showReceipt, setShowReceipt] = useState(false);
    const [showWhatsapp, setShowWhatsapp] = useState(false);
    const [serviceLabel, setServiceLabel] = useState<ServiceTicketLabelData | null>(null);

    const handlePrintBarcode = (useCurrentDate: boolean, showPrice: boolean) => {
        setServiceLabel(buildServiceTicketLabelData(ticket, ticket?.shop, {
            useCurrentDate,
            showPrice,
            dateLabel: useCurrentDate ? "Güncel" : "Alış"
        }));
    };

    const formatParts = () => {
        if (!ticket.usedParts || ticket.usedParts.length === 0) return "Kullanılan parça bulunmuyor.";
        return ticket.usedParts.map((p: any) => `- ${p.product?.name || p.name || 'Parça'}: ₺${Number(p.unitPrice).toLocaleString('tr-TR')}`).join("\n");
    };

    const formatLogs = () => {
        if (!ticket.logs || ticket.logs.length === 0) return "İşlem kaydı bulunmuyor.";
        return ticket.logs.slice(0, 5).map((l: any) => `- ${format(new Date(l.createdAt), 'dd.MM HH:mm')}: ${l.message}`).join("\n");
    };

    const totalAmount = (ticket.usedParts?.reduce((acc: number, p: any) => acc + (Number(p.unitPrice) * (p.quantity || 1)), 0) || 0) + (Number(ticket.laborCost || ticket.actualCost || ticket.estimatedCost) || 0);

    const whatsappMessage = `🤝 Sayın *${ticket.customer?.name}*,\n\n*${ticket.deviceBrand} ${ticket.deviceModel}* cihazınızın servis işlemleri hakkındaki güncel bilgiler aşağıdadır:\n\n*📋 Yapılan İşlemler:*\n${formatLogs()}\n\n*🏷️ Kullanılan Parçalar:*\n${formatParts()}\n\n*💰 Toplam Tutar:* ₺${totalAmount.toLocaleString('tr-TR')}\n\n*Durum:* ${ticket.status === 'READY' ? '🟢 Cihazınız Hazır' : '⏳ İşlemler Devam Ediyor'}\n\nBizi tercih ettiğiniz için teşekkür ederiz. ✨`;

    const ticketDate = ticket.createdAt ? format(new Date(ticket.createdAt), 'dd.MM.yyyy') : '';
    const todayDate = format(new Date(), 'dd.MM.yyyy');

    return (
        <div className="space-y-4">
            <div className="space-y-3 pt-2">
                <ServiceStatusUpdater ticket={ticket} />

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={() => setShowReceipt(true)}
                        variant="outline"
                        className="w-full h-12 rounded-2xl border-border/50 bg-slate-50 dark:bg-white/[0.03] text-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all gap-2"
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

                {/* Barkod Seçenekleri: Güncel Barkod & Eski Barkod */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Güncel Barkod Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold transition-all gap-2 text-xs"
                            >
                                <BarcodeIcon className="h-4 w-4 text-amber-500 shrink-0" />
                                GÜNCEL BARKOD
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[210px] bg-card border border-border/50 p-2 rounded-2xl shadow-xl z-50">
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground px-2 py-1.5 font-normal">
                                Güncel Tarih ({todayDate})
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                className="text-xs gap-2 p-2.5 cursor-pointer rounded-xl font-medium"
                                onClick={() => handlePrintBarcode(true, true)}
                            >
                                <BarcodeIcon className="h-4 w-4 text-amber-500" /> Fiyatlı Yazdır
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-xs gap-2 p-2.5 cursor-pointer rounded-xl font-medium"
                                onClick={() => handlePrintBarcode(true, false)}
                            >
                                <BarcodeIcon className="h-4 w-4 text-muted-foreground" /> Fiyatsız Yazdır
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Eski Barkod Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-border/50 bg-slate-50 dark:bg-white/[0.03] text-foreground hover:bg-slate-100 dark:hover:bg-white/5 font-semibold transition-all gap-2 text-xs"
                            >
                                <History className="h-4 w-4 text-blue-500 shrink-0" />
                                ESKİ BARKOD
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[210px] bg-card border border-border/50 p-2 rounded-2xl shadow-xl z-50">
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground px-2 py-1.5 font-normal">
                                İlk Kayıt ({ticketDate})
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                className="text-xs gap-2 p-2.5 cursor-pointer rounded-xl font-medium"
                                onClick={() => handlePrintBarcode(false, true)}
                            >
                                <BarcodeIcon className="h-4 w-4 text-amber-500" /> Fiyatlı Yazdır
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-xs gap-2 p-2.5 cursor-pointer rounded-xl font-medium"
                                onClick={() => handlePrintBarcode(false, false)}
                            >
                                <BarcodeIcon className="h-4 w-4 text-muted-foreground" /> Fiyatsız Yazdır
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

            <ServiceTicketLabelPrintArea
                label={serviceLabel}
                onPrinted={() => setServiceLabel(null)}
            />
        </div>
    );
}
