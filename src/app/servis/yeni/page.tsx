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
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Save
} from "lucide-react";
import { createCustomer } from "@/lib/actions/customer-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import { createServiceTicket } from "@/lib/actions/service-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { searchDeviceModels } from "@/lib/actions/model-lookup-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Müşteri adı sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .min(1, "Telefon numarası giriniz")
    .refine((val) => {
      const digits = val.replace(/\D/g, "");
      // +905xxxxxxxxx (12 hane) veya 05xxxxxxxxx (11 hane) veya 5xxxxxxxxx (10 hane)
      if (digits.length === 12 && digits.startsWith("90")) return /^905[0-9]{9}$/.test(digits);
      if (digits.length === 11 && digits.startsWith("0")) return /^05[0-9]{9}$/.test(digits);
      if (digits.length === 10 && digits.startsWith("5")) return /^5[0-9]{9}$/.test(digits);
      return false;
    }, "Geçerli bir Türkiye numarası giriniz (5xx xxx xx xx)"),
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
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [isLookingUpName, setIsLookingUpName] = useState(false);

  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCustomerCreated, setIsCustomerCreated] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      estimatedCost: "0",
      customerPhone: "",
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

  const watchName = form.watch("customerName");
  useEffect(() => {
    const lookupByName = async () => {
      if (!watchName || watchName.trim().length < 2) {
        setNameSuggestions([]);
        setShowNameSuggestions(false);
        return;
      }
      if (foundCustomer && form.getValues("customerName") === foundCustomer.name) return;
      setIsLookingUpName(true);
      const results = await findCustomerByName(watchName);
      setNameSuggestions(results);
      setShowNameSuggestions(results.length > 0);
      setIsLookingUpName(false);
    };
    const t = setTimeout(lookupByName, 350);
    return () => clearTimeout(t);
  }, [watchName, foundCustomer, form]);

  const watchPhone = form.watch("customerPhone");
  useEffect(() => {
    const lookup = async () => {
      const purePhone = watchPhone?.replace(/\D/g, "") || "";
      if (purePhone.length >= 7) {
        setIsLookingUp(true);
        const customer = await findCustomerByPhone(purePhone);
        if (customer) {
          setFoundCustomer(customer);
          form.setValue("customerName", customer.name);
          if (!isCustomerCreated) {
            toast({
              title: "Müşteri Tanındı",
              description: `${customer.name} sistemde kayıtlı.`,
            });
          }
        } else {
          setFoundCustomer(null);
          setIsCustomerCreated(false);
        }
        setIsLookingUp(false);
      }
    };
    lookup();
  }, [watchPhone, form, isCustomerCreated]);

  const handleQuickCustomerCreate = async () => {
    const isValid = await form.trigger(["customerName", "customerPhone"]);
    if (!isValid) return;

    const name = form.getValues("customerName");
    const phone = form.getValues("customerPhone");
    const email = form.getValues("customerEmail");

    setIsCreatingCustomer(true);
    try {
      const res = await createCustomer({
        name,
        phone,
        email,
      });

      if (res.success) {
        setFoundCustomer(res.customer);
        setIsCustomerCreated(true);
        toast({
          title: "✅ Müşteri Kaydedildi!",
          description: `${name} sisteme başarıyla eklendi. Kayda devam edebilirsiniz.`,
        });
      } else {
        toast({
          title: "Hata",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Hata",
        description: "Müşteri kaydı sırasında teknik bir sorun oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    startTransition(async () => {
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
        customerEmail: values.customerEmail,
        deviceBrand: values.deviceBrand,
        deviceModel: values.deviceModel,
        imei: values.imei,
        serialNumber: values.serialNumber,
        problemDesc: values.problemDesc,
        cosmeticCondition: cosmeticStr,
        estimatedCost: Number(values.estimatedCost),
        downPayment: Number(values.downPayment),
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
          <p className="text-primary font-bold text-sm mb-1">Servis İşlemleri</p>
          <h2 className="text-4xl font-bold text-foreground">Yeni Cihaz Kaydı</h2>
        </div>

        <form id="new-service-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <PersonStanding className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Müşteri Bilgileri</h3>
                </div>
                <div className="flex items-center gap-4">
                  {isCustomerCreated ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-2 rounded-full text-xs gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Müşteri Eklendi
                    </Badge>
                  ) : (
                    !foundCustomer && (
                      <Button
                        type="button"
                        onClick={handleQuickCustomerCreate}
                        disabled={isCreatingCustomer}
                        className="font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isCreatingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Yeni Müşteri Oluştur
                      </Button>
                    )
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Müşteri Ad Soyad</Label>
                  <div className="relative">
                    <Input
                      {...form.register("customerName")}
                      placeholder="İsim giriniz..."
                      className="bg-muted/50 border-none"
                      autoComplete="off"
                      onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                    />
                    {isLookingUpName && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {nameSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setFoundCustomer(c);
                            form.setValue("customerName", c.name);
                            form.setValue("customerPhone", c.phone ?? "");
                            setShowNameSuggestions(false);
                            toast({ title: "Müşteri Seçildi", description: `${c.name} sisteme kayıtlı müşteri.` });
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-bold text-muted-foreground hover:bg-muted transition-all border-b border-border last:border-none flex items-center justify-between"
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] text-primary">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.customerName && <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.customerName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Telefon Numarası</Label>
                  <div className="flex items-center bg-muted/50 rounded-xl overflow-hidden border border-transparent focus-within:border-primary/40 transition-all">
                    <span className="pl-4 pr-2 text-sm font-bold text-primary select-none">+90</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={13}
                      placeholder="5xx xxx xx xx"
                      className="flex-1 bg-transparent border-none outline-none py-3 pr-4 text-sm font-medium placeholder:text-muted-foreground/50"
                      value={form.watch("customerPhone")}
                      onFocus={(e) => {
                        if (!form.getValues("customerPhone")) {
                          // odaklanınca +90 prefix'i set et ama input içinde gösterme, sadece state'e başla
                        }
                      }}
                      onChange={(e) => {
                        let raw = e.target.value.replace(/[^0-9]/g, "");
                        // Eğer kullanıcı 90 ile başlıyorsa (paste) otomatik strip et
                        if (raw.startsWith("90")) raw = raw.substring(2);
                        // Format: xxx xxx xx xx
                        if (raw.length > 0 && raw[0] !== "5") {
                          form.setError("customerPhone", { message: "Numara 5 ile başlamalıdır" });
                        } else {
                          form.clearErrors("customerPhone");
                        }
                        // Max 10 rakam (5xxxxxxxxx)
                        const trimmed = raw.substring(0, 10);
                        // Format için: xxx xxx xx xx
                        let formatted = trimmed;
                        if (trimmed.length > 3 && trimmed.length <= 6) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3);
                        else if (trimmed.length > 6 && trimmed.length <= 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6);
                        else if (trimmed.length > 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6, 8) + " " + trimmed.slice(8);
                        form.setValue("customerPhone", formatted);
                      }}
                    />
                    {isLookingUp && <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {form.formState.errors.customerPhone && <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.customerPhone.message}</p>}
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">E-Posta Adresi (Opsiyonel)</Label>
                  <Input
                    {...form.register("customerEmail")}
                    placeholder="ornek@mail.com"
                    type="email"
                    className="bg-muted/50 border-none"
                  />
                </div>
              </div>
            </section>

            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Cihaz Detayları</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Marka</Label>
                  <Input
                    {...form.register("deviceBrand")}
                    placeholder="Örn: Apple"
                    className="bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Model</Label>
                  <Input
                    {...form.register("deviceModel")}
                    placeholder="Örn: iPhone 15 Pro"
                    className="bg-muted/50 border-none"
                    onFocus={() => modelSuggestions.length > 0 && setShowSuggestions(true)}
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {modelSuggestions.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            form.setValue("deviceModel", model);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-bold text-muted-foreground hover:bg-muted transition-all border-b border-border last:border-none"
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">IMEI Numarası</Label>
                  <Input
                    {...form.register("imei")}
                    placeholder="15 haneli IMEI"
                    maxLength={15}
                    className="bg-muted/50 border-none"
                  />
                  {form.formState.errors.imei && <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.imei.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Seri Numarası</Label>
                  <Input
                    {...form.register("serialNumber")}
                    placeholder="Seri no (opsiyonel)"
                    className="bg-muted/50 border-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Kozmetik Durum</Label>
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
                        <span className="text-sm font-bold">{item}</span>
                      </label>
                    ))}
                  </div>
                  <Textarea
                    {...form.register("cosmeticNotes")}
                    className="bg-muted/50 border-none h-20"
                    placeholder="Ek kozmetik notlar..."
                  />
                </div>
              </div>
            </section>

            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Arıza Açıklaması</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Detaylı Arıza Tanımı</Label>
                  <Textarea
                    {...form.register("problemDesc")}
                    className="bg-muted/50 border-none h-32"
                    placeholder="Arızayı detaylıca tarif edin..."
                  />
                  {form.formState.errors.problemDesc && <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.problemDesc.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Teslim Alınan Aksesuarlar</Label>
                  <div className="flex flex-wrap gap-4">
                    {["Şarj Aleti", "Kutu", "Kılıf", "SIM Kart", "Hafıza Kart"].map((item) => (
                      <label key={item} className="inline-flex items-center gap-2 cursor-pointer">
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

          <div className="col-span-12 lg:col-span-4 space-y-8">
            {foundCustomer && (
              <section className="bg-blue-600/5 p-8 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <h3 className="text-xs font-bold text-blue-500">Müşteri Geçmişi</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Müşteri Sadakati</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white border-none text-[10px] px-3 py-1">
                        {foundCustomer.isVip ? "VIP MÜŞTERİ" : "DÜZENLİ MÜŞTERİ"}
                      </Badge>
                    </div>
                  </div>
                  <Separator className="bg-blue-500/10" />
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-muted-foreground">Son Servis Geçmişi</p>
                    {foundCustomer.tickets.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold">{t.deviceBrand} {t.deviceModel}</span>
                          <span className="text-[8px] font-bold text-muted-foreground">{t.ticketNumber} • {format(new Date(t.createdAt), "dd.MM", { locale: tr })}</span>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="border-none text-[8px] font-bold p-0 text-blue-500">{t.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={() => window.open(`/musteriler/${foundCustomer.id}`, '_blank')}
                    className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                  >
                    TAM PROFİLİ GÖRÜNTÜLE
                  </Button>
                </div>
              </section>
            )}

            <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Servis Teklifi</h3>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground ml-1">Tahmini Ücret</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₺</span>
                    <Input
                      {...form.register("estimatedCost")}
                      type="number"
                      className="bg-muted/50 border-none py-3 pl-8 pr-4 text-sm font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground ml-1">Alınan Kapora</Label>
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
                  <Label className="text-[11px] font-bold text-muted-foreground ml-1">Beklenen Teslim Tarihi</Label>
                  <Input
                    {...form.register("estimatedDeliveryDate")}
                    type="datetime-local"
                    className="bg-muted/50 border-none focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground ml-1">Atanan Teknisyen</Label>
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

        </form>

        {/* Bottom Action Bar - inside page flow, no sidebar overlap */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 px-0 py-4 mt-6 -mx-4 lg:-mx-8">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-muted-foreground">Tahmini ücret</span>
              <span className="text-lg font-bold text-foreground">₺{currentEstimatedCost}</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                form="new-service-form"
                disabled={form.formState.isSubmitting}
                className="h-12 px-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl gap-3 flex items-center shadow-lg shadow-blue-600/20 transition-all"
              >
                {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Kaydı Tamamla
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
