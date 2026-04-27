"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, Check, Wand2, Eye, Layout, Type, Hash, List, AlignLeft, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateShop } from "@/lib/actions/setting-actions";
import { generateIndustryConfigWithAI } from "@/lib/actions/gemini-actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export function FormsTab({ shop }: { shop: any }) {
    const [isPending, startTransition] = useTransition();
    const [themeConfig, setThemeConfig] = useState(shop.themeConfig || { productFields: [], serviceFields: [], accessories: [] });
    const [activeSection, setActiveSection] = useState<"productFields" | "serviceFields">("productFields");

    const handleSave = () => {
        startTransition(async () => {
            try {
                const result = await updateShop({ themeConfig });
                if (result.success) {
                    toast.success("Form ayarları kaydedildi.");
                } else {
                    toast.error("Form ayarları kaydedilemedi.");
                }
            } catch (error) {
                toast.error("Bir hata oluştu.");
            }
        });
    };

    const addField = () => {
        const newField = {
            key: `field_${Date.now()}`,
            label: "Yeni Alan",
            type: "text",
            required: false
        };
        setThemeConfig({
            ...themeConfig,
            [activeSection]: [...(themeConfig[activeSection] || []), newField]
        });
    };

    const updateField = (index: number, updates: any) => {
        const fields = [...(themeConfig[activeSection] || [])];
        fields[index] = { ...fields[index], ...updates };
        setThemeConfig({ ...themeConfig, [activeSection]: fields });
    };

    const removeField = (index: number) => {
        const fields = [...(themeConfig[activeSection] || [])];
        fields.splice(index, 1);
        setThemeConfig({ ...themeConfig, [activeSection]: fields });
    };

    const handleAIGenerate = async () => {
        if (!shop.industry) {
            toast.error("Önce dükkan sektörünü belirlemelisiniz.");
            return;
        }
        startTransition(async () => {
            const toastId = toast.loading("AI ile formlar yenileniyor...");
            try {
                const result = await generateIndustryConfigWithAI(shop.industry);
                if (result.success) {
                    setThemeConfig(result.data);
                    toast.success("AI formları oluşturdu! Değişiklikleri kaydetmeyi unutmayın.", { id: toastId });
                } else {
                    toast.error(result.error || "AI başarısız oldu.", { id: toastId });
                }
            } catch {
                toast.error("Beklenmeyen bir hata oluştu.", { id: toastId });
            }
        });
    };

    const fields = themeConfig[activeSection] || [];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Editor Side */}
            <div className="xl:col-span-8 space-y-8">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                            <Layout className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Form Tasarımları</h3>
                            <p className="text-xs text-muted-foreground/80">Sektörel form alanlarını özelleştirin ve genişletin.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={handleAIGenerate} disabled={isPending} className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 rounded-xl h-10 font-bold">
                            <Wand2 className="w-4 h-4 mr-2" /> AI Sihirbazı
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={isPending} className="bg-indigo-500 hover:bg-indigo-600 rounded-xl h-10 px-6 font-bold">
                            <Check className="w-4 h-4 mr-2" /> Kaydet
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                    <button
                        onClick={() => setActiveSection("productFields")}
                        className={cn(
                            "flex-1 h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeSection === "productFields"
                                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                                : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-white/[0.02]"
                        )}
                    >
                        <Layout className="w-4 h-4" /> Ürün Formu
                    </button>
                    <button
                        onClick={() => setActiveSection("serviceFields")}
                        className={cn(
                            "flex-1 h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeSection === "serviceFields"
                                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                                : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-white/[0.02]"
                        )}
                    >
                        <Zap className="w-4 h-4" /> Servis Formu
                    </button>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {fields.map((field: any, index: number) => (
                            <motion.div
                                key={field.key || index}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden transition-all hover:border-blue-500/30 dark:hover:border-white/20 shadow-sm hover:shadow-md"
                            >
                                <div className="p-6 space-y-6">
                                    {/* Field Header */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-3 bg-white/5 rounded-xl cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Etiket</Label>
                                                <Input
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                                    placeholder="Örn: Cihaz Modeli"
                                                    className="h-12 bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center gap-2 pt-2">
                                                <Switch
                                                    checked={field.required}
                                                    onCheckedChange={(val) => updateField(index, { required: val })}
                                                    className="data-[state=checked]:bg-emerald-500"
                                                />
                                                <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">ZORUNLU</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-400">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Field Config Body */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Sistem Anahtarı</Label>
                                            <Input
                                                value={field.key}
                                                onChange={(e) => updateField(index, { key: e.target.value })}
                                                placeholder="model_key"
                                                className="h-12 bg-white/[0.02] border-white/5 rounded-xl font-mono text-xs focus:border-indigo-500/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Veri Tipi</Label>
                                            <Select value={field.type} onValueChange={(val) => updateField(index, { type: val })}>
                                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 rounded-xl focus:ring-0 focus:border-indigo-500/50 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl">
                                                    <SelectItem value="text">Metin</SelectItem>
                                                    <SelectItem value="number">Sayı</SelectItem>
                                                    <SelectItem value="textarea">Uzun Metin</SelectItem>
                                                    <SelectItem value="select">Seçim Listesi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {field.type === "select" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Seçenekler (Virgülle Ayırın)</Label>
                                            <Input
                                                value={field.options?.join(", ") || ""}
                                                onChange={(e) => updateField(index, { options: e.target.value.split(",").map((s) => s.trim()) })}
                                                placeholder="Seçenek 1, Seçenek 2, Seçenek 3"
                                                className="h-12 bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 rounded-xl text-xs focus:border-indigo-500/50"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <Button variant="outline" onClick={addField} className="w-full h-16 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5 rounded-[2rem] text-muted-foreground font-bold group transition-all">
                    <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" /> Yeni Alan Tanımla
                </Button>
            </div>

            {/* Preview Side */}
            <div className="xl:col-span-4">
                <div className="sticky top-6 space-y-6">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-indigo-400" />
                            <h4 className="font-black italic text-sm tracking-tight text-white/90">CANLI ÖNİZLEME</h4>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 border-none font-bold">
                            {activeSection === "productFields" ? "Ürün Kaydı" : "Servis Formu"}
                        </Badge>
                    </div>

                    <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 space-y-8 relative overflow-hidden group shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />

                        <div className="relative space-y-6">
                            {fields.length === 0 ? (
                                <div className="py-20 text-center space-y-4 opacity-30">
                                    <Layout className="w-12 h-12 mx-auto text-white/20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Henüz Alan Eklenmedi</p>
                                </div>
                            ) : (
                                fields.map((field: any, idx: number) => (
                                    <div key={idx} className="space-y-2 animate-in fade-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="flex items-center gap-2">
                                            {field.type === "text" && <Type className="w-3 h-3 text-indigo-400/50" />}
                                            {field.type === "number" && <Hash className="w-3 h-3 text-indigo-400/50" />}
                                            {field.type === "select" && <List className="w-3 h-3 text-indigo-400/50" />}
                                            {field.type === "textarea" && <AlignLeft className="w-3 h-3 text-indigo-400/50" />}
                                            <Label className="text-xs font-bold text-gray-300 italic">{field.label}</Label>
                                            {field.required && <span className="text-rose-500 text-xs">*</span>}
                                        </div>

                                        {field.type === "textarea" ? (
                                            <div className="h-24 w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-[10px] text-gray-500 font-medium italic">
                                                {field.label} içeriği buraya yazılacak...
                                            </div>
                                        ) : field.type === "select" ? (
                                            <div className="h-12 w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl px-4 flex items-center justify-between">
                                                <span className="text-[10px] text-gray-500 font-medium italic">Seçim yapın...</span>
                                                <List className="h-3 w-3 text-slate-300 dark:text-white/10" />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl px-4 flex items-center">
                                                <span className="text-[10px] text-gray-500 font-medium italic">
                                                    {field.type === "number" ? "0" : `${field.label} girin...`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                            {fields.length > 0 && (
                                <Button className="w-full h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-2xl mt-8 cursor-default">
                                    Kaydı Tamamla
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium italic">
                            Önizleme, alanların formda nasıl görüneceğini simüle eder. Kayıt işleminden önce tasarımı buradan kontrol edebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
