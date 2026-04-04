"use client";

import { useState, useMemo } from "react";
import { Search, MonitorSmartphone, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getColorHex } from "@/lib/device-utils";
import { DeviceActionsColumn } from "./device-actions-column";
import { Badge } from "@/components/ui/badge";

interface DeviceListClientProps {
    initialDevices: any[];
}

export function DeviceListClient({ initialDevices }: DeviceListClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [brandFilter, setBrandFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [warrantyFilter, setWarrantyFilter] = useState("all");

    const filteredDevices = useMemo(() => {
        return initialDevices.filter((device) => {
            // Search
            const searchMatch =
                searchTerm === "" ||
                device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.deviceInfo?.imei?.includes(searchTerm);

            // Brand
            const brandMatch = brandFilter === "all" || device.brand?.toLowerCase() === brandFilter.toLowerCase();

            // Type (Condition)
            const typeMatch = typeFilter === "all" || device.deviceInfo?.condition === typeFilter;

            // Warranty (Mock logic for now, can be expanded)
            let warrantyMatch = true;
            if (warrantyFilter !== "all") {
                if (warrantyFilter === "active") {
                    // If NEW (always active) or has remaining days
                    const isNew = device.deviceInfo?.condition === "NEW";
                    const hasRemaining = device.deviceInfo?.warrantyEndDate ? new Date(device.deviceInfo.warrantyEndDate) > new Date() : false;
                    warrantyMatch = isNew || hasRemaining;
                } else if (warrantyFilter === "expiring") {
                    // Less than 30 days
                    if (device.deviceInfo?.warrantyEndDate) {
                        const days = Math.ceil((new Date(device.deviceInfo.warrantyEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        warrantyMatch = days > 0 && days < 30;
                    } else {
                        warrantyMatch = false;
                    }
                }
            }

            return searchMatch && brandMatch && typeMatch && warrantyMatch;
        });
    }, [initialDevices, searchTerm, brandFilter, typeFilter, warrantyFilter]);

    return (
        <div className="bg-[#121629] border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="p-5 border-b border-slate-800/60 grid grid-cols-12 gap-5 items-end">
                <div className="col-span-12 lg:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">HIZLI ARAMA</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Model veya IMEI No..."
                            className="h-11 pl-9 bg-slate-950/50 border-slate-800 rounded-xl text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">MARKA</label>
                    <Select value={brandFilter} onValueChange={setBrandFilter}>
                        <SelectTrigger className="h-11 bg-slate-950/50 border-slate-800 rounded-xl text-sm font-medium">
                            <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="all" className="font-bold">Tüm Markalar</SelectItem>
                            {["Apple", "Samsung", "Xiaomi", "Huawei", "Google", "Oppo", "Realme"].map((b) => (
                                <SelectItem key={b} value={b} className="font-bold">{b}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-12 lg:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">TİP</label>
                    <div className="flex items-center bg-slate-950/50 rounded-xl p-1 border border-slate-800 overflow-hidden h-11">
                        <button
                            onClick={() => setTypeFilter("all")}
                            className={`flex-1 h-full text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "all" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setTypeFilter("NEW")}
                            className={`flex-1 h-full text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "NEW" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Sıfır
                        </button>
                        <button
                            onClick={() => setTypeFilter("USED")}
                            className={`flex-1 h-full text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "USED" ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            2.El
                        </button>
                        <button
                            onClick={() => setTypeFilter("INTERNATIONAL")}
                            className={`flex-1 h-full text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "INTERNATIONAL" ? "bg-purple-500/20 text-purple-400" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Y.Dışı
                        </button>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">GARANTİ DURUMU</label>
                    <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                        <SelectTrigger className="h-11 bg-slate-950/50 border-slate-800 rounded-xl text-sm font-medium">
                            <SelectValue placeholder="Tüm Durumlar" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="all" className="font-bold">Tüm Durumlar</SelectItem>
                            <SelectItem value="active" className="font-bold text-emerald-400">Devam Edenler</SelectItem>
                            <SelectItem value="expiring" className="font-bold text-amber-400">Bitmek Üzere (30G)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table Head */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#121629]/50 border-b border-slate-800/60 items-center">
                <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">MARKA & MODEL</div>
                <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">RENK</div>
                <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">IMEI</div>
                <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">DURUM</div>
                <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">PİL</div>
                <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">GARANTİ / AKTİFLİK</div>
                <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">FİYAT</div>
                <div className="col-span-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">AKSİYON</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col divide-y divide-slate-800/40 min-h-[400px]">
                {filteredDevices.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center opacity-60">
                        <MonitorSmartphone className="h-12 w-12 text-slate-600 mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">SONUÇ BULUNAMADI</p>
                    </div>
                ) : (
                    filteredDevices.map((device: any) => {
                        const cond = device.deviceInfo?.condition;
                        const isNew = cond === "NEW";
                        const isUsed = cond === "USED";
                        const isIntl = cond === "INTERNATIONAL";

                        let warrantyLabel = "24 Ay Garanti";
                        let warrantyPct = 100;
                        let warrantyColor = "bg-emerald-500";

                        if (!isNew && device.deviceInfo?.warrantyEndDate) {
                            const remaining = Math.max(0, new Date(device.deviceInfo.warrantyEndDate).getTime() - new Date().getTime());
                            const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                            warrantyPct = Math.min(100, (daysLeft / (30 * 12)) * 100);
                            warrantyLabel = `${daysLeft} Gün Kaldı`;
                            warrantyColor = daysLeft < 30 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : daysLeft < 90 ? "bg-amber-500" : "bg-emerald-500";
                        } else if (isNew) {
                            warrantyLabel = "24 Ay — Satışla Başlar";
                            warrantyPct = 100;
                            warrantyColor = "bg-emerald-500/40";
                        }

                        if (isIntl) {
                            const s1End = device.deviceInfo.sim1ExpirationDate ? new Date(device.deviceInfo.sim1ExpirationDate) : null;
                            if (device.deviceInfo.sim1NotUsed) {
                                warrantyLabel = "SIM 1: Kullanılmadı";
                                warrantyColor = "bg-blue-500";
                            } else if (s1End) {
                                const days = Math.ceil((s1End.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                warrantyLabel = `SIM 1: ${days > 0 ? days : 0} Gün`;
                                warrantyColor = days < 15 ? "bg-rose-500" : "bg-emerald-500";
                            }
                        }

                        return (
                            <div key={device.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-800/20 transition-all group">
                                {/* Product Detail Group */}
                                <div className="col-span-3 flex items-center gap-4">
                                    <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden shadow-inner font-black text-slate-700 text-[8px]">
                                        {device.name.slice(0, 2).toUpperCase()}
                                        <div
                                            className="absolute inset-0 opacity-20"
                                            style={{ backgroundColor: getColorHex(device.brand, device.deviceInfo?.color) || "transparent" }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[13px] font-black text-white group-hover:text-blue-400 transition-colors uppercase truncate max-w-[180px]">{device.name}</span>
                                        <span className="text-[10px] text-slate-600 font-bold leading-none tracking-tighter truncate">
                                            {device.deviceInfo?.ram ? `${device.deviceInfo.ram} RAM / ` : ""}{device.deviceInfo?.capacity} / {device.deviceInfo?.storage}
                                        </span>
                                    </div>
                                </div>

                                {/* Color */}
                                <div className="col-span-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full border border-slate-700 shadow-sm shrink-0"
                                            style={{ backgroundColor: getColorHex(device.brand, device.deviceInfo?.color) || "#334155" }}
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 capitalize truncate">{device.deviceInfo?.color || "-"}</span>
                                    </div>
                                </div>

                                {/* IMEI */}
                                <div className="col-span-1">
                                    <span className="text-[10px] text-slate-400 font-bold tracking-tight opacity-70">*{device.deviceInfo?.imei?.slice(-6) || "-"}</span>
                                </div>

                                {/* Condition */}
                                <div className="col-span-1 flex justify-center">
                                    <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isNew ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : isUsed ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}`}>
                                        {isNew ? "SIFIR" : isUsed ? "2.EL" : "Y.DIŞI"}
                                    </Badge>
                                </div>

                                {/* Battery */}
                                <div className="col-span-1 text-center">
                                    <span className={`text-[11px] font-black ${!device.deviceInfo?.batteryHealth || device.deviceInfo?.batteryHealth >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                                        {device.deviceInfo?.batteryHealth ? `%${device.deviceInfo.batteryHealth}` : "—"}
                                    </span>
                                </div>

                                {/* Warranty Bar */}
                                <div className="col-span-2 pl-4">
                                    <div className="flex flex-col gap-1.5 pt-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{warrantyLabel}</span>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                                            <div className={`h-full transition-all duration-1000 ${warrantyColor}`} style={{ width: `${warrantyPct}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="col-span-1 text-right">
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-white">{Number(device.sellPrice).toLocaleString("tr-TR")} ₺</span>
                                        <span className="text-[9px] font-black text-slate-600">ALIŞ: {Number(device.buyPrice).toLocaleString("tr-TR")} ₺</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 text-right">
                                    <DeviceActionsColumn productId={device.id} deviceName={device.name} device={device} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
