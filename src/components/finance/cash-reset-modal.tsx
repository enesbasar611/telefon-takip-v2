"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Archive, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import { resetCashRegisters } from "@/lib/actions/finance-actions";
import { useQueryClient } from "@tanstack/react-query";

export function CashResetModal({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get("title") as string,
            notes: formData.get("notes") as string,
            periodType: formData.get("periodType") as string,
        };

        const result = await resetCashRegisters(data);
        setLoading(false);

        if (result.success) {
            toast.success("Kasa başarıyla sıfırlandı ve devredildi.");
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
            queryClient.invalidateQueries({ queryKey: ["cash-reset-report"] });
            queryClient.invalidateQueries({ queryKey: ["finance-analytics"] });
        } else {
            toast.error(result.error || "Kasa sıfırlanırken bir hata oluştu.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-900/20">
                        <Archive className="h-4 w-4" />
                        KASALARI SIFIRLA (DÖNEM KAPAT)
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4 dark:bg-rose-900/30">
                            <Archive className="h-6 w-6 text-rose-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">Dönem Kapatma / Sıfırlama</DialogTitle>
                        <DialogDescription className="text-center text-xs mt-2">
                            Bu işlem tüm hesaplarınızdaki (Nakit, Banka, vb.) bakiyeleri sıfırlayacak ve mevcut durumu arşive kaldıracaktır. Geçmiş kâr/zarar grafikleriniz etkilenmez ancak kasa bakiyeleriniz sıfırlanır.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex gap-3 dark:bg-rose-900/10 dark:border-rose-900/30">
                        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-700 dark:text-rose-400">
                            Fiziksel paralarınızı bankaya veya patron hesabına aktardıktan sonra bu işlemi yapın.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="periodType" className="text-xs font-semibold">Dönem Tipi</Label>
                            <Select name="periodType" defaultValue="WEEK">
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DAY">Günlük Kapanış</SelectItem>
                                    <SelectItem value="WEEK">Haftalık Kapanış</SelectItem>
                                    <SelectItem value="MONTH">Aylık Kapanış</SelectItem>
                                    <SelectItem value="MANUAL">Manuel Sıfırlama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-semibold">Başlık (Opsiyonel)</Label>
                            <Input id="title" name="title" placeholder="Örn: Ekim Ayı Sonu Kapanışı" className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-semibold">Notlar (Opsiyonel)</Label>
                            <Textarea id="notes" name="notes" placeholder="Eklemek istediğiniz notlar..." className="h-20 rounded-xl resize-none" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl">İPTAL</Button>
                        <Button type="submit" disabled={loading} className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "KASALARI SIFIRLA"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
