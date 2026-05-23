"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Loader2,
    Inbox,
    RefreshCw,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

type IncomingInvoice = {
    id: string;
    uuid: string;
    invoiceId: string;
    senderVkn: string;
    senderName: string;
    receiverVkn: string;
    amount: number;
    currency: string;
    status: string;
    issueDate: string;
    isRead: boolean;
    syncedAt: string;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    PENDING: { label: "Beklemede", color: "bg-amber-100 text-amber-700", icon: Clock },
    APPROVED: { label: "Onaylandı", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    REJECTED: { label: "Reddedildi", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function EfaturaGelenPage() {
    const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    async function loadInvoices() {
        setLoading(true);
        try {
            const res = await fetch(`/api/edm/incoming?page=${page}&limit=${limit}`);
            const data = await res.json();
            if (res.ok) {
                setInvoices(data.invoices || []);
                setTotal(data.total || 0);
            } else {
                toast.error(data.error || "Faturalar yüklenemedi.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSync() {
        setSyncing(true);
        try {
            const res = await fetch("/api/edm/incoming", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${data.created} yeni, ${data.updated} güncellendi.`);
                loadInvoices();
            } else {
                toast.error(data.error || "Senkronizasyon başarısız.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setSyncing(false);
        }
    }

    useEffect(() => {
        loadInvoices();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="Gelen Faturalar"
                description="EDM üzerinden alınan gelen e-Faturalarınız."
                icon={Inbox}
            >
                <Button
                    variant="outline"
                    onClick={handleSync}
                    disabled={syncing}
                    className="rounded-xl"
                >
                    {syncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Senkronize Et
                        </>
                    )}
                </Button>
            </PageHeader>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            ) : invoices.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Inbox className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium">Henüz gelen fatura yok</h3>
                        <p className="text-sm text-slate-500 mt-1">Senkronize et butonuyla EDM'den faturalarınızı çekebilirsiniz.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {invoices.map((inv) => {
                        const status = statusMap[inv.status] || { label: inv.status, color: "bg-slate-100", icon: AlertCircle };
                        const StatusIcon = status.icon;
                        return (
                            <Card key={inv.id} className="rounded-2xl border-slate-200 dark:border-slate-800">
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${inv.isRead ? "bg-slate-100 dark:bg-slate-800" : "bg-sky-100 dark:bg-sky-900/30"}`}>
                                            <Inbox className={`h-5 w-5 ${inv.isRead ? "text-slate-500" : "text-sky-500"}`} />
                                        </div>
                                        <div>
                                            <div className="font-medium">{inv.senderName}</div>
                                            <div className="text-xs text-slate-500">
                                                {inv.senderVkn} • {inv.invoiceId}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(inv.issueDate).toLocaleDateString("tr-TR")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={`${status.color} border-0 rounded-lg`}>
                                            <StatusIcon className="mr-1 h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                        <div className="text-right">
                                            <div className="font-bold">{Number(inv.amount).toFixed(2)} {inv.currency}</div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="rounded-xl">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl">Önceki</Button>
                            <span className="text-sm text-slate-500 self-center">Sayfa {page} / {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl">Sonraki</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
