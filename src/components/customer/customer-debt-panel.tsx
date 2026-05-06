"use client";

import React, { useState, useTransition } from "react";
import {
    CreditCard,
    Wallet,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Calendar,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    History,
    DollarSign,
    Banknote,
    Receipt,
    Loader2,
    Printer,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { collectGlobalCustomerPayment } from "@/lib/actions/debt-actions";
import { DebtReceiptModal } from "@/components/finance/debt-receipt-modal";

interface CustomerDebtPanelProps {
    customer: any;
    accounts: any[];
    shop?: any;
}

export function CustomerDebtPanel({ customer, accounts, shop }: CustomerDebtPanelProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"debts" | "transactions">("debts");

    // Receipt State
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [receiptDebts, setReceiptDebts] = useState<any[]>([]);

    // Payment Form State
    const [paymentAmount, setPaymentAmount] = useState<string>("0");
    const [paymentCurrency, setPaymentCurrency] = useState<string>("TRY");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [accountId, setAccountId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [usdRate, setUsdRate] = useState<number>(34.5);

    const debts = customer?.debts || [];
    const unpaidDebts = debts.filter((d: any) => !d.isPaid);
    const transactions = customer?.transactions || [];

    const totalDebtTRY = debts.reduce((acc: number, d: any) =>
        d.currency === "TRY" ? acc + Number(d.remainingAmount) : acc, 0
    );
    const totalDebtUSD = debts.reduce((acc: number, d: any) =>
        d.currency === "USD" ? acc + Number(d.remainingAmount) : acc, 0
    );

    const formatWithCurrency = (amount: number, currency: string = "TRY") => {
        const formatted = formatCurrency(amount, false);
        return currency === "USD" ? `$${formatted}` : `₺${formatted}`;
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(unpaidDebts.map((d: any) => d.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((sid) => sid !== id));
        }
    };

    const openPaymentModal = (specificIds?: string[]) => {
        const idsToPay = specificIds || selectedIds;
        if (idsToPay.length === 0 && !specificIds) {
            // If nothing selected and no specific IDs, offer to pay everything
            setSelectedIds(unpaidDebts.map((d: any) => d.id));
        } else if (specificIds) {
            setSelectedIds(specificIds);
        }

        // Calculate sum of selected
        const targetDebts = debts.filter((d: any) => (specificIds || selectedIds).includes(d.id));
        let total = 0;
        const firstCurrency = targetDebts[0]?.currency || "TRY";

        targetDebts.forEach((d: any) => {
            if (d.currency === firstCurrency) {
                total += Number(d.remainingAmount);
            } else {
                // Simple conversion for initial suggestion if mixed
                if (firstCurrency === "TRY" && d.currency === "USD") total += Number(d.remainingAmount) * usdRate;
                else if (firstCurrency === "USD" && d.currency === "TRY") total += Number(d.remainingAmount) / usdRate;
            }
        });

        setPaymentAmount(total.toFixed(2));
        setPaymentCurrency(firstCurrency);
        setIsPaymentModalOpen(true);
    };

    const handleCollectPayment = async () => {
        if (Number(paymentAmount) <= 0) {
            toast.error("Geçerli bir tutar giriniz.");
            return;
        }

        startTransition(async () => {
            const result = await collectGlobalCustomerPayment(
                customer.id,
                Number(paymentAmount),
                paymentCurrency,
                paymentMethod,
                accountId || undefined,
                usdRate,
                notes,
                selectedIds
            );

            if (result.success) {
                toast.success("Ödeme başarıyla alındı.");
                setIsPaymentModalOpen(false);
                setSelectedIds([]);
                router.refresh();
            } else {
                toast.error(result.error || "Ödeme alınamadı.");
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Toplam Borç (TL)</p>
                                <h3 className="text-2xl font-bold mt-1">{formatWithCurrency(totalDebtTRY, "TRY")}</h3>
                            </div>
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Toplam Borç (USD)</p>
                                <h3 className="text-2xl font-bold mt-1">{formatWithCurrency(totalDebtUSD, "USD")}</h3>
                            </div>
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Ödenmemiş Kayıt</p>
                                <h3 className="text-2xl font-bold mt-1">{unpaidDebts.length} Adet</h3>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <Receipt className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions & Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-1">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("debts")}
                        className={cn(
                            "pb-2 text-sm font-semibold transition-colors relative",
                            activeTab === "debts" ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Açık Borçlar
                        {activeTab === "debts" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={cn(
                            "pb-2 text-sm font-semibold transition-colors relative",
                            activeTab === "transactions" ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Tahsilat Geçmişi
                        {activeTab === "transactions" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                    </button>
                </div>

                {activeTab === "debts" && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setReceiptDebts(unpaidDebts);
                                setReceiptVisible(true);
                            }}
                            disabled={unpaidDebts.length === 0}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Fiş Yazdır
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll(true)}
                            disabled={unpaidDebts.length === 0}
                        >
                            Tümünü Seç
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={selectedIds.length === 0}
                            onClick={() => openPaymentModal()}
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            {selectedIds.length > 0 ? `Seçilenleri Öde (${selectedIds.length})` : "Ödeme Al"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {activeTab === "debts" ? (
                <Card>
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedIds.length === unpaidDebts.length && unpaidDebts.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    />
                                </TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Toplam</TableHead>
                                <TableHead>Kalan</TableHead>
                                <TableHead>Vade</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm italic">
                                        Bu müşteriye ait borç kaydı bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                debts.map((debt: any) => (
                                    <TableRow
                                        key={debt.id}
                                        className={cn(
                                            "transition-colors",
                                            debt.isPaid
                                                ? "bg-emerald-500/[0.05] border-emerald-500/20"
                                                : selectedIds.includes(debt.id) && "bg-blue-50/50 dark:bg-blue-950/20"
                                        )}
                                    >
                                        <TableCell>
                                            {!debt.isPaid && (
                                                <Checkbox
                                                    checked={selectedIds.includes(debt.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(debt.id, !!checked)}
                                                />
                                            )}
                                            {debt.isPaid && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(debt.createdAt), "dd MMM yyyy", { locale: tr })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {debt.notes || "Satış İşlemi"}
                                                </span>
                                                {debt.sale && (
                                                    <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                                                        Fiş: #{debt.sale.id.substring(0, 8)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap font-medium text-sm">
                                            {formatWithCurrency(debt.amount, debt.currency)}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "whitespace-nowrap font-bold text-sm",
                                            debt.isPaid ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {formatWithCurrency(debt.remainingAmount, debt.currency)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {debt.dueDate ? (
                                                <span className={cn(
                                                    "flex items-center gap-1",
                                                    new Date(debt.dueDate) < new Date() && !debt.isPaid ? "text-rose-600 font-medium" : "text-muted-foreground"
                                                )}>
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(debt.dueDate), "dd.MM.yyyy")}
                                                </span>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "px-2 py-0.5 text-[10px]",
                                                    debt.isPaid
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
                                                )}
                                            >
                                                {debt.isPaid ? "ÖDENDİ" : "BORÇ"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!debt.isPaid && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                    onClick={() => openPaymentModal([debt.id])}
                                                >
                                                    Öde
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Yöntem</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Kasa/Banka</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm italic">
                                        Henüz bir tahsilat kaydı bulunmamaktadır.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx: any) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {tx.description}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">
                                                {tx.paymentMethod === 'CASH' ? 'Nakit' : tx.paymentMethod === 'CARD' ? 'Kart' : 'Havale'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-black text-emerald-600">
                                            + {formatWithCurrency(tx.amount, "TRY")}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {tx.financeAccount?.name || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Borç Tahsilatı</DialogTitle>
                        <DialogDescription>
                            {selectedIds.length} adet kayıt için ödeme alıyorsunuz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Tutar</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="amount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="flex-1"
                                />
                                <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue placeholder="Döviz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRY">TL</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {paymentCurrency === "USD" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rate" className="text-right text-xs">Kur (1$)</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    value={usdRate}
                                    onChange={(e) => setUsdRate(Number(e.target.value))}
                                    className="col-span-3"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Yöntem</Label>
                            <div className="col-span-3 flex gap-2">
                                <Button
                                    type="button"
                                    variant={paymentMethod === "CASH" ? "default" : "outline"}
                                    className="flex-1 text-xs px-2"
                                    onClick={() => setPaymentMethod("CASH")}
                                >
                                    Nakit
                                </Button>
                                <Button
                                    type="button"
                                    variant={paymentMethod === "CARD" ? "default" : "outline"}
                                    className="flex-1 text-xs px-2"
                                    onClick={() => setPaymentMethod("CARD")}
                                >
                                    Kart
                                </Button>
                                <Button
                                    type="button"
                                    variant={paymentMethod === "TRANSFER" ? "default" : "outline"}
                                    className="flex-1 text-xs px-2"
                                    onClick={() => setPaymentMethod("TRANSFER")}
                                >
                                    Havale
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="account" className="text-right">Hesap</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Finans Hesabı Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name} ({formatWithCurrency(acc.balance, "TRY")})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Not</Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ödeme notu..."
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>İptal</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleCollectPayment}
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tahsilatı Onayla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DebtReceiptModal
                open={receiptVisible}
                onClose={() => setReceiptVisible(false)}
                customer={customer}
                debts={receiptDebts}
                shopName={shop?.name}
                shopPhone={shop?.phone}
            />
        </div>
    );
}

