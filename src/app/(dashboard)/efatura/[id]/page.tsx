"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2,
    FileText,
    ArrowLeft,
    Download,
    Printer,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    DRAFT: { label: "Taslak", color: "bg-slate-100 text-slate-700", icon: Clock },
    PENDING: { label: "Beklemede", color: "bg-amber-100 text-amber-700", icon: Clock },
    SENT: { label: "Gönderildi", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    ERROR: { label: "Hata", color: "bg-red-100 text-red-700", icon: AlertCircle },
    CANCELLED: { label: "İptal", color: "bg-rose-100 text-rose-700", icon: XCircle },
};

export default function EfaturaDetayPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

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
        } catch (error) {
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
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setDeleting(false);
        }
    }

    async function handleDownload(format: "html" | "pdf") {
        setDownloading(format);
        try {
            const res = await fetch(`/api/edm/invoices/${params.id}/download?format=${format}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "İndirme başarısız.");
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${invoice?.invoiceId || "fatura"}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`${format.toUpperCase()} indirildi.`);
        } catch (error) {
            toast.error("İndirme hatası.");
        } finally {
            setDownloading(null);
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl p-4 md:p-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="container mx-auto max-w-4xl p-4 md:p-8">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">Fatura bulunamadı</h2>
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
        <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.push("/efatura")} className="rounded-xl">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Geri
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload("html")}
                        disabled={!!downloading}
                        className="rounded-xl"
                    >
                        {downloading === "html" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                HTML
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload("pdf")}
                        disabled={!!downloading}
                        className="rounded-xl"
                    >
                        {downloading === "pdf" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Printer className="mr-2 h-4 w-4" />
                                PDF
                            </>
                        )}
                    </Button>
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

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                                    <FileText className="h-6 w-6 text-slate-500" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">{invoice.invoiceId}</h1>
                                    <div className="text-sm text-slate-500">{invoice.uuid}</div>
                                </div>
                            </div>
                        </div>
                        <Badge className={`${status.color} border-0 rounded-lg text-sm px-3 py-1`}>
                            <StatusIcon className="mr-1 h-4 w-4" />
                            {status.label}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 mb-2">Müşteri Bilgileri</h3>
                            <div className="space-y-1 text-sm">
                                <div><strong>Ad:</strong> {invoice.customer?.name || "—"}</div>
                                <div><strong>VKN/TCKN:</strong> {invoice.customer?.taxNumber || "—"}</div>
                                <div><strong>Vergi Dairesi:</strong> {invoice.customer?.taxOffice || "—"}</div>
                                <div><strong>Adres:</strong> {invoice.customer?.address || "—"}</div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 mb-2">Fatura Bilgileri</h3>
                            <div className="space-y-1 text-sm">
                                <div><strong>Tarih:</strong> {new Date(invoice.issueDate).toLocaleDateString("tr-TR")}</div>
                                <div><strong>Tip:</strong> {invoice.type === "EARCHIVE" ? "e-Arşiv" : "e-Fatura"}</div>
                                <div><strong>Oluşturma:</strong> {new Date(invoice.createdAt).toLocaleDateString("tr-TR")}</div>
                                {invoice.cancelledAt && (
                                    <div><strong>İptal Tarihi:</strong> {new Date(invoice.cancelledAt).toLocaleDateString("tr-TR")}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {invoice.note && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 mb-1">Not</h3>
                                <p className="text-sm">{invoice.note}</p>
                            </div>
                        </>
                    )}

                    {invoice.edmError && (
                        <>
                            <Separator />
                            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20">
                                <strong>EDM Hata Mesajı:</strong>
                                <pre className="mt-1 whitespace-pre-wrap text-xs">{invoice.edmError}</pre>
                            </div>
                        </>
                    )}

                    <Separator />

                    <h3 className="text-sm font-semibold text-slate-500">Fatura Kalemleri</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <th className="text-left py-2 px-3">#</th>
                                    <th className="text-left py-2 px-3">Ürün/Hizmet</th>
                                    <th className="text-center py-2 px-3">Adet</th>
                                    <th className="text-right py-2 px-3">Birim Fiyat</th>
                                    <th className="text-right py-2 px-3">KDV</th>
                                    <th className="text-right py-2 px-3">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines.map((line, i) => (
                                    <tr key={line.id} className="border-b border-slate-100 dark:border-slate-900">
                                        <td className="py-2 px-3">{i + 1}</td>
                                        <td className="py-2 px-3">{line.name}</td>
                                        <td className="text-center py-2 px-3">{line.quantity}</td>
                                        <td className="text-right py-2 px-3">{Number(line.unitPrice).toFixed(2)}</td>
                                        <td className="text-right py-2 px-3">{line.vatRate}%</td>
                                        <td className="text-right py-2 px-3">{Number(line.totalPrice).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-4 text-sm">
                        <div className="text-right space-y-1">
                            <div>Ara Toplam: <strong>{Number(invoice.subtotal).toFixed(2)} {invoice.currency}</strong></div>
                            <div>KDV Toplam: <strong>{Number(invoice.taxTotal).toFixed(2)} {invoice.currency}</strong></div>
                            <div className="text-lg font-bold">Genel Toplam: {Number(invoice.totalAmount).toFixed(2)} {invoice.currency}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
