"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateReceiptSettings } from "@/lib/actions/receipt-settings";
import { Save, Printer, Eye, Settings2, Info, ShoppingCart, Wrench, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PhoneInput } from "@/components/ui/phone-input";

export function ReceiptSettingsForm({ initialSettings }: { initialSettings: any[] }) {
    const [activeType, setActiveType] = useState("pos");
    const [localSettings, setLocalSettings] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const current = initialSettings.find(s => s.id === activeType) || {
            id: activeType,
            title: "BAŞAR TEKNİK",
            subtitle: activeType === "service" ? "Mobil servis & teknik destek" : "PROFESYONEL TEKNİK SERVİS",
            phone: "+90 (5xx) xxx xx xx",
            address: "",
            footer: "Bizi Tercih Ettiğiniz İçin Teşekkürler",
            website: "v2.basarteknik.com",
            terms: activeType === "service" ? "• Arıza tespit ücreti 150 TL'dir. İptal edilen cihazlarda bu ücret tahsil edilir.\n• 30 gün içinde teslim alınmayan cihazlardan işletmemiz sorumlu değildir.\n• Yedekleme sorumluluğu müşteriye aittir. Veri kaybından firmamız sorumlu tutulamaz." : ""
        };
        setLocalSettings(current);
    }, [activeType, initialSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { id, updatedAt, ...saveData } = localSettings;
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
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-card/50 p-1.5 rounded-2xl h-16 border border-slate-200 dark:border-border/50 shadow-sm">
                    <TabsTrigger value="pos" className="gap-3 text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-600 dark:text-muted-foreground">
                        <ShoppingCart className="h-4 w-4" />
                        Hızlı Satış Fişi
                    </TabsTrigger>
                    <TabsTrigger value="service" className="gap-3 text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-600 dark:text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        Servis Kabul Fişi
                    </TabsTrigger>
                    <TabsTrigger value="stock" className="gap-3 text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-600 dark:text-muted-foreground">
                        <Package className="h-4 w-4" />
                        Eksik Listesi
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Configuration Form */}
                <div className="space-y-8 animate-in slide-in-from-left duration-700">
                    <div className="bg-white dark:bg-card/40 p-10 rounded-[2.5rem] border border-slate-200 dark:border-border/50 space-y-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            {activeType === "pos" ? <ShoppingCart className="h-32 w-32 text-blue-500 rotate-12" /> :
                                activeType === "service" ? <Wrench className="h-32 w-32 text-blue-500 rotate-12" /> :
                                    <Package className="h-32 w-32 text-blue-500 rotate-12" />}
                        </div>

                        <div className="relative z-10 space-y-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-blue-500 rounded-full" />
                                    <h2 className="font-bold text-xl text-slate-900 dark:text-white">ÜST BİLGİ ALANI</h2>
                                </div>
                                <p className="text-[10px] text-muted-foreground/80 dark:text-muted-foreground tracking-wider font-bold">FİRMA ÜNVANI VE SLOGAN YAPILANDIRMASI</p>
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
                                        className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-border/50 rounded-2xl text-[11px] font-bold text-amber-700 dark:text-amber-200/80 min-h-[120px] focus:bg-slate-100 dark:focus:bg-white/[0.05] transition-all py-4 leading-relaxed"
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
                                className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white  text-sm rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all gap-4"
                            >
                                <Save className="h-6 w-6" />
                                {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Live Preview Section */}
                <div className="space-y-8 animate-in slide-in-from-right duration-700">
                    <div className="sticky top-8 space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <Eye className="h-5 w-5 text-blue-500" />
                                <span className="text-[10px]  text-muted-foreground tracking-[0.2em]">GERÇEK ZAMANLI ÖNİZLEME</span>
                            </div>
                            <div className="p-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                        </div>

                        <div className="relative p-10 bg-slate-200 rounded-[2.5rem] shadow-[0_0_100px_rgba(255,255,255,0.05)] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/5 to-transparent" />

                            {/* Thermal Paper Simulation */}
                            <div className="bg-white text-black p-10 min-h-[600px] shadow-2xl font-sans text-[11px] leading-snug">
                                <div className="text-center border-b border-black border-dashed pb-6 mb-6">
                                    <h3 className="font-medium  text-lg leading-none">{localSettings.title || "FİRMA ÜNVANI"}</h3>
                                    <p className=" text-[10px] mt-1.5 opacity-80">{localSettings.subtitle || "ALT BAŞLIK"}</p>
                                    <p className="mt-2 ">{localSettings.phone}</p>
                                    {localSettings.address && <p className="mt-1 text-[9px] px-8 opacity-70 leading-tight">{localSettings.address}</p>}
                                </div>

                                {activeType === "pos" ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-black text-white px-2 py-1 mb-4">
                                            <span className=" text-[9px]">SATIŞ FİŞİ</span>
                                            <span className="text-[10px] ">SALE-XXXX</span>
                                        </div>
                                        <div className="space-y-2 mb-6 opacity-60">
                                            <div className="flex justify-between">
                                                <span>Tarih:</span>
                                                <span>{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Müsteri:</span>
                                                <span className="">ÖRNEK MÜŞTERİ</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-black border-dashed pt-4 mb-6 space-y-2">
                                            <div className="flex justify-between gap-4">
                                                <span className="flex-1 truncate">Örnek Ürün Satışı</span>
                                                <span>1 x ₺1500.00</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeType === "service" ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-black text-white px-2 py-1 mb-4">
                                            <span className=" text-[9px]">SERVİS FİŞİ</span>
                                            <span className="text-[10px] ">TICKET-XXXX</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div>
                                                <p className="text-[8px]  text-gray-500 mb-0.5">Cihaz Bilgisi</p>
                                                <p className=" text-[10px]">iPhone 15 Pro Max</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px]  text-gray-500 mb-0.5">Kayıt</p>
                                                <p className=" text-[9px]">{format(new Date(), "dd.MM.yyyy")}</p>
                                            </div>
                                        </div>

                                        {localSettings.terms && (
                                            <div className="bg-gray-100 p-3 rounded-sm mb-6 border border-gray-200">
                                                <p className="text-[8px]  mb-1.5 border-b border-gray-300 pb-1">Önemli Şartlar</p>
                                                <div className="text-[7px] text-gray-600 line-clamp-6 leading-tight whitespace-pre-line">
                                                    {localSettings.terms}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-end px-2 pt-8 opacity-30">
                                            <div className="text-center">
                                                <p className="text-[6px]  mb-6">MÜŞTERİ İMZA</p>
                                                <div className="w-16 border-t border-black"></div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[6px]  mb-6">TEKNİSYEN İMZA</p>
                                                <div className="w-16 border-t border-black"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-center items-center bg-card text-white px-2 py-1 mb-4">
                                            <span className=" text-[9px]">EKSİK LİSTESİ</span>
                                        </div>
                                        <div className="space-y-3 py-4">
                                            <div className="flex justify-between border-b border-black pb-1">
                                                <span className="">Ürün Adı</span>
                                                <span className="">Miktar</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 py-1 opacity-40">
                                                <span>Örnek Eksik Ürün 1</span>
                                                <span>2 Adet</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mt-12 pt-6 border-t border-black border-dashed opacity-80">
                                    <p className=" text-sm leading-none">{localSettings.footer || "TEŞEKKÜR METNİ"}</p>
                                    <p className="text-[9px] mt-2 ">{localSettings.website || "basarteknik.com"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex gap-4 items-start shadow-inner">
                            <Info className="h-6 w-6 text-blue-500 shrink-0 mt-0.5 shadow-sm" />
                            <p className="text-xs  text-blue-400 leading-relaxed tracking-wider">
                                YAPTIĞINIZ DEĞİŞİKLİKLER SADECE SEÇİLİ KATEGORİ ({activeType.toUpperCase()}) İÇİN UYGULANIR VE TÜM CİHAZLARDA ANINDA GÜNCELLENİR.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}






