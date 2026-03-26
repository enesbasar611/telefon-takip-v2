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

interface SettingsProps {
  initialSettings: any[];
}

export function SettingsInterface({ initialSettings }: SettingsProps) {
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold  text-foreground/90">Sistem Ayarları</h1>
        <p className="text-muted-foreground">İşletme bilgilerini ve sistem parametrelerini yapılandırın.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-muted/50 p-1">
          <TabsTrigger value="general" className="gap-2 text-[10px] font-bold  ">
            <SettingsIcon className="h-4 w-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-[10px] font-bold  ">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-2 text-[10px] font-bold  ">
            <Printer className="h-4 w-4" />
            Yazdırma
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 text-[10px] font-bold  ">
            <Smartphone className="h-4 w-4" />
            Entegrasyonlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="hover:shadow-md transition-shadow border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle>Firma Bilgileri</CardTitle>
              <CardDescription>Fişlerde ve faturalarda görülecek firma bilgilerini düzenleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firma Adı</Label>
                  <Input id="companyName" value={formData.companyName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefon</Label>
                  <Input id="companyPhone" value={formData.companyPhone} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Adres</Label>
                <Input id="companyAddress" value={formData.companyAddress} onChange={handleChange} />
              </div>
              <Button onClick={handleSave} disabled={isPending} className="font-bold">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Değişiklikleri Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="hover:shadow-md transition-shadow border-t-4 border-t-green-500">
            <CardHeader>
              <CardTitle>Bildirim Şablonları</CardTitle>
              <CardDescription>Müşterilere gönderilecek SMS ve WhatsApp mesajlarını yapılandırın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappNewService">Yeni Servis Kaydı Mesajı</Label>
                <Input id="whatsappNewService" value={formData.whatsappNewService} onChange={handleChange} />
                <p className="text-[10px] text-muted-foreground italic font-medium">Değişkenler: {'{customer}, {device}, {ticket}'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappReady">Cihaz Hazır Mesajı</Label>
                <Input id="whatsappReady" value={formData.whatsappReady} onChange={handleChange} />
                <p className="text-[10px] text-muted-foreground italic font-medium">Değişkenler: {'{customer}, {device}'}</p>
              </div>
              <Button onClick={handleSave} disabled={isPending} className="font-bold">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Şablonları Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing" className="mt-6">
           <Card className="border-t-4 border-t-blue-500 opacity-50 cursor-not-allowed">
            <CardHeader>
              <CardTitle>Yazdırma Ayarları</CardTitle>
              <CardDescription>Termal yazıcı ve barkod tasarımı ayarları yakında.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
