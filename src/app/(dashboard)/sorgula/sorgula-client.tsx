"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    Smartphone,
    ShieldCheck,
    Loader2,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Wrench,
    Phone,
    MessageCircle,
    Printer,
    ExternalLink,
    Copy,
    Check,
    Zap,
    Sparkles,
    User,
    Box,
    X,
    SlidersHorizontal,
    QrCode,
    RefreshCw,
    Lock,
    PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { searchServiceTicketsQuick, getRecentServiceTickets, getServiceTicketById } from "@/lib/actions/service-actions";
import { ServiceManagementModal } from "@/components/service/service-management-modal";
import { ServiceReceiptModal } from "@/components/service/service-receipt-modal";
import { cn, formatPhone } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any; desc: string }> = {
    PENDING: {
        label: "BEKLEMEDE",
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        icon: Clock,
        desc: "Cihaz servis sırasına alındı, inceleme bekleniyor."
    },
    APPROVED: {
        label: "ONAYLANDI",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: CheckCircle2,
        desc: "Müşteri onayı alındı, işlem sırasına girdi."
    },
    REPAIRING: {
        label: "TAMİRDE",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        icon: Wrench,
        desc: "Teknisyen şu an cihaz üzerinde onarım yapıyor."
    },
    WAITING_PART: {
        label: "PARÇA BEKLİYOR",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        icon: Box,
        desc: "Onarım için gerekli yedek parça bekleniyor."
    },
    READY: {
        label: "TESLİME HAZIR",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        icon: Sparkles,
        desc: "Testler tamamlandı, cihaz teslime hazır!"
    },
    DELIVERED: {
        label: "TESLİM EDİLDİ",
        color: "text-zinc-400",
        bg: "bg-zinc-500/10",
        border: "border-zinc-500/30",
        icon: CheckCircle2,
        desc: "Cihaz müşteriye teslim edildi ve servis kapandı."
    },
    CANCELLED: {
        label: "İPTAL EDİLDİ",
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        icon: AlertCircle,
        desc: "Servis işlemi iptal edildi veya iade edildi."
    },
};

interface SorgulaClientProps {
    initialRecentTickets?: any[];
}

