"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PersonStanding,
  Smartphone,
  AlertCircle,
  Receipt,
  Camera,
  CloudUpload,
  Image as ImageIcon,
  Plus,
  Printer,
  Loader2,
  UserPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IMaskInput } from "react-imask";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import { createServiceTicket } from "@/lib/actions/service-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { findCustomerByPhone } from "@/lib/actions/customer-lookup-actions";
import { searchDeviceModels } from "@/lib/actions/model-lookup-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Müşteri adı sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .min(10, "Geçerli bir Türkiye telefon numarası giriniz"),
  customerEmail: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string()
    .length(15, "IMEI numarası tam olarak 15 haneli olmalıdır")
    .regex(/^\d+$/, "IMEI sadece rakamlardan oluşmalıdır")
    .optional()
    .or(z.literal("")),
  serialNumber: z.string().optional().or(z.literal("")),
  cosmeticConditions: z.array(z.string()),
  cosmeticNotes: z.string().optional().or(z.literal("")),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  accessories: z.array(z.string()),
  estimatedCost: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir tutar giriniz"),
  downPayment: z.string().optional().or(z.literal("")),
  estimatedDeliveryDate: z.string().optional().or(z.literal("")),
  technicianId: z.string().optional().or(z.literal("")),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function NewServicePage() {
  const [isPending, startTransition] = useTransition();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      customerPhone: "",
      estimatedCost: "0",
      downPayment: "0",
      cosmeticConditions: [],
      accessories: [],
    }
  });

  useEffect(() => {
    async function loadStaff() {
      const staff = await getStaff();
      setTechnicians(staff.filter((s: any) => s.role === "ADMIN" || s.role === "TECHNICIAN"));
    }
    loadStaff();
  }, []);

  const watchModel = form.watch("deviceModel");
  useEffect(() => {
    const fetchModels = async () => {
      if (watchModel && watchModel.length >= 2) {
        const models = await searchDeviceModels(watchModel);
        setModelSuggestions(models);
        setShowSuggestions(models.length > 0);
      } else {
        setModelSuggestions([]);
        setShowSuggestions(false);
      }
    };
    fetchModels();
  }, [watchModel]);

  const watchPhone = form.watch("customerPhone");
  useEffect(() => {
    const lookup = async () => {
      const purePhone = watchPhone.replace(/\D/g, "");
      if (purePhone.length === 10) { // 5xx xxx xx xx
        setIsLookingUp(true);
        const customer = await findCustomerByPhone(purePhone);
        if (customer) {
          setFoundCustomer(customer);
          form.setValue("customerName", customer.name);
          toast({
            title: "Müşteri Tanındı",
            description: `${customer.name} sistemde kayıtlı. Geçmiş veriler yüklendi.`,
          });
        } else {
          setFoundCustomer(null);
        }
        setIsLookingUp(false);
      }
    };
    lookup();
  }, [watchPhone, form]);

  const onSubmit = async (values: ServiceFormValues) => {
    startTransition(async () => {
      // Merge cosmetic conditions and accessories into fields expected by the action
      const cosmeticStr = [
        ...values.cosmeticConditions,
        values.cosmeticNotes
      ].filter(Boolean).join(", ");

      const notesStr = [
        values.accessories.length > 0 ? `Aksesuarlar: ${values.accessories.join(", ")}` : "",
        values.downPayment && Number(values.downPayment) > 0 ? `Ön Ödeme: ₺${values.downPayment}` : ""
      ].filter(Boolean).join(" | ");

      const result = await createServiceTicket({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deviceBrand: values.deviceBrand,
        deviceModel: values.deviceModel,
        imei: values.imei,
        serialNumber: values.serialNumber,
        problemDesc: values.problemDesc,
        cosmeticCondition: cosmeticStr,
        estimatedCost: Number(values.estimatedCost),
        notes: notesStr,
        technicianId: values.technicianId,
        estimatedDeliveryDate: values.estimatedDeliveryDate,
      });

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Yeni servis kaydı oluşturuldu.",
        });
        router.push("/servis");
      } else {
        toast({
          title: "Hata",
          description: result.error,
          variant: "destructive"
        });
      }
    });
  };

  const currentEstimatedCost = form.watch("estimatedCost") || "0";

  return (
    <main className="min-h-screen pb-32">
      <div className="px-4 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Servis İşlemleri</p>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Yeni Cihaz Kaydı</h2>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Customer Information */}
            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <PersonStanding className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Müşteri Bilgileri</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-primary font-bold hover:text-primary/80 gap-1 h-auto p-0" type="button">
                  <UserPlus className="h-4 w-4" /> Yeni Müşteri Ekle
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Müşteri Ad Soyad</Label>
                  <Input
                    {...form.register("customerName")}
                    placeholder="İsim giriniz..."
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                  {form.formState.errors.customerName && <p className="text-[10px] text-destructive font-bold ml-1">{form.formState.errors.customerName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Telefon Numarası</Label>
                  <IMaskInput
                    mask="+90 (500) 000 00 00"
                    definitions={{
                      '0': /[0-9]/
                    }}
                    value={form.watch("customerPhone")}
                    unmask={true}
                    onAccept={(value) => form.setValue("customerPhone", value)}
                    placeholder="+90 (5__) ___ __ __"
                    className="flex h-10 w-full rounded-md border-none bg-muted/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {form.formState.errors.customerPhone && <p className="text-[10px] text-destructive font-bold ml-1">{form.formState.errors.customerPhone.message}</p>}
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">E-Posta Adresi (Opsiyonel)</Label>
                  <Input
                    {...form.register("customerEmail")}
                    placeholder="ornek@mail.com"
                    type="email"
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                </div>
              </div>
            </section>

            {/* Device Details */}
            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Cihaz Detayları</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Marka</Label>
                  <Input
                    {...form.register("deviceBrand")}
                    placeholder="Örn: Apple"
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Model</Label>
                  <Input
                    {...form.register("deviceModel")}
                    placeholder="Örn: iPhone 15 Pro"
                    className="bg-muted/50 border-none focus-visible:ring-1"
                    onFocus={() => modelSuggestions.length > 0 && setShowSuggestions(true)}
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {modelSuggestions.map((model) => (
                            <button
                                key={model}
                                type="button"
                                onClick={() => {
                                    form.setValue("deviceModel", model);
                                    setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-slate-400 hover:bg-blue-600/10 hover:text-blue-500 transition-all border-b border-slate-800/50 last:border-none"
                            >
                                {model}
                            </button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">IMEI Numarası</Label>
                  <Input
                    {...form.register("imei")}
                    placeholder="15 haneli IMEI"
                    maxLength={15}
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                  {form.formState.errors.imei && <p className="text-[10px] text-destructive font-bold ml-1">{form.formState.errors.imei.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Seri Numarası</Label>
                  <Input
                    {...form.register("serialNumber")}
                    placeholder="Seri no (opsiyonel)"
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Kozmetik Durum</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Çizik", "Ezik", "Kırık Cam", "Sıvı Teması"].map((item) => (
                      <label key={item} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg cursor-pointer border border-transparent hover:border-primary/20 transition-all">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            const current = form.getValues("cosmeticConditions");
                            if (checked) {
                              form.setValue("cosmeticConditions", [...current, item]);
                            } else {
                              form.setValue("cosmeticConditions", current.filter(i => i !== item));
                            }
                          }}
                        />
                        <span className="text-xs font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                  <Textarea
                    {...form.register("cosmeticNotes")}
                    className="bg-muted/50 border-none focus-visible:ring-1 h-20"
                    placeholder="Ek kozmetik notlar..."
                  />
                </div>
              </div>
            </section>

            {/* Problem Description */}
            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Arıza Açıklaması</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Detaylı Arıza Tanımı</Label>
                  <Textarea
                    {...form.register("problemDesc")}
                    className="bg-muted/50 border-none focus-visible:ring-1 h-32"
                    placeholder="Arızayı detaylıca tarif edin..."
                  />
                  {form.formState.errors.problemDesc && <p className="text-[10px] text-destructive font-bold ml-1">{form.formState.errors.problemDesc.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Teslim Alınan Aksesuarlar</Label>
                  <div className="flex flex-wrap gap-4">
                    {["Şarj Aleti", "Kutu", "Kılıf", "SIM Kart", "Hafıza Kart"].map((item) => (
                      <label key={item} className="inline-flex items-center gap-2 group cursor-pointer">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            const current = form.getValues("accessories");
                            if (checked) {
                              form.setValue("accessories", [...current, item]);
                            } else {
                              form.setValue("accessories", current.filter(i => i !== item));
                            }
                          }}
                        />
                        <span className="text-xs font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* Customer Intelligence Panel */}
            {foundCustomer && (
              <section className="bg-blue-600/5 p-8 rounded-[2rem] border border-blue-500/20 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-2 w-2 rounded-full bg-blue-500 shadow-blue-sm" />
                   <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Personel İstihbarat Paneli</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Müşteri Sadakati</p>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600 text-white border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                {foundCustomer.isVip ? "VIP MÜŞTERİ" : "DÜZENLİ MÜŞTERİ"}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400">Son İşlem: {format(new Date(foundCustomer.updatedAt), "dd MMM yyyy", { locale: tr })}</span>
                        </div>
                    </div>

                    <Separator className="bg-blue-500/10" />

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Son Servis Geçmişi</p>
                        {foundCustomer.tickets.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white uppercase">{t.deviceBrand} {t.deviceModel}</span>
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">{t.ticketNumber} • {format(new Date(t.createdAt), "dd.MM", { locale: tr })}</span>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="border-none text-[8px] font-black uppercase p-0 text-blue-500">{t.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        onClick={() => window.open(`/musteriler/${foundCustomer.id}`, '_blank')}
                        className="w-full h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:text-white transition-all"
                    >
                        TAM PROFİLİ GÖRÜNTÜLE
                    </Button>
                </div>
              </section>
            )}

            {/* Service Quote */}
            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Servis Teklifi</h3>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Tahmini Ücret</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₺</span>
                    <Input
                      {...form.register("estimatedCost")}
                      type="number"
                      className="bg-muted/50 border-none py-3 pl-8 pr-4 text-sm font-bold focus-visible:ring-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Alınan Kapora</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₺</span>
                    <Input
                      {...form.register("downPayment")}
                      type="number"
                      className="bg-muted/50 border-none py-3 pl-8 pr-4 text-sm focus-visible:ring-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Beklenen Teslim Tarihi</Label>
                  <Input
                    {...form.register("estimatedDeliveryDate")}
                    type="datetime-local"
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Atanan Teknisyen</Label>
                  <Select onValueChange={(val) => form.setValue("technicianId", val)}>
                    <SelectTrigger className="bg-muted/50 border-none focus-visible:ring-1">
                      <SelectValue placeholder="Teknisyen Seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Photo Upload */}
            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Cihaz Fotoğrafları</h3>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center group hover:border-primary transition-colors cursor-pointer">
                <CloudUpload className="h-10 w-10 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-foreground mb-1">Fotoğraf Yükle</p>
                <p className="text-[10px] text-muted-foreground">Cihazın mevcut hasarlarını çekin</p>
                <input className="hidden" type="file" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted border-2 border-dashed border-border flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Footer */}
          <footer className="fixed bottom-0 right-0 left-0 lg:left-64 bg-background/80 backdrop-blur-md border-t border-border px-4 py-4 z-40">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kayıt Özeti</span>
                <span className="text-sm font-semibold text-foreground">1 Cihaz • Tahmini ₺{currentEstimatedCost}</span>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Button
                  variant="ghost"
                  className="flex-1 md:flex-none px-6 font-bold"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 md:flex-none px-8 py-6 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                  Tümünü Kaydet ve Fiş Yazdır
                </Button>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
