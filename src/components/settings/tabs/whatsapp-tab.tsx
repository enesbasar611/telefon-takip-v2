"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, QrCode, RefreshCw, Wifi, WifiOff, LogOut, CheckCircle2 } from "lucide-react";

interface WhatsAppTabProps {
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
    savingKeys: Set<string>;
}

const templates = [
    {
        key: "whatsappNewService",
        label: "Yeni Servis Kabul",
        desc: "Servis kaydı açıldığında müşteriye gönderilecek mesaj",
        color: "blue",
        defaultValue: "Sayın {musteri_adi}, {cihaz} cihazınız {servis_no} numarası ile servisimize kabul edilmiştir.",
        variables: ["{musteri_adi}", "{cihaz}", "{servis_no}"],
    },
    {
        key: "whatsappReady",
        label: "Servis Hazır",
        desc: "Cihaz tamiri tamamlandığında gönderilecek mesaj",
        color: "emerald",
        defaultValue: "Sayın {musteri_adi}, {cihaz} cihazınızın tamiri tamamlanmıştır. Teslim alabilirsiniz.",
        variables: ["{musteri_adi}", "{cihaz}"],
    },
    {
        key: "whatsappAppointment",
        label: "Yeni Randevu",
        desc: "Randevu oluşturulduğunda bilgilendirme mesajı",
        color: "purple",
        defaultValue: "Sayın {musteri_adi}, {tarih} tarihinde randevunuz oluşturulmuştur. Sizi bekliyoruz!",
        variables: ["{musteri_adi}", "{tarih}", "{saat}"],
    },
    {
        key: "whatsappPaymentReminder",
        label: "Ödeme Hatırlatıcı",
        desc: "Gecikmiş ödeme durumunda gönderilecek mesaj",
        color: "amber",
        defaultValue: "Sayın {musteri_adi}, {tutar} tutarındaki ödemeniz hakkında hatırlatma. Ödeme için bize ulaşabilirsiniz.",
        variables: ["{musteri_adi}", "{tutar}", "{servis_no}"],
    },
];

const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

const badgeColorMap: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};



