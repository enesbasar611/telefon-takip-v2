"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Smartphone, CheckCheck, Sparkles, Loader2, Globe, Monitor, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendWhatsAppClientSide } from "@/lib/utils/notifications";
import { cn } from "@/lib/utils";

interface WhatsAppConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone?: string;
    phones?: string[]; // Multiple phones for bulk or selection
    customerName?: string;
    initialMessage: string;
    mode?: "single" | "bulk" | "selection"; // selection: single customer, multiple numbers
}

export function WhatsAppConfirmModal({
    isOpen,
    onClose,
    phone,
    phones = [],
    customerName,
    initialMessage,
    mode = "single"
}: WhatsAppConfirmModalProps) {
    const [message, setMessage] = useState(initialMessage);
    const [isSending, setIsSending] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

    // Selection state for selection mode
    const [selectedPhone, setSelectedPhone] = useState<string>(phone || phones[0] || "");

    // Get initial value from localStorage if available
    const [sendType, setSendType] = useState<'web' | 'desktop'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('whatsapp_send_type') as 'web' | 'desktop') || 'web';
        }
        return 'web';
    });

    const handleSendTypeChange = (type: 'web' | 'desktop') => {
        setSendType(type);
        localStorage.setItem('whatsapp_send_type', type);
    };

    const handleRefine = async (tone: "professional" | "friendly" | "urgent") => {
        setIsRefining(true);
        try {
            const { refineWhatsAppMessageWithAI } = await import("@/lib/actions/gemini-actions");
            const result = await refineWhatsAppMessageWithAI(message, tone);
            if (result.success) {
                setMessage(result.refinedMessage);
                toast({ title: "Mesaj Düzenlendi", description: "AI mesajı seçilen tonda yeniden yazdı." });
            } else {
                toast({ title: "Hata", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            console.error("Refine error:", error);
        } finally {
            setIsRefining(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setMessage(initialMessage);
            if (mode === "selection" || mode === "single") {
                setSelectedPhone(phone || phones[0] || "");
            }
        }
    }, [isOpen, initialMessage, phone, phones, mode]);

    const targetPhones = mode === "bulk" ? phones : [selectedPhone].filter(Boolean) as string[];

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);

        try {
            for (const p of targetPhones) {
                sendWhatsAppClientSide(p, message);
                await new Promise(r => setTimeout(r, mode === "bulk" ? 800 : 0));
            }

            toast({
                title: "Başarılı",
                description: mode === "bulk"
                    ? `${targetPhones.length} mesaj için WhatsApp penceresi açıldı.`
                    : "WhatsApp mesaj penceresi açıldı."
            });
            onClose();
        } catch (err) {
            toast({
                title: "Hata",
                description: "Mesaj gönderilirken bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    const hasMultiplePhones = mode === "selection" || (mode === "single" && phones.length > 1);
    const displayPhones = phones.length > 0 ? phones : [phone].filter(Boolean) as string[];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSending && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-[#EFEAE2] dark:bg-[#0F172A] p-0 border-none overflow-hidden outline-none shadow-2xl">

                {/* WhatsApp Header Mockup */}
                <div className="bg-[#00A884] dark:bg-[#202C33] flex items-center gap-3 px-4 py-3 text-white">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                        {mode === "bulk" ? <Users className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{mode === "bulk" ? "Toplu Hatırlatma" : (customerName || "Müşteri")}</p>
                        <p className="text-[10px] text-white/80 leading-tight truncate">
                            {mode === "bulk" ? `${targetPhones.length} Alıcı` : selectedPhone}
                        </p>
                    </div>
                    {mode === "bulk" && <CheckCheck className="h-4 w-4 text-white/60" />}
                </div>

                {/* Number Selection Area (if multiple phones) */}
                {hasMultiplePhones && (
                    <div className="px-4 py-2 bg-[#F0F2F5] dark:bg-[#111B21] border-b border-black/5 dark:border-white/5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Gönderilecek Numarayı Seçin</p>
                        <div className="flex flex-wrap gap-2">
                            {displayPhones.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedPhone(p)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                        selectedPhone === p
                                            ? "bg-[#00A884] text-white border-[#00A884] shadow-sm"
                                            : "bg-white dark:bg-[#202C33] text-muted-foreground border-border hover:border-[#00A884]/50"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Background & Bubble */}
                <div className="p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat min-h-[250px] flex flex-col justify-end relative">
                    {isSending && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-3">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                            <p className="text-white font-bold text-sm">Hazırlanıyor...</p>
                        </div>
                    )}
                    <div className="bg-[#D9FDD3] dark:bg-[#005C4B] md:max-w-[90%] max-w-[95%] self-end rounded-lg rounded-tr-none p-2 shadow-md relative border border-emerald-500/10">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[100px] text-sm text-[#111B21] dark:text-[#E9EDEF] font-sans outline-none leading-relaxed"
                            placeholder="Mesajınızı yazın..."
                            autoFocus
                        />
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => handleRefine("professional")}
                                    disabled={isRefining || isSending}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/10 hover:text-[#00A884] gap-1.5 font-bold transition-all active:scale-95"
                                >
                                    {isRefining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    PROFESYONEL
                                </Button>
                                <Button
                                    onClick={() => handleRefine("friendly")}
                                    disabled={isRefining || isSending}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/10 hover:text-[#00A884] gap-1.5 font-bold transition-all active:scale-95"
                                >
                                    SAMİMİ
                                </Button>
                            </div>
                            <div className="flex items-center gap-1 opacity-60">
                                <span className="text-[9px] text-black/60 dark:text-white/60 font-medium">Şimdi</span>
                                <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="bg-[#F0F2F5] dark:bg-[#202C33] px-4 py-4 flex items-center justify-between gap-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex-1 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Gönderim Türü</span>
                        <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 w-fit border border-black/5 dark:border-white/5">
                            <button
                                onClick={() => handleSendTypeChange('web')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2",
                                    sendType === 'web'
                                        ? "bg-white dark:bg-[#323739] text-[#00A884] shadow-sm active:scale-95"
                                        : "text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                WEB
                            </button>
                            <button
                                onClick={() => handleSendTypeChange('desktop')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2",
                                    sendType === 'desktop'
                                        ? "bg-white dark:bg-[#323739] text-[#00A884] shadow-sm active:scale-95"
                                        : "text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                APP
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={isSending || !message.trim() || !selectedPhone}
                        className="rounded-full h-14 w-14 bg-[#00A884] hover:bg-[#017561] text-white p-0 shrink-0 shadow-lg shadow-[#00A884]/20 flex items-center justify-center transition-all active:scale-90"
                    >
                        <Send className="h-6 w-6 ml-1" />
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}

