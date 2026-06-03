"use client";

import { useState, useEffect, useTransition, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Plus,
  Loader2,
  CheckCircle2,
  Save,
  X,
  Sparkles,
  Trash,
  Clock,
  Wrench,
  Zap,
  Grid,
  Printer,
  History,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceActions } from "@/components/service/service-actions";
import { createCustomerMuted } from "@/lib/actions/customer-actions";
import { parseServiceDiagnosticWithAI } from "@/lib/actions/gemini-actions";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatternLock } from "@/components/ui/pattern-lock";

import { createServiceTicket } from "@/lib/actions/service-actions";
import { getStaff } from "@/lib/actions/staff-actions";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { searchDeviceModels } from "@/lib/actions/model-lookup-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { cn } from "@/lib/utils";
import { CustomerSection } from "@/components/features/service-new/customer-section";
import { LiveTicketPreview } from "@/components/features/service-new/live-ticket-preview";
import { PhotoFile } from "@/components/features/service-new/photo-manager";
import { normalizePhoneNumber } from "@/components/features/service-new/utils";
import { getIndustryLabel, getServiceFormFields, extractCoreAndAttributes, getIndustryAccessories } from "@/lib/industry-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import { StepIndicator } from "@/components/features/service-new/step-indicator";
import { StepDeviceDetails } from "@/components/features/service-new/step-device-details";
import { StepFinancials } from "@/components/features/service-new/step-financials";
import { ServiceReceiptModal } from "@/components/service/service-receipt-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 3;
const EMPTY_ARRAY: any[] = [];

// normalizePhoneNumber moved to ./utils.ts

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s0-9\-_.)(&]+$/, "Müşteri adı geçersiz karakterler içeriyor"),
  customerPhone: z.string()
    .min(1, "Telefon no giriniz")
    .refine((val) => normalizePhoneNumber(val).length === 10, "Numara 10 haneli olmalıdır"),
  customerEmail: z.string().email("Geçerli bir e-posta giriniz").or(z.literal("")).optional(),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  estimatedCost: z.string()
    .min(1, "Tutar giriniz")
    .refine((val) => Number(val) > 0, "Fiyat giriniz"),
  problemDesc: z.string().min(3, "Arıza açıklaması gereklidir"),
  downPayment: z.string().optional(),
  estimatedDeliveryDate: z.string().or(z.literal("")).optional(),
  technicianId: z.string().or(z.literal("")).optional(),
  priority: z.number().optional(),
  // We use .passthrough() so the dynamic industry fields (which aren't defined here) won't be stripped or cause errors.
}).passthrough();

type ServiceFormValues = any; // We use 'any' since fields are dynamic

const REQUIRED_SERVICE_FIELD_NAMES = [
  "customerName",
  "customerPhone",
  "deviceBrand",
  "deviceModel",
  "problemDesc",
  "estimatedCost",
] as const;

const SERVICE_OWNER_ROLES = ["SUPER_ADMIN", "SHOP_MANAGER", "ADMIN", "MANAGER"];
const ASSIGNABLE_SERVICE_ROLES = [...SERVICE_OWNER_ROLES, "TECHNICIAN", "STAFF"];


