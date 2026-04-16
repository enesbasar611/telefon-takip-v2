"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, DollarSign, PenTool, Receipt, CheckCircle2, ChevronRight, Activity, Zap, FileText, Landmark, Loader2, Repeat } from "lucide-react";
import { createAgendaEventAction, realizeAgendaEventAction, createRecurringAgendaEventsAction } from "@/lib/actions/agenda-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { AgendaEventType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEvent } from "./calendar-grid";
import { EventActionBar } from "./event-action-bar";

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    events: CalendarEvent[];
}

export function DayDetailsModal({ isOpen, onClose, date, events }: DayDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'LIST' | 'ADD'>(events.length > 0 ? 'LIST' : 'ADD');
    const [addMode, setAddMode] = useState<'QUICK' | 'DETAILED' | 'RECURRING'>('QUICK');
    const [isLoading, setIsLoading] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [processingEventId, setProcessingEventId] = useState<string | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

    // Create Event Form States
    const [selectedType, setSelectedType] = useState<AgendaEventType>('SERVICE');

    const types = [
        { id: 'SERVICE', label: 'Servis', icon: PenTool, color: "blue" },
        { id: 'PAYMENT', label: 'Ödeme', icon: Receipt, color: "red" },
        { id: 'COLLECTION', label: 'Tahsilat', icon: DollarSign, color: "emerald" },
        { id: 'TASK', label: 'Görev', icon: CheckCircle2, color: "purple" },
    ];

    useEffect(() => {
        if (isOpen) {
            setActiveTab(events.length > 0 ? 'LIST' : 'ADD');
            setProcessingEventId(null);
            fetchAccounts();
        }
    }, [isOpen, events.length]);

    const fetchAccounts = async () => {
        const accs = await getAccounts();
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccountId(accs[0].id);
    };

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);

            if (addMode === 'QUICK') {
                const note = formData.get("quickNote") as string;
                if (!note) { setIsLoading(false); return; }

                const res = await createAgendaEventAction({
                    title: note,
                    type: 'TASK',
                    date: date,
                    category: "Hızlı Not",
                });

                if (res.success) {
                    toast.success("Hızlı not eklendi.");
                    onClose();
                } else {
                    toast.error(res.error || "Hata oluştu.");
                }
            } else if (addMode === 'RECURRING') {
                const dateStr = formData.get("date") as string;
                const timeStr = formData.get("time") as string;
                const dateObj = new Date(`${dateStr}T${timeStr || "12:00"}`);

                const amountStr = formData.get("amount") as string;
                const amount = amountStr ? parseFloat(amountStr) : undefined;
                const repeatStr = formData.get("monthsToRepeat") as string;
                const monthsToRepeat = repeatStr ? parseInt(repeatStr) : 12;

                const res = await createRecurringAgendaEventsAction({
                    title: formData.get("title") as string,
                    type: selectedType,
                    startDate: dateObj,
                    monthsToRepeat,
                    category: formData.get("category") as string,
                    amount: amount,
                    notes: formData.get("notes") as string,
                });

                if (res.success) {
                    toast.success(`${res.count} adet tekrarlı işlem başarıyla oluşturuldu.`);
                    onClose();
                } else {
                    toast.error(res.error || "Hata oluştu.");
                }
            } else {
                const dateStr = formData.get("date") as string;
                const timeStr = formData.get("time") as string;
                const dateObj = new Date(`${dateStr}T${timeStr || "12:00"}`);

                const amountStr = formData.get("amount") as string;
                const amount = amountStr ? parseFloat(amountStr) : undefined;

                const res = await createAgendaEventAction({
                    title: formData.get("title") as string,
                    type: selectedType,
                    date: dateObj,
                    category: formData.get("category") as string,
                    amount: amount,
                    notes: formData.get("notes") as string,
                });

                if (res.success) {
                    toast.success("İşlem başarıyla oluşturuldu.");
                    onClose();
                } else {
                    toast.error(res.error || "Hata oluştu.");
                }
            }
        } catch (error) {
            toast.error("İşlem başarısız.");
        } finally {
            setIsLoading(false);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'SERVICE': return <PenTool className="h-4 w-4 text-blue-500" />;
            case 'PAYMENT': return <Receipt className="h-4 w-4 text-rose-500" />;
            case 'COLLECTION': return <DollarSign className="h-4 w-4 text-emerald-500" />;
            case 'TASK': return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
            default: return <Activity className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-border bg-card p-0 shadow-2xl overflow-hidden rounded-[2.5rem]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />

                <div className="px-8 pt-8 pb-4 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            {format(date, "d MMMM yyyy", { locale: tr })}
                        </DialogTitle>
                    </div>

                    <div className="flex bg-muted/50 p-1 rounded-[1.25rem] border border-border mt-6">
                        <button
                            hidden={events.length === 0}
                            onClick={() => setActiveTab('LIST')}
                            className={cn(
                                "flex-1 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-[1rem] transition-all",
                                activeTab === 'LIST' ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                            )}>
                            Gündem ({events.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('ADD')}
                            className={cn(
                                "flex-1 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-[1rem] transition-all",
                                activeTab === 'ADD' ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                            )}>
                            Yeni Ekle
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {/* LIST TAB */}
                    {activeTab === 'LIST' && (
                        <div className="space-y-4 max-h-[55vh] overflow-y-auto no-scrollbar pr-2">
                            {events.map((event) => (
                                <div key={event.id} className="bg-muted/30 p-5 rounded-[2rem] border border-border/60 hover:border-border transition-colors flex flex-col gap-3 group relative overflow-hidden">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-0.5 bg-background p-2.5 rounded-2xl border border-border group-hover:bg-muted/50 transition-colors">
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={cn(
                                                    "text-[15px] font-black text-foreground tracking-tight leading-snug",
                                                    event.isCompleted && "line-through opacity-40 grayscale"
                                                )}>{event.title}</h4>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-2 opacity-60">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(event.date), "HH:mm")} &nbsp;•&nbsp; {event.category || "Genel"}
                                                </p>
                                            </div>
                                        </div>
                                        {event.amount ? (
                                            <span className={cn(
                                                "text-[13px] font-black tabular-nums border border-border px-3 py-1 rounded-full",
                                                event.type === 'PAYMENT' ? "text-rose-500 bg-rose-500/5 border-rose-500/10" : "text-emerald-500 bg-emerald-500/5 border-emerald-500/10"
                                            )}>
                                                ₺{event.amount.toLocaleString('tr-TR')}
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-4 border-t border-border/40">
                                        <EventActionBar
                                            event={event}
                                            accounts={accounts}
                                            onDone={() => {
                                                // We need to trigger a refresh in the main client,
                                                // but since we are in a modal closed to it, onDone here should close modal
                                                onClose();
                                            }}
                                            compact={true}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ADD TAB */}
                    {activeTab === 'ADD' && (
                        <div className="space-y-6">
                            <div className="flex bg-muted/30 p-1 rounded-2xl border border-border">
                                <button
                                    onClick={() => setAddMode('QUICK')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                        addMode === 'QUICK' ? "bg-background text-blue-600 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Zap className="h-3.5 w-3.5" /> Hızlı
                                </button>
                                <button
                                    onClick={() => setAddMode('DETAILED')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                        addMode === 'DETAILED' ? "bg-background text-blue-600 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <FileText className="h-3.5 w-3.5" /> Detay
                                </button>
                                <button
                                    onClick={() => setAddMode('RECURRING')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                        addMode === 'RECURRING' ? "bg-background text-blue-600 shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Repeat className="h-3.5 w-3.5" /> Tekrar
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-6">
                                {addMode === 'QUICK' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Hızlı Not</Label>
                                            <Textarea required name="quickNote" placeholder="Örn: Saat 15:00'te toptancı gelecek..." className="bg-background border-border rounded-2xl min-h-[120px] resize-none p-4 text-sm font-bold" />
                                        </div>
                                        <Button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest h-12 rounded-2xl shadow-lg shadow-blue-500/20">
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notu Ekle"}
                                        </Button>
                                    </div>
                                )}

                                {(addMode === 'DETAILED' || addMode === 'RECURRING') && (
                                    <div className="space-y-5 h-[45vh] overflow-y-auto no-scrollbar pr-2">
                                        {addMode === 'RECURRING' && (
                                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-start gap-4">
                                                <div className="bg-blue-500/10 p-2 rounded-xl shrink-0 mt-0.5">
                                                    <Repeat className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Tekrarlı İşlem</p>
                                                    <p className="text-xs text-blue-600/70 font-bold leading-relaxed">
                                                        Kira, maaş gibi aylık işlemleri topluca oluşturun.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">İşlem Türü</Label>
                                            <div className="grid grid-cols-4 gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border">
                                                {types.map(t => {
                                                    const Icon = t.icon;
                                                    return (
                                                        <button type="button" key={t.id} onClick={() => setSelectedType(t.id as AgendaEventType)}
                                                            className={cn("flex flex-col items-center py-2.5 rounded-xl transition-all", selectedType === t.id ? "bg-background text-foreground shadow-sm border border-border/50 scale-[1.05]" : "text-muted-foreground/60 hover:text-foreground")}>
                                                            <Icon className="h-4 w-4 mb-2" />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Başlık</Label>
                                            <Input required name="title" placeholder="İşlem başlığı" className="bg-background border-border rounded-xl font-bold h-11" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Tarih</Label>
                                                <Input required type="date" name="date" defaultValue={format(date, "yyyy-MM-dd")} className="bg-background border-border rounded-xl font-bold h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Saat</Label>
                                                <Input type="time" name="time" defaultValue="12:00" className="bg-background border-border rounded-xl font-bold h-11" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Kategori</Label>
                                                <Input name="category" placeholder="Genel" className="bg-background border-border rounded-xl font-bold h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Tutar (₺)</Label>
                                                <Input name="amount" type="number" step="0.01" placeholder="0.00" className="bg-background border-border rounded-xl font-bold h-11 tabular-nums" />
                                            </div>
                                        </div>

                                        {addMode === 'RECURRING' && (
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Tekrar Sayısı (Ay)</Label>
                                                <Input required name="monthsToRepeat" type="number" min="1" max="60" defaultValue="12" className="bg-background border-border rounded-xl font-bold h-11" />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Açıklama</Label>
                                            <Textarea name="notes" placeholder="Ek detaylar..." className="bg-background border-border rounded-xl min-h-[100px] resize-none p-3 font-bold" />
                                        </div>

                                        <Button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest h-12 rounded-2xl shadow-lg shadow-blue-500/20 mt-4">
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet ve Kapat"}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
}
