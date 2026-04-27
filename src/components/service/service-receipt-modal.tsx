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
                    {/* Receipt Preview (Thermal Layout) */}
                    <div className="receipt-preview bg-white text-black p-8 rounded-2xl shadow-inner border border-slate-200 font-sans text-[10px] leading-snug">
                        <div className="text-center border-b-2 border-black pb-4 mb-4">
                            <h3 className="font-medium  text-sm">{settings?.title || "BAŞAR TEKNİK"}</h3>
                            <p className=" text-[8px] mt-0.5 opacity-80">{settings?.subtitle || "Mobil servis & teknik destek"}</p>
                            <div className="mt-2 text-[7px]  space-y-0.5">
                                <p>{settings?.phone}</p>
                                {settings?.address && <p className="opacity-70">{settings.address}</p>}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-black text-white px-2 py-1.5 mb-4">
                            <span className=" text-[9px]">KAYIT NO</span>
                            <span className="text-xs ">{ticket.ticketNumber}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 border-b border-black border-dashed pb-3">
                            <div>
                                <p className="text-[7px]  text-gray-500 mb-0.5">Müşteri</p>
                                {isEditing ? (
                                    <input
                                        className="w-full border-b border-blue-500 text-[10px] focus:outline-none"
                                        value={editableTicket.customer?.name}
                                        onChange={(e) => setEditableTicket((prev: any) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                                    />
                                ) : (
                                    <p className=" text-[10px]">{editableTicket.customer?.name}</p>
                                )}
                                <p className="text-[8px]  mt-0.5">{formatPhone(editableTicket.customer?.phone)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px]  text-gray-500 mb-0.5">Tarih</p>
                                <p className=" text-[9px]">{format(new Date(editableTicket.createdAt), "dd.MM.yyyy")}</p>
                                <p className="text-[7px] opacity-60">{format(new Date(editableTicket.createdAt), "HH:mm")}</p>
                            </div>
                        </div>

                        <div className="mb-4 space-y-2">
                            <div className="bg-gray-100 px-2 py-1 mb-2  text-[8px] text-center shadow-sm border border-gray-200 uppercase font-bold tracking-wider">{getIndustryLabel(shop, "customerAsset")} BİLGİLERİ</div>
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="text-gray-500 text-[8px] uppercase">{getIndustryLabel(shop, "customerAsset")}:</span>
                                {isEditing ? (
                                    <div className="flex gap-1 text-[9px]">
                                        <input className="w-16 border-b border-blue-500 focus:outline-none" value={editableTicket.deviceBrand} onChange={(e) => updateField("deviceBrand", e.target.value)} />
                                        <input className="w-20 border-b border-blue-500 focus:outline-none" value={editableTicket.deviceModel} onChange={(e) => updateField("deviceModel", e.target.value)} />
                                    </div>
                                ) : (
                                    <span className="font-bold">{editableTicket.deviceBrand} {editableTicket.deviceModel}</span>
                                )}
                            </div>

                            {/* Dynamic Attributes */}
                            {editableTicket.attributes && Object.entries(editableTicket.attributes).map(([key, value]) => {
                                if (!value || key === "brand" || key === "model" || key === "imei") return null;
                                return (
                                    <div key={key} className="flex justify-between border-b border-gray-100 pb-1">
                                        <span className="text-gray-500 text-[8px] uppercase">{key}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                    </div>
                                );
                            })}

                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="text-gray-500 text-[8px] uppercase">SERİ/KIMLIK NO:</span>
                                {isEditing ? (
                                    <input className="text-right border-b border-blue-500 text-[9px] focus:outline-none" value={editableTicket.imei || ""} onChange={(e) => updateField("imei", e.target.value)} />
                                ) : (
                                    <span className="">{editableTicket.imei || editableTicket.serialNumber || "—"}</span>
                                )}
                            </div>
                            <div className="mt-2 text-center py-1.5 bg-black text-white font-bold text-[8px] uppercase tracking-tighter">Arıza Tanımı</div>
                            <div className="mt-1">
                                {isEditing ? (
                                    <textarea
                                        className="w-full bg-gray-50 p-2 border border-blue-500 rounded text-[9px] focus:outline-none h-12"
                                        value={editableTicket.problemDesc}
                                        onChange={(e) => updateField("problemDesc", e.target.value)}
                                    />
                                ) : (
                                    <p className="p-2 border border-black/10 rounded text-[9px] leading-tight select-all">{editableTicket.problemDesc}</p>
                                )}
                            </div>
                        </div>

                        {(editableTicket.accessories?.length > 0 || editableTicket.cosmeticConditions?.length > 0) && (
                            <div className="mb-4 space-y-3">
                                <div className="bg-gray-100 px-2 py-1 mb-2 text-[8px] text-center shadow-sm border border-gray-200 uppercase tracking-wider font-semibold">Cihaz Durumu & Aksesuarlar</div>

                                {editableTicket.accessories?.length > 0 && (
                                    <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 text-[8px] uppercase font-bold">Aksesuarlar:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {editableTicket.accessories.map((item: string, i: number) => (
                                                <span key={item} className="text-[9px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-sm">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(editableTicket.cosmeticConditions?.length > 0 || editableTicket.cosmeticNotes) && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-500 text-[8px] uppercase font-bold">Kozmetik Durum:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {editableTicket.cosmeticConditions?.map((item: string) => (
                                                <span key={item} className="text-[9px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-sm">{item}</span>
                                            ))}
                                        </div>
                                        {editableTicket.cosmeticNotes && (
                                            <p className="text-[9px] mt-1 text-slate-700 italic border-l-2 border-slate-200 pl-2">
                                                {editableTicket.cosmeticNotes}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Barcode */}
                        <div className="flex flex-col items-center justify-center my-6 py-4 border-y border-black/5 bg-gray-50/50">
                            <Barcode value={editableTicket.ticketNumber} height={35} fontSize={9} />
                            <p className="text-[7px]  text-gray-400 mt-1">{settings?.website || "basarteknik.com"}</p>
                        </div>

                        {settings?.terms && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
                                <p className="text-[8px]  mb-1.5 border-b border-gray-200 pb-1">Önemli Şartlar</p>
                                <div className="text-[6.5px] text-gray-600 font-medium leading-[1.4] whitespace-pre-wrap break-words w-full h-auto min-h-min">
                                    {settings.terms}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between border-t-2 border-black pt-3 items-center">
                            <span className=" text-[9px]">TAHMİNİ ÜCRET:</span>
                            {isEditing ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-lg">₺</span>
                                    <input
                                        type="number"
                                        className="w-20 border-b border-blue-500 text-lg focus:outline-none text-right font-medium"
                                        value={editableTicket.estimatedCost}
                                        onChange={(e) => updateField("estimatedCost", e.target.value)}
                                    />
                                </div>
                            ) : (
                                <span className="text-lg ">₺{formatCurrency(editableTicket.estimatedCost)}</span>
                            )}
                        </div>


                        <div className="text-center mt-6 pt-4 border-t border-black border-dashed opacity-70">
                            <p className=" text-[9px]">{settings?.footer || "Cihazınız güvenli ellerde."}</p>
                            <p className="text-[6px] mt-1 ">TELEFON TAKİP V2 / WEBFONE</p>
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
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            @page { size: 80mm auto; margin: 0; }
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





