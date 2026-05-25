"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2,
    ArrowLeft,
    Printer,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InvoiceDetail = {
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
    edmError: string | null;
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
    sale: { id: string; totalAmount: number; createdAt: string } | null;
    serviceTicket: { id: string; deviceBrand: string; deviceModel: string; status: string } | null;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    DRAFT: { label: "Taslak", color: "bg-muted text-muted-foreground", icon: Clock },
    PENDING: { label: "Beklemede", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    SENT: { label: "Gönderildi", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
    ERROR: { label: "Hata", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    CANCELLED: { label: "İptal", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: XCircle },
};

export default function EfaturaDetayPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        loadInvoice();
    }, [params.id]);

    async function loadInvoice() {
        setLoading(true);
        try {
            const res = await fetch(`/api/edm/invoices/${params.id}`);
            const data = await res.json();
            if (res.ok) {
                setInvoice(data.invoice);
            } else {
                toast.error(data.error || "Fatura yüklenemedi.");
            }
        } catch {
            toast.error("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!confirm("Bu faturayı iptal etmek istediğinize emin misiniz?")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/edm/invoices/${params.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Fatura iptal edildi.");
                router.push("/efatura");
            } else {
                toast.error(data.error || "İptal başarısız.");
            }
        } catch {
            toast.error("Bağlantı hatası.");
        } finally {
            setDeleting(false);
        }
    }

    function handlePrint() {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
            iframe.contentWindow.print();
        }
    }

    function handleDownload() {
        window.open(`/api/edm/invoice/${params.id}/render?download=1`, "_blank");
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground">Fatura bulunamadı</h2>
                    <Button variant="outline" onClick={() => router.push("/efatura")} className="mt-4 rounded-xl">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Faturalara Dön
                    </Button>
                </div>
            </div>
        );
    }

    const status = statusMap[invoice.status] || statusMap.DRAFT;
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-background py-6 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card rounded-2xl shadow-sm border border-border p-4">
                    <Button variant="outline" onClick={() => router.push("/efatura")} className="rounded-xl">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Geri
                    </Button>

                    <div className="flex items-center gap-3">
                        <Badge className={`${status.color} border-0 rounded-lg text-sm px-3 py-1`}>
                            <StatusIcon className="mr-1 h-4 w-4" />
                            {status.label}
                        </Badge>
                        <div className="text-sm font-medium text-muted-foreground">
                            {invoice.invoiceId}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex items-center bg-muted rounded-xl p-1">
                            <button
                                onClick={() => router.push(`/efatura/${invoice.id}`)}
                                className="p-2 rounded-lg hover:bg-background hover:text-primary transition-colors text-muted-foreground"
                                title="Görüntüle"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-2 rounded-lg hover:bg-background hover:text-primary transition-colors text-muted-foreground"
                                title="İndir"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="p-2 rounded-lg hover:bg-background hover:text-primary transition-colors text-muted-foreground"
                                title="Yazdır"
                            >
                                <Printer className="h-4 w-4" />
                            </button>
                        </div>
                        {(invoice.status === "SENT" || invoice.status === "PENDING") && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCancel}
                                disabled={deleting}
                                className="rounded-xl"
                            >
                                {deleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        İptal Et
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Fatura Detay Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Müşteri</h3>
                        <p className="text-foreground font-medium">{invoice.customer?.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customer?.taxNumber || "—"}</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Fatura Bilgileri</h3>
                        <p className="text-foreground font-medium">{invoice.invoiceId}</p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(invoice.issueDate).toLocaleDateString("tr-TR")}
                        </p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Tutar</h3>
                        <p className="text-foreground font-medium text-lg">
                            {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(invoice.totalAmount)}
                            <span className="text-sm ml-0.5">₺</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            KDV: {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(invoice.taxTotal)} ₺
                        </p>
                    </div>
                </div>

                {/* E-Fatura Resmi Önizleme — İzole iframe */}
                <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl shadow-xl overflow-hidden border border-border relative">
                    {iframeLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    <iframe
                        ref={iframeRef}
                        src={`/api/edm/invoice/${invoice.id}/render`}
                        className="w-full h-[1100px] bg-white border-0"
                        title="E-Fatura Resmi Önizleme"
                        onLoad={() => setIframeLoading(false)}
                        sandbox="allow-same-origin allow-scripts"
                    />
                </div>
            </div>
        </div>
    );
}
