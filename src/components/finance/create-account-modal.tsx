"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Landmark, CreditCard, Loader2 } from "lucide-react";
import { createAccount } from "@/lib/actions/finance-actions";
import { toast } from "sonner";

export function CreateAccountModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = await createAccount({
            name: formData.get("name") as string,
            type: formData.get("type") as any,
            initialBalance: Number(formData.get("initialBalance")) || 0
        });

        setLoading(false);
        if (result.success) {
            toast.success("Hesap başarıyla oluşturuldu.");
            setOpen(false);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-10 text-[11px] font-black rounded-xl gap-2 shadow-lg shadow-blue-500/10 uppercase tracking-widest px-4 transition-all hover:scale-[1.02] active:scale-95">
                    <Plus className="h-4 w-4" /> YENİ HESAP EKLE
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] border-border/40 p-0 overflow-hidden bg-background/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-emerald-600" />
                <form onSubmit={handleSubmit} className="p-10">
                    <DialogHeader className="mb-10 p-0 text-left">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                <Plus className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Yeni Hesap Tanımla</DialogTitle>
                                <DialogDescription className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                                    Varlık Takip Sistemi
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label htmlFor="name" className="text-[11px] font-black text-muted-foreground ml-1 uppercase tracking-[0.2em]">HESAP ADI</Label>
                            <Input id="name" name="name" required placeholder="Örn: Ziraat Bankası, Shop Kasa" className="h-14 rounded-[1.5rem] text-xs font-black bg-muted/20 border-border/40 px-6 shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="type" className="text-[11px] font-black text-muted-foreground ml-1 uppercase tracking-[0.2em]">HESAP TÜRÜ</Label>
                            <Select name="type" required defaultValue="CASH">
                                <SelectTrigger className="h-14 rounded-[1.5rem] text-xs font-black bg-muted/20 border-border/40 px-6 shadow-inner">
                                    <SelectValue placeholder="Tür seçin" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.5rem] border-border/40 bg-background/95 backdrop-blur-xl p-2">
                                    <SelectItem value="CASH" className="text-[11px] font-black rounded-xl py-3 mb-1"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Wallet className="h-4 w-4 text-blue-600" /></div> NAKİT KASA</div></SelectItem>
                                    <SelectItem value="BANK" className="text-[11px] font-black rounded-xl py-3 mb-1"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Landmark className="h-4 w-4 text-emerald-600" /></div> BANKA HESABI</div></SelectItem>
                                    <SelectItem value="POS" className="text-[11px] font-black rounded-xl py-3 mb-1"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20"><CreditCard className="h-4 w-4 text-purple-600" /></div> POS CİHAZI</div></SelectItem>
                                    <SelectItem value="CREDIT_CARD" className="text-[11px] font-black rounded-xl py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><CreditCard className="h-4 w-4 text-rose-600" /></div> KREDİ KARTI</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="initialBalance" className="text-[11px] font-black text-muted-foreground ml-1 uppercase tracking-[0.2em]">AÇILIŞ BAKİYESİ (TL)</Label>
                            <Input id="initialBalance" name="initialBalance" type="number" defaultValue="0" className="h-14 rounded-[1.5rem] text-lg font-black bg-muted/20 border-border/40 px-6 shadow-inner focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 h-14 text-xs font-black rounded-[1.5rem] hover:bg-muted transition-colors uppercase tracking-[0.2em] border border-border/40">İPTAL</Button>
                        <Button type="submit" disabled={loading} className="flex-[2] h-14 text-xs font-black rounded-[1.5rem] shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white uppercase tracking-[0.2em]">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "HESABI OLUŞTUR"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
