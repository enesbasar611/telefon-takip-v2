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
  Sparkles,
  ZoomIn,
  Trash,
  Clock,
  Package,
  Lock,
  History as HistoryIcon,
} from "lucide-react";
import { createCustomerMuted } from "@/lib/actions/customer-actions";
import { parseServiceDiagnosticWithAI } from "@/lib/actions/gemini-actions";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PatternLock } from "@/components/ui/pattern-lock";

import { createServiceTicket } from "@/lib/actions/service-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { searchDeviceModels } from "@/lib/actions/model-lookup-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormFactory } from "@/components/common/form-factory";
import { getIndustryLabel, getServiceFormFields, extractCoreAndAttributes, getIndustryAccessories } from "@/lib/industry-utils";
import { PageHeader } from "@/components/ui/page-header";
import { Wrench } from "lucide-react";

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 3;

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s0-9\-_.]+$/, "Müşteri adı geçersiz karakterler içeriyor"),
  customerPhone: z.string()
    .min(1, "Telefon no giriniz"),
  customerEmail: z.string().email("Geçerli bir e-posta giriniz").or(z.literal("")).optional(),
  estimatedCost: z.string().min(1, "Tutar giriniz").optional(),
  downPayment: z.string().optional(),
  estimatedDeliveryDate: z.string().or(z.literal("")).optional(),
  technicianId: z.string().or(z.literal("")).optional(),
  priority: z.number().optional(),
  // We use .passthrough() so the dynamic industry fields (which aren't defined here) won't be stripped or cause errors.
}).passthrough();

type ServiceFormValues = any; // We use 'any' since fields are dynamic

