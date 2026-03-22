"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Wrench, User, Smartphone, ClipboardCheck, Loader2 } from "lucide-react";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Müşteri adı sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .regex(/^5\d{9}$/, "Geçerli bir Türkiye telefon numarası giriniz (5xxxxxxxxx)"),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string()
    .length(15, "IMEI numarası tam olarak 15 haneli olmalıdır")
    .regex(/^\d+$/, "IMEI sadece rakamlardan oluşmalıdır")
    .optional()
    .or(z.literal("")),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  cosmeticCondition: z.array(z.string()).optional(),
  estimatedCost: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz"),
  notes: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const cosmeticChecklist = [
  { id: "screen", label: "Ekran Kırık/Çizik" },
  { id: "case", label: "Kasa Ezik/Çizik" },
  { id: "battery", label: "Pil Şişmiş" },
  { id: "buttons", label: "Tuşlar Basmıyor" },
  { id: "port", label: "Şarj Soketi Sorunlu" },
  { id: "water", label: "Sıvı Teması Var" },
];

export default function NewServicePage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      estimatedCost: "0",
      customerPhone: "5",
      cosmeticCondition: [],
    }
  });

  const onSubmit = async (values: ServiceFormValues) => {
    startTransition(async () => {
      const result = await createServiceTicket({
        ...values,
        estimatedCost: Number(values.estimatedCost),
        cosmeticCondition: values.cosmeticCondition?.join(", "),
      });

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Servis kaydı oluşturuldu, listeye yönlendiriliyorsunuz.",
        });
        router.push("/servis/liste");
      } else {
        toast({
          title: "Hata",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
          <Wrench className="h-10 w-10 text-primary" />
          YENİ SERVİS KAYDI
        </h1>
        <p className="text-muted-foreground font-medium">Cihaz ve müşteri bilgilerini eksiksiz doldurarak kaydı başlatın.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="h-4 w-4" /> Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="font-bold">Müşteri Ad Soyad</Label>
                <Input id="customerName" {...form.register("customerName")} placeholder="Örn: Ali Yılmaz" className="border-2 h-11" />
                {form.formState.errors.customerName && <p className="text-xs text-red-500 font-bold">{form.formState.errors.customerName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="font-bold">Telefon Numarası (5xxxxxxxxx)</Label>
                <Input id="customerPhone" {...form.register("customerPhone")} placeholder="5XX XXX XX XX" maxLength={10} className="border-2 h-11" />
                {form.formState.errors.customerPhone && <p className="text-xs text-red-500 font-bold">{form.formState.errors.customerPhone.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Cihaz Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceBrand" className="font-bold">Marka</Label>
                  <Input id="deviceBrand" {...form.register("deviceBrand")} placeholder="Apple..." className="border-2 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceModel" className="font-bold">Model</Label>
                  <Input id="deviceModel" {...form.register("deviceModel")} placeholder="iPhone 13..." className="border-2 h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei" className="font-bold">IMEI No (15 Hane)</Label>
                <Input id="imei" {...form.register("imei")} placeholder="15 haneli IMEI" maxLength={15} className="border-2 h-11" />
                {form.formState.errors.imei && <p className="text-xs text-red-500 font-bold">{form.formState.errors.imei.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Info */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-muted/50 border-b pb-4">
            <CardTitle className="text-sm uppercase tracking-[0.2em] flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Teknik Detaylar & Kontrol Listesi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="problemDesc" className="font-bold">Arıza Açıklaması</Label>
              <Textarea id="problemDesc" {...form.register("problemDesc")} placeholder="Cihazın problemini detaylıca yazın..." className="border-2 min-h-[100px]" />
              {form.formState.errors.problemDesc && <p className="text-xs text-red-500 font-bold">{form.formState.errors.problemDesc.message}</p>}
            </div>

            <div className="space-y-4">
              <Label className="font-bold">Cihaz Kozmetik Durumu (Checklist)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-2 p-4 rounded-xl bg-muted/20">
                {cosmeticChecklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("cosmeticCondition") || [];
                        if (checked) {
                          form.setValue("cosmeticCondition", [...current, item.label]);
                        } else {
                          form.setValue("cosmeticCondition", current.filter((val) => val !== item.label));
                        }
                      }}
                    />
                    <label htmlFor={item.id} className="text-sm font-bold cursor-pointer">{item.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="estimatedCost" className="font-bold text-primary">Tahmini Tamir Ücreti (₺)</Label>
                    <Input id="estimatedCost" type="number" {...form.register("estimatedCost")} className="border-2 border-primary/50 h-11 text-lg font-black" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes" className="font-bold">Ekstra Notlar</Label>
                    <Input id="notes" {...form.register("notes")} placeholder="Kurye ile teslim edilecek vb." className="border-2 h-11" />
                </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-6 flex justify-end gap-4">
            <Button type="button" variant="outline" size="lg" className="font-bold" onClick={() => router.back()} disabled={isPending}>Vazgeç</Button>
            <Button type="submit" size="lg" className="px-10 h-14 text-lg font-black gap-2 shadow-2xl" disabled={isPending}>
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wrench className="h-5 w-5" />}
              KAYDI OLUŞTUR VE FİŞ YAZDIR
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
