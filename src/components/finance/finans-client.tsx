"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, Landmark, ArrowUpRight, ArrowDownRight, Search, History, Calendar, PiggyBank, Receipt, Scale, AlertCircle } from "lucide-react";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { AccountList } from "./account-list";
import { DailySessionControl } from "./daily-session-control";

type Transaction = {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    paymentMethod: string;
    category?: string;
    createdAt: string;
    account?: { name: string } | null;
    user?: { name: string } | null;
};

type Summary = {
    todayIncome: number;
    todayExpense: number;
    cashBalance: number;
    bankBalance: number;
    totalReceivables: number;
    totalPayables: number;
    accounts: any[];
};

export function FinansClient({
    transactions,
    summary,
    session
}: {
    transactions: Transaction[];
    summary: Summary;
    session: any;
}) {
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

    const mainStats = [
        { label: "NET VARLIK", value: (summary.cashBalance + summary.bankBalance + summary.totalReceivables - summary.totalPayables) || 0, icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10", description: "Kasa + Banka + Alacaklar - Borçlar" },
        { label: "TOPLAM ALACAK", value: summary.totalReceivables || 0, icon: PiggyBank, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Müşterilerden beklenen ödemeler" },
        { label: "TOPLAM BORÇ", value: summary.totalPayables || 0, icon: Receipt, color: "text-rose-500", bg: "bg-rose-500/10", description: "Tedarikçilere yapılacak ödemeler" },
    ];

    const incomeStats = [
        { label: "BUGÜNKÜ GELİR", value: summary.todayIncome || 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "BUGÜNKÜ GİDER", value: summary.todayExpense || 0, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];

    const paymentLabels: Record<string, string> = { CASH: "NAKİT", CARD: "KART", TRANSFER: "HAVALE" };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <span className="text-[10px]  text-blue-500/80 uppercase tracking-widest">Finansal Yönetim Merkezi</span>
                    </div>
                    <h1 className="font-medium text-4xl  tracking-tight">Kasa &amp; Muhasebe</h1>
                    <p className="text-sm text-muted-foreground font-medium max-w-md mt-1">İşletmenizin finansal sağlığını, nakit akışını ve hesaplarını profesyonelce yönetin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <CreateTransactionModal />
                </div>
            </div>

            {/* Daily Session Control */}
            <DailySessionControl session={session} />

            {/* High Level Analytics */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {mainStats.map((stat, i) => (
                    <Card key={i} className="border-border/40 shadow-sm group overflow-hidden relative bg-card/50 backdrop-blur-sm">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-[0.03] rounded-full bg-foreground group-hover:opacity-[0.06] transition-opacity" />
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} border border-current/10`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <Badge variant="outline" className="text-[8px]  tracking-tighter uppercase px-2">GÜNCEL DURUM</Badge>
                            </div>
                            <p className="text-[10px]  text-muted-foreground tracking-wider uppercase">{stat.label}</p>
                            <div className="mt-1 flex items-baseline gap-2">
                                <RevealFinancial amount={stat.value} className="text-3xl  tracking-tight" />
                            </div>
                            <p className="text-[9px] text-muted-foreground font-medium mt-2 leading-relaxed">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Accounts List */}
            <AccountList accounts={summary.accounts} />

            {/* Detailed Transactions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Statistics Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <h2 className="font-medium text-xs  tracking-wider">GELİR / GİDER ÖZETİ</h2>
                    </div>
                    {incomeStats.map((stat, i) => (
                        <Card key={i} className="border-border/40 bg-card/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px]  text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                        <RevealFinancial amount={stat.value} className="text-xl  tracking-tight" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="p-6 rounded-[2rem] bg-muted/30 border border-border/60 mt-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 opacity-[0.05] rounded-full bg-blue-500 group-hover:scale-110 transition-transform" />
                        <h4 className="font-medium text-[11px]  text-blue-500 mb-3 flex items-center gap-2 uppercase tracking-widest">
                            <AlertCircle className="h-4 w-4" /> BİLGİLENDİRME
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                            Finansal verileriniz tüm şubeler ve personeller genelinde anlık olarak güncellenir. "Net Varlık" hesaplaması mevcut nakit ve banka tutarlarınıza alacaklarınız eklenip borçlarınız düşülerek hesaplanır.
                        </p>
                    </div>
                </div>

                {/* Transactions Table */}
                <Card className="lg:col-span-3 border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                    <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <History className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="font-medium text-sm  tracking-tight">Finansal Hareketler</CardTitle>
                                <p className="text-[10px] text-muted-foreground  tracking-wider">HESAP BAZLI NAKİT AKIŞI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filtrele..."
                                    className="pl-9 h-9 rounded-xl text-[11px]  border-border/40 bg-muted/20"
                                />
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border/40 rounded-xl">
                                {["ALL", "CASH", "CARD", "TRANSFER"].map((method) => (
                                    <Button
                                        key={method}
                                        variant={paymentFilter === method ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setPaymentFilter(method)}
                                        className={cn(
                                            "h-7 text-[11px]  rounded-lg px-3 transition-all",
                                            paymentFilter === method ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {method === "ALL" ? "TÜMÜ" : paymentLabels[method]}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="font-medium bg-muted/10">
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        <TableHead className="font-medium py-4 pl-8 h-[60px]">
                                            <SortableHeader label="TARİH" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                        </TableHead>
                                        <TableHead className="font-medium py-4 h-[60px]">
                                            <SortableHeader label="HESAP / KANAL" field="accountId" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                        </TableHead>
                                        <TableHead className="font-medium py-4 h-[60px]">
                                            <SortableHeader label="AÇIKLAMA" field="description" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                        </TableHead>
                                        <TableHead className="font-medium text-[10px]  text-muted-foreground py-4">SORUMLU</TableHead>
                                        <TableHead className="font-medium pr-8 h-[60px]">
                                            <SortableHeader label="TUTAR" field="amount" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-xs  text-muted-foreground">
                                                {search || paymentFilter !== "ALL" ? "Filtre kriterine uyan işlem bulunamadı." : "Henüz finansal hareket yok."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedData.map((t) => (
                                            <TableRow key={t.id} className="border-border/10 hover:bg-muted/5 transition-colors group">
                                                <TableCell className="py-4 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] ">{format(new Date(t.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                        <span className="text-[9px] text-muted-foreground ">{format(new Date(t.createdAt), "HH:mm")}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px]  text-blue-500 flex items-center gap-1 uppercase tracking-wider">
                                                            {t.account?.name || 'GENEL KASA'}
                                                        </span>
                                                        <Badge variant="outline" className="w-fit text-[8px]  py-0 h-4 rounded-md bg-muted/20 opacity-70">
                                                            {paymentLabels[t.paymentMethod] || t.paymentMethod}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs  text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{t.description}</span>
                                                        {t.category && <span className="text-[8px]  text-muted-foreground/60 uppercase">{t.category}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-lg bg-muted border border-border/40 flex items-center justify-center text-[9px]  text-muted-foreground">
                                                            {t.user?.name?.charAt(0) || 'S'}
                                                        </div>
                                                        <span className="text-[10px]  uppercase">{t.user?.name || 'SİSTEM'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex flex-col items-end">
                                                        <div className={cn("flex items-center gap-1 text-sm ", t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500')}>
                                                            {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                                                            {t.type === 'INCOME' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                        </div>
                                                        <Badge variant={t.type === 'INCOME' ? 'secondary' : 'outline'} className={cn("text-[8px]  px-1.5 h-4 mt-1 border-none", t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                                                            {t.type === 'INCOME' ? 'TAHSİLAT' : 'ÖDEME'}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <div className="p-4 border-t border-border/40 flex items-center justify-between bg-muted/5">
                        <p className="text-[10px]  text-muted-foreground tracking-widest uppercase">
                            {filtered.length} / {transactions.length} İŞLEM LİSTELENİYOR
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}









