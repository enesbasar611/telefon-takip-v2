"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, Landmark, ArrowUpRight, ArrowDownRight, Search, Filter, History, Calendar } from "lucide-react";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Transaction = {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    paymentMethod: string;
    createdAt: string;
    user?: { name: string } | null;
};

type Summary = {
    totalIncome: number;
    totalExpense: number;
    cashBalance: number;
    bankBalance: number;
};

export function FinansClient({
    transactions,
    summary,
}: {
    transactions: Transaction[];
    summary: Summary;
}) {
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");

    const filtered = transactions.filter((t) => {
        const matchSearch =
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.user?.name?.toLowerCase().includes(search.toLowerCase());
        const matchPayment =
            paymentFilter === "ALL" || t.paymentMethod === paymentFilter;
        return matchSearch && matchPayment;
    });

    const stats = [
        { label: "TOPLAM GELİR", value: summary.totalIncome, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "TOPLAM GİDER", value: summary.totalExpense, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
        { label: "KASA (NAKİT)", value: summary.cashBalance, icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "BANKA / POS", value: summary.bankBalance, icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10" },
    ];

    const paymentLabels: Record<string, string> = { CASH: "NAKİT", CARD: "KART", TRANSFER: "HAVALE" };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <span className="text-[10px] font-bold text-blue-500/80">Finans Merkezi</span>
                    </div>
                    <h1 className="text-4xl font-bold">Kasa &amp; Muhasebe</h1>
                    <p className="text-sm text-muted-foreground font-medium max-w-md mt-1">İşletmenizin finansal sağlığını ve nakit akışını gerçek zamanlı izleyin.</p>
                </div>
                <CreateTransactionModal />
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-border/40 shadow-sm group overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-blue-500 group-hover:opacity-10 transition-opacity" />
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <Badge variant="outline" className="text-[8px] font-bold">AKTİF</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground">{stat.label}</p>
                            <div className="mt-1">
                                <RevealFinancial amount={stat.value} className="text-3xl font-bold" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-border/40 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <History className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold">Finansal Hareketler</CardTitle>
                            <p className="text-[10px] text-muted-foreground font-bold">Gerçek zamanlı nakit akışı kaydı</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Açıklama veya personel ara..."
                                className="pl-10 h-9 rounded-xl text-xs font-bold border-border/40"
                            />
                        </div>
                        {["ALL", "CASH", "CARD", "TRANSFER"].map((method) => (
                            <Button
                                key={method}
                                variant={paymentFilter === method ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setPaymentFilter(method)}
                                className="h-9 text-[10px] font-bold rounded-xl"
                            >
                                {method === "ALL" ? "TÜMÜ" : paymentLabels[method]}
                            </Button>
                        ))}
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/5">
                            <TableRow className="border-border/40 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold text-muted-foreground py-4 pl-8">TARİH &amp; SAAT</TableHead>
                                <TableHead className="text-[10px] font-bold text-muted-foreground py-4">AÇIKLAMA</TableHead>
                                <TableHead className="text-[10px] font-bold text-muted-foreground py-4">ÖDEME KANALI</TableHead>
                                <TableHead className="text-[10px] font-bold text-muted-foreground py-4">SORUMLU</TableHead>
                                <TableHead className="text-right pr-8 text-[10px] font-bold text-muted-foreground py-4">TUTAR</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-muted-foreground">
                                        {search || paymentFilter !== "ALL" ? "Filtre kriterine uyan işlem bulunamadı." : "Henüz finansal hareket yok."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((t) => (
                                    <TableRow key={t.id} className="border-border/20 hover:bg-muted/5 transition-colors group">
                                        <TableCell className="py-4 pl-8">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-[11px] font-bold">{format(new Date(t.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold bg-muted/30 px-1.5 rounded-lg">{format(new Date(t.createdAt), "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{t.description}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-3 rounded-xl">
                                                {paymentLabels[t.paymentMethod] || t.paymentMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500">
                                                    {t.user?.name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-[10px] font-bold">{t.user?.name || 'SİSTEM'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex flex-col items-end">
                                                <div className={cn("flex items-center gap-1.5 text-sm font-bold", t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500')}>
                                                    {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                                                    {t.type === 'INCOME' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                </div>
                                                <span className="text-[8px] font-bold text-muted-foreground mt-0.5">{t.type === 'INCOME' ? 'TAHSİLAT' : 'ÖDEME'}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="p-4 border-t border-border/40 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground">
                        {filtered.length} / {transactions.length} İŞLEM GÖSTERİLİYOR
                    </p>
                </div>
            </Card>
        </div>
    );
}
