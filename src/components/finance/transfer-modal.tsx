"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Loader2, Wallet, Landmark, CreditCard, Send, ArrowRight } from "lucide-react";
import { transferFunds } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

export function TransferModal({ accounts, fromAccountId }: { accounts: Account[], fromAccountId?: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedToId, setSelectedToId] = useState<string>("");

    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const otherAccounts = accounts.filter(a => a.id !== fromAccountId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = await transferFunds({
            fromAccountId: fromAccountId || formData.get("fromAccountId") as string,
            toAccountId: selectedToId || formData.get("toAccountId") as string,
            amount: Number(formData.get("amount")),
            description: formData.get("description") as string,
        });

        setLoading(false);
        if (result.success) {
            toast.success("Transfer başarıyla gerçekleştirildi.");
            setOpen(false);
            setSelectedToId("");
        } else {
            toast.error(result.error);
        }
    };

    const icons: any = {
        CASH: Wallet,
        BANK: Landmark,
        POS: CreditCard,
        CREDIT_CARD: CreditCard,
    };

    const colors: any = {
        CASH: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        BANK: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        POS: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        CREDIT_CARD: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };

    if (!fromAccount) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg shrink-0 hover:bg-emerald-500/5 hover:text-emerald-500 transition-colors">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] border-border/40 p-0 overflow-hidden bg-background/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                <form onSubmit={handleSubmit} className="p-10">
                    <DialogHeader className="mb-10 p-0">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                <ArrowRightLeft className="h-7 w-7 text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="font-medium text-2xl  tracking-tight">Hesaplar Arası Transfer</DialogTitle>
                                <DialogDescription className="text-xs  text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                                    Güvenli varlık taşıma
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Source Account Card */}
                        <div className="p-6 rounded-[2rem] bg-muted/30 border border-border/40 relative overflow-hidden group shadow-inner">
                            <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 opacity-[0.03] rounded-full bg-blue-500 group-hover:scale-125 transition-transform duration-500" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-sm", colors[fromAccount.type])}>
                                        {(() => {
                                            const Icon = icons[fromAccount.type] || Wallet;
                                            return <Icon className="h-6 w-6" />;
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-[10px]  text-muted-foreground uppercase tracking-[0.2em] mb-1">KAYNAK HESAP</p>
                                        <h4 className="font-medium text-lg  tracking-tight">{fromAccount.name}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px]  text-muted-foreground uppercase tracking-[0.2em] mb-1">BAKİYE</p>
                                    <p className="text-xl  tracking-tight">₺{Number(fromAccount.balance).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="font-medium text-[11px]  text-muted-foreground uppercase tracking-[0.2em] ml-1">HEDEF HESAP</Label>
                            <Select onValueChange={(v) => setSelectedToId(v)} required>
                                <SelectTrigger className="h-14 rounded-[1.5rem] border-border/40 bg-background/50 backdrop-blur-sm text-sm  shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all">
                                    <SelectValue placeholder="Gönderilecek hesabı seçin" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.5rem] border-border/40 bg-background/95 backdrop-blur-xl p-2">
                                    {otherAccounts.map((a) => {
                                        const Icon = icons[a.type] || Wallet;
                                        return (
                                            <SelectItem key={a.id} value={a.id} className="rounded-xl focus:bg-blue-500/10 focus:text-blue-500 py-3 px-4 mb-1 border border-transparent focus:border-blue-500/20 transition-all">
                                                <div className="flex items-center justify-between w-full min-w-[280px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border shadow-sm", colors[a.type])}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-extrabold text-xs">{a.name}</span>
                                                    </div>
                                                    <span className="text-[11px]  text-muted-foreground/60 italic">₺{Number(a.balance).toLocaleString('tr-TR')}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                    {otherAccounts.length === 0 && (
                                        <p className="text-[11px]  text-center py-4 text-muted-foreground italic">Başka hesap bulunamadı.</p>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <Label className="font-medium text-[11px]  text-muted-foreground uppercase tracking-[0.2em] ml-1">TRANSFER TUTARI (₺)</Label>
                                <div className="relative group">
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        required
                                        min="1"
                                        max={fromAccount.balance}
                                        placeholder="0.00"
                                        className="h-14 rounded-[1.5rem] border-border/40 bg-muted/20 text-lg  pl-12 shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                    <ArrowRight className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 opacity-50 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="font-medium text-[11px]  text-muted-foreground uppercase tracking-[0.2em] ml-1">AÇIKLAMA</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    required
                                    placeholder="Örn: Nakit transferi, Bankaya yatırılan..."
                                    className="h-14 rounded-[1.5rem] border-border/40 bg-muted/20 text-xs  px-6 shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-14 text-xs  rounded-[1.5rem] hover:bg-muted transition-colors uppercase tracking-widest border border-border/40"
                        >
                            İPTAL
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !selectedToId}
                            className="flex-[2] h-14 text-xs  rounded-[1.5rem] shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-white uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "TRANSFERİ ONAYLA"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}






