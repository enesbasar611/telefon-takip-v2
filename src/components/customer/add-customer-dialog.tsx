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
        if (!formData.name || !formData.phone) {
            toast.error("İsim ve Telefon alanları zorunludur.");
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
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:text-primary/80 gap-1 h-auto p-0">
                        <UserPlus className="h-4 w-4" /> Yeni Müşteri Ekle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Yeni Müşteri Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">AD SOYAD</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-white/5 border-white/10 h-10"
                            placeholder="Müşteri Ad Soyad"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">TELEFON</Label>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-md overflow-hidden focus-within:border-blue-500/50 transition-all">
                            <span className="pl-3 pr-2 text-sm font-bold text-blue-400 select-none">+90</span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={13}
                                placeholder="5xx xxx xx xx"
                                className="flex-1 bg-transparent border-none outline-none h-10 pr-3 text-sm placeholder:text-muted-foreground/50"
                                value={formData.phone}
                                onChange={(e) => {
                                    let raw = e.target.value.replace(/[^0-9]/g, "");
                                    if (raw.startsWith("90")) raw = raw.substring(2);
                                    const trimmed = raw.substring(0, 10);
                                    let formatted = trimmed;
                                    if (trimmed.length > 3 && trimmed.length <= 6) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3);
                                    else if (trimmed.length > 6 && trimmed.length <= 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6);
                                    else if (trimmed.length > 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6, 8) + " " + trimmed.slice(8);
                                    setFormData({ ...formData, phone: formatted });
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">E-POSTA (OPSİYONEL)</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-white/5 border-white/10 h-10"
                            placeholder="ornek@mail.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">NOTLAR</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-white/5 border-white/10 min-h-[80px]"
                            placeholder="Müşteri hakkında notlar..."
                        />
                    </div>
                    <Button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl mt-4"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "MÜŞTERİYİ KAYDET"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
