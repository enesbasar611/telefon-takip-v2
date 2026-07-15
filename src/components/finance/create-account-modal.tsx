"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Landmark, CreditCard, Loader2, Trash2 } from "lucide-react";
import { createAccount, updateAccount, createManualTransaction, deleteAccount } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

type AccountCurrency = "TRY" | "USD" | "EUR";
type ModalView = "FORM" | "BALANCE";

const moneyInputClass = "h-12 rounded-xl text-base bg-background border-border px-4 shadow-none focus-visible:ring-2 focus-visible:ring-primary/25 text-foreground font-semibold tabular-nums";
const fieldLabelClass = "text-sm font-semibold text-foreground";
const fieldHintClass = "text-xs leading-relaxed text-muted-foreground";

const parseMoney = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") return 0;
    const compact = value.trim().replace(/\s/g, "");
    const hasComma = compact.includes(",");
    const dotCount = (compact.match(/\./g) || []).length;
    const normalized = hasComma
        ? compact.replace(/\./g, "").replace(",", ".")
        : dotCount > 1
            ? compact.replace(/\.(?=.*\.)/g, "")
            : compact;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoneyInput = (value: number) => {
    return value.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const handleMoneyFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const amount = parseMoney(event.currentTarget.value);
    if (amount === 0) {
        event.currentTarget.value = "";
        return;
    }
    event.currentTarget.select();
};

const handleMoneyBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const amount = parseMoney(event.currentTarget.value);
    event.currentTarget.value = amount === 0 ? "0,00" : formatMoneyInput(amount);
};

