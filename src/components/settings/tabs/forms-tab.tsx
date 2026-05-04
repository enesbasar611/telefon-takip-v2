"use client";

import { useState, useTransition, useMemo } from "react";
import { Plus, Trash2, GripVertical, Check, Wand2, Eye, Layout, Type, Hash, List, AlignLeft, AlertCircle, Zap, Pencil, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateShop } from "@/lib/actions/setting-actions";
import { updateShopThemeConfig } from "@/lib/actions/superadmin-actions";
import { generateIndustryConfigWithAI } from "@/lib/actions/gemini-actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { getIndustryConfig } from "@/lib/industry-utils";

export function FormsTab({ shop, adminShopId }: { shop: any, adminShopId?: string }) {
    const [isPending, startTransition] = useTransition();
    const [themeConfig, setThemeConfig] = useState(shop.themeConfig || { productFields: [], serviceFields: [], accessories: [] });
    const [activeSection, setActiveSection] = useState<"productFields" | "serviceFields" | "accessories">("productFields");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const industryConfig = useMemo(() => getIndustryConfig(shop.industry), [shop.industry]);

    const handleSave = () => {
        startTransition(async () => {
            try {
                const result = adminShopId
                    ? await updateShopThemeConfig(adminShopId, themeConfig)
                    : await updateShop({ themeConfig });

                if (result.success) {
                    toast.success("Form ayarları kaydedildi.");
                    setEditingIndex(null);
                } else {
                    toast.error("Form ayarları kaydedilemedi.");
                }
            } catch (error) {
                toast.error("Bir hata oluştu.");
            }
        });
    };

    const addField = (preset?: any) => {
        if (activeSection === "accessories") return;
        const newField = preset || {
            key: `field_${Date.now()}`,
            label: "Yeni Alan",
            type: "text",
            required: false
        };
        setThemeConfig({
            ...themeConfig,
            [activeSection]: [...(themeConfig[activeSection] || []), newField]
        });
        setEditingIndex((themeConfig[activeSection] || []).length);
    };

    const updateField = (index: number, updates: any) => {
        if (activeSection === "accessories") return;
        const fields = [...(themeConfig[activeSection] || [])];
        fields[index] = { ...fields[index], ...updates };
        setThemeConfig({ ...themeConfig, [activeSection]: fields });
    };

    const removeField = (index: number) => {
        if (activeSection === "accessories") {
            const list = [...(themeConfig.accessories || [])];
            list.splice(index, 1);
            setThemeConfig({ ...themeConfig, accessories: list });
            return;
        }
        const fields = [...(themeConfig[activeSection] || [])];
        fields.splice(index, 1);
        setThemeConfig({ ...themeConfig, [activeSection]: fields });
        if (editingIndex === index) setEditingIndex(null);
    };

    const addAccessory = (value: string) => {
        if (!value.trim()) return;
        const list = themeConfig.accessories || [];
        if (list.includes(value.trim())) {
            toast.error("Bu öge zaten listede var.");
            return;
        }
        setThemeConfig({ ...themeConfig, accessories: [...list, value.trim()] });
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

    const fields = activeSection === "accessories" ? [] : (themeConfig[activeSection] || []);

    // Filter default fields that are NOT already in the current config
    const availableDefaults = useMemo(() => {
        if (activeSection === "accessories") return [];
        const defaultFields = activeSection === "productFields"
            ? industryConfig.inventoryFormFields
            : industryConfig.serviceFormFields;

        return defaultFields.filter(df => !fields.some((f: any) => f.key === df.key));
    }, [activeSection, industryConfig, fields]);

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
                        onClick={() => { setActiveSection("productFields"); setEditingIndex(null); }}
                        className={cn(
                            "flex-1 h-12 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeSection === "productFields"
                                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                                : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-white/[0.02]"
                        )}
                    >
                        <Layout className="w-3.5 h-3.5" /> Ürün Formu
                    </button>
                    <button
                        onClick={() => { setActiveSection("serviceFields"); setEditingIndex(null); }}
                        className={cn(
                            "flex-1 h-12 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeSection === "serviceFields"
                                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                                : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-white/[0.02]"
                        )}
                    >
                        <Zap className="w-3.5 h-3.5" /> Servis Formu
                    </button>
                    <button
                        onClick={() => { setActiveSection("accessories"); setEditingIndex(null); }}
                        className={cn(
                            "flex-1 h-12 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeSection === "accessories"
                                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                                : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-white/[0.02]"
                        )}
                    >
                        <List className="w-3.5 h-3.5" /> Aksesuarlar
                    </button>
                </div>

                {activeSection !== "accessories" ? (
                    <>
                        {/* Quick Add Defaults */}
                        {availableDefaults.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Önerilen Alanlar (Hızlı Ekle)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {availableDefaults.map((df) => (
                                        <Button
                                            key={df.key}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addField(df)}
                                            className="rounded-xl border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-500/50 text-xs font-medium bg-slate-50 dark:bg-white/5"
                                        >
                                            <Plus className="w-3 h-3 mr-2" /> {df.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {fields.map((field: any, index: number) => {
                                    const isEditing = editingIndex === index;
                                    return (
                                        <motion.div
                                            key={field.key || index}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={cn(
                                                "group relative bg-white dark:bg-[#0a0a0a] border rounded-[1.5rem] overflow-hidden transition-all shadow-sm hover:shadow-md",
                                                isEditing ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : "border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                            )}
                                        >
                                            <div className="p-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="p-2 text-slate-300 dark:text-white/10 cursor-grab active:cursor-grabbing">
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm">{field.label}</span>
                                                            {field.required && <Badge className="bg-rose-500/10 text-rose-500 text-[8px] border-none px-1 h-4 font-black">ZORUNLU</Badge>}
                                                            {field.coreMapping && <Badge variant="outline" className="text-[8px] opacity-70 px-1 font-black bg-blue-500/5 text-blue-500 border-blue-500/20 uppercase">Core</Badge>}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5 font-medium">
                                                            {field.type === 'text' && <><Type className="w-2.5 h-2.5" /> Metin Alanı</>}
                                                            {field.type === 'number' && <><Hash className="w-2.5 h-2.5" /> Sayısal Değer</>}
                                                            {field.type === 'select' && <><List className="w-2.5 h-2.5" /> Seçim Menüsü</>}
                                                            {field.type === 'textarea' && <><AlignLeft className="w-2.5 h-2.5" /> Geniş Metin Alanı</>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditingIndex(isEditing ? null : index)}
                                                        className={cn(
                                                            "h-10 w-10 rounded-xl transition-all",
                                                            isEditing ? "bg-indigo-500 text-white hover:bg-indigo-600" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-500"
                                                        )}
                                                    >
                                                        {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeField(index)}
                                                        className="h-10 w-10 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] p-6 space-y-6"
                                                >
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Görünen İsim</Label>
                                                            <Input
                                                                value={field.label}
                                                                onChange={(e) => updateField(index, { label: e.target.value })}
                                                                placeholder="Örn: Arıza Nedeni"
                                                                className="h-11 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500/50 transition-all"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Alan Tipi</Label>
                                                            <Select value={field.type} onValueChange={(val) => updateField(index, { type: val })}>
                                                                <SelectTrigger className="h-11 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 rounded-xl">
                                                                    <SelectItem value="text">Kısa Metin</SelectItem>
                                                                    <SelectItem value="number">Sayı</SelectItem>
                                                                    <SelectItem value="textarea">Uzun Metin (Açıklama)</SelectItem>
                                                                    <SelectItem value="select">Seçenek Listesi</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6 items-end">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Sistem Anahtarı (Benzersiz)</Label>
                                                            <Input
                                                                value={field.key}
                                                                onChange={(e) => updateField(index, { key: e.target.value })}
                                                                placeholder="field_key"
                                                                className={cn(
                                                                    "h-11 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl font-mono text-[10px]",
                                                                    field.coreMapping && "opacity-50 cursor-not-allowed bg-slate-100"
                                                                )}
                                                                disabled={!!field.coreMapping}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl h-11 px-4 cursor-pointer" onClick={() => updateField(index, { required: !field.required })}>
                                                            <Switch
                                                                checked={field.required}
                                                                onCheckedChange={(val) => updateField(index, { required: val })}
                                                                className="data-[state=checked]:bg-rose-500 scale-75"
                                                            />
                                                            <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">BU ALAN ZORUNLU OLSUN</span>
                                                        </div>
                                                    </div>

                                                    {field.type === "select" && (
                                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Seçenekler (Virgül ile Ayırın)</Label>
                                                            <Input
                                                                value={field.options?.join(", ") || ""}
                                                                onChange={(e) => updateField(index, { options: e.target.value.split(",").map((s) => s.trim()) })}
                                                                placeholder="Seçenek 1, Seçenek 2, Seçenek 3"
                                                                className="h-11 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium"
                                                            />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        <Button variant="outline" onClick={() => addField()} className="w-full h-16 border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/5 rounded-3xl text-muted-foreground font-bold group transition-all">
                            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform text-indigo-500" /> Yeni Özel Alan Tanımla
                        </Button>
                    </>
                ) : (
                    /* Accessories Editor */
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-sm">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Yeni Aksesuar / Emanet Parça Ekle</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="new-accessory"
                                    placeholder="Örn: Şarj Aleti, Kılıf..."
                                    className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-2xl"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            addAccessory((e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }}
                                />
                                <Button
                                    onClick={() => {
                                        const input = document.getElementById("new-accessory") as HTMLInputElement;
                                        addAccessory(input.value);
                                        input.value = "";
                                    }}
                                    className="h-12 w-12 bg-indigo-500 hover:bg-indigo-600 rounded-2xl flex-shrink-0"
                                >
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <AnimatePresence>
                                {(themeConfig.accessories || []).map((item: string, idx: number) => (
                                    <motion.div
                                        key={item}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="group bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-5 pr-3 flex items-center gap-3 hover:border-indigo-500/30 transition-all shadow-sm"
                                    >
                                        <span className="text-sm font-bold tracking-tight">{item}</span>
                                        <button
                                            onClick={() => removeField(idx)}
                                            className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all flex items-center justify-center"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Side */}
            <div className="xl:col-span-4">
                <div className="sticky top-6 space-y-6">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl flex items-center justify-between overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-3xl" />
                        <div className="flex items-center gap-3 relative">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h4 className="font-black italic text-xs tracking-tight text-indigo-900 dark:text-white/90">SİMÜLASYON ÖNİZLEME</h4>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-none font-black text-[9px] relative ring-1 ring-indigo-500/20">
                            {activeSection === "productFields" ? "STOK FORMU" : activeSection === "serviceFields" ? "SERVİS FORMU" : "AKSESUAR SEÇİMİ"}
                        </Badge>
                    </div>

                    <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 space-y-8 relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/[0.04] to-transparent pointer-events-none" />

                        <div className="relative space-y-6">
                            {activeSection === "accessories" ? (
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Cihazla Alınan Aksesuarlar</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {(themeConfig.accessories || []).map((item: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5">
                                                <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black/20" />
                                                <span className="text-xs font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : fields.length === 0 ? (
                                <div className="py-20 text-center space-y-4 opacity-30">
                                    <Layout className="w-12 h-12 mx-auto text-slate-300 dark:text-white/20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Henüz Alan Eklenmedi</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {fields.map((field: any, idx: number) => (
                                        <div key={idx} className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[11px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest leading-none">{field.label}</Label>
                                                {field.required && <span className="text-rose-500 text-xs font-black">*</span>}
                                            </div>

                                            {field.type === "textarea" ? (
                                                <div className="h-28 w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-[10px] text-gray-500 font-medium italic">
                                                    {field.label} içeriği buraya yazılacak...
                                                </div>
                                            ) : field.type === "select" ? (
                                                <div className="h-12 w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl px-4 flex items-center justify-between border-b-2 border-b-slate-200 dark:border-b-white/5">
                                                    <span className="text-[11px] text-gray-500 font-medium italic">Seçim yapın...</span>
                                                    <List className="h-4 w-4 text-slate-300 dark:text-white/10" />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl px-4 flex items-center border-b-2 border-b-slate-200 dark:border-b-white/5">
                                                    <span className="text-[11px] text-gray-500 font-medium italic">
                                                        {field.type === "number" ? "Sayısal değer girin..." : `${field.label} girin...`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(fields.length > 0 || activeSection === "accessories") && (
                                <Button className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest rounded-3xl mt-8 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Kayıdı Onayla
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl flex gap-4">
                        <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-500">
                            <Eye className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-bold italic">
                            Bu alan dükkanınızın sektörel form tasarımını simüle eder. Eklediğiniz her alan, ürün veya servis kaydı sırasında canlı formlara yansıtılacaktır.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
