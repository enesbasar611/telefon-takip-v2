"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    FileSpreadsheet,
    FileText,
    History,
    Pencil,
    Search,
    Trash2,
    User,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteTransaction, deleteTransactions } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { EditTransactionWrapper } from "./edit-transaction-wrapper";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const paymentLabels: Record<string, string> = {
    CASH: "NAKİT",
    CARD: "KART",
    TRANSFER: "HAVALE",
    DEBT: "VERESİYE",
};

const typeLabels: Record<string, string> = {
    INCOME: "Tahsilat",
    EXPENSE: "Ödeme",
};

const currencySymbol = (currency?: string) => {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    return "₺";
};

const formatMoney = (value: unknown, currency?: string) => {
    const amount = Number(value || 0);
    return `${currencySymbol(currency)}${amount.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const sanitizeFilename = (value: string) => {
    const trMap: Record<string, string> = {
        "ı": "i",
        "İ": "I",
        "ğ": "g",
        "Ğ": "G",
        "ü": "u",
        "Ü": "U",
        "ş": "s",
        "Ş": "S",
        "ö": "o",
        "Ö": "O",
        "ç": "c",
        "Ç": "C",
    };

    return value
        .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (char) => trMap[char] || char)
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
};

const downloadBlob = (content: BlobPart, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export function TransactionHistory({
    transactions,
    search,
    onSearchChange,
}: {
    transactions: any[];
    search: string;
    onSearchChange: (value: string) => void;
}) {
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { rates } = useDashboardData();
    const usdRate = rates?.usd || 35.0;
    const eurRate = rates?.eur || 38.0;

    const filtered = transactions.filter((t) => {
        if (t.paymentMethod === "DEBT") return false;

        const needle = search.toLowerCase();
        const matchSearch =
            t.description?.toLowerCase().includes(needle) ||
            t.user?.name?.toLowerCase().includes(needle) ||
            t.financeAccount?.name?.toLowerCase().includes(needle) ||
            t.account?.name?.toLowerCase().includes(needle) ||
            t.customer?.name?.toLowerCase().includes(needle) ||
            t.supplier?.name?.toLowerCase().includes(needle) ||
            t.category?.toLowerCase().includes(needle);

        const matchPayment = paymentFilter === "ALL" || t.paymentMethod === paymentFilter;

        return matchSearch && matchPayment;
    });

    const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(filtered, "createdAt", "desc");

    const exportRows = sortedData.map((t) => {
        const date = new Date(t.createdAt);
        const validDate = !isNaN(date.getTime());
        return {
            tarih: validDate ? format(date, "dd.MM.yyyy HH:mm", { locale: tr }) : "-",
            hesap: t.financeAccount?.name || "Genel Kasa",
            odemeYontemi: paymentLabels[t.paymentMethod] || t.paymentMethod || "-",
            tip: typeLabels[t.type] || t.type || "-",
            aciklama: t.description || "-",
            kategori: t.category || "-",
            musteri: t.customer?.name || "",
            tedarikci: t.supplier?.name || "",
            sorumlu: t.user?.name || "Sistem",
            paraBirimi: t.currency || "TRY",
            tutar: Number(t.amount || 0),
            bakiye: t.runningBalance === null || t.runningBalance === undefined ? null : Number(t.runningBalance),
        };
    });

    const exportFilename = (extension: "csv" | "pdf") => {
        const date = format(new Date(), "yyyy-MM-dd");
        const filterPart = paymentFilter === "ALL" ? "tum-hareketler" : paymentLabels[paymentFilter] || paymentFilter;
        return `finansal-hareketler-${sanitizeFilename(filterPart)}-${date}.${extension}`;
    };

    const handleExportCsv = () => {
        if (exportRows.length === 0) {
            toast.error("Dışa aktarılacak finansal hareket bulunamadı.");
            return;
        }

        const headers = ["Tarih", "Hesap", "Ödeme Yöntemi", "Tip", "Açıklama", "Kategori", "Müşteri", "Tedarikçi", "Sorumlu", "Para Birimi", "Tutar", "Bakiye"];
        const escapeCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const rows = exportRows.map((row) => [
            row.tarih,
            row.hesap,
            row.odemeYontemi,
            row.tip,
            row.aciklama,
            row.kategori,
            row.musteri,
            row.tedarikci,
            row.sorumlu,
            row.paraBirimi,
            row.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            row.bakiye === null ? "" : row.bakiye.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ].map(escapeCell).join(";"));

        const csv = `\uFEFF${[headers.map(escapeCell).join(";"), ...rows].join("\n")}`;
        downloadBlob(csv, exportFilename("csv"), "text/csv;charset=utf-8");
        toast.success("CSV dosyası indirildi.");
    };

    const handleExportPdf = async () => {
        if (exportRows.length === 0) {
            toast.error("Dışa aktarılacak finansal hareket bulunamadı.");
            return;
        }

        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);
            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }) as any;

            doc.setFontSize(14);
            doc.text("Finansal Hareketler", 14, 14);
            doc.setFontSize(9);
            doc.text(`${exportRows.length} hareket | Filtre: ${paymentFilter === "ALL" ? "Tümü" : paymentLabels[paymentFilter] || paymentFilter}`, 14, 21);
            doc.text(`Oluşturma: ${format(new Date(), "dd.MM.yyyy HH:mm")}`, 14, 27);

            autoTable(doc, {
                startY: 33,
                head: [["Tarih", "Hesap", "Ödeme", "Tip", "Açıklama", "Sorumlu", "Tutar", "Bakiye"]],
                body: exportRows.map((row) => [
                    row.tarih,
                    row.hesap,
                    row.odemeYontemi,
                    row.tip,
                    row.aciklama,
                    row.sorumlu,
                    formatMoney(row.tutar, row.paraBirimi),
                    row.bakiye === null ? "-" : formatMoney(row.bakiye, row.paraBirimi),
                ]),
                styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 32 },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 75 },
                    5: { cellWidth: 28 },
                    6: { halign: "right", cellWidth: 28 },
                    7: { halign: "right", cellWidth: 28 },
                },
            });

            doc.save(exportFilename("pdf"));
            toast.success("PDF dosyası indirildi.");
        } catch (error) {
            console.error("Finance PDF export error:", error);
            toast.error("PDF oluşturulurken hata oluştu.");
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? sortedData.map((t) => t.id) : []);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((item) => item !== id));
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const res = await deleteTransaction(deleteId);
        setIsDeleting(false);
        if (res.success) {
            toast.success("İşlem başarıyla silindi");
            setDeleteId(null);
        } else {
            toast.error(res.error || "İşlem silinemedi");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        const res = await deleteTransactions(selectedIds);
        setIsDeleting(false);
        if (res.success) {
            toast.success(`${selectedIds.length} işlem başarıyla silindi`);
            setSelectedIds([]);
            setIsBulkDeleteOpen(false);
        } else {
            toast.error(res.error || "İşlemler silinemedi");
        }
    };

    return (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem]">
            <div className="p-5 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                            <History className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="font-medium text-base tracking-tight">Finansal Hareketler</CardTitle>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase opacity-60">Hesap bazlı nakit akışı</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsBulkDeleteOpen(true)}
                                className="h-10 rounded-xl gap-2 shadow-lg shadow-rose-500/10 uppercase tracking-widest px-4"
                            >
                                <Trash2 className="h-4 w-4" /> {selectedIds.length} Seçili Sil
                            </Button>
                        )}

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExportCsv}
                                className="h-10 rounded-xl gap-2 text-xs font-semibold"
                            >
                                <FileSpreadsheet className="h-4 w-4" /> CSV
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExportPdf}
                                className="h-10 rounded-xl gap-2 text-xs font-semibold"
                            >
                                <FileText className="h-4 w-4" /> PDF
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="İşlem veya kullanıcı ara..."
                            className="pl-10 h-11 md:h-10 w-full rounded-xl text-xs border-zinc-200 dark:border-zinc-800 bg-muted/20 focus-visible:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-muted/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto no-scrollbar">
                        {["ALL", "CASH", "CARD", "TRANSFER"].map((method) => (
                            <Button
                                key={method}
                                variant={paymentFilter === method ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setPaymentFilter(method)}
                                className={cn(
                                    "h-8 text-[10px] rounded-lg px-3 md:px-4 transition-all uppercase tracking-tight flex-1 md:flex-none",
                                    paymentFilter === method ? "bg-background shadow-md text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                                )}
                            >
                                {method === "ALL" ? "Tümü" : paymentLabels[method]}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <CardContent className="p-0">
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="font-medium bg-muted/10">
                            <TableRow className="border-border/40 hover:bg-transparent h-[60px]">
                                <TableHead className="w-[50px] pl-10">
                                    <Checkbox
                                        checked={selectedIds.length === sortedData.length && sortedData.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        className="rounded-md border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Tarih" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Hesap / Kanal" field="accountId" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Açıklama" field="description" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="font-medium text-[10px] text-muted-foreground uppercase opacity-60">Sorumlu</TableHead>
                                <TableHead className="font-medium pr-8">
                                    <SortableHeader label="Tutar" field="amount" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                </TableHead>
                                <TableHead className="font-medium pr-10">
                                    <SortableHeader label="Bakiye" field="runningBalance" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                </TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                                        {search || paymentFilter !== "ALL" ? "Filtre kriterine uyan işlem bulunamadı." : "Henüz finansal hareket yok."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((t) => (
                                    <TableRow key={t.id} className="border-border/10 hover:bg-muted/10 transition-all duration-300 group h-20">
                                        <TableCell className="pl-10">
                                            <Checkbox
                                                checked={selectedIds.includes(t.id)}
                                                onCheckedChange={(checked) => handleSelectRow(t.id, !!checked)}
                                                className="rounded-md border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const date = new Date(t.createdAt);
                                                const isValid = !isNaN(date.getTime());
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px]">{isValid ? format(date, "dd MMM yyyy", { locale: tr }) : "-"}</span>
                                                        <span className="text-[9px] text-muted-foreground opacity-60">{isValid ? format(date, "HH:mm") : "-"}</span>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] text-blue-500 flex items-center gap-1 uppercase tracking-wider">
                                                    {t.financeAccount?.name || "Genel Kasa"}
                                                </span>
                                                <Badge variant="outline" className="w-fit text-[9px] py-0.5 px-2 rounded-lg bg-muted/30 border-border/40 opacity-80 uppercase tracking-tighter">
                                                    {paymentLabels[t.paymentMethod] || t.paymentMethod}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{t.description || "Açıklama belirtilmemiş"}</span>
                                                <div className="flex items-center gap-2">
                                                    {t.customer && (
                                                        <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                                                            <User className="h-3 w-3" /> {t.customer.name}
                                                        </span>
                                                    )}
                                                    {t.supplier && (
                                                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                                                            <Building2 className="h-3 w-3" /> {t.supplier.name}
                                                        </span>
                                                    )}
                                                    {t.category && <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">{t.category}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded-lg bg-muted border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground shadow-sm">
                                                    {t.user?.name?.charAt(0) || "S"}
                                                </div>
                                                <span className="text-[10px] uppercase tracking-tight">{t.user?.name || "Sistem"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex flex-col items-end">
                                                <div className={cn("flex items-center gap-1.5 text-base tracking-tighter font-semibold", t.type === "INCOME" ? "text-emerald-500" : "text-rose-500")}>
                                                    {t.type === "INCOME" ? "+" : "-"}
                                                    {formatMoney(t.amount, t.currency)}
                                                    {t.type === "INCOME" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                </div>
                                                <div className="flex flex-col items-end opacity-50 space-y-0">
                                                    {t.currency === "TRY" ? (
                                                        <>
                                                            <span className="text-[9px] text-muted-foreground font-medium leading-none">~${(Number(t.amount) / usdRate).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</span>
                                                            <span className="text-[9px] text-muted-foreground font-medium leading-none">~€{(Number(t.amount) / eurRate).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground font-medium">~₺{Math.round(Number(t.amount) * (t.currency === "USD" ? usdRate : eurRate)).toLocaleString("tr-TR")}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex flex-col items-end gap-0.5">
                                                {(() => {
                                                    const hasBalance = t.runningBalance !== null && t.runningBalance !== undefined;
                                                    if (!hasBalance) return <span className="text-[10px] text-muted-foreground/40 italic">-</span>;
                                                    const isIncome = t.type === "INCOME";
                                                    return (
                                                        <div className={cn(
                                                            "flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg border",
                                                            isIncome
                                                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                                                                : "text-rose-600 dark:text-rose-400 bg-rose-500/8 border-rose-500/20"
                                                        )}>
                                                            {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                            {formatMoney(t.runningBalance, t.currency)}
                                                        </div>
                                                    );
                                                })()}
                                                {t.currency !== "TRY" && t.runningBalance !== null && t.runningBalance !== undefined && (
                                                    <span className="text-[9px] text-muted-foreground/60 font-medium">
                                                        ~₺{Math.round(Number(t.runningBalance) * (t.currency === "USD" ? usdRate : eurRate)).toLocaleString("tr-TR")}
                                                    </span>
                                                )}
                                                <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap">
                                                    {t.financeAccount?.name || "Kasa"} bakiyesi
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-10">
                                            <div className="flex items-center justify-end gap-1">
                                                <EditTransactionWrapper
                                                    transaction={t}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(t.id)}
                                                    className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col divide-y divide-border/20 md:hidden min-h-[400px]">
                    {sortedData.length === 0 ? (
                        <div className="py-20 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                            İşlem bulunamadı
                        </div>
                    ) : (
                        sortedData.map((t) => (
                            <div key={t.id} className="p-4 flex flex-col gap-3 active:bg-muted/30 transition-colors relative">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                            {(() => {
                                                const date = new Date(t.createdAt);
                                                return !isNaN(date.getTime()) ? format(date, "dd MMM yyyy, HH:mm", { locale: tr }) : "-";
                                            })()}
                                        </span>
                                        <span className="text-[10px] text-blue-500 font-medium uppercase mt-0.5 truncate">
                                            {t.financeAccount?.name || "Genel Kasa"}
                                        </span>
                                    </div>
                                    <div className={cn("flex flex-col items-end gap-0.5 font-bold tracking-tighter shrink-0", t.type === "INCOME" ? "text-emerald-500" : "text-rose-500")}>
                                        <div className="flex items-center gap-1 text-base">
                                            {t.type === "INCOME" ? "+" : "-"}
                                            {formatMoney(t.amount, t.currency)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <p className="text-xs text-foreground/90 font-medium leading-tight">
                                        {t.description || "Açıklama belirtilmemiş"}
                                    </p>
                                    {(t.customer || t.supplier) && (
                                        <div className="flex items-center gap-2">
                                            {t.customer && (
                                                <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                                                    <User className="h-3 w-3" /> {t.customer.name}
                                                </span>
                                            )}
                                            {t.supplier && (
                                                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                                                    <Building2 className="h-3 w-3" /> {t.supplier.name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[8px] px-2 py-0.5 border-none rounded-lg uppercase tracking-widest", t.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                            {typeLabels[t.type] || t.type}
                                        </Badge>
                                        <Badge variant="outline" className="text-[8px] py-0.5 px-2 rounded-lg bg-muted/30 border-border/40 text-muted-foreground uppercase">
                                            {paymentLabels[t.paymentMethod] || t.paymentMethod}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/10 gap-2">
                                    <span className="text-[9px] text-muted-foreground uppercase">{t.user?.name || "Sistem"}</span>
                                    <div className="flex items-center gap-2">
                                        <EditTransactionWrapper
                                            transaction={t}
                                            trigger={
                                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg border border-border/40 text-[10px] text-muted-foreground gap-2">
                                                    <Pencil className="h-3 w-3" /> Düzenle
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteId(t.id)}
                                            className="h-8 px-3 rounded-lg border border-border/40 text-[10px] text-rose-500 gap-2 hover:bg-rose-500/10 hover:border-rose-500/20"
                                        >
                                            <Trash2 className="h-3 w-3" /> Sil
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-muted/5">
                <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase opacity-60">
                    {filtered.length} / {transactions.length} işlem listeleniyor
                </p>
                <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                    <div className="absolute top-0 left-0 h-full bg-blue-500/40 w-full animate-pulse" />
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2rem] border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-rose-500">
                            <AlertCircle className="h-5 w-5" /> İşlemi Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu finansal hareketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ilgili hesap bakiyesi otomatik olarak güncellenecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12">İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogContent className="rounded-[2rem] border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-rose-500">
                            <AlertCircle className="h-5 w-5" /> {selectedIds.length} İşlemi Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Seçili olan {selectedIds.length} finansal hareketi toplu olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilgili hesap bakiyeleri otomatik olarak güncellenecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12">İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Toplu Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
