"use client";

import { useTransition, useState } from "react";
import { useSession } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { updateShop } from "@/lib/actions/setting-actions";
import { toast } from "sonner";
import { Store, MapPin, Mail, Box, ShieldCheck, Zap } from "lucide-react";
import { industries } from "@/config/industries";

type IndustryType = "PHONE_REPAIR" | "ELECTRICIAN" | "PLUMBING" | "COMPUTER_REPAIR" | "GENERAL";

interface ShopTabProps {
    shop: any;
}

export function ShopTab({ shop }: ShopTabProps) {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        name: shop?.name || "",
        industry: shop?.industry || "GENERAL",
        phone: shop?.phone || "",
        email: shop?.email || "",
        address: shop?.address || "",
        enabledModules: shop?.enabledModules || ["SERVICE", "STOCK", "POS", "FINANCE", "CUSTOMERS"]
    });

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateShop(formData);
            if (result.success) {
                toast.success("Dükkan bilgileri başarıyla güncellendi.");
            } else {
                toast.error("Güncelleme sırasında bir hata oluştu.");
            }
        });
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Temel Bilgiler */}
            <div className="grid gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-500" />
                        İşletme Kimliği
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Dükkan İsmi</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Örn: Başar Teknik"
                                className="bg-card/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industry">Sektör Tipi</Label>
                            <Select
                                value={formData.industry}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value as IndustryType }))}
                            >
                                <SelectTrigger
                                    className="bg-card/50"
                                    disabled={!isSuperAdmin}
                                >
                                    <SelectValue placeholder="Sektör seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(industries).map(([key, config]) => (
                                        <SelectItem key={key} value={key} textValue={(config as any).name}>
                                            <div className="flex flex-col py-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">{(config as any).name}</span>
                                                    {key === shop.industry && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground/70">{(config as any).labels.customerAsset} yönetimi için optimize edildi</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">Sektör değişimi buton ve terimleri otomatik günceller.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        İletişim ve Adres
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <PhoneInput
                                id="phone"
                                label="Telefon"
                                value={formData.phone}
                                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                                className="bg-card/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="iletisim@dukkan.com"
                                    className="pl-9 bg-card/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adres</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Dükkan açık adresi..."
                            className="bg-card/50"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Aktif Modüller
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {["SERVICE", "STOCK", "POS", "FINANCE", "CUSTOMERS"].map((mod) => (
                            <button
                                key={mod}
                                onClick={() => {
                                    const current = new Set(formData.enabledModules);
                                    if (current.has(mod)) current.delete(mod);
                                    else current.add(mod);
                                    setFormData(prev => ({ ...prev, enabledModules: Array.from(current) }));
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${formData.enabledModules.includes(mod)
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                    : "bg-card/50 border-border/50 text-muted-foreground hover:bg-muted/50"
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${formData.enabledModules.includes(mod) ? "bg-blue-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                                <span className="text-xs font-semibold">{mod}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="rounded-xl px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    {isPending ? "Kaydediliyor..." : "Dükkan Ayarlarını Kaydet"}
                </Button>
            </div>
        </div>
    );
}