export function CreateAccountModal({ account, trigger }: { account?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const [view, setView] = useState<ModalView>("FORM");
    const [selectedAccount, setSelectedAccount] = useState<any>(account || null);
    const [accountType, setAccountType] = useState<string>(selectedAccount?.type || "CASH");
    const { rates, defaultCurrency } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;
    const eurRate = Number(rates?.eur) > 0 ? Number(rates.eur) : 37;
    const [accountCurrency, setAccountCurrency] = useState<AccountCurrency>((selectedAccount?.currency || defaultCurrency || "TRY") as AccountCurrency);
    const [previewAmount, setPreviewAmount] = useState(0);
    const isEdit = !!account || (view === "FORM" && !!selectedAccount);

    const toTry = (amount: number, currency: AccountCurrency = accountCurrency) => {
        if (currency === "USD") return amount * usdRate;
        if (currency === "EUR") return amount * eurRate;
        return amount;
    };

    const fromTry = (amount: number, currency: AccountCurrency = accountCurrency) => {
        if (currency === "USD") return amount / usdRate;
        if (currency === "EUR") return amount / eurRate;
        return amount;
    };

    const previewTry = toTry(previewAmount);
    const previewUsd = previewTry / usdRate;
    const previewEur = previewTry / eurRate;

    const accountMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (view === "FORM" && selectedAccount) {
                const type = formData.get("type") as any;
                const balanceVal = parseMoney(formData.get("balance"));
                const limitVal = parseMoney(formData.get("limit"));
                const availableVal = parseMoney(formData.get("availableBalance"));
                const finalBalance = type === "CREDIT_CARD" ? limitVal - availableVal : balanceVal;
                return updateAccount(selectedAccount.id, {
                    name: formData.get("name") as string,
                    type,
                    currency: formData.get("currency") as any,
                    balance: finalBalance,
                    limit: limitVal,
                    billingDay: Number(formData.get("billingDay")) || 1
                });
            }
            if (view === "FORM") {
                const type = formData.get("type") as any;
                const balanceVal = parseMoney(formData.get("balance"));
                const limitVal = parseMoney(formData.get("limit"));
                const availableVal = parseMoney(formData.get("availableBalance"));
                const finalBalance = type === "CREDIT_CARD" ? limitVal - availableVal : balanceVal;
                return createAccount({
                    name: formData.get("name") as string,
                    type,
                    currency: formData.get("currency") as any,
                    initialBalance: finalBalance,
                    limit: limitVal,
                    billingDay: Number(formData.get("billingDay")) || 1
                });
            }
            if (view === "BALANCE" && selectedAccount) {
                const amount = parseMoney(formData.get("amount"));
                const description = formData.get("description") as string;
                return createManualTransaction({
                    type: "INCOME",
                    amount,
                    description: description || "Hızlı bakiye girişi",
                    paymentMethod: selectedAccount.type === "CASH" ? "CASH" : "TRANSFER",
                    currency: selectedAccount.currency || "TRY",
                    accountId: selectedAccount.id,
                    category: "HIZLI EKLE",
                    date: new Date().toISOString()
                });
            }
            return { success: false, error: "İşlem tipi bulunamadı." };
        },
        onSuccess: async (result) => {
            if (!result?.success) {
                toast.error(result?.error || "Bir hata oluştu");
                return;
            }
            toast.success("İşlem başarıyla tamamlandı.");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["finance-accounts"] }),
                queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["dashboard-init"] }),
                queryClient.invalidateQueries({ queryKey: ["dashboard-stat-detail"] }),
                queryClient.invalidateQueries({ queryKey: ["account-analytics"] }),
            ]);
            setOpen(false);
        },
        onError: () => toast.error("Bir hata oluştu"),
    });
    const loading = accountMutation.isPending;

    useEffect(() => {
        if (!open) return;

        setView("FORM");
        if (account) {
            const currency = (account.currency || defaultCurrency || "TRY") as AccountCurrency;
            setSelectedAccount(account);
            setAccountType(account.type);
            setAccountCurrency(currency);
            setPreviewAmount(fromTry(Number(account.balance || 0), currency));
            return;
        }

        const currency = (defaultCurrency || "TRY") as AccountCurrency;
        setSelectedAccount(null);
        setAccountType("CASH");
        setAccountCurrency(currency);
        setPreviewAmount(0);
    }, [open, account, defaultCurrency]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        accountMutation.mutate(new FormData(e.currentTarget));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : isEdit ? (
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 text-xs font-semibold hover:bg-orange-500/10 hover:text-orange-600">
                        Düzenle
                    </Button>
                ) : (
                    <Button className="h-12 rounded-xl px-5 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white text-sm font-semibold gap-2 transition-all">
                        <Plus className="h-4 w-4" /> Yeni Hesap Ekle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                overlayClassName="bg-background/70 backdrop-blur-sm"
                className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto border border-border bg-card text-card-foreground p-0 rounded-2xl shadow-2xl"
            >
                <div className={cn("h-1.5 w-full bg-gradient-to-r", isEdit ? "from-orange-500 to-amber-500" : "from-blue-500 to-emerald-500")} />

                <div className="p-6 sm:p-7">
                    <DialogHeader className="mb-6 p-0 text-left">
                        <div className="flex items-start gap-4">
                            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border shrink-0", accountType === "CASH" ? "bg-blue-500/10 border-blue-500/20" : accountType === "BANK" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-purple-500/10 border-purple-500/20")}>
                                {accountType === "CASH" ? <Wallet className="h-5 w-5 text-blue-600" /> : accountType === "BANK" ? <Landmark className="h-5 w-5 text-emerald-600" /> : <CreditCard className="h-5 w-5 text-purple-600" />}
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-xl font-bold tracking-normal text-foreground">
                                    {view === "FORM" ? (selectedAccount ? "Hesabı Düzenle" : "Yeni Hesap Oluştur") : "Bakiye Ekle"}
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Hesap türünü, para birimini ve açılış bakiyesini tanımlayın.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {view === "FORM" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className={fieldLabelClass}>Hesap adı</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        defaultValue={selectedAccount?.name}
                                        placeholder="Örn: Ziraat Bankası, dükkan kasası"
                                        className="h-12 rounded-xl text-sm bg-background border-border px-4 shadow-none focus-visible:ring-2 focus-visible:ring-primary/25 text-foreground font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className={fieldLabelClass}>Hesap türü</Label>
                                        <Select name="type" required value={accountType} onValueChange={(val) => setAccountType(val)}>
                                            <SelectTrigger className="h-12 rounded-xl text-sm bg-background border-border px-4 shadow-none text-foreground font-medium">
                                                <SelectValue placeholder="Tür seçin" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground p-1 shadow-xl">
                                                <SelectItem value="CASH" className="text-sm rounded-lg py-2.5 cursor-pointer">Nakit kasa</SelectItem>
                                                <SelectItem value="BANK" className="text-sm rounded-lg py-2.5 cursor-pointer">Banka hesabı</SelectItem>
                                                <SelectItem value="POS" className="text-sm rounded-lg py-2.5 cursor-pointer">POS cihazı</SelectItem>
                                                <SelectItem value="CREDIT_CARD" className="text-sm rounded-lg py-2.5 cursor-pointer">Kredi kartı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="currency" className={fieldLabelClass}>Hesap para birimi</Label>
                                        <Select name="currency" required value={accountCurrency} onValueChange={(val: AccountCurrency) => { setAccountCurrency(val); setPreviewAmount(0); }}>
                                            <SelectTrigger className="h-12 rounded-xl text-sm bg-background border-border px-4 shadow-none text-foreground font-medium">
                                                <SelectValue placeholder="Para birimi seçin" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground p-1 shadow-xl">
                                                <SelectItem value="TRY" className="text-sm rounded-lg py-2.5 cursor-pointer">TL hesabı</SelectItem>
                                                <SelectItem value="USD" className="text-sm rounded-lg py-2.5 cursor-pointer">USD hesabı</SelectItem>
                                                <SelectItem value="EUR" className="text-sm rounded-lg py-2.5 cursor-pointer">EUR hesabı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {accountType === "CREDIT_CARD" ? (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="limit" className={fieldLabelClass}>Kart limiti</Label>
                                                <Input
                                                    id="limit"
                                                    name="limit"
                                                    type="text"
                                                    inputMode="decimal"
                                                    required
                                                    defaultValue={selectedAccount?.limit ? formatMoneyInput(fromTry(Number(selectedAccount.limit))) : "0,00"}
                                                    onFocus={handleMoneyFocus}
                                                    onBlur={handleMoneyBlur}
                                                    className={moneyInputClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="availableBalance" className={fieldLabelClass}>Kullanılabilir bakiye</Label>
                                                <Input
                                                    id="availableBalance"
                                                    name="availableBalance"
                                                    type="text"
                                                    inputMode="decimal"
                                                    required
                                                    defaultValue={selectedAccount?.availableBalance ? formatMoneyInput(fromTry(Number(selectedAccount.availableBalance))) : "0,00"}
                                                    onFocus={handleMoneyFocus}
                                                    onBlur={handleMoneyBlur}
                                                    className={moneyInputClass}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billingDay" className={fieldLabelClass}>Hesap kesim günü</Label>
                                            <Input id="billingDay" name="billingDay" type="number" min="1" max="31" defaultValue={selectedAccount?.billingDay || "1"} className="h-12 rounded-xl text-sm bg-background border-border px-4 shadow-none text-foreground font-medium" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="balance" className={fieldLabelClass}>
                                            {selectedAccount ? "Güncel bakiye" : "Açılış bakiyesi"}
                                        </Label>
                                        <Input
                                            id="balance"
                                            name="balance"
                                            type="text"
                                            inputMode="decimal"
                                            defaultValue={selectedAccount?.balance ? formatMoneyInput(fromTry(Number(selectedAccount.balance))) : "0,00"}
                                            onFocus={handleMoneyFocus}
                                            onChange={(event) => setPreviewAmount(parseMoney(event.target.value))}
                                            onBlur={(event) => {
                                                handleMoneyBlur(event);
                                                setPreviewAmount(parseMoney(event.currentTarget.value));
                                            }}
                                            className={moneyInputClass}
                                        />
                                        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                                            <p className={fieldHintClass}>
                                                Girilen: <strong className="text-foreground">{formatMoneyInput(previewAmount)} {accountCurrency}</strong>
                                                <span className="mx-2 text-muted-foreground/60">•</span>
                                                TL karşılığı: <strong className="text-foreground">{formatMoneyInput(previewTry)} TRY</strong>
                                                <span className="mx-2 text-muted-foreground/60">•</span>
                                                USD karşılığı: <strong className="text-foreground">{formatMoneyInput(previewUsd)} USD</strong>
                                                <span className="mx-2 text-muted-foreground/60">•</span>
                                                EUR karşılığı: <strong className="text-foreground">{formatMoneyInput(previewEur)} EUR</strong>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                                    <p className="text-sm font-semibold text-muted-foreground">Hedef hesap</p>
                                    <p className="mt-1 text-base font-bold text-foreground">{selectedAccount?.name}</p>
                                    <p className="mt-1 text-sm text-emerald-600">Mevcut bakiye: {formatMoneyInput(Number(selectedAccount?.balance || 0))} TRY</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount" className={fieldLabelClass}>Eklenecek tutar</Label>
                                    <Input id="amount" name="amount" type="text" inputMode="decimal" required autoFocus placeholder="0,00" onFocus={handleMoneyFocus} onBlur={handleMoneyBlur} className={moneyInputClass} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className={fieldLabelClass}>Açıklama</Label>
                                    <Input id="description" name="description" placeholder="Örn: Günlük kasa girişi, elden nakit" className="h-12 rounded-xl text-sm bg-background border-border px-4 shadow-none text-foreground font-medium" />
                                </div>
                            </>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                            {selectedAccount && !selectedAccount.name?.toLowerCase().includes("merkez") && !(selectedAccount as any).isDefault && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        if (confirm(`${selectedAccount.name} hesabını silmek istediğinize emin misiniz?`)) {
                                            const res = await deleteAccount(selectedAccount.id);
                                            if (res.success) {
                                                toast.success("Hesap silindi.");
                                                setOpen(false);
                                                queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
                                            } else {
                                                toast.error(res.error);
                                            }
                                        }
                                    }}
                                    className="h-12 sm:w-12 rounded-xl border-rose-500/25 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center p-0"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl text-sm font-semibold border-border text-muted-foreground hover:text-foreground">
                                Vazgeç
                            </Button>
                            <Button type="submit" disabled={loading} className={cn("flex-[2] h-12 rounded-xl shadow-lg text-white text-sm font-semibold", isEdit ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20")}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (view === "FORM" ? (selectedAccount ? "Güncelle" : "Hesabı Oluştur") : "Bakiyeyi Ekle")}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
