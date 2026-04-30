"use client";

import { Shield, User, AlertCircle, ArrowRight, MessageSquare, ExternalLink } from "lucide-react";
import { SystemNotification } from "@/lib/actions/notification-actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";

export function NotificationSidebar({
    notifications: incomingNotifications,
    serviceStats
}: {
    notifications: any;
    serviceStats?: { active: number; ready: number; done: number; all: number; };
}) {
    const router = useRouter();
    const notifications = Array.isArray(incomingNotifications)
        ? incomingNotifications
        : (incomingNotifications?.notifications || []);

    const warrantyAlerts = notifications.filter((n: any) => n.type === "WARRANTY_EXPIRY");
    const pendingApprovals = notifications.filter((n: any) => n.type === "PENDING_APPROVAL");
    const delayedServices = notifications.filter((n: any) => n.type === "DELIVERY_TIME");

    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    const handleWhatsAppClick = (phone: string, message: string, name?: string) => {
        setSelectedNotification({ phone, message, name });
        setWhatsappModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-5 w-full lg:w-[320px] shrink-0">
            {/* Garanti Bitiş Uyarısı Widget */}
            {warrantyAlerts.length > 0 && (
                <div className="bg-slate-900 dark:bg-black/40 backdrop-blur-3xl rounded-2xl p-5 border border-white/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Shield className="h-4 w-4 text-foreground/90" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px]  text-foreground uppercase tracking-widest backdrop-blur-md border border-border/50">
                            GARANTİ
                        </span>
                    </div>

                    <div className="relative z-10">
                        <h3 className="font-bold text-lg text-white mb-1.5 leading-tight">
                            Garanti Uyarısı
                        </h3>
                        <p className="text-[12px] font-bold text-slate-300 leading-snug mb-4">
                            {warrantyAlerts[0].message}
                        </p>
                        <Button
                            onClick={() => router.push(`/servis?highlight=${warrantyAlerts[0].referenceId}`)}
                            className="w-full h-10 rounded-xl bg-white text-slate-900 hover:bg-slate-200 font-bold text-xs transition-all shadow-lg"
                        >
                            Teklif Hazırla
                        </Button>
                    </div>
                </div>
            )}

            {/* Onay Bekleyenler & Gecikmiş Servis Widget */}
            <div className="bg-card dark:bg-black/20 border border-border/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent opacity-50 dark:opacity-100" />

                <div className="flex items-center justify-between mb-5 relative z-10">
                    <h3 className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest">
                        ONAY BEKLEYENLER
                    </h3>
                    <div className="h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px]  shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        {pendingApprovals.length}
                    </div>
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                    {pendingApprovals.length === 0 ? (
                        <p className="text-xs text-muted-foreground/80 font-medium">Şu an bekleyen işlem yok.</p>
                    ) : (
                        pendingApprovals.slice(0, 3).map((pending: SystemNotification) => (
                            <div key={pending.id} className="flex gap-3 animate-in fade-in duration-500">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50 relative group/avatar">
                                    <User className="h-4 w-4 text-muted-foreground group-hover/avatar:text-blue-400 transition-colors" />
                                    <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-[#0B1120] flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <div className="space-y-0.5">
                                        <h4 className="font-bold text-[13px] text-foreground dark:text-white leading-none truncate tracking-tight">
                                            {pending.message.split('-')[0].trim().replace('Müşteri:', '').trim()}
                                        </h4>
                                        <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                                            Maliyet onayı bekleniyor ({pending.metadata?.cost?.toLocaleString('tr-TR')} TL)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => {
                                                const name = pending.message.split('-')[0].trim().replace('Müşteri:', '').trim();
                                                handleWhatsAppClick(pending.metadata?.phone || "", "Merhaba, cihazınızın onarım onayı hakkında görüşmek istemiştik.", name);
                                            }}
                                            className="h-8 px-4 rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white text-[10px]  transition-all gap-1.5 border border-emerald-500/20"
                                        >
                                            <MessageSquare className="h-3 w-3 fill-current" /> WhatsApp
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => router.push(`/servis?highlight=${pending.referenceId}`)}
                                            className="h-8 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground text-[10px]  gap-1.5 border border-border/50 transition-all"
                                        >
                                            <ExternalLink className="h-3 w-3" /> Detay
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Gecikmiş Servis Alert - Real Data */}
                {delayedServices.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-border/50 space-y-4 relative z-10">
                        {delayedServices.slice(0, 2).map((delayed: SystemNotification) => (
                            <div key={delayed.id} className="flex gap-3 transition-all hover:translate-x-1">
                                <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                                    <AlertCircle className="h-4 w-4 text-rose-500" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h4 className="font-bold text-[12px] text-foreground dark:text-white leading-none">
                                        {delayed.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-muted-foreground leading-tight">
                                        {delayed.message}
                                    </p>
                                    <Button
                                        onClick={() => router.push(`/servis?highlight=${delayed.referenceId}`)}
                                        className="h-7 px-4 mt-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[9px]  self-start transition-all shadow-lg shadow-rose-600/20"
                                    >
                                        HIZLANDIR
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cihaz Takibi Widget - Real Data */}
            <div
                onClick={() => router.push('/servis')}
                className="bg-muted/50 dark:bg-black/20 rounded-2xl p-5 border border-border/50 relative overflow-hidden group hover:bg-muted dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm"
            >
                <div className="absolute inset-0 bg-white/[0.01] opacity-20 pointer-events-none" />
                <div className="relative z-10 flex flex-col h-full justify-end min-h-[100px]">
                    <h3 className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5 ml-0.5">
                        CİHAZ TAKİBİ
                    </h3>
                    <div className="flex items-end justify-between mb-4">
                        <span className="text-xl font-bold text-foreground dark:text-white leading-none tracking-tight">
                            {serviceStats?.active || 0} Cihaz Onarımda
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-white transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.7)] transition-all duration-1000"
                            style={{ width: `${serviceStats ? (serviceStats.active / (serviceStats.all || 1)) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {selectedNotification && (
                <WhatsAppConfirmModal
                    isOpen={whatsappModalOpen}
                    onClose={() => {
                        setWhatsappModalOpen(false);
                        setSelectedNotification(null);
                    }}
                    phone={selectedNotification.phone}
                    customerName={selectedNotification.name || "Müşteri"}
                    initialMessage={selectedNotification.message}
                />
            )}
        </div>
    );
}