export function SorgulaClient({ initialRecentTickets = [] }: SorgulaClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [query, setQuery] = useState(searchParams.get("q") || searchParams.get("ticket") || "");
    const [ticketNumber, setTicketNumber] = useState(searchParams.get("ticket") || "");
    const [phone, setPhone] = useState(searchParams.get("phone") || "");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isDetailed, setIsDetailed] = useState(false);

    const [results, setResults] = useState<any[]>(initialRecentTickets);
    const [hasSearched, setHasSearched] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Modals
    const [selectedTicketForManage, setSelectedTicketForManage] = useState<any | null>(null);
    const [isQuickDeliver, setIsQuickDeliver] = useState(false);
    const [selectedTicketForReceipt, setSelectedTicketForReceipt] = useState<any | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Perform search
    const executeSearch = useCallback((overrideQuery?: string, overrideFilter?: string) => {
        const activeQuery = overrideQuery !== undefined ? overrideQuery : query;
        const activeFilter = overrideFilter !== undefined ? overrideFilter : statusFilter;

        startTransition(async () => {
            const data = await searchServiceTicketsQuick({
                query: activeQuery,
                ticketNumber: isDetailed ? ticketNumber : undefined,
                phone: isDetailed ? phone : undefined,
                statusFilter: activeFilter,
                limit: 30,
            });

            setResults(data);
            setHasSearched(true);
        });
    }, [query, ticketNumber, phone, isDetailed, statusFilter]);

    // Handle auto-search from query param on mount
    useEffect(() => {
        const initialQ = searchParams.get("q") || searchParams.get("ticket") || searchParams.get("phone");
        if (initialQ) {
            executeSearch(initialQ);
        }
    }, [searchParams, executeSearch]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch();
    };

    const handleFilterChange = (newFilter: string) => {
        setStatusFilter(newFilter);
        executeSearch(undefined, newFilter);
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Kopyalandı: " + text);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleWhatsApp = (ticket: any) => {
        const rawPhone = ticket.customer?.phone || "";
        const clean = rawPhone.replace(/[^0-9]/g, "");
        if (!clean) {
            toast.error("Müşteri telefon numarası bulunamadı.");
            return;
        }

        const phoneWithCode = clean.startsWith("90")
            ? clean
            : clean.startsWith("0")
                ? `9${clean}`
                : `90${clean}`;

        const statusInfo = statusConfig[ticket.status] || { label: ticket.status };
        const messageText = `Sayın ${ticket.customer?.name || "Müşterimiz"}, ${ticket.ticketNumber} numaralı ${ticket.deviceBrand} ${ticket.deviceModel} cihazınızın güncel servis durumu: *${statusInfo.label}*.\n\nDetaylı bilgi için servisimizle iletişime geçebilirsiniz.`;

        window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(messageText)}`, "_blank");
    };

    const refreshTicket = async (ticketId: string) => {
        const fresh = await getServiceTicketById(ticketId);
        if (fresh) {
            setResults((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
        } else {
            executeSearch();
        }
    };

    return (
        <div className="w-full space-y-4 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 shadow-sm shrink-0">
                        <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Cihaz & Servis Sorgulama</h1>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Canlı
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                            Fiş numarası, müşteri telefonu, IMEI veya isimle anlık teknik servis sorgusu ve aksiyonları
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setQuery("");
                            setTicketNumber("");
                            setPhone("");
                            setStatusFilter("ALL");
                            setHasSearched(false);
                            startTransition(async () => {
                                const recent = await getRecentServiceTickets(8);
                                setResults(recent);
                            });
                        }}
                        className="h-8 text-xs gap-1.5 rounded-xl border-border/50 hover:bg-muted/50"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
                        <span>Sıfırla</span>
                    </Button>
                    <Link href="/servis">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs gap-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Teknik Servis Masası</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search Box Card */}
            <Card className="border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-3.5 sm:p-5 space-y-3.5">
                    <form onSubmit={handleFormSubmit} className="space-y-3">
                        {!isDetailed ? (
                            /* Unified Smart Search */
                            <div className="relative flex items-center">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Servis No (SRV-1001), Cep Telefonu (5xx...), IMEI veya Müşteri Adı..."
                                    className="pl-10 pr-24 h-12 text-sm sm:text-base rounded-xl bg-background/60 border-border/60 focus-visible:ring-blue-500/50"
                                    autoFocus
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        className="absolute right-20 text-muted-foreground hover:text-foreground p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="absolute right-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sorgula"}
                                </Button>
                            </div>
                        ) : (
                            /* Detailed Multi-Field Search */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                                        Servis / Fiş Numarası
                                    </label>
                                    <Input
                                        value={ticketNumber}
                                        onChange={(e) => setTicketNumber(e.target.value)}
                                        placeholder="Örn: SRV-1001"
                                        className="h-10 text-xs sm:text-sm rounded-xl bg-background/60"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                                        Müşteri Telefon Numarası
                                    </label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Örn: 0532 000 00 00"
                                        className="h-10 text-xs sm:text-sm rounded-xl bg-background/60"
                                    />
                                </div>
                                <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs"
                                    >
                                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
                                        Ayrıntılı Sorgula
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                            {/* Filter Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[80%] scrollbar-none">
                                {[
                                    { id: "ALL", label: "Tümü" },
                                    { id: "ACTIVE", label: "Aktif İşlemler" },
                                    { id: "READY", label: "Hazır (Teslim Bekleyen)" },
                                    { id: "REPAIRING", label: "Tamirde" },
                                    { id: "WAITING_PART", label: "Parça Bekleyen" },
                                    { id: "DELIVERED", label: "Teslim Edilenler" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleFilterChange(tab.id)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors",
                                            statusFilter === tab.id
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsDetailed(!isDetailed)}
                                className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 ml-2"
                            >
                                <SlidersHorizontal className="h-3 w-3" />
                                <span className="hidden sm:inline">{isDetailed ? "Hızlı Arama" : "Ayrıntılı Filtre"}</span>
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Results Title Banner */}
            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                        {hasSearched ? "Arama Sonuçları" : "Son Servis Kayıtları"}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-md">
                        {results.length} Kayıt
                    </Badge>
                </div>
                {hasSearched && query && (
                    <span className="truncate max-w-[200px]">
                        "{query}" için sonuçlar
                    </span>
                )}
            </div>

            {/* No Results */}
            {hasSearched && results.length === 0 && !isPending && (
                <div className="border border-rose-500/20 bg-rose-500/5 p-8 rounded-2xl text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                    <p className="text-sm font-semibold text-rose-400">Eşleşen Servis Kaydı Bulunamadı</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Girdiğiniz fiş numarası, telefon veya IMEI numarasını kontrol ederek tekrar deneyiniz.
                    </p>
                </div>
            )}

            {/* Loading Skeleton */}
            {isPending && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-56 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Service Cards Grid - 2 columns on tablet/desktop, 1 column compact on mobile */}
            {!isPending && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {results.map((ticket) => {
                        const status = statusConfig[ticket.status] || {
                            label: ticket.status,
                            color: "text-muted-foreground",
                            bg: "bg-muted/30",
                            border: "border-border",
                            icon: Clock,
                            desc: "",
                        };
                        const StatusIcon = status.icon;

                        const isReadyForDelivery = ticket.status === "READY" || ticket.status === "REPAIRING";
                        const hasPassword = Boolean(ticket.devicePassword);

                        return (
                            <Card
                                key={ticket.id}
                                className="group relative border border-border/40 bg-card/70 hover:bg-card/95 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between"
                            >
                                <CardContent className="p-4 sm:p-5 space-y-3.5">
                                    {/* Top Row: Ticket Number + Status Badge */}
                                    <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(ticket.ticketNumber, ticket.id)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 hover:bg-background border border-border/60 text-xs font-mono font-bold text-foreground transition-colors"
                                                title="Fiş numarasını kopyala"
                                            >
                                                <span>{ticket.ticketNumber}</span>
                                                {copiedId === ticket.id ? (
                                                    <Check className="h-3 w-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </button>
                                            {ticket.createdAt && (
                                                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                                    {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: tr })}
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border",
                                                status.bg,
                                                status.color,
                                                status.border
                                            )}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            <span>{status.label}</span>
                                        </div>
                                    </div>

                                    {/* Middle: Device & Customer Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Device Column */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <Smartphone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                <span className="truncate">{ticket.deviceBrand} {ticket.deviceModel}</span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-mono truncate pl-5">
                                                IMEI: {ticket.imei || "Belirtilmedi"}
                                            </div>
                                            {hasPassword && (
                                                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono pl-5">
                                                    <Lock className="h-3 w-3" />
                                                    <span>Şifre/Desen: {ticket.devicePassword}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Customer Column */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                <span className="truncate">{ticket.customer?.name || "Bilinmiyor"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 pl-5">
                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                    {ticket.customer?.phone ? formatPhone(ticket.customer.phone) : "-"}
                                                </span>
                                                {ticket.customer?.phone && (
                                                    <a
                                                        href={`tel:${ticket.customer.phone}`}
                                                        className="text-muted-foreground hover:text-emerald-400 p-0.5"
                                                        title="Müşteriyi Ara"
                                                    >
                                                        <PhoneCall className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Problem Description & Cost */}
                                    <div className="rounded-xl bg-background/50 border border-border/30 p-2.5 text-xs space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5 max-w-[70%]">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Arıza / Şikayet:</span>
                                                <p className="text-[11px] text-foreground font-medium line-clamp-2">
                                                    {ticket.problemDesc || "Arıza açıklaması belirtilmedi."}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Tutar:</span>
                                                <p className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                                                    ₺{Number(ticket.estimatedCost || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Toolbar ("ve işlem yapabilelim") */}
                                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                        {/* Primary: Servisi Yönet (Full modal) */}
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setIsQuickDeliver(false);
                                                setSelectedTicketForManage(ticket);
                                            }}
                                            className="h-8 flex-1 min-w-[120px] text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
                                        >
                                            <Wrench className="h-3.5 w-3.5" />
                                            <span>Servisi Yönet</span>
                                        </Button>

                                        {/* Quick Deliver button if ready */}
                                        {isReadyForDelivery && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setIsQuickDeliver(true);
                                                    setSelectedTicketForManage(ticket);
                                                }}
                                                className="h-8 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                                                title="Hızlı Teslim Et ve Ödeme Al"
                                            >
                                                <Zap className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Hızlı Teslim</span>
                                            </Button>
                                        )}

                                        {/* Print Receipt */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedTicketForReceipt(ticket)}
                                            className="h-8 px-2.5 text-xs rounded-xl border-border/60 hover:bg-muted"
                                            title="Servis Fişi Yazdır"
                                        >
                                            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>

                                        {/* Send WhatsApp */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleWhatsApp(ticket)}
                                            className="h-8 px-2.5 text-xs rounded-xl border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400"
                                            title="WhatsApp ile Durum Bildir"
                                        >
                                            <MessageCircle className="h-3.5 w-3.5" />
                                        </Button>

                                        {/* Jump to Service Desk Table */}
                                        <Link href={`/servis?tab=all&search=${ticket.ticketNumber}`}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2.5 text-xs rounded-xl border-border/60 hover:bg-muted"
                                                title="Teknik Servis Masasında Aç"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Service Management Modal */}
            {selectedTicketForManage && (
                <ServiceManagementModal
                    ticket={selectedTicketForManage}
                    isOpen={Boolean(selectedTicketForManage)}
                    isQuickDeliver={isQuickDeliver}
                    onClose={() => {
                        const closedId = selectedTicketForManage?.id;
                        setSelectedTicketForManage(null);
                        setIsQuickDeliver(false);
                        if (closedId) {
                            refreshTicket(closedId);
                        }
                    }}
                />
            )}

            {/* Service Receipt Print Modal */}
            {selectedTicketForReceipt && (
                <ServiceReceiptModal
                    ticket={selectedTicketForReceipt}
                    isOpen={Boolean(selectedTicketForReceipt)}
                    onClose={() => setSelectedTicketForReceipt(null)}
                />
            )}
        </div>
    );
}
