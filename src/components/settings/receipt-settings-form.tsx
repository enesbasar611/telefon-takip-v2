"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateReceiptSettings } from "@/lib/actions/receipt-settings";
import { Save, Printer, Eye, Store, ScrollText, ShoppingCart, Wrench, Package, Smartphone, Receipt, Info, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReceiptSettingsForm({ initialSettings, shop }: { initialSettings: any[]; shop?: any }) {
    const [activeType, setActiveType] = useState("general");
    const [localSettings, setLocalSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Get specific settings by type
    const getSettingsByType = (type: string) => {
        if (type === "general") {
            // "general" logic: take first available or from shop defaults
            const first = initialSettings?.find((s: any) => s.type === 'pos') || initialSettings?.[0] || {};
            return {
                title: first.title || shop?.name || "",
                phone: first.phone || shop?.phone || "",
                website: first.website || shop?.website || "",
                address: first.address || shop?.address || "",
                paperSize: first.paperSize || "72mm",
                footer: first.footer || "Bizi Tercih Ettiğiniz İçin Teşekkürler",
            };
        }
        return initialSettings?.find((s: any) => s.id.endsWith(`_${type}`));
    };

    useEffect(() => {
        const settings = getSettingsByType(activeType);
        if (settings) {
            setLocalSettings(settings);
        } else {
            // Default initialization if no settings exist for this type
            const general = getSettingsByType("general");
            setLocalSettings({
                ...general,
                subtitle: activeType === "service" ? "Teknik Servis" : activeType === "pos" ? "Satış Fişi" : "Bilgi Fişi",
                terms: activeType === "service" ? "• Arıza tespit ücreti 150 TL'dir.\n• 30 gün içinde teslim alınmayan cihazlardan işletmemiz sorumlu değildir." : "",
            });
        }
    }, [activeType, initialSettings]);

    const handleSave = async () => {
        try {
            setIsLoading(true);

            if (activeType === "general") {
                // Shared fields that will be applied to all receipt types
                const sharedData = {
                    title: localSettings.title,
                    phone: localSettings.phone,
                    website: localSettings.website,
                    address: localSettings.address,
                    paperSize: localSettings.paperSize,
                    footer: localSettings.footer,
                    footer2: localSettings.footer2,
                    logoUrl: localSettings.logoUrl
                };

                const types = ["pos", "service", "debt", "device-hub", "stock", "device", "label"];
                const results = await Promise.all(types.map(t => {
                    return updateReceiptSettings(t, sharedData);
                }));

                const allResSucceed = results.every(res => res.success);
                if (allResSucceed) {
                    toast({ title: "Başarılı", description: "Genel ayarlar tüm fişlere uygulandı." });
                } else {
                    toast({ title: "Hata", description: "Bazı ayarlar güncellenemedi.", variant: "destructive" });
                }
            } else {
                const { id, shopId, updatedAt, ...saveData } = localSettings;
                const response = await updateReceiptSettings(activeType, saveData);
                if (response.success) {
                    toast({ title: "Başarılı", description: "Ayarlar başarıyla kaydedildi." });
                } else {
                    toast({ title: "Hata", description: response.error || "Bir hata oluştu.", variant: "destructive" });
                }
            }
        } catch (error) {
            toast({ title: "Sistem hatası.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!localSettings) return null;

    return (
        <div className="space-y-10">
            <Tabs value={activeType} onValueChange={setActiveType} className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 flex overflow-x-auto no-scrollbar max-w-full h-auto">
                        <TabsTrigger value="general" className="py-2.5">Genel Ayarlar</TabsTrigger>
                        <TabsTrigger value="pos" className="py-2.5">Satış (POS)</TabsTrigger>
                        <TabsTrigger value="service" className="py-2.5">Servis</TabsTrigger>
                        <TabsTrigger value="debt" className="py-2.5">Veresiye</TabsTrigger>
                        <TabsTrigger value="device-hub" className="py-2.5">Cihaz Havuzu</TabsTrigger>
                    </TabsList>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Form Component */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-8 shadow-sm">
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Store className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Firma Bilgileri Artık Profilde!</p>
                                        <p className="text-[11px] text-muted-foreground">Fişlerdeki ünvan, telefon ve adres bilgileri artık Profil sayfasından yönetiliyor.</p>
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

                            {/* Şablon Ayarları */}
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            <Printer className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Şablon Özellikleri</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {activeType === 'general' ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-500">Kağıt Genişliği</Label>
                                                <Select
                                                    value={localSettings.paperSize || "72mm"}
                                                    onValueChange={(val) => setLocalSettings({ ...localSettings, paperSize: val })}
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="58mm">58mm (Örn: Zjiang)</SelectItem>
                                                        <SelectItem value="72mm">72mm (Standart)</SelectItem>
                                                        <SelectItem value="80mm">80mm (Geniş / EPSON)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-4 md:col-span-1">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-slate-500">Genel Kapanış Notu 1 (Üst)</Label>
                                                    <Input
                                                        value={localSettings.footer || ""}
                                                        onChange={(e) => setLocalSettings({ ...localSettings, footer: e.target.value })}
                                                        placeholder="Örn: Bizi tercih ettiğiniz için teşekkürler."
                                                        className="h-11 rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-slate-500">Genel Kapanış Notu 2 (Alt)</Label>
                                                    <Input
                                                        value={localSettings.footer2 || ""}
                                                        onChange={(e) => setLocalSettings({ ...localSettings, footer2: e.target.value })}
                                                        placeholder="Örn: Hayırlı işler dileriz."
                                                        className="h-11 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-500">Fiş Alt Başlığı</Label>
                                                <Input
                                                    value={localSettings.subtitle || ""}
                                                    onChange={(e) => setLocalSettings({ ...localSettings, subtitle: e.target.value })}
                                                    placeholder="Örn: Teknik Servis Formu"
                                                    className="h-11 rounded-xl border-blue-200 dark:border-blue-900 focus:ring-blue-500"
                                                />
                                                <p className="text-[10px] text-slate-400 italic">Fişin en üstünde firma isminin hemen altında görünür.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-500">Özel Kapanış Notu / Şartlar</Label>
                                                <Textarea
                                                    value={localSettings.terms || ""}
                                                    onChange={(e) => setLocalSettings({ ...localSettings, terms: e.target.value })}
                                                    placeholder="Cihaz teslim şartları, garanti bilgileri vb."
                                                    className="min-h-[110px] rounded-xl resize-none border-blue-200 dark:border-blue-900"
                                                />
                                                <p className="text-[10px] text-slate-400 italic">Bu fiş türüne özel maddeleri buraya ekleyebilirsiniz.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className={cn(
                                    "w-full h-12 rounded-xl shadow-lg transition-all font-bold group",
                                    activeType === 'general'
                                        ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                                )}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform mr-2" />}
                                {activeType === 'general' ? "Tüm Fişlere Uygula ve Kaydet" : "Sadece Bu Fişi Güncelle"}
                            </Button>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-4 items-start">
                            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-tight">İpucu</p>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-500/60 leading-relaxed font-medium">
                                    {activeType === 'general'
                                        ? "Burada yapacağınız değişiklikler tüm fişlerinizin ortak alanlarını (Ünvan, Adres, İletişim vb.) günceller. İlk kurulumda Bayi bilgileriniz otomatik gelmiştir."
                                        : "Fiş alt başlığı ve özel notlar, fişe göre değişiklik gösterir. Örneğin 'Servis' fişinde Garanti şartlarını, 'Satış' fişinde iade politikasını yazabilirsiniz."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="hidden lg:block space-y-6 sticky top-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <Eye className="h-4 w-4 text-slate-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Canlı Önizleme</span>
                            </div>
                        </div>

                        <div className="bg-slate-200 dark:bg-[#0F172A] p-8 rounded-[2.5rem] flex justify-center border-4 border-slate-300 dark:border-zinc-800 shadow-inner overflow-hidden min-h-[600px]">
                            <div
                                className={cn(
                                    "bg-white text-black shadow-2xl h-fit flex flex-col transition-all duration-300",
                                    localSettings.paperSize === "58mm" ? "w-[58mm]" :
                                        localSettings.paperSize === "80mm" ? "w-[80mm]" : "w-[72mm]"
                                )}
                            >
                                <div className="p-6 text-center border-b-[1.5px] border-black pb-1 mb-2">
                                    <h3 className="font-black text-lg uppercase leading-tight tracking-tight">{localSettings.title || "TEKNİK SERVİS"}</h3>
                                    <p className="text-[9px] font-black uppercase inline-block border border-black px-2 py-0.5 mt-2 leading-tight">{localSettings.subtitle || "FİŞ ALT BAŞLIĞI"}</p>
                                    <div className="mt-1 text-[9px] font-bold space-y-0.5">
                                        <p>TEL: {localSettings.phone || "05xx xxx xx xx"}</p>
                                        <p>{localSettings.website || "www.site.com"}</p>
                                        {localSettings.address && <p className="px-4">{localSettings.address}</p>}
                                    </div>
                                </div>

                                <div className="flex-1 px-4 py-2 select-none text-[9px] font-bold text-black">
                                    <div className="border border-black p-1 text-center mb-4 text-[10px]">
                                        {activeType === 'service' ? 'TEKNİK SERVİS FORMU' : activeType === 'pos' ? 'SATIŞ FİŞİ' : 'BİLGİ FİŞİ'}
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between border-b border-black border-dotted pb-1">
                                            <span>1x Örnek Ürün / Hizmet</span>
                                            <span>1.250,00 TL</span>
                                        </div>
                                        <div className="flex justify-between border-b border-black border-dotted pb-1">
                                            <span>1x İşçilik / Diğer</span>
                                            <span>250,00 TL</span>
                                        </div>
                                        <div className="flex justify-between font-black text-[11px] pt-1 uppercase">
                                            <span>Toplam</span>
                                            <span>1.500,00 TL</span>
                                        </div>
                                    </div>

                                    {localSettings.terms && (
                                        <div className="text-[7px] border-t border-black pt-2 whitespace-pre-wrap leading-tight font-medium">
                                            {localSettings.terms}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 text-center border-t-[1.5px] border-black border-dashed mt-4">
                                    <p className="text-[10px] font-black uppercase leading-tight">{localSettings.footer || "BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER"}</p>
                                    {localSettings.footer2 && <p className="text-[9px] font-black uppercase mt-1 leading-tight">{localSettings.footer2}</p>}
                                    <p className="text-[8px] font-bold mt-2 pt-2 border-t border-black/10 opacity-50 uppercase">{format(new Date(), "dd.MM.yyyy HH:mm")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
