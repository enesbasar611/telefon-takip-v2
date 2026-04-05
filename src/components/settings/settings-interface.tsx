"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Bell, Printer, Smartphone, Loader2 } from "lucide-react";
import { bulkUpdateSettings } from "@/lib/actions/setting-actions";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { ReceiptSettingsForm } from "@/components/settings/receipt-settings-form";

interface SettingsProps {
  initialSettings: any[];
  receiptSettings: any[];
}

export function SettingsInterface({ initialSettings, receiptSettings }: SettingsProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const getSettingValue = (key: string) =>
    initialSettings.find(s => s.key === key)?.value || "";

  const [formData, setFormData] = useState({
    companyName: getSettingValue("companyName") || "BAŞAR TEKNİK",
    companyPhone: getSettingValue("companyPhone") || "05XX XXX XX XX",
    companyAddress: getSettingValue("companyAddress") || "Mobil Çarşısı, No: 123",
    whatsappNewService: getSettingValue("whatsappNewService") || "Sayın {customer}, {device} cihazınız {ticket} numarası ile servisimize kabul edilmiştir.",
    whatsappReady: getSettingValue("whatsappReady") || "Sayın {customer}, {device} cihazınızın tamiri tamamlanmıştır. Teslim alabilirsiniz.",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = async () => {
    startTransition(async () => {
      const result = await bulkUpdateSettings(formData);
      if (result.success) {
        toast({ title: "Başarılı", description: "Ayarlar kaydedildi." });
      } else {
        toast({ title: "Hata", description: "Ayarlar kaydedilemedi.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex items-center gap-6 mb-4">
        <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h1 className="font-medium text-5xl  text-foreground">Sistem Ayarları</h1>
          <p className="text-muted-foreground font-medium">Platform parametrelerini ve işletme bilgilerini özelleştirin.</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px] bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl h-16 shadow-inner">
          <TabsTrigger value="general" className="gap-3 text-xs  rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
            <SettingsIcon className="h-4.5 w-4.5" />
            Genel yapı
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-3 text-xs  rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
            <Bell className="h-4.5 w-4.5" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-3 text-xs  rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
            <Printer className="h-4.5 w-4.5" />
            Yazdırma
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-3 text-xs  rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
            <Smartphone className="h-4.5 w-4.5" />
            Entegrasyonlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-black/40 border-none rounded-2xl bg-card overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-100 dark:border-white/5 bg-muted/20">
              <CardTitle className="font-medium text-2xl ">Firma bilgileri</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Sistem genelinde ve fişlerde kullanılacak kurumsal kimlik verileri</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="companyName" className="font-medium text-xs  text-slate-400 ml-1">Firma adı</Label>
                  <Input id="companyName" value={formData.companyName} onChange={handleChange} className="h-14 text-base  px-6 shadow-sm" />
                </div>
                <PhoneInput
                  label="İletişim hattı"
                  id="companyPhone"
                  value={formData.companyPhone}
                  onChange={(val: string) => setFormData(prev => ({ ...prev, companyPhone: val }))}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="companyAddress" className="font-medium text-xs  text-slate-400 ml-1">Global adres bilgisi</Label>
                <Input id="companyAddress" value={formData.companyAddress} onChange={handleChange} className="h-14 text-base  px-6 shadow-sm" />
              </div>
              <div className="pt-4">
                <Button onClick={handleSave} disabled={isPending} className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-extrabold text-base shadow-xl shadow-primary/20 transition-all active:scale-95">
                  {isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <SettingsIcon className="mr-3 h-5 w-5" />}
                  Değişiklikleri güvenli kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-black/40 border-none rounded-2xl bg-card overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-100 dark:border-white/5 bg-muted/20">
              <CardTitle className="font-medium text-2xl font-extrabold font-manrope">Bildirim şablonları</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Müşteri deneyimini optimize eden otomatik WhatsApp mesaj yapılandırması</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-4">
                <Label htmlFor="whatsappNewService" className="font-medium text-xs  text-slate-400 ml-1">Yeni servis kabul mesajı</Label>
                <div className="relative">
                  <Input id="whatsappNewService" value={formData.whatsappNewService} onChange={handleChange} className="h-20 text-sm  px-6 pt-2 shadow-sm" />
                  <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
                    <span className="text-[10px]  text-blue-500">PARAMETRELER:</span>
                    <span className="text-[10px] font-medium text-blue-400">{' {customer}, {device}, {ticket}'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="whatsappReady" className="font-medium text-xs  text-slate-400 ml-1">Cihaz onarım tamamlandı mesajı</Label>
                <div className="relative">
                  <Input id="whatsappReady" value={formData.whatsappReady} onChange={handleChange} className="h-20 text-sm  px-6 pt-2 shadow-sm" />
                  <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                    <span className="text-[10px]  text-emerald-500">PARAMETRELER:</span>
                    <span className="text-[10px] font-medium text-emerald-400">{' {customer}, {device}'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleSave} disabled={isPending} className="h-14 px-10 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-extrabold text-base shadow-xl shadow-secondary/20 transition-all active:scale-95">
                  {isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Bell className="mr-3 h-5 w-5" />}
                  Şablonları yayına al
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing" className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ReceiptSettingsForm initialSettings={receiptSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}






