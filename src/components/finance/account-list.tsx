"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Landmark, CreditCard, Plus, ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateAccountModal } from "./create-account-modal";
import { AccountDetailModal } from "./account-detail-modal";
import { TransferModal } from "./transfer-modal";
import { useToast } from "@/hooks/use-toast";
import { deleteAccount } from "@/lib/actions/finance-actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Account {
    id: string;
    name: string;
    type: "CASH" | "BANK" | "POS" | "CREDIT_CARD";
    balance: number;
    initialBalance?: number;
    availableBalance?: number;
    limit?: number;
    billingDay?: number;
}

export function AccountList({ accounts }: { accounts: Account[] }) {
    const icons = {
        CASH: Wallet,
        BANK: Landmark,
        POS: CreditCard,
        CREDIT_CARD: CreditCard,
    };

    const typeLabels = {
        CASH: "Nakit",
        BANK: "Banka",
        POS: "POS Hesabı",
        CREDIT_CARD: "Kredi Kartı",
    };

    const colors = {
        CASH: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        BANK: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        POS: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        CREDIT_CARD: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };

    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const result = await deleteAccount(id);
            if (result.success) {
                toast({ title: "Başarılı", description: "Hesap başarıyla silindi." });
            } else {
                toast({ title: "Hata", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Hata", description: "Bir hata oluştu.", variant: "destructive" });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <h2 className="font-medium text-sm  tracking-tight text-muted-foreground uppercase">HESAPLARIM</h2>
                </div>
                <CreateAccountModal />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts.map((account) => {
                    const Icon = icons[account.type] || Wallet;
                    const isCentral = account.name.toLowerCase().includes("merkez") || (account as any).isDefault;

                    return (
                        <Card
                            key={account.id}
                            className={cn(
                                "group relative overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-zinc-200 dark:border-zinc-800 bg-background/50 backdrop-blur-sm rounded-[2rem]",
                                isCentral ? "hover:border-blue-500/50" : "hover:border-rose-500/30"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 duration-500", colors[account.type])}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        {!isCentral && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-card border-border/40 rounded-[2rem]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl ">Hesabı Sil?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-xs font-medium text-muted-foreground">
                                                            <strong>{account.name}</strong> hesabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                                            <br /><br />
                                                            <span className="text-rose-500/80">Not: Sadece işlem geçmişi olmayan boş hesaplar silinebilir.</span>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="gap-3">
                                                        <AlertDialogCancel className="rounded-xl border-zinc-200 dark:border-zinc-800 h-10 px-6 text-xs ">Vazgeç</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(account.id)}
                                                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white border-none h-10 px-8 text-xs "
                                                        >
                                                            {isDeleting === account.id ? "Siliniyor..." : "Hesabı Kalıcı Olarak Sil"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        <Badge variant="outline" className="text-[10px]  tracking-widest uppercase px-2 py-0.5 rounded-lg bg-background/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 h-fit">
                                            {typeLabels[account.type]}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm tracking-tight text-foreground/80 uppercase mb-1">{account.name}</h3>
                                    <p className="text-2xl tracking-tighter text-foreground">₺{Number(account.balance).toLocaleString('tr-TR')}</p>

                                    {account.type === "CREDIT_CARD" && account.limit && (
                                        <div className="mt-3 space-y-1.5 ">
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/60">
                                                <span>LİMİT: ₺{Number(account.limit).toLocaleString('tr-TR')}</span>
                                                <span className="text-emerald-500">BOŞ: ₺{Number(account.availableBalance || 0).toLocaleString('tr-TR')}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (Number(account.balance) / Number(account.limit)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                                    <AccountDetailModal account={account} />
                                    <CreateAccountModal account={account} />
                                    <TransferModal accounts={accounts} fromAccountId={account.id} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {accounts.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                        <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-3 text-muted-foreground/40">
                            <Plus className="h-6 w-6" />
                        </div>
                        <p className="text-xs  text-muted-foreground">Henüz tanımlı bir hesap yok.</p>
                        <p className="text-[10px] font-medium text-muted-foreground/60 mt-1">Nakit veya banka hesabınızı ekleyerek başlayın.</p>
                    </div>
                )}
            </div>
        </div>
    );
}





