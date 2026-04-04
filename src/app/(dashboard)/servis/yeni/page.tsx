"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
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
  X,
  Lock,
  Tag,
  Shield,
  ChevronDown,
  ZoomIn,
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
import { PhoneInput } from "@/components/ui/phone-input";

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 3;

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .min(1, "Telefon no giriniz"),
  customerEmail: z.string().email("Geçerli bir e-posta giriniz").or(z.literal("")),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string().max(15, "IMEI en fazla 15 hane olabilir").or(z.literal("")),
  serialNumber: z.string().or(z.literal("")),
  devicePassword: z.string().or(z.literal("")),
  serviceType: z.string().or(z.literal("")),
  cosmeticConditions: z.array(z.string()),
  cosmeticNotes: z.string().or(z.literal("")),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  accessories: z.array(z.string()),
  estimatedCost: z.string().min(1, "Tutar giriniz"),
  downPayment: z.string(),
  estimatedDeliveryDate: z.string().or(z.literal("")),
  technicianId: z.string().or(z.literal("")),
  priority: z.number(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const SectionBadge = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 bg-primary/10 rounded-xl">
      <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
    </div>
    <h3 className="font-semibold text-base tracking-tight">{title}</h3>
  </div>
);

// ---------------------------------------------------------------------------
// Photo Upload Component
// ---------------------------------------------------------------------------
interface PhotoFile {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

function PhotoUploader({
  photos,
  onAdd,
  onRemove,
}: {
  photos: PhotoFile[];
  onAdd: (files: PhotoFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const processFiles = useCallback(
    async (files: File[]) => {
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        toast({ title: "Maksimum fotoğraf", description: `En fazla ${MAX_PHOTOS} fotoğraf eklenebilir.`, variant: "destructive" });
        return;
      }

      const toProcess = files.slice(0, remaining);
      const results: PhotoFile[] = [];

      for (const file of toProcess) {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Geçersiz dosya", description: `${file.name} bir resim dosyası değil.`, variant: "destructive" });
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast({ title: "Dosya çok büyük", description: `${file.name} ${MAX_SIZE_MB}MB'ı geçemez.`, variant: "destructive" });
          continue;
        }

        const dataUrl = await readFileAsDataUrl(file);
        results.push({ id: crypto.randomUUID(), dataUrl, name: file.name, size: file.size });
      }

      if (results.length > 0) onAdd(results);
    },
    [photos.length, onAdd, toast]
  );

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) processFiles(files);
    },
    [processFiles]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="Önizleme" className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
          <button
            className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-primary/5",
          photos.length >= MAX_PHOTOS && "opacity-50 pointer-events-none"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className={cn(
          "h-12 w-12 rounded-full border flex items-center justify-center mb-3 transition-all",
          isDragging ? "bg-primary/10 border-primary/30 scale-110" : "bg-background border-border"
        )}>
          <CloudUpload className={cn("h-5 w-5 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          {isDragging ? "Bırakın!" : "Fotoğraf Ekle"}
        </p>
        <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
          Sürükle & bırak, yapıştır (Ctrl+V) veya tıkla • Maks {MAX_SIZE_MB}MB/fotoğraf
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {photos.length}/{MAX_PHOTOS} fotoğraf
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            processFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden group border border-border/50"
            >
              <img
                src={photo.dataUrl}
                alt={photo.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxSrc(photo.dataUrl); }}
                  className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(photo.id); }}
                  className="h-7 w-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
          {/* Add more slot */}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-transparent hover:bg-muted/30 flex items-center justify-center transition-all group"
            >
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
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
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deviceBrand: "",
      deviceModel: "",
      imei: "",
      serialNumber: "",
      devicePassword: "",
      serviceType: "",
      cosmeticConditions: [],
      cosmeticNotes: "",
      problemDesc: "",
      accessories: [],
      estimatedCost: "0",
      downPayment: "0",
      priority: 1,
      estimatedDeliveryDate: (() => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      })(),
    }
  });

  useEffect(() => {
    async function loadStaff() {
      const staffList = await getStaff();
      // Include all staff roles if needed
      const techList = staffList.filter((s: any) =>
        s.role === "ADMIN" || s.role === "TECHNICIAN" || s.role === "STAFF"
      );
      setTechnicians(techList);

      if (techList.length > 0 && !form.getValues("technicianId")) {
        form.setValue("technicianId", techList[0].id);
      }
    }
    loadStaff();
  }, [form]);

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
            toast({ title: "Müşteri Tanındı", description: `${customer.name} sistemde kayıtlı.` });
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
      const res = await createCustomer({ name, phone, email });
      if (res.success) {
        setFoundCustomer(res.customer);
        setIsCustomerCreated(true);
        toast({ title: "✅ Müşteri Kaydedildi!", description: `${name} sisteme eklendi.` });
      } else {
        toast({ title: "Hata", description: res.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Hata", description: "Müşteri kaydı sırasında sorun oluştu.", variant: "destructive" });
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
        devicePassword: values.devicePassword,
        serviceType: values.serviceType,
        problemDesc: values.problemDesc,
        cosmeticCondition: cosmeticStr,
        estimatedCost: Number(values.estimatedCost),
        downPayment: Number(values.downPayment),
        notes: notesStr,
        technicianId: values.technicianId,
        estimatedDeliveryDate: values.estimatedDeliveryDate,
        photos: photos.map(p => p.dataUrl),
        priority: values.priority ?? 1,
      });

      if (result.success) {
        toast({ title: "Başarılı", description: "Yeni servis kaydı oluşturuldu." });
        router.push("/servis");
      } else {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      }
    });
  };

  const currentEstimatedCost = form.watch("estimatedCost") || "0";
  const errors = form.formState.errors;

  const cardClass = "bg-card p-6 md:p-8 rounded-2xl border border-border/50 transition-all";
  const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block";

  const getInputClass = (fieldName: keyof ServiceFormValues) => cn(
    "bg-muted/30 border rounded-xl py-3 px-4 text-sm font-medium transition-all",
    errors[fieldName as keyof typeof errors]
      ? "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/20 focus-visible:border-destructive"
      : "border-border/50 hover:border-border focus-visible:bg-background focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10"
  );

  return (
    <main className="min-h-screen relative pb-32">
      <div className="py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-1.5">Servis İşlemleri</p>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Yeni Cihaz Kaydı</h2>
        </div>

        <form
          id="new-service-form"
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form Validation Errors:", errors);
            toast({
              title: "Formu Kontrol Edin",
              description: "Lütfen eksik veya hatalı alanları (kırmızı işaretli) düzeltin.",
              variant: "destructive"
            });
          })}
          className="flex flex-col lg:grid lg:grid-cols-12 gap-6"
        >
          {/* Main Left Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Müşteri Bilgileri */}
            <section className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <SectionBadge icon={PersonStanding} title="Müşteri Bilgileri" />
                <div>
                  {isCustomerCreated ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 px-4 py-1.5 rounded-full text-xs gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Eklendi
                    </Badge>
                  ) : (
                    !foundCustomer && (
                      <Button
                        type="button"
                        onClick={handleQuickCustomerCreate}
                        disabled={isCreatingCustomer}
                        size="sm"
                        className="font-medium gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9"
                      >
                        {isCreatingCustomer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />}
                        Yeni Ekle
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 relative z-10">
                {/* Ad Soyad */}
                <div className="space-y-1.5 relative">
                  <Label className={labelClass}>Müşteri Ad Soyad <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      {...form.register("customerName")}
                      placeholder="İsim giriniz..."
                      className={getInputClass("customerName")}
                      autoComplete="off"
                      onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                    />
                    {isLookingUpName && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[100] bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-1">
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
                          className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-between gap-4"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.customerName && <p className="text-xs text-destructive mt-1.5 px-1">{errors.customerName.message}</p>}
                </div>

                {/* Telefon */}
                <div className="space-y-1.5">
                  <PhoneInput
                    label="Telefon Numarası"
                    required
                    value={form.watch("customerPhone")}
                    error={errors.customerPhone?.message}
                    isLookingUp={isLookingUp}
                    onChange={(val) => {
                      form.setValue("customerPhone", val);
                      if (val.length > 0 && val[0] !== "5") {
                        form.setError("customerPhone", { message: "Numara 5 ile başlamalıdır" });
                      } else {
                        form.clearErrors("customerPhone");
                      }
                    }}
                  />
                </div>

                {/* E-posta */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label className={labelClass}>E-Posta Adresi <span className="text-muted-foreground/50 normal-case tracking-normal font-normal">(opsiyonel)</span></Label>
                  <Input
                    {...form.register("customerEmail")}
                    placeholder="ornek@mail.com"
                    type="email"
                    className={getInputClass("customerEmail")}
                  />
                  {errors.customerEmail && <p className="text-xs text-destructive mt-1.5 px-1">{errors.customerEmail.message}</p>}
                </div>
              </div>
            </section>

            {/* 2. Cihaz Detayları */}
            <section className={cardClass}>
              <SectionBadge icon={Smartphone} title="Cihaz Detayları" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                {/* Marka */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>Marka <span className="text-destructive">*</span></Label>
                  <Input
                    {...form.register("deviceBrand")}
                    placeholder="Örn: Apple, Samsung"
                    className={getInputClass("deviceBrand")}
                  />
                  {errors.deviceBrand && <p className="text-xs text-destructive mt-1.5 px-1">{errors.deviceBrand.message}</p>}
                </div>

                {/* Model */}
                <div className="space-y-1.5 relative">
                  <Label className={labelClass}>Model <span className="text-destructive">*</span></Label>
                  <Input
                    {...form.register("deviceModel")}
                    placeholder="Örn: iPhone 15 Pro"
                    className={getInputClass("deviceModel")}
                    onFocus={() => modelSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                      {modelSuggestions.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            form.setValue("deviceModel", model);
                            form.clearErrors("deviceModel");
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.deviceModel && <p className="text-xs text-destructive mt-1.5 px-1">{errors.deviceModel.message}</p>}
                </div>

                {/* IMEI */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>IMEI Numarası</Label>
                  <Input
                    {...form.register("imei")}
                    placeholder="15 haneli IMEI"
                    maxLength={15}
                    className={getInputClass("imei")}
                  />
                  {errors.imei && <p className="text-xs text-destructive mt-1.5 px-1">{errors.imei.message}</p>}
                </div>

                {/* Seri No */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>Seri Numarası</Label>
                  <Input
                    {...form.register("serialNumber")}
                    placeholder="Seri no (opsiyonel)"
                    className={getInputClass("serialNumber")}
                  />
                </div>

                {/* Cihaz Şifresi */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-2.5 w-2.5" strokeWidth={1.5} />
                      Cihaz Şifresi / PIN
                    </span>
                  </Label>
                  <Input
                    {...form.register("devicePassword")}
                    placeholder="Kilit ekranı şifresi"
                    className={getInputClass("devicePassword")}
                    autoComplete="off"
                  />
                  <p className="text-[10px] text-muted-foreground/60 px-1">Cihaza erişim gerektiğinde kullanılacak</p>
                </div>

                {/* Servis Türü */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-2.5 w-2.5" strokeWidth={1.5} />
                      Servis Türü
                    </span>
                  </Label>
                  <Select onValueChange={(val) => form.setValue("serviceType", val)}>
                    <SelectTrigger className={cn(getInputClass("serviceType"), "h-auto")}>
                      <SelectValue placeholder="Servis türünü seçin..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                      {[
                        "Ekran Değişimi",
                        "Batarya Değişimi",
                        "Şarj Soketi",
                        "Kamera Değişimi",
                        "Hoparlör / Mikrofon",
                        "Yazılım Sorunu",
                        "Su Hasarı Temizliği",
                        "Donanım Hasarı",
                        "Ürün Kontrolü",
                        "Diğer",
                      ].map((type) => (
                        <SelectItem key={type} value={type} className="text-sm py-2.5 cursor-pointer rounded-lg m-0.5">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kozmetik Durum */}
                <div className="md:col-span-2 space-y-3 pt-1">
                  <Label className={labelClass}>Kozmetik Durum</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["Çizik", "Ezik", "Kırık Cam", "Sıvı Teması"].map((item) => (
                      <label key={item} className="flex items-center gap-2.5 p-3.5 bg-muted/30 rounded-xl cursor-pointer border border-transparent hover:border-primary/20 transition-all">
                        <Checkbox
                          className="rounded-md data-[state=checked]:bg-primary h-4 w-4 border-muted-foreground/30"
                          onCheckedChange={(checked) => {
                            const current = form.getValues("cosmeticConditions");
                            if (checked) form.setValue("cosmeticConditions", [...current, item]);
                            else form.setValue("cosmeticConditions", current.filter(i => i !== item));
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                  <Textarea
                    {...form.register("cosmeticNotes")}
                    className={cn(getInputClass("cosmeticNotes"), "h-20 resize-none")}
                    placeholder="Ek kozmetik notlar..."
                  />
                </div>
              </div>
            </section>

            {/* 3. Arıza Açıklaması */}
            <section className={cardClass}>
              <SectionBadge icon={AlertCircle} title="Arıza Bilgisi" />
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Detaylı Arıza Tanımı <span className="text-destructive">*</span></Label>
                  <Textarea
                    {...form.register("problemDesc")}
                    className={cn(getInputClass("problemDesc"), "h-32 resize-none")}
                    placeholder="Müşterinin şikayetini ve gözlemlenen arızayı detaylıca anlatın..."
                  />
                  {errors.problemDesc && <p className="text-xs text-destructive mt-1.5 px-1">{errors.problemDesc.message}</p>}
                </div>

                <div className="space-y-3 pt-1">
                  <Label className={labelClass}>Teslim Alınan Aksesuarlar</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Şarj Aleti", "Kutu", "Kılıf", "SIM Kart", "Hafıza Kart"].map((item) => (
                      <label key={item} className="inline-flex items-center gap-2 cursor-pointer bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 rounded-full px-4 py-2 transition-all">
                        <Checkbox
                          className="rounded-sm border-muted-foreground/40 h-3.5 w-3.5"
                          onCheckedChange={(checked) => {
                            const current = form.getValues("accessories");
                            if (checked) form.setValue("accessories", [...current, item]);
                            else form.setValue("accessories", current.filter(i => i !== item));
                          }}
                        />
                        <span className="text-sm font-medium whitespace-nowrap">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Customer history */}
            {foundCustomer && (
              <section className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-xs font-semibold tracking-widest text-blue-600 uppercase">Geçmiş Analizi</h3>
                </div>
                <div className="space-y-4">
                  <Badge className={cn("border-none text-[10px] px-3 py-1 font-medium",
                    foundCustomer.isVip ? "bg-amber-400 text-amber-950" : "bg-blue-600 text-white"
                  )}>
                    {foundCustomer.isVip ? "⭐ VIP Müşteri" : "✓ Düzenli Müşteri"}
                  </Badge>
                  <Separator className="bg-blue-500/15" />
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-blue-600/60 uppercase tracking-wider">Son Servisler</p>
                    {foundCustomer.tickets?.slice(0, 3).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-blue-500/10">
                        <div>
                          <span className="text-xs font-medium text-foreground block">{t.deviceBrand} {t.deviceModel}</span>
                          <span className="text-[10px] text-muted-foreground">{t.ticketNumber} • {format(new Date(t.createdAt), "dd.MM.yyyy")}</span>
                        </div>
                        <Badge variant="outline" className="border-blue-500/20 text-[9px] text-blue-600 bg-blue-500/5">{t.status}</Badge>
                      </div>
                    ))}
                    {(!foundCustomer.tickets || foundCustomer.tickets.length === 0) && (
                      <p className="text-xs text-muted-foreground italic">Kayıtlı servis işlemi yok.</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => window.open(`/musteriler/${foundCustomer.id}`, '_blank')}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl"
                  >
                    Profilini Aç
                  </Button>
                </div>
              </section>
            )}

            {/* Mali İşlemler */}
            <section className={cardClass}>
              <SectionBadge icon={Receipt} title="Mali İşlemler" />
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Tahmini Ücret <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-primary/60">₺</span>
                    <Input
                      {...form.register("estimatedCost")}
                      type="number"
                      className={cn(getInputClass("estimatedCost"), "pl-9 text-lg font-semibold")}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.estimatedCost && <p className="text-xs text-destructive mt-1.5 px-1">{errors.estimatedCost.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Alınan Kapora</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-primary/60">₺</span>
                    <Input
                      {...form.register("downPayment")}
                      type="number"
                      className={cn(getInputClass("downPayment"), "pl-9 text-lg font-semibold")}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Teslim Tarihi</Label>
                  <Input
                    {...form.register("estimatedDeliveryDate")}
                    type="datetime-local"
                    className={cn(getInputClass("estimatedDeliveryDate"))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Öncelik</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 1, label: "Normal", color: "bg-muted/60 text-muted-foreground border-border/50" },
                      { value: 2, label: "Yüksek", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
                      { value: 3, label: "Acil", color: "bg-destructive/10 text-destructive border-destructive/30" },
                    ].map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => form.setValue("priority", value)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-medium border transition-all",
                          form.watch("priority") === value
                            ? color + " font-semibold ring-2 ring-offset-1 ring-current/20"
                            : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Atanan Teknisyen</Label>
                  <Select onValueChange={(val) => form.setValue("technicianId", val)} value={form.watch("technicianId")}>
                    <SelectTrigger className={cn(getInputClass("technicianId"), "h-auto py-2.5")}>
                      <SelectValue placeholder="Teknisyen Seçin..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id} className="text-sm py-2.5 cursor-pointer rounded-lg m-0.5">
                          <div className="flex items-center gap-2">
                            <span>{tech.name}</span>
                            <span className="text-[10px] opacity-40 uppercase">
                              ({tech.role === "ADMIN" ? "Admin" : tech.role === "TECHNICIAN" ? "Teknisyen" : "Personel"})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Fotoğraflar */}
            <section className={cardClass}>
              <SectionBadge icon={Camera} title="Cihaz Fotoğrafları" />
              <PhotoUploader
                photos={photos}
                onAdd={(newFiles) => setPhotos(prev => [...prev, ...newFiles].slice(0, MAX_PHOTOS))}
                onRemove={(id) => setPhotos(prev => prev.filter(p => p.id !== id))}
              />
              {photos.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-3 text-center">
                  {photos.length} fotoğraf servis kaydına eklenecek
                </p>
              )}
            </section>
          </div>
        </form>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-64 right-0 z-50 pointer-events-none">
          <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-lg p-4 px-6 md:px-10 pointer-events-auto w-full">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tahmini Ücret</span>
                  <span className="text-xl font-semibold text-primary leading-none">₺{currentEstimatedCost}</span>
                </div>
                {photos.length > 0 && (
                  <div className="hidden md:flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="text-xs font-medium">{photos.length} fotoğraf</span>
                  </div>
                )}
                {Object.keys(errors).length > 0 && (
                  <div className="hidden md:flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="text-xs font-medium">Kırmızı alanları düzeltin</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="rounded-xl font-medium text-sm h-11 px-5"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  form="new-service-form"
                  disabled={isPending}
                  className={cn(
                    "h-11 px-7 font-medium rounded-xl gap-2 transition-all shadow-lg",
                    Object.keys(errors).length > 0
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : Object.keys(errors).length > 0 ? (
                    <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Save className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  {Object.keys(errors).length > 0 ? "Hataları Düzeltin" : "Kaydı Tamamla"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
