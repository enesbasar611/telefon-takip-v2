"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, ArchiveRestore, Wallet, Landmark, CreditCard, Printer, Trash2, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCashRegisterReset } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function CashResetDetailModal({ reset, children }: { reset: any, children: React.ReactNode }) {
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;
    const symbol = defaultCurrency === "USD" ? "$" : "₺";
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    const displayTotal = defaultCurrency === "USD" ? Number(reset.totalBalance || 0) / usdRate : Number(reset.totalBalance || 0);

    const iconFor = (type: string) => {
        if (type === "BANK") return Landmark;
        if (type === "POS" || type === "CREDIT_CARD") return CreditCard;
        return Wallet;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (!window.confirm("Bu kasa kapanış kaydını silmek istediğinize emin misiniz?")) return;
        setIsDeleting(true);
        const res = await deleteCashRegisterReset(reset.id);
        setIsDeleting(false);
        if (res.success) {
            toast.success("Kasa kapanış kaydı silindi.");
            queryClient.invalidateQueries({ queryKey: ["cash-reset-report"] });
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
        } else {
            toast.error(res.error || "Kayıt silinemedi.");
        }
    };

    const periodLabel = reset.periodType === "MONTH" 
        ? "Aylık Kapanış" 
        : reset.periodType === "WEEK" 
            ? "Haftalık Kapanış" 
            : reset.periodType === "DAY" 
                ? "Günlük Kapanış" 
                : "Manuel Sıfırlama";

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[2rem] print:m-0 print:shadow-none print:border-none print:max-w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="print:block hidden mb-8 text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">Kasa Sıfırlama ve Bilanço Dekontu</h1>
                    <p className="text-sm text-gray-500 mt-1">{format(new Date(reset.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</p>
                </div>
                
                <DialogHeader className="print:hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <ArchiveRestore className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold">{reset.title}</DialogTitle>
                                    <Badge variant="outline" className="mt-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                                        {periodLabel}
                                    </Badge>
                                </div>
                            </div>
                            <DialogDescription className="text-xs">
                                Kasa sıfırlama dönemi ve arşivlenen hesap bakiyeleri detayı.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handlePrint} className="h-9 w-9 rounded-xl hidden sm:flex" title="Dekont Yazdır">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={handleDelete} 
                                disabled={isDeleting}
                                className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30" 
                                title="Kapanışı Sil"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-5 mt-3">
                    <div className="flex items-center justify-between rounded-2xl bg-muted/20 border border-border/50 p-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">İşlem Tarihi & Sorumlu</span>
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(reset.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                                {reset.user?.name ? ` • ${reset.user.name}` : ""}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Toplam Kapanış Bakiyesi</span>
                            <div className="text-2xl font-black tabular-nums text-foreground">
                                {symbol}{displayTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {reset.notes && (
                        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                Dönem Özeti & Notlar
                            </h4>
                            <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-medium">
                                {reset.notes}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                            Hesap Bazında Kapanış Bakiyeleri ({reset.accounts.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {reset.accounts.map((account: any) => {
                                const Icon = iconFor(account.accountType);
                                const display = defaultCurrency === "USD" ? Number(account.closingBalance || 0) / usdRate : Number(account.closingBalance || 0);
                                return (
                                    <div key={account.id} className="rounded-xl border border-border/50 bg-background/50 p-3.5 flex items-center justify-between group transition-colors hover:bg-muted/10">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{account.accountName}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {account.accountType === "CASH" ? "Nakit Kasa" : account.accountType === "BANK" ? "Banka Hesabı" : account.accountType === "POS" ? "POS Cihazı" : account.accountType === "CREDIT_CARD" ? "Kredi Kartı" : "Hesap"}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-black tabular-nums text-foreground shrink-0">
                                            {symbol}{display.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                <div className="print:block hidden mt-16 text-center text-xs text-gray-400">
                    Sistem tarafından otomatik olarak üretilmiştir. Başar Teknik ERP.
                </div>
            </DialogContent>
        </Dialog>
    );
}