// PhotoUploader extracted to components/photo-manager.tsx

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function NewServicePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCustomerCreated, setIsCustomerCreated] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDiagnosticPending, setIsDiagnosticPending] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [createdTicketForWhatsApp, setCreatedTicketForWhatsApp] = useState<any>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTicket, setReceiptTicket] = useState<any>(null);
  const [duplicateWarningShown, setDuplicateWarningShown] = useState<string | null>(null);

  // Load persistence for isSimpleMode
  useEffect(() => {
    const saved = localStorage.getItem("service_simple_mode");
    if (saved !== null) {
      setIsSimpleMode(saved === "true");
    }
  }, []);

  // Update persistence for isSimpleMode
  useEffect(() => {
    localStorage.setItem("service_simple_mode", isSimpleMode.toString());
  }, [isSimpleMode]);
  const [tempPattern, setTempPattern] = useState<number[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { data: shop } = useQuery({
    queryKey: ["shop"],
    queryFn: () => getShop(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: technicians = EMPTY_ARRAY } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const staffList = await getStaff();
      const assignableStaff = staffList.filter((member: any) => ASSIGNABLE_SERVICE_ROLES.includes(member.role));
      const currentUser = assignableStaff.find((member: any) => member.id === session?.user?.id);
      const currentUserCanOwnService = currentUser && SERVICE_OWNER_ROLES.includes(currentUser.role);
      const managerFallback =
        assignableStaff.find((member: any) => member.role === "SHOP_MANAGER") ||
        assignableStaff.find((member: any) => member.role === "ADMIN") ||
        assignableStaff.find((member: any) => member.role === "MANAGER") ||
        assignableStaff.find((member: any) => member.role === "SUPER_ADMIN");
      const technicianFallback = assignableStaff.find((member: any) => member.role === "TECHNICIAN");
      const defaultAssignee = currentUserCanOwnService ? currentUser : managerFallback || technicianFallback || assignableStaff[0];

      const list = [
        ...(defaultAssignee ? [defaultAssignee] : []),
        ...assignableStaff.filter((member: any) => member.id !== defaultAssignee?.id),
      ];

      return list;
    },
    enabled: !!session?.user?.id,
  });

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
      estimatedDeliveryDate: getDefaultDeliveryDate(),
    }
  });

  function getDefaultDeliveryDate() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const handleReset = useCallback(() => {
    form.reset({
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
      technicianId: technicians[0]?.id || "",
      estimatedDeliveryDate: getDefaultDeliveryDate(),
    });
    setPhotos([]);
    setCurrentStep(1);
    setFoundCustomer(null);
    setCreatedTicketForWhatsApp(null);
    setDiagnosticResult(null);
    setIsCustomerCreated(false);
    localStorage.removeItem("service_draft");
  }, [form, technicians]);

  // Draft System: Load from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem("service_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        Object.keys(draft).forEach(key => {
          if (draft[key]) form.setValue(key as any, draft[key]);
        });
        toast({ title: "Taslak Geri Yüklendi", description: "Yarım kalan formunuz otomatik olarak dolduruldu." });
      } catch (e) {
        console.error("Draft load error", e);
      }
    }
  }, []);

  // Draft System: Save changes (stable ref — form object identity is stable)
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("service_draft", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const industryFields = getServiceFormFields(shop);

  useEffect(() => {
    if (technicians.length > 0 && !form.getValues("technicianId")) {
      form.setValue("technicianId", technicians[0].id);
    }
  }, [technicians, form]);

  const watchModel = form.watch("deviceModel");
  const { data: models = EMPTY_ARRAY } = useQuery({
    queryKey: ["model-search", watchModel],
    queryFn: () => searchDeviceModels(watchModel),
    enabled: watchModel.length >= 2,
  });

  useEffect(() => {
    setModelSuggestions(models);
    setShowSuggestions(models.length > 0);
  }, [models]);

  const problemDesc = form.watch("problemDesc");

  const aiDiagnosisMutation = useMutation({
    mutationFn: async () => {
      if (!problemDesc) throw new Error("Lütfen önce bir arıza açıklaması girin.");
      return parseServiceDiagnosticWithAI(problemDesc, watchModel, shop?.industry);
    },
    onSuccess: (result) => {
      if (result.success) {
        setDiagnosticResult(result.data);
        form.setValue("estimatedCost", String(result.data.estimatedTotalPrice));
        toast({ title: "BAŞAR AI Analizi Hazır", description: "Sektörel arıza teşhisi ve tahmini maliyet oluşturuldu." });
      } else {
        toast({ title: "AI Hatası", description: result.error, variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "AI Hatası", description: error.message, variant: "destructive" });
    }
  });

  const handleAIDiagnosis = () => aiDiagnosisMutation.mutate();

  const watchName = form.watch("customerName");
  const { data: nameLookupResults = EMPTY_ARRAY } = useQuery({
    queryKey: ["customer-name-search", watchName],
    queryFn: () => findCustomerByName(watchName),
    enabled: watchName.length >= 2 && (!foundCustomer || watchName !== foundCustomer.name),
  });

  useEffect(() => {
    setNameSuggestions(nameLookupResults);
    setShowNameSuggestions(nameLookupResults.length > 0);
  }, [nameLookupResults]);

  const watchPhone = form.watch("customerPhone");
  const purePhone = normalizePhoneNumber(watchPhone);
  const { data: phoneLookupResult } = useQuery({
    queryKey: ["customer-phone-search", purePhone],
    queryFn: () => findCustomerByPhone(purePhone),
    enabled: purePhone.length >= 7,
  });

  useEffect(() => {
    if (phoneLookupResult) {
      setFoundCustomer(phoneLookupResult);
      form.setValue("customerName", phoneLookupResult.name);
      form.clearErrors("customerName");
      if (!isCustomerCreated) {
        toast({ title: "Müşteri Tanındı", description: `${phoneLookupResult.name} sistemde kayıtlı.` });
      }
      // Duplicate customer registration warning
      if (phoneLookupResult.tickets && phoneLookupResult.tickets.length > 0 && duplicateWarningShown !== phoneLookupResult.id) {
        const lastTicket = phoneLookupResult.tickets[0];
        const lastDate = lastTicket.createdAt ? format(new Date(lastTicket.createdAt), "d MMM yyyy", { locale: tr }) : "";
        toast({
          title: "⚠️ Bu müşterinin mevcut servis kaydı var",
          description: `${phoneLookupResult.name} için en son ${lastDate} tarihinde "${lastTicket.deviceBrand} ${lastTicket.deviceModel}" kaydı oluşturulmuş. Mükerrer kayıt yapmadığınızdan emin olun.`,
        });
        setDuplicateWarningShown(phoneLookupResult.id);
      }
    } else if (purePhone.length >= 10) {
      setFoundCustomer(null);
      setIsCustomerCreated(false);
      setDuplicateWarningShown(null);
    }
  }, [phoneLookupResult, purePhone, isCustomerCreated, form, duplicateWarningShown]);

  const createCustomerMutation = useMutation({
    mutationFn: (data: { name: string, phone: string, email: string }) => createCustomerMuted(data),
    onSuccess: (res, variables) => {
      if (res.success) {
        setFoundCustomer(res.customer);
        setIsCustomerCreated(true);
        if ((res as any).alreadyExisted) {
          toast({ title: "Müşteri Tanındı", description: `${res.customer.name} zaten sistemde kayıtlı, bilgiler otomatik dolduruldu.` });
        } else {
          toast({ title: "✅ Müşteri Kaydedildi!", description: `${variables.name} sisteme başarıyla eklendi.` });
        }
        // Force refresh suggestions and lookup states
        queryClient.invalidateQueries({ queryKey: ["customer-phone-search"] });
      } else {
        toast({ title: "Hata", description: res.error, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Hata", description: "Müşteri kaydı sırasında sorun oluştu.", variant: "destructive" });
    }
  });

  const handleQuickCustomerCreate = async () => {
    const isValid = await form.trigger(["customerName", "customerPhone"]);
    if (!isValid) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen müşteri adı ve geçerli bir telefon numarası girin.",
        variant: "destructive"
      });
      return;
    }
    createCustomerMutation.mutate({
      name: form.getValues("customerName"),
      phone: normalizePhoneNumber(form.getValues("customerPhone")),
      email: ""
    });
  };

  const createServiceMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const { deviceBrand, deviceModel, imei, attributes } = extractCoreAndAttributes(industryFields, values);
      const notesStr = [
        values.accessories && values.accessories.length > 0 ? `Aksesuarlar: ${values.accessories.join(", ")}` : "",
        values.downPayment && Number(values.downPayment) > 0 ? `Ön Ödeme: ₺${values.downPayment}` : ""
      ].filter(Boolean).join(" | ");

      return createServiceTicket({
        customerName: values.customerName,
        customerPhone: normalizePhoneNumber(values.customerPhone),
        customerEmail: "",
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
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        // Clear form, photos and customer state
        form.reset();
        setPhotos([]);
        setFoundCustomer(null);
        setIsCustomerCreated(false);
        localStorage.removeItem("service_draft");

        // Prepare WhatsApp data & receipt
        setCreatedTicketForWhatsApp(result.data);
        setReceiptTicket(result.data);
        setShowSuccessModal(true);
      } else {
        toast({
          title: "Hata",
          description: result?.error || "Servis kaydı oluşturulamadı.",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Bağlantı hatası veya yetki sorunu oluştu.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: ServiceFormValues) => createServiceMutation.mutate(values);

  // ── Consolidated watched fields (reuse existing watchers) ──────────────
  const watchedCustomerName = watchName;       // already watched at L480
  const watchedCustomerPhone = watchPhone;     // already watched at L492
  const watchedDeviceBrand = form.watch("deviceBrand");
  const watchedDeviceModel = watchModel;       // already watched at L445
  const watchedProblemDesc = problemDesc;       // already watched at L457
  const watchedEstimatedCost = form.watch("estimatedCost");
  const currentEstimatedCost = watchedEstimatedCost || "0";

  const errors = form.formState.errors;
  const foundCustomerServiceCount = foundCustomer?._count?.tickets ?? foundCustomer?.tickets?.length ?? 0;
  const hasBlockingErrors = REQUIRED_SERVICE_FIELD_NAMES.some((fieldName) => Boolean((errors as any)[fieldName]));

  // ── Memoized derived state ─────────────────────────────────────────────
  const { checklistItems, progressPercent, requiredFieldsComplete, canSubmitService } = useMemo(() => {
    const nameOk = (watchedCustomerName || "").trim().length >= 2;
    const phoneOk = normalizePhoneNumber(watchedCustomerPhone).length === 10;
    const brandOk = (watchedDeviceBrand || "").trim().length > 0;
    const modelOk = (watchedDeviceModel || "").trim().length > 0;
    const problemOk = (watchedProblemDesc || "").trim().length >= 3;
    const costOk = Number(watchedEstimatedCost || 0) > 0;

    const items = [
      { label: "Müşteri", isDone: nameOk && phoneOk },
      { label: "Cihaz", isDone: brandOk && modelOk },
      { label: "Arıza", isDone: problemOk },
      { label: "Maliyet", isDone: costOk },
    ];
    const done = items.filter(i => i.isDone).length;

    return {
      checklistItems: items,
      progressPercent: (done / items.length) * 100,
      requiredFieldsComplete: nameOk && phoneOk && brandOk && modelOk && problemOk && costOk,
      canSubmitService: (nameOk && phoneOk && brandOk && modelOk && problemOk && costOk) && !hasBlockingErrors,
    };
  }, [watchedCustomerName, watchedCustomerPhone, watchedDeviceBrand, watchedDeviceModel, watchedProblemDesc, watchedEstimatedCost, hasBlockingErrors]);

  useEffect(() => {
    const fieldsToClear: Array<typeof REQUIRED_SERVICE_FIELD_NAMES[number]> = [];

    if ((watchedCustomerName || "").trim().length >= 2) fieldsToClear.push("customerName");
    if (normalizePhoneNumber(watchedCustomerPhone).length === 10) fieldsToClear.push("customerPhone");
    if ((watchedDeviceBrand || "").trim()) fieldsToClear.push("deviceBrand");
    if ((watchedDeviceModel || "").trim()) fieldsToClear.push("deviceModel");
    if ((watchedProblemDesc || "").trim().length >= 3) fieldsToClear.push("problemDesc");
    if (Number(watchedEstimatedCost || 0) > 0) fieldsToClear.push("estimatedCost");

    if (fieldsToClear.some((fieldName) => Boolean((errors as any)[fieldName]))) {
      form.clearErrors(fieldsToClear);
    }
  }, [
    watchedCustomerName,
    watchedCustomerPhone,
    watchedDeviceBrand,
    watchedDeviceModel,
    watchedProblemDesc,
    watchedEstimatedCost,
    errors,
    form,
  ]);

  const markRequiredFields = () => {
    if ((form.getValues("customerName") || "").trim().length < 2) {
      form.setError("customerName", { message: "İsim soyisim gereklidir" });
    }
    if (normalizePhoneNumber(form.getValues("customerPhone")).length !== 10) {
      form.setError("customerPhone", { message: "Telefon numarası 10 haneli olmalıdır" });
    }
    if (Number(form.getValues("estimatedCost") || 0) <= 0) {
      form.setError("estimatedCost", { message: "Fiyat giriniz" });
    }
    if (!(form.getValues("deviceBrand") || "").trim()) {
      form.setError("deviceBrand", { message: "Marka gereklidir" });
    }
    if (!(form.getValues("deviceModel") || "").trim()) {
      form.setError("deviceModel", { message: "Model gereklidir" });
    }
    if ((form.getValues("problemDesc") || "").trim().length < 3) {
      form.setError("problemDesc", { message: "Arıza açıklaması gereklidir" });
    }
    toast({
      title: "Zorunlu alanlar eksik",
      description: "Ad soyad, telefon, marka, model, arıza açıklaması ve fiyatı doldurun.",
      variant: "destructive"
    });
  };

  // ── Stable style constants (Apple SaaS Compact Style) ─────────────────
  const cardClass = "bg-card/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/40 dark:border-white/5 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl group/card relative overflow-hidden";
  const labelClass = "text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 block ml-1 transition-colors group-hover/card:text-primary";

  const getInputClass = useCallback((fieldName: string) => cn(
    "h-11 bg-background/50 dark:bg-white/[0.02] border border-border/40 rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-300",
    (errors as any)[fieldName]
      ? "border-destructive/40 bg-destructive/5 focus-visible:ring-destructive/10 focus-visible:border-destructive shadow-none"
      : "hover:border-border/80 focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/5 shadow-none text-foreground"
  ), [errors]);

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pb-48 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <PageHeader
            title={
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Yeni {getIndustryLabel(shop, "serviceTicket")} Kaydı
                  </span>
                </motion.div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">SİSTEM CANLI</span>
                </div>
              </div>
            }
            description={`${getIndustryLabel(shop, "serviceTicket")} işlemlerini başlatmak için gerekli bilgileri doldurun.`}
            icon={Wrench}
            className="mb-0"
            actions={
              <div className="flex items-center gap-4">
                <div
                  className="relative flex items-center p-1 bg-muted/20 dark:bg-black/40 rounded-2xl border border-border/40 dark:border-white/5 backdrop-blur-xl cursor-pointer select-none min-w-[200px]"
                  onClick={() => {
                    const newMode = !isSimpleMode;
                    setIsSimpleMode(newMode);
                    localStorage.setItem("service_simple_mode", String(newMode));
                  }}
                >
                  <motion.div
                    className={cn(
                      "absolute inset-y-1 rounded-xl shadow-lg",
                      isSimpleMode ? "bg-orange-500 shadow-orange-500/20" : "bg-blue-600 shadow-blue-600/20"
                    )}
                    initial={false}
                    animate={{
                      x: isSimpleMode ? 0 : 96,
                      width: 96,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />

                  <div className="relative flex w-full">
                    <div className={cn(
                      "flex-1 flex items-center justify-center py-2 text-[11px] font-black tracking-widest transition-colors duration-300 z-10",
                      isSimpleMode ? "text-white" : "text-muted-foreground"
                    )}>
                      HIZLI
                    </div>
                    <div className={cn(
                      "flex-1 flex items-center justify-center py-2 text-[11px] font-black tracking-widest transition-colors duration-300 z-10",
                      !isSimpleMode ? "text-white" : "text-muted-foreground"
                    )}>
                      DETAYLI
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </div>

        <FormProvider {...form}>
          <form
            id="new-service-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* ──── LEFT COLUMN: THE STEPPER ─────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-6">

              {/* Step Indicator */}
              <StepIndicator currentStep={currentStep} setCurrentStep={setCurrentStep} />

              {/* STEP 1: CUSTOMER INFORMATION */}
              {currentStep === 1 && (
                <section className={cn(cardClass, "!overflow-visible animate-in fade-in slide-in-from-right-4 duration-500")}>
                  <CustomerSection
                    foundCustomer={foundCustomer}
                    isCustomerCreated={isCustomerCreated}
                    isCreatingCustomer={createCustomerMutation.isPending}
                    foundCustomerServiceCount={foundCustomerServiceCount}
                    handleQuickCustomerCreate={handleQuickCustomerCreate}
                    nameSuggestions={nameSuggestions}
                    showNameSuggestions={showNameSuggestions}
                    setShowNameSuggestions={setShowNameSuggestions}
                    onSuggestionSelect={(customer) => {
                      setFoundCustomer(customer);
                      form.setValue("customerName", customer.name);
                      form.setValue("customerPhone", customer.phone ?? "");
                      form.clearErrors(["customerName", "customerPhone"]);
                      setShowNameSuggestions(false);
                    }}
                  />
                </section>
              )}

              {/* STEP 2: DEVICE & ISSUE DETAILS */}
              {currentStep === 2 && (
                <StepDeviceDetails
                  isSimpleMode={isSimpleMode}
                  setIsPatternModalOpen={setIsPatternModalOpen}
                  modelSuggestions={modelSuggestions}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  industryFields={industryFields}
                  aiDiagnosisMutation={aiDiagnosisMutation}
                  diagnosticResult={diagnosticResult}
                  handleAIDiagnosis={handleAIDiagnosis}
                  photos={photos}
                  onAddPhoto={(files) => setPhotos(prev => [...prev, ...files].slice(0, 6))}
                  onRemovePhoto={(id) => setPhotos(prev => prev.filter(p => p.id !== id))}
                  getInputClass={getInputClass}
                />
              )}

              {/* STEP 3: OPERATIONS & FINANCIALS */}
              {currentStep === 3 && (
                <StepFinancials
                  technicians={technicians}
                  isSimpleMode={isSimpleMode}
                  photos={photos}
                  onAddPhoto={(files) => setPhotos(prev => [...prev, ...files].slice(0, 6))}
                  onRemovePhoto={(id) => setPhotos(prev => prev.filter(p => p.id !== id))}
                  getInputClass={getInputClass}
                />
              )}

              {/* Step Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="h-12 px-8 rounded-xl font-bold text-sm tracking-tight text-muted-foreground hover:text-foreground transition-all"
                >
                  Geri Git
                </Button>

                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {foundCustomer && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsHistoryModalOpen(true)}
                          className="h-12 px-6 rounded-xl border-blue-500/30 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 gap-2 font-bold text-xs shadow-sm transition-all"
                        >
                          <History className="h-4 w-4" />
                          <span>MÜŞTERİ GEÇMİŞİ</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-none px-1.5 h-4 text-[9px] font-black">{foundCustomerServiceCount}</Badge>
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        // Step-specific validation before advancing
                        if (currentStep === 1) {
                          const nameOk = (form.getValues("customerName") || "").trim().length >= 2;
                          const phoneOk = normalizePhoneNumber(form.getValues("customerPhone")).length === 10;
                          if (!nameOk || !phoneOk) {
                            if (!nameOk) form.setError("customerName", { message: "İsim soyisim gereklidir" });
                            if (!phoneOk) form.setError("customerPhone", { message: "Telefon numarası 10 haneli olmalıdır" });
                            toast({
                              title: "Zorunlu alanlar eksik",
                              description: "Müşteri adı ve telefon numarasını doldurun.",
                              variant: "destructive"
                            });
                            return;
                          }
                        }
                        if (currentStep === 2) {
                          const brandOk = (form.getValues("deviceBrand") || "").trim().length > 0;
                          const modelOk = (form.getValues("deviceModel") || "").trim().length > 0;
                          const problemOk = (form.getValues("problemDesc") || "").trim().length >= 3;
                          if (!brandOk || !modelOk || !problemOk) {
                            if (!brandOk) form.setError("deviceBrand", { message: "Marka gereklidir" });
                            if (!modelOk) form.setError("deviceModel", { message: "Model gereklidir" });
                            if (!problemOk) form.setError("problemDesc", { message: "Arıza açıklaması gereklidir" });
                            toast({
                              title: "Zorunlu alanlar eksik",
                              description: "Cihaz markası, modeli ve arıza açıklamasını doldurun.",
                              variant: "destructive"
                            });
                            return;
                          }
                        }
                        setCurrentStep(prev => Math.min(3, prev + 1));
                      }}
                      className="h-12 px-10 rounded-xl font-bold text-sm tracking-tight bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Sonraki Adım <Zap className="h-4 w-4 ml-2 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createServiceMutation.isPending}
                      onClick={(e) => {
                        if (!canSubmitService) {
                          e.preventDefault();
                          markRequiredFields();
                        }
                      }}
                      className={cn(
                        "h-12 px-12 rounded-xl font-black text-sm tracking-widest shadow-xl transition-all",
                        canSubmitService
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                      )}
                    >
                      {createServiceMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                      KAYDI TAMAMLA
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ──── RIGHT COLUMN: LIVE BENTO PREVIEW ─────────────────────────── */}
            <div className="lg:col-span-4 sticky top-10 space-y-6 lg:pb-32">
              <LiveTicketPreview technicians={technicians} />

              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-4 px-2 pt-2">
                {!isCustomerCreated && foundCustomer && (
                  <div className="bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-right-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-blue-500/50 uppercase">MÜŞTERİ GEÇMİŞİ</span>
                      <span className="text-xs font-black text-blue-500/80">{foundCustomerServiceCount} TOPLAM KAYIT</span>
                    </div>
                    <Badge className="bg-blue-500 text-white font-black text-[9px] px-2">{foundCustomer.loyaltyPoints || 0} PUAN</Badge>
                  </div>
                )}

                {/* Print Receipt Button — shown after successful creation */}
                {receiptTicket && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReceiptModal(true)}
                    className="h-14 rounded-2xl gap-3 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500 font-black text-xs tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-right-4"
                  >
                    <Printer className="h-5 w-5" />
                    SERVİS FİŞİ YAZDIR
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>

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

        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-[min(94vw,480px)] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0A0A0B] p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
              >
                {/* Background Accents */}
                <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

                <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-emerald-500/10 ring-1 ring-emerald-400/20">
                  <div className="absolute inset-2 rounded-[1.5rem] border border-dashed border-emerald-400/30 animate-spin [animation-duration:8s]" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                  >
                    <CheckCircle2 className="h-14 w-14 text-emerald-400" strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -right-2 -bottom-2 h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  >
                    <Wrench className="h-5 w-5" />
                  </motion.div>
                </div>

                <div className="relative space-y-4 mb-10">
                  <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5 fill-current" />
                    İşlem Başarılı
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Servis Kaydı Oluşturuldu</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    Cihaz sisteme kaydedildi. Şimdi müşteri ile iletişime geçebilir veya servis fişini yazdırabilirsiniz.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSuccessModal(false);
                        setShowReceiptModal(true);
                      }}
                      className="h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold gap-3 transition-all"
                    >
                      <Printer className="h-5 w-5 text-blue-400" />
                      Fiş Yazdır
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSuccessModal(false);
                        setShowWhatsAppModal(true);
                      }}
                      className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-3 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowSuccessModal(false);
                      handleReset();
                      router.push("/servis");
                    }}
                    className="h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold gap-2"
                  >
                    Servis Listesine Dön <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {createdTicketForWhatsApp && (
          <WhatsAppConfirmModal
            isOpen={showWhatsAppModal}
            onClose={() => {
              setShowWhatsAppModal(false);
              handleReset();
              router.push("/servis");
            }}
            phone={createdTicketForWhatsApp.customer?.phone || ""}
            customerName={createdTicketForWhatsApp.customer?.name}
            initialMessage={replacePlaceholders(WHATSAPP_TEMPLATES.NEW_SERVICE, {
              customer: createdTicketForWhatsApp.customer?.name || "",
              device: `${createdTicketForWhatsApp.deviceBrand} ${createdTicketForWhatsApp.deviceModel}`,
              ticket: createdTicketForWhatsApp.ticketNumber || ""
            })}
          />
        )}

        {/* Receipt Print Modal */}
        {receiptTicket && (
          <ServiceReceiptModal
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            ticket={receiptTicket}
          />
        )}

        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden rounded-[2.5rem] border-white/5 shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <History className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight text-white">{foundCustomer?.name}</DialogTitle>
                    <p className="text-sm font-medium text-slate-400">Geçmiş Servis İşlemleri ({foundCustomerServiceCount})</p>
                  </div>
                </div>
              </DialogHeader>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-2 divide-y divide-white/5">
              {foundCustomer?.tickets?.map((ticket: any) => (
                <div key={ticket.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all rounded-2xl group/item">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover/item:bg-blue-500/10 transition-colors">
                      <Wrench className="h-5 w-5 text-slate-400 group-hover/item:text-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-200 group-hover/item:text-white transition-colors">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-md italic">"{ticket.problemDesc}"</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white tabular-nums">₺{Number(ticket.estimatedCost || 0).toLocaleString('tr-TR')}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {ticket.createdAt ? format(new Date(ticket.createdAt), "d MMMM yyyy", { locale: tr }) : ""}
                    </p>
                  </div>
                </div>
              ))}
              {(!foundCustomer?.tickets || foundCustomer.tickets.length === 0) && (
                <div className="py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto">
                    <Clock className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium italic">Henüz bir servis kaydı bulunmuyor.</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-900/50 backdrop-blur-xl border-t border-white/5">
              <Button
                variant="ghost"
                className="w-full h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}






