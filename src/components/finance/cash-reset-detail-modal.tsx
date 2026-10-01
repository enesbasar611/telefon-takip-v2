"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, ArchiveRestore, Wallet, Landmark, CreditCard, Printer } from "lucide-react";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { Button } from "@/components/ui/button";

export function CashResetDetailModal({ reset, children }: { reset: any, children: React.ReactNode }) {
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 34;
    const symbol = defaultCurrency === "USD" ? "$" : "₺";

    const displayTotal = defaultCurrency === "USD" ? Number(reset.totalBalance || 0) / usdRate : Number(reset.totalBalance || 0);

    const iconFor = (type: string) => {
        if (type === "BANK") return Landmark;
        if (type === "POS" || type === "CREDIT_CARD") return CreditCard;
        return Wallet;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[2rem] print:m-0 print:shadow-none print:border-none print:max-w-full">
                <div className="print:block hidden mb-8 text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">Kasa Sıfırlama Dekontu</h1>
                    <p className="text-sm text-gray-500 mt-1">{format(new Date(reset.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</p>
                </div>
                
                <DialogHeader className="print:hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <ArchiveRestore className="h-5 w-5 text-amber-600" />
                                </div>
                                <DialogTitle className="text-xl">{reset.title}</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs">
                                Kasa sıfırlama dönemi ve arşivlenen hesap bakiyeleri detayı.
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handlePrint} className="h-9 w-9 rounded-lg hidden sm:flex">
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border/50 p-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">İşlem Tarihi & Sorumlu</span>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(reset.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                                {reset.user?.name ? ` • ${reset.user.name}` : ""}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Toplam Arşiv</span>
                            <div className="text-2xl font-bold tabular-nums">
                                {symbol}{displayTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {reset.notes && (
                        <div className="rounded-xl border border-dashed border-border/60 p-4 bg-muted/5">
                            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Notlar</h4>
                            <p className="text-sm whitespace-pre-wrap">{reset.notes}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Hesap Detayları ({reset.accounts.length})</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {reset.accounts.map((account: any) => {
                                const Icon = iconFor(account.accountType);
                                const display = defaultCurrency === "USD" ? Number(account.closingBalance || 0) / usdRate : Number(account.closingBalance || 0);
                                return (
                                    <div key={account.id} className="rounded-xl border border-border/50 bg-background/50 p-4 flex items-center justify-between group transition-colors hover:bg-muted/10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold truncate max-w-[120px]">{account.accountName}</p>
                                                <p className="text-[10px] text-muted-foreground">{account.accountType === "CASH" ? "Nakit" : account.accountType === "BANK" ? "Banka" : account.accountType === "POS" ? "POS" : account.accountType === "CREDIT_CARD" ? "Kredi Kartı" : "Hesap"}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold tabular-nums">{symbol}{display.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                <div className="print:block hidden mt-16 text-center text-xs text-gray-400">
                    Sistem tarafından otomatik olarak üretilmiştir.
                </div>
            </DialogContent>
        </Dialog>
    );
}
