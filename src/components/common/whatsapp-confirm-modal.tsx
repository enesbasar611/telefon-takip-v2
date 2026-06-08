"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Smartphone, CheckCheck, Sparkles, Loader2, AlertTriangle, Settings, Moon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendWhatsAppAction, getWhatsAppStatusAction } from "@/lib/actions/data-management-actions";
import { formatWhatsAppLink } from "@/lib/utils/notifications";
import { useRouter } from "next/navigation";

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
    const [isConnected, setIsConnected] = useState(false);
    const [isSleeping, setIsSleeping] = useState(false);
    const [errorCode, setErrorCode] = useState<string | undefined>();
    const [statusError, setStatusError] = useState<string | undefined>();
    const [isRefining, setIsRefining] = useState(false);
    const router = useRouter();

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
            setIsSleeping(res.status === 'SLEEPING');
            setErrorCode((res as any).errorCode);
            setStatusError(res.error);
        } catch {
            setIsConnected(false);
        }
    };

    const targetPhones = mode === "bulk" ? phones : [phone].filter(Boolean) as string[];

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);

        if (isConnected || isSleeping) {
            // Bağlı veya uyku modunda - sistem üzerinden gönder (uyku modundaysa lazy wake tetiklenecek)
            let successCount = 0;
            let lastError = '';
            for (const p of targetPhones) {
                const res = await sendWhatsAppAction(p, message);
                if (res.success) {
                    successCount++;
                } else {
                    lastError = res.error || '';
                }
                await new Promise(r => setTimeout(r, 500));
            }
            setIsSending(false);

            if (lastError === 'LOGGED_OUT_BY_PHONE') {
                toast({
                    title: "WhatsApp Bağlantısı Kesildi",
                    description: "Telefonunuzdan bağlı cihazlardan çıkış yapılmış. Lütfen WhatsApp'a yeniden bağlanın.",
                    variant: "destructive",
                    action: (
                        <Button variant="outline" size="sm" onClick={() => { onClose(); router.push('/ayarlar'); }}>
                            Ayarlara Git
                        </Button>
                    )
                });
                return;
            }

            if (successCount > 0) {
                toast({ title: "Başarılı", description: `${successCount} mesaj başarıyla gönderildi.${isSleeping ? ' (Uyku modundan uyandırıldı)' : ''}` });
                onClose();
            } else {
                toast({
                    title: "Hata",
                    description: lastError || "Mesaj gönderilemedi. WhatsApp bağlantınızı veya numara formatını kontrol edin.",
                    variant: "destructive"
                });
            }
        } else {
            // Fallback to Web/App WhatsApp (one by one)
            for (const p of targetPhones) {
                const link = formatWhatsAppLink(p, message);
                window.open(link, '_blank');
                await new Promise(r => setTimeout(r, 1000));
            }
            setIsSending(false);
            onClose();
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
                        <p className="font-semibold">{mode === "bulk" ? "Toplu Hatırlatma" : (customerName || "Müşteri")}</p>
                        <p className="text-xs text-white/80">{mode === "bulk" ? `${targetPhones.length} Alıcı` : phone}</p>
                    </div>
                </div>

                {/* Chat Background & Bubble */}
                <div className="p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat min-h-[300px] flex flex-col justify-end relative">
                    {isSending && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-3">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                            <p className="text-white font-bold text-sm">Gönderiliyor...</p>
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

                {/* Disconnect / Logout Warning Banner */}
                {errorCode === 'LOGGED_OUT_BY_PHONE' && (
                    <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400">WhatsApp Bağlantısı Kesildi</p>
                            <p className="text-[10px] text-red-500/80 dark:text-red-400/70 mt-0.5">Telefonunuzdan bağlı cihazlar kısmından çıkış yapılmış.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 text-[10px] border-red-500/30 text-red-600 hover:bg-red-500/10"
                                onClick={() => { onClose(); router.push('/ayarlar'); }}
                            >
                                <Settings className="h-3 w-3 mr-1" />
                                Ayarlara Git ve Yeniden Bağla
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer actions */}
                <div className="bg-[#F0F2F5] dark:bg-[#202C33] px-4 py-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground flex-1">
                        {isConnected ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCheck className="h-4 w-4" /> Sistem üzerinden gönderilecek
                            </span>
                        ) : isSleeping ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                <Moon className="h-4 w-4" /> Uyku modunda - gönderimde uyandırılacak
                            </span>
                        ) : errorCode === 'LOGGED_OUT_BY_PHONE' ? (
                            <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" /> Bağlantı kesildi - ayarlardan bağlayın
                            </span>
                        ) : (
                            <span className="font-medium text-amber-600 dark:text-amber-400">WhatsApp Web / App kullanılacak</span>
                        )}
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
