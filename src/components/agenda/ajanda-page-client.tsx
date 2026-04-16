"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Activity, PenTool, Receipt, DollarSign, CheckCircle2, RefreshCw, Trash2, CheckSquare, Square, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid, CalendarEvent } from "./calendar-grid";
import { DayDetailsModal } from "./day-details-modal";
import { format, isToday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getCalendarEventsAction, bulkDeleteAgendaEventsAction, clearMonthAgendaEventsAction } from "@/lib/actions/agenda-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { EventActionBar } from "./event-action-bar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AjandaPageClientProps {
    initialEvents: CalendarEvent[];
}

const TYPE_CONFIG: any = {
    SERVICE: { colors: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    PAYMENT: { colors: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
    COLLECTION: { colors: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    TASK: { colors: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

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
    const [isPending, startTransition] = useTransition();

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
        router.refresh();
    }, [refreshEvents, router]);

    const handleClearMonth = async () => {
        const monthName = format(currentDate, "MMMM", { locale: tr });
        if (!window.confirm(`${monthName} ayına ait TÜM kayıtları takvimden kaldırmak istediğinizden emin misiniz? (Sistemden silinmez, sadece bu görünümden gizlenir)`)) return;

        setIsRefreshing(true);
        try {
            const res = await clearMonthAgendaEventsAction(currentDate.getFullYear(), currentDate.getMonth() + 1);
            if (res.success) {
                toast.success(`${monthName} ayı başarıyla temizlendi.`);
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
        if (!confirm(`${selectedIds.length} adet kaydı takvimden kaldırmak istediğinize emin misiniz?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await bulkDeleteAgendaEventsAction(selectedIds);
            if (res.success) {
                toast.success("Seçili kayıtlar takvimden kaldırıldı.");
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

    return (
        <div className="flex flex-col lg:flex-row gap-8 mt-4 max-w-full">
            {/* Left Area: Calendar */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card border border-border p-5 rounded-[2.5rem] shadow-sm gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted/50 rounded-2xl border border-border p-1">
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => handleMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="w-32 sm:w-40 text-center text-[13px] font-bold uppercase tracking-widest text-foreground">
                                {format(currentDate, "MMMM yyyy", { locale: tr })}
                            </span>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => handleMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={() => handleMonthChange(new Date())}
                            variant="outline"
                            className="h-11 border-border bg-background hover:bg-muted text-foreground font-black rounded-2xl px-5 text-[10px] tracking-[0.2em]"
                        >
                            BUGÜN
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
                        <Button
                            onClick={refreshEvents}
                            variant="ghost"
                            size="icon"
                            className={cn("h-11 w-11 text-muted-foreground hover:text-foreground rounded-2xl bg-muted/60 border border-border", isRefreshing && "animate-spin")}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>

                        <Button
                            onClick={handleClearMonth}
                            variant="ghost"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 rounded-2xl h-11 px-6 flex items-center gap-2 border border-rose-500/20 transition-all font-black group"
                        >
                            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.15em] leading-none">Ayı Temizle</span>
                        </Button>

                        <Button
                            onClick={() => { setSelectedDate(new Date()); setIsDayModalOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 px-7 flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all font-black"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.15em] leading-none">Yeni İşlem</span>
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className={cn("transition-all duration-300", isRefreshing ? "opacity-30 blur-[1px] pointer-events-none" : "opacity-100")}>
                    <CalendarGrid
                        currentDate={currentDate}
                        events={events}
                        onDayClick={(day) => {
                            setSelectedDate(day);
                            setIsDayModalOpen(true);
                        }}
                    />
                </div>
            </div>

            {/* Right Side Agenda Panel */}
            <div className="w-full lg:w-[380px] flex flex-col gap-6">
                <div className="bg-card border border-border rounded-[3rem] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Activity className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">Gündem</h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Bugünkü Planlar</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-muted/80 border-border text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">
                            {format(new Date(), "d MMMM yyyy", { locale: tr })}
                        </Badge>
                    </div>

                    <div className="mb-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                {todaysEvents.length} Kayıt &nbsp;·&nbsp; {todaysEvents.filter(e => e.isCompleted).length} Tamam
                            </p>
                            {todaysEvents.length > 0 && (
                                <button
                                    onClick={() => {
                                        const allVisibleIds = todaysEvents.map(e => e.id);
                                        const allSelected = allVisibleIds.every(id => selectedIds.includes(id));
                                        if (allSelected) setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                                        else setSelectedIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                                    }}
                                    className="text-[10px] text-blue-500 hover:text-blue-600 font-black uppercase tracking-widest"
                                >
                                    {todaysEvents.every(e => selectedIds.includes(e.id)) ? "Bırak" : "Seç"}
                                </button>
                            )}
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="flex-1 h-11 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-500 hover:text-white text-[10px] font-black gap-2 transition-all shadow-xl shadow-rose-500/10"
                                >
                                    {isBulkDeleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    {selectedIds.length} KALDIR
                                </Button>
                                <Button
                                    onClick={() => setSelectedIds([])}
                                    variant="ghost"
                                    className="h-11 px-5 bg-muted border border-border text-[10px] font-black uppercase tracking-widest"
                                >
                                    VAZGEÇ
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {todaysEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="h-20 w-20 rounded-[2rem] bg-muted/60 flex items-center justify-center mb-6">
                                    <CheckCircle2 className="h-10 w-10 text-muted-foreground/20" />
                                </div>
                                <p className="text-muted-foreground text-sm font-bold opacity-60">Bugünlük planlanan<br />bir görev bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todaysEvents
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map(event => {
                                        const isUpcoming = !event.isCompleted && new Date(event.date) > new Date();
                                        const cfg = TYPE_CONFIG[event.type] || { colors: "bg-muted text-muted-foreground" };

                                        return (
                                            <div key={event.id} className="relative flex items-start gap-4 p-5 bg-muted/30 hover:bg-muted/50 border border-border rounded-[2rem] transition-all group overflow-hidden">
                                                <div className="flex flex-col items-center gap-3">
                                                    <button
                                                        onClick={() => toggleSelect(event.id)}
                                                        className={cn(
                                                            "transition-all duration-200",
                                                            selectedIds.includes(event.id) ? "text-blue-500 scale-125" : "text-muted-foreground/30 hover:text-blue-500"
                                                        )}
                                                    >
                                                        {selectedIds.includes(event.id) ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                                                    </button>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60 tabular-nums">
                                                            {format(new Date(event.date), "HH:mm")}
                                                        </span>
                                                        {isUpcoming && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                                                    </div>

                                                    <h4 className={cn(
                                                        "text-[15px] font-bold text-foreground leading-snug tracking-tight",
                                                        event.isCompleted && "line-through opacity-40 grayscale"
                                                    )}>
                                                        {event.title}
                                                    </h4>

                                                    <div className="flex flex-wrap items-center gap-2 mt-4">
                                                        <span className={cn(
                                                            "text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest",
                                                            cfg.colors
                                                        )}>
                                                            {event.category || "Genel"}
                                                        </span>
                                                        {event.amount && (
                                                            <span className="text-xs font-black text-foreground/80 tabular-nums border border-border px-2 px-1 rounded-lg">
                                                                ₺{event.amount.toLocaleString('tr-TR')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-5 pt-5 border-t border-border/60">
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
                        )}
                    </div>
                </div>
            </div>

            <DayDetailsModal
                isOpen={isDayModalOpen}
                onClose={handleModalClose}
                date={selectedDate}
                events={events.filter(e => isSameDay(new Date(e.date), selectedDate))}
            />
        </div>
    );
}
