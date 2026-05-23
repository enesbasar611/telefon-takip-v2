"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2,
    XCircle,
    ArrowLeft,
    FileText,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

type CancelledInvoice = {
    id: string;
    uuid: string;
    invoiceId: string;
    type: string;
    status: string;
    customer: { name: string; taxNumber: string | null } | null;
    totalAmount: number;
    currency: string;
    issueDate: string;
    cancelledAt: string;
    note: string | null;
};

export default function EfaturaIptallerPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<CancelledInvoice[]>([]);
    const [loading, setLoading] = useState(false);

    async function loadInvoices() {
        setLoading(true);
        try {
            const res = await fetch("/api/edm/invoices?status=CANCELLED");
            const data = await res.json();
            if (res.ok) {
                setInvoices(data.invoices || []);
            } else {
                toast.error(data.error || "Faturalar yüklenemedi.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInvoices();
    }, []);

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="İptal Edilmiş Faturalar"
                description="EDM üzerinden iptal edilmiş faturalarınız."
                icon={XCircle}
            >
                <Button variant="outline" onClick={() => router.push("/efatura")} className="rounded-xl">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Faturalara Dön
                </Button>
            </PageHeader>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            ) : invoices.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium">İptal edilmiş fatura yok</h3>
                        <p className="text-sm text-slate-500 mt-1">İptal edilmiş faturalar burada listelenecek.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {invoices.map((inv) => (
                        <Card
                            key={inv.id}
                            className="rounded-2xl border-slate-200 dark:border-slate-800 cursor-pointer transition-all hover:shadow-md"
                            onClick={() => router.push(`/efatura/${inv.id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center dark:bg-rose-900/30">
                                        <XCircle className="h-5 w-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{inv.invoiceId}</div>
                                        <div className="text-xs text-slate-500">
                                            {inv.customer?.name || "—"} • {inv.customer?.taxNumber || "—"}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            İptal: {new Date(inv.cancelledAt).toLocaleDateString("tr-TR")}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className="bg-rose-100 text-rose-700 border-0 rounded-lg">
                                        <XCircle className="mr-1 h-3 w-3" />
                                        İptal
                                    </Badge>
                                    <div className="text-right">
                                        <div className="font-bold">{Number(inv.totalAmount).toFixed(2)} {inv.currency}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
