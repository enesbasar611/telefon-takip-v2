"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveRestore, Check, CreditCard, Landmark, Loader2, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetCashRegisters } from "@/lib/actions/finance-actions";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

export function CashResetModal({ accounts = [] }: { accounts: any[] }) {
    const [open, setOpen] = useState(false);
    const [resetScope, setResetScope] = useState<"ALL" | "CUSTOM">("ALL");
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const queryClient = useQueryClient();
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;

    const selectedAccounts = useMemo(() => {
        if (resetScope === "ALL") return accounts;
        return accounts.filter((account) => selectedAccountIds.includes(account.id));
    }, [accounts, resetScope, selectedAccountIds]);
    const totalTry = useMemo(() => selectedAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0), [selectedAccounts]);
    const displayTotal = defaultCurrency === "USD" ? totalTry / usdRate : totalTry;
    const symbol = defaultCurrency === "USD" ? "$" : "₺";
    const selectedCount = selectedAccounts.length;

    const toggleAccount = (accountId: string) => {
        setSelectedAccountIds((prev) =>
            prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
        );
    };

    const accountIcon = (type: string) => {
        if (type === "BANK") return Landmark;
        if (type === "POS" || type === "CREDIT_CARD") return CreditCard;
        return Wallet;
    };

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => resetCashRegisters({
            title: formData.get("title") as string,
            notes: formData.get("notes") as string,
            periodType: "MANUAL",
            accountIds: resetScope === "CUSTOM" ? selectedAccountIds : undefined,
        }),
        onSuccess: async (result) => {
            if (!result.success) {
                toast.error(result.error || "Kasalar sıfırlanamadı.");
                return;
            }
            toast.success("Kasalar sıfırlandı, dönem bakiyeleri geçmişe kaydedildi.");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
                queryClient.invalidateQueries({ queryKey: ["finance-accounts"] }),
                queryClient.invalidateQueries({ queryKey: ["cash-reset-report"] }),
                queryClient.invalidateQueries({ queryKey: ["dashboard-init"] }),
            ]);
            setResetScope("ALL");
            setSelectedAccountIds([]);
            setOpen(false);
        },
        onError: () => toast.error("Kasalar sıfırlanamadı."),
    });

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
                setResetScope("ALL");
                setSelectedAccountIds([]);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 rounded-xl px-4 text-xs font-bold uppercase tracking-widest gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                    <RotateCcw className="h-4 w-4" />
                    Kasaları Sıfırla
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] rounded-2xl border-border/60">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        mutation.mutate(new FormData(event.currentTarget));
                    }}
                    className="space-y-6"
                >
                    <DialogHeader>
                        <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <ArchiveRestore className="h-5 w-5 text-amber-600" />
                        </div>
                        <DialogTitle>Kasaları sıfırlamak istiyor musunuz?</DialogTitle>
                        <DialogDescription>
                            Aktif hesapların son bakiyeleri dönem geçmişine kaydedilecek, ardından hesap bakiyeleri 0 olarak devam edecek.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sıfırlanacak toplam bakiye</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums">{symbol}{displayTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</p>
                        <p className="text-[11px] text-muted-foreground">{selectedCount} aktif hesap arşivlenecek.</p>
                    </div>

                    <div className="space-y-3">
                        <Label>Sıfırlanacak kasalar</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setResetScope("ALL")}
                                className={`h-11 rounded-xl text-xs ${resetScope === "ALL" ? "border-amber-500 bg-amber-500/10 text-amber-700" : ""}`}
                            >
                                Tüm Kasalar
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setResetScope("CUSTOM")}
                                className={`h-11 rounded-xl text-xs ${resetScope === "CUSTOM" ? "border-amber-500 bg-amber-500/10 text-amber-700" : ""}`}
                            >
                                Seçili Kasalar
                            </Button>
                        </div>
                        {resetScope === "CUSTOM" && (
                            <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/60">
                                {accounts.map((account) => {
                                    const Icon = accountIcon(account.type);
                                    const checked = selectedAccountIds.includes(account.id);
                                    return (
                                        <button
                                            key={account.id}
                                            type="button"
                                            onClick={() => toggleAccount(account.id)}
                                            className="w-full min-h-14 px-3 py-2 flex items-center justify-between gap-3 text-left hover:bg-muted/40"
                                        >
                                            <span className="flex items-center gap-3 min-w-0">
                                                <span className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-medium truncate">{account.name}</span>
                                                    <span className="block text-[11px] text-muted-foreground">{account.type} • {account.currency || "TRY"}</span>
                                                </span>
                                            </span>
                                            <span className={`h-6 w-6 rounded-md border flex items-center justify-center shrink-0 ${checked ? "bg-amber-600 border-amber-600 text-white" : "border-border"}`}>
                                                {checked && <Check className="h-4 w-4" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reset-title">Dönem adı</Label>
                        <Input id="reset-title" name="title" placeholder="Örn: Temmuz 2026 Kasa Kapanışı" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reset-notes">Not</Label>
                        <Input id="reset-notes" name="notes" placeholder="İsteğe bağlı açıklama" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || selectedCount === 0} className="bg-amber-600 text-white hover:bg-amber-700">
                            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sıfırla ve Arşivle"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
