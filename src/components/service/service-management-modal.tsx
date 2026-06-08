"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
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
    Sparkles,
    Check,
    Zap,
    Target,
    Timer,
    RotateCcw
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
    getServiceTicketById,
    deleteServiceTicket
} from "@/lib/actions/service-actions";
import { searchProducts, createProduct, getCategories } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { assignTechnician } from "@/lib/actions/service-actions";
import { useQuery } from "@tanstack/react-query";
import { getSettings, updateSetting } from "@/lib/actions/setting-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ServiceManagementModalProps {
    ticket: any;
    isOpen: boolean;
    onClose: () => void;
    isQuickDeliver?: boolean;
}

const statusConfig: Record<ServiceStatus, { label: string; color: string; dot: string; bg: string; icon: any }> = {
    PENDING: { label: "Beklemede", color: "text-slate-400", dot: "bg-slate-400", bg: "bg-slate-400/10", icon: Clock },
    APPROVED: { label: "Onaylandı", color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-400/10", icon: Check },
    REPAIRING: { label: "Tamirde", color: "text-amber-400", dot: "bg-amber-400", bg: "bg-amber-400/10", icon: Wrench },
    WAITING_PART: { label: "Parça Bekliyor", color: "text-purple-400", dot: "bg-purple-400", bg: "bg-purple-400/10", icon: Box },
    READY: { label: "Hazır", color: "text-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-400/10", icon: Check },
    DELIVERED: { label: "Teslim Edildi", color: "text-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-500/10", icon: ShoppingBag },
    CANCELLED: { label: "İptal Edildi", color: "text-rose-500", dot: "bg-rose-500", bg: "bg-rose-500/10", icon: XCircle },
};

const statusOrder: ServiceStatus[] = ["PENDING", "APPROVED", "REPAIRING", "READY", "DELIVERED"];

export function ServiceManagementModal({ ticket: initialTicket, isOpen, onClose, isQuickDeliver }: ServiceManagementModalProps) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const router = useRouter();
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session?.user?.role || "");
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEnableLoyaltyConfirm, setShowEnableLoyaltyConfirm] = useState(false);

    const { data: settings = [] } = useQuery({
        queryKey: ["settings"],
        queryFn: getSettings,
    });

    const loyaltySettings = useMemo(() => {
        const enabled = settings.find((s: any) => s.key === "loyalty_enabled")?.value !== "false";
        const pointValue = Number(settings.find((s: any) => s.key === "loyalty_point_value_tl")?.value) || 5;
        return { enabled, pointValue };
    }, [settings]);

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
                queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
                queryClient.invalidateQueries({ queryKey: ["warranty-stats"] });
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
                queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
                queryClient.invalidateQueries({ queryKey: ["warranty-stats"] });
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
                queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
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
                finalBuyPrice = Math.round(Number(manualPart.buyPriceUsd) * (rates?.usd || 34.5) * 100) / 100;
            } else if (manualPart.currency === "TRY" && manualPart.buyPrice) {
                finalBuyPriceUsd = Number(manualPart.buyPrice) / (rates?.usd || 34.5);
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
                setIsAddingManual(false);
                setManualPart({
                    name: "",
                    buyPrice: "",
                    buyPriceUsd: "",
                    currency: "USD",
                    supplierId: "",
                    warrantyType: "1_MONTH",
                    warrantyValue: ""
                });
                setSelectedProduct(null);
                setSearchQuery("");
                queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
                queryClient.invalidateQueries({ queryKey: ["warranty-stats"] });
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
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

    const handleSaveNoteAndStatus = async () => {
        if (!techNote.trim() && !selectedStatus) return;
        setIsSavingNote(true);
        try {
            // Auto-assign Shop Manager if no technician is assigned
            if (!ticket.technicianId) {
                const shopManager = staff.find(s => s.role === "SHOP_MANAGER");
                if (shopManager) {
                    await assignTechnician(ticket.id, shopManager.id);
                }
            }

            const statusToUse = (selectedStatus as ServiceStatus) || ticket.status;
            const messageToUse = techNote.trim() || `Durum güncellendi: ${statusConfig[statusToUse].label}`;
            await updateServiceStatus(ticket.id, statusToUse, "CASH", messageToUse);
            toast.success("Kayıt güncellendi.");

            // Auto Trigger Notification if status changed
            if (selectedStatus && selectedStatus !== ticket.status) {
                setTimeout(() => setWhatsappModalOpen(true), 500);
            }

            setTechNote("");
            setSelectedStatus("");
            queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["warranty-stats"] });
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
            // Auto-assign Shop Manager if no technician is assigned
            if (!ticket.technicianId) {
                const shopManager = staff.find(s => s.role === "SHOP_MANAGER");
                if (shopManager) {
                    await assignTechnician(ticket.id, shopManager.id);
                }
            }

            const label = statusConfig[newStatus]?.label || newStatus;
            await updateServiceStatus(ticket.id, newStatus, paymentMethod, `Durum güncellendi: ${label}`, discountAmount);
            toast.success(`Durum: ${label}`);

            // Auto Trigger Notification
            setTimeout(() => setWhatsappModalOpen(true), 500);

            queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["warranty-stats"] });
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
            queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
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
        if (!applyLoyaltyDiscount) return 0;
        // Sadakat puanını TL değerine çevir
        const customerPoints = ticket.customer?.loyaltyPoints || 0;
        const discount = customerPoints * loyaltySettings.pointValue;
        // İndirim toplam tutardan fazla olamaz
        return Math.min(discount, subtotal);
    }, [applyLoyaltyDiscount, ticket.customer?.loyaltyPoints, loyaltySettings.pointValue, subtotal]);

    const grandTotal = subtotal - loyaltyDiscountAmount;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full md:max-w-[98vw] md:w-[1500px] h-full md:h-[92vh] bg-[#0F172A] border-white/10 p-0 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] md:rounded-[2.5rem] overflow-hidden">
                {/* Premium Header */}
                <div className="relative h-20 md:h-28 flex items-center justify-between px-6 md:px-12 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/[0.05] shrink-0 z-50">
                    <div className="flex items-center gap-6 md:gap-10">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                                    <span className="text-[10px] font-bold text-blue-500 tracking-wider">#{ticket.ticketNumber}</span>
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
                                    {format(new Date(ticket.createdAt), "dd MMMM yyyy", { locale: tr })}
                                </span>
                            </div>
                            <h2 className="font-bold text-xl md:text-3xl text-slate-900 dark:text-white flex items-center gap-3">
                                {ticket.deviceBrand} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{ticket.deviceModel}</span>
                            </h2>
                        </div>
                    </div>

                    {/* Visual Timeline Standard (Header) */}
                    <div className="hidden xl:flex items-center gap-2 px-8 border-x border-white/[0.05]">
                        {statusOrder.map((status, idx) => {
                            const config = statusConfig[status];
                            const isCurrent = ticket.status === status;
                            const isPast = statusOrder.indexOf(ticket.status as ServiceStatus) > idx;

                            return (
                                <div key={status} className="flex items-center">
                                    <div className={cn(
                                        "flex flex-col items-center gap-1.5 transition-all duration-700 relative",
                                        isCurrent ? "opacity-100 scale-110" : isPast ? "opacity-60" : "opacity-25"
                                    )}>
                                        {isCurrent && (
                                            <div className="absolute -top-3 h-1 w-full bg-blue-500 blur-sm animate-pulse rounded-full" />
                                        )}
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-500",
                                            isCurrent ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)]" :
                                                isPast ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                    "bg-white/5 border-white/10 text-white/40"
                                        )}>
                                            {isPast ? <Check className="h-4 w-4" /> : isCurrent ? <Check className="h-4 w-4" /> : <config.icon className="h-4 w-4" />}
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-widest text-center max-w-[50px] leading-tight">
                                            {config.label}
                                        </span>
                                    </div>
                                    {idx < statusOrder.length - 1 && (
                                        <div className="flex flex-col items-center mx-2 mb-4">
                                            <div className={cn(
                                                "w-6 h-[2px] rounded-full transition-colors duration-1000",
                                                isPast ? "bg-emerald-500/30" : "bg-white/5"
                                            )} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        {!isQuickDeliver && !["READY", "DELIVERED", "CANCELLED"].includes(ticket.status) && (
                            <button
                                onClick={() => handleStatusUpdate("READY")}
                                className="h-10 md:h-12 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black px-6 md:px-8 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] transform transition-all active:scale-95 group"
                            >
                                <Check className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                <span className="hidden md:inline uppercase tracking-widest text-[11px]">Tamamla</span>
                            </button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="h-10 w-10 md:h-14 md:w-14 rounded-2xl hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 className="h-5 w-5 md:h-6 md:w-6" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:grid md:grid-cols-[340px_1fr] overflow-hidden bg-[#0F172A]">
                    {/* Left Pane: Identity & Context */}
                    <div className="border-r border-white/5 flex flex-col overflow-y-auto no-scrollbar bg-white/[0.01]">
                        <div className="p-5 space-y-6">
                            {/* Device Context */}
                            <section className="space-y-1.5">
                                <div className="flex items-center gap-2 px-1">
                                    <Smartphone className="h-3 w-3 text-blue-500/60" />
                                    <h3 className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">Cihaz Kimliği</h3>
                                </div>

                                <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-2.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-white leading-tight truncate">
                                                {ticket.deviceBrand} <span className="text-blue-500">{ticket.deviceModel}</span>
                                            </p>
                                            <p className="text-[9px] font-mono text-white/30 tracking-widest mt-0.5">
                                                {ticket.imei || "IMEI TANIMSIZ"}
                                            </p>
                                        </div>
                                        {ticket.devicePassword && !ticket.devicePassword.startsWith("DESEN:") && (
                                            <div className="px-2 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10">
                                                <span className="text-[9px] font-mono font-bold text-amber-500/80">{ticket.devicePassword}</span>
                                            </div>
                                        )}
                                    </div>

                                    {ticket.devicePassword?.startsWith("DESEN:") && (
                                        <div className="pt-2 border-t border-white/[0.03]">
                                            <div className="p-2 bg-black/20 rounded-lg flex justify-center">
                                                <PatternLock
                                                    readOnly
                                                    width={80}
                                                    height={80}
                                                    initialPattern={ticket.devicePassword.replace("DESEN:", "").split(",").map(Number)}
                                                    className="opacity-60"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-1.5">
                                <div className="flex items-center gap-2 px-1">
                                    <User className="h-3 w-3 text-emerald-500/60" />
                                    <h3 className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">Müşteri Profili</h3>
                                </div>

                                <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-2.5 flex items-center justify-between group hover:bg-white/[0.03] transition-all">
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-white/90 truncate">{ticket.customer?.name}</p>
                                        <p className="text-[9px] font-mono text-white/30 tracking-wider mt-0.5">{formatPhone(ticket.customer?.phone)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-emerald-500/5 text-emerald-500/60 hover:bg-emerald-500 hover:text-black transition-all"
                                        onClick={() => setWhatsappModalOpen(true)}
                                    >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </section>

                            {/* Staff Assignment */}
                            <section className="space-y-2">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-4 w-4 rounded bg-blue-500/10 flex items-center justify-center">
                                        <Wrench className="h-2.5 w-2.5 text-blue-500" />
                                    </div>
                                    <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Sorumlu Teknisyen</h3>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                                    <Select
                                        value={ticket.technician?.id || staff.find(s => s.role === "SHOP_MANAGER")?.id || ""}
                                        onValueChange={handleAssignTech}
                                        disabled={!!ticket.technicianId && !isAdmin}
                                    >
                                        <SelectTrigger className="h-10 bg-transparent border-none text-xs text-white/80 px-3 focus:ring-0">
                                            <SelectValue placeholder="Teknisyen Atanmamış" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#111827] border-white/10 text-white rounded-xl p-1 z-[9999]" position="popper" sideOffset={5}>
                                            {staff.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="py-2 px-3 rounded-lg focus:bg-white/5 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-6 w-6 rounded bg-blue-500/10 flex items-center justify-center text-[9px] font-bold text-blue-400">
                                                            {s.name[0]}{s.surname[0]}
                                                        </div>
                                                        <span className="font-bold text-xs text-white/70">
                                                            {s.name} {s.surname} {s.role === "SHOP_MANAGER" && "(Bayi Yöneticisi)"}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>
                        </div>
                    </div>


                    {/* Right Pane: Workshop & Workflow (Merged from Center & Right) */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-8 space-y-6 md:space-y-8">
                            {/* Problem Highlight */}
                            <div className="p-4 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent border border-amber-500/20 rounded-2xl relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                                    <AlertCircle className="h-16 w-16 text-amber-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <Activity className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/40">MÜŞTERİ ARIZA BEYANI</h3>
                                </div>
                                <p className="text-[12px] font-bold text-amber-900 dark:text-amber-100/90 leading-relaxed italic tracking-tight">
                                    "{ticket.problemDesc}"
                                </p>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                                {/* Center Pane: Workshop */}
                                <div className="space-y-8">
                                    {/* Parts Search */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">PARÇA YÖNETİMİ</h3>
                                            {searchQuery && <span className="text-[10px] text-blue-500 animate-pulse font-bold uppercase">Arama Aktif</span>}
                                        </div>
                                        <div className="relative group">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                placeholder="Ürün adı, SKU veya kategori..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-16 bg-white/[0.03] border-white/5 pl-16 pr-8 rounded-3xl text-sm font-bold text-white placeholder:text-white/10 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                                            />
                                            {searchQuery && (
                                                <div className="absolute top-full left-0 right-0 mt-4 bg-[#111112] border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] max-h-[500px] overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                                                        {searchResults.length > 0 ? (
                                                            searchResults.map(p => (
                                                                <button key={p.id} onClick={() => handleAddPart(p)} className="w-full p-5 flex items-center justify-between hover:bg-white/5 active:scale-[0.98] rounded-[1.5rem] transition-all group/item border border-transparent hover:border-white/5">
                                                                    <div className="flex flex-col text-left gap-1.5">
                                                                        <span className="text-sm font-bold text-white/80 group-hover/item:text-blue-400 transition-colors">{p.name}</span>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={cn(
                                                                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                                                                p.stock > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                                            )}>
                                                                                STOK: {p.stock}
                                                                            </div>
                                                                            <span className="text-[10px] text-white/20 font-mono italic">{p.sku}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <span className="text-sm font-black text-blue-500">{formatCurrency(p.sellPrice, true)}</span>
                                                                        <ArrowRight className="h-4 w-4 text-white/10 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all" />
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-12 text-center space-y-4">
                                                                <Box className="h-12 w-12 text-white/5 mx-auto" />
                                                                <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Arama sonucu bulunamadı</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(null);
                                                            setIsAddingManual(true);
                                                            setManualPart(prev => ({ ...prev, name: searchQuery }));
                                                        }}
                                                        className="w-full p-6 flex items-center gap-4 bg-blue-600 hover:bg-blue-500 transition-all group/new text-left shadow-2xl relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-blue-400/10 translate-y-full group-hover/new:translate-y-0 transition-transform duration-500" />
                                                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-white relative z-10">
                                                            <Plus className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">SİSTEM DIŞI EKLE</span>
                                                            <span className="text-[10px] text-white/60 font-medium tracking-tight">Parçayı tedarikçiden borç olarak temin et</span>
                                                        </div>
                                                        <ArrowRightCircle className="h-6 w-6 text-white ml-auto group-hover/new:translate-x-1 transition-transform relative z-10" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {/* Used Parts List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 truncate">KULLANILAN MATERYALLER</h3>
                                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <span className="text-[10px] font-black text-emerald-500 tabular-nums">{formatCurrency(partsTotal, true)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                                            {ticket.usedParts?.length === 0 ? (
                                                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20">
                                                    <Box className="h-10 w-10 mb-2" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Henüz parça eklenmedi</p>
                                                </div>
                                            ) : (
                                                ticket.usedParts?.map((p: any) => (
                                                    <div key={p.id} className="group relative p-6 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] hover:bg-white/[0.04] transition-all flex flex-col md:flex-row md:items-center gap-6">
                                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                                            <div className="h-16 w-16 rounded-[1.5rem] bg-white/[0.03] flex items-center justify-center border border-white/[0.05] shadow-lg group-hover:scale-105 transition-transform group-hover:text-blue-500">
                                                                <Box className="h-8 w-8 text-blue-500/40" />
                                                            </div>
                                                            <div className="min-w-0 space-y-1">
                                                                <p className="text-base font-bold text-white/90 truncate">{p.product?.name || p.name}</p>
                                                                <p className="text-[10px] font-mono text-white/20 tracking-tighter uppercase">{p.product?.sku || "ÖZEL KALEM"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[8px] font-black text-white/10 uppercase text-center tracking-widest">Maliyet</span>
                                                                <PriceInput
                                                                    value={Number(p.costPrice)}
                                                                    onChange={(v) => handleUpdatePart(p.id, { costPrice: v })}
                                                                    className="h-10 w-28 bg-black/40 border-white/10 text-amber-500/80 font-bold text-center text-xs rounded-xl"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[8px] font-black text-white/10 uppercase text-center tracking-widest">Satış</span>
                                                                <PriceInput
                                                                    value={Number(p.unitPrice)}
                                                                    onChange={(v) => handleUpdatePart(p.id, { unitPrice: v })}
                                                                    className="h-10 w-28 bg-black/40 border-white/10 text-emerald-500 font-bold text-center text-xs rounded-xl"
                                                                />
                                                            </div>
                                                            <Button onClick={() => handleRemovePart(p.id)} variant="ghost" size="icon" className="h-10 w-10 text-rose-500/10 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all self-end">
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Actions & Logs */}
                                <div className="space-y-10 border-l border-white/5 pl-0 xl:pl-10">
                                    {/* Status & Technical Note */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30">İŞLEM MERKEZİ</h3>
                                            {selectedStatus && <span className="text-[10px] text-amber-500 animate-bounce font-black uppercase">Onay Bekliyor</span>}
                                        </div>

                                        <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] space-y-7">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Akış Durumu</p>
                                                <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as ServiceStatus)}>
                                                    <SelectTrigger className="h-14 bg-black/40 border-white/10 rounded-2xl text-xs font-bold text-white/80 focus:ring-blue-500/20">
                                                        <SelectValue placeholder="Durumu güncelle..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#0F172A] border-white/10 text-white rounded-[1.5rem] p-2 backdrop-blur-3xl shadow-2xl">
                                                        {Object.entries(statusConfig).map(([key, config]) => (
                                                            <SelectItem key={key} value={key} className="py-4 px-4 rounded-xl focus:bg-white/5 cursor-pointer">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]", config.dot)} />
                                                                    <span className="font-bold text-white/70">{config.label}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="relative group">
                                                <Textarea
                                                    placeholder="Operasyon notu ekleyin..."
                                                    value={techNote}
                                                    onChange={(e) => setTechNote(e.target.value)}
                                                    className="h-32 bg-black/40 border-white/10 rounded-2xl p-5 text-sm font-medium text-white/80 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all resize-none placeholder:text-white/10"
                                                />
                                                {(techNote.trim() || (selectedStatus && selectedStatus !== ticket.status)) && (
                                                    <div className="absolute bottom-4 right-4 animate-in zoom-in-95 fade-in duration-300">
                                                        <Button
                                                            onClick={handleSaveNoteAndStatus}
                                                            disabled={isSavingNote}
                                                            className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl gap-3 shadow-2xl shadow-blue-500/20 group transform transition-all active:scale-95"
                                                        >
                                                            {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110" />}
                                                            KAYDET
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Context */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">DİJİTAL SEYİR DEFTERİ</h3>
                                            <span className="text-[9px] font-bold text-white/20 uppercase bg-white/5 px-3 py-1 rounded-full">{ticket.logs?.length || 0} ADIM</span>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto no-scrollbar relative p-2 pr-4 space-y-8">
                                            {/* Journey Line with Animation */}
                                            <div className="absolute left-[34px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/80 via-white/[0.05] to-transparent shadow-[0_0_15px_rgba(59,130,246,0.2)]" />

                                            {ticket.logs?.map((log: any, i: number) => {
                                                const isStatusLog = log.message.includes("Durum güncellendi");
                                                return (
                                                    <div key={log.id}
                                                        className={cn(
                                                            "relative flex gap-6 group transform transition-all duration-500",
                                                            i === 0 ? "translate-x-0" : "hover:translate-x-1"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-14 w-14 rounded-2xl border flex items-center justify-center shrink-0 z-10 transition-all duration-500",
                                                            i === 0 ? "bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-110" :
                                                                isStatusLog ? "bg-amber-600/10 border-amber-500/20 text-amber-500" :
                                                                    "bg-zinc-900 border-white/5 group-hover:border-white/20 group-hover:bg-zinc-800"
                                                        )}>
                                                            {i === 0 ? <Check className="h-5 w-5 text-white animate-pulse" /> :
                                                                isStatusLog ? <Timer className="h-4 w-4" /> :
                                                                    <Target className="h-4 w-4 text-white/20" />}
                                                        </div>
                                                        <div className="flex flex-col gap-2 pt-1 flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className={cn("text-[9px] font-black uppercase tracking-[0.25em]", i === 0 ? "text-blue-400" : "text-white/20")}>
                                                                    {format(new Date(log.createdAt), "dd MMM, HH:mm", { locale: tr })}
                                                                </span>
                                                                {i === 0 && (
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                                                        <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                                                                        <span className="text-[8px] text-blue-500 font-black uppercase">AKTİF ADIM</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={cn(
                                                                "p-5 rounded-[1.8rem] border transition-all duration-500",
                                                                i === 0 ? "bg-blue-500/5 border-blue-500/20 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)]" : "bg-white/[0.01] border-white/5 group-hover:bg-white/[0.03] group-hover:border-white/10"
                                                            )}>
                                                                <p className={cn("text-xs leading-relaxed font-semibold", i === 0 ? "text-white" : "text-white/40 group-hover:text-white/70 transition-colors")}>
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
                        </div>

                        {/* Financial Footer Workstation */}
                        <div className="h-32 md:h-40 bg-[#0F172A]/80 border-t border-white/[0.05] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-2xl shrink-0">
                            <div className="flex items-center gap-10">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em] ml-1">KODLAMA & İŞÇİLİK</p>
                                    <div className="relative group">
                                        <PriceInput
                                            value={laborCost}
                                            onChange={(v) => {
                                                setLaborCost(v);
                                                updateServiceCost(ticket.id, Math.round(Number(ticket.estimatedCost) * 100) / 100, Math.round(v * 100) / 100);
                                            }}
                                            className="h-14 w-44 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-6 text-lg font-black text-slate-900 dark:text-white focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="hidden md:block h-12 w-px bg-white/[0.03]" />

                                <div className="space-y-1.5 flex flex-col items-center md:items-start">
                                    <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.3em]">HAKEDİŞ ÖZETİ</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{formatCurrency(grandTotal, true)}</span>
                                        {applyLoyaltyDiscount && (
                                            <span className="text-sm font-bold text-rose-500/60 line-through">{formatCurrency(subtotal, true)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {ticket.customer?.loyaltyPoints > 0 && (
                                    <button
                                        onClick={() => {
                                            if (!loyaltySettings.enabled) {
                                                setShowEnableLoyaltyConfirm(true);
                                                return;
                                            }
                                            setApplyLoyaltyDiscount(!applyLoyaltyDiscount);
                                        }}
                                        className={cn(
                                            "h-16 px-8 rounded-3xl border transition-all flex flex-col items-center justify-center gap-1 group",
                                            applyLoyaltyDiscount
                                                ? "bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)] text-white"
                                                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles className={cn("h-4 w-4", applyLoyaltyDiscount ? "text-white" : "text-blue-500")} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Cüzdan: {ticket.customer.loyaltyPoints} Puan
                                            </span>
                                        </div>
                                        {applyLoyaltyDiscount ? (
                                            <span className="text-[9px] font-bold opacity-60">-{formatCurrency(loyaltyDiscountAmount, true)} İndirim</span>
                                        ) : (
                                            <span className="text-[9px] font-bold opacity-40">+{loyaltyDiscountAmount || ticket.customer.loyaltyPoints * loyaltySettings.pointValue} TL Mevcut</span>
                                        )}
                                    </button>
                                )}

                                <div className="flex gap-3 relative flex-1 md:flex-none">
                                    {(!hasNewModifications && ticket.status === "DELIVERED") && (
                                        <div className="absolute inset-0 bg-black/60 shadow-inner backdrop-blur-md z-[60] rounded-[2rem] flex items-center justify-center border border-dashed border-white/20">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">İŞLEM TAHSİL EDİLDİ</span>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => handleStatusUpdate("DELIVERED", "CASH", applyLoyaltyDiscount ? loyaltyDiscountAmount : 0)}
                                        disabled={ticket.status !== "READY" || (!hasNewModifications && ticket.status === "DELIVERED")}
                                        className={cn(
                                            "h-16 px-10 rounded-3xl transition-all font-black text-[11px] uppercase tracking-widest gap-4",
                                            ticket.status === "READY"
                                                ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                                : "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                                        )}
                                    >
                                        <Check className="h-5 w-5" /> TAHSİL & TESLİM
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate("DELIVERED", "DEBT", applyLoyaltyDiscount ? loyaltyDiscountAmount : 0)}
                                        disabled={ticket.status !== "READY" || (!hasNewModifications && ticket.status === "DELIVERED")}
                                        className={cn(
                                            "h-16 px-10 rounded-3xl transition-all font-black text-[11px] uppercase tracking-widest gap-4",
                                            ticket.status === "READY"
                                                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-2xl shadow-amber-500/20"
                                                : "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                                        )}
                                    >
                                        <Wallet className="h-5 w-5" /> VERESİYE
                                    </Button>
                                </div>
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

            < AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} >
                <AlertDialogContent className="bg-[#0F172A] border-white/10 text-white rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kaydı Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/40">
                            Bu işlem geri alınamaz. Cihaza eklenen parçalar varsa stoğa iade edilecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                            onClick={async () => {
                                setIsDeleting(true);
                                try {
                                    const res = await deleteServiceTicket(ticket.id);
                                    if (res.success) {
                                        toast.success("Servis kaydı başarıyla silindi.");
                                        onClose();
                                    } else {
                                        toast.error(res.error || "Silme işlemi sırasında bir hata oluştu.");
                                    }
                                } catch (error) {
                                    toast.error("Silme işlemi sırasında bir hata oluştu.");
                                } finally {
                                    setIsDeleting(false);
                                    setShowDeleteConfirm(false);
                                }
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >

            <AlertDialog open={showEnableLoyaltyConfirm} onOpenChange={setShowEnableLoyaltyConfirm}>
                <AlertDialogContent className="bg-[#0F172A] border-white/10 text-white rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sadakat Sistemini Aktif Et</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/40">
                            Müşteri sadakat sistemi şu anda kapalı. Sadakat indirimini uygulamak için sistemi aktif etmek ister misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            onClick={async () => {
                                try {
                                    const res = await updateSetting("loyalty_enabled", "true", true);
                                    if (res.success) {
                                        toast.success("Sadakat sistemi aktif edildi.");
                                        queryClient.invalidateQueries({ queryKey: ["settings"] });
                                        setApplyLoyaltyDiscount(true);
                                    } else {
                                        toast.error("İşlem başarısız.");
                                    }
                                } catch (error) {
                                    toast.error("Bir hata oluştu.");
                                } finally {
                                    setShowEnableLoyaltyConfirm(false);
                                }
                            }}
                        >
                            Evet, Aktif Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isAddingManual} onOpenChange={setIsAddingManual} key={isAddingManual ? "open" : "closed"}>
                <DialogContent className="max-w-md bg-[#0F172A] border-white/10 rounded-[2rem] p-8 shadow-2xl z-[10001]">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <Plus className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-white">Sistem Dışı Parça Ekle</h3>
                                <p className="text-xs text-white/40">Tedarikçiden borç olarak parça temin et</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Parça Adı</label>
                                <Input
                                    value={manualPart.name}
                                    onChange={e => setManualPart({ ...manualPart, name: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Maliyet Birimi</label>
                                    <Select value={manualPart.currency} onValueChange={(v: any) => setManualPart({ ...manualPart, currency: v })}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0F172A] border-white/10 text-white rounded-xl z-[10002]">
                                            <SelectItem value="TRY">TRY (₺)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Birim Maliyet</label>
                                    <PriceInput
                                        value={manualPart.currency === "USD" ? Number(manualPart.buyPriceUsd) : Number(manualPart.buyPrice)}
                                        onChange={v => {
                                            if (manualPart.currency === "USD") {
                                                setManualPart({ ...manualPart, buyPriceUsd: String(v), buyPrice: String(v * (rates?.usd || 1)) });
                                            } else {
                                                setManualPart({ ...manualPart, buyPrice: String(v), buyPriceUsd: String(v / (rates?.usd || 1)) });
                                            }
                                        }}
                                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Tedarikçi</label>
                                <Select value={manualPart.supplierId} onValueChange={v => setManualPart({ ...manualPart, supplierId: v })}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold">
                                        <SelectValue placeholder="Tedarikçi seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0F172A] border-white/10 text-white rounded-xl z-[10002]">
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Garanti Süresi</label>
                                <Select value={manualPart.warrantyType} onValueChange={(v: any) => setManualPart({ ...manualPart, warrantyType: v })}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0F172A] border-white/10 text-white rounded-xl z-[10002]">
                                        <SelectItem value="15_DAYS">15 Gün</SelectItem>
                                        <SelectItem value="1_MONTH">1 Ay</SelectItem>
                                        <SelectItem value="3_MONTHS">3 Ay</SelectItem>
                                        <SelectItem value="6_MONTHS">6 Ay</SelectItem>
                                        <SelectItem value="MANUAL">Özel (Gün)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {manualPart.warrantyType === "MANUAL" && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Kaç Gün?</label>
                                    <Input
                                        type="number"
                                        value={manualPart.warrantyValue}
                                        onChange={e => setManualPart({ ...manualPart, warrantyValue: e.target.value })}
                                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold focus:ring-blue-500/20"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setIsAddingManual(false)} className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all">İptal</Button>
                            <Button
                                onClick={handleCreateAndAddPart}
                                disabled={loading}
                                className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest shadow-xl shadow-blue-500/20 gap-3"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                EKLE
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog >
    );
}





