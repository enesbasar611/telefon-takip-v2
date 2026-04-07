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
                    onClose(); // this triggers refreshEvents in parent
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

    const handleRealizeEvent = async (eventId: string, type: string) => {
        if (!selectedAccountId) {
            toast.error("Lütfen bir kasa/hesap seçin.");
            return;
        }

        setProcessingEventId(eventId);
        try {
            const res = await realizeAgendaEventAction(eventId, selectedAccountId);
            if (res.success) {
                toast.success(type === 'PAYMENT' ? "Ödeme gerçekleştirildi." : "Tahsilat gerçekleştirildi.");
                onClose();
            } else {
                toast.error(res.error || "İşlem gerçekleştirilemedi.");
            }
        } catch (e) {
            toast.error("Bilinmeyen bir hata oluştu.");
        } finally {
            setProcessingEventId(null);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'SERVICE': return <PenTool className="h-4 w-4 text-blue-500" />;
            case 'PAYMENT': return <Receipt className="h-4 w-4 text-red-500" />;
            case 'COLLECTION': return <DollarSign className="h-4 w-4 text-emerald-500" />;
            case 'TASK': return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
            default: return <Activity className="h-4 w-4 text-muted-foreground/80" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-[#333333] bg-[#111111] p-0 shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <div className="px-6 pt-6 pb-2 border-b border-[#222]">
                    <div className="flex items-center justify-between mb-2">
                        <DialogTitle className="text-xl text-white font-semibold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            {format(date, "d MMMM yyyy", { locale: tr })}
                        </DialogTitle>
                    </div>

                    <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#222] mt-4">
                        <button
                            hidden={events.length === 0}
                            onClick={() => setActiveTab('LIST')}
                            className={cn(
                                "flex-1 text-xs font-medium py-2 rounded-lg transition-all",
                                activeTab === 'LIST' ? "bg-[#2a2a2a] text-white shadow-sm" : "text-muted-foreground hover:text-foreground/90"
                            )}>
                            Günün Gündemi ({events.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('ADD')}
                            className={cn(
                                "flex-1 text-xs font-medium py-2 rounded-lg transition-all",
                                activeTab === 'ADD' ? "bg-[#2a2a2a] text-white shadow-sm" : "text-muted-foreground hover:text-foreground/90"
                            )}>
                            Yeni Ekle
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* LIST TAB */}
                    {activeTab === 'LIST' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                            {events.map((event) => (
                                <div key={event.id} className="bg-[#151515] p-4 rounded-2xl border border-[#222] flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 bg-[#1a1a1a] p-2 rounded-xl border border-[#333]">
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground/90">{event.title}</h4>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(event.date), "HH:mm")} • {event.category || "Genel"}
                                                </p>
                                            </div>
                                        </div>
                                        {event.amount ? (
                                            <span className={cn(
                                                "text-sm font-bold shrink-0",
                                                event.type === 'PAYMENT' ? "text-red-400" : "text-emerald-400"
                                            )}>
                                                ₺{event.amount}
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Action Bar */}
                                    <EventActionBar
                                        event={event}
                                        accounts={accounts}
                                        onDone={onClose}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ADD TAB */}
                    {activeTab === 'ADD' && (
                        <div className="space-y-4">
                            <div className="flex border-b border-[#222] pb-4">
                                <button
                                    onClick={() => setAddMode('QUICK')}
                                    className={cn(
                                        "w-1/3 flex items-center justify-center gap-2 pb-2 text-xs font-semibold border-b-2 transition-all",
                                        addMode === 'QUICK' ? "border-blue-500 text-blue-400" : "border-transparent text-muted-foreground/80 hover:text-foreground"
                                    )}
                                >
                                    <Zap className="h-4 w-4" /> Hızlı Not
                                </button>
                                <button
                                    onClick={() => setAddMode('DETAILED')}
                                    className={cn(
                                        "w-1/3 flex items-center justify-center gap-2 pb-2 text-xs font-semibold border-b-2 transition-all",
                                        addMode === 'DETAILED' ? "border-blue-500 text-blue-400" : "border-transparent text-muted-foreground/80 hover:text-foreground"
                                    )}
                                >
                                    <FileText className="h-4 w-4" /> Detaylı Ekle
                                </button>
                                <button
                                    onClick={() => setAddMode('RECURRING')}
                                    className={cn(
                                        "w-1/3 flex items-center justify-center gap-2 pb-2 text-xs font-semibold border-b-2 transition-all",
                                        addMode === 'RECURRING' ? "border-blue-500 text-blue-400" : "border-transparent text-muted-foreground/80 hover:text-foreground"
                                    )}
                                >
                                    <Repeat className="h-4 w-4" /> Tekrarlı Ekle
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="pt-2">
                                {addMode === 'QUICK' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] text-muted-foreground font-medium">HIZLI NOTUNUZ</Label>
                                            <Textarea required name="quickNote" placeholder="Örn: Saat 15:00'te toptancı gelecek..." className="bg-[#151515] border-[#222] min-h-[100px] resize-none" />
                                        </div>
                                        <Button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                                            {isLoading ? "Ekleniyor..." : "Notu Ekle"}
                                        </Button>
                                    </div>
                                )}

                                {(addMode === 'DETAILED' || addMode === 'RECURRING') && (
                                    <div className="space-y-4 h-[50vh] overflow-y-auto no-scrollbar pr-2">
                                        {addMode === 'RECURRING' && (
                                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mb-2 flex items-start gap-3">
                                                <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0 mt-0.5">
                                                    <Repeat className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <p className="text-xs text-blue-300 leading-relaxed">
                                                    <span className="font-semibold block mb-1">💡 Tekrarlı Kasa İşlemi İpucu</span>
                                                    Örn: Kira, maaş gibi her ay tekrarlayan işlemleri otomatik ekleyin. Başlangıç tarihine ayın kaçıncı günü olduğunu seçtiğinizde, kaç ay boyunca tekrarlanacağını girerek topluca oluşturabilirsiniz.
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label className="text-[11px] text-muted-foreground font-medium">İŞLEM TÜRÜ</Label>
                                            <div className="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-1.5 rounded-xl border border-[#222]">
                                                {types.map(t => {
                                                    const Icon = t.icon;
                                                    return (
                                                        <button type="button" key={t.id} onClick={() => setSelectedType(t.id as AgendaEventType)}
                                                            className={cn("flex flex-col items-center py-2 rounded-lg", selectedType === t.id ? "bg-[#333] text-white" : "text-muted-foreground/80 hover:text-foreground")}>
                                                            <Icon className="h-4 w-4 mb-1" />
                                                            <span className="text-[9px] uppercase">{t.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[11px] text-muted-foreground font-medium">BAŞLIK</Label>
                                            <Input required name="title" placeholder="İşlem başlığı" className="bg-[#1a1a1a] border-[#333]" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground font-medium">TARİH</Label>
                                                <Input required type="date" name="date" defaultValue={format(date, "yyyy-MM-dd")} className="bg-[#1a1a1a] border-[#333]" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground font-medium">SAAT</Label>
                                                <Input type="time" name="time" defaultValue="12:00" className="bg-[#1a1a1a] border-[#333]" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground font-medium">KATEGORİ</Label>
                                                <Input name="category" placeholder="Kategori" className="bg-[#1a1a1a] border-[#333]" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground font-medium">TUTAR</Label>
                                                <Input name="amount" type="number" step="0.01" className="bg-[#1a1a1a] border-[#333]" />
                                            </div>
                                        </div>

                                        {addMode === 'RECURRING' && (
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground font-medium">KAÇ AY TEKRARLANSIN?</Label>
                                                <Input required name="monthsToRepeat" type="number" min="1" max="60" defaultValue="12" className="bg-[#1a1a1a] border-[#333]" />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label className="text-[11px] text-muted-foreground font-medium">AÇIKLAMA</Label>
                                            <Textarea name="notes" placeholder="Notlar..." className="bg-[#1a1a1a] border-[#333] resize-none" />
                                        </div>

                                        <Button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                                            {isLoading ? "Kaydediliyor..." : "Kaydet"}
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
