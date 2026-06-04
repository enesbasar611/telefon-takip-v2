"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateReceiptSettings } from "@/lib/actions/receipt-settings";
import { Save, Printer, Eye, Settings2, Info, ShoppingCart, Wrench, Package, ImagePlus, X, Loader2, Receipt, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";

export function ReceiptSettingsForm({ initialSettings, shop }: { initialSettings: any[]; shop?: any }) {
    const [activeType, setActiveType] = useState("pos");
    const [localSettings, setLocalSettings] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const TABS = [
        { id: "pos", label: "Hızlı Satış", icon: ShoppingCart },
        { id: "service", label: "Servis Kabul", icon: Wrench },
        { id: "debt", label: "Borç Ekstresi", icon: Receipt },
        { id: "stock", label: "Eksik Listesi", icon: Package },
        { id: "device", label: "Cihaz Sözleşme", icon: Smartphone },
        { id: "label", label: "Cihaz Etiketi", icon: Smartphone },
    ];

    useEffect(() => {
        const current = initialSettings.find(s => s.id === activeType || s.id === `${shop?.id}_${activeType}`) || {
            id: `${shop?.id}_${activeType}`,
            title: shop?.name || "BAŞAR TEKNİK",
            subtitle: activeType === "service" ? "Mobil servis & teknik destek" :
                activeType === "debt" ? "Müşteri Hesap Dökümü" :
                    activeType === "label" ? "Teknik Takip Barkodu" :
                        activeType === "stock" ? "Eksik Ürün & Tedarik Listesi" :
                            activeType === "device" ? "Cihaz Alış-Satış Sözleşmesi" : "PROFESYONEL TEKNİK SERVİS",
            phone: shop?.phone || "",
            address: shop?.address || "",
            footer: "Bizi Tercih Ettiğiniz İçin Teşekkürler",
            website: shop?.website || "v2.basarteknik.com",
            paperSize: "72mm", // Default
            terms: activeType === "service" ? "• Arıza tespit ücreti 150 TL'dir. İptal edilen cihazlarda bu ücret tahsil edilir.\n• 30 gün içinde teslim alınmayan cihazlardan işletmemiz sorumlu değildir.\n• Yedekleme sorumluluğu müşteriye aittir. Veri kaybından firmamız sorumlu tutulamaz." : ""
        };
        setLocalSettings({
            ...current,
            title: current.title || shop?.name || "",
            phone: current.phone || shop?.phone || "",
            address: current.address || shop?.address || "",
            website: current.website || shop?.website || "",
            paperSize: current.paperSize || "72mm",
        });
    }, [activeType, initialSettings, shop]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { id, shopId, updatedAt, ...saveData } = localSettings;
            const res = await updateReceiptSettings(activeType, saveData);
            if (res.success) {
                toast({ title: "Başarılı", description: `${activeType.toUpperCase()} şablonu güncellendi.` });
            } else {
                toast({ title: "Hata", description: res.error, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Sistem Hatası", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* Category Selector */}
            <Tabs value={activeType} onValueChange={setActiveType} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-slate-100 dark:bg-card/50 p-1.5 rounded-2xl h-16 border border-slate-200 dark:border-border/50 shadow-sm overflow-x-auto overflow-y-hidden no-scrollbar">
                    {TABS.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="gap-2 text-[10px] sm:text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-600 dark:text-muted-foreground font-black uppercase tracking-tighter sm:tracking-widest min-w-max">
                            <tab.icon className="h-4 w-4 shrink-0" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div key={activeType} className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500 fill-mode-both">
                {/* Configuration Form */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-card/40 p-10 rounded-[2.5rem] border border-slate-200 dark:border-border/50 space-y-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            {TABS.find(t => t.id === activeType)?.icon && (() => {
                                const Icon = TABS.find(t => t.id === activeType)!.icon;
                                return <Icon className="h-32 w-32 text-blue-500 rotate-12" />;
                            })()}
                        </div>

                        <div className="relative z-10 space-y-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-blue-500 rounded-full" />
                                    <h2 className="font-bold text-xl text-slate-900 dark:text-white uppercase tracking-tight">KİMLİK VE TASARIM</h2>
                                </div>
                                <p className="text-[10px] text-muted-foreground/80 dark:text-muted-foreground tracking-wider font-bold">YAZDIRMA PARAMETRELERİ VE KAĞIT BOYUTU</p>
                            </div>

                            {/* Printer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="font-medium text-[10px] text-muted-foreground tracking-[0.2em] ml-1">Kağıt Genişliği</Label>
                                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-border/50">
                                        {["58mm", "72mm", "80mm"].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setLocalSettings({ ...localSettings, paperSize: size })}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-[10px] font-black transition-all",
                                                    localSettings.paperSize === size
                                                        ? "bg-blue-600 text-white shadow-lg"
                                                        : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/5"
                                                )}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="font-medium text-[10px] text-muted-foreground tracking-[0.2em] ml-1">Yazıcı Türü</Label>
                                    <div className="h-12 flex items-center px-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-2">
                                        <Printer className="h-4 w-4" />
                                        Termal Rulo Yazıcı
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5" />

                            {/* Logo Upload Section */}
                            <div className="space-y-4">
                                <Label className="font-medium text-[10px] text-muted-foreground tracking-[0.2em] ml-1">Firma Logosu</Label>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-border/50 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-white/[0.03] group/logo">
                                        {localSettings.logoUrl ? (
                                            <>
                                                <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                                <button
                                                    onClick={() => setLocalSettings({ ...localSettings, logoUrl: null })}
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-6 w-6 text-white" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ImagePlus className="h-6 w-6" />
                                                <span className="text-[8px] font-bold">YÜKLE</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const formData = new FormData();
                                                    formData.append("files", file);
                                                    try {
                                                        const res = await fetch("/api/finance/upload", {
                                                            method: "POST",
                                                            body: formData
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            setLocalSettings({ ...localSettings, logoUrl: data.attachments[0].url });
                                                        }
                                                    } catch (err) {
                                                        toast({ title: "Yükleme hatası", variant: "destructive" });
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Logo Kullanımı</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Yüklediğiniz logo fişin en üstünde ortalanmış şekilde görünecektir. Siyah-beyaz ve yüksek kontrastlı logolar termal yazıcılarda daha iyi sonuç verir.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Firma Ünvanı</Label>
                                    <Input
                                        value={localSettings.title || ""}
                                        onChange={(e) => setLocalSettings({ ...localSettings, title: e.target.value })}
                                        className="h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Alt Başlık / Slogan</Label>
                                    <Input
                                        value={localSettings.subtitle || ""}
                                        onChange={(e) => setLocalSettings({ ...localSettings, subtitle: e.target.value })}
                                        className="h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-sm font-semibold text-blue-600 dark:text-blue-400 focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <PhoneInput
                                    label="İletişim Hattı"
                                    value={localSettings.phone || ""}
                                    onChange={(val: string) => setLocalSettings({ ...localSettings, phone: val })}
                                />
                                <div className="space-y-3">
                                    <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Web Adresi</Label>
                                    <Input
                                        value={localSettings.website || ""}
                                        onChange={(e) => setLocalSettings({ ...localSettings, website: e.target.value })}
                                        className="h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Kağıt Genişliği (Termal)</Label>
                                    <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-border/50">
                                        {["58mm", "72mm", "80mm"].map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setLocalSettings({ ...localSettings, paperSize: size })}
                                                className={cn(
                                                    "flex-1 h-11 rounded-xl text-[10px] font-black uppercase transition-all",
                                                    localSettings.paperSize === size
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
                                                        : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/10"
                                                )}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Alt Bilgi (Footer)</Label>
                                    <Input
                                        value={localSettings.footer || ""}
                                        onChange={(e) => setLocalSettings({ ...localSettings, footer: e.target.value })}
                                        className="h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all"
                                        placeholder="Teşekkürler..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Adres Bilgisi</Label>
                                <Textarea
                                    value={localSettings.address || ""}
                                    onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                                    className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white min-h-[80px] focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all py-4"
                                />
                            </div>

                            {activeType === "service" && (
                                <div className="space-y-3 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                        <h2 className="font-bold text-xl text-slate-900 dark:text-white">SERVİS ŞARTLARI</h2>
                                    </div>
                                    <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Önemli Maddeler</Label>
                                    <Textarea
                                        value={localSettings.terms || ""}
                                        onChange={(e) => setLocalSettings({ ...localSettings, terms: e.target.value })}
                                        className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-[11px] font-bold text-amber-700 dark:text-amber-200/80 min-h-[120px] focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all py-4 leading-relaxed border-amber-500/20"
                                        placeholder="Her satıra bir madde ekleyin..."
                                    />
                                </div>
                            )}

                            <div className="space-y-3 pt-6 border-t border-border/50">
                                <Label className="font-medium text-[10px]  text-muted-foreground tracking-[0.2em] ml-1">Kapanış Notu / Footer</Label>
                                <Input
                                    value={localSettings.footer || ""}
                                    onChange={(e) => setLocalSettings({ ...localSettings, footer: e.target.value })}
                                    className="h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-sm font-semibold text-emerald-600 dark:text-emerald-500 focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all"
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white  text-sm rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all gap-4 font-black uppercase tracking-widest"
                            >
                                <Save className="h-6 w-6" />
                                {isSaving ? "Kaydediliyor..." : "Tüm Değişiklikleri Kaydet"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Live Preview Section */}
                <div className="space-y-8">
                    <div className="sticky top-8 space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <Eye className="h-5 w-5 text-blue-500" />
                                <span className="text-[10px]  text-muted-foreground tracking-[0.2em] font-black uppercase">GERÇEK ZAMANLI ÖNİZLEME</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-emerald-500">CANLI</span>
                                <div className="p-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                            </div>
                        </div>

                        <div className="relative p-8 sm:p-14 bg-slate-200 dark:bg-slate-950 rounded-[3.5rem] shadow-inner overflow-hidden flex justify-center border-8 border-slate-300 dark:border-slate-900 shadow-[inset_0_20px_50px_rgba(0,0,0,0.2)]">
                            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent" />

                            {/* Thermal Paper Simulation */}
                            <div
                                className={cn(
                                    "bg-white text-black shadow-2xl relative transition-all duration-500 flex flex-col",
                                    localSettings.paperSize === "58mm" ? "w-[58mm]" :
                                        localSettings.paperSize === "80mm" ? "w-[80mm]" : "w-[72mm]"
                                )}
                                style={{ minHeight: '500px' }}
                            >
                                <div className="p-6 sm:p-8 flex-1">
                                    <div className="text-center border-b-2 border-black pb-6 mb-6">
                                        {localSettings.logoUrl && (
                                            <div className="mb-4 flex justify-center">
                                                <img src={localSettings.logoUrl} alt="Logo" className="h-10 w-auto grayscale contrast-200" />
                                            </div>
                                        )}
                                        <h3 className="font-black text-sm uppercase leading-tight">{localSettings.title || "FİRMA ÜNVANI"}</h3>
                                        <p className="text-[9px] font-bold mt-1 uppercase text-blue-600 leading-tight">{localSettings.subtitle || "ALT BAŞLIK"}</p>
                                        <div className="mt-3 space-y-1">
                                            <p className="text-[10px] font-black tracking-tighter">TEL: {localSettings.phone}</p>
                                            {localSettings.address && <p className="text-[8px] font-bold uppercase opacity-80 leading-tight max-w-[150px] mx-auto">{localSettings.address}</p>}
                                        </div>
                                    </div>

                                    {activeType === "pos" ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-black text-white px-2 py-1 mb-4">
                                                <span className="text-[8px] font-black uppercase tracking-widest">SATIŞ FİŞİ</span>
                                                <span className="text-[8px] font-black">SALE-9823</span>
                                            </div>
                                            <div className="space-y-1 mb-6 text-[10px] font-bold">
                                                <div className="flex justify-between">
                                                    <span>TARİH:</span>
                                                    <span>{format(new Date(), "dd.MM.yyyy HH:mm")}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>MÜŞTERİ:</span>
                                                    <span className="uppercase">EMRE CAN BASAR</span>
                                                </div>
                                            </div>
                                            <table className="w-full text-[10px] border-t-2 border-black pt-4">
                                                <thead>
                                                    <tr className="border-b-2 border-black">
                                                        <th className="text-left py-2">ÜRÜN</th>
                                                        <th className="text-right py-2 w-20">TUTAR</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-bold">
                                                    <tr className="border-b border-black/10">
                                                        <td className="py-2 pr-4 uppercase">SAMSUNG S23 ULTRA EKRAN</td>
                                                        <td className="text-right py-2">₺8.450,00</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div className="pt-4 space-y-1">
                                                <div className="flex justify-between text-xs font-black">
                                                    <span>TOPLAM:</span>
                                                    <span>₺8.450,00</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : activeType === "debt" ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-black text-white px-2 py-1 mb-4">
                                                <span className="text-[8px] font-black uppercase tracking-widest">BORÇ EKSTRESİ</span>
                                                <span className="text-[8px] font-black">BAL-0402</span>
                                            </div>
                                            <div className="text-center mb-6">
                                                <p className="text-[12px] font-black border-2 border-black inline-block px-4 py-1 uppercase">ENES BASAR</p>
                                            </div>
                                            <div className="space-y-2 text-[10px] font-bold">
                                                <div className="flex justify-between border-b border-black/10 pb-1">
                                                    <span className="uppercase">TL Bakiyesi:</span>
                                                    <span>₺12.500,00</span>
                                                </div>
                                                <div className="flex justify-between border-b border-black/10 pb-1">
                                                    <span className="uppercase">USD Bakiyesi:</span>
                                                    <span>$450.00</span>
                                                </div>
                                                <div className="flex justify-between pt-2 text-sm font-black border-t-2 border-black">
                                                    <span>TOPLAM:</span>
                                                    <span>₺28.025,00</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : activeType === "service" ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-black text-white px-2 py-1 mb-4">
                                                <span className="text-[8px] font-black uppercase tracking-widest">SERVİS KABUL</span>
                                                <span className="text-[8px] font-black">SRV-7712</span>
                                            </div>
                                            <div className="bg-slate-50 border-2 border-black p-3 mb-4">
                                                <p className="text-[8px] font-black uppercase opacity-60 mb-1">CİHAZ BİLGİSİ</p>
                                                <p className="text-[12px] font-black uppercase">IPHONE 15 PRO MAX</p>
                                            </div>

                                            {localSettings.terms && (
                                                <div className="bg-slate-50 p-3 rounded-sm mb-6 border-2 border-black border-dashed">
                                                    <p className="text-[8px] font-black mb-1.5 border-b-2 border-black pb-1 uppercase">ÖNEMLİ ŞARTLAR</p>
                                                    <div className="text-[8px] text-slate-800 leading-tight whitespace-pre-wrap font-bold italic">
                                                        {localSettings.terms}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-end px-2 pt-8 opacity-40">
                                                <div className="text-center">
                                                    <p className="text-[7px] font-black mb-6 uppercase">MÜŞTERİ İMZA</p>
                                                    <div className="w-16 border-t-2 border-black"></div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[7px] font-black mb-6 uppercase">TESLİM ALAN</p>
                                                    <div className="w-16 border-t-2 border-black"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : activeType === "label" ? (
                                        <div className="space-y-4 flex flex-col items-center pt-8">
                                            <div className="w-full flex justify-center mb-4">
                                                <div className="h-14 w-40 bg-zinc-100 flex items-center justify-center border-2 border-black">
                                                    <div className="w-full h-8 flex gap-0.5 px-4">
                                                        {Array.from({ length: 24 }).map((_, i) => (
                                                            <div key={i} className={cn("h-full bg-black shrink-0", i % 3 === 0 ? "w-1" : "w-[0.5px]")} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[14px] font-black">SRV-7712-A</p>
                                            <div className="text-center space-y-1">
                                                <p className="text-[12px] font-black uppercase">IPHONE 15 PRO MAX</p>
                                                <p className="text-[10px] font-bold opacity-60">EMRE CAN BASAR</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-center items-center bg-black text-white px-2 py-1 mb-4">
                                                <span className="text-[10px] font-black tracking-widest uppercase">EKSİK TEDARİK LİSTESİ</span>
                                            </div>
                                            <div className="space-y-3 py-4">
                                                <div className="flex justify-between border-b-2 border-black pb-1 text-[10px] font-black">
                                                    <span className="uppercase">ÜRÜN ADI</span>
                                                    <span className="uppercase w-12 text-center">ADET</span>
                                                </div>
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex justify-between border-b border-black/10 py-1 text-[10px] font-bold">
                                                        <span className="uppercase">HUAWEI WATCH GT4 KORDON SİYAH</span>
                                                        <span className="w-12 text-center">5</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mt-12 pt-6 border-t-2 border-black border-dashed">
                                        <p className="text-[11px] font-black uppercase leading-tight">{localSettings.footer || "TEŞEKKÜRLER"}</p>
                                        <p className="text-[9px] font-bold mt-2 uppercase opacity-80">{localSettings.website || "basarteknik.com"}</p>
                                    </div>
                                </div>
                                <div className="h-6 bg-slate-300 w-full relative">
                                    <div className="absolute top-0 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex gap-4 items-start shadow-inner">
                            <Info className="h-6 w-6 text-blue-500 shrink-0 mt-0.5 shadow-sm" />
                            <p className="text-xs  text-blue-400 font-bold leading-relaxed tracking-wider uppercase text-[9px]">
                                YAPTIĞINIZ DEĞİŞİKLİKLER SADECE SEÇİLİ KATEGORİ ({activeType.toUpperCase()}) İÇİN UYGULANIR VE TÜM CİHAZLARDA ANINDA GÜNCELLENİR.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}






