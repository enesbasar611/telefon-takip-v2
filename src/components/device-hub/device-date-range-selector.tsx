"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DeviceDateRangeSelectorProps {
    initialMonth?: string;
}

export function DeviceDateRangeSelector({ initialMonth }: DeviceDateRangeSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [mode, setMode] = useState<"month" | "range">(searchParams.has("startDate") ? "range" : "month");
    const [month, setMonth] = useState(initialMonth || new Date().toISOString().substring(0, 7));
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (mode === "month") {
            params.set("month", month);
            params.delete("startDate");
            params.delete("endDate");
        } else {
            if (!startDate || !endDate) return;
            params.set("startDate", startDate);
            params.set("endDate", endDate);
            params.delete("month");
        }

        router.push(`/cihaz-listesi?${params.toString()}`);
    };

    const handleReset = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("month");
        params.delete("startDate");
        params.delete("endDate");
        router.push(`/cihaz-listesi?${params.toString()}`);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-4 bg-card border-border/60 hover:border-blue-500/50 transition-all rounded-xl gap-2 text-[11px]  tracking-widest uppercase">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    TARİH FİLTRESİ
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-card border-border shadow-2xl rounded-2xl" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <h4 className="font-medium text-xs uppercase tracking-widest text-foreground/80">Filtrele</h4>
                        <div className="flex bg-muted p-0.5 rounded-lg">
                            <button
                                onClick={() => setMode("month")}
                                className={`px-3 py-1 text-[10px] rounded-md transition-all ${mode === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                            >Aylık</button>
                            <button
                                onClick={() => setMode("range")}
                                className={`px-3 py-1 text-[10px] rounded-md transition-all ${mode === 'range' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                            >Aralık</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {mode === "month" ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider pl-1">Seçili Ay</label>
                                <input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider pl-1">Başlangıç</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider pl-1">Bitiş</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/60">
                        <Button
                            variant="outline"
                            className="flex-1 h-9 rounded-xl text-[10px] uppercase gap-1"
                            onClick={handleReset}
                        >
                            <X className="h-3 w-3" /> SIFFIRLA
                        </Button>
                        <Button
                            className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase gap-1"
                            onClick={handleApply}
                        >
                            <Filter className="h-3 w-3" /> UYGULA
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
