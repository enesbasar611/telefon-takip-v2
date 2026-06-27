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
import { LogOut, Trash2 } from "lucide-react";
import { disconnectEdm, deleteEdmSettings } from "@/lib/actions/edm-settings-actions";
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

export function EDMDashboard({ onLogout }: { onLogout?: () => void }) {
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
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (confirm("EDM oturumunu kapatmak istediğinize emin misiniz?")) {
                                await disconnectEdm();
                                onLogout?.();
                            }
                        }}
                        className="rounded-2xl border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-14 px-6 font-bold"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        Oturumu Kapat
                    </Button>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (confirm("TÜM EDM ayarlarınız silinecek. Emin misiniz?")) {
                                await deleteEdmSettings();
                                onLogout?.();
                            }
                        }}
                        className="rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500/10 h-14 px-6 font-bold"
                    >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Bilgileri Sil
                    </Button>
                    <Button
                        onClick={() => router.push("/efatura/yeni")}
                        className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 font-bold text-lg"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Yeni Fatura Oluştur
                    </Button>
                </div>
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
                                            {invoice.customer?.name || (invoice as any).customerName || "Bilinmeyen Müşteri"}
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
                <DialogContent className="max-w-[95vw] w-[1300px] h-[92vh] p-0 bg-transparent border-none overflow-hidden shadow-none">
                    <div className="w-full h-full bg-slate-50 dark:bg-zinc-950 rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
                        {/* Modern Action Bar */}
                        <div className="p-4 md:p-6 border-b border-border/50 flex flex-col md:flex-row items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <DialogTitle className="text-xl font-bold tracking-tight">Fatura Önizleme</DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Resmi EDM Belgesi</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-2xl font-bold h-11 px-5 gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 transition-all active:scale-95"
                                    onClick={() => {
                                        const text = `Faturanız hazır, bu bağlantıdan görüntüleyebilirsiniz: ${window.location.origin}${viewLink}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                                    }}
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.12.554 4.189 1.604 6.03L0 24l6.117-1.605c1.777.969 3.774 1.48 5.811 1.482h.005c6.634 0 12.032-5.396 12.035-12.032a11.85 11.85 0 00-3.48-8.487z" />
                                    </svg>
                                    WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl font-bold h-11 px-5 gap-2 border-red-500/20 text-red-600 hover:bg-red-500/10 transition-all active:scale-95"
                                    onClick={() => window.open(viewLink!, "_blank")}
                                >
                                    <Download className="h-5 w-5" />
                                    PDF / İndir
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl font-bold h-11 px-5 gap-2 border-primary/20 text-primary hover:bg-primary/10 transition-all active:scale-95"
                                    onClick={() => window.open(viewLink!, "_blank")}
                                >
                                    <Printer className="h-5 w-5" />
                                    Yazdır
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="rounded-2xl w-11 h-11 p-0 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90"
                                    onClick={() => setViewLink(null)}
                                >
                                    <XCircle className="h-6 w-6 text-muted-foreground/50" />
                                </Button>
                            </div>
                        </div>

                        {/* Iframe Content Area */}
                        <div className="flex-1 bg-white relative overflow-hidden">
                            {viewLink && (
                                <div className="w-full h-full relative group">
                                    <iframe
                                        src={viewLink}
                                        className="w-full h-full border-none bg-white scale-[1.0] origin-top transition-transform duration-500"
                                        title="Invoice Preview"
                                        onLoad={() => {
                                            // Iframe yüklendiğinde bir ses veya görsel efekt eklenebilir
                                        }}
                                    />
                                    {/* Overlay for loading state if needed */}
                                    <div className="absolute inset-0 pointer-events-none border-[12px] border-white dark:border-zinc-950 rounded-b-[3rem] z-10" />
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-muted/30 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                                Bu belge EDM Bilişim güvencesiyle oluşturulmuştur.
                                <span className="mx-2">•</span>
                                © {new Date().getFullYear()} SaaS Elektronik Fatura Sistemi
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
