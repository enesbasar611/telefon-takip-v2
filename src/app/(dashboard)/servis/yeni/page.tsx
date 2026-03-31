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
  Loader2,
  UserPlus,
  CheckCircle2,
  Save,
  Info
} from "lucide-react";
import { createCustomer } from "@/lib/actions/customer-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import { createServiceTicket } from "@/lib/actions/service-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { searchDeviceModels } from "@/lib/actions/model-lookup-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .min(1, "Telefon no giriniz")
    .refine((val) => {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("90")) return /^905[0-9]{9}$/.test(digits);
      if (digits.length === 11 && digits.startsWith("0")) return /^05[0-9]{9}$/.test(digits);
      if (digits.length === 10 && digits.startsWith("5")) return /^5[0-9]{9}$/.test(digits);
      return false;
    }, "Geçerli bir Türkiye numarası giriniz (5xx xxx xx xx)"),
  customerEmail: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string()
    .length(15, "IMEI tam 15 haneli olmalıdır")
    .regex(/^\d+$/, "IMEI sadece rakamlardan oluşmalıdır")
    .optional()
    .or(z.literal("")),
  serialNumber: z.string().optional().or(z.literal("")),
  cosmeticConditions: z.array(z.string()),
  cosmeticNotes: z.string().optional().or(z.literal("")),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  accessories: z.array(z.string()),
  estimatedCost: z.string().refine((val) => !isNaN(Number(val)), "Tutar giriniz"),
  downPayment: z.string().optional().or(z.literal("")),
  estimatedDeliveryDate: z.string().optional().or(z.literal("")),
  technicianId: z.string().optional().or(z.literal("")),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const SectionBadge = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h3 className="font-extrabold text-xl tracking-tight">{title}</h3>
  </div>
);

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
          form.clearErrors("customerName");
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
          description: `${name} sisteme eklendi.`,
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
        description: "Müşteri kaydı sırasında sorun oluştu.",
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
        customerPhone: values.customerPhone.replace(/\D/g, ""),
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
  const errors = form.formState.errors;

  const cardClass = "bg-card p-6 md:p-8 rounded-[2rem] shadow-sm border border-border/40 relative overflow-hidden transition-all hover:shadow-md";
  const labelClass = "text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-2 block";

  const getInputClass = (fieldName: keyof ServiceFormValues) => cn(
    "bg-muted/30 border-2 rounded-xl py-6 px-4 text-sm font-medium transition-all shadow-sm",
    errors[fieldName]
      ? "border-destructive/50 bg-destructive/5 ring-4 ring-destructive/10 focus-visible:ring-destructive/20 focus-visible:border-destructive text-destructive-foreground placeholder:text-destructive/50"
      : "border-transparent hover:border-border/80 focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10"
  );

  return (
    <main className="min-h-screen relative pb-32">
      <div className="px-4 py-8 lg:py-12 max-w-7xl mx-auto">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-primary font-bold text-sm tracking-wider uppercase mb-2">Servis İşlemleri</p>
          <h2 className="text-4xl font-black text-foreground tracking-tight">Yeni Cihaz Kaydı</h2>
        </div>

        <form id="new-service-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:grid lg:grid-cols-12 gap-8 relative z-10">
          {/* Main Left Column (Form) */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150 fill-mode-both">
            {/* 1. Müşteri Bilgileri */}
            <section className={cardClass}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <SectionBadge icon={PersonStanding} title="Müşteri Bilgileri" />

                <div className="flex items-center">
                  {isCustomerCreated ? (
                    <Badge className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-emerald-500/30 px-4 py-2 rounded-full text-xs gap-2 font-bold transition-all shadow-sm">
                      <CheckCircle2 className="h-4 w-4" /> Eklendi
                    </Badge>
                  ) : (
                    !foundCustomer && (
                      <Button
                        type="button"
                        onClick={handleQuickCustomerCreate}
                        disabled={isCreatingCustomer}
                        className="font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 h-11"
                      >
                        {isCreatingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Yeni Ekle
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 relative z-10">
                <div className="space-y-1 relative">
                  <Label className={labelClass}>Müşteri Ad Soyad <span className="text-destructive">*</span></Label>
                  <div className="relative pointer-events-auto">
                    <Input
                      {...form.register("customerName")}
                      placeholder="İsim giriniz..."
                      className={getInputClass("customerName")}
                      autoComplete="off"
                      onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                    />
                    {isLookingUpName && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                      {nameSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setFoundCustomer(c);
                            form.setValue("customerName", c.name);
                            form.setValue("customerPhone", c.phone ?? "");
                            form.clearErrors(["customerName", "customerPhone"]);
                            setShowNameSuggestions(false);
                            toast({ title: "Müşteri Seçildi", description: `${c.name} sisteme kayıtlı müşteri.` });
                          }}
                          className="w-full text-left px-5 py-3 font-bold text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all flex items-center justify-between"
                        >
                          <span className="text-sm">{c.name}</span>
                          <span className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-md">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.customerName && <p className="text-xs text-destructive font-bold mt-2 animate-in slide-in-from-top-1 px-1">*{errors.customerName.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className={labelClass}>Telefon Numarası <span className="text-destructive">*</span></Label>
                  <div className={cn(
                    "flex items-center bg-muted/30 border-2 rounded-xl overflow-hidden transition-all shadow-sm focus-within:bg-background h-[calc(3rem+4px)]",
                    errors.customerPhone
                      ? "border-destructive/50 ring-4 ring-destructive/10"
                      : "border-transparent hover:border-border/80 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
                  )}>
                    <div className="pl-4 pr-3 flex items-center justify-center border-r border-border/50 h-full bg-muted/20">
                      <span className="text-sm font-black text-primary/80 select-none">+90</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="5xx xxx xx xx"
                      className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 h-full w-full"
                      value={form.watch("customerPhone")}
                      onChange={(e) => {
                        let raw = e.target.value.replace(/[^0-9]/g, "");
                        if (raw.startsWith("90") && raw.length > 2) raw = raw.substring(2);
                        if (raw.startsWith("0")) raw = raw.substring(1);
                        if (raw.length > 0 && raw[0] !== "5") {
                          form.setError("customerPhone", { message: "Numara 5 ile başlamalıdır" });
                        } else {
                          form.clearErrors("customerPhone");
                        }
                        const trimmed = raw.substring(0, 10);
                        let formatted = trimmed;
                        if (trimmed.length > 3 && trimmed.length <= 6) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3);
                        else if (trimmed.length > 6 && trimmed.length <= 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6);
                        else if (trimmed.length > 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6, 8) + " " + trimmed.slice(8);
                        form.setValue("customerPhone", formatted);
                      }}
                    />
                    {isLookingUp && <Loader2 className="mr-4 h-4 w-4 animate-spin text-primary" />}
                  </div>
                  {errors.customerPhone && <p className="text-xs text-destructive font-bold mt-2 animate-in slide-in-from-top-1 px-1">*{errors.customerPhone.message}</p>}
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className={labelClass}>E-Posta Adresi (Opsiyonel)</Label>
                  <Input
                    {...form.register("customerEmail")}
                    placeholder="ornek@mail.com"
                    type="email"
                    className={getInputClass("customerEmail")}
                  />
                  {errors.customerEmail && <p className="text-xs text-destructive font-bold mt-2 animate-in slide-in-from-top-1 px-1">*{errors.customerEmail.message}</p>}
                </div>
              </div>
            </section>

            {/* 2. Cihaz Detayları */}
            <section className={cardClass}>
              <SectionBadge icon={Smartphone} title="Cihaz Detayları" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                <div className="space-y-1">
                  <Label className={labelClass}>Marka <span className="text-destructive">*</span></Label>
                  <Input
                    {...form.register("deviceBrand")}
                    placeholder="Örn: Apple"
                    className={getInputClass("deviceBrand")}
                  />
                  {errors.deviceBrand && <p className="text-xs text-destructive font-bold mt-2 px-1">*{errors.deviceBrand.message}</p>}
                </div>

                <div className="space-y-1 relative">
                  <Label className={labelClass}>Model <span className="text-destructive">*</span></Label>
                  <Input
                    {...form.register("deviceModel")}
                    placeholder="Örn: iPhone 15 Pro"
                    className={getInputClass("deviceModel")}
                    onFocus={() => modelSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                      {modelSuggestions.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            form.setValue("deviceModel", model);
                            form.clearErrors("deviceModel");
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.deviceModel && <p className="text-xs text-destructive font-bold mt-2 px-1">*{errors.deviceModel.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className={labelClass}>IMEI Numarası</Label>
                  <Input
                    {...form.register("imei")}
                    placeholder="15 haneli IMEI"
                    maxLength={15}
                    className={getInputClass("imei")}
                  />
                  {errors.imei && <p className="text-xs text-destructive font-bold mt-2 px-1">*{errors.imei.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className={labelClass}>Seri Numarası</Label>
                  <Input
                    {...form.register("serialNumber")}
                    placeholder="Seri no (opsiyonel)"
                    className={getInputClass("serialNumber")}
                  />
                </div>

                <div className="md:col-span-2 space-y-4 pt-2">
                  <Label className={labelClass}>Kozmetik Durum</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Çizik", "Ezik", "Kırık Cam", "Sıvı Teması"].map((item) => (
                      <label key={item} className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all shadow-sm">
                        <Checkbox
                          className="rounded-md data-[state=checked]:bg-primary h-5 w-5 border-muted-foreground/30"
                          onCheckedChange={(checked) => {
                            const current = form.getValues("cosmeticConditions");
                            if (checked) {
                              form.setValue("cosmeticConditions", [...current, item]);
                            } else {
                              form.setValue("cosmeticConditions", current.filter(i => i !== item));
                            }
                          }}
                        />
                        <span className="text-sm font-bold text-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                  <Textarea
                    {...form.register("cosmeticNotes")}
                    className={cn(getInputClass("cosmeticNotes"), "h-24 resize-none")}
                    placeholder="Ek kozmetik notlarını buraya yazabilirsiniz..."
                  />
                </div>
              </div>
            </section>

            {/* 3. Arıza Açıklaması */}
            <section className={cardClass}>
              <SectionBadge icon={AlertCircle} title="Arıza Bilgisi" />
              <div className="space-y-7">
                <div className="space-y-1">
                  <Label className={labelClass}>Detaylı Arıza Tanımı <span className="text-destructive">*</span></Label>
                  <Textarea
                    {...form.register("problemDesc")}
                    className={cn(getInputClass("problemDesc"), "h-36 resize-none")}
                    placeholder="Müşterinin şikayetini ve gözlemlenen arızayı detaylıca anlatın..."
                  />
                  {errors.problemDesc && <p className="text-xs text-destructive font-bold mt-2 px-1">*{errors.problemDesc.message}</p>}
                </div>

                <div className="space-y-4 pt-2">
                  <Label className={labelClass}>Teslim Alınan Aksesuarlar</Label>
                  <div className="flex flex-wrap gap-3">
                    {["Şarj Aleti", "Kutu", "Kılıf", "SIM Kart", "Hafıza Kart"].map((item) => (
                      <label key={item} className="inline-flex items-center gap-2 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors border-2 border-transparent hover:border-border/50 rounded-full px-5 py-2.5">
                        <Checkbox
                          className="rounded-sm border-muted-foreground/40"
                          onCheckedChange={(checked) => {
                            const current = form.getValues("accessories");
                            if (checked) form.setValue("accessories", [...current, item]);
                            else form.setValue("accessories", current.filter(i => i !== item));
                          }}
                        />
                        <span className="text-sm font-bold whitespace-nowrap">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300 fill-mode-both">
            {foundCustomer && (
              <section className="bg-gradient-to-br from-blue-500/5 to-indigo-500/10 p-6 md:p-8 rounded-[2rem] border border-blue-500/20 relative overflow-hidden shadow-inner">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                  <h3 className="text-xs font-black tracking-widest text-blue-600 uppercase">Geçmiş Analizi</h3>
                </div>

                <div className="space-y-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-wider mb-2">Müşteri Statüsü</p>
                    <Badge className={cn(
                      "border-none text-[10px] px-3 py-1 font-bold shadow-sm",
                      foundCustomer.isVip ? "bg-amber-400 text-amber-950" : "bg-blue-600 text-white"
                    )}>
                      {foundCustomer.isVip ? "⭐ VIP MÜŞTERİ" : "✓ DÜZENLİ MÜŞTERİ"}
                    </Badge>
                  </div>

                  <Separator className="bg-blue-500/15" />

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-wider">Son Servisler</p>
                    <div className="grid gap-2">
                      {foundCustomer.tickets?.slice(0, 3).map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{t.deviceBrand} {t.deviceModel}</span>
                            <span className="text-[10px] font-bold text-muted-foreground mt-0.5">{t.ticketNumber} • {format(new Date(t.createdAt), "dd.MM.yyyy")}</span>
                          </div>
                          <Badge variant="outline" className="border-blue-500/20 text-[9px] font-bold px-2 py-0.5 text-blue-600 bg-blue-500/5">{t.status}</Badge>
                        </div>
                      ))}
                      {(!foundCustomer.tickets || foundCustomer.tickets.length === 0) && (
                        <div className="text-xs font-medium text-muted-foreground italic p-2">Kayıtlı servis işlemi bulunamadı.</div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => window.open(`/musteriler/${foundCustomer.id}`, '_blank')}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all mt-2"
                  >
                    Profilini Yeni Pencerede Aç
                  </Button>
                </div>
              </section>
            )}

            <section className={cardClass}>
              <SectionBadge icon={Receipt} title="Mali İşlemler" />
              <div className="space-y-6">
                <div className="space-y-1">
                  <Label className={labelClass}>Tahmini Ücret <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/50 text-lg">₺</span>
                    <Input
                      {...form.register("estimatedCost")}
                      type="number"
                      className={cn(getInputClass("estimatedCost"), "pl-10 text-xl font-black")}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.estimatedCost && <p className="text-xs text-destructive font-bold mt-1 px-1">*{errors.estimatedCost.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className={labelClass}>Alınan Kapora</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/50 text-lg">₺</span>
                    <Input
                      {...form.register("downPayment")}
                      type="number"
                      className={cn(getInputClass("downPayment"), "pl-10 text-xl font-black")}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className={labelClass}>Teslim Tarihi</Label>
                  <Input
                    {...form.register("estimatedDeliveryDate")}
                    type="datetime-local"
                    className={cn(getInputClass("estimatedDeliveryDate"))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className={labelClass}>Atanan Teknisyen</Label>
                  <Select onValueChange={(val) => form.setValue("technicianId", val)}>
                    <SelectTrigger className={cn("bg-muted/30 border-2 border-transparent hover:border-border/80 rounded-xl h-auto py-4 px-4 font-bold shadow-sm focus:ring-4 focus:ring-primary/10 transition-all", errors.technicianId ? "border-destructive ring-destructive" : "")}>
                      <SelectValue placeholder="Teknisyen Seçin..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id} className="font-bold py-3 cursor-pointer rounded-lg m-1">{tech.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <SectionBadge icon={Camera} title="Fotoğraflar" />
              <div className="border-2 border-dashed border-border/60 bg-muted/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="h-14 w-14 rounded-full bg-background border border-border flex items-center justify-center mb-4 group-hover:scale-110 shadow-sm transition-transform">
                  <CloudUpload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-black text-foreground mb-1">Cihaz Fotoğrafı Ekle</p>
                <p className="text-[11px] font-medium text-muted-foreground max-w-[200px]">Cihazın mevcut hasarlarını net bir şekilde çekin (En fazla 3 MB)</p>
                <input className="hidden" type="file" />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="aspect-square bg-muted/40 rounded-xl flex items-center justify-center border border-border/50">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <div className="aspect-square bg-bg-muted/40 rounded-xl flex items-center justify-center border border-border/50">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <div className="aspect-square bg-transparent border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:bg-muted/30 transition-colors cursor-pointer group">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </section>
          </div>
        </form>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-[18rem] right-0 z-50 transition-all duration-300 pointer-events-none">
          <div className="bg-background/95 backdrop-blur-3xl border-t border-border/40 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] p-4 px-6 md:px-10 pointer-events-auto dark:shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.4)] w-full">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Ücret Özeti</span>
                  <span className="text-2xl font-black text-primary leading-none">₺{currentEstimatedCost}</span>
                </div>
                {Object.keys(errors).length > 0 && (
                  <div className="hidden md:flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg border border-destructive/20 animate-in fade-in zoom-in slide-in-from-left-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-bold">Lütfen kırmızı ile işaretlenmiş alanları düzeltin.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {Object.keys(errors).length > 0 && (
                  <div className="md:hidden flex items-center gap-2 bg-destructive/10 text-destructive px-2 py-1.5 rounded-lg border border-destructive/20 absolute -top-12 left-6 right-6 justify-center">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-[10px] font-bold">Hatalı alanları kontrol edin</span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="rounded-xl font-bold text-sm h-14 px-6 hover:bg-muted transition-all"
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }}
                  disabled={form.formState.isSubmitting}
                  className={cn(
                    "h-14 px-8 font-black rounded-xl gap-2 transition-all shadow-lg active:scale-95 border-b-4 active:border-b-0 active:translate-y-1 relative overflow-hidden",
                    Object.keys(errors).length > 0
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive-foreground/30 shadow-destructive/20"
                      : "bg-blue-600 hover:bg-blue-700 text-white border-blue-800 shadow-blue-600/20"
                  )}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : Object.keys(errors).length > 0 ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span className="text-sm md:text-base">
                    {Object.keys(errors).length > 0 ? "Hataları Düzeltin" : "Kaydı Tamamla"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
