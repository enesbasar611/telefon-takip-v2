"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Palette, Pencil, Trash2, MessageSquare, CheckCircle2,
    Loader2, ChevronDown, ChevronUp, Sparkles, Globe, Settings2,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    getIndustryTemplates,
    updateIndustryTemplate,
    deleteIndustryTemplate,
    seedIndustryTemplates
} from "@/lib/actions/industry-template-actions";

type Template = {
    id: string;
    slug: string;
    displayName: string;
    primaryColor: string;
    whatsappTemplates: any;
    sidebarConfig: any;
    serviceFields: any;
    dashboardStats: any;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export function IndustryTemplatesAdmin({ initialTemplates }: { initialTemplates: Template[] }) {
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const startEdit = (t: Template) => {
        setEditingId(t.id);
        setEditData({
            displayName: t.displayName,
            primaryColor: t.primaryColor,
            whatsappTemplates: t.whatsappTemplates ? { ...t.whatsappTemplates } : {},
            sidebarConfig: t.sidebarConfig ? { ...t.sidebarConfig } : { features: [], labels: {} },
            serviceFields: Array.isArray(t.serviceFields) ? [...t.serviceFields] : []
        });
        setExpandedId(t.id);
    };

    const cancelEdit = () => { setEditingId(null); setEditData({}); };

    const saveEdit = async (id: string) => {
        setSaving(true);
        const res = await updateIndustryTemplate(id, editData);
        setSaving(false);
        if (res.success) {
            setTemplates(templates.map(t => t.id === id ? { ...t, ...editData } as Template : t));
            toast.success("Şablon kaydedildi!");
            cancelEdit();
        } else {
            toast.error(res.error || "Kayıt başarısız.");
        }
    };

    const handleSeed = async () => {
        if (!confirm("Varsayılan şablonları içe aktarmak istiyor musunuz? Mevcut şablonlar korunur, eksikler eklenir.")) return;
        setSaving(true);
        const res = await seedIndustryTemplates();
        setSaving(false);
        if (res.success) {
            toast.success(`${res.count} şablon içe aktarıldı!`);
            window.location.reload();
        } else {
            toast.error(res.error || "İçe aktarma başarısız.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
        setDeleting(id);
        const res = await deleteIndustryTemplate(id);
        setDeleting(null);
        if (res.success) {
            setTemplates(templates.filter(t => t.id !== id));
            toast.success("Şablon silindi.");
        } else {
            toast.error(res.error || "Silme başarısız.");
        }
    };

    if (templates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
                <div className="p-6 rounded-full bg-white/5 border border-white/10">
                    <Globe className="h-16 w-16 opacity-40" />
                </div>
                <div className="space-y-1">
                    <p className="text-xl font-semibold">Henüz sektör şablonu bulunmuyor.</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Sistem varsayılanlarını içe aktararak hemen başlayabilirsiniz.</p>
                </div>
                <Button onClick={handleSeed} disabled={saving} className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-gray-200">
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Varsayılanları İçe Aktar"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={handleSeed} variant="outline" disabled={saving} className="h-10 rounded-xl bg-white/5 border-white/10">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Varsayılanları Güncelle
                </Button>
            </div>

            <div className="space-y-4">
                {templates.map((t) => (
                    <div key={t.id} className="glass-card rounded-2xl overflow-hidden">
                        {/* Header Row */}
                        <div className="flex items-center gap-4 p-5">
                            <div className="h-10 w-10 rounded-xl flex-shrink-0" style={{ background: t.primaryColor }} />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{t.displayName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                            </div>
                            <Badge variant="outline" className="hidden sm:flex text-xs">{t.primaryColor.toUpperCase()}</Badge>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => startEdit(t)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon" variant="ghost"
                                    className="h-9 w-9 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDelete(t.id)}
                                    disabled={!!deleting}
                                >
                                    {deleting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                                    {expandedId === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Expanded Detail / Edit */}
                        <AnimatePresence>
                            {expandedId === t.id && (
                                <motion.div
                                    key="detail"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-white/10"
                                >
                                    <div className="p-5 space-y-6">
                                        {editingId === t.id ? (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Görünen Ad</Label>
                                                        <Input
                                                            value={editData.displayName || ""}
                                                            onChange={e => setEditData((d: any) => ({ ...d, displayName: e.target.value }))}
                                                            className="h-10 rounded-xl bg-black/20 border-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Marka Rengi</Label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="color"
                                                                value={editData.primaryColor || "#6366f1"}
                                                                onChange={e => setEditData((d: any) => ({ ...d, primaryColor: e.target.value }))}
                                                                className="h-10 w-14 rounded-xl cursor-pointer border-0 bg-transparent"
                                                            />
                                                            <Input
                                                                value={editData.primaryColor || ""}
                                                                onChange={e => setEditData((d: any) => ({ ...d, primaryColor: e.target.value }))}
                                                                className="h-10 bg-black/20 border-white/10 font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                        <Settings2 className="h-4 w-4" /> Etiketler (İsimlendirme)
                                                    </Label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {Object.entries((editData.sidebarConfig?.labels || {}) as Record<string, string>).map(([key, val]) => (
                                                            <div key={key} className="space-y-1">
                                                                <Label className="text-[10px] font-mono text-muted-foreground">{key}</Label>
                                                                <Input
                                                                    value={val}
                                                                    onChange={e => {
                                                                        const newLabels = { ...editData.sidebarConfig.labels, [key]: e.target.value };
                                                                        setEditData((d: any) => ({ ...d, sidebarConfig: { ...d.sidebarConfig, labels: newLabels } }));
                                                                    }}
                                                                    className="h-9 rounded-xl bg-black/20 border-white/5 text-sm"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                        <Layout className="h-4 w-4" /> Özellik Seti (Modüller)
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {["SERVICE", "STOCK", "SALE", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION", "LOYALTY", "APPOINTMENT"].map(module => (
                                                            <Badge
                                                                key={module}
                                                                variant={editData.sidebarConfig?.features?.includes(module) ? "default" : "outline"}
                                                                className="cursor-pointer px-3 py-1 rounded-lg"
                                                                onClick={() => {
                                                                    const currentFeatures = editData.sidebarConfig?.features || [];
                                                                    const newFeatures = currentFeatures.includes(module)
                                                                        ? currentFeatures.filter((m: string) => m !== module)
                                                                        : [...currentFeatures, module];
                                                                    setEditData((d: any) => ({ ...d, sidebarConfig: { ...d.sidebarConfig, features: newFeatures } }));
                                                                }}
                                                            >
                                                                {module}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4" /> WhatsApp Şablonları
                                                    </Label>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {Object.entries((editData.whatsappTemplates || {}) as Record<string, string>).map(([key, val]) => (
                                                            <div key={key} className="space-y-1">
                                                                <Label className="text-[10px] font-mono text-muted-foreground">{key}</Label>
                                                                <Input
                                                                    value={val}
                                                                    onChange={e => setEditData((d: any) => ({
                                                                        ...d,
                                                                        whatsappTemplates: { ...d.whatsappTemplates, [key]: e.target.value }
                                                                    }))}
                                                                    className="h-10 rounded-xl bg-black/20 border-white/5 text-sm"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-6 border-t border-white/5">
                                                    <Button variant="ghost" onClick={cancelEdit} className="h-11 px-8 rounded-xl">İptal</Button>
                                                    <Button onClick={() => saveEdit(t.id)} disabled={saving} className="h-11 px-10 rounded-xl bg-white text-black hover:bg-gray-200">
                                                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5 mr-3" />Kaydet</>}
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Modüller</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {t.sidebarConfig?.features?.map((f: string) => (
                                                                <Badge key={f} variant="secondary" className="bg-white/5 text-[10px]">{f}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">WhatsApp</p>
                                                        <div className="space-y-1.5">
                                                            {Object.keys(t.whatsappTemplates || {}).map(k => (
                                                                <Badge key={k} variant="outline" className="text-[9px] opacity-70 border-white/10">{k}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Etiket Özeti</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {Object.entries((t.sidebarConfig?.labels || {})).slice(0, 4).map(([k, v]) => (
                                                            <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/5">
                                                                <p className="text-[9px] text-muted-foreground truncate">{k}</p>
                                                                <p className="text-xs font-semibold truncate">{String(v)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
