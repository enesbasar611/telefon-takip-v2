"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Loader2 } from "lucide-react";
import { createCustomer } from "@/lib/actions/customer-actions";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";

interface AddCustomerDialogProps {
    onSuccess?: (customer: any) => void;
    trigger?: React.ReactNode;
}

export function AddCustomerDialog({ onSuccess, trigger }: AddCustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawPhone = formData.phone.replace(/\D/g, "");
        if (!formData.name || !formData.phone) {
            toast.error("İsim ve Telefon alanları zorunludur.");
            return;
        }
        if (rawPhone.length !== 10 || !rawPhone.startsWith("5")) {
            toast.error("Geçerli bir telefon numarası girin (5xx xxx xxxx).");
            return;
        }

        setLoading(true);
        try {
            const res = await createCustomer({
                ...formData,
                phone: formData.phone.replace(/\D/g, "").substring(0, 10),
            });

            if (res.success) {
                toast.success("Müşteri başarıyla eklendi.");
                onSuccess?.(res.customer);
                setOpen(false);
                setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
            } else {
                toast.error(res.error || "Hata oluştu.");
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="text-primary  hover:text-primary/80 gap-1 h-auto p-0">
                        <UserPlus className="h-4 w-4" /> Yeni Müşteri Ekle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-white">
                <DialogHeader>
                    <DialogTitle className="font-medium text-xl ">Yeni Müşteri Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label className="font-medium text-xs  text-muted-foreground">AD SOYAD</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-white/5 border-border h-10"
                            placeholder="Müşteri Ad Soyad"
                        />
                    </div>
                    <PhoneInput
                        label="TELEFON"
                        required
                        value={formData.phone}
                        onChange={(val: string) => setFormData({ ...formData, phone: val })}
                    />
                    <div className="space-y-2">
                        <Label className="font-medium text-xs  text-muted-foreground">E-POSTA (OPSİYONEL)</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-white/5 border-border h-10"
                            placeholder="ornek@mail.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-medium text-xs  text-muted-foreground">NOTLAR</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-white/5 border-border min-h-[80px]"
                            placeholder="Müşteri hakkında notlar..."
                        />
                    </div>
                    <Button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white  h-12 rounded-xl mt-4"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "MÜŞTERİYİ KAYDET"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}





