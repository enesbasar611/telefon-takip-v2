"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Edit,
    Info,
    Zap,
    Loader2,
    Calendar,
    MessageCircle,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariableTextarea } from "@/components/ui/variable-textarea";
import { toast } from "sonner";
import {
    getWhatsAppTemplates,
    createWhatsAppTemplate,
    updateWhatsAppTemplate,
    deleteWhatsAppTemplate
} from "@/lib/actions/whatsapp-template-actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { WhatsAppTemplatesSection } from "./whatsapp-templates-section";

interface WhatsAppTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
    variables: string[];
    isActive: boolean;
    updatedAt: Date;
}

interface WhatsAppTabProps {
    shop: any;
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
    savingKeys: Set<string>;
}

export function WhatsAppTab({ shop, formData, onChange, savingKeys }: WhatsAppTabProps) {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [isPending, setIsPending] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formDataRow, setFormDataRow] = useState({ name: "", content: "" });

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        setIsPending(true);
        try {
            const data = await getWhatsAppTemplates();
            setTemplates(data as any || []);
        } catch (error) {
            toast.error("Şablonlar yüklenirken hata oluştu");
        } finally {
            setIsPending(false);
        }
    }

    async function handleCreate() {
        if (!formDataRow.name || !formDataRow.content) {
            toast.error("Lütfen tüm alanları doldurun");
            return;
        }

        setIsPending(true);
        try {
            await createWhatsAppTemplate({
                ...formDataRow,
                category: "GENERAL",
                variables: []
            });
            toast.success("Şablon başarıyla oluşturuldu");
            setFormDataRow({ name: "", content: "" });
            setIsAdding(false);
            loadTemplates();
        } catch (error) {
            toast.error("Şablon oluşturulurken hata oluştu");
        } finally {
            setIsPending(false);
        }
    }

    async function handleUpdate(id: string) {
        setIsPending(true);
        try {
            await updateWhatsAppTemplate(id, formDataRow);
            toast.success("Şablon güncellendi");
            setIsEditing(null);
            setFormDataRow({ name: "", content: "" });
            setIsAdding(false);
            loadTemplates();
        } catch (error) {
            toast.error("Şablon güncellenirken hata oluştu");
        } finally {
            setIsPending(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
        setIsPending(true);
        try {
            await deleteWhatsAppTemplate(id);
            toast.success("Şablon silindi");
            loadTemplates();
        } catch (error) {
            toast.error("Şablon silinirken hata oluştu");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            {/* System Templates Section */}
            <div className="space-y-4">
                <div className="bg-sky-500/5 dark:bg-sky-500/10 p-4 rounded-2xl border border-sky-500/10 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-sky-900 dark:text-sky-300">Sistem Otomasyon Şablonları</h4>
                        <p className="text-[11px] text-sky-700/70 dark:text-sky-400/70 mt-0.5 leading-relaxed">
                            Aşağıdaki şablonlar belirli sistem olayları (yeni kayıt, teslimat vb.) gerçekleştiğinde otomatik olarak kullanılır.
                        </p>
                    </div>
                </div>
                <WhatsAppTemplatesSection formData={formData} onChange={onChange} />
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#222]" />

            {/* General Templates Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <MessageCircle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Genel Mesaj Şablonları</h3>
                            <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Kendi mesaj şablonlarınızı oluşturun ve yönetin.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setIsAdding(true); setFormDataRow({ name: "", content: "" }); }}
                        variant="secondary"
                        size="sm"
                        className="rounded-xl px-4 h-9 gap-2 font-bold"
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Ekle
                    </Button>
                </div>

                {isAdding && (
                    <Card className="border-2 border-primary/20 bg-primary/5 dark:bg-primary/5 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-xl">
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-primary/70">Şablon Adı</Label>
                                <Input
                                    placeholder="Örn: Kampanya Bilgilendirme"
                                    value={formDataRow.name}
                                    onChange={e => setFormDataRow({ ...formDataRow, name: e.target.value })}
                                    className="h-10 rounded-xl bg-background border-border/50 focus:border-primary/30 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-primary/70">Mesaj İçeriği</Label>
                                <div className="relative">
                                    <VariableTextarea
                                        placeholder="Mesajınızı yazın..."
                                        value={formDataRow.content}
                                        onChange={e => setFormDataRow({ ...formDataRow, content: e.target.value })}
                                        onValueChange={val => setFormDataRow({ ...formDataRow, content: val })}
                                        variables={["{{name}}", "{{customerName}}", "{{deviceName}}", "{{price}}", "{{shopName}}"]}
                                        className="min-h-[150px] rounded-2xl bg-background border-border/50 focus:border-primary/30 transition-all py-4 px-4 text-sm"
                                    />
                                    <div className="absolute bottom-3 right-3 flex gap-1.5 pointer-events-none">
                                        <Badge variant="outline" className="bg-background/80 text-[9px] border-border/40 backdrop-blur-sm">Değişkenler: {'{{ name }}'}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 mt-1">
                                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                                        Değişken kullanmak için çift süslü parantez içine yazın. Örnek: <span className="font-mono bg-blue-500/10 px-1 rounded">Sayın {'{{ customerName }}'}, cihazınız hazır.</span> veya "/" işareti yaparak değişkenleri görebilirsiniz.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={() => { setIsAdding(false); setIsEditing(null); }} className="rounded-xl px-6 h-10 text-xs font-medium">İptal</Button>
                                <Button
                                    onClick={() => isEditing ? handleUpdate(isEditing) : handleCreate()}
                                    disabled={isPending}
                                    className="rounded-xl px-8 h-10 text-xs font-bold shadow-lg shadow-primary/20"
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditing ? "Güncelle" : "Kaydet"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => (
                        <Card key={template.id} className="group border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{template.name}</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(template.updatedAt).toLocaleDateString("tr-TR")} güncellendi
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setIsEditing(template.id);
                                                setIsAdding(true);
                                                setFormDataRow({ name: template.name, content: template.content });
                                            }}
                                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(template.id)}
                                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-black/40 border border-slate-100 dark:border-[#1a1a1a] min-h-[100px] text-xs leading-relaxed text-slate-700 dark:text-slate-300 italic group-hover:border-primary/20 transition-colors shadow-inner">
                                        "{template.content}"
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {templates.length === 0 && !isAdding && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#222] rounded-3xl bg-slate-50/50 dark:bg-white/5 opacity-60">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Henüz hiç genel şablon oluşturmamışsınız</p>
                            <p className="text-[11px] text-slate-400 mt-1">"Yeni Ekle" butonuna basarak başlayabilirsiniz.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
