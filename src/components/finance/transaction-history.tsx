"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Search, ArrowUpRight, ArrowDownRight, Paperclip, Pencil } from "lucide-react";
import { CreateTransactionModal } from "./create-transaction-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";

export function TransactionHistory({ transactions }: { transactions: any[] }) {
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");

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
    const paymentLabels: Record<string, string> = { CASH: "NAKİT", CARD: "KART", TRANSFER: "HAVALE" };

    return (
        <Card className="border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem]">
            <div className="p-5 md:p-8 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="İşlem veya kullanıcı ara..."
                            className="pl-10 h-11 md:h-10 w-full rounded-xl text-xs border-border/40 bg-muted/20"
                        />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/40 rounded-xl overflow-x-auto no-scrollbar">
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
                                <TableHead className="font-medium pl-10">
                                    <SortableHeader label="TARİH" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="HESAP / KANAL" field="accountId" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="AÇIKLAMA" field="description" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="font-medium text-[10px]  text-muted-foreground uppercase opacity-60">SORUMLU</TableHead>
                                <TableHead className="font-medium pr-10">
                                    <SortableHeader label="TUTAR" field="amount" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
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
                                        <TableCell className="text-right pr-10">
                                            <div className="flex flex-col items-end">
                                                <div className={cn("flex items-center gap-1.5 text-base  tracking-tighter", t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500')}>
                                                    {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                                                    {t.type === 'INCOME' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {t.attachments && t.attachments.length > 0 && (
                                                        <Badge variant="outline" className="text-[9px]  px-2 py-0.5 border-none rounded-lg bg-blue-500/10 text-blue-500 uppercase tracking-widest gap-1">
                                                            <Paperclip className="h-2.5 w-2.5" />
                                                            {t.attachments.length}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className={cn("text-[9px]  px-2 py-0.5 border-none rounded-lg uppercase tracking-widest", t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                                                        {t.type === 'INCOME' ? 'TAHSİLAT' : 'ÖDEME'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-10">
                                            <CreateTransactionModal
                                                initialData={t}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
            <div className="p-6 border-t border-border/40 flex items-center justify-between bg-muted/5">
                <p className="text-[10px]  text-muted-foreground tracking-[0.2em] uppercase opacity-60">
                    {filtered.length} / {transactions.length} İŞLEM LİSTELENİYOR
                </p>
                <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden relative border border-border/40">
                    <div className="absolute top-0 left-0 h-full bg-blue-500/40 w-full animate-pulse" />
                </div>
            </div>
        </Card>
    );
}





