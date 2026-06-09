"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Smartphone, CheckCheck, Sparkles, Loader2, Globe, Monitor } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendWhatsAppClientSide } from "@/lib/utils/notifications";
import { cn } from "@/lib/utils";

interface WhatsAppConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone?: string;
    phones?: string[];
    customerName?: string;
    initialMessage: string;
    mode?: "single" | "bulk";
}

export function WhatsAppConfirmModal({ isOpen, onClose, phone, phones = [], customerName, initialMessage, mode = "single" }: WhatsAppConfirmModalProps) {
    const [message, setMessage] = useState(initialMessage);
    const [isSending, setIsSending] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

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
        }
    }, [isOpen, initialMessage]);

    const targetPhones = mode === "bulk" ? phones : [phone].filter(Boolean) as string[];

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSending && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-[#EFEAE2] dark:bg-[#0F172A] p-0 border-none overflow-hidden outline-none">

                {/* WhatsApp Header Mockup */}
                <div className="bg-[#00A884] dark:bg-[#202C33] flex items-center gap-3 px-4 py-3 text-white">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                        {mode === "bulk" ? <CheckCheck className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm leading-tight">{mode === "bulk" ? "Toplu Hatırlatma" : (customerName || "Müşteri")}</p>
                        <p className="text-[10px] text-white/80 leading-tight">{mode === "bulk" ? `${targetPhones.length} Alıcı` : phone}</p>
                    </div>
                </div>

                {/* Chat Background & Bubble */}
                <div className="p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat min-h-[300px] flex flex-col justify-end relative">
                    {isSending && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-3">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                            <p className="text-white font-bold text-sm">Hazırlanıyor...</p>
                        </div>
                    )}
                    <div className="bg-[#D9FDD3] dark:bg-[#005C4B] md:max-w-[85%] max-w-[95%] self-end rounded-lg rounded-tr-none p-2 shadow-sm relative border border-emerald-500/10">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[120px] text-sm text-[#111B21] dark:text-[#E9EDEF] font-sans outline-none"
                            placeholder="Mesajınızı yazın..."
                            autoFocus
                        />
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => handleRefine("professional")}
                                    disabled={isRefining || isSending}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/5 hover:text-[#00A884] gap-1.5 font-medium transition-all active:scale-95"
                                >
                                    {isRefining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    Profesyonel
                                </Button>
                                <Button
                                    onClick={() => handleRefine("friendly")}
                                    disabled={isRefining || isSending}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/5 hover:text-[#00A884] gap-1.5 font-medium transition-all active:scale-95"
                                >
                                    Samimi
                                </Button>
                                <Button
                                    onClick={() => handleRefine("urgent")}
                                    disabled={isRefining || isSending}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/5 hover:text-red-500 gap-1.5 font-medium transition-all active:scale-95"
                                >
                                    Acil
                                </Button>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-black/40 dark:text-white/40">Şimdi</span>
                                <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="bg-[#F0F2F5] dark:bg-[#202C33] px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-1">Gönderim Türü</span>
                        <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 w-fit">
                            <button
                                onClick={() => handleSendTypeChange('web')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2",
                                    sendType === 'web'
                                        ? "bg-white dark:bg-[#323739] text-[#00A884] shadow-sm"
                                        : "text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Globe className="w-3 h-3" />
                                Web
                            </button>
                            <button
                                onClick={() => handleSendTypeChange('desktop')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2",
                                    sendType === 'desktop'
                                        ? "bg-white dark:bg-[#323739] text-[#00A884] shadow-sm"
                                        : "text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Monitor className="w-3 h-3" />
                                Uygulama
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={isSending || !message.trim()}
                        className="rounded-full h-12 w-12 bg-[#00A884] hover:bg-[#017561] text-white p-0 shrink-0 shadow-md flex items-center justify-center transition-all active:scale-90"
                    >
                        <Send className="h-5 w-5 ml-0.5" />
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