const SectionBadge = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 bg-primary/10 rounded-xl">
      <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
    </div>
    <h3 className="font-medium font-semibold text-base tracking-tight">{title}</h3>
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
  const [shop, setShop] = useState<any>(null);
  const [isDiagnosticPending, setIsDiagnosticPending] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState<number[]>([]);

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

  const industryFields = getServiceFormFields(shop);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [s, staffList] = await Promise.all([
          getShop(),
          getStaff()
        ]);
        setShop(s);

        const techList = staffList.filter((s: any) =>
          s.role === "SUPER_ADMIN" || s.role === "SHOP_MANAGER" || s.role === "ADMIN" || s.role === "TECHNICIAN" || s.role === "STAFF"
        );
        setTechnicians(techList);
        if (techList.length > 0 && !form.getValues("technicianId")) {
          form.setValue("technicianId", techList[0].id);
        }
      } catch (e) {
        console.error("Initial data load error:", e);
      }
    }
    loadInitialData();
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

  const problemDesc = form.watch("problemDesc");
  const deviceModel = form.watch("deviceModel");

  const handleAIDiagnosis = async () => {
    if (!problemDesc) {
      toast({ title: "Hata", description: "Lütfen önce bir arıza açıklaması girin.", variant: "destructive" });
      return;
    }
    setIsDiagnosticPending(true);
    try {
      const result = await parseServiceDiagnosticWithAI(problemDesc, deviceModel, shop?.industry);
      if (result.success) {
        setDiagnosticResult(result.data);
        form.setValue("estimatedCost", String(result.data.estimatedTotalPrice));
        toast({ title: "BAŞAR AI Analizi Hazır", description: "Sektörel arıza teşhisi ve tahmini maliyet oluşturuldu." });
      } else {
        toast({ title: "AI Hatası", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      console.error("AI Diagnosis error:", error);
    } finally {
      setIsDiagnosticPending(false);
    }
  };

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
      const res = await createCustomerMuted({ name, phone, email });
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
      const { deviceBrand, deviceModel, imei, attributes } = extractCoreAndAttributes(industryFields, values);

      const notesStr = [
        values.accessories && values.accessories.length > 0 ? `Aksesuarlar: ${values.accessories.join(", ")}` : "",
        values.downPayment && Number(values.downPayment) > 0 ? `Ön Ödeme: ₺${values.downPayment}` : ""
      ].filter(Boolean).join(" | ");

      const result = await createServiceTicket({
        customerName: values.customerName,
        customerPhone: values.customerPhone.replace(/\D/g, ""),
        customerEmail: values.customerEmail,
        deviceBrand,
        deviceModel,
        imei,
        problemDesc: values.problemDesc,
        estimatedCost: Number(values.estimatedCost),
        downPayment: Number(values.downPayment),
        notes: notesStr,
        technicianId: values.technicianId,
        estimatedDeliveryDate: values.estimatedDeliveryDate,
        photos: photos.map(p => p.dataUrl),
        priority: values.priority ?? 1,
        attributes,
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

  const getInputClass = (fieldName: string) => cn(
    "bg-muted/30 border rounded-xl py-3 px-4 text-sm font-medium transition-all",
    (errors as any)[fieldName]
      ? "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/20 focus-visible:border-destructive"
      : "border-border/50 hover:border-border focus-visible:bg-background focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10"
  );

  return (
    <div className="pb-48 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <PageHeader
          title={`Yeni ${getIndustryLabel(shop, "serviceTicket")} Kaydı`}
          description={`${getIndustryLabel(shop, "serviceTicket")} işlemlerini başlatmak için gerekli bilgileri doldurun.`}
          icon={Wrench}
        />

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
                  {errors.customerName && <p className="text-xs text-destructive mt-1.5 px-1">{errors.customerName.message as string}</p>}
                </div>

                {/* Telefon */}
                <div className="space-y-1.5">
                  <PhoneInput
                    label="Telefon Numarası"
                    required
                    value={form.watch("customerPhone")}
                    error={errors.customerPhone?.message as string}
                    isLookingUp={isLookingUp}
                    onChange={(val) => {
                      form.setValue("customerPhone", val);
                      const raw = val.replace(/\D/g, "");
                      if (raw.length > 0 && raw[0] !== "5") {
                        form.setError("customerPhone", { message: "Numara 5 ile başlamalıdır" });
                      } else if (raw.length > 0 && raw.length !== 10) {
                        form.setError("customerPhone", { message: "Numara 10 haneli olmalıdır" });
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
                  {errors.customerEmail && <p className="text-xs text-destructive mt-1.5 px-1">{errors.customerEmail.message as string}</p>}
                </div>
              </div>
            </section>

            {/* 2. Dynamic Industry Details */}
            <section className={cardClass}>
              <SectionBadge icon={Smartphone} title={`${getIndustryLabel(shop, "customerAsset")} Detayları`} />

              <FormFactory
                fields={industryFields}
                register={form.register}
                control={form.control}
                errors={errors}
                twoCol={true}
                onPatternClick={() => setIsPatternModalOpen(true)}
              />
            </section>

            {/* 3. Problem Description & AI Analysis */}
            <section className={cardClass}>
              <div className="flex justify-between items-center mb-6">
                <SectionBadge icon={AlertCircle} title={getIndustryLabel(shop, "problemDesc")} />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 gap-2 text-xs font-medium"
                  onClick={handleAIDiagnosis}
                  disabled={isDiagnosticPending}
                >
                  {isDiagnosticPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  BAŞAR AI ile Analiz Et
                </Button>
              </div>

              <div className="space-y-4">
                <Textarea
                  {...form.register("problemDesc")}
                  placeholder="Sorun detaylarını buraya yazın..."
                  className={cn(getInputClass("problemDesc"), "min-h-[120px] resize-none")}
                />
                {errors.problemDesc && <p className="text-xs text-destructive">{errors.problemDesc.message as string}</p>}

                {/* AI Diagnostic Result */}
                {diagnosticResult && (
                  <div className="p-5 md:p-8 bg-gradient-to-br from-blue-500/5 to-violet-500/5 dark:from-blue-500/10 dark:to-violet-500/10 border border-blue-200 dark:border-blue-900/50 rounded-3xl space-y-6 animate-in fade-in slide-in-from-top-4 text-left shadow-xl shadow-blue-500/5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">BAŞAR AI SEKTÖREL ANALİZ</span>
                      <div className={cn(
                        "ml-auto px-3 py-1.5 rounded-full text-[10px] font-bold border",
                        diagnosticResult.riskLevel === "Yüksek" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                          diagnosticResult.riskLevel === "Orta" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      )}>
                        ÖNEM: {diagnosticResult.riskLevel}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-blue-500/60" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Olası Teşhisler</span>
                        </div>
                        <ul className="text-sm text-foreground/80 space-y-2 list-none">
                          {diagnosticResult.possibleCauses?.map((c: string, i: number) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-blue-500/60" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gerekli Malzemeler</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {diagnosticResult.suggestedParts?.map((p: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1 p-2.5 rounded-xl bg-background border border-border/50 group hover:border-blue-500/30 transition-all">
                              <span className="text-xs font-semibold text-foreground">{p.name}</span>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-muted-foreground">₺{p.estimatedPrice}</span>
                                <span className={cn("text-[8px] font-bold uppercase tracking-tighter", p.inStock ? "text-emerald-500" : "text-rose-500")}>
                                  {p.inStock ? "Stokta Var" : "Stokta Yok"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/10">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-[8px] sm:text-[10px]">TAHMİNİ İŞ SÜRESİ</span>
                        </div>
                        <span className="text-sm sm:text-lg font-bold text-foreground">{diagnosticResult.repairTimeRange}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-[8px] sm:text-[10px]">PROJE BEDELİ</span>
                        </div>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-500 tracking-tighter leading-none">₺{diagnosticResult.estimatedTotalPrice}</span>
                      </div>
                    </div>
                    {diagnosticResult.summaryReport && (
                      <div className="pt-6 border-t border-blue-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <HistoryIcon className="h-3.5 w-3.5 text-blue-500/60" />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">🔍 BAŞAR AI SEKTÖREL ANALİZ RAPORU</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed italic border-l-2 border-blue-500/30 pl-4 py-1 bg-blue-500/5 rounded-r-xl">
                          "{diagnosticResult.summaryReport}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <Label className={labelClass}>Teslim Alınan Parçalar / Aksesuarlar</Label>
                <div className="flex flex-wrap gap-2">
                  {getIndustryAccessories(shop).map((item) => (
                    <Label key={item} className="font-medium inline-flex items-center gap-2 cursor-pointer bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 rounded-full px-4 py-2 transition-all">
                      <Checkbox
                        className="rounded-sm border-muted-foreground/40 h-3.5 w-3.5"
                        onCheckedChange={(checked) => {
                          const current = form.getValues("accessories") || [];
                          if (checked) form.setValue("accessories", [...current, item]);
                          else form.setValue("accessories", current.filter((i: string) => i !== item));
                        }}
                      />
                      <span className="text-sm font-medium whitespace-nowrap">{item}</span>
                    </Label>
                  ))}
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
                  <h3 className="font-medium text-xs font-semibold tracking-widest text-blue-600 uppercase">Geçmiş Analizi</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Toplam Servis</span>
                    <span className="font-bold text-blue-600">{foundCustomer._count?.services || 0} Adet</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Sadakat Puanı</span>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5 border-emerald-500/20">
                      {foundCustomer.loyaltyPoints || 0} Puan
                    </Badge>
                  </div>
                </div>
              </section>
            )}

            {/* Maliyet ve Teslimat */}
            <section className={cardClass}>
              <SectionBadge icon={Receipt} title="Ödeme & Planlama" />

              <div className="space-y-5">
                <div className="space-y-1.5 flex flex-col">
                  <Label className={labelClass}>Tahmini Tutar</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">₺</span>
                    <Input
                      {...form.register("estimatedCost")}
                      type="number"
                      className={cn(getInputClass("estimatedCost"), "pl-9 text-2xl font-black text-emerald-500 bg-emerald-500/5 border-emerald-500/20 focus-visible:border-emerald-500")}
                      placeholder="0.00"
                    />
                  </div>
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
        <div className="fixed bottom-0 left-0 right-0 z-[100] pb-[120px] lg:pb-8 px-4 pointer-events-none">
          <div className="max-w-7xl mx-auto flex items-center justify-end pointer-events-auto">
            <div className="bg-background/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-white/10 dark:border-zinc-800/50 p-2 pl-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="hidden sm:flex items-center gap-8 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-0.5">TOPLAM TAHMİN</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground tracking-tighter">₺{Number(currentEstimatedCost).toLocaleString('tr-TR')}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/40">YTL</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/5" />

                {photos.length > 0 && (
                  <div className="flex items-center gap-2.5 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20">
                    <Camera className="h-4 w-4" strokeWidth={1.5} />
                    <span className="text-xs font-bold">{photos.length} GÖRSEL</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="rounded-2xl font-bold text-sm h-14 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  İptal
                </Button>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <Button
                    type="submit"
                    form="new-service-form"
                    disabled={isPending}
                    className={cn(
                      "relative h-14 px-12 font-black rounded-2xl gap-3 transition-all shadow-xl text-lg",
                      Object.keys(errors).length > 0
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : Object.keys(errors).length > 0 ? (
                      <AlertCircle className="h-6 w-6" strokeWidth={2.5} />
                    ) : (
                      <Save className="h-6 w-6" strokeWidth={2.5} />
                    )}
                    {Object.keys(errors).length > 0 ? "Hataları Düzeltin" : "KAYDI TAMAMLA"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isPatternModalOpen} onOpenChange={setIsPatternModalOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center text-lg font-semibold">
                Kilit Deseni Çiz
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-6 pt-4 pb-2">
              <PatternLock
                onComplete={(pattern) => {
                  setTempPattern(pattern);
                }}
                initialPattern={tempPattern}
              />
              <div className="flex items-center gap-4 mt-6">
                <Button type="button" variant="outline" size="sm" onClick={() => setTempPattern([])} className="gap-2">
                  <Trash className="w-4 h-4" /> Temizle
                </Button>
                <Button type="button" size="sm" onClick={() => {
                  if (tempPattern.length > 0) {
                    form.setValue("devicePassword", "DESEN:" + tempPattern.join(","));
                    setIsPatternModalOpen(false);
                  }
                }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                  <CheckCircle2 className="w-4 h-4" /> Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}






