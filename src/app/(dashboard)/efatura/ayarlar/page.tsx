"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, TestTube, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";

const settingsSchema = z.object({
    senderVkn: z.string().min(10, "VKN/TCKN en az 10 haneli olmalıdır.").max(11, "VKN/TCKN en fazla 11 haneli olmalıdır."),
    senderName: z.string().min(2, "Ünvan en az 2 karakter olmalıdır."),
    companyAddress: z.string().optional(),
    companyCity: z.string().optional(),
    companyDistrict: z.string().optional(),
    taxOffice: z.string().optional(),
    defaultCurrency: z.string().optional(),
    isActive: z.boolean().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsForm = {
    senderVkn: "",
    senderName: "",
    companyAddress: "",
    companyCity: "İSTANBUL",
    companyDistrict: "",
    taxOffice: "",
    defaultCurrency: "TRY",
    isActive: false,
};

export default function EfaturaAyarlarPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SettingsForm>({
        resolver: zodResolver(settingsSchema),
        defaultValues: defaultSettings,
    });

    const isActive = watch("isActive");

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            try {
                const res = await fetch("/api/edm/settings");
                const data = await res.json();
                if (data.settings) {
                    setValue("senderVkn", data.settings.senderVkn);
                    setValue("senderName", data.settings.senderName);
                    setValue("companyAddress", data.settings.companyAddress || "");
                    setValue("companyCity", data.settings.companyCity || "İSTANBUL");
                    setValue("companyDistrict", data.settings.companyDistrict || "");
                    setValue("taxOffice", data.settings.taxOffice || "");
                    setValue("defaultCurrency", data.settings.defaultCurrency || "TRY");
                    setValue("isActive", data.settings.isActive);
                }
            } catch (error) {
                toast.error("Ayarlar yüklenirken hata oluştu.");
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, [setValue]);

    const onSubmit = async (values: SettingsForm) => {
        setSaving(true);
        try {
            const res = await fetch("/api/edm/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Ayarlar başarıyla kaydedildi.");
            } else {
                toast.error(data.error || "Kaydetme başarısız.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const res = await fetch("/api/edm/check-user?customerId=11111111111");
            const data = await res.json();
            if (res.ok) {
                toast.success(`Bağlantı başarılı! ${data.isEInvoice ? "e-Fatura" : "e-Arşiv"} müşterisi.`);
            } else {
                toast.error(data.error || "Bağlantı testi başarısız.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl p-4 md:p-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="e-Fatura Entegrasyon Ayarları"
                description="EDM Bilişim e-Fatura servisi için firma bilgilerinizi yapılandırın."
                icon={Building2}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Firma Bilgileri</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="senderVkn">VKN / TCKN</Label>
                            <Input
                                id="senderVkn"
                                {...register("senderVkn")}
                                placeholder="1234567890"
                                className="rounded-xl"
                            />
                            {errors.senderVkn && (
                                <p className="text-sm text-red-500">{errors.senderVkn.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                            <Input
                                id="taxOffice"
                                {...register("taxOffice")}
                                placeholder="Örn: Beyoğlu"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="senderName">Firma Ünvanı</Label>
                            <Input
                                id="senderName"
                                {...register("senderName")}
                                placeholder="Örn: BAŞAR TEKNİK LTD. ŞTİ."
                                className="rounded-xl"
                            />
                            {errors.senderName && (
                                <p className="text-sm text-red-500">{errors.senderName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="companyAddress">Adres</Label>
                            <Input
                                id="companyAddress"
                                {...register("companyAddress")}
                                placeholder="Örn: Test Mahallesi 1. Sokak No:1"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyCity">İl</Label>
                            <Input
                                id="companyCity"
                                {...register("companyCity")}
                                placeholder="İSTANBUL"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyDistrict">İlçe</Label>
                            <Input
                                id="companyDistrict"
                                {...register("companyDistrict")}
                                placeholder="Örn: Beyoğlu"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="defaultCurrency">Varsayılan Para Birimi</Label>
                            <Input
                                id="defaultCurrency"
                                {...register("defaultCurrency")}
                                placeholder="TRY"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(checked) => setValue("isActive", checked)}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">
                                Entegrasyon Aktif
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="h-12 rounded-2xl bg-slate-950 text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Ayarları Kaydet
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={testing}
                        onClick={handleTestConnection}
                        className="h-12 rounded-2xl border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    >
                        {testing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Test Ediliyor...
                            </>
                        ) : (
                            <>
                                <TestTube className="mr-2 h-4 w-4" />
                                Bağlantı Testi
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
