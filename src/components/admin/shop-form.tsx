"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateShopGeneral, adminCreateShop } from "@/lib/actions/superadmin-actions";

const INDUSTRIES = [
    { value: "PHONE_REPAIR", label: "Telefon Teknik Servis" },
    { value: "ELECTRICIAN", label: "Elektrik & Elektronik" },
    { value: "COMPUTER_REPAIR", label: "Bilgisayar Hastanesi" },
    { value: "CLOTHING", label: "Terzi & Konfeksiyon" },
    { value: "AUTOMOTIVE", label: "Oto Servis" },
    { value: "BARBER", label: "Berber & Kuaför" },
    { value: "GENERAL", label: "Genel Perakende" },
];

export function ShopForm({ shop, open, onOpenChange, onSaved }: {
    shop?: any,
    open: boolean,
    onOpenChange: (o: boolean) => void,
    onSaved: () => void
}) {
    const [name, setName] = useState(shop?.name || "");
    const [industry, setIndustry] = useState(shop?.industry || "PHONE_REPAIR");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (shop) {
                setName(shop.name);
                setIndustry(shop.industry);
            } else {
                setName("");
                setIndustry("PHONE_REPAIR");
            }
        }
    }, [shop, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.error("Lütfen dükkan adı girin.");
            return;
        }

        setLoading(true);
        const res = shop
            ? await updateShopGeneral(shop.id, { name, industry })
            : await adminCreateShop({ name, industry });

        setLoading(false);
        if (res.success) {
            toast.success(shop ? "Dükkan bilgileri güncellendi." : "Yeni dükkan oluşturuldu.");
            onSaved();
            onOpenChange(false);
        } else {
            toast.error(res.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-black/95 border-white/10 text-white shadow-2xl rounded-2xl">
                <DialogHeader className="pb-4 border-b border-white/10">
                    <DialogTitle className="text-xl font-bold">
                        {shop ? "Dükkan Bilgilerini Düzenle" : "Yeni Dükkan Oluştur"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-400">Dükkan Adı</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-blue-500/50"
                            placeholder="Örn: Tekno Servis İletişim"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-400">Sektör Tipi</Label>
                        <Select value={industry} onValueChange={setIndustry}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                                <SelectValue placeholder="Sektör seçin" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                                {INDUSTRIES.map((ind) => (
                                    <SelectItem key={ind.value} value={ind.value} className="focus:bg-white/5 py-3">
                                        {ind.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic px-1">
                            * Sektör değişimi dükkan terminolojisini ve varsayılan ayarları etkileyebilir.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-white/5">
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-700 h-11 px-8 font-bold">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {shop ? "Değişiklikleri Kaydet" : "Dükkanı Oluştur"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
