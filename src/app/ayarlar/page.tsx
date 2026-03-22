import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Bell, Printer, Smartphone } from "lucide-react";

export default function AyarlarPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistem Ayarları</h1>
        <p className="text-muted-foreground">İşletme bilgilerini ve sistem parametrelerini yapılandırın.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-2">
            <Printer className="h-4 w-4" />
            Yazdırma
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Entegrasyonlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Firma Bilgileri</CardTitle>
              <CardDescription>Fişlerde ve faturalarda görülecek firma bilgilerini düzenleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Firma Adı</Label>
                  <Input defaultValue="Başar Teknik" />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input defaultValue="05XX XXX XX XX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input defaultValue="Mobil Çarşısı, No: 123" />
              </div>
              <Button>Değişiklikleri Kaydet</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Şablonları</CardTitle>
              <CardDescription>Müşterilere gönderilecek SMS ve WhatsApp mesajlarını yapılandırın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Yeni Servis Kaydı Mesajı</Label>
                <Input defaultValue="Sayın {customer}, {device} cihazınız {ticket} numarası ile servisimize kabul edilmiştir." />
              </div>
              <div className="space-y-2">
                <Label>Cihaz Hazır Mesajı</Label>
                <Input defaultValue="Sayın {customer}, {device} cihazınızın tamiri tamamlanmıştır. Teslim alabilirsiniz." />
              </div>
              <Button>Şablonları Kaydet</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
