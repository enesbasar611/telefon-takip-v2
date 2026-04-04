"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpiringWarrantiesModalProps {
    devices: any[];
    count: number;
}

function getRemainingLabel(device: any): { label: string; color: string } {
    const info = device.deviceInfo;
    if (!info) return { label: "—", color: "text-slate-500" };

    if (info.condition === "INTERNATIONAL") {
        const now = new Date();
        const s1End = info.sim1ExpirationDate ? new Date(info.sim1ExpirationDate) : null;
        const s2End = info.sim2ExpirationDate ? new Date(info.sim2ExpirationDate) : null;
        const s2NotUsed = info.sim2NotUsed;

        const s1Days = s1End ? Math.max(0, Math.ceil((s1End.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
        const s2Days = s2End ? Math.max(0, Math.ceil((s2End.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

        if (s1Days > 0 && s1Days <= 30) {
            return { label: `S1: ${s1Days}g kaldı`, color: s1Days <= 7 ? "text-rose-400" : "text-amber-400" };
        }
        if (!s2NotUsed && s2Days > 0 && s2Days <= 30) {
            return { label: `S2: ${s2Days}g kaldı`, color: s2Days <= 7 ? "text-rose-400" : "text-amber-400" };
        }
        return { label: "Süre Bitti", color: "text-rose-500" };
    }

    if (info.warrantyEndDate) {
        const now = new Date();
        const end = new Date(info.warrantyEndDate);
        const remMs = end.getTime() - now.getTime();
        const remDays = Math.ceil(remMs / (1000 * 60 * 60 * 24));
        const color = remDays <= 7 ? "text-rose-400" : remDays <= 15 ? "text-amber-400" : "text-emerald-400";
        return { label: `${remDays} gün garanti`, color };
    }

    return { label: "—", color: "text-slate-500" };
}

export function ExpiringWarrantiesModal({ devices, count }: ExpiringWarrantiesModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="bg-[#121629] p-5 rounded-2xl flex flex-col gap-3 relative border border-slate-800/60 shadow-lg cursor-pointer hover:border-rose-500/40 transition-all group">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="text-[9px] font-black tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase">KRİTİK</div>
                    </div>
                    <div className="mt-2">
                        <h3 className="text-[32px] font-black text-white leading-none">{count}</h3>
                        <p className="text-[11px] text-slate-500 font-bold tracking-wide mt-2">Garanti/Aktiflik Bitmek Üzere</p>
                    </div>
                    {count > 0 && (
                        <div className="text-[9px] font-bold text-rose-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Detayları gör →
                        </div>
                    )}
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-[540px] p-0 bg-[#0B0F19] text-slate-200 border border-slate-800/60 shadow-2xl rounded-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-slate-800/60">
                    <DialogTitle className="text-[18px] font-black text-white">Kritik Garanti / Aktiflik</DialogTitle>
                    <p className="text-[12px] text-slate-500 font-medium mt-0.5">30 gün içinde süresi dolacak cihazlar</p>
                </div>

                <div className="max-h-[440px] overflow-y-auto p-4 space-y-2">
                    {devices.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-sm font-bold">
                            🎉 Garantisi bitmek üzere cihaz yok!
                        </div>
                    ) : devices.map((device: any) => {
                        const { label, color } = getRemainingLabel(device);
                        const conditionMap: Record<string, { text: string; cls: string }> = {
                            NEW: { text: "SIFIR", cls: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
                            USED: { text: "2.EL", cls: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
                            INTERNATIONAL: { text: "YURTDIŞI", cls: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
                        };
                        const cond = conditionMap[device.deviceInfo?.condition] ?? conditionMap.NEW;

                        return (
                            <div key={device.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/60 hover:border-rose-500/30 transition-all">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-white truncate">{device.name}</p>
                                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{device.deviceInfo?.imei ?? "—"}</p>
                                </div>
                                <div className={`text-[9px] font-black tracking-widest border rounded px-2 py-0.5 ${cond.cls}`}>
                                    {cond.text}
                                </div>
                                <div className={`text-[12px] font-black ${color} whitespace-nowrap`}>{label}</div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
