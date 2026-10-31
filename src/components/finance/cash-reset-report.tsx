"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArchiveRestore, CalendarDays, CreditCard, Landmark, Wallet, Plus, Filter, Sparkles, Archive, Search } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getCashRegisterResetReport } from "@/lib/actions/finance-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { cn } from "@/lib/utils";
import { CashResetModal } from "./cash-reset-modal";
import { CashResetDetailModal } from "./cash-reset-detail-modal";

const periods = [
    { value: "ALL", label: "Tümü" },
    { value: "MONTH", label: "Aylık" },
    { value: "WEEK", label: "Haftalık" },
    { value: "DAY", label: "Günlük" },
] as const;

export function CashResetReport() {
    const [period, setPeriod] = useState<"ALL" | "MONTH" | "WEEK" | "DAY">("ALL");
    const [selectedMonthYear, setSelectedMonthYear] = useState<string>("ALL");
    const [accountId, setAccountId] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;

    // Parse selected year and month if a specific month is chosen
    const filterYear = selectedMonthYear !== "ALL" ? Number(selectedMonthYear.split("-")[0]) : undefined;
    const filterMonth = selectedMonthYear !== "ALL" ? Number(selectedMonthYear.split("-")[1]) : undefined;

    const { data, isPending } = useQuery({
        queryKey: ["cash-reset-report", period, accountId, filterYear, filterMonth],
        queryFn: () => getCashRegisterResetReport({
            period: selectedMonthYear !== "ALL" ? undefined : period,
            year: filterYear,
            month: filterMonth,
            accountId: accountId === "ALL" ? undefined : accountId
        }),
    });

    const resets = data?.resets || [];
    const accounts = data?.accounts || [];

    // Filter resets by search term
    const filteredResets = useMemo(() => {
        if (!searchQuery.trim()) return resets;
        const q = searchQuery.toLowerCase();
        return resets.filter((r: any) =>
            r.title?.toLowerCase().includes(q) ||
            r.notes?.toLowerCase().includes(q) ||
            r.accounts?.some((a: any) => a.accountName?.toLowerCase().includes(q))
        );
    }, [resets, searchQuery]);

    const total = useMemo(() => filteredResets.reduce((sum: number, reset: any) => sum + Number(reset.totalBalance || 0), 0), [filteredResets]);
    const displayTotal = defaultCurrency === "USD" ? total / usdRate : total;
    const symbol = defaultCurrency === "USD" ? "$" : "₺";

    const iconFor = (type: string) => {
        if (type === "BANK") return Landmark;
        if (type === "POS" || type === "CREDIT_CARD") return CreditCard;
        return Wallet;
    };

    // Generate Month Options: dynamically include past 12 calendar months + any existing reset dates
    const monthOptions = useMemo(() => {
        const set = new Set<string>();
        const now = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
        resets.forEach((r: any) => {
            if (r.createdAt) {
                const d = new Date(r.createdAt);
                set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
            }
        });

        const list = Array.from(set).sort().reverse();
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        return list.map((val) => {
            const [y, m] = val.split("-");
            return {
                value: val,
                label: `${monthNames[Number(m) - 1]} ${y}`
            };
        });
    }, [resets]);

    return (
        <section className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 md:p-6 space-y-6 shadow-sm">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <ArchiveRestore className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-base text-foreground tracking-tight">Kasa Sıfırlama Geçmişi</h2>
                            <Badge variant="outline" className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border-indigo-500/20 uppercase tracking-widest">
                                Bilanço & Arşiv
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Dönem kapanışları, aylık mühürlü bilançolar ve hesap bazlı son bakiyeler
                        </p>
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <CashResetModal 
                        defaultTab="MONTH"
                        trigger={
                            <Button className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-600/20 transition-all">
                                <CalendarDays className="h-4 w-4" />
                                <span>AY SEÇEREK KAPAT (OTOMATİK)</span>
                            </Button>
                        } 
                    />
                    <CashResetModal 
                        defaultTab="LIVE"
                        trigger={
                            <Button variant="outline" className="h-10 px-3.5 rounded-xl border-rose-300 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs gap-1.5 transition-all">
                                <Archive className="h-4 w-4" />
                                <span>KASALARI SIFIRLA</span>
                            </Button>
                        } 
                    />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 pt-1 border-t border-border/40">
                {/* Period Selector Tabs */}
                <div className="flex rounded-xl bg-muted/40 p-1 border border-border/50 shrink-0">
                    {periods.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                                setPeriod(item.value);
                                setSelectedMonthYear("ALL");
                            }}
                            className={cn(
                                "h-8 rounded-lg text-xs font-bold px-3 transition-all",
                                period === item.value && selectedMonthYear === "ALL"
                                    ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Month/Year Dropdown Filter */}
                <div className="w-full sm:w-[180px]">
                    <Select 
                        value={selectedMonthYear} 
                        onValueChange={(val) => {
                            setSelectedMonthYear(val);
                        }}
                    >
                        <SelectTrigger className="h-9 rounded-xl text-xs font-medium bg-background/80 border-border/60">
                            <SelectValue placeholder="Ay Seçimi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Aylar</SelectItem>
                            {monthOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Account Filter */}
                <div className="w-full sm:w-[180px]">
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="h-9 rounded-xl text-xs font-medium bg-background/80 border-border/60">
                            <SelectValue placeholder="Hesap seç" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Hesaplar</SelectItem>
                            {accounts.map((account: any) => (
                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Kapanış veya not ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-8 text-xs rounded-xl bg-background/80 border-border/60"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Arşivlenen Toplam Bakiye</p>
                    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                        {symbol}{displayTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Kapanış / Dönem Sayısı</p>
                    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">{filteredResets.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtre & Kapsam</p>
                    <p className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">
                        {selectedMonthYear !== "ALL" 
                            ? (monthOptions.find(m => m.value === selectedMonthYear)?.label || selectedMonthYear)
                            : (periods.find(p => p.value === period)?.label || "Tümü")}
                        {accountId !== "ALL" ? ` • ${accounts.find((a: any) => a.id === accountId)?.name || ""}` : ""}
                    </p>
                </div>
            </div>

            {/* Resets List */}
            <div className="space-y-3">
                {isPending ? (
                    <div className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
                ) : filteredResets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
                            <ArchiveRestore className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Henüz kayıtlı kapanış bulunmuyor</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Yukarıdaki "Ay Seçerek Kapat" butonuna tıklayarak dilediğiniz geçmiş ayın 1. ve son günü arasını otomatik kapatıp arşive ekleyebilirsiniz.
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredResets.map((reset: any) => {
                        const periodBadge = reset.periodType === "MONTH"
                            ? { label: "Aylık Kapanış", cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" }
                            : reset.periodType === "WEEK"
                                ? { label: "Haftalık Kapanış", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
                                : reset.periodType === "DAY"
                                    ? { label: "Günlük Kapanış", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" }
                                    : { label: "Manuel Sıfırlama", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" };

                        return (
                            <CashResetDetailModal key={reset.id} reset={reset}>
                                <div className="rounded-2xl border border-border/60 bg-background/50 hover:bg-muted/15 p-4 sm:p-5 space-y-4 cursor-pointer hover:border-indigo-500/30 transition-all group shadow-2xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {reset.title}
                                                </h3>
                                                <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider", periodBadge.cls)}>
                                                    {periodBadge.label}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span>{format(new Date(reset.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</span>
                                                {reset.user?.name && <span>• {reset.user.name}</span>}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Dönem Bakiyesi</span>
                                            <span className="text-base sm:text-lg font-black text-foreground tabular-nums">
                                                {symbol}{(defaultCurrency === "USD" ? Number(reset.totalBalance || 0) / usdRate : Number(reset.totalBalance || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Accounts Breakdown Preview */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 pt-1 border-t border-border/30">
                                        {reset.accounts.map((account: any) => {
                                            const Icon = iconFor(account.accountType);
                                            const display = defaultCurrency === "USD" ? Number(account.closingBalance || 0) / usdRate : Number(account.closingBalance || 0);
                                            return (
                                                <div key={account.id} className="rounded-xl border border-border/50 bg-muted/20 p-2.5 flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center shrink-0">
                                                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-bold text-foreground truncate">{account.accountName}</p>
                                                        <p className="text-[10px] text-muted-foreground font-semibold tabular-nums">
                                                            {symbol}{display.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Brief summary notes snippet if present */}
                                    {reset.notes && (
                                        <div className="text-[11px] text-muted-foreground/90 bg-muted/10 border border-border/30 rounded-xl px-3 py-1.5 truncate">
                                            {reset.notes.split("\n")[0]}
                                        </div>
                                    )}
                                </div>
                            </CashResetDetailModal>
                        );
                    })
                )}
            </div>
        </section>
    );
}
