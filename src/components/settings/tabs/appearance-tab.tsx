"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import {
    fontFamilies,
    getRadiusForButtonStyle,
    hexToHsl,
} from "@/lib/appearance-settings";

interface AppearanceTabProps {
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
    savingKeys: Set<string>;
}

const brandColors = [
    { name: "Mavi", value: "#3B82F6", tw: "bg-blue-500" },
    { name: "Mor", value: "#8B5CF6", tw: "bg-violet-500" },
    { name: "Yeşil", value: "#10B981", tw: "bg-emerald-500" },
    { name: "Kırmızı", value: "#EF4444", tw: "bg-red-500" },
    { name: "Turuncu", value: "#F97316", tw: "bg-orange-500" },
    { name: "Pembe", value: "#EC4899", tw: "bg-pink-500" },
    { name: "Cyan", value: "#06B6D4", tw: "bg-cyan-500" },
    { name: "Amber", value: "#F59E0B", tw: "bg-amber-500" },
];

const buttonStyles = [
    { label: "Yuvarlak", value: "rounded", preview: "rounded-2xl" },
    { label: "Keskin", value: "sharp", preview: "rounded-md" },
];

export function AppearanceTab({ formData, onChange, savingKeys }: AppearanceTabProps) {
    const currentBrand = formData.brandColor || "#3B82F6";
    const currentBtnStyle = formData.buttonStyle || "rounded";
    const currentFont = formData.fontFamily || "Inter";
    const currentWeight = formData.fontWeight || "500";

    // ─── Dynamic Font Application ───────────────────────────────────────
    useEffect(() => {
        const font = fontFamilies.find(f => f.value === currentFont);
        if (!font) return;

        fontFamilies.forEach((previewFont) => {
            const previewLinkId = `gfont-${previewFont.value.replace(/\s/g, "-")}`;
            if (!document.getElementById(previewLinkId)) {
                const link = document.createElement("link");
                link.id = previewLinkId;
                link.rel = "stylesheet";
                link.href = `https://fonts.googleapis.com/css2?family=${previewFont.gfont}&display=swap`;
                document.head.appendChild(link);
            }
        });

        // 1. Inject selected Google Font link if not already present
        const linkId = `gfont-${font.value.replace(/\s/g, "-")}`;
        if (!document.getElementById(linkId)) {
            const link = document.createElement("link");
            link.id = linkId;
            link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${font.gfont}&display=swap`;
            document.head.appendChild(link);
        }

        // 2. Use a dynamic style tag to override EVERYTHING
        const styleId = "dynamic-font-override";
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `
            :root {
                --app-font: '${currentFont}', system-ui, -apple-system, sans-serif !important;
                --app-font-weight: ${currentWeight};
            }
            body,
            h1, h2, h3, h4, h5, h6,
            button, label, span, p, div,
            input, textarea, select {
                font-family: '${currentFont}', system-ui, -apple-system, sans-serif !important;
                font-weight: ${currentWeight} !important;
            }
            body { font-weight: ${currentWeight} !important; }
        `;
    }, [currentFont, currentWeight]);

    // ─── Dynamic Brand Color Application ────────────────────────────────
    useEffect(() => {
        const hsl = hexToHsl(currentBrand);
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
    }, [currentBrand]);

    useEffect(() => {
        document.documentElement.style.setProperty("--radius", getRadiusForButtonStyle(currentBtnStyle));
    }, [currentBtnStyle]);

    return (
        <div className="space-y-10">
            {/* Brand Color */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">Marka Rengi</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Vurgu rengi ve buton renkleri için kullanılır. Seçim anında uygulanır.</p>
                    </div>
                    {savingKeys.has("brandColor") && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                </div>
                <div className="flex flex-wrap gap-3">
                    {brandColors.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => onChange("brandColor", c.value, true)}
                            disabled={savingKeys.has("brandColor")}
                            className={cn(
                                "w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center border-2",
                                c.tw,
                                currentBrand === c.value
                                    ? "border-white scale-110 shadow-lg ring-2 ring-white/20"
                                    : "border-transparent hover:scale-105 opacity-70 hover:opacity-100"
                            )}
                        >
                            {currentBrand === c.value && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Family */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">Yazı Tipi</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Uygulama genelindeki yazı tipini seçin. Seçim anında uygulanır.</p>
                    </div>
                    {savingKeys.has("fontFamily") && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {fontFamilies.map((f) => {
                        const isActive = currentFont === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => onChange("fontFamily", f.value, true)}
                                disabled={savingKeys.has("fontFamily")}
                                className={cn(
                                    "relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 group",
                                    isActive
                                        ? "border-blue-500 bg-blue-500/10 shadow-md shadow-blue-500/10"
                                        : "border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] hover:border-slate-300 dark:hover:border-[#333] hover:bg-slate-50 dark:hover:bg-[#151515]"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-white" />
                                    </div>
                                )}
                                <span
                                    className={cn("text-2xl font-semibold leading-none", isActive ? "text-blue-600 dark:text-white" : "text-muted-foreground dark:text-muted-foreground/80")}
                                    style={{ fontFamily: `'${f.value}', sans-serif` }}
                                >
                                    Aa
                                </span>
                                <span className={cn("text-[10px] font-bold tracking-wider", isActive ? "text-blue-400" : "text-slate-600")}>
                                    {f.label.toUpperCase()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Typography Weight */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">Yazı Tipi Ağırlığı</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Uygulama genelinde font kalınlığı. Seçim anında uygulanır.</p>
                    </div>
                    {savingKeys.has("fontWeight") && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                </div>
                <div className="flex gap-3">
                    {[
                        { label: "İnce", value: "300", sample: "font-light" },
                        { label: "Normal", value: "400", sample: "font-normal" },
                        { label: "Orta", value: "500", sample: "font-medium" },
                        { label: "Kalın", value: "600", sample: "font-semibold" },
                    ].map((w) => {
                        const isActive = currentWeight === w.value;
                        return (
                            <button
                                key={w.value}
                                onClick={() => onChange("fontWeight", w.value, true)}
                                disabled={savingKeys.has("fontWeight")}
                                className={cn(
                                    "flex-1 py-4 px-3 rounded-xl border-2 transition-all text-center relative shadow-sm",
                                    isActive ? "border-blue-500 bg-blue-500/10" : "border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] hover:border-slate-300 dark:hover:border-[#333]"
                                )}
                            >
                                <span
                                    className={cn("text-lg", w.sample, isActive ? "text-blue-600 dark:text-white" : "text-muted-foreground/80 dark:text-muted-foreground")}
                                    style={{ fontFamily: `'${currentFont}', sans-serif` }}
                                >
                                    Aa
                                </span>
                                <p className="text-[10px] text-muted-foreground/80 mt-1">{w.label}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Button Style */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">Buton Stili</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Uygulama genelinde buton köşe tarzını belirler.</p>
                    </div>
                    {savingKeys.has("buttonStyle") && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                </div>
                <div className="flex gap-4">
                    {buttonStyles.map((s) => (
                        <button
                            key={s.value}
                            onClick={() => onChange("buttonStyle", s.value, true)}
                            disabled={savingKeys.has("buttonStyle")}
                            className={cn(
                                "flex items-center gap-4 p-5 border-2 transition-all duration-200 flex-1 relative shadow-sm",
                                s.preview,
                                currentBtnStyle === s.value
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] hover:border-slate-300 dark:hover:border-[#333]"
                            )}
                        >
                            <div className={cn("w-20 h-8 bg-blue-600", s.preview)} />
                            <span className={cn("text-sm font-semibold", currentBtnStyle === s.value ? "text-blue-400" : "text-muted-foreground")}>
                                {s.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Layout Settings */}
            <div className="pt-6 border-t border-slate-200 dark:border-[#222] space-y-6 text-left">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Sayfa Düzenleri (Admin/Editör)</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Belirli sayfaların görünüm tercihlerini dükkan bazlı özelleştirin.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { key: "layout_hidden_veresiye_stats", label: "Veresiye: İstatistik Kartları", desc: "Üst kısımdaki özet finansal verileri gizler." },
                        { key: "layout_hidden_veresiye_analysis", label: "Veresiye: Analiz Sidebar", desc: "Sol taraftaki yaşlandırma ve AI analizlerini gizler." },
                        { key: "layout_hidden_veresiye_table", label: "Veresiye: Müşteri Listesi", desc: "Ana müşteri portföy tablosunu gizler." },
                    ].map((layout) => (
                        <div key={layout.key} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-[#222]">
                            <div className="space-y-1">
                                <Label className="text-sm font-semibold text-slate-900 dark:text-white">{layout.label}</Label>
                                <p className="text-[10px] text-muted-foreground/70 tracking-tight">{layout.desc}</p>
                            </div>
                            <div
                                onClick={() => onChange(layout.key, formData[layout.key] === "true" ? "false" : "true", true)}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 relative shrink-0",
                                    formData[layout.key] === "true" ? "bg-slate-300 dark:bg-slate-700" : "bg-blue-500"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm",
                                    formData[layout.key] === "true" ? "translate-x-0" : "translate-x-6"
                                )} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
