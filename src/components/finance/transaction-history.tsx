"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Search, ArrowUpRight, ArrowDownRight, Paperclip, Pencil, Trash2, AlertCircle } from "lucide-react";
import { CreateTransactionModal } from "./create-transaction-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteTransaction, deleteTransactions } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
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

export function TransactionHistory({ transactions }: { transactions: any[] }) {
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const filtered = transactions.filter((t) => {
        const matchSearch =
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.account?.name?.toLowerCase().includes(search.toLowerCase());
        const matchPayment =
            paymentFilter === "ALL" || t.paymentMethod === paymentFilter;
        return matchSearch && matchPayment;
    });

    const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(filtered, "createdAt", "desc");
    const paymentLabels: Record<string, string> = {
        CASH: "NAKİT",
        CARD: "KART",
        TRANSFER: "HAVALE",
        DEBT: "VERESİYE"
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(sortedData.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
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
            <div className="p-5 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <History className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <CardTitle className="font-medium text-base  tracking-tight">Finansal Hareketler</CardTitle>
                        <p className="text-[10px] text-muted-foreground  tracking-widest uppercase opacity-60">HESAP BAZLI NAKİT AKIŞI</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsBulkDeleteOpen(true)}
                            className="h-10 rounded-xl gap-2 shadow-lg shadow-rose-500/10 uppercase tracking-widest px-4 transition-all hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-right-4"
                        >
                            <Trash2 className="h-4 w-4" /> {selectedIds.length} SEÇİLİ SİL
                        </Button>
                    )}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
                                    "h-8 md:h-8 text-[9px] md:text-[10px] rounded-lg px-3 md:px-4 transition-all uppercase tracking-tight flex-1 md:flex-none",
                                    paymentFilter === method ? "bg-background shadow-md text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                                )}
                            >
                                {method === "ALL" ? "TÜMÜ" : paymentLabels[method]}
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
                                    <SortableHeader label="TARİH" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="HESAP / KANAL" field="accountId" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="AÇIKLAMA" field="description" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="font-medium text-[10px]  text-muted-foreground uppercase opacity-60">SORUMLU</TableHead>
                                <TableHead className="font-medium pr-8">
                                    <SortableHeader label="TUTAR" field="amount" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                </TableHead>
                                <TableHead className="font-medium pr-10">
                                    <SortableHeader label="BAKİYE" field="runningBalance" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                </TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-xs  text-muted-foreground uppercase tracking-widest opacity-40">
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
                                            <div className="flex flex-col">
                                                <span className="text-[11px] ">{format(new Date(t.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                <span className="text-[9px] text-muted-foreground  opacity-60">{format(new Date(t.createdAt), "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px]  text-blue-500 flex items-center gap-1 uppercase tracking-wider">
                                                    {t.account?.name || 'GENEL KASA'}
                                                </span>
                                                <Badge variant="outline" className="w-fit text-[9px]  py-0.5 px-2 rounded-lg bg-muted/30 border-border/40 opacity-80 uppercase tracking-tighter">
                                                    {paymentLabels[t.paymentMethod] || t.paymentMethod}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs  text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{t.description}</span>
                                                {t.category && <span className="text-[9px]  text-muted-foreground/40 uppercase tracking-widest mt-0.5">{t.category}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded-lg bg-muted border border-border/40 flex items-center justify-center text-[10px]  text-muted-foreground shadow-sm">
                                                    {t.user?.name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-[10px]  uppercase tracking-tight">{t.user?.name || 'SİSTEM'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex flex-col items-end">
                                                <div className={cn("flex items-center gap-1.5 text-base  tracking-tighter font-semibold", t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500')}>
                                                    {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    {t.type === 'INCOME' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex flex-col items-end">
                                                <div className="text-[11px] font-medium text-foreground opacity-80 bg-muted/30 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                    ₺{Number(t.runningBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                </div>
                                                <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest mt-1">İŞLEM SONRASI</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-10">
                                            <div className="flex items-center justify-end gap-1">
                                                <CreateTransactionModal
                                                    initialData={t}
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

                {/* Mobile Transaction Cards */}
                <div className="flex flex-col divide-y divide-border/20 md:hidden min-h-[400px]">
                    {sortedData.length === 0 ? (
                        <div className="py-20 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                            İŞLEM BULUNAMADI
                        </div>
                    ) : (
                        sortedData.map((t) => (
                            <div key={t.id} className="p-4 flex flex-col gap-3 active:bg-muted/30 transition-colors relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                            {format(new Date(t.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                                        </span>
                                        <span className="text-[10px] text-blue-500 font-medium uppercase mt-0.5">
                                            {t.account?.name || 'GENEL KASA'}
                                        </span>
                                    </div>
                                    <div className={cn("flex items-center gap-1.5 text-base font-bold tracking-tighter", t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500')}>
                                        {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <p className="text-xs text-foreground/90 font-medium leading-tight">
                                        {t.description || "Açıklama belirtilmemiş"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[8px] px-2 py-0.5 border-none rounded-lg uppercase tracking-widest", t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                                            {t.type === 'INCOME' ? 'TAHSİLAT' : 'ÖDEME'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[8px] py-0.5 px-2 rounded-lg bg-muted/30 border-border/40 text-muted-foreground uppercase">
                                            {paymentLabels[t.paymentMethod] || t.paymentMethod}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-muted border border-border/40 flex items-center justify-center text-[8px] text-muted-foreground">
                                            {t.user?.name?.charAt(0) || 'S'}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground uppercase">{t.user?.name || 'SİSTEM'}</span>
                                    </div>

                                    <CreateTransactionModal
                                        initialData={t}
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
                        ))
                    )}
                </div>
            </CardContent>
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-muted/5">
                <p className="text-[10px]  text-muted-foreground tracking-[0.2em] uppercase opacity-60">
                    {filtered.length} / {transactions.length} İŞLEM LİSTELENİYOR
                </p>
                <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                    <div className="absolute top-0 left-0 h-full bg-blue-500/40 w-full animate-pulse" />
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
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
                        <AlertDialogCancel className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12">İPTAL</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? "SİLİNİYOR..." : "EVET, SİL"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
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
                        <AlertDialogCancel className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12">İPTAL</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? "SİLİNİYOR..." : "EVET, TOPLU SİL"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}





