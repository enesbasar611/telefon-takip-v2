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
        if (event.isCompleted) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest w-fit">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Tamamlandı
                </div>
            );
        }

        if (!isAgendaEvent) return null;

        if (isFinancial) {
            return (
                <div
                    className={cn("flex items-center gap-3", compact ? "flex-col sm:flex-row items-stretch sm:items-center" : "flex-row")}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="h-10 text-[11px] font-bold bg-background border-border min-w-[140px] rounded-xl">
                            <SelectValue placeholder="Kasa Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id} className="text-[11px] font-bold">
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
                            "h-10 text-[10px] px-5 text-white font-black uppercase tracking-widest whitespace-nowrap rounded-xl shadow-lg transition-transform active:scale-95",
                            event.type === "PAYMENT" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                        )}
                    >
                        {busy === "realize"
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : event.type === "PAYMENT"
                                ? <><Receipt className="h-3.5 w-3.5 mr-2" /> Ödemeyi Yap</>
                                : <><DollarSign className="h-3.5 w-3.5 mr-2" /> Tahsil Et</>
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
                    className="h-10 text-[10px] px-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                >
                    {busy === "complete"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><Play className="h-3.5 w-3.5 mr-2" /> Servise Başla</>
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
                    className="h-10 text-[10px] px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
                >
                    {busy === "complete"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><CheckCheck className="h-3.5 w-3.5 mr-2" /> Tamamla</>
                    }
                </Button>
            );
        }

        return null;
    };

    return (
        <div className="space-y-3">
            {/* Primary Action */}
            {renderActionButton()}

            {/* Reschedule inline form */}
            {showReschedule && isAgendaEvent && !event.isCompleted && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-muted/60 rounded-2xl border border-border shadow-inner">
                    <input
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="h-9 rounded-xl border border-border bg-background text-[11px] font-bold text-foreground px-3 flex-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button
                        size="sm"
                        disabled={!!busy}
                        onClick={handleReschedule}
                        className="h-9 text-[10px] px-4 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider rounded-xl shadow-md"
                    >
                        {busy === "reschedule" ? <Loader2 className="h-3 w-3 animate-spin" /> : "GÜNCELLE"}
                    </Button>
                    <Button
                        size="sm" variant="ghost"
                        onClick={() => setShowReschedule(false)}
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl"
                    >
                        ✕
                    </Button>
                </div>
            )}

            {/* Secondary: Reschedule + Delete */}
            {isAgendaEvent && !event.isCompleted && (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm" variant="ghost"
                        disabled={!!busy}
                        onClick={() => setShowReschedule(v => !v)}
                        className="h-8 text-[10px] px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                        <CalendarClock className="h-3.5 w-3.5 mr-2" /> Ertele
                    </Button>
                    <Button
                        size="sm" variant="ghost"
                        disabled={!!busy}
                        onClick={handleDelete}
                        className="h-8 text-[10px] px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                        {busy === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Trash2 className="h-3.5 w-3.5 mr-2" /> Sil</>}
                    </Button>
                </div>
            )}
        </div>
    );
}
