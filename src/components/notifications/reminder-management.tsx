"use client";

import { useState, useEffect } from "react";
import {
    ChevronLeft,
    BellPlus,
    Calendar,
    Tag,
    Repeat,
    User,
    Save,
    X,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Search,
    Trash2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    createReminderAction,
    getReminders,
    updateReminderStatusAction,
    deleteReminderAction
} from "@/lib/actions/reminder-actions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ReminderManagementProps {
    onBack: () => void;
}

export function ReminderManagement({ onBack }: ReminderManagementProps) {
    const [reminders, setReminders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [category, setCategory] = useState("Stok Uyarısı");
    const [recurrence, setRecurrence] = useState("Yok");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        setIsLoading(true);
        const data = await getReminders();
        setReminders(data);
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!title || !date) {
            toast.error("Lütfen başlık ve tarih giriniz");
            return;
        }

        setIsSaving(true);
        try {
            const dateTime = new Date(`${date}T${time || "09:00"}`);
            const result = await createReminderAction({
                title,
                description,
                date: dateTime,
                category,
                recurrence,
                creatorId: "current-user", // In a real app, this comes from auth
            });

            if (result.success) {
                toast.success("Hatırlatıcı oluşturuldu");
                setTitle("");
                setDescription("");
                setDate("");
                setTime("");
                fetchReminders();
            } else {
                toast.error(result.error || "Hata oluştu");
            }
        } catch (error) {
            toast.error("Kaydedilirken bir hata oluştu");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleComplete = async (id: string, current: boolean) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        await updateReminderStatusAction(id, !current);
        toast.success("Hatırlatıcı tamamlandı olarak işaretlendi");
    };

    const handleDelete = async (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        await deleteReminderAction(id);
        toast.success("Hatırlatıcı silindi");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-[11px] gap-2 transition-all text-slate-400 hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" /> Geri Dön
                </Button>
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-white">Hatırlatıcı Yönetimi</h2>
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Create Form */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="matte-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BellPlus className="h-24 w-24 text-blue-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                                <BellPlus className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black text-white">Yeni Hatırlatıcı Ekle</h3>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">HATIRLATICI BAŞLIĞI</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: iPhone 15 Ekran Stok Kontrolü"
                                    className="bg-black/20 border-white/5 rounded-xl h-12 text-sm font-medium focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AÇIKLAMA</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Hatırlatıcı detaylarını buraya yazın..."
                                    className="bg-black/20 border-white/5 rounded-xl min-h-[100px] text-sm font-medium resize-none focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TARİH VE SAAT</label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-black/20 border-white/5 rounded-xl h-11 text-sm font-medium pl-10"
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    </div>
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="bg-black/20 border-white/5 rounded-xl h-11 text-sm font-medium mt-2"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">KATEGORİ</label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-black/20 border-white/5 rounded-xl h-11 text-sm font-medium">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="Stok Uyarısı">Stok Uyarısı</SelectItem>
                                            <SelectItem value="Servis Teslimatı">Servis Teslimatı</SelectItem>
                                            <SelectItem value="Ödeme Vadesi">Ödeme Vadesi</SelectItem>
                                            <SelectItem value="Müşteri Takibi">Müşteri Takibi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TEKRARLAMA</label>
                                    <Select value={recurrence} onValueChange={setRecurrence}>
                                        <SelectTrigger className="bg-black/20 border-white/5 rounded-xl h-11 text-sm font-medium">
                                            <SelectValue placeholder="Yok" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="Yok">Yok</SelectItem>
                                            <SelectItem value="Günlük">Günlük</SelectItem>
                                            <SelectItem value="Haftalık">Haftalık</SelectItem>
                                            <SelectItem value="Aylık">Aylık</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PERSONEL</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Tüm Personel"
                                            readOnly
                                            className="bg-black/20 border-white/5 rounded-xl h-11 text-sm font-medium pl-10"
                                        />
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                                <Button variant="ghost" onClick={() => setTitle("")} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest">İPTAL</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-8 rounded-xl flex items-center gap-2 shadow-xl shadow-blue-600/20"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} KAYDET
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: List */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Bekleyen Hatırlatıcılar</h3>
                            <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-500 text-[9px] font-black">{reminders.length} AKTİF</span>
                        </div>
                        <Button variant="ghost" className="h-8 text-[10px] font-bold text-slate-500 gap-1 hover:text-white transition-colors">
                            Tümünü Görüntüle <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500/20" />
                            </div>
                        ) : reminders.length === 0 ? (
                            <div className="py-20 text-center matte-card rounded-3xl border-white/5 bg-white/[0.01]">
                                <h4 className="text-slate-500 font-bold text-sm">Bekleyen hatırlatıcı bulunamadı.</h4>
                            </div>
                        ) : (
                            reminders.map((r, idx) => (
                                <div
                                    key={r.id}
                                    className="group matte-card p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all relative overflow-hidden"
                                >
                                    <div className="lex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                                            r.category === "Stok Uyarısı" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" :
                                                r.category === "Servis Teslimatı" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                    "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                        )} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest",
                                                    r.category === "Stok Uyarısı" ? "text-blue-400" :
                                                        r.category === "Servis Teslimatı" ? "text-emerald-400" :
                                                            "text-rose-400"
                                                )}>
                                                    {r.category}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500">
                                                    {format(new Date(r.date), "PPP p", { locale: tr })}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-white mb-1 leading-tight group-hover:text-blue-400 transition-colors">{r.title}</h4>
                                            {r.description && <p className="text-[12px] text-slate-400 line-clamp-2 leading-snug mb-3">{r.description}</p>}

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                                                        <User className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-500">{r.user?.name || "Personel"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        onClick={() => handleToggleComplete(r.id, false)}
                                                        className="h-7 px-3 rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white text-[10px] font-black border border-emerald-500/20 transition-all gap-1.5"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" /> BİTİR
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(r.id)}
                                                        className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-all text-slate-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action highlight */}
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                                        <ChevronRight className="h-4 w-4 text-white/20" />
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Summary View (Image 3 Bottom-Right style) */}
                        {!isLoading && reminders.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-blue-600 rounded-2xl p-4 shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                                    <div className="absolute inset-x-0 bottom-0 top-0 bg-white/5 pointer-events-none" />
                                    <Clock className="absolute -right-2 -bottom-2 h-12 w-12 text-black/10 group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest relative z-10">BU HAFTA</span>
                                    <div className="text-2xl font-black text-white relative z-10 leading-none my-1">{reminders.length}</div>
                                    <p className="text-[9px] font-bold text-blue-100/70 relative z-10">Planlanan İşlem</p>
                                </div>
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 relative overflow-hidden group">
                                    <AlertCircle className="absolute -right-2 -bottom-2 h-12 w-12 text-white/[0.03] group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">GECİKEN</span>
                                    <div className="text-2xl font-black text-white relative z-10 leading-none my-1">0</div>
                                    <p className="text-[9px] font-bold text-rose-500 relative z-10 flex items-center gap-1">
                                        <AlertCircle className="h-2 w-2" /> Aksiyon Gerekiyor
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
