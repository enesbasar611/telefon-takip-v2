"use client";

import { cn } from "@/lib/utils";
import {
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, format, isSameMonth, isSameDay, isToday
} from "date-fns";
import { tr } from "date-fns/locale";
import { AgendaEventType } from "@prisma/client";

// Mapped event model from action
export type CalendarEvent = {
    id: string;
    title: string;
    type: AgendaEventType;
    date: Date;
    amount: number | null;
    category: string | null;
    source: string;
    isCompleted?: boolean;
};

interface CalendarGridProps {
    currentDate: Date;
    events: CalendarEvent[];
    onDayClick?: (day: Date) => void;
}

export function CalendarGrid({ currentDate, events, onDayClick }: CalendarGridProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getEventStyles = (type: AgendaEventType) => {
        switch (type) {
            case 'SERVICE': return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case 'PAYMENT': return "bg-rose-500/10 text-rose-600 border-rose-500/20";
            case 'COLLECTION': return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case 'TASK': return "bg-purple-500/10 text-purple-600 border-purple-500/20";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <div className="w-full bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                    <div key={day} className="py-4 text-center text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {days.map((day, dayIdx) => {
                    const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick && onDayClick(day)}
                            className={cn(
                                "min-h-[100px] sm:min-h-[140px] p-2 sm:p-3 border-r border-b border-border/40 transition-all hover:bg-muted/30 relative group cursor-pointer",
                                !isCurrentMonth && "opacity-20 pointer-events-none",
                                isCurrentDay && "bg-blue-500/[0.03]"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-xs sm:text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                                    isCurrentDay
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                        : "text-foreground group-hover:bg-muted"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>

                            {/* Events List */}
                            <div className="mt-3 space-y-1.5 overflow-y-auto no-scrollbar pb-1 max-h-[60px] sm:max-h-[100px]">
                                {dayEvents.map(event => {
                                    const isUpcoming = !event.isCompleted && isCurrentDay && new Date(event.date) > new Date();

                                    return (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold truncate border shadow-sm transition-all hover:scale-[1.02] active:scale-95 relative",
                                                getEventStyles(event.type),
                                                event.isCompleted && "line-through opacity-40 grayscale",
                                                isUpcoming && "ring-2 ring-blue-500/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                    isUpcoming ? "bg-blue-500 animate-pulse" : "bg-current opacity-60"
                                                )} />
                                                <span className="truncate flex-1 tracking-tight">{event.title}</span>
                                            </div>

                                            {/* Corner indicator for manual appointments */}
                                            {event.source === 'AGENDA' && (
                                                <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-blue-500 rounded-bl-sm" title="Randevu" />
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Mobile Dots (visible if many events) */}
                                {dayEvents.length > 3 && (
                                    <div className="sm:hidden flex justify-center gap-0.5 mt-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
