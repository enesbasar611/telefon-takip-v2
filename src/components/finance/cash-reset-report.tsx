"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArchiveRestore, CalendarDays, CreditCard, Landmark, Wallet } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getCashRegisterResetReport } from "@/lib/actions/finance-actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { cn } from "@/lib/utils";

const periods = [
    { value: "DAY", label: "Günlük" },
    { value: "WEEK", label: "Haftalık" },
    { value: "MONTH", label: "Aylık" },
    { value: "ALL", label: "Tümü" },
] as const;

export function CashResetReport() {
    const [period, setPeriod] = useState<"DAY" | "WEEK" | "MONTH" | "ALL">("MONTH");
    const [accountId, setAccountId] = useState("ALL");
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;

    const { data, isPending } = useQuery({
        queryKey: ["cash-reset-report", period, accountId],
        queryFn: () => getCashRegisterResetReport({ period, accountId: accountId === "ALL" ? undefined : accountId }),
    });

    const resets = data?.resets || [];
    const accounts = data?.accounts || [];
    const total = useMemo(() => resets.reduce((sum: number, reset: any) => sum + Number(reset.totalBalance || 0), 0), [resets]);
    const displayTotal = defaultCurrency === "USD" ? total / usdRate : total;
    const symbol = defaultCurrency === "USD" ? "$" : "₺";

    const iconFor = (type: string) => {
        if (type === "BANK") return Landmark;
        if (type === "POS" || type === "CREDIT_CARD") return CreditCard;
        return Wallet;
    };

    return (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card/50 p-5 md:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ArchiveRestore className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-base">Kasa Sıfırlama Geçmişi</h2>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dönem kapanışları ve hesap bazlı son bakiyeler</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex rounded-xl border border-border/60 p-1">
                        {periods.map((item) => (
                            <Button key={item.value} type="button" variant="ghost" size="sm" onClick={() => setPeriod(item.value)} className={cn("h-8 rounded-lg text-[10px] px-3", period === item.value && "bg-amber-500/10 text-amber-700")}>
                                {item.label}
                            </Button>
                        ))}
                    </div>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="h-10 w-full sm:w-[220px] rounded-xl text-xs">
                            <SelectValue placeholder="Hesap seç" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm hesaplar</SelectItem>
                            {accounts.map((account: any) => (
                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Arşivlenen toplam</p>
                    <p className="text-xl font-bold tabular-nums">{symbol}{displayTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dönem sayısı</p>
                    <p className="text-xl font-bold tabular-nums">{resets.length}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Filtre</p>
                    <p className="text-sm font-semibold">{periods.find((item) => item.value === period)?.label}</p>
                </div>
            </div>

            <div className="space-y-3">
                {isPending ? (
                    <div className="h-28 rounded-xl bg-muted/30 animate-pulse" />
                ) : resets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                        Henüz sıfırlama geçmişi bulunmuyor.
                    </div>
                ) : resets.map((reset: any) => (
                    <div key={reset.id} className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="font-semibold">{reset.title}</h3>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {format(new Date(reset.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                                    {reset.user?.name ? ` • ${reset.user.name}` : ""}
                                </p>
                            </div>
                            <p className="text-lg font-bold tabular-nums">{symbol}{(defaultCurrency === "USD" ? Number(reset.totalBalance || 0) / usdRate : Number(reset.totalBalance || 0)).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                            {reset.accounts.map((account: any) => {
                                const Icon = iconFor(account.accountType);
                                const display = defaultCurrency === "USD" ? Number(account.closingBalance || 0) / usdRate : Number(account.closingBalance || 0);
                                return (
                                    <div key={account.id} className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate">{account.accountName}</p>
                                            <p className="text-[11px] text-muted-foreground tabular-nums">{symbol}{display.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
