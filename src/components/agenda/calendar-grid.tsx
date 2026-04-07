"use client";

import { cn } from "@/lib/utils";
import {
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, format, isSameMonth, isSameDay, isToday
} from "date-fns";
import { tr } from "date-fns/locale";
import { AgendaEventType } from "@prisma/client";
import { Bookmark } from "lucide-react";

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

    const getEventColor = (type: AgendaEventType) => {
        switch (type) {
            case 'SERVICE': return "bg-blue-500/15 text-blue-500 border-blue-500/30";
            case 'PAYMENT': return "bg-red-500/15 text-red-500 border-red-500/30";
            case 'COLLECTION': return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
            case 'TASK': return "bg-purple-500/15 text-purple-500 border-purple-500/30";
            default: return "bg-slate-500/15 text-muted-foreground/80 border-slate-500/30";
        }
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden bg-[#111111] border border-[#222222] rounded-3xl shadow-2xl">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-[#222222] bg-[#151515]">
                {["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"].map((day) => (
                    <div key={day} className="py-4 text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
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
                                "min-h-[120px] p-2 border-r border-b border-[#222222]/50 transition-colors hover:bg-[#1a1a1a]/50 relative group cursor-pointer",
                                !isCurrentMonth && "opacity-40",
                                isCurrentDay && "bg-primary/5"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground/80 group-hover:text-foreground"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>

                            <div className="mt-2 space-y-1.5 h-[80px] overflow-y-auto no-scrollbar pb-2">
                                {dayEvents.map(event => {
                                    const isUpcoming = !event.isCompleted && isCurrentDay && new Date(event.date) > new Date();

                                    return (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "px-2 py-1.5 rounded-lg text-xs font-medium truncate border backdrop-blur-sm shadow-sm transition-all hover:scale-[1.02]",
                                                getEventColor(event.type),
                                                event.isCompleted && "line-through opacity-50",
                                                isUpcoming && "border-blue-500 animate-pulse ring-1 ring-blue-500/30 shadow-[0_0_8px_-2px_rgba(59,130,246,0.5)]"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                    isUpcoming ? "bg-blue-400" : "bg-current opacity-70"
                                                )} />
                                                <span className="truncate flex-1">{event.title}</span>

                                                {/* Premium Ribbon Badge */}
                                                {event.source === 'AGENDA' && (
                                                    <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden rounded-tr-lg pointer-events-none">
                                                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[5px] font-black py-0.5 w-10 text-center rotate-45 translate-x-[13px] translate-y-[-1px] shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                                            RND
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
