"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Activity, PenTool, Receipt, DollarSign, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid, CalendarEvent } from "./calendar-grid";
import { DayDetailsModal } from "./day-details-modal";
import { format, isToday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getCalendarEventsAction, bulkDeleteAgendaEventsAction, clearAllAgendaEventsAction } from "@/lib/actions/agenda-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { EventActionBar } from "./event-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, CheckSquare, Square } from "lucide-react";

interface AjandaPageClientProps {
    initialEvents: CalendarEvent[];
}

export function AjandaPageClient({ initialEvents }: AjandaPageClientProps) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Load accounts for financial actions
    useEffect(() => {
        getAccounts().then(acc => setAccounts(acc || []));
    }, []);

    // Re-fetch events from server after any mutation
    const refreshEvents = useCallback(async () => {
        setIsRefreshing(true);
        setSelectedIds([]);  // clear selection on refresh
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const fresh = await getCalendarEventsAction(year, month) as CalendarEvent[];
            setEvents(fresh);
        } catch (e) {
            console.error("Event refresh failed:", e);
        } finally {
            setIsRefreshing(false);
        }
    }, [currentDate]);

    // When month changes, re-fetch for the new viewing range
    const handleMonthChange = useCallback(async (newDate: Date) => {
        setCurrentDate(newDate);
        setIsRefreshing(true);
        try {
            const fresh = await getCalendarEventsAction(newDate.getFullYear(), newDate.getMonth() + 1) as CalendarEvent[];
            setEvents(fresh);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handleModalClose = useCallback(async () => {
        setIsDayModalOpen(false);
        await refreshEvents();
        router.refresh(); // also revalidate server components
    }, [refreshEvents, router]);

    const handleClearAll = async () => {
        if (!window.confirm("TÜM TAKVİMİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ? Tüm servis, ödeme ve randevu kayıtları silinecek. Bu işlem geri alınamaz.")) return;

        setIsRefreshing(true);
        try {
            const res = await clearAllAgendaEventsAction();
            if (res.success) {
                toast.success("Takvim başarıyla temizlendi.");
                await refreshEvents();
                router.refresh();
            } else {
                toast.error(res.error || "Temizleme işlemi başarısız.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsRefreshing(false);
        }
    }

    const todaysEvents = events.filter(e => isToday(new Date(e.date)));

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length} adet randevuyu silmek istediğinize emin misiniz?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await bulkDeleteAgendaEventsAction(selectedIds);
            if (res.success) {
                toast.success("Seçili randevular silindi.");
                await refreshEvents();
                router.refresh();
            } else {
                toast.error(res.error || "Hata oluştu.");
            }
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
        <div className="flex flex-col lg:flex-row gap-6 mt-6 max-w-full overflow-x-hidden">
            {/* Left Main Area: Calendar */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
                {/* Header Controls */}
                <div className="flex items-center justify-between bg-[#111111] border border-[#222] p-4 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#1a1a1a] rounded-xl border border-[#222] p-1">
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => handleMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                className="h-8 w-8 text-muted-foreground hover:text-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="w-36 text-center text-sm font-semibold uppercase tracking-wider text-white">
                                {format(currentDate, "MMMM yyyy", { locale: tr })}
                            </span>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => handleMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                className="h-8 w-8 text-muted-foreground hover:text-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={() => handleMonthChange(new Date())}
                            variant="outline"
                            className="h-10 border-[#333] bg-transparent hover:bg-[#222] text-foreground rounded-xl px-4 text-xs tracking-wider"
                        >
                            BUGÜN
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Legend */}
                        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Servis</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Gelir</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Ödeme</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Görev</span>
                        </div>

                        {/* Manual Refresh */}
                        <Button
                            onClick={refreshEvents}
                            variant="ghost"
                            size="icon"
                            className={cn("h-10 w-10 text-muted-foreground/80 hover:text-white rounded-xl", isRefreshing && "animate-spin")}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>

                        <Button
                            onClick={handleClearAll}
                            variant="ghost"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-10 px-4 flex items-center gap-2 border border-red-500/20 transition-all font-semibold"
                        >
                            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline text-xs uppercase tracking-wider">Takvimi Temizle</span>
                        </Button>

                        <Button
                            onClick={() => { setSelectedDate(new Date()); setIsDayModalOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all font-semibold"
                        >
                            <Plus className="h-4 w-4" /> <span className="hidden sm:inline text-xs uppercase tracking-wider">Yeni İşlem</span>
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <CalendarGrid
                    currentDate={currentDate}
                    events={events}
                    onDayClick={(day) => {
                        setSelectedDate(day);
                        setIsDayModalOpen(true);
                    }}
                />
            </div>

            {/* Right Side Agenda Panel */}
            <div className="w-full lg:w-[320px] flex flex-col gap-4">
                <div className="bg-[#111111] border border-[#222] rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">Bugünün Gündemi</h3>
                            {todaysEvents.filter(e => !e.isCompleted).length > 0 && (
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                    {todaysEvents.filter(e => !e.isCompleted).length}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                            {format(new Date(), "d MMM yyyy", { locale: tr })}
                        </span>
                    </div>
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground/80 font-medium tracking-tight">Toplam {todaysEvents.length} işlem / {todaysEvents.filter(e => e.isCompleted).length} tamamlandı</p>
                            {todaysEvents.length > 0 && (
                                <button
                                    onClick={() => {
                                        const allVisibleIds = todaysEvents.map(e => e.id);
                                        const allSelected = allVisibleIds.every(id => selectedIds.includes(id));
                                        if (allSelected) {
                                            setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                                        } else {
                                            setSelectedIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                                        }
                                    }}
                                    className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider"
                                >
                                    {todaysEvents.every(e => selectedIds.includes(e.id)) ? "SEÇİMİ KALDIR" : "TÜMÜNÜ SEÇ"}
                                </button>
                            )}
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="flex-1 h-9 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white text-[10px] font-black gap-2 transition-all shadow-lg"
                                >
                                    {isBulkDeleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    {selectedIds.length} ÖĞEYİ KALDIR
                                </Button>
                                <Button
                                    onClick={() => setSelectedIds([])}
                                    variant="ghost"
                                    className="h-9 px-3 text-muted-foreground/80 hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] font-bold"
                                >
                                    VAZGEÇ
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {todaysEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckCircle2 className="h-12 w-12 text-slate-700 mb-3" />
                                <p className="text-muted-foreground text-sm">Bugün için planlanmış bir<br />işlem veya görev yok.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                                {todaysEvents
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map(event => {
                                        const isUpcoming = !event.isCompleted && new Date(event.date) > new Date();
                                        const isManual = event.source === 'AGENDA';

                                        return (
                                            <div key={event.id} className="relative flex items-center gap-3 group">
                                                <button
                                                    onClick={() => toggleSelect(event.id)}
                                                    className={cn(
                                                        "transition-all duration-200 shrink-0",
                                                        selectedIds.includes(event.id) ? "text-blue-500 scale-110" : "text-slate-600 hover:text-muted-foreground"
                                                    )}
                                                >
                                                    {selectedIds.includes(event.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                </button>

                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className={cn(
                                                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] shadow-[0_0_0_4px_#111] border transition-all duration-500",
                                                        isUpcoming ? "border-blue-500 animate-pulse shadow-[0_0_12px_-2px_rgba(59,130,246,0.5)]" : "border-[#333]"
                                                    )}>
                                                        {getEventIcon(event.type)}
                                                    </div>
                                                    <div className={cn(
                                                        "flex flex-col flex-1 p-3 bg-[#151515] hover:bg-[#1a1a1a] border rounded-2xl transition-all duration-300 cursor-pointer",
                                                        isUpcoming ? "border-blue-500/50" : "border-[#222]"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={cn("font-medium text-sm text-foreground/90", event.isCompleted && "line-through opacity-50")}>
                                                                    {event.title}
                                                                </span>
                                                                {event.isCompleted && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                                                        BİTTİ
                                                                    </span>
                                                                )}
                                                                {isUpcoming && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 animate-pulse">
                                                                        YAKLAŞAN
                                                                    </span>
                                                                )}
                                                                {isManual && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                                                                        RANDEVU
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground/80">{format(new Date(event.date), "HH:mm")}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">{event.category || "Genel"}</span>
                                                            {event.amount && event.amount > 0 && (
                                                                <span className={cn(
                                                                    "text-[11px] font-medium tracking-wide",
                                                                    event.type === 'PAYMENT' ? 'text-red-400' :
                                                                        event.type === 'COLLECTION' ? 'text-emerald-400' : 'text-muted-foreground'
                                                                )}>
                                                                    {event.type === 'PAYMENT' ? '-' : ''}₺{event.amount}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Sidebar Action Bar */}
                                                        <EventActionBar
                                                            event={event}
                                                            accounts={accounts}
                                                            onDone={refreshEvents}
                                                            compact={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )
                        }
                    </div>
                </div>
            </div>

            <DayDetailsModal
                isOpen={isDayModalOpen}
                onClose={handleModalClose}
                date={selectedDate}
                events={events.filter(e => isSameDay(new Date(e.date), selectedDate))}
            />
        </div >
    );
}
