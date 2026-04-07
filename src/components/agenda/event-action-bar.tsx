"use client";

import { useState } from "react";
import {
    CheckCircle2, Trash2, CalendarClock, Loader2, Play,
    DollarSign, Receipt, Wrench, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    deleteAgendaEventAction,
    realizeAgendaEventAction,
    completeAgendaEventAction,
    rescheduleAgendaEventAction
} from "@/lib/actions/agenda-actions";
import { toast } from "sonner";
import { CalendarEvent } from "./calendar-grid";

interface EventActionBarProps {
    event: CalendarEvent;
    accounts: { id: string; name: string; balance: number }[];
    onDone: () => void;  // callback after any action (triggers refresh)
    compact?: boolean;   // compact layout for sidebar
}

export function EventActionBar({ event, accounts, onDone, compact = false }: EventActionBarProps) {
    const [busy, setBusy] = useState<string | null>(null);   // which action is running
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
    const [showReschedule, setShowReschedule] = useState(false);
    const [newDate, setNewDate] = useState("");

    const isAgendaEvent = event.source === "AGENDA";
    const isFinancial = event.type === "PAYMENT" || event.type === "COLLECTION";

    const run = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
        setBusy(key);
        try {
            const res = await fn();
            if (res.success) onDone();
            else toast.error(res.error || "İşlem başarısız.");
        } catch {
            toast.error("Bilinmeyen bir hata oluştu.");
        } finally {
            setBusy(null);
        }
    };

    const handleRealize = () => {
        if (!selectedAccountId) { toast.error("Kasa seçin."); return; }
        const label = event.type === "PAYMENT" ? "Ödeme yapıldı." : "Gelir tahsil edildi.";
        run("realize", async () => {
            const r = await realizeAgendaEventAction(event.id, selectedAccountId);
            if (r.success) toast.success(label);
            return r;
        });
    };

    const handleComplete = () => {
        const label = event.type === "SERVICE" ? "Servise başlanıldı — görev tamamlandı." : "Görev tamamlandı. ✅";
        run("complete", async () => {
            const r = await completeAgendaEventAction(event.id);
            if (r.success) toast.success(label);
            return r;
        });
    };

    const handleDelete = () => {
        run("delete", async () => {
            const r = await deleteAgendaEventAction(event.id);
            if (r.success) toast.success("Etkinlik silindi.");
            return r;
        });
    };

    const handleReschedule = async () => {
        if (!newDate) { toast.error("Tarih seçin."); return; }
        setBusy("reschedule");
        try {
            const r = await rescheduleAgendaEventAction(event.id, new Date(newDate));
            if (r.success) {
                toast.success("Etkinlik ertelendi.");
                setShowReschedule(false);
                onDone();
            } else {
                toast.error(r.error || "Erteleme başarısız.");
            }
        } catch {
            toast.error("Hata oluştu.");
        } finally {
            setBusy(null);
        }
    };

    const renderActionButton = () => {
        // If event is already completed, show only the badge
        if (event.isCompleted) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider w-fit">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Tamamlandı
                </div>
            );
        }

        if (!isAgendaEvent) return null;   // no actions for SERVICE/SUPPLIER_TX source events

        if (isFinancial) {
            return (
                <div
                    className={cn("flex items-center gap-2", compact ? "flex-col items-start" : "flex-row")}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="h-8 text-[11px] bg-[#1a1a1a] border-[#333] min-w-[130px]">
                            <SelectValue placeholder="Kasa Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#333]">
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id} className="text-[11px]">
                                    {acc.name} — ₺{Number(acc.balance).toLocaleString("tr-TR")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        disabled={!!busy}
                        onClick={handleRealize}
                        className={cn(
                            "h-8 text-xs px-3 text-white font-semibold whitespace-nowrap",
                            event.type === "PAYMENT" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                    >
                        {busy === "realize"
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : event.type === "PAYMENT"
                                ? <><Receipt className="h-3.5 w-3.5 mr-1.5" /> Ödeme Yapıldı</>
                                : <><DollarSign className="h-3.5 w-3.5 mr-1.5" /> Tahsil Edildi</>
                        }
                    </Button>
                </div>
            );
        }

        if (event.type === "SERVICE") {
            return (
                <Button
                    size="sm"
                    disabled={!!busy}
                    onClick={handleComplete}
                    className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                    {busy === "complete"
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><Play className="h-3.5 w-3.5 mr-1.5" /> Servise Başlanıldı</>
                    }
                </Button>
            );
        }

        if (event.type === "TASK") {
            return (
                <Button
                    size="sm"
                    disabled={!!busy}
                    onClick={handleComplete}
                    className="h-8 text-xs px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                    {busy === "complete"
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><CheckCheck className="h-3.5 w-3.5 mr-1.5" /> Yapıldı ✓</>
                    }
                </Button>
            );
        }

        return null;
    };

    return (
        <div className="space-y-2 mt-2">
            {/* Primary Action */}
            {renderActionButton()}

            {/* Reschedule inline form */}
            {showReschedule && isAgendaEvent && !event.isCompleted && (
                <div className="flex items-center gap-2 mt-1 p-2 bg-[#111] rounded-xl border border-[#2a2a2a]">
                    <input
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="h-8 rounded-lg border border-[#333] bg-[#1a1a1a] text-xs text-white px-2 flex-1 outline-none"
                    />
                    <Button
                        size="sm"
                        disabled={!!busy}
                        onClick={handleReschedule}
                        className="h-8 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {busy === "reschedule" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ertele"}
                    </Button>
                    <Button
                        size="sm" variant="ghost"
                        onClick={() => setShowReschedule(false)}
                        className="h-8 w-8 p-0 text-muted-foreground/80 hover:text-white"
                    >
                        ✕
                    </Button>
                </div>
            )}

            {/* Secondary: Reschedule + Delete */}
            {isAgendaEvent && !event.isCompleted && (
                <div className="flex items-center gap-1.5 pt-1">
                    <Button
                        size="sm" variant="ghost"
                        disabled={!!busy}
                        onClick={() => setShowReschedule(v => !v)}
                        className="h-7 text-[11px] px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                        <CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Ertele
                    </Button>
                    <Button
                        size="sm" variant="ghost"
                        disabled={!!busy}
                        onClick={handleDelete}
                        className="h-7 text-[11px] px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        {busy === "delete" ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Sil</>}
                    </Button>
                </div>
            )}
        </div>
    );
}
