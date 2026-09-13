"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Power, Bold, Italic, List, Link as LinkIcon, Info, AlertTriangle, CheckCircle2, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";
import { createSystemAnnouncement, toggleSystemAnnouncement, deleteSystemAnnouncement } from "@/lib/actions/system-announcement-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

export function SystemAnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: any[] }) {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "INFO"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error("Lütfen başlık ve içerik alanlarını doldurun.");
            return;
        }

        setIsSubmitting(true);
        const res = await createSystemAnnouncement(formData);
        
        if (res.success) {
            toast.success("Duyuru başarıyla oluşturuldu ve yayınlandı.");
            setFormData({ title: "", content: "", type: "INFO" });
            window.location.reload();
        } else {
            toast.error(res.error || "Bir hata oluştu.");
        }
        setIsSubmitting(false);
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const res = await toggleSystemAnnouncement(id, !currentStatus);
        if (res.success) {
            toast.success(`Duyuru ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi.`);
            setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
        } else {
            toast.error(res.error || "Durum güncellenemedi.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
        
        const res = await deleteSystemAnnouncement(id);
        if (res.success) {
            toast.success("Duyuru başarıyla silindi.");
            setAnnouncements(announcements.filter(a => a.id !== id));
        } else {
            toast.error(res.error || "Silme işlemi başarısız.");
        }
    };

    const insertText = (before: string, after: string = "") => {
        const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.content.substring(start, end);
        const newText = formData.content.substring(0, start) + before + selectedText + after + formData.content.substring(end);
        setFormData({ ...formData, content: newText });
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
        }, 10);
    };

    // Önizleme için ikon ve renkler (Modal ile aynı tutarlı tasarım)
    const getIcon = () => {
        switch (formData.type) {
            case 'WARNING': return <AlertTriangle className="w-10 h-10 text-amber-500" />;
            case 'SUCCESS': return <CheckCircle2 className="w-10 h-10 text-emerald-500" />;
            case 'FEATURE': return <Sparkles className="w-10 h-10 text-purple-500" />;
            default: return <Info className="w-10 h-10 text-blue-500" />;
        }
    };
    const getColorStyles = () => {
        switch (formData.type) {
            case 'WARNING': return 'border-amber-500/30 bg-background/90 shadow-amber-500/10 shadow-2xl';
            case 'SUCCESS': return 'border-emerald-500/30 bg-background/90 shadow-emerald-500/10 shadow-2xl';
            case 'FEATURE': return 'border-purple-500/30 bg-background/90 shadow-purple-500/10 shadow-2xl';
            default: return 'border-blue-500/30 bg-background/90 shadow-blue-500/10 shadow-2xl';
        }
    };
    const getGradientClass = () => {
        switch (formData.type) {
            case 'WARNING': return 'bg-gradient-to-r from-amber-500/10 to-transparent';
            case 'SUCCESS': return 'bg-gradient-to-r from-emerald-500/10 to-transparent';
            case 'FEATURE': return 'bg-gradient-to-r from-purple-500/10 to-transparent';
            default: return 'bg-gradient-to-r from-blue-500/10 to-transparent';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Sistem Duyuruları</h1>
                <p className="text-muted-foreground">Tüm kullanıcılara anlık olarak gösterilecek modal duyurularını yönetin.</p>
            </div>

            <Tabs defaultValue="new" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="new"><Plus className="w-4 h-4 mr-2" /> Yeni Duyuru Oluştur</TabsTrigger>
                    <TabsTrigger value="history"><Eye className="w-4 h-4 mr-2" /> Mevcut Duyurular</TabsTrigger>
                </TabsList>
                
                <TabsContent value="new">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Form Alanı */}
                        <Card className="h-fit shadow-md">
                            <CardHeader>
                                <CardTitle>Duyuru İçeriği</CardTitle>
                                <CardDescription>Markdown destekli editör ile duyurunuzu hazırlayın.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Başlık</label>
                                        <Input 
                                            placeholder="Örn: Sistem Bakımı, Yeni Sürüm..." 
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Duyuru Tipi</label>
                                        <Select 
                                            value={formData.type} 
                                            onValueChange={(val) => setFormData({...formData, type: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tip seçin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INFO">Bilgilendirme (Mavi)</SelectItem>
                                                <SelectItem value="WARNING">Uyarı (Turuncu)</SelectItem>
                                                <SelectItem value="SUCCESS">Başarı/Yenilik (Yeşil)</SelectItem>
                                                <SelectItem value="FEATURE">Yeni Özellik (Mor)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">İçerik (Markdown)</label>
                                        <div className="border rounded-md overflow-hidden bg-background">
                                            <div className="flex items-center gap-1 bg-muted/50 p-1 border-b">
                                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("**", "**")} title="Kalın">
                                                    <Bold className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("_", "_")} title="İtalik">
                                                    <Italic className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("- ")} title="Liste">
                                                    <List className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("[", "](https://)")} title="Bağlantı">
                                                    <LinkIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Textarea 
                                                id="content-textarea"
                                                placeholder="Duyuru metni... Markdown formatında yazabilirsiniz." 
                                                className="min-h-[250px] border-0 focus-visible:ring-0 resize-y bg-transparent rounded-none"
                                                value={formData.content}
                                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {isSubmitting ? "Yayınlanıyor..." : "Hemen Yayınla"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Canlı Önizleme */}
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Canlı Önizleme</h3>
                            <div className={`border-2 backdrop-blur-xl ${getColorStyles()} p-0 overflow-hidden rounded-xl h-fit sticky top-6 transition-all duration-500`}>
                                <div className={`p-6 ${getGradientClass()}`}>
                                    <div className="flex flex-row items-start gap-4 space-y-0">
                                        <div className="shrink-0 p-3 bg-background/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/5">
                                            {getIcon()}
                                        </div>
                                        <div className="flex-1 space-y-2 pt-1">
                                            <div className="text-2xl md:text-3xl font-black tracking-tight line-clamp-2">
                                                {formData.title || "Duyuru Başlığı Burada Görünecek"}
                                            </div>
                                            <div className="font-medium flex items-center justify-between text-base">
                                                <span className="flex items-center gap-2">
                                                    {formData.type === "FEATURE" ? "Yeni Özellik" : "Sistem Duyurusu"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 mt-4">
                                    <div className="bg-background/40 p-4 md:p-6 rounded-xl border border-white/5 shadow-inner">
                                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                                                prose-headings:font-bold prose-headings:tracking-tight
                                                prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                                prose-li:marker:text-primary/50 prose-ul:space-y-1 prose-ol:space-y-1
                                                prose-hr:border-border/50 prose-strong:text-primary break-words">
                                            <ReactMarkdown>
                                                {formData.content || "*Duyuru metni buraya gelecek...*"}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Geçmiş ve Aktif Duyurular</CardTitle>
                            <CardDescription>Sistemde kayıtlı olan tüm duyuruları buradan yönetebilirsiniz.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {announcements.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                    Henüz bir sistem duyurusu bulunmuyor.
                                </div>
                            ) : (
                                announcements.map((announcement) => (
                                    <div 
                                        key={announcement.id} 
                                        className={`flex items-start justify-between p-4 rounded-xl border ${announcement.isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'bg-muted/50'}`}
                                    >
                                        <div className="space-y-1 flex-1 pr-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                                                    announcement.type === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                                                    announcement.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    announcement.type === 'FEATURE' ? 'bg-purple-500/10 text-purple-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                    {announcement.type}
                                                </span>
                                                <h3 className={`font-semibold ${announcement.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {announcement.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{announcement.content}</p>
                                            <p className="text-xs text-muted-foreground/60 pt-2 font-mono">
                                                {format(new Date(announcement.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0 border-l pl-4">
                                            <Button 
                                                variant={announcement.isActive ? "default" : "outline"} 
                                                size="sm"
                                                className={`w-full justify-start ${announcement.isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                                                onClick={() => handleToggle(announcement.id, announcement.isActive)}
                                            >
                                                <Power className="w-4 h-4 mr-2" />
                                                {announcement.isActive ? "Yayında" : "Yayınla"}
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() => handleDelete(announcement.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Sil
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
