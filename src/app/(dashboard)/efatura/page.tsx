"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Invoice = {
    id: string;
    uuid: string;
    invoiceId: string;
    type: string;
    status: string;
    customer: { name: string; taxNumber: string | null } | null;
    totalAmount: number;
    currency: string;
    issueDate: string;
    createdAt: string;
    note: string | null;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    DRAFT: { label: "Taslak", color: "bg-slate-100 text-slate-700", icon: Clock },
    PENDING: { label: "Beklemede", color: "bg-amber-100 text-amber-700", icon: Clock },
    SENT: { label: "Gönderildi", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    ERROR: { label: "Hata", color: "bg-red-100 text-red-700", icon: AlertCircle },
    CANCELLED: { label: "İptal", color: "bg-rose-100 text-rose-700", icon: XCircle },
};

export default function EfaturaPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | "">("");
    const limit = 20;

    async function loadInvoices() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(limit));
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/edm/invoices?${params.toString()}`);
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

    useEffect(() => {
        loadInvoices();
    }, [page, statusFilter]);

    const filtered = invoices.filter((inv) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            inv.invoiceId.toLowerCase().includes(q) ||
            inv.uuid.toLowerCase().includes(q) ||
            (inv.customer?.name || "").toLowerCase().includes(q) ||
            (inv.customer?.taxNumber || "").includes(q)
        );
    });

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="Faturalarım"
                description="Gönderilen ve taslak durumundaki tüm e-Faturalarınız."
                icon={FileText}
            >
                <Button
                    onClick={() => router.push("/efatura/yeni")}
                    className="h-10 rounded-xl bg-slate-950 text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Fatura
                </Button>
            </PageHeader>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Fatura no, UUID veya müşteri ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 rounded-xl"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    {["", "DRAFT", "PENDING", "SENT", "ERROR", "CANCELLED"].map((s) => (
                        <Button
                            key={s || "all"}
                            variant={statusFilter === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className="rounded-xl text-xs"
                        >
                            {s ? statusMap[s]?.label || s : "Tümü"}
                        </Button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Henüz fatura bulunmuyor</h3>
                        <p className="text-sm text-slate-500 mt-1">Yeni bir e-Fatura oluşturmak için yukarıdaki butonu kullanın.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((inv) => {
                        const status = statusMap[inv.status] || statusMap.DRAFT;
                        const StatusIcon = status.icon;
                        return (
                            <Card
                                key={inv.id}
                                className="rounded-2xl border-slate-200 dark:border-slate-800 cursor-pointer transition-all hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800"
                                onClick={() => router.push(`/efatura/${inv.id}`)}
                            >
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                                            <FileText className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{inv.invoiceId}</div>
                                            <div className="text-xs text-slate-500">
                                                {inv.customer?.name || "—"} • {inv.customer?.taxNumber || "—"}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(inv.issueDate).toLocaleDateString("tr-TR")} • {inv.uuid.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={`${status.color} border-0 rounded-lg`}>
                                            <StatusIcon className="mr-1 h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                        <div className="text-right">
                                            <div className="font-bold">{Number(inv.totalAmount).toFixed(2)} {inv.currency}</div>
                                            <div className="text-xs text-slate-400">{inv.type === "EARCHIVE" ? "e-Arşiv" : "e-Fatura"}</div>
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
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-xl"
                            >
                                Önceki
                            </Button>
                            <span className="text-sm text-slate-500 self-center">
                                Sayfa {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-xl"
                            >
                                Sonraki
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
