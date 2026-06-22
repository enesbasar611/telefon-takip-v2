"use client";

import { Label } from "@/components/ui/label";
import { VariableTextarea } from "@/components/ui/variable-textarea";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface WhatsAppTemplatesSectionProps {
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
}

const templates = [
    {
        key: "whatsappNewService",
        label: "Yeni Servis Kabul",
        desc: "Servis kaydı açıldığında müşteriye gönderilecek mesaj",
        color: "blue",
        defaultValue: "🟢 Sayın {musteri_adi}, {cihaz} cihazınız {servis_no} numarası ile servisimize kabul edilmiştir. İşlemler başladığında size bilgi verilecektir. ✨",
        variables: ["{musteri_adi}", "{cihaz}", "{servis_no}"],
    },
    {
        key: "whatsappReady",
        label: "Servis Hazır",
        desc: "Cihaz tamiri tamamlandığında gönderilecek mesaj",
        color: "emerald",
        defaultValue: "🎊 Sayın {musteri_adi}, {cihaz} cihazınızın tamiri tamamlanmıştır! Teslim alabilirsiniz. 🏪",
        variables: ["{musteri_adi}", "{cihaz}"],
    },
    {
        key: "whatsappAppointment",
        label: "Yeni Randevu",
        desc: "Randevu oluşturulduğunda bilgilendirme mesajı",
        color: "purple",
        defaultValue: "📅 Sayın {musteri_adi}, {tarih} tarihinde randevunuz oluşturulmuştur. Sizi bekliyoruz! ⭐",
        variables: ["{musteri_adi}", "{tarih}", "{saat}"],
    },
    {
        key: "whatsappPaymentReminder",
        label: "Ödeme Hatırlatıcı",
        desc: "Gecikmiş ödeme durumunda gönderilecek mesaj",
        color: "amber",
        defaultValue: "🔔 Sayın {musteri_adi}, {tutar} tutarındaki ödemeniz hakkında hatırlatma. Ödeme için bize ulaşabilirsiniz. ⭐",
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

export function WhatsAppTemplatesSection({ formData, onChange }: WhatsAppTemplatesSectionProps) {
    return (
        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-[#222]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <MessageCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">WhatsApp Mesaj Şablonları</Label>
                    <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Olay bazlı otomatik mesaj içeriklerini buradan düzenleyebilirsiniz.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {templates.map((t) => (
                    <div key={t.key} className="space-y-3 p-5 rounded-2xl bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] transition-all group shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest border shadow-sm uppercase", colorMap[t.color])}>
                                {t.label}
                            </div>
                        </div>
                        <VariableTextarea
                            value={formData[t.key] || t.defaultValue}
                            onChange={(e) => onChange(t.key, e.target.value)}
                            onBlur={(e) => onChange(t.key, e.target.value, true)}
                            onValueChange={(val) => onChange(t.key, val, true)}
                            variables={t.variables}
                            className="bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-border/50 rounded-xl text-xs text-slate-900 dark:text-white min-h-[80px] focus:border-blue-500/50 transition-all font-medium leading-relaxed"
                            placeholder={t.defaultValue}
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {t.variables.map((v) => (
                                <span key={v} className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-bold border transition-all cursor-default", badgeColorMap[t.color])}>
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
