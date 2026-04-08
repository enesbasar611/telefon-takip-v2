"use client";

import { useState, useEffect, useMemo } from "react";
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
    Box,
    ArrowRightCircle,
    ArrowRight,
    Lock,
    Grid3x3,
    Sparkles
} from "lucide-react";
import { getLoyaltyTier } from "@/lib/loyalty-utils";
import { PatternLock } from "@/components/ui/pattern-lock";
import { ServiceStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { cn, formatPhone } from "@/lib/utils";
import {
    addPartToService,
    removePartFromService,
    updateServiceUsedPart,
    orderAndAddPartToService,
    updateServicePartPrice,
    updateServiceCost,
    updateServiceStatus,
    getServiceTicketById
} from "@/lib/actions/service-actions";
import { searchProducts, createProduct, getCategories } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { assignTechnician } from "@/lib/actions/service-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";

interface ServiceManagementModalProps {
    ticket: any;
    isOpen: boolean;
    onClose: () => void;
    isQuickDeliver?: boolean;
}

const statusConfig: Record<ServiceStatus, { label: string; color: string; dot: string; bg: string }> = {
    PENDING: { label: "Beklemede", color: "text-muted-foreground", dot: "bg-slate-400", bg: "bg-slate-400/10" },
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
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [manualPart, setManualPart] = useState({
        name: "",
        buyPrice: "",
        buyPriceUsd: "",
        currency: "USD" as "USD" | "TRY",
        supplierId: "",
        warrantyType: "1_MONTH",
        warrantyValue: ""
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);

    const lastDeliveryLog = useMemo(() => {
        return ticket?.logs?.find((log: any) => log.message.includes("Durum güncellendi: Teslim Edildi"));
    }, [ticket?.logs]);

    const hasNewModifications = useMemo(() => {
        if (!lastDeliveryLog) return true;
        const lastDeliveryTime = new Date(lastDeliveryLog.createdAt).getTime();
        return ticket?.usedParts?.some((p: any) => new Date(p.createdAt).getTime() > lastDeliveryTime) ||
            (ticket?.updatedAt && new Date(ticket.updatedAt).getTime() > lastDeliveryTime);
    }, [ticket, lastDeliveryLog]);

    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

    useEffect(() => {
        fetchRates();
        loadCategories();
        loadSuppliers();
        loadStaff();

        const handleFocus = () => {
            loadSuppliers();
        };
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, []);

    const loadStaff = async () => {
        if (!ticket?.shopId) return;
        const s = await getStaff(ticket.shopId);
        setStaff(s);
    };

    const loadSuppliers = async () => {
        const sups = await getSuppliers();
        setSuppliers(sups);
    };

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    const fetchRates = async () => {
        if (!ticket?.shopId) return;
        const r = await getExchangeRates(ticket.shopId);
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

        if (Number(product.stock) <= 0) {
            setSelectedProduct(product);
            setIsAddingManual(true);
            setManualPart({
                ...manualPart,
                name: product.name,
                buyPrice: String(product.buyPrice),
                buyPriceUsd: product.buyPriceUsd ? String(product.buyPriceUsd) : "",
                currency: product.buyPriceUsd ? "USD" : "TRY"
            });
            toast.info("Bu ürün stokta yok. Tedarikçiden sipariş formuna aktarılıyorsunuz.");
            return;
        }

        setLoading(true);
        try {
            const res = await addPartToService(ticket.id, product.id, 1, product.sellPrice);
            if (res.success) {
                toast.success("Parça eklendi.");
                setSearchQuery("");
                refreshTicket();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("İşlem başarısız.");
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

    const handleUpdatePart = async (partId: string, data: { unitPrice?: number, costPrice?: number, warrantyMonths?: number, warrantyDays?: number }) => {
        try {
            const res = await updateServiceUsedPart(partId, data);
            if (res.success) {
                refreshTicket();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Hata oluştu.");
        }
    };

    const handleCreateAndAddPart = async () => {
        if (!manualPart.name || !manualPart.buyPrice || !manualPart.supplierId) {
            toast.error("İsim, maliyet ve tedarikçi seçimi gereklidir.");
            return;
        }

        setLoading(true);
        try {
            let finalBuyPrice = Math.round(Number(manualPart.buyPrice) * 100) / 100;
            let finalBuyPriceUsd = Number(manualPart.buyPriceUsd) || undefined;

            if (manualPart.currency === "USD" && manualPart.buyPriceUsd) {
                finalBuyPrice = Math.round(Number(manualPart.buyPriceUsd) * (rates?.usd || 1) * 100) / 100;
            } else if (manualPart.currency === "TRY" && manualPart.buyPrice) {
                finalBuyPriceUsd = Number(manualPart.buyPrice) / rates.usd;
            }

            let wMonths = 1;
            let wDays: number | undefined = undefined;

            switch (manualPart.warrantyType) {
                case "15_DAYS": wDays = 15; wMonths = 0; break;
                case "1_MONTH": wMonths = 1; break;
                case "3_MONTHS": wMonths = 3; break;
                case "6_MONTHS": wMonths = 6; break;
                case "MANUAL": wDays = Number(manualPart.warrantyValue) || 0; wMonths = 0; break;
            }

            const res = await orderAndAddPartToService({
                ticketId: ticket.id,
                productId: selectedProduct?.id,
                name: manualPart.name,
                supplierId: manualPart.supplierId,
                buyPrice: finalBuyPrice,
                buyPriceUsd: finalBuyPriceUsd,
                warrantyMonths: wMonths,
                warrantyDays: wDays
            });

            if (res.success) {
                toast.success("Tedarikçi borcu oluşturuldu ve parça eklendi.");
                // setIsAddingManual(false); (User requested it stay open)
                setSelectedProduct(null);
                setSearchQuery("");
                refreshTicket();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Beklenmedik bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLabor = async () => {
        try {
            setLoading(true);
            await updateServiceCost(ticket.id, Math.round(Number(ticket.estimatedCost) * 100) / 100, Math.round(laborCost * 100) / 100);
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

    const handleStatusUpdate = async (newStatus: ServiceStatus, paymentMethod: string = "CASH", discountAmount: number = 0) => {
        setLoading(true);
        try {
            const label = statusConfig[newStatus]?.label || newStatus;
            await updateServiceStatus(ticket.id, newStatus, paymentMethod, `Durum güncellendi: ${label}`, discountAmount);
            toast.success(`Durum: ${label}`);
            refreshTicket();
            router.refresh();
        } catch (err) {
            toast.error("Güncelleme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTech = async (techId: string) => {
        setLoading(true);
        try {
            await assignTechnician(ticket.id, techId);
            toast.success("Teknisyen atandı.");
            refreshTicket();
        } catch (err) {
            toast.error("Atama başarısız.");
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) return null;

    const partsTotal = ticket.usedParts?.reduce((acc: number, p: any) => acc + (Math.round(Number(p.unitPrice) * 100) / 100 * p.quantity), 0) || 0;
    const subtotal = Math.round((partsTotal + laborCost) * 100) / 100;

    const loyaltyTier = getLoyaltyTier(ticket.customer?.loyaltyPoints || 0);
    const loyaltyDiscountAmount = useMemo(() => {
        if (!applyLoyaltyDiscount || !loyaltyTier) return 0;
        if (loyaltyTier.name === "PLATİN") return subtotal * 0.20;
        if (loyaltyTier.name === "ALTIN") return laborCost * 0.15;
        return 0;
    }, [applyLoyaltyDiscount, loyaltyTier, subtotal, laborCost]);

    const grandTotal = subtotal - loyaltyDiscountAmount;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[98vw] w-[1400px] h-[95vh] bg-background border-border/50 p-0 overflow-hidden flex flex-col shadow-2xl">
                <div className="relative h-24 flex items-center justify-between px-10 bg-card/30 backdrop-blur-xl border-b border-border/50 shrink-0 z-50">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs  text-blue-500">Servis Kaydı</span>
                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-xs font-medium text-muted-foreground/80">#{ticket.ticketNumber}</span>
                            </div>
                            <h2 className="font-medium text-3xl text-foreground flex items-center gap-3">
                                {ticket.deviceBrand} <span className="text-blue-500">{ticket.deviceModel}</span>
                            </h2>
                        </div>
                        <div className={cn(
                            "px-6 py-2.5 rounded-2xl border border-border/50 flex items-center gap-3 transition-all",
                            statusConfig[ticket.status as ServiceStatus]?.bg
                        )}>
                            <div className={cn("h-3 w-3 rounded-full shadow-[0_0_15px_currentColor]", statusConfig[ticket.status as ServiceStatus]?.dot)} />
                            <span className={cn("text-xs ", statusConfig[ticket.status as ServiceStatus]?.color)}>
                                {statusConfig[ticket.status as ServiceStatus]?.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isQuickDeliver && ticket.status !== "READY" && ticket.status !== "DELIVERED" && (
                            <Button
                                onClick={() => handleStatusUpdate("READY")}
                                className="h-12 bg-white text-black hover:bg-white/90  text-xs px-8 rounded-2xl gap-3 shadow-2xl transition-all active:scale-95"
                            >
                                <CheckCircle2 className="h-5 w-5" /> Servisi Tamamla
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="h-12 w-12 rounded-2xl hover:bg-white/5 text-muted-foreground"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-[300px_1fr_380px] overflow-hidden p-6 gap-6 bg-background">

                    <div className="w-[300px] flex flex-col gap-4 overflow-hidden shrink-0">
                        <div className="bg-white/[0.02] border border-border/50 rounded-[2rem] p-6 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ScanLine className="h-3.5 w-3.5 text-blue-500" />
                                <h3 className="font-medium text-[10px]  uppercase tracking-widest text-muted-foreground/80">Müşteri & Cihaz</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                                    <p className="text-[10px]  text-muted-foreground/80 uppercase mb-1">Cihaz</p>
                                    <p className="text-sm  text-foreground leading-tight font-medium">{ticket.deviceBrand} {ticket.deviceModel}</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1 font-medium italic">{ticket.imei || "IMEI Yok"}</p>

                                    {ticket.devicePassword && (
                                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-3 w-3 text-amber-500" />
                                                <span className="text-[10px] uppercase tracking-widest text-slate-500">Cihaz Erişimi</span>
                                            </div>

                                            {ticket.devicePassword.startsWith("DESEN:") ? (
                                                <div className="space-y-3">
                                                    <div className="bg-black/40 rounded-2xl p-2 border border-blue-500/10 inline-block">
                                                        <PatternLock
                                                            readOnly
                                                            width={120}
                                                            height={120}
                                                            initialPattern={ticket.devicePassword.replace("DESEN:", "").split(",").map(Number)}
                                                            className="opacity-80"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                        <Grid3x3 className="h-3.5 w-3.5 text-blue-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-blue-500/60 uppercase">Ekran Deseni</span>
                                                            <span className="text-xs font-bold tracking-[0.2em] text-blue-400">
                                                                {ticket.devicePassword.replace("DESEN:", "").split(",").join("-")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                        <Hash className="h-4 w-4 text-amber-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-amber-500/60 uppercase">Kilit Şifresi</span>
                                                        <span className="text-sm font-bold text-amber-200 tracking-wider">
                                                            {ticket.devicePassword}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px]  text-emerald-500/50 uppercase mb-1">Müşteri</p>
                                        <p className="text-sm  text-emerald-400 truncate">{ticket.customer?.name}</p>
                                        <p className="text-xs  text-emerald-600 mt-0.5">{formatPhone(ticket.customer?.phone)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/10"
                                        onClick={() => setWhatsappModalOpen(true)}
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-[10px]  text-blue-500/50 uppercase mb-2">Teknisyen</p>
                                    <Select
                                        value={ticket.technician?.id || ""}
                                        onValueChange={handleAssignTech}
                                    >
                                        <SelectTrigger className="h-10 bg-card border-border/50 text-xs  text-foreground rounded-xl px-4">
                                            <SelectValue placeholder="Teknisyen Seçin" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border text-foreground rounded-xl">
                                            {staff.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="text-xs  py-2.5">
                                                    {s.name} {s.surname}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2rem] p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                <h3 className="font-medium text-[10px]  uppercase tracking-widest text-amber-500/80">Arıza Detayı</h3>
                            </div>
                            <p className="text-xs text-amber-200/70 font-medium leading-relaxed italic">
                                "{ticket.problemDesc}"
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-hidden">
                        <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 flex flex-col gap-8 shrink-0">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <p className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest ml-1">Parça Ekle</p>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder="Ürün adı veya SKU..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-12 bg-background border-border/50 pl-12 pr-6 rounded-2xl text-xs font-medium focus:border-blue-500/30"
                                        />
                                        {searchQuery && (
                                            <div className="absolute top-full left-0 right-0 mt-3 bg-[#0c0c0e] border border-border rounded-3xl shadow-2xl z-[100] max-h-[400px] overflow-y-auto p-2 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
                                                {searchResults.length > 0 ? (
                                                    <div className="space-y-1">
                                                        <p className="text-[9px]  text-slate-600 uppercase tracking-widest px-4 py-2">Eşleşen Ürünler</p>
                                                        {searchResults.map(p => (
                                                            <button key={p.id} onClick={() => handleAddPart(p)} className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] active:bg-white/[0.05] rounded-2xl transition-all group/item border border-transparent hover:border-border/50">
                                                                <div className="flex flex-col text-left gap-1">
                                                                    <span className="text-sm  text-slate-100 group-hover/item:text-blue-400 transition-colors">{p.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={cn(
                                                                            "text-[10px]  px-2 py-0.5 rounded-md",
                                                                            p.stock > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                                        )}>
                                                                            Stok: {p.stock}
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground/80 font-medium">{p.sku}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="text-sm  text-blue-500">₺{Number(p.sellPrice).toLocaleString('tr-TR')}</span>
                                                                    <ArrowRightCircle className="h-4 w-4 text-slate-700 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center space-y-2">
                                                        <Box className="h-8 w-8 text-slate-700 mx-auto opacity-20" />
                                                        <p className="text-[11px]  text-muted-foreground/80">Ürün bulunamadı</p>
                                                    </div>
                                                )}

                                                <div className="mt-2 pt-2 border-t border-border/50">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(null);
                                                            setIsAddingManual(true);
                                                            setManualPart(prev => ({ ...prev, name: searchQuery }));
                                                        }}
                                                        className="w-full p-4 flex items-center gap-4 hover:bg-blue-500/5 rounded-2xl transition-all group/new text-left border border-dashed border-blue-500/10 hover:border-blue-500/30"
                                                    >
                                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                            <Plus className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs  text-blue-400 uppercase tracking-widest">Yeni Parça Olarak Ekle</span>
                                                            <span className="text-[10px] text-muted-foreground/80 font-medium">"{searchQuery}" ürününü tedarikçiden borç ile ekle</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Dialog open={isAddingManual} onOpenChange={(val) => { if (!val) { setIsAddingManual(false); setSelectedProduct(null); } }}>
                                    <DialogContent
                                        overlayClassName="bg-black/20 backdrop-blur-[2px]"
                                        className="max-w-xl bg-background border-border/50 p-0 overflow-hidden shadow-2xl rounded-[2.5rem]"
                                    >
                                        <div className="p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/10">
                                                            <ShoppingBag className="h-5 w-5" />
                                                        </div>
                                                        <h2 className="font-medium text-xl text-foreground tracking-tight">Tedarikçiden Parça Temini</h2>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground/80 font-medium ml-1">Stokta olmayan veya yeni bir parçayı borç ile sisteme ekleyin.</p>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => { setIsAddingManual(false); setSelectedProduct(null); }} className="rounded-2xl hover:bg-white/5 text-muted-foreground/80">
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <p className="text-[10px]  text-slate-600 uppercase tracking-[0.2em] ml-1">Ürün Bilgisi</p>
                                                    <div className="relative group">
                                                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                                        <Input
                                                            placeholder="Ürün adı..."
                                                            value={manualPart.name}
                                                            onChange={(e) => setManualPart({ ...manualPart, name: e.target.value })}
                                                            className="h-14 bg-card border-border/50 pl-12 pr-6 rounded-2xl text-sm text-foreground transition-all focus:border-blue-500/30"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between px-1">
                                                            <p className="text-[10px]  text-slate-600 uppercase tracking-[0.2em]">Tedarikçi</p>
                                                            <Link
                                                                href="/tedarikciler?action=create"
                                                                target="_blank"
                                                                className="text-[9px]  text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                            >
                                                                Yeni Ekle <ArrowRight className="h-2 w-2" />
                                                            </Link>
                                                        </div>
                                                        <Select value={manualPart.supplierId} onValueChange={(v) => setManualPart({ ...manualPart, supplierId: v })}>
                                                            <SelectTrigger className="h-14 bg-black/40 border-border/50 text-sm  text-foreground/90 rounded-2xl px-6">
                                                                <SelectValue placeholder="Tedarikçi Seçin" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-card border-border text-white rounded-2xl overflow-hidden">
                                                                {suppliers.map(s => (
                                                                    <SelectItem key={s.id} value={s.id} className="p-4 focus:bg-white/5 transition-colors cursor-pointer border-b border-white/[0.02] last:border-0">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="">{s.name}</span>
                                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80">
                                                                                <span>₺{Number(s.balance).toLocaleString()}</span>
                                                                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                                                <span>${Number(s.balanceUsd || 0).toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-[10px]  text-slate-600 uppercase tracking-[0.2em] ml-1">Para Birimi</p>
                                                        <div className="grid grid-cols-2 p-1 bg-black/40 border border-border/50 rounded-2xl h-14">
                                                            <button
                                                                onClick={() => setManualPart({ ...manualPart, currency: "TRY" })}
                                                                className={cn(
                                                                    "rounded-xl text-[10px]  uppercase tracking-widest transition-all",
                                                                    manualPart.currency === "TRY" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-slate-600 hover:text-muted-foreground"
                                                                )}
                                                            >
                                                                TL (₺)
                                                            </button>
                                                            <button
                                                                onClick={() => setManualPart({ ...manualPart, currency: "USD" })}
                                                                className={cn(
                                                                    "rounded-xl text-[10px]  uppercase tracking-widest transition-all",
                                                                    manualPart.currency === "USD" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-600 hover:text-muted-foreground"
                                                                )}
                                                            >
                                                                USD ($)
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px]  text-slate-600 uppercase tracking-[0.2em] ml-1">Maliyet (Alış)</p>
                                                        <div className="relative group">
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm  text-slate-700 group-focus-within:text-blue-500 transition-colors">
                                                                {manualPart.currency === "TRY" ? "₺" : "$"}
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={manualPart.currency === "USD" ? manualPart.buyPriceUsd : manualPart.buyPrice}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (manualPart.currency === "USD") {
                                                                        setManualPart({ ...manualPart, buyPriceUsd: val, buyPrice: String(Number(val) * rates.usd) });
                                                                    } else {
                                                                        setManualPart({ ...manualPart, buyPrice: val, buyPriceUsd: String(Number(val) / rates.usd) });
                                                                    }
                                                                }}
                                                                className="h-14 bg-black/40 border-border/50 pl-12 pr-6 rounded-2xl text-sm  text-white transition-all focus:border-blue-500/30 tabular-nums"
                                                            />
                                                        </div>
                                                        {manualPart.currency === "USD" && (
                                                            <p className="text-[10px] text-blue-500/80 mt-2  uppercase tracking-widest pl-1">
                                                                ≈ ₺{Math.round(Number(manualPart.buyPrice)).toLocaleString()} (Güncel Kur)
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-[10px]  text-slate-600 uppercase tracking-[0.2em] ml-1">Garanti Süresi</p>
                                                        <Select value={manualPart.warrantyType} onValueChange={(v) => setManualPart({ ...manualPart, warrantyType: v })}>
                                                            <SelectTrigger className="h-14 bg-black/40 border-border/50 text-sm  text-foreground/90 rounded-2xl px-6">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-card border-border text-white rounded-2xl">
                                                                <SelectItem value="15_DAYS" className="p-4">15 Gün</SelectItem>
                                                                <SelectItem value="1_MONTH" className="p-4">1 Ay</SelectItem>
                                                                <SelectItem value="3_MONTHS" className="p-4">3 Ay</SelectItem>
                                                                <SelectItem value="6_MONTHS" className="p-4">6 Ay</SelectItem>
                                                                <SelectItem value="MANUAL" className="p-4">Özel (Gün)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {manualPart.warrantyType === "MANUAL" && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                        <p className="text-[10px]  text-slate-600 uppercase tracking-widest ml-1">Garanti Günü</p>
                                                        <Input
                                                            type="number"
                                                            placeholder="Örn: 90"
                                                            value={manualPart.warrantyValue}
                                                            onChange={(e) => setManualPart({ ...manualPart, warrantyValue: e.target.value })}
                                                            className="h-14 bg-black/40 border-border/50 px-6 rounded-2xl text-sm  text-white focus:border-blue-500/30"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4">
                                                <Button
                                                    onClick={handleCreateAndAddPart}
                                                    disabled={loading}
                                                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white  text-xs uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-blue-500/20 transition-all active:scale-95 group"
                                                >
                                                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                                        <div className="flex items-center gap-3">
                                                            <span>Borç Yaz ve Servise Ekle</span>
                                                            <ArrowRightCircle className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    )}
                                                </Button>
                                                <p className="text-[9px] text-slate-600 text-center mt-6  uppercase tracking-widest opacity-50">
                                                    * Bu işlem tedarikçi bakiyesini artırır ve ürün maliyetini işler.
                                                </p>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="space-y-3">
                                    <p className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest ml-1">Durumu Güncelle</p>
                                    <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as ServiceStatus)}>
                                        <SelectTrigger className="h-12 bg-background border-border/50 rounded-2xl text-xs  text-foreground">
                                            <SelectValue placeholder="Durum seçin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border text-foreground rounded-2xl p-1 z-[100]">
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <SelectItem key={key} value={key} className="text-[10px]  py-3 focus:bg-white/5 rounded-xl">
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
                                    className="h-20 bg-background border-border/50 rounded-2xl p-4 text-xs font-medium focus:border-blue-500/30 resize-none placeholder:text-slate-800"
                                />
                                {(techNote.trim() || (selectedStatus && selectedStatus !== ticket.status)) && (
                                    <Button
                                        onClick={handleSaveNoteAndStatus}
                                        disabled={isSavingNote}
                                        className="absolute bottom-3 right-3 h-8 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px]  uppercase tracking-widest gap-2 shadow-xl"
                                    >
                                        {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Kaydet
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 bg-card border border-border/50 rounded-[2.5rem] p-8 flex flex-col overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                                    <h3 className="font-medium text-[10px]  uppercase tracking-widest text-muted-foreground/80">Parça Listesi</h3>
                                </div>
                                <span className="text-xs  text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/10">₺{formatCurrency(partsTotal)}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                                {ticket.usedParts?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                                        <Box className="h-10 w-10 mb-2 text-slate-600" />
                                        <p className="text-[10px]  uppercase tracking-widest">Parça Yok</p>
                                    </div>
                                ) : (
                                    ticket.usedParts?.map((p: any) => (
                                        <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-border/50 group hover:bg-white/[0.04] transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center shrink-0 border border-blue-500/10 text-blue-500">
                                                <Box className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-foreground/90 truncate">{p.product?.name || p.name || "Bilinmeyen Parça"}</p>
                                                <p className="text-[9px]  text-muted-foreground uppercase tracking-tighter mt-0.5">{p.product?.sku || "SKU-NONE"}</p>
                                            </div>

                                            <div className="flex items-center gap-3 px-2">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[8px]  text-slate-700 uppercase">Maliyet (Alış)</span>
                                                    <div className="relative w-32">
                                                        <PriceInput
                                                            value={Number(p.costPrice)}
                                                            onChange={(v) => handleUpdatePart(p.id, { costPrice: v })}
                                                            className="h-8 bg-black/40 border-border/50 text-right  text-[11px] text-amber-500/60 rounded-lg pr-3 pl-8"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[8px]  text-slate-700 uppercase">Satış (Birim)</span>
                                                    <div className="relative w-32">
                                                        <PriceInput
                                                            value={Number(p.unitPrice)}
                                                            onChange={(v) => handleUpdatePart(p.id, { unitPrice: v })}
                                                            className="h-8 bg-black border-border/50 text-right  text-[11px] text-emerald-500 rounded-lg pr-3 pl-8"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[8px]  text-slate-700 uppercase">Garanti</span>
                                                    <Select
                                                        defaultValue={p.warrantyDays ? `D${p.warrantyDays}` : `M${p.warrantyMonths}`}
                                                        onValueChange={(v) => {
                                                            if (v.startsWith('D')) handleUpdatePart(p.id, { warrantyDays: Number(v.slice(1)), warrantyMonths: 0 });
                                                            else handleUpdatePart(p.id, { warrantyMonths: Number(v.slice(1)), warrantyDays: 0 as any });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 bg-black border-border/50 text-[10px]  text-blue-400 px-3 w-24 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-background border-border text-foreground">
                                                            <SelectItem value="D15">15 Gün</SelectItem>
                                                            <SelectItem value="M1">1 Ay</SelectItem>
                                                            <SelectItem value="M3">3 Ay</SelectItem>
                                                            <SelectItem value="M6">6 Ay</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button onClick={() => handleRemovePart(p.id)} variant="ghost" size="icon" className="h-8 w-8 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg mt-4">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Workflow Timeline & Payment */}
                    <div className="w-[380px] flex flex-col gap-4 overflow-hidden shrink-0">
                        <div className="flex-1 bg-card border border-border/50 rounded-[2.5rem] p-7 flex flex-col overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    <h3 className="font-medium text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Servis Akışı</h3>
                                </div>
                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">{ticket.logs?.length || 0} ADIM</span>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2 relative">
                                {/* Connecting Line */}
                                <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/50 via-border to-transparent" />

                                {ticket.logs?.map((log: any, i: number) => {
                                    const isStatusLog = log.message.includes("Durum güncellendi");
                                    const isPartAdd = log.message.includes("Parça eklendi");
                                    const isPartRemove = log.message.includes("Parça çıkarıldı");
                                    const isPriceUpdate = log.message.includes("Fiyat güncellendi");

                                    return (
                                        <div key={log.id} className="relative pl-10 group">
                                            <div className={cn(
                                                "absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background z-10 transition-all",
                                                i === 0 ? "bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-muted",
                                                isStatusLog && i !== 0 ? "bg-amber-500" : "",
                                                (isPartAdd || isPartRemove || isPriceUpdate) && "bg-purple-500"
                                            )} />

                                            <div className="flex flex-col gap-1.5">
                                                <span className={cn(
                                                    "text-[8px] uppercase tracking-widest",
                                                    i === 0 ? "text-blue-500 font-bold" : "text-muted-foreground/60"
                                                )}>
                                                    {format(new Date(log.createdAt), "dd MMM, HH:mm", { locale: tr })}
                                                </span>
                                                <div className={cn(
                                                    "p-3 rounded-xl border transition-all",
                                                    i === 0 ? "bg-blue-500/5 border-blue-500/20" : "bg-muted/30 border-border/50 group-hover:bg-muted/50"
                                                )}>
                                                    <p className={cn(
                                                        "text-[10px] leading-relaxed tracking-tight",
                                                        i === 0 ? "text-foreground font-medium" : "text-muted-foreground"
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

                        {/* Financial Area - Moved to Right Column */}
                        <div className="bg-card border-t border-border/80 rounded-[2rem] p-6 flex flex-col gap-5 shrink-0 shadow-lg">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">İşçilik</p>
                                    <PriceInput
                                        value={laborCost}
                                        onChange={(v) => {
                                            setLaborCost(v);
                                            updateServiceCost(ticket.id, Math.round(Number(ticket.estimatedCost) * 100) / 100, Math.round(v * 100) / 100);
                                        }}
                                        className="h-9 w-24 bg-muted/50 border-border/50 rounded-xl px-3 text-xs text-emerald-600 font-bold"
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="text-[10px] text-blue-500/60 uppercase tracking-widest">TOPLAM TUTAR</p>
                                    <p className="text-2xl text-foreground leading-none font-bold tabular-nums">₺{formatCurrency(grandTotal)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {loyaltyTier && loyaltyTier.name !== "STANDART" && (
                                    <div
                                        onClick={() => setApplyLoyaltyDiscount(!applyLoyaltyDiscount)}
                                        className={cn(
                                            "w-full px-4 py-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                                            applyLoyaltyDiscount
                                                ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                                : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles className={cn("h-3.5 w-3.5", applyLoyaltyDiscount ? "text-blue-500 animate-pulse" : "text-muted-foreground")} />
                                            <span className="text-[10px] font-bold uppercase">SADAKAT %{loyaltyTier.name === "PLATİN" ? 20 : 15}</span>
                                        </div>
                                        {applyLoyaltyDiscount && <span className="text-[10px] font-bold">-₺{formatCurrency(loyaltyDiscountAmount)}</span>}
                                    </div>
                                )}

                                <div className="flex gap-2 relative">
                                    {(!hasNewModifications && ticket.status === "DELIVERED") && (
                                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center border border-dashed border-border">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background px-2">Tahsilat Yapıldı</span>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => handleStatusUpdate("DELIVERED", "CASH", applyLoyaltyDiscount ? loyaltyDiscountAmount : 0)}
                                        disabled={ticket.status !== "READY" || (!hasNewModifications && ticket.status === "DELIVERED")}
                                        className={cn(
                                            "flex-1 h-12 text-[10px] uppercase font-bold rounded-xl gap-2 transition-all",
                                            ticket.status === "READY"
                                                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <CreditCard className="h-4 w-4" /> Tahsil & Teslim
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate("DELIVERED", "DEBT", applyLoyaltyDiscount ? loyaltyDiscountAmount : 0)}
                                        disabled={ticket.status !== "READY" || (!hasNewModifications && ticket.status === "DELIVERED")}
                                        variant="outline"
                                        className={cn(
                                            "flex-1 h-12 text-[10px] uppercase font-bold rounded-xl gap-2 transition-all",
                                            ticket.status === "READY"
                                                ? "border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-500 hover:text-white"
                                                : "bg-muted text-muted-foreground border-transparent"
                                        )}
                                    >
                                        <Wallet className="h-4 w-4" /> Veresiye
                                    </Button>
                                </div>
                                {ticket.status !== "READY" && ticket.status !== "DELIVERED" && (
                                    <p className="text-[9px] text-center text-muted-foreground/60 italic mt-1 font-medium">
                                        Tahsilat için durumu "Hazır" yapmalısınız.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            {/* WhatsApp Confirm Modal explicitly nested inside or outside? Better to place outside DialogContent but inside modal tree or completely separated. Actually Dialogs shouldn't be nested too deeply but it's fine. */}
            <WhatsAppConfirmModal
                isOpen={whatsappModalOpen}
                onClose={() => setWhatsappModalOpen(false)}
                phone={ticket.customer?.phone || ""}
                customerName={ticket.customer?.name}
                initialMessage={replacePlaceholders(
                    (() => {
                        const status = (selectedStatus as ServiceStatus) || ticket.status;
                        switch (status) {
                            case "READY": return WHATSAPP_TEMPLATES.READY;
                            case "APPROVED": return WHATSAPP_TEMPLATES.APPROVED;
                            case "REPAIRING": return WHATSAPP_TEMPLATES.REPAIRING;
                            case "WAITING_PART": return WHATSAPP_TEMPLATES.WAITING_PART;
                            case "DELIVERED": return WHATSAPP_TEMPLATES.DELIVERED;
                            default: return WHATSAPP_TEMPLATES.NEW_SERVICE;
                        }
                    })(),
                    {
                        customer: ticket.customer?.name || "",
                        device: `${ticket.deviceBrand} ${ticket.deviceModel}`,
                        ticket: ticket.ticketNumber || ""
                    }
                )}
            />
        </Dialog>
    );
}





