"use client";

import { useTransition, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { updateShop } from "@/lib/actions/setting-actions";
import { toast } from "sonner";
import { Store, MapPin, Mail, Zap } from "lucide-react";
import { industries } from "@/config/industries";

type IndustryType = "PHONE_REPAIR" | "ELECTRICIAN" | "PLUMBING" | "COMPUTER_REPAIR" | "GROCERY" | "CLOTHING" | "GENERAL";

interface ShopTabProps {
    shop: any;
}

export function ShopTab({ shop }: ShopTabProps) {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const queryClient = useQueryClient();
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        name: shop?.name || "",
        industry: shop?.industry || "GENERAL",
        phone: shop?.phone || "",
        email: shop?.email || "",
        address: shop?.address || "",
        taxNumber: shop?.taxNumber || "",
        taxOffice: shop?.taxOffice || "",
        companyName: shop?.companyName || "",
        companyCity: shop?.companyCity || "İSTANBUL",
        companyDistrict: shop?.companyDistrict || "",
        enabledModules: shop?.enabledModules || ["SERVICE", "STOCK", "POS", "FINANCE", "CUSTOMERS"]
    });

    // shop verisi değiştiğinde (örn. DB'den yüklendiğinde) formu güncelle
    useEffect(() => {
        if (shop) {
            setFormData({
                name: shop.name || "",
                industry: shop.industry || "GENERAL",
                phone: shop.phone || "",
                email: shop.email || "",
                address: shop.address || "",
                taxNumber: shop.taxNumber || "",
                taxOffice: shop.taxOffice || "",
                companyName: shop.companyName || "",
                companyCity: shop.companyCity || "İSTANBUL",
                companyDistrict: shop.companyDistrict || "",
                enabledModules: shop.enabledModules || ["SERVICE", "STOCK", "POS", "FINANCE", "CUSTOMERS"]
            });
        }
    }, [shop]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateShop(formData);
            if (result.success) {
                toast.success("Dükkan bilgileri başarıyla güncellendi.");
                // Cache'i temizle ki veriler taze kalsın
                queryClient.invalidateQueries({ queryKey: ["shop"] });
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
                            <select
                                id="industry"
                                value={formData.industry}
                                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value as IndustryType }))}
                                disabled={!isSuperAdmin}
                                className="w-full h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-card/50 px-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            >
                                {Object.entries(industries).map(([key, config]) => (
                                    <option key={key} value={key}>{(config as any).name}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-muted-foreground">Sektör değişimi buton ve terimleri otomatik günceller.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Firma Bilgileri Artık Profilde!</p>
                            <p className="text-[11px] text-muted-foreground">Vergi bilgileri, adres ve iletişim detaylarını Profil sayfasından yönetebilirsiniz.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/profil"}
                        className="rounded-xl border-blue-500/20 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    >
                        Profile Git
                    </Button>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Aktif Modüller
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {["SERVICE", "STOCK", "POS", "FINANCE", "CUSTOMERS", "EFATURA"].map((mod) => (
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
