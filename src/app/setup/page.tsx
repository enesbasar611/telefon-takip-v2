"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { industries, IndustryType } from "@/config/industries";
import { updateShopModules } from "@/lib/actions/setting-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { toast } from "sonner";
import {
    Wrench, Package, ShoppingCart, CreditCard, BarChart3,
    Heart, Calendar, CheckCircle2, ArrowRight, Zap, Sparkles
} from "lucide-react";
import { IndustryBackground } from "@/components/industry-background";

const ALL_MODULES = [
    {
        key: "SERVICE",
        icon: Wrench,
        label: "Servis & Arıza Takibi",
        desc: "Müşteri cihazlarını, iş emirlerini ve arızaları kayıt altına alın.",
        color: "blue",
    },
    {
        key: "STOCK",
        icon: Package,
        label: "Envanter & Stok Yönetimi",
        desc: "Ürün, malzeme ve parça stoğunu takip edin.",
        color: "violet",
    },
    {
        key: "SALE",
        icon: ShoppingCart,
        label: "POS & Kasa",
        desc: "Hızlı satış, fiş ve kasa raporu.",
        color: "emerald",
    },
    {
        key: "FINANCE",
        icon: BarChart3,
        label: "Finans & Raporlar",
        desc: "Gelir-gider takibi, kasa özeti ve istatistikler.",
        color: "amber",
    },
    {
        key: "LOYALTY",
        icon: Heart,
        label: "Müşteri Sadakat Programı",
        desc: "Puan, indirim ve sadakat kampanyaları oluşturun.",
        color: "rose",
    },
    {
        key: "APPOINTMENT",
        icon: Calendar,
        label: "Randevu & Ajanda",
        desc: "Müşteri randevularını ajandanızda yönetin.",
        color: "cyan",
    },
];

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/50", text: "text-blue-400", glow: "shadow-blue-500/20" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/50", text: "text-violet-400", glow: "shadow-violet-500/20" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/50", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-400", glow: "shadow-amber-500/20" },
    rose: { bg: "bg-rose-500/10", border: "border-rose-500/50", text: "text-rose-400", glow: "shadow-rose-500/20" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/50", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
};

export default function SetupPage() {
    const router = useRouter();
    const [shop, setShop] = useState<any>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        getShop().then((s) => {
            if (!s) { router.replace("/dashboard"); return; }
            setShop(s);
            // Pre-select recommended modules for this industry
            const industryConf = industries[s.industry as IndustryType] || industries.GENERAL;
            setSelected(industryConf.features);
        });
    }, []);

    const toggle = (key: string) => {
        setSelected((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateShopModules(selected);
            if (res.success) {
                toast.success("Kurulum tamamlandı! Dashboard'a yönlendiriliyorsunuz...");
                setTimeout(() => router.replace("/dashboard"), 1200);
            } else {
                toast.error(res.error || "Bir hata oluştu.");
            }
        } finally {
            setSaving(false);
        }
    };

    const industryConf = shop ? (industries[shop.industry as IndustryType] || industries.GENERAL) : null;
    const IndustryIcon = industryConf?.icon || Zap;

    return (
        <div className="h-screen w-screen fixed inset-0 flex items-center justify-center bg-[#050505] overflow-hidden font-sans">
            {shop?.industry && <IndustryBackground industry={shop.industry as IndustryType} />}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-3xl px-4"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    {isMounted && industryConf && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex justify-center mb-4"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-[#111] border border-border flex items-center justify-center shadow-2xl">
                                <IndustryIcon className="h-8 w-8 text-blue-400" />
                            </div>
                        </motion.div>
                    )}
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {shop?.name || "Dükkanınız"} İçin{" "}
                        <span className="text-blue-400">Modülleri Seçin</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        <span className="text-white font-medium">{industryConf?.name}</span> sektörü için önerilen modüller
                        işaretli. İstediğinizi ekleyip çıkarabilirsiniz.
                    </p>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {ALL_MODULES.map((mod, i) => {
                        const isActive = selected.includes(mod.key);
                        const colors = colorMap[mod.color];
                        const Icon = mod.icon;
                        return (
                            <motion.button
                                key={mod.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                onClick={() => toggle(mod.key)}
                                className={`relative flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 outline-none
                  ${isActive
                                        ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
                                        : "bg-[#0A0A0A]/60 border-border/40 hover:border-border"
                                    }`}
                            >
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? colors.bg : "bg-[#111]"}`}>
                                    <Icon className={`h-4 w-4 ${isActive ? colors.text : "text-muted-foreground/50"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold leading-tight ${isActive ? "text-white" : "text-muted-foreground"}`}>
                                        {mod.label}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-snug">{mod.desc}</p>
                                </div>
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
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

                {/* Footer */}
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground/50">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        Bu seçimleri sonradan <span className="text-white">Ayarlar → Modüller</span> bölümünden değiştirebilirsiniz.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving || selected.length === 0}
                        className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {saving ? (
                            <span className="text-sm">Kaydediliyor...</span>
                        ) : (
                            <>
                                <span className="text-sm">Kurulumu Tamamla</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
