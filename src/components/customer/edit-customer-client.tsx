"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Save, User } from "lucide-react";
import { updateCustomer } from "@/lib/actions/customer-actions";
import { toast } from "sonner";
import Link from "next/link";

interface EditCustomerClientProps {
    customer: any;
}

export function EditCustomerClient({ customer }: EditCustomerClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const formatInputPhone = (val: string = "") => {
        let raw = val.replace(/[^0-9]/g, "");
        if (raw.startsWith("90")) raw = raw.substring(2);
        if (raw.startsWith("0")) raw = raw.substring(1);
        const trimmed = raw.substring(0, 10);

        let formatted = trimmed;
        if (trimmed.length > 3 && trimmed.length <= 6) {
            formatted = `${trimmed.slice(0, 3)} ${trimmed.slice(3)}`;
        } else if (trimmed.length > 6 && trimmed.length <= 8) {
            formatted = `${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6)}`;
        } else if (trimmed.length > 8) {
            formatted = `${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6, 8)} ${trimmed.slice(8)}`;
        }
        return formatted;
    };

    const [formData, setFormData] = useState({
        name: customer.name || "",
        phone: formatInputPhone(customer.phone),
        secondaryPhone: formatInputPhone(customer.secondaryPhone),
        email: customer.email || "",
        address: customer.address || "",
        notes: customer.notes || "",
        type: customer.type || "INDIVIDUAL",
        isVip: customer.isVip || false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            toast.error("İsim ve Telefon alanları zorunludur.");
            return;
        }

        setLoading(true);
        try {
            const res = await updateCustomer(customer.id, {
                ...formData,
                phone: formData.phone.replace(/\D/g, "").substring(0, 10),
                secondaryPhone: formData.secondaryPhone ? formData.secondaryPhone.replace(/\D/g, "").substring(0, 10) : undefined,
            });

            if (res.success) {
                toast.success("Müşteri bilgileri başarıyla güncellendi.");
                router.push("/musteriler");
                router.refresh();
            } else {
                toast.error(res.error || "Güncelleme sırasında hata oluştu.");
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneFormat = (val: string, fieldName: 'phone' | 'secondaryPhone') => {
        const formatted = formatInputPhone(val);
        setFormData({ ...formData, [fieldName]: formatted });
    };

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/musteriler">
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Müşteri Düzenle</h1>
                    <p className="text-muted-foreground">{customer.name} bilgilerini güncelliyorsunuz.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="rounded-[2rem] border-0 shadow-lg bg-card/50 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Profil Bilgileri</CardTitle>
                                <CardDescription>Müşterinin temel iletişim ve detay bilgileri.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sol Kolon */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Ad Soyad</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 rounded-xl bg-background"
                                        placeholder="Müşteri Ad Soyad"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Telefon</Label>
                                    <div className="flex items-center bg-background rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all border">
                                        <span className="pl-4 pr-2 text-sm font-bold text-blue-500 select-none">+90</span>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={13}
                                            placeholder="5xx xxx xx xx"
                                            className="flex-1 bg-transparent border-none outline-none h-12 pr-4 text-sm focus:ring-0"
                                            value={formData.phone}
                                            onChange={(e) => handlePhoneFormat(e.target.value, 'phone')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">2. Telefon (Opsiyonel)</Label>
                                    <div className="flex items-center bg-background rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all border">
                                        <span className="pl-4 pr-2 text-sm font-bold text-muted-foreground select-none">+90</span>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={13}
                                            placeholder="5xx xxx xx xx"
                                            className="flex-1 bg-transparent border-none outline-none h-12 pr-4 text-sm focus:ring-0"
                                            value={formData.secondaryPhone}
                                            onChange={(e) => handlePhoneFormat(e.target.value, 'secondaryPhone')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">E-Posta (Opsiyonel)</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 rounded-xl bg-background"
                                        placeholder="ornek@mail.com"
                                    />
                                </div>
                            </div>

                            {/* Sağ Kolon */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Müşteri Tipi</Label>
                                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                        <SelectTrigger className="h-12 rounded-xl bg-background">
                                            <SelectValue placeholder="Tip Seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INDIVIDUAL">Bireysel Müşteri</SelectItem>
                                            <SelectItem value="CORPORATE">Kurumsal Müşteri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-row items-center justify-between rounded-xl border p-4 bg-background">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">VIP Müşteri</Label>
                                        <p className="text-[10px] text-muted-foreground">Özel indirim ve öncelik tanınan müşteri</p>
                                    </div>
                                    <Switch
                                        checked={formData.isVip}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Açık Adres</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="min-h-[96px] rounded-xl bg-background resize-none"
                                        placeholder="Gönderim ve fatura adresi..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Özel Notlar</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="min-h-[100px] rounded-xl bg-background resize-none"
                                placeholder="Müşteri alışkanlıkları, cihaz sorunları veya hatırlatmalar..."
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                            <Link href="/musteriler" className="flex-1">
                                <Button type="button" variant="outline" className="w-full h-12 rounded-xl font-bold">
                                    İptal Et
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white gap-2"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                Değişiklikleri Kaydet
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
