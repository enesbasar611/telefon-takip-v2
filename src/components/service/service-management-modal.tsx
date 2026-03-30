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
    MessageCircle,
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
import Link from "next/link";
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
                    normalizeTurkish(p.sku || "").includes(normalizedQuery) ||
                    (p.category?.name && normalizeTurkish(p.category.name).includes(normalizedQuery))
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
        const alreadyExists = ticket.usedParts?.some((p: any) => p.productId === product.id);
        if (alreadyExists) {
            const confirmed = window.confirm("Aynı parçayı ekliyorsunuz, devam edilsin mi?");
            if (!confirmed) return;
        }

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

    const handleStatusUpdate = async (newStatus: ServiceStatus, paymentMethod: string = "CASH") => {
        setLoading(true);
        try {
            const label = statusConfig[newStatus]?.label || newStatus;
            await updateServiceStatus(ticket.id, newStatus, paymentMethod, `Durum güncellendi: ${label}`);
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
    const grandTotal = partsTotal + laborCost;

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
                <div className="flex-1 grid grid-cols-[300px_1fr_380px] overflow-hidden p-6 gap-6 bg-[#020617]">

                    {/* Left Column: Client & Device (Slim) */}
                    <div className="w-[300px] flex flex-col gap-4 overflow-hidden shrink-0">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ScanLine className="h-3.5 w-3.5 text-blue-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Müşteri & Cihaz</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cihaz</p>
                                    <p className="text-sm font-bold text-white leading-tight">{ticket.deviceBrand} {ticket.deviceModel}</p>
                                    <p className="text-xs text-slate-600 mt-1 font-medium italic">{ticket.imei || "IMEI Yok"}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-emerald-500/50 uppercase mb-1">Müşteri</p>
                                        <p className="text-sm font-bold text-emerald-400 truncate">{ticket.customer?.name}</p>
                                        <p className="text-xs font-bold text-emerald-600 mt-0.5">{formatPhone(ticket.customer?.phone)}</p>
                                    </div>
                                    <Link href={`https://wa.me/${ticket.customer?.phone?.replace(/\s+/g, '')}`} target="_blank">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2rem] p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Arıza Detayı</h3>
                            </div>
                            <p className="text-xs text-amber-200/70 font-medium leading-relaxed italic">
                                "{ticket.problemDesc}"
                            </p>
                        </div>
                    </div>

                    {/* Middle Column: Parts & Actions */}
                    <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-hidden">
                        {/* Action Panel */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-8 shrink-0">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parça Ekle</p>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder="Ürün adı veya SKU..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-12 bg-slate-950 border-white/5 pl-12 pr-6 rounded-2xl text-xs font-medium focus:border-blue-500/30"
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1.5 backdrop-blur-3xl">
                                                {searchResults.map(p => (
                                                    <button key={p.id} onClick={() => handleAddPart(p)} className="w-full p-3 flex items-center justify-between hover:bg-white/5 rounded-xl transition-all group/item">
                                                        <div className="flex flex-col text-left">
                                                            <span className="text-xs font-bold text-white group-hover/item:text-blue-400">{p.name}</span>
                                                            <span className="text-[10px] text-slate-500">{p.sku}</span>
                                                        </div>
                                                        <span className="text-xs font-black text-blue-500">₺{Number(p.sellPrice).toLocaleString('tr-TR')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Durumu Güncelle</p>
                                    <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as ServiceStatus)}>
                                        <SelectTrigger className="h-12 bg-slate-950 border-white/5 rounded-2xl text-xs font-bold text-slate-300">
                                            <SelectValue placeholder="Durum seçin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl p-1 z-[100]">
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <SelectItem key={key} value={key} className="text-[10px] font-bold py-3 focus:bg-white/5 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-2 w-2 rounded-full", config.dot)} />
                                                        <span>{config.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="relative">
                                <Textarea
                                    placeholder="İşlem notu veya teknik detay giriniz..."
                                    value={techNote}
                                    onChange={(e) => setTechNote(e.target.value)}
                                    className="h-20 bg-slate-950 border-white/5 rounded-2xl p-4 text-xs font-medium focus:border-blue-500/30 resize-none placeholder:text-slate-800"
                                />
                                {(techNote.trim() || (selectedStatus && selectedStatus !== ticket.status)) && (
                                    <Button
                                        onClick={handleSaveNoteAndStatus}
                                        disabled={isSavingNote}
                                        className="absolute bottom-3 right-3 h-8 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl"
                                    >
                                        {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Kaydet
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Parts List */}
                        <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parça Listesi</h3>
                                </div>
                                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/10">₺{partsTotal.toLocaleString('tr-TR')}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                                {ticket.usedParts?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                                        <Box className="h-10 w-10 mb-2 text-slate-600" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Parça Yok</p>
                                    </div>
                                ) : (
                                    ticket.usedParts?.map((p: any) => (
                                        <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center shrink-0 border border-blue-500/10 text-blue-500">
                                                <Box className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-200 truncate">{p.product?.name || p.name || "Bilinmeyen Parça"}</p>
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter mt-0.5">{p.product?.sku || "SKU-NONE"}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-[8px] font-black text-slate-700 uppercase">Miktar</span>
                                                    <span className="text-[11px] font-bold text-slate-400">{p.quantity} Adet</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[8px] font-black text-slate-700 uppercase">Birim Fiyat</span>
                                                    <div className="relative w-28">
                                                        <Input
                                                            type="number"
                                                            defaultValue={Number(p.unitPrice)}
                                                            onBlur={(e) => handleUpdatePartPrice(p.id, Number(e.target.value))}
                                                            className="h-9 bg-black border-white/5 text-right font-black text-xs text-emerald-500 rounded-xl pr-3 pl-8 transition-all"
                                                        />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500/30">₺</span>
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleRemovePart(p.id)} variant="ghost" size="icon" className="h-9 w-9 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Financial Area (Compact & Stable) */}
                        <div className="bg-slate-950 border border-white/5 rounded-[2.3rem] p-6 grid grid-cols-[1fr_auto] items-center gap-8 shrink-0 shadow-2xl">
                            <div className="flex items-center gap-6 min-w-0">
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">İşçilik Ücreti</p>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={laborCost}
                                            onChange={(e) => setLaborCost(Number(e.target.value))}
                                            onBlur={handleSaveLabor}
                                            className="h-10 w-28 bg-white/5 border-transparent rounded-xl pl-8 pr-3 text-sm font-black text-emerald-500"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500/40">₺</span>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/5 shrink-0" />
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Tahmini</p>
                                    <p className="text-sm font-black text-slate-600">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="h-10 w-px bg-white/5 shrink-0" />
                                <div className="flex flex-col gap-0.5 min-w-[120px]">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">GENEL TOPLAM</p>
                                    <p className="text-3xl font-black text-white leading-none">₺{grandTotal.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {(ticket.status === "READY" || ticket.status === "DELIVERED" || selectedStatus === "READY" || selectedStatus === "DELIVERED") ? (
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleStatusUpdate("DELIVERED", "CASH")} className="h-12 bg-emerald-500 text-black font-black text-[10px] uppercase px-5 rounded-2xl gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap group hover:bg-emerald-400 transition-all">
                                            <CreditCard className="h-4 w-4 group-hover:scale-110 transition-transform" /> Tahsil & Teslim
                                        </Button>
                                        <Button
                                            onClick={() => handleStatusUpdate("DELIVERED", "DEBT")}
                                            variant="outline"
                                            className="h-12 bg-white/5 border-white/10 text-white font-black text-[10px] uppercase px-5 rounded-2xl gap-2 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all group"
                                        >
                                            <Wallet className="h-4 w-4 text-amber-500 group-hover:text-black transition-colors" /> Veresiye
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-[9px] font-bold text-blue-500/60 leading-tight max-w-[120px] text-right italic">
                                        * Tahsilat için "Hazır" yapın.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Workflow Timeline (Detailed) */}
                    <div className="w-[380px] flex flex-col gap-4 overflow-hidden shrink-0">
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Servis Akışı</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-700 bg-white/5 px-2 py-1 rounded-md">{ticket.logs?.length || 0} ADIM</span>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2 relative">
                                {/* Connecting Line */}
                                <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/50 via-slate-800 to-transparent" />

                                {ticket.logs?.map((log: any, i: number) => {
                                    const isStatusLog = log.message.includes("Durum güncellendi");
                                    const isPartAdd = log.message.includes("Parça eklendi");
                                    const isPartRemove = log.message.includes("Parça çıkarıldı");
                                    const isPriceUpdate = log.message.includes("Fiyat güncellendi");

                                    return (
                                        <div key={log.id} className="relative pl-12 group">
                                            <div className={cn(
                                                "absolute left-2.5 top-1.5 h-3.5 w-3.5 rounded-full border-[3px] border-slate-950 z-10 transition-all",
                                                i === 0 ? "bg-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-slate-800",
                                                isStatusLog && i !== 0 ? "bg-amber-500" : "",
                                                (isPartAdd || isPartRemove || isPriceUpdate) && "bg-purple-500"
                                            )} />

                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest",
                                                        i === 0 ? "text-blue-500" : "text-slate-600"
                                                    )}>
                                                        {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-2xl border transition-all",
                                                    i === 0 ? "bg-blue-500/5 border-blue-500/10" : "bg-white/[0.02] border-white/5 group-hover:bg-white/[0.04]",
                                                    isStatusLog && "border-amber-500/10",
                                                    (isPartAdd || isPartRemove || isPriceUpdate) && "border-purple-500/10"
                                                )}>
                                                    <p className={cn(
                                                        "text-[11px] font-bold leading-relaxed tracking-tight",
                                                        i === 0 ? "text-slate-100" : "text-slate-400",
                                                        isStatusLog && "text-amber-200/60",
                                                        (isPartAdd || isPartRemove || isPriceUpdate) && "text-purple-200/60"
                                                    )}>
                                                        {log.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
