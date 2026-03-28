"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2,
    Wrench,
    User,
    Smartphone,
    Hash,
    Plus,
    Trash2,
    Calculator,
    Save,
    Search,
    Loader2,
    Clock,
    X,
    MessageSquare,
    CreditCard,
    Wallet,
    ShoppingBag,
    XCircle,
    ChevronDown,
    AlertCircle,
    ScanLine,
    Activity,
    Box
} from "lucide-react";
import { ServiceStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, formatPhone } from "@/lib/utils";
import {
    addPartToService,
    removePartFromService,
    updateServicePartPrice,
    updateServiceCost,
    updateServiceStatus,
    getServiceTicketById
} from "@/lib/actions/service-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ServiceManagementModalProps {
    ticket: any;
    isOpen: boolean;
    onClose: () => void;
    isQuickDeliver?: boolean;
}

const statusConfig: Record<ServiceStatus, { label: string; color: string; dot: string; bg: string }> = {
    PENDING: { label: "Beklemede", color: "text-slate-400", dot: "bg-slate-400", bg: "bg-slate-400/10" },
    APPROVED: { label: "Onaylandı", color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-400/10" },
    REPAIRING: { label: "Tamirde", color: "text-amber-400", dot: "bg-amber-400", bg: "bg-amber-400/10" },
    WAITING_PART: { label: "Parça Bekliyor", color: "text-purple-400", dot: "bg-purple-400", bg: "bg-purple-400/10" },
    READY: { label: "Hazır", color: "text-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-400/10" },
    DELIVERED: { label: "Teslim Edildi", color: "text-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-500/10" },
    CANCELLED: { label: "İptal Edildi", color: "text-rose-500", dot: "bg-rose-500", bg: "bg-rose-500/10" },
};

export function ServiceManagementModal({ ticket: initialTicket, isOpen, onClose, isQuickDeliver }: ServiceManagementModalProps) {
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(initialTicket);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [laborCost, setLaborCost] = useState(0);
    const [techNote, setTechNote] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<ServiceStatus | "">(initialTicket?.status || "");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [rates, setRates] = useState({ usd: 1 });

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        const r = await getExchangeRates();
        setRates({ usd: r.usd });
    };

    useEffect(() => {
        if (isOpen && initialTicket) {
            refreshTicket();
        }
    }, [isOpen, initialTicket]);

    const refreshTicket = async () => {
        if (!initialTicket?.id) return;
        const data = await getServiceTicketById(initialTicket.id);
        if (data) {
            setTicket(data);
            setLaborCost(Number(data.actualCost) || Number(data.estimatedCost));
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                const results = await searchProducts(searchQuery);

                const normalizedQuery = normalizeTurkish(searchQuery);
                const filtered = results.filter((p: any) =>
                    normalizeTurkish(p.name).includes(normalizedQuery) ||
                    normalizeTurkish(p.sku || "").includes(normalizedQuery)
                );

                setSearchResults(filtered);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const normalizeTurkish = (str: string) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/İ/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^\w\s]/gi, '');
    };

    const handleAddPart = async (product: any) => {
        setLoading(true);
        try {
            const price = Number(product.sellPrice) || 0;
            const isDollar = product.name?.includes('$') || product.sku?.includes('$');
            const finalPrice = isDollar ? price * rates.usd : price;

            const res = await addPartToService(ticket.id, product.id, 1, finalPrice);
            if (res.success) {
                toast.success("Parça eklendi.");
                setSearchQuery("");
                refreshTicket();
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePart = async (partId: string) => {
        try {
            const res = await removePartFromService(partId);
            if (res.success) {
                toast.success("Parça çıkarıldı.");
                refreshTicket();
                router.refresh();
            }
        } catch (err) {
            toast.error("Hata oluştu.");
        }
    };

    const handleUpdatePartPrice = async (partId: string, price: number) => {
        try {
            await updateServicePartPrice(partId, price);
            refreshTicket();
            router.refresh();
        } catch (err) {
            toast.error("Fiyat güncellenemedi.");
        }
    };

    const handleSaveLabor = async () => {
        try {
            setLoading(true);
            await updateServiceCost(ticket.id, Number(ticket.estimatedCost), laborCost);
            toast.success("İşçilik ücreti güncellendi.");
            refreshTicket();
            router.refresh();
        } catch (err) {
            toast.error("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNoteAndStatus = async () => {
        if (!techNote.trim() && !selectedStatus) return;
        setIsSavingNote(true);
        try {
            const statusToUse = (selectedStatus as ServiceStatus) || ticket.status;
            const messageToUse = techNote.trim() || `Durum güncellendi: ${statusConfig[statusToUse].label}`;
            await updateServiceStatus(ticket.id, statusToUse, "CASH", messageToUse);
            toast.success("Kayıt güncellendi.");
            setTechNote("");
            setSelectedStatus("");
            refreshTicket();
            router.refresh();
        } catch (err) {
            toast.error("Hata oluştu.");
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleStatusUpdate = async (newStatus: ServiceStatus) => {
        setLoading(true);
        try {
            const label = statusConfig[newStatus]?.label || newStatus;
            await updateServiceStatus(ticket.id, newStatus, "CASH", `Durum güncellendi: ${label}`);
            toast.success(`Durum: ${label}`);
            refreshTicket();
            router.refresh();
        } catch (err) {
            toast.error("Güncelleme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) return null;

    const partsTotal = ticket.usedParts?.reduce((acc: number, p: any) => acc + (Number(p.unitPrice) * p.quantity), 0) || 0;
    const vat = (partsTotal + laborCost) * 0.20;
    const grandTotal = partsTotal + laborCost + vat;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[98vw] w-[1400px] h-[95vh] bg-[#020617] border-white/5 p-0 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                {/* Header Section */}
                <div className="relative h-24 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 shrink-0 z-50">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-bold text-blue-500">Servis Kaydı</span>
                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-xs font-medium text-slate-500">#{ticket.ticketNumber}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                {ticket.deviceBrand} <span className="text-blue-500">{ticket.deviceModel}</span>
                            </h2>
                        </div>
                        <div className={cn(
                            "px-6 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 transition-all",
                            statusConfig[ticket.status as ServiceStatus]?.bg
                        )}>
                            <div className={cn("h-3 w-3 rounded-full shadow-[0_0_15px_currentColor]", statusConfig[ticket.status as ServiceStatus]?.dot)} />
                            <span className={cn("text-xs font-bold", statusConfig[ticket.status as ServiceStatus]?.color)}>
                                {statusConfig[ticket.status as ServiceStatus]?.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isQuickDeliver && ticket.status !== "READY" && ticket.status !== "DELIVERED" && (
                            <Button
                                onClick={() => handleStatusUpdate("READY")}
                                className="h-12 bg-white text-black hover:bg-white/90 font-bold text-xs px-8 rounded-2xl gap-3 shadow-2xl transition-all active:scale-95"
                            >
                                <CheckCircle2 className="h-5 w-5" /> Servisi Tamamla
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="h-12 w-12 rounded-2xl hover:bg-white/5 text-slate-400"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden p-6 gap-6 bg-gradient-to-br from-slate-950 to-[#020617]">

                    {/* Left Column: Device & History */}
                    <div className="w-[380px] flex flex-col gap-6 overflow-hidden">

                        {/* Device Info Card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 space-y-8 flex flex-col shrink-0">
                            <div className="flex items-center gap-3 mb-2">
                                <ScanLine className="h-4 w-4 text-blue-500" />
                                <h3 className="text-xs font-bold text-slate-500">Cihaz Bilgileri</h3>
                            </div>

                            <div className="grid gap-6">
                                <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Smartphone className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Model & Marka</p>
                                        <p className="text-sm font-bold text-slate-100 truncate">{ticket.deviceBrand} {ticket.deviceModel}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <User className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Müşteri & İletişim</p>
                                        <p className="text-sm font-bold text-blue-400 truncate">{ticket.customer?.name}</p>
                                        <p className="text-xs font-bold text-emerald-500 mt-0.5">{formatPhone(ticket.customer?.phone)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-500/10 flex items-center justify-center shrink-0">
                                        <Hash className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-500 mb-1">IMEI / Seri No</p>
                                        <p className="text-sm font-medium text-slate-300 truncate">{ticket.imei || "Belirtilmemiş"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Problem Description */}
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] p-8 shrink-0">
                            <div className="flex items-center gap-3 mb-6">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <h3 className="text-xs font-bold text-amber-500/80">Arıza Detayı</h3>
                            </div>
                            <p className="text-[13px] text-amber-200/80 font-medium leading-relaxed">
                                {ticket.problemDesc}
                            </p>
                        </div>

                        {/* Timeline / History */}
                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-slate-500" />
                                    <h3 className="text-xs font-bold text-slate-500">Servis Günlüğü</h3>
                                </div>
                                <span className="text-xs font-bold text-slate-700">{ticket.logs?.length || 0} Kayıt</span>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2">
                                {ticket.logs?.map((log: any, i: number) => (
                                    <div key={log.id} className="relative pl-8 group">
                                        <div className={cn(
                                            "absolute left-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-slate-950 z-10 transition-all",
                                            i === 0 ? "bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-800"
                                        )} />
                                        {i !== ticket.logs.length - 1 && (
                                            <div className="absolute left-[12px] top-4 bottom-[-24px] w-px bg-white/5" />
                                        )}
                                        <div className="flex flex-col gap-1 px-2 py-1 rounded-xl group-hover:bg-white/[0.02] transition-colors">
                                            <p className={cn("text-xs font-bold leading-tight", i === 0 ? "text-slate-200" : "text-slate-500")}>
                                                {log.message}
                                            </p>
                                            <span className="text-xs font-medium text-slate-700">
                                                {format(new Date(log.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Actions, Parts & Financials */}
                    <div className="flex-1 flex flex-col gap-6 min-w-0">

                        {/* Unified Management Panel */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[3rem] p-10 flex flex-col gap-10">

                            <div className="grid grid-cols-2 gap-10">
                                {/* Part Selector */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <Box className="h-4 w-4 text-blue-500" />
                                        <h3 className="text-xs font-bold text-slate-500">Parça Ekle</h3>
                                    </div>
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder="Ürün adı veya SKU ile ara..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-16 bg-slate-950 border-white/5 pl-14 pr-8 rounded-3xl text-sm font-medium focus:border-blue-500/30 transition-all placeholder:text-slate-800"
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl z-[100] max-h-80 overflow-y-auto overflow-x-hidden p-2 backdrop-blur-3xl">
                                                {searchResults.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleAddPart(p)}
                                                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 rounded-2xl transition-all group/item"
                                                    >
                                                        <div className="flex flex-col text-left">
                                                            <span className="text-sm font-bold text-white group-hover/item:text-blue-400 transition-colors">{p.name}</span>
                                                            <span className="text-xs text-slate-500 font-medium">{p.sku}</span>
                                                        </div>
                                                        <div className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold">
                                                            ₺{(() => {
                                                                const price = Number(p.sellPrice) || 0;
                                                                const isDollar = p.name?.includes('$') || p.sku?.includes('$');
                                                                const finalPrice = isDollar ? price * rates.usd : price;
                                                                return (
                                                                    <div className="flex items-center gap-1">
                                                                        {isDollar && <span className="opacity-50 text-[8px]">$</span>}
                                                                        {finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Switcher */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-2">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-4 w-4 text-emerald-500" />
                                            <h3 className="text-xs font-bold text-slate-500">Durum Güncelle</h3>
                                        </div>
                                        {selectedStatus && selectedStatus === ticket.status && (
                                            <div className="flex items-center gap-2 bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20 animate-pulse">
                                                <XCircle className="h-4 w-4 text-rose-500" />
                                                <span className="text-[10px] font-bold text-rose-500">Cihaz Zaten Bu Durumda</span>
                                            </div>
                                        )}
                                    </div>
                                    <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as ServiceStatus)}>
                                        <SelectTrigger className="h-16 bg-slate-950 border-white/5 rounded-3xl text-sm font-bold text-slate-300 focus:ring-0">
                                            <SelectValue placeholder="Yeni durumu belirleyin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950 border-white/10 text-white rounded-3xl p-2 z-[100] shadow-2xl">
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <SelectItem key={key} value={key} className="text-xs font-bold py-4 focus:bg-white/5 rounded-2xl transition-all cursor-pointer">
                                                    <div className="flex items-center gap-4 px-2">
                                                        <div className={cn("h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]", config.dot)} />
                                                        <span>{config.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Technical Note Input */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="h-4 w-4 text-purple-500" />
                                        <h3 className="text-xs font-bold text-slate-500">İşlem Notu Ekle</h3>
                                    </div>
                                    {(techNote.trim() || (selectedStatus && selectedStatus !== ticket.status)) && (
                                        <Button
                                            onClick={handleSaveNoteAndStatus}
                                            disabled={isSavingNote || (selectedStatus === ticket.status)}
                                            className="h-10 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                        >
                                            {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
                                        </Button>
                                    )}
                                </div>
                                <Textarea
                                    placeholder="Yapılan işlemler hakkında detaylı teknik not giriniz..."
                                    value={techNote}
                                    onChange={(e) => setTechNote(e.target.value)}
                                    className="h-24 bg-slate-950 border-white/5 rounded-[2rem] p-6 text-sm font-medium focus:border-blue-500/30 transition-all resize-none placeholder:text-slate-800"
                                />
                            </div>
                        </div>

                        {/* Parts List Scroll Area */}
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag className="h-4 w-4 text-slate-500" />
                                    <h3 className="text-xs font-bold text-slate-500">Kullanılan Parçalar</h3>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-500/10 px-5 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <span className="text-sm font-bold text-emerald-500">₺{partsTotal.toLocaleString('tr-TR')}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-3">
                                {ticket.usedParts?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                                        <Box className="h-16 w-16 mb-4 text-slate-500" />
                                        <p className="text-sm font-bold">Henüz parça kaydı yok</p>
                                    </div>
                                ) : (
                                    ticket.usedParts?.map((p: any) => (
                                        <div key={p.id} className="flex items-center gap-6 p-6 rounded-[2rem] bg-slate-950/40 border border-white/[0.03] group hover:border-blue-500/20 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-200 truncate">{p.product?.name}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-1">{p.product?.sku}</p>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-center px-5 py-2 rounded-xl bg-white/5 border border-white/5">
                                                    <span className="text-xs font-bold text-slate-400">{p.quantity} Adet</span>
                                                </div>
                                                <div className="relative w-36">
                                                    <Input
                                                        type="number"
                                                        defaultValue={Number(p.unitPrice)}
                                                        onBlur={(e) => handleUpdatePartPrice(p.id, Number(e.target.value))}
                                                        className="h-12 bg-slate-950 border-white/5 text-right font-bold text-sm text-emerald-500 rounded-2xl pr-5 pl-10 focus:border-emerald-500/30 transition-all tabular-nums"
                                                    />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500/40">₺</span>
                                                </div>
                                                <Button
                                                    onClick={() => handleRemovePart(p.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-12 w-12 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Financial Summary & Checkout */}
                        <div className="bg-blue-600 border border-blue-500/20 rounded-[3.5rem] p-1.5 overflow-hidden shadow-[0_30px_60px_rgba(59,130,246,0.2)]">
                            <div className="bg-slate-950 rounded-[3.3rem] p-10 flex items-center justify-between gap-12">
                                <div className="flex items-center gap-12">
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-slate-500">İşçilik Ücreti</span>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-lg">₺</span>
                                            <Input
                                                type="number"
                                                value={laborCost}
                                                onChange={(e) => setLaborCost(Number(e.target.value))}
                                                onBlur={handleSaveLabor}
                                                className="h-14 w-44 bg-white/5 border-transparent rounded-2xl pl-12 pr-5 text-xl font-bold text-emerald-500 focus:bg-white/10 transition-all tabular-nums"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-16 w-px bg-white/5" />

                                    <div className="flex flex-col gap-1 items-end">
                                        <span className="text-xs font-bold text-blue-500 mb-1">Genel Toplam (KDV Dahil)</span>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-2xl font-bold text-slate-600">₺</span>
                                            <h4 className="text-5xl font-bold text-white tabular-nums">
                                                {grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    {ticket.status !== "READY" && ticket.status !== "DELIVERED" ? (
                                        <div className="flex items-center gap-5 px-10 py-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 backdrop-blur-md">
                                            <AlertCircle className="h-6 w-6 text-blue-500 animate-pulse" />
                                            <p className="text-xs font-bold text-blue-400 leading-snug max-w-[280px]">
                                                * Tahsilat yapmak için lütfen servisi tamamla butonuna basınız ve cihazı hazır kategorisine aktarınız.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-5">
                                            <Button
                                                onClick={() => handleStatusUpdate("DELIVERED")}
                                                className="h-20 px-12 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-3xl gap-4 shadow-2xl shadow-emerald-500/20 transition-all active:scale-95"
                                            >
                                                <CreditCard className="h-6 w-6" /> Tahsilat Yap ve Teslim Et
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-20 px-10 bg-transparent border-white/10 hover:bg-white/5 text-white font-bold text-sm rounded-3xl gap-4 transition-all"
                                            >
                                                <Wallet className="h-6 w-6 text-amber-500" /> Veresiye Kaydet
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
