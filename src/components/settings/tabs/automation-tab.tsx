"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Bell, Printer, CalendarClock, BarChart3, ShieldCheck, Zap, Loader2 } from "lucide-react";

interface AutomationTabProps {
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
    savingKeys: Set<string>;
}

const automationItems = [
    {
        key: "confirmBeforeMessage",
        label: "Mesaj göndermeden önce onay sor",
        desc: "WhatsApp mesajları gönderilmeden önce onay diyaloğu gösterir",
        icon: Bell,
        color: "blue",
        default: "true",
    },
    {
        key: "autoReceiptOnService",
        label: "Servis kaydında otomatik fiş yazdır",
        desc: "Yeni servis kaydı açıldığında otomatik olarak fiş yazdırılır",
        icon: Printer,
        color: "emerald",
        default: "false",
    },
    {
        key: "autoReminderOnDelivery",
        label: "Teslimat ertelendiğinde hatırlatma oluştur",
        desc: "Randevu veya teslimat ertelendiğinde otomatik hatırlatma bildirimi oluşur",
        icon: CalendarClock,
        color: "purple",
        default: "true",
    },
    {
        key: "showFinancialOnDashboard",
        label: "Dashboard'da finansal özeti göster",
        desc: "Ana sayfa üzerinde gelir/gider kartlarını aktif eder",
        icon: BarChart3,
        color: "amber",
        default: "true",
    },
    {
        key: "requireApprovalForDiscount",
        label: "İndirim için yönetici onayı iste",
        desc: "Belirli bir tutarın üzerindeki indirimlerde admin onayı gerektirir",
        icon: ShieldCheck,
        color: "red",
        default: "false",
    },
    {
        key: "autoStockAlert",
        label: "Otomatik stok uyarısı oluştur",
        desc: "Stok seviyesi minimum değerin altına düştüğünde bildirim gönderir",
        icon: Zap,
        color: "cyan",
        default: "true",
    },
];

const iconColorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    red: "text-red-400 bg-red-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
};

export function AutomationTab({ formData, onChange, savingKeys }: AutomationTabProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-900 dark:text-white">Otomasyon & Onay Kuralları</Label>
                <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">İş akışlarını özelleştirin. Her ayar anında uygulamaya yansır.</p>
            </div>

            <div className="space-y-3">
                {automationItems.map((item) => {
                    const Icon = item.icon;
                    const isEnabled = (formData[item.key] || item.default) === "true";
                    const isSaving = savingKeys.has(item.key);

                    return (
                        <div
                            key={item.key}
                            className={cn(
                                "flex items-center gap-5 p-5 rounded-2xl border transition-[opacity,border-color,background-color] duration-200",
                                isEnabled
                                    ? "border-slate-200 dark:border-[#333] bg-white dark:bg-[#111] shadow-sm"
                                    : "border-slate-100 dark:border-[#1a1a1a] bg-slate-50/50 dark:bg-[#0a0a0a] opacity-60"
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColorMap[item.color])}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-slate-900 dark:text-white block">{item.label}</span>
                                <span className="text-[10px] text-muted-foreground/80 dark:text-muted-foreground block mt-0.5">{item.desc}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {isSaving && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => onChange(item.key, checked ? "true" : "false", true)}
                                    disabled={isSaving}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
