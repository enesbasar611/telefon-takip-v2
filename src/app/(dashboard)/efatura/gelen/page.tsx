"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2, FileText, Search, ArrowLeft, Download, Eye,
    CheckCircle2, RefreshCw, Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EfaturaGelenPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState("");
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
        } catch {
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
                toast.success(`${data.created || 0} yeni, ${data.updated || 0} güncellendi.`);
                loadInvoices();
            } else {
                toast.error(data.error || "Senkronizasyon başarısız.");
            }
        } catch {
            toast.error("Bağlantı hatası.");
        } finally {
            setSyncing(false);
        }
    }

    useEffect(() => {
        loadInvoices();
    }, [page]);

    const filtered = invoices.filter((inv: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (inv.invoiceId || "").toLowerCase().includes(q) ||
            (inv.senderName || "").toLowerCase().includes(q) ||
            (inv.senderVkn || "").includes(q)
        );
    });

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="Gelen Faturalar"
                description="EDM üzerinden alınan gelen e-Faturalarınız."
                icon={Inbox}
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={handleSync}
                            disabled={syncing}
                            className="h-10 rounded-xl"
                        >
                            {syncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <><RefreshCw className="mr-2 h-4 w-4" /> Senkronize Et</>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/efatura")}
                            className="h-10 rounded-xl"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Geri
                        </Button>
                    </>
                }
            />

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Fatura no, UUID veya gönderici ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Inbox className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium">Henüz gelen fatura yok</h3>
                        <p className="text-sm text-slate-500 mt-1">Senkronize et butonuyla EDM'den faturalarınızı çekebilirsiniz.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((inv: any, idx: number) => (
                        <Card
                            key={inv.id || idx}
                            className="rounded-2xl border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
                        >
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                                        <Inbox className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{inv.senderName || "—"}</div>
                                        <div className="text-xs text-slate-500">
                                            {inv.senderVkn || "—"} • {inv.invoiceId || "—"}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("tr-TR") : "—"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold">{Number(inv.amount || inv.totalAmount || 0).toFixed(2)} {inv.currency || "TRY"}</div>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg">
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Alındı
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="rounded-xl">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="rounded-xl">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

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
