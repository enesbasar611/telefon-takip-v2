"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { industries, IndustryType } from "@/config/industries";
import { updateShopModules } from "@/lib/actions/setting-actions";
import { toast } from "sonner";
import {
    Wrench, Package, ShoppingCart, BarChart3, Barcode,
    Heart, Calendar, CheckCircle2, Sparkles, Info,
    Users, Wallet, Truck, UserCheck, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ALL_MODULES = [
    {
        key: "SERVICE",
        icon: Wrench,
        label: "Servis & Arıza Takibi",
        desc: "Teknik servis kayıtları, iş emirleri, cihaz takibi ve randevu yönetimi.",
        color: "blue",
    },
    {
        key: "STOCK",
        icon: Package,
        label: "Envanter & Stok",
        desc: "Ürün, malzeme ve parça stoğunu takip edin, hareket raporları alın.",
        color: "violet",
    },
    {
        key: "SALE",
        icon: ShoppingCart,
        label: "POS & Kasa",
        desc: "Hızlı satış ekranı, fiş kesimi, kasa açılış-kapanış raporu.",
        color: "emerald",
    },
    {
        key: "FINANCE",
        icon: BarChart3,
        label: "Finans & Raporlar",
        desc: "Gelir-gider takibi, kasa özeti, istatistik paneli.",
        color: "amber",
    },
    {
        key: "CRM",
        icon: Users,
        label: "Müşteri Yönetimi (CRM)",
        desc: "Müşteri listesi, iletişim geçmişi ve özel kayıtlar.",
        color: "cyan",
    },
    {
        key: "DEBT",
        icon: Wallet,
        label: "Veresiye & Borç Takibi",
        desc: "Müşteri borçları, ödeme planları ve borç hatırlatıcıları.",
        color: "rose",
    },
    {
        key: "SUPPLIER",
        icon: Truck,
        label: "Toptancı & Tedarikçi",
        desc: "Tedarikçi borçları, malzeme alımları ve stok girişleri.",
        color: "blue",
    },
    {
        key: "STAFF",
        icon: UserCheck,
        label: "Personel Takibi",
        desc: "Personel maaş, prim ve performans takibi.",
        color: "violet",
    },
    {
        key: "NOTIFICATION",
        icon: MessageSquare,
        label: "WhatsApp Bildirimleri",
        desc: "Otomatik durum güncellemeleri ve müşteri mesajları.",
        color: "emerald",
    },
    {
        key: "LOYALTY",
        icon: Heart,
        label: "Sadakat Programı",
        desc: "Müşteri puan sistemi, indirim ve sadakat kampanyaları.",
        color: "rose",
    },
    {
        key: "APPOINTMENT",
        icon: Calendar,
        label: "Randevu & Ajanda",
        desc: "Müşteri randevu takvimi ve iş planlayıcı.",
        color: "cyan",
    },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/40", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300" },
    rose: { bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400", badge: "bg-rose-500/20 text-rose-300" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400", badge: "bg-cyan-500/20 text-cyan-300" },
};

export function ModulesTab({ shop }: { shop: any }) {
    const industryConf = shop ? (industries[shop.industry as IndustryType] || industries.GENERAL) : industries.GENERAL;
    const recommended = industryConf.features;

    const [selected, setSelected] = useState<string[]>(() => {
        if (shop?.enabledModules && shop.enabledModules.length > 0) {
            return shop.enabledModules;
        }
        return recommended;
    });
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const toggle = (key: string) => {
        setSelected((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateShopModules(selected);
            if (res.success) {
                toast.success("Modüller güncellendi. Sayfa yenileniyor...");
                setDirty(false);
                setTimeout(() => window.location.reload(), 800);
            } else {
                toast.error(res.error || "Bir hata oluştu.");
            }
        } finally {
            setSaving(false);
        }
    };

    const resetToRecommended = () => {
        setSelected(recommended);
        setDirty(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Aktif Modüller</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Sisteminizde hangi modüllerin görüneceğini seçin.
                        Kapalı modüller menüden gizlenir.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button asChild size="sm" variant="outline" className="rounded-xl gap-2">
                        <Link href="/ayarlar/moduller">
                            <Barcode className="h-4 w-4" />
                            Barkod okuyucu
                        </Link>
                    </Button>
                    <span className="text-xs text-muted-foreground/60 hidden sm:block">
                        {industryConf.name} şablonu
                    </span>
                    <button
                        onClick={resetToRecommended}
                        className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                        Önerilen
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-white font-medium">Sektörünüz: {industryConf.name}.</span>{" "}
                    Önerilen modüller <span className="text-blue-400">mavi</span> olarak işaretlenmiştir.
                    Değişiklikler kayıt sonrası hemen geçerli olur.
                </p>
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {ALL_MODULES.map((mod) => {
                    const isActive = selected.includes(mod.key);
                    const isRecommended = recommended.includes(mod.key);
                    const colors = colorMap[mod.color];
                    const Icon = mod.icon;

                    return (
                        <motion.button
                            key={mod.key}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggle(mod.key)}
                            className={`relative flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 outline-none w-full
                ${isActive
                                    ? `${colors.bg} ${colors.border}`
                                    : "bg-card border-border/40 hover:border-border"
                                }`}
                        >
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                ${isActive ? colors.bg : "bg-muted/30"}`}>
                                <Icon className={`h-4 w-4 transition-colors ${isActive ? colors.text : "text-muted-foreground/40"}`} />
                            </div>

                            <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm font-semibold leading-tight transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                        {mod.label}
                                    </p>
                                    {isRecommended && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors.badge}`}>
                                            Önerilen
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-snug">
                                    {mod.desc}
                                </p>
                            </div>

                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute top-3 right-3"
                                    >
                                        <CheckCircle2 className={`h-4 w-4 ${colors.text}`} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Save Bar */}
            <AnimatePresence>
                {dirty && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center justify-between gap-4 bg-card border border-border/50 rounded-2xl px-5 py-3"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span className="text-sm text-muted-foreground">
                                Kaydedilmemiş değişiklikler var
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const current = shop?.enabledModules?.length ? shop.enabledModules : recommended;
                                    setSelected(current);
                                    setDirty(false);
                                }}
                            >
                                İptal
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-xl"
                            >
                                {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
