"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Landmark, CreditCard, Loader2, Search } from "lucide-react";
import { createAccount, updateAccount, getAccounts, createManualTransaction } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreateAccountModal({ account, trigger }: { account?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [view, setView] = useState<"LIST" | "FORM" | "BALANCE">("LIST");
    const [selectedAccount, setSelectedAccount] = useState<any>(account || null);
    const isEdit = !!account || view === "FORM" && selectedAccount;

    const fetchAccounts = async () => {
        const data = await getAccounts();
        setAccounts(data);
    };

    useEffect(() => {
        if (open) {
            fetchAccounts();
            if (account) {
                setView("FORM");
                setSelectedAccount(account);
            } else {
                setView("LIST");
            }
        }
    }, [open, account]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (view === "FORM" && selectedAccount) {
            result = await updateAccount(selectedAccount.id, {
                name: formData.get("name") as string,
                type: formData.get("type") as any,
                balance: Number(formData.get("initialBalance")) || 0
            });
        } else if (view === "FORM") {
            result = await createAccount({
                name: formData.get("name") as string,
                type: formData.get("type") as any,
                initialBalance: Number(formData.get("initialBalance")) || 0
            });
        } else if (view === "BALANCE" && selectedAccount) {
            const amount = Number(formData.get("amount"));
            const description = formData.get("description") as string;

            result = await createManualTransaction({
                type: "INCOME",
                amount,
                description: description || "Hızlı Bakiye Girişi",
                paymentMethod: selectedAccount.type === "CASH" ? "CASH" : "TRANSFER",
                accountId: selectedAccount.id,
                category: "HIZLI EKLE",
                date: new Date().toISOString()
            });
        }

        setLoading(false);
        if (result?.success) {
            toast.success("İşlem başarıyla tamamlandı.");
            if (view === "FORM") {
                setOpen(false);
            } else {
                setView("LIST");
                fetchAccounts();
            }
        } else {
            toast.error(result?.error || "Bir hata oluştu");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : isEdit ? (
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg px-2 flex-1 hover:bg-orange-500/5 hover:text-orange-500">
                        DÜZENLE
                    </Button>
                ) : (
                    <Button size="sm" className="h-10 text-[11px] rounded-xl gap-2 shadow-lg shadow-blue-500/10 uppercase tracking-widest px-4 transition-all hover:scale-[1.02] active:scale-95">
                        <Plus className="h-4 w-4" /> YENİ HESAP EKLE
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] border-border/40 p-0 overflow-hidden bg-[#0a0f18] rounded-[2.5rem] shadow-2xl">
                <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r", isEdit ? "from-orange-500 to-amber-600" : "from-blue-500 to-emerald-600")} />

                <div className="p-8">
                    <DialogHeader className="mb-6 p-0 text-left">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border shadow-inner", view === "FORM" ? "bg-blue-500/10 border-blue-500/20" : "bg-emerald-500/10 border-emerald-500/20")}>
                                    {view === "FORM" ? <Plus className="h-6 w-6 text-blue-500" /> : <Wallet className="h-6 w-6 text-emerald-500" />}
                                </div>
                                <div>
                                    <DialogTitle className="font-medium text-xl tracking-tight text-white">
                                        {view === "LIST" ? "Kasa & Hesap Paneli" : view === "FORM" ? (selectedAccount ? "Hesabı Düzenle" : "Yeni Hesap Tanımla") : "Bakiye Ekle"}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                                        Finansal Yönetim Sistemi
                                    </DialogDescription>
                                </div>
                            </div>
                            {view !== "LIST" && (
                                <Button variant="ghost" size="sm" onClick={() => { setView("LIST"); setSelectedAccount(null); }} className="text-[10px] uppercase tracking-widest">
                                    GERİ DÖN
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    {view === "LIST" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-1">MEVCUT HESAPLARINIZ</p>
                                <button onClick={() => setView("FORM")} className="text-[10px] uppercase tracking-widest text-blue-400 hover:underline">+ YENİ HESAP</button>
                            </div>
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {accounts.map((acc) => (
                                    <div key={acc.id} className="group bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                {acc.type === "CASH" ? <Wallet className="h-5 w-5 text-blue-400" /> :
                                                    acc.type === "BANK" ? <Landmark className="h-5 w-5 text-emerald-400" /> :
                                                        <CreditCard className="h-5 w-5 text-purple-400" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors">{acc.name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{acc.type === "CASH" ? "NAKİT" : acc.type === "BANK" ? "BANKA" : "POS/KART"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className={cn("text-sm font-semibold", Number(acc.balance) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                    ₺{Number(acc.balance).toLocaleString("tr-TR")}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" onClick={() => { setSelectedAccount(acc); setView("BALANCE"); }} className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => { setSelectedAccount(acc); setView("FORM"); }} className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white">
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(view === "FORM" || view === "BALANCE") && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {view === "FORM" ? (
                                <>
                                    <div className="space-y-4">
                                        <Label htmlFor="name" className="font-medium text-[11px] text-muted-foreground ml-1 uppercase tracking-[0.2em]">HESAP ADI</Label>
                                        <Input id="name" name="name" required defaultValue={selectedAccount?.name} placeholder="Örn: Ziraat Bankası, Shop Kasa" className="h-14 rounded-[1.5rem] text-xs bg-muted/20 border-border/40 px-6 shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all text-white" />
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="type" className="font-medium text-[11px] text-muted-foreground ml-1 uppercase tracking-[0.2em]">HESAP TÜRÜ</Label>
                                        <Select name="type" required defaultValue={selectedAccount?.type || "CASH"}>
                                            <SelectTrigger className="h-14 rounded-[1.5rem] text-xs bg-muted/20 border-border/40 px-6 shadow-inner text-white">
                                                <SelectValue placeholder="Tür seçin" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[1.5rem] border-border/40 bg-[#0a0f18] text-white p-2">
                                                <SelectItem value="CASH" className="text-[11px] rounded-xl py-3 mb-1 cursor-pointer hover:bg-white/5 transition-colors"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Wallet className="h-4 w-4 text-blue-600" /></div> NAKİT KASA</div></SelectItem>
                                                <SelectItem value="BANK" className="text-[11px] rounded-xl py-3 mb-1 cursor-pointer hover:bg-white/5 transition-colors"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Landmark className="h-4 w-4 text-emerald-600" /></div> BANKA HESABI</div></SelectItem>
                                                <SelectItem value="POS" className="text-[11px] rounded-xl py-3 mb-1 cursor-pointer hover:bg-white/5 transition-colors"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20"><CreditCard className="h-4 w-4 text-purple-600" /></div> POS CİHAZI</div></SelectItem>
                                                <SelectItem value="CREDIT_CARD" className="text-[11px] rounded-xl py-3 cursor-pointer hover:bg-white/5 transition-colors"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><CreditCard className="h-4 w-4 text-rose-600" /></div> KREDİ KARTI</div></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="initialBalance" className="font-medium text-[11px] text-muted-foreground ml-1 uppercase tracking-[0.2em]">
                                            {selectedAccount ? "GÜNCEL BAKİYE (TL)" : "AÇILIŞ BAKİYESİ (TL)"}
                                        </Label>
                                        <Input id="initialBalance" name="initialBalance" type="number" step="0.01" defaultValue={selectedAccount?.balance || "0"} className="h-14 rounded-[1.5rem] text-lg bg-muted/20 border-border/40 px-6 shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all text-white font-semibold" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 mb-6">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">HEDEF HESAP</p>
                                        <p className="text-sm font-medium text-white mt-1">{selectedAccount?.name}</p>
                                        <p className="text-xs text-emerald-400 mt-0.5">Mevcut Bakiye: ₺{Number(selectedAccount?.balance).toLocaleString("tr-TR")}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="amount" className="font-medium text-[11px] text-muted-foreground ml-1 uppercase tracking-[0.2em]">EKLENECEK TUTAR (TL)</Label>
                                        <Input id="amount" name="amount" type="number" step="0.01" required autoFocus placeholder="0.00" className="h-14 rounded-[1.5rem] text-2xl bg-muted/20 border-border/40 px-6 shadow-inner text-white font-bold" />
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="description" className="font-medium text-[11px] text-muted-foreground ml-1 uppercase tracking-[0.2em]">AÇIKLAMA</Label>
                                        <Input id="description" name="description" placeholder="Örn: Günlük kasa girişi, Elden nakit" className="h-14 rounded-[1.5rem] text-xs bg-muted/20 border-border/40 px-6 shadow-inner text-white" />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-4">
                                <Button type="button" variant="ghost" onClick={() => setView("LIST")} className="flex-1 h-14 text-xs rounded-[1.5rem] hover:bg-white/5 transition-colors uppercase tracking-[0.2em] border border-border/40 text-white">İPTAL</Button>
                                <Button type="submit" disabled={loading} className={cn("flex-[2] h-14 text-xs rounded-[1.5rem] shadow-xl text-white uppercase tracking-[0.2em]", isEdit ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20")}>
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (view === "FORM" ? (selectedAccount ? "GÜNCELLE" : "HESABI OLUŞTUR") : "BAKİYEYİ EKLE")}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}





