"use client";

import { Label } from "@/components/ui/label";
import { useState, useMemo, useEffect } from "react";
import { Search, MonitorSmartphone, Coins, Smartphone, Zap, TrendingUp, BadgeCheck, RotateCcw, Globe, Wallet, CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getDeviceList } from "@/lib/actions/device-hub-actions";
import { getColorHex } from "@/lib/device-utils";
import { DeviceActionsColumn } from "./device-actions-column";
import { Badge } from "@/components/ui/badge";
import { DeviceReceiptModal } from "./device-receipt-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface DeviceListClientProps {
    initialDevices: any[];
    initialDeviceId?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
}

function DeviceListSkeleton() {
    return (
        <div className="flex min-h-[400px] flex-col divide-y divide-slate-800/40">
            {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="grid min-h-[88px] grid-cols-12 gap-4 p-5">
                    <div className="col-span-3 flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-36 rounded-lg" />
                            <Skeleton className="h-3 w-20 rounded-lg" />
                        </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                        <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                        <Skeleton className="h-5 w-28 rounded-lg" />
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                        <Skeleton className="h-9 w-24 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DeviceListClient({ initialDevices, initialDeviceId, month, startDate, endDate }: DeviceListClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [brandFilter, setBrandFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [warrantyFilter, setWarrantyFilter] = useState("all");
    const [activeTab, setActiveTab] = useState<"STOCK" | "SOLD">("STOCK");
    const [autoOpenDevice, setAutoOpenDevice] = useState<any>(null);
    const { data: devices = initialDevices, isPending, isFetching } = useQuery<any[]>({
        queryKey: ["devices", { month, startDate, endDate }],
        queryFn: () => getDeviceList({ month, startDate, endDate }),
        initialData: initialDevices,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Auto-open modal if deviceId is in URL
    useEffect(() => {
        if (initialDeviceId) {
            const device = devices.find((d: any) => d.id === initialDeviceId);
            if (device) {
                if (device.stock === 0) setActiveTab("SOLD");
                // Small delay to ensure modal logic initializes correctly if needed
                setTimeout(() => setAutoOpenDevice(device), 300);
            }
        }
    }, [initialDeviceId, devices]);

    const filteredDevices = useMemo(() => {
        return devices.filter((device: any) => {
            // Tab Filter
            const isStock = device.stock > 0;
            if (activeTab === "STOCK" && !isStock) return false;
            if (activeTab === "SOLD" && isStock) return false;

            // Search
            const searchTermLower = searchTerm.toLowerCase();
            const searchMatch =
                searchTerm === "" ||
                device.name.toLowerCase().includes(searchTermLower) ||
                device.deviceInfo?.imei?.includes(searchTerm) ||
                device.sale?.customer?.name?.toLowerCase().includes(searchTermLower);

            // Brand
            const brandMatch = brandFilter === "all" || device.brand?.toLowerCase() === brandFilter.toLowerCase();

            // Type (Condition)
            const typeMatch = typeFilter === "all" || device.deviceInfo?.condition === typeFilter;

            // Warranty logic only for Stock
            let warrantyMatch = true;
            if (activeTab === "STOCK" && warrantyFilter !== "all") {
                if (warrantyFilter === "active") {
                    const isNew = device.deviceInfo?.condition === "NEW";
                    const hasRemaining = device.deviceInfo?.warrantyEndDate ? new Date(device.deviceInfo.warrantyEndDate) > new Date() : false;
                    warrantyMatch = isNew || hasRemaining;
                } else if (warrantyFilter === "expiring") {
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
    }, [devices, searchTerm, brandFilter, typeFilter, warrantyFilter, activeTab]);

    return (
        <div className="flex flex-col gap-6">
            {/* Tab Selector */}
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border/60 self-start w-full md:w-auto overflow-x-auto scrollbar-none">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("STOCK")}
                        className={`flex-1 md:flex-none rounded-xl px-4 md:px-8 h-11 text-[11px] md:text-xs transition-all whitespace-nowrap ${activeTab === "STOCK" ? "bg-blue-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                        MEVCUT STOK ({devices.filter((d: any) => d.stock > 0).length})
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("SOLD")}
                        className={`flex-1 md:flex-none rounded-xl px-4 md:px-8 h-11 text-[11px] md:text-xs transition-all whitespace-nowrap ${activeTab === "SOLD" ? "bg-emerald-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                        SATILANLAR ({devices.filter((d: any) => d.stock === 0).length})
                    </Button>
                </div>
                {isFetching && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50 text-muted-foreground mr-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-[10px] uppercase font-medium tracking-wide hidden md:inline">Güncelleniyor</span>
                    </div>
                )}
            </div>

            <div className="bg-card border-y md:border border-border/60 md:rounded-2xl shadow-xl overflow-hidden flex flex-col">
                {/* Filters Row */}
                <div className="p-4 md:p-5 border-b border-border/60 flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-5 md:items-end">
                    <div className="md:col-span-4 space-y-1.5 order-1">
                        <Label className="font-medium text-[10px] text-muted-foreground/80 uppercase tracking-widest px-1">ARA</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
                            <Input
                                placeholder={activeTab === "STOCK" ? "Model veya IMEI No..." : "Müşteri veya Model..."}
                                className="h-11 pl-9 bg-background/50 border-border rounded-xl text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3 space-y-1.5 order-2">
                        <Label className="font-medium text-[10px] text-muted-foreground/80 uppercase tracking-widest px-1">MARKA</Label>
                        <Select value={brandFilter} onValueChange={setBrandFilter}>
                            <SelectTrigger className="h-11 bg-background/50 border-border rounded-xl text-sm font-medium">
                                <SelectValue placeholder="Tümü" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="all">Tüm Markalar</SelectItem>
                                {["Apple", "Samsung", "Xiaomi", "Huawei", "Google", "Oppo", "Realme"].map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2 space-y-1.5 order-4 md:order-3">
                        <Label className="font-medium text-[10px] text-muted-foreground/80 uppercase tracking-widest px-1">TİP</Label>
                        <div className="flex items-center bg-background/50 rounded-xl p-1 border border-border h-11 overflow-x-auto scrollbar-none">
                            <button
                                onClick={() => setTypeFilter("all")}
                                className={`flex-1 min-w-[50px] h-full text-[10px] uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground/80 hover:text-foreground"}`}
                            >
                                Tümü
                            </button>
                            <button
                                onClick={() => setTypeFilter("NEW")}
                                className={`flex-1 min-w-[50px] h-full text-[10px] uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "NEW" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground/80 hover:text-foreground"}`}
                            >
                                Sıfır
                            </button>
                            <button
                                onClick={() => setTypeFilter("USED")}
                                className={`flex-1 min-w-[50px] h-full text-[10px] uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "USED" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground/80 hover:text-foreground"}`}
                            >
                                2.El
                            </button>
                            <button
                                onClick={() => setTypeFilter("INTERNATIONAL")}
                                className={`flex-1 min-w-[50px] h-full text-[10px] uppercase tracking-tighter rounded-lg transition-all ${typeFilter === "INTERNATIONAL" ? "bg-purple-500 text-white shadow-sm" : "text-muted-foreground/80 hover:text-foreground"}`}
                            >
                                Y.Dışı
                            </button>
                        </div>
                    </div>
                    {activeTab === "STOCK" && (
                        <div className="md:col-span-3 space-y-1.5 order-3 md:order-4">
                            <Label className="font-medium text-[10px] text-muted-foreground/80 uppercase tracking-widest px-1">GARANTİ DURUMU</Label>
                            <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                                <SelectTrigger className="h-11 bg-background/50 border-border rounded-xl text-sm font-medium">
                                    <SelectValue placeholder="Tüm Durumlar" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                                    <SelectItem value="active" className="text-emerald-400">Devam Edenler</SelectItem>
                                    <SelectItem value="expiring" className="text-amber-400">Bitmek Üzere (30G)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border/60 items-center">
                    <div className="col-span-3 text-[10px] text-muted-foreground/80 uppercase tracking-widest">MARKA & MODEL</div>
                    <div className="col-span-1 text-[10px] text-muted-foreground/80 uppercase tracking-widest">RENK</div>
                    <div className="col-span-2 text-[10px] text-muted-foreground/80 uppercase tracking-widest">{activeTab === "STOCK" ? "IMEI" : "MÜŞTERİ"}</div>
                    <div className="col-span-1 text-[10px] text-muted-foreground/80 uppercase tracking-widest text-center">DURUM</div>
                    <div className="col-span-1 text-[10px] text-muted-foreground/80 uppercase tracking-widest text-center">PİL</div>
                    <div className="col-span-2 text-[10px] text-muted-foreground/80 uppercase tracking-widest text-right">FİYAT</div>
                    <div className="col-span-2 text-right text-[10px] text-muted-foreground/80 uppercase tracking-widest">AKSİYON</div>
                </div>

                {/* Table Content */}
                {isPending && (!devices || devices.length === 0) ? (
                    <DeviceListSkeleton />
                ) : (
                    <div className="flex flex-col divide-y divide-slate-800/40 min-h-[400px]">
                        {filteredDevices.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center opacity-60">
                                <MonitorSmartphone className="h-12 w-12 text-slate-600 mb-4" />
                                <p className="text-sm text-muted-foreground uppercase tracking-widest">SONUÇ BULUNAMADI</p>
                            </div>
                        ) : (
                            filteredDevices.map((device: any) => (
                                <div key={device.id} className="group relative">
                                    {/* Desktop Row */}
                                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 p-5 items-center hover:bg-muted/20 transition-all">
                                        <div className="flex items-center gap-4 md:col-span-3 min-w-0">
                                            <div className="relative h-12 md:w-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center shrink-0 text-foreground">
                                                {device.name.slice(0, 2).toUpperCase()}
                                                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: getColorHex(device.brand, device.deviceInfo?.color) || "transparent" }} />
                                            </div>
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="text-[14px] text-foreground font-medium truncate">{device.name}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">{device.deviceInfo?.storage || "-"}</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-1">
                                            <span className="text-[11px] text-muted-foreground">{device.deviceInfo?.color || "-"}</span>
                                        </div>

                                        <div className="md:col-span-2">
                                            {activeTab === "STOCK" ? (
                                                <span className="text-[11px] text-slate-500 font-mono tracking-tighter">*{device.deviceInfo?.imei?.slice(-6) || "-"}</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] text-blue-400 font-medium truncate">{device.sale?.customer?.name || "HIZLI SATIŞ"}</span>
                                                    <span className="text-[9px] text-slate-500">{new Date(device.sale?.createdAt).toLocaleDateString("tr-TR")}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-1 flex justify-center">
                                            <Badge className={`text-[9px] ${device.deviceInfo?.condition === "NEW" ? "bg-emerald-500/10 text-emerald-500 border-none" :
                                                device.deviceInfo?.condition === "INTERNATIONAL" ? "bg-purple-500/10 text-purple-500 border-none" :
                                                    "bg-amber-500/10 text-amber-500 border-none"
                                                }`}>
                                                {device.deviceInfo?.condition === "NEW" ? "SIFIR" :
                                                    device.deviceInfo?.condition === "INTERNATIONAL" ? "Y.DIŞI" : "2.EL"}
                                            </Badge>
                                        </div>

                                        <div className="md:col-span-1 text-center">
                                            <span className={`text-[11px] ${!device.deviceInfo?.batteryHealth || device.deviceInfo?.batteryHealth >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                                                {device.deviceInfo?.batteryHealth ? `%${device.deviceInfo.batteryHealth}` : "—"}
                                            </span>
                                        </div>

                                        <div className="md:col-span-2 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-foreground font-medium">{Number(device.sellPrice).toLocaleString("tr-TR")} ₺</span>
                                                <span className="text-[9px] text-muted-foreground uppercase">ALIŞ: {Number(device.buyPrice).toLocaleString("tr-TR")} ₺</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 flex justify-end items-center gap-2">
                                            <DeviceActionsColumn productId={device.id} deviceName={device.name} device={device} />
                                        </div>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden p-4 flex flex-col gap-4 bg-background/40 hover:bg-muted/10 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-11 w-11 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0 text-foreground font-bold">
                                                    {device.name.slice(0, 2).toUpperCase()}
                                                    <div className="absolute inset-0 opacity-10 rounded-xl" style={{ backgroundColor: getColorHex(device.brand, device.deviceInfo?.color) || "transparent" }} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-semibold text-foreground line-clamp-1">{device.name}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-muted-foreground uppercase">{device.deviceInfo?.storage || "-"}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="text-[10px] text-muted-foreground">{device.deviceInfo?.color || "-"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={`text-[8px] h-5 ${device.deviceInfo?.condition === "NEW" ? "bg-emerald-500/10 text-emerald-500 border-none" :
                                                device.deviceInfo?.condition === "INTERNATIONAL" ? "bg-purple-500/10 text-purple-500 border-none" :
                                                    "bg-amber-500/10 text-amber-500 border-none"
                                                }`}>
                                                {device.deviceInfo?.condition === "NEW" ? "SIFIR" :
                                                    device.deviceInfo?.condition === "INTERNATIONAL" ? "Y.DIŞI" : "2.EL"}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between bg-muted/20 p-2.5 rounded-xl border border-border/40">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                    {activeTab === "STOCK" ? "IMEI / SERİ NO" : "MÜŞTERİ"}
                                                </span>
                                                {activeTab === "STOCK" ? (
                                                    <span className="text-[11px] font-mono text-foreground">
                                                        {device.deviceInfo?.imei ? `*${device.deviceInfo.imei.slice(-6)}` : "-"}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-medium text-blue-500">
                                                        {device.sale?.customer?.name || "HIZLI SATIŞ"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">SATIŞ FİYATI</span>
                                                <span className="text-[15px] font-bold text-foreground">
                                                    {Number(device.sellPrice).toLocaleString("tr-TR")} ₺
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-muted-foreground uppercase">PİL SAĞLIĞI</span>
                                                    <span className={`text-[11px] font-medium ${!device.deviceInfo?.batteryHealth || device.deviceInfo?.batteryHealth >= 90 ? "text-emerald-500" : "text-amber-500"}`}>
                                                        {device.deviceInfo?.batteryHealth ? `%${device.deviceInfo.batteryHealth}` : "—"}
                                                    </span>
                                                </div>
                                                {activeTab === "STOCK" && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-muted-foreground uppercase">ALIŞ FİYATI</span>
                                                        <span className="text-[11px] font-medium text-muted-foreground/80">
                                                            {Number(device.buyPrice).toLocaleString("tr-TR")} ₺
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <DeviceActionsColumn productId={device.id} deviceName={device.name} device={device} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Post-Sale Auto-Open Handler */}
            {autoOpenDevice && (
                <DeviceReceiptModal
                    device={autoOpenDevice}
                    defaultOpen={true}
                    onClose={() => setAutoOpenDevice(null)}
                />
            )}
        </div>
    );
}






