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
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Invoice {
    id: string;
    uuid: string;
    invoiceId: string;
    type: string;
    status: string;
    totalAmount: number;
    currency: string;
    issueDate: string;
    customer: {
        name: string;
        taxNumber: string | null;
    } | null;
    lines?: { name: string }[];
}

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    DRAFT: { label: "Taslak", color: "bg-muted text-muted-foreground", icon: Clock },
    PENDING: { label: "Beklemede", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    SENT: { label: "Gönderildi", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
    ERROR: { label: "Hata", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    CANCELLED: { label: "İptal", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: XCircle },
};

export function EDMDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewLink, setViewLink] = useState<string | null>(null);

    async function loadInvoices() {
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
        loadInvoices();
    }, []);

    const filteredInvoices = invoices.filter((inv) => {
        const term = search.toLowerCase();
        return (
            inv.customer?.name?.toLowerCase().includes(term) ||
            inv.invoiceId?.toLowerCase().includes(term)
        );
    });

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function handlePreview(invoice: Invoice) {
        // Artık backend'deki proxied render route'unu kullanıyoruz.
        // Bu sayede hem VKN veritabanından çekiliyor hem de iframe bloklaması (CSP) aşılıyor.
        setViewLink(`/api/edm/invoice/${invoice.id}/render`);
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight italic">
                        e-Fatura Merkezi
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        SaaS Entegrasyonu • {invoices.length} Kayıtlı Belge
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/efatura/yeni")}
                    className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 font-bold text-lg"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Fatura Oluştur
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <Input
                    placeholder="Müşteri adı veya fatura numarası ile filtrele..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-14 h-16 bg-white dark:bg-zinc-950 border-none rounded-3xl shadow-xl shadow-black/5 text-lg font-medium placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                />
            </div>

            {/* Invoice List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                        <p className="text-muted-foreground font-medium animate-pulse">Belgeler taranıyor...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/50">
                        <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FileText className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground/50">Henüz fatura bulunamadı</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                            Yeni bir satış yaparak e-fatura veya e-arşiv belgesi oluşturabilirsiniz.
                        </p>
                    </div>
                ) : (
                    filteredInvoices.map((invoice) => {
                        const status = statusMap[invoice.status] || statusMap.DRAFT;
                        const StatusIcon = status.icon;
                        const isSent = invoice.status === "SENT";

                        return (
                            <div
                                key={invoice.id}
                                className={`
                                    group bg-white dark:bg-zinc-950 rounded-[2.2rem] p-6
                                    transition-all duration-300 ease-out
                                    border border-border/50 hover:border-primary/30
                                    hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1
                                    flex flex-col md:flex-row items-center gap-6
                                `}
                            >
                                {/* Icon */}
                                <div className={`
                                    w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
                                    ${isSent ? "bg-emerald-500/10" : "bg-muted/50"}
                                `}>
                                    <FileText className={`h-8 w-8 ${isSent ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-foreground">
                                            {invoice.customer?.name || "Bilinmeyen Müşteri"}
                                        </h3>
                                        <span className={`
                                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter
                                            ${status.color}
                                        `}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground/40 bg-muted px-2 py-1 rounded-lg">
                                            {invoice.invoiceId || "TASLAK"}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                        {formatDate(invoice.issueDate)}
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        {invoice.type.toUpperCase()}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="text-center md:text-right flex-shrink-0 min-w-[120px]">
                                    <p className="text-2xl font-black text-foreground tabular-nums">
                                        {new Intl.NumberFormat("tr-TR", {
                                            minimumFractionDigits: 2,
                                        }).format(invoice.totalAmount)}
                                        <span className="text-sm ml-1 text-muted-foreground">₺</span>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                        onClick={() => handlePreview(invoice)}
                                        variant="outline"
                                        className="rounded-2xl h-12 w-12 p-0 border-border/50 hover:bg-primary/10 hover:text-primary transition-all"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => window.open(`/api/edm/invoice/${invoice.id}/render`, "_blank")}
                                        variant="outline"
                                        className="rounded-2xl h-12 w-12 p-0 border-border/50 hover:bg-violet-500/10 hover:text-violet-500 transition-all font-bold"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Iframe Preview Modal */}
            <Dialog open={!!viewLink} onOpenChange={(open) => !open && setViewLink(null)}>
                <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 bg-transparent border-none">
                    <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <DialogHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-violet-500" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold tracking-tight">Orijinal Fatura Görüntüleyici</DialogTitle>
                                    <p className="text-sm text-muted-foreground font-medium">EDM Bilişim Resmi Belge Çıktısı</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mr-10">
                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold h-10 px-4 gap-2"
                                    onClick={() => window.open(viewLink!, "_blank")}
                                >
                                    <Printer className="h-4 w-4" />
                                    Yazdır
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 bg-muted/10 relative">
                            {viewLink && (
                                <iframe
                                    src={viewLink}
                                    className="w-full h-full border-none"
                                    title="Invoice Preview"
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
