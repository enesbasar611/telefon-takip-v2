"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Smartphone, CheckCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendWhatsAppAction, getWhatsAppStatusAction } from "@/lib/actions/data-management-actions";
import { formatWhatsAppLink } from "@/lib/utils/notifications";

interface WhatsAppConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone: string;
    customerName?: string;
    initialMessage: string;
}

export function WhatsAppConfirmModal({ isOpen, onClose, phone, customerName, initialMessage }: WhatsAppConfirmModalProps) {
    const [message, setMessage] = useState(initialMessage);
    const [isSending, setIsSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

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
            checkStatus();
        }
    }, [isOpen, initialMessage]);

    const checkStatus = async () => {
        try {
            const res = await getWhatsAppStatusAction();
            setIsConnected(res.status === 'CONNECTED');
        } catch {
            setIsConnected(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        if (isConnected) {
            setIsSending(true);
            const res = await sendWhatsAppAction(phone, message);
            setIsSending(false);

            if (res.success) {
                toast({ title: "Başarılı", description: "WhatsApp mesajı başarıyla gönderildi." });
                onClose();
            } else {
                toast({ title: "Hata", description: "Mesaj gönderilemedi: " + res.error, variant: "destructive" });
            }
        } else {
            // Fallback to Web/App WhatsApp
            const link = formatWhatsAppLink(phone, message);
            window.open(link, '_blank');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#EFEAE2] dark:bg-[#0B141A] p-0 border-none overflow-hidden">

                {/* WhatsApp Header Mockup */}
                <div className="bg-[#00A884] dark:bg-[#202C33] flex items-center gap-3 px-4 py-3 text-white">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                        <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">{customerName || "Müşteri"}</p>
                        <p className="text-xs text-white/80">{phone}</p>
                    </div>
                </div>

                {/* Chat Background & Bubble */}
                <div className="p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat min-h-[300px] flex flex-col justify-end">
                    <div className="bg-[#D9FDD3] dark:bg-[#005C4B] md:max-w-[85%] max-w-[95%] self-end rounded-lg rounded-tr-none p-2 shadow-sm relative">
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
                                    disabled={isRefining}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/5 hover:text-[#00A884] gap-1.5 font-medium transition-all active:scale-95"
                                >
                                    {isRefining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    Profesyonel
                                </Button>
                                <Button
                                    onClick={() => handleRefine("friendly")}
                                    disabled={isRefining}
                                    variant="ghost"
                                    className="h-7 px-2.5 rounded-lg text-[10px] hover:bg-[#00000005] dark:hover:bg-white/5 hover:text-[#00A884] gap-1.5 font-medium transition-all active:scale-95"
                                >
                                    Samimi
                                </Button>
                                <Button
                                    onClick={() => handleRefine("urgent")}
                                    disabled={isRefining}
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
                <div className="bg-[#F0F2F5] dark:bg-[#202C33] px-4 py-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground flex-1">
                        {isConnected ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCheck className="h-4 w-4" /> Sistem üzerinden gönderilecek
                            </span>
                        ) : (
                            <span className="font-medium text-amber-600 dark:text-amber-400">WhatsApp Web / App kullanılarak gönderilecek</span>
                        )}
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={isSending || !message.trim()}
                        className="rounded-full h-12 w-12 bg-[#00A884] hover:bg-[#017561] text-white p-0 shrink-0 shadow-md"
                    >
                        <Send className="h-5 w-5 ml-1" />
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
