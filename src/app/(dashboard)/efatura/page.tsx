"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    Loader2,
    FileText,
    Plus,
    Eye,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Printer,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Invoice tipi - API'den gelen veriye göre
interface Invoice {
    id: string;
    uuid: string;
    invoiceId: string;
    type: string;
    status: string;
    totalAmount: number;
    subtotal: number;
    taxTotal: number;
    currency: string;
    issueDate: string;
    note: string | null;
    createdAt: string;
    cancelledAt: string | null;
    customer: {
        name: string;
        taxNumber: string | null;
        taxOffice: string | null;
        address: string | null;
    } | null;
    lines: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        vatRate: number;
        vatAmount: number;
    }[];
}

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    DRAFT: { label: "Taslak", color: "bg-muted text-muted-foreground", icon: Clock },
    PENDING: { label: "Beklemede", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    SENT: { label: "Gönderildi", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
    ERROR: { label: "Hata", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    CANCELLED: { label: "İptal", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: XCircle },
};

export default function EfaturaPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [edmActive, setEdmActive] = useState<boolean | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function checkEdmStatus() {
            try {
                const res = await fetch("/api/edm/settings");
                const data = await res.json();
                setEdmActive(data.settings?.edmActive === true || data.edmActive === true);
            } catch {
                setEdmActive(false);
            }
        }
        checkEdmStatus();
    }, []);

    async function loadInvoices() {
        if (edmActive === false) return;
        setLoading(true);
        try {
            const res = await fetch("/api/edm/invoices?limit=100");
            const data = await res.json();
            if (res.ok) {
                setInvoices(data.invoices || []);
            } else {
                toast.error(data.error || "Faturalar yüklenemedi.");
            }
        } catch {
            toast.error("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (edmActive === true) {
            loadInvoices();
        }
    }, [edmActive]);

    const filteredInvoices = invoices.filter((inv) => {
        const term = search.toLowerCase();
        return (
            inv.customer?.name?.toLowerCase().includes(term) ||
            inv.invoiceId?.toLowerCase().includes(term) ||
            inv.lines?.some((l) => l.name.toLowerCase().includes(term))
        );
    });

    function formatDate(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function formatTime(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }

    function handlePrint(invoiceId: string) {
        window.open(`/api/edm/invoice/${invoiceId}/render`, "_blank");
    }

    function handleDownload(invoiceId: string) {
        window.open(`/api/edm/invoice/${invoiceId}/render?download=1`, "_blank");
    }

    if (edmActive === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
            </div>
        );
    }

    if (edmActive === false) {
        const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center max-w-lg">
                    <div className="w-24 h-24 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-border/20">
                        <FileText className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">E-Fatura Pasif</h2>
                    <p className="text-muted-foreground/80 text-lg leading-relaxed mb-8">
                        {isSuperAdmin
                            ? "E-Fatura / E-Arşiv entegrasyonunu dükkanınızda aktifleştirmek için öncelikle EDM Bilişim bağlantı ayarlarını tamamlamalısınız."
                            : "E-Fatura / E-Arşiv entegrasyonunu kullanmak için işletme sahibi veya sistem yöneticinizle iletişime geçin. Bu modül şu an dükkanınız için aktif değildir."}
                    </p>
                    {isSuperAdmin && (
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                onClick={() => router.push("/admin/edm")}
                                className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 h-auto text-lg font-medium shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Ayarlara Git
                            </Button>
                            <p className="text-xs text-muted-foreground/60 italic">
                                Sadece Super Admin olarak bu ayarları görebilirsiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                            Faturalar
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {invoices.length} fatura
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/efatura/yeni")}
                        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11 shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Fatura
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Müşteri adı, ürün veya fatura no ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-12 bg-card border-0 rounded-2xl shadow-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                    />
                </div>

                {/* Invoice List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground">Fatura bulunamadı.</p>
                        </div>
                    ) : (
                        filteredInvoices.map((invoice) => {
                            const status = statusMap[invoice.status] || statusMap.DRAFT;
                            const StatusIcon = status.icon;
                            const firstItem = invoice.lines?.[0];
                            const isSent = invoice.status === "SENT";

                            return (
                                <div
                                    key={invoice.id}
                                    onClick={() => router.push(`/efatura/${invoice.id}`)}
                                    className={`
                                        group bg-card rounded-2xl p-5 cursor-pointer
                                        transition-all duration-200 ease-out
                                        hover:shadow-md
                                        ${isSent ? "border border-emerald-500/30 hover:border-emerald-500" : "border border-border hover:border-border/80"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                                            ${isSent ? "bg-emerald-500/10" : "bg-muted"}
                                        `}>
                                            <FileText className={`h-5 w-5 ${isSent ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-medium text-foreground truncate">
                                                    {invoice.customer?.name || "Müşteri"}
                                                </h3>
                                                <span className={`
                                                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                                    ${status.color}
                                                `}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </div>
                                            {firstItem && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {firstItem.name}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatDate(invoice.issueDate)} • {formatTime(invoice.issueDate)}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-lg font-semibold ${isSent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                                {new Intl.NumberFormat("tr-TR", {
                                                    minimumFractionDigits: 2,
                                                }).format(invoice.totalAmount)}
                                                <span className="text-sm ml-0.5">₺</span>
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <div className="flex items-center bg-muted rounded-xl p-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/efatura/${invoice.id}`);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-background hover:text-primary transition-colors text-muted-foreground"
                                                    title="Görüntüle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(invoice.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-background hover:text-primary transition-colors text-muted-foreground"
                                                    title="İndir"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrint(invoice.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-background hover:text-primary transition-colors text-muted-foreground"
                                                    title="Yazdır"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