export function WhatsAppTab({ formData, onChange, savingKeys }: WhatsAppTabProps) {
    const [statusData, setStatusData] = useState<{
        status: string;
        qr?: string;
        error?: string;
        me?: { name: string; number: string };
    }>({ status: 'DISCONNECTED' });
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/whatsapp/config');
            const data = await res.json();
            setStatusData(data);
        } catch (err) {
            console.error('Fetch status error', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (action: 'initialize' | 'logout') => {
        setLoading(true);
        try {
            await fetch('/api/whatsapp/config', {
                method: 'POST',
                body: JSON.stringify({ action }),
                headers: { 'Content-Type': 'application/json' }
            });
            setTimeout(fetchStatus, 2000);
        } catch (err) {
            console.error('Action error', err);
        } finally {
            setLoading(false);
        }
    };

    const isConnected = statusData.status === 'CONNECTED';
    const isConnecting = statusData.status === 'CONNECTING';
    const isQr = statusData.status === 'QR';

    const isConfirmSaving = savingKeys.has("whatsappConfirmBeforeSend");

    return (
        <div className="space-y-10">
            {/* WhatsApp Web Connection Control */}
            <div className={cn(
                "p-8 rounded-2xl border transition-all space-y-8 shadow-sm",
                isConnected
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-slate-200 dark:border-[#222] bg-white dark:bg-[#111]"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "w-14 h-14 rounded-xl border flex items-center justify-center transition-all shadow-lg",
                            isConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10" : "bg-slate-500/10 border-slate-500/20 text-muted-foreground/80"
                        )}>
                            <MessageCircle className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">WhatsApp Web Bağlantısı</h3>
                                {!isConnected && (
                                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground mt-1">Ekstra servis gerektirmeyen doğrudan tarayıcı bağlantısı.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <button
                                onClick={() => handleAction('logout')}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                                OTURUMU KAPAT
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction('initialize')}
                                disabled={loading || isConnecting}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all flex items-center gap-2",
                                    isConnecting ? "bg-amber-500/10 text-amber-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                )}
                            >
                                {loading || isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                {isConnecting ? 'BAĞLANILIYOR...' : 'BAĞLANTIYI BAŞLAT'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* QR Code or Status Display */}
                    <div className="relative group">
                        <div className={cn(
                            "aspect-square max-w-[280px] mx-auto rounded-3xl border border-dashed flex flex-col items-center justify-center gap-4 transition-all overflow-hidden bg-slate-50/50 dark:bg-black/40 shadow-inner",
                            isConnected ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-500" : "border-slate-200 dark:border-border text-muted-foreground"
                        )}>
                            {isConnected ? (
                                <div className="text-center space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-emerald-400 font-black text-sm tracking-widest">BAĞLANDI</p>
                                        {statusData.me ? (
                                            <div className="mt-2 text-center">
                                                <p className="text-white font-bold text-xs">{statusData.me.name}</p>
                                                <p className="text-emerald-500/60 font-mono text-[9px]">+{statusData.me.number}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground/80 font-medium">Sistem mesaj göndermeye hazır.</p>
                                        )}
                                    </div>
                                </div>
                            ) : isQr && statusData.qr ? (
                                <div className="p-4 bg-white rounded-2xl animate-in fade-in zoom-in duration-700 shadow-2xl">
                                    <img src={statusData.qr} alt="WhatsApp QR" className="w-full h-full" />
                                </div>
                            ) : (
                                <div className="text-center space-y-3 opacity-50">
                                    <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                                    <p className="text-[10px] text-slate-600 font-bold max-w-[140px] leading-relaxed uppercase tracking-widest">BAĞLANMAK İÇİN SİSTEMİ BAŞLATIN</p>
                                </div>
                            )}

                            {isConnecting && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">PUPPETEER BAŞLATILIYOR...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operational Settings */}
                    <div className="flex flex-col justify-between py-2 space-y-6">
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-black/40 border border-slate-200 dark:border-border/50 space-y-4 hover:border-blue-500/20 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Otomatik Onay Mekanizması</h4>
                                        <p className="text-[10px] text-muted-foreground/80 dark:text-muted-foreground leading-relaxed">Mesajları göndermeden önce onay ekranı gösterinsin mi?</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isConfirmSaving && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                        <Switch
                                            checked={formData.whatsappConfirmBeforeSend === "true"}
                                            onCheckedChange={(checked) => onChange("whatsappConfirmBeforeSend", checked ? "true" : "false", true)}
                                            disabled={isConfirmSaving}
                                        />
                                    </div>
                                </div>
                            </div>

                            {!isConnected && statusData.error && (
                                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex gap-4 animate-in slide-in-from-top-2 duration-500 mb-4">
                                    <WifiOff className="h-5 w-5 text-rose-500 shrink-0" />
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Bağlantı Sorunu</h4>
                                        <p className="text-[10px] text-rose-400 font-medium leading-relaxed">{statusData.error}</p>
                                        <p className="text-[9px] text-rose-400/60 mt-2 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-rose-400/40" />
                                            İpucu: Telefonunuzun internete bağlı olduğundan emin olun.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-black/40 border border-slate-200 dark:border-border/50 flex gap-4 opacity-70">
                                <Wifi className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black text-muted-foreground/80 dark:text-muted-foreground uppercase tracking-widest">Sistem Notu</h4>
                                    <p className="text-[10px] text-muted-foreground/80 dark:text-muted-foreground leading-relaxed font-medium">Bağlantıyı başlattıktan 10-20 saniye sonra QR kod görünecektir. Bağlantı bir kez kurulduktan sonra telefonunuzun açık olması yeterlidir.</p>
                                </div>
                            </div>
                        </div>

                        {isConnected && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">Canlı BAĞLANTI AKTİF</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Message Templates */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                    <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Mesaj Şablonları</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Her durum için özel mesaj şablonu tanımlayın. Değişkenler otomatik değerle doldurulur.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {templates.map((t) => (
                        <div key={t.key} className="space-y-4 p-6 rounded-2xl bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] hover:border-slate-300 dark:hover:border-[#333] transition-all group shadow-sm hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border shadow-sm uppercase", colorMap[t.color])}>
                                    {t.label}
                                </div>
                            </div>
                            <Textarea
                                value={formData[t.key] || t.defaultValue}
                                onChange={(e) => onChange(t.key, e.target.value)}
                                className="bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-border/50 rounded-xl text-xs text-slate-900 dark:text-white min-h-[100px] focus:border-blue-500/50 transition-all font-medium leading-relaxed"
                                placeholder={t.defaultValue}
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] text-slate-600 font-bold tracking-widest mr-1 opacity-50">DEĞİŞKENLER:</span>
                                {t.variables.map((v) => (
                                    <span key={v} className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold border transition-all hover:scale-105", badgeColorMap[t.color])}>
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
