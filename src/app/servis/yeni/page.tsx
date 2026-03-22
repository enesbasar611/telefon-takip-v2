import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export default function ServiceYeniPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Servis Kaydı</h1>
        <p className="text-muted-foreground">Teknik servis işlemlerini başlatmak için yeni bir kayıt oluşturun.</p>
      </div>

      <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Servis Kaydını Başlat</CardTitle>
          <CardDescription>
            Aşağıdaki butonu kullanarak müşteri ve cihaz bilgilerini girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <CreateServiceModal
            trigger={
              <Button size="lg" className="px-12 h-14 text-lg font-semibold gap-2 shadow-xl hover:scale-105 transition-transform">
                <Wrench className="h-5 w-5" />
                <span>Yeni Kayıt Formunu Aç</span>
              </Button>
            }
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="font-semibold mb-2">Hızlı Kayıt İpucu</h3>
          <p className="text-sm text-muted-foreground">IMEI numarasını girmek, cihazın geçmişteki servis kayıtlarını takip etmeyi kolaylaştırır.</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="font-semibold mb-2">Otomatik Bilgilendirme</h3>
          <p className="text-sm text-muted-foreground">Kayıt tamamlandığında sistem otomatik olarak WhatsApp üzerinden müşteriye bilgi mesajı şablonu hazırlar.</p>
        </div>
      </div>
    </div>
  );
}
