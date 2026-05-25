"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Zap, Building2, MapPin, Phone, Mail, User } from "lucide-react";
import { setupEdmForShop } from "@/lib/actions/superadmin-actions";

interface EdmSetupModalProps {
    shop: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EdmSetupModal({ shop, open, onOpenChange, onSuccess }: EdmSetupModalProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        vkn: shop.taxNumber || "",
        title: shop.companyName || shop.name || "",
        name: "",
        surname: "",
        email: shop.email || "",
        phone: shop.phone || "",
        address: shop.companyAddress || shop.address || "",
        city: shop.companyCity || "İstanbul",
        district: shop.companyDistrict || "",
        taxOffice: shop.taxOffice || "",
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.vkn || !form.title || !form.name || !form.surname || !form.email) {
            toast.error("Lütfen zorunlu alanları doldurun.");
            return;
        }

        setLoading(true);
        try {
            const res = await setupEdmForShop(shop.id, form);
            if (res.success) {
                toast.success(`${shop.name} için e-Dönüşüm kurulumu tamamlandı.`);
                onSuccess();
            } else {
                toast.error(res.error || "Kurulum başarısız.");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border-border dark:border-white/10 text-foreground dark:text-white rounded-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">e-Dönüşüm Kurulumu</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {shop.name} — EDM e-Fatura entegrasyonu
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">VKN / TCKN *</Label>
                        <Input
                            value={form.vkn}
                            onChange={(e) => handleChange("vkn", e.target.value)}
                            placeholder="1234567890"
                            className="rounded-xl mt-1"
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Firma Unvanı *</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="Örnek Ticaret A.Ş."
                            className="rounded-xl mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yetkili Adı *</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ahmet"
                            className="rounded-xl mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yetkili Soyadı *</Label>
                        <Input
                            value={form.surname}
                            onChange={(e) => handleChange("surname", e.target.value)}
                            placeholder="Yılmaz"
                            className="rounded-xl mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-posta *</Label>
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="info@firma.com"
                            className="rounded-xl mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefon</Label>
                        <Input
                            value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="0555 555 55 55"
                            className="rounded-xl mt-1"
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adres</Label>
                        <Input
                            value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="İstiklal Cad. No:1"
                            className="rounded-xl mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">İl</Label>
                        <Input
                            value={form.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder="İstanbul"
                            className="rounded-xl mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">İlçe</Label>
                        <Input
                            value={form.district}
                            onChange={(e) => handleChange("district", e.target.value)}
                            placeholder="Kadıköy"
                            className="rounded-xl mt-1"
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vergi Dairesi</Label>
                        <Input
                            value={form.taxOffice}
                            onChange={(e) => handleChange("taxOffice", e.target.value)}
                            placeholder="Kadıköy Vergi Dairesi"
                            className="rounded-xl mt-1"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                        disabled={loading}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4" />
                        )}
                        {loading ? "Kurulum yapılıyor..." : "Kurulumu Tamamla"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
