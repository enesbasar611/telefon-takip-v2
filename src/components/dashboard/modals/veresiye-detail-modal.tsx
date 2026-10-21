"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Users,
    Search,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Phone,
    Calendar,
    ArrowUpRight,
    Plus,
    Loader2,
    ArrowDownCircle,
    Receipt,
    Clock,
    AlertCircle,
    UserCheck,
    MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { getDebtDetails } from "@/lib/actions/dashboard-detail-actions";
import { AddDebtModal } from "@/components/finance/add-debt-modal";

interface VeresiyeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    rates?: any;
    defaultCurrency?: string;
}

export function VeresiyeDetailModal({
    isOpen,
    onClose,
    rates,
    defaultCurrency = "TRY",
}: VeresiyeDetailModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
    const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);

    const { data: customers = [], isLoading, isFetching } = useQuery<any[]>({
        queryKey: ["dashboard-veresiye-detail"],
        queryFn: () => getDebtDetails(),
        enabled: isOpen,
        staleTime: 60 * 1000,
    });

    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const q = searchQuery.toLowerCase().trim();
        return customers.filter((c: any) =>
            c.name?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q)
        );
    }, [customers, searchQuery]);

    const summary = useMemo(() => {
        let totalTRY = 0;
        let totalUSD = 0;
        let totalItems = 0;

        customers.forEach((c: any) => {
            totalTRY += Number(c.totalRemainingTRY || 0);
            totalUSD += Number(c.totalRemainingUSD || 0);
            totalItems += Number(c.debtCount || 0);
        });

        return {
            totalTRY,
            totalUSD,
            customerCount: customers.length,
            totalItems,
        };
    }, [customers]);

    const formatMoney = (val: number, cur: string = "TRY") => {
        const symbol = cur === "USD" ? "$" : cur === "EUR" ? "€" : "₺";
        return `${symbol}${val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="border-border/40 p-0 overflow-hidden bg-background/95 dark:bg-zinc-950/98 backdrop-blur-3xl rounded-[2rem] shadow-2xl transition-all sm:max-w-3xl max-h-[90vh] flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

                    {/* Header */}
                    <DialogHeader className="p-6 sm:p-7 pb-4 border-b border-border/40 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-inner shrink-0">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="font-extrabold text-xl sm:text-2xl tracking-tight uppercase text-foreground">
                                            Veresiyeler
                                        </DialogTitle>
                                        <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/30 text-indigo-500 bg-indigo-500/5">
                                            {customers.length} Müşteri
                                        </Badge>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground font-medium">
                                        Açık müşteri bakiyeleri ve borç detayları
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    onClick={() => setIsAddDebtOpen(true)}
                                    className="rounded-xl h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Alacak Ekle</span>
                                </Button>
                                <Link href="/veresiye" onClick={onClose}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl h-9 text-xs font-bold gap-1.5 border-border/60 hover:bg-muted/50"
                                    >
                                        <span>Tüm Veresiyeler</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Summary KPI Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4">
                            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Toplam Açık Borç (TL)
                                </span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-0.5">
                                    {formatMoney(summary.totalTRY, "TRY")}
                                </span>
                            </div>

                            {summary.totalUSD > 0 ? (
                                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        Toplam Açık Borç (USD)
                                    </span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">
                                        {formatMoney(summary.totalUSD, "USD")}
                                    </span>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        Açık Borçlu Müşteri
                                    </span>
                                    <span className="text-lg font-black text-foreground tracking-tight mt-0.5">
                                        {summary.customerCount} Kişi
                                    </span>
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Toplam Açık Kalem
                                </span>
                                <span className="text-lg font-black text-foreground tracking-tight mt-0.5">
                                    {summary.totalItems} İşlem
                                </span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative pt-3">
                            <Search className="absolute left-3.5 top-[calc(50%+6px)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Müşteri adı veya telefon ile ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/60 text-xs"
                            />
                        </div>
                    </DialogHeader>

                    {/* Scrollable Customer List */}
                    <ScrollArea className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                <span className="text-xs font-semibold animate-pulse">Veresiye kayıtları yükleniyor...</span>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <div className="h-14 w-14 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground/60">
                                    <UserCheck className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-foreground">
                                        {searchQuery ? "Aramaya uygun müşteri bulunamadı" : "Açık veresiye kaydı bulunmuyor"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {searchQuery ? "Farklı bir arama terimi deneyin." : "Tüm müşterilerin borç bakiyeleri kapatılmış."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCustomers.map((cust: any) => {
                                    const isExpanded = expandedCustomerId === cust.id;
                                    const initial = cust.name ? cust.name.charAt(0).toUpperCase() : "?";

                                    return (
                                        <div
                                            key={cust.id}
                                            className="rounded-2xl border border-border/50 bg-card/60 hover:bg-card/90 transition-all overflow-hidden shadow-sm"
                                        >
                                            {/* Customer Header Row */}
                                            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm tracking-tight text-foreground truncate">
                                                                {cust.name}
                                                            </h4>
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md font-semibold shrink-0">
                                                                {cust.debtCount} işlem
                                                            </Badge>
                                                        </div>
                                                        {cust.phone ? (
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                                <Phone className="h-3 w-3 shrink-0" />
                                                                <span>{cust.phone}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground/60">Telefon kaydı yok</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Balances and Actions */}
                                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                                                    <div className="text-left sm:text-right">
                                                        <div className="text-base font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                                            {formatMoney(cust.totalRemainingTRY, "TRY")}
                                                        </div>
                                                        {cust.totalRemainingUSD > 0 && (
                                                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                                {formatMoney(cust.totalRemainingUSD, "USD")}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <Link
                                                            href={`/veresiye?search=${encodeURIComponent(cust.name)}`}
                                                            onClick={onClose}
                                                            className="inline-flex"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 rounded-lg gap-1"
                                                                title="Veresiye Sayfasında Aç"
                                                            >
                                                                <span>Sayfaya Git</span>
                                                                <ArrowUpRight className="h-3 w-3" />
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                                                            className="h-8 px-2 text-xs font-semibold rounded-lg border-border/50 gap-1 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <span>Detay</span>
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Individual Debt Items */}
                                            {isExpanded && cust.debts && cust.debts.length > 0 && (
                                                <div className="px-4 pb-4 pt-1 bg-muted/20 border-t border-border/30 animate-in fade-in duration-200">
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 mb-2 mt-1">
                                                        Açık Borç Kalemleri:
                                                    </div>
                                                    <div className="space-y-2">
                                                        {cust.debts.map((item: any) => {
                                                            const itemDate = item.createdAt ? new Date(item.createdAt) : null;
                                                            const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
                                                            const isPartial = item.remainingAmount < item.amount - 0.01;

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    className="p-2.5 rounded-xl bg-background/80 border border-border/40 flex items-center justify-between gap-3 text-xs"
                                                                >
                                                                    <div className="space-y-0.5 min-w-0">
                                                                        <div className="font-semibold text-foreground truncate flex items-center gap-2">
                                                                            <span>
                                                                                {item.notes ||
                                                                                    (item.items?.length
                                                                                        ? item.items.map((i: any) => `${i.productName} (x${i.quantity})`).join(", ")
                                                                                        : "Veresiye Kaydı")}
                                                                            </span>
                                                                            {item.saleNumber && (
                                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold shrink-0">
                                                                                    #{item.saleNumber}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                                            {itemDate && (
                                                                                <span>{format(itemDate, "d MMM yyyy, HH:mm", { locale: tr })}</span>
                                                                            )}
                                                                            {isOverdue && (
                                                                                <span className="text-rose-500 font-bold">
                                                                                    • Vadesi Geçti
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-right shrink-0">
                                                                        <div className="font-bold text-foreground">
                                                                            {formatMoney(item.remainingAmount, item.currency)}
                                                                        </div>
                                                                        {isPartial && (
                                                                            <span className="text-[10px] text-muted-foreground italic">
                                                                                (Asıl: {formatMoney(item.amount, item.currency)})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Quick Add Debt Modal from Veresiye Detail */}
            {isAddDebtOpen && (
                <AddDebtModal
                    open={isAddDebtOpen}
                    onOpenChange={setIsAddDebtOpen}
                    rates={rates}
                />
            )}
        </>
    );
}
