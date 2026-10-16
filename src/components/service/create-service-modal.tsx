"use client";

import { useState, useTransition, ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Loader2,
  User,
  AlertCircle,
  Sparkles,
  Wrench,
  Lock,
  Smartphone,
  MonitorSmartphone,
  Tag,
  Cpu,
  Trash,
  CheckCircle2,
  Grid,
  Zap,
  Printer,
  FileText,
  X,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";
import { PriceInput } from "@/components/ui/price-input";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ServiceTicketLabelPrintArea,
  buildServiceTicketLabelData,
  type ServiceTicketLabelData
} from "@/components/service/service-ticket-label-print";
import { ServiceReceiptModal } from "@/components/service/service-receipt-modal";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { FormFactory } from "@/components/common/form-factory";
import { getIndustryLabel, getServiceFormFields, extractCoreAndAttributes, getIndustryAccessories } from "@/lib/industry-utils";
import { PatternLock } from "@/components/ui/pattern-lock";

interface CreateServiceModalProps {
  trigger?: ReactNode;
  shop?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateServiceModal({
  trigger,
  shop,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CreateServiceModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [isDiagnosticPending, setIsDiagnosticPending] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [isLookingUpName, setIsLookingUpName] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isCopiedTicketNo, setIsCopiedTicketNo] = useState(false);
  const [serviceLabel, setServiceLabel] = useState<ServiceTicketLabelData | null>(null);
  const [showMissingRequired, setShowMissingRequired] = useState(false);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState<number[]>([]);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const industryFields = getServiceFormFields(shop);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<any>({
    defaultValues: {
      estimatedCost: "0",
      customerEmail: "",
    }
  });

  const problemDesc = watch("problemDesc");
  const customerName = watch("customerName");
  const deviceBrand = watch("deviceBrand");
  const deviceModel = watch("deviceModel");
  const estimatedCost = watch("estimatedCost");

  const phoneDigits = phoneValue.replace(/\D/g, "");
  const estimatedCostValue = Number(String(estimatedCost ?? "0").replace(",", "."));
  const missingRequiredFields = [
    { key: "customerName", label: "Ad soyad", missing: !String(customerName ?? "").trim() },
    { key: "customerPhone", label: "Telefon numarası", missing: phoneDigits.length < 10 },
    { key: "deviceBrand", label: getIndustryLabel(shop, "brandLabel"), missing: !String(deviceBrand ?? "").trim() },
    { key: "deviceModel", label: getIndustryLabel(shop, "modelLabel"), missing: !String(deviceModel ?? "").trim() },
    { key: "problemDesc", label: getIndustryLabel(shop, "problemDesc"), missing: !isSimpleMode && !String(problemDesc ?? "").trim() },
    { key: "estimatedCost", label: "Tutar", missing: !Number.isFinite(estimatedCostValue) || estimatedCostValue <= 0 },
  ].filter((field) => field.missing);
  const canCompleteService = missingRequiredFields.length === 0;

  const handleAIDiagnosis = async () => {
    if (!problemDesc) {
      toast({ title: "Hata", description: "Lütfen önce bir arıza açıklaması girin.", variant: "destructive" });
      return;
    }
    setIsDiagnosticPending(true);
    try {
      const { parseServiceDiagnosticWithAI } = await import("@/lib/actions/gemini-actions");
      const result = await parseServiceDiagnosticWithAI(problemDesc, deviceModel, shop?.industry);
      if (result.success) {
        setDiagnosticResult(result.data);
        setValue("estimatedCost", String(result.data.estimatedTotalPrice));
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

  const onSubmit = async (data: any) => {
    if (!canCompleteService) {
      setShowMissingRequired(true);
      return;
    }

    startTransition(async () => {
      try {
        // Form verilerini çekirdek DB alanlarına ve dinamik özelliklere ayır
        const { deviceBrand, deviceModel, imei, attributes } = extractCoreAndAttributes(industryFields, data);

        const result = await createServiceTicket({
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          deviceBrand: deviceBrand || "GENEL",
          deviceModel: deviceModel || "HIZLI İŞLEM",
          imei,
          problemDesc: isSimpleMode && !data.problemDesc ? "Hızlı Servis İşlemi" : data.problemDesc,
          estimatedCost: Number(data.estimatedCost),
          devicePassword: data.devicePassword,
          attributes,
        });

        if (result?.success) {
          const ticket = result.data;
          setCreatedTicketInfo(ticket);
          setShowSuccessModal(true);
          setOpen(false);
          reset({
            estimatedCost: "0",
            customerEmail: "",
            accessories: [],
          });
          setDiagnosticResult(null);
          setShowMissingRequired(false);
          setFoundCustomer(null);
          setPhoneValue("");
          router.refresh();
        } else {
          toast({
            title: "Hata",
            description: result?.error || "Kayıt oluşturulurken bir hata oluştu.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error("Modal Submit error:", error);
        toast({
          title: "Hata",
          description: "Kayıt sırasında bir hata oluştu.",
          variant: "destructive"
        });
      }
    });
  };

  // Telefon girildiğinde müşteriyi otomatik ara
  useEffect(() => {
    const checkPhone = async () => {
      const sanitized = phoneValue.replace(/\D/g, "");
      if (sanitized.length === 10) {
        setIsLookingUp(true);
        try {
          const customer = await findCustomerByPhone(sanitized);
          if (customer) {
            setFoundCustomer(customer);
            setValue("customerName", customer.name);
            if (customer.email) setValue("customerEmail", customer.email);
            toast({ title: "Müşteri Bulundu", description: `${customer.name} bilgileri otomatik dolduruldu.`, duration: 3000 });
          }
        } catch (e) {
          console.error("Lookup error:", e);
        } finally {
          setIsLookingUp(false);
        }
      }
    };
    const t = setTimeout(checkPhone, 500);
    return () => clearTimeout(t);
  }, [phoneValue, setValue, toast]);

  const watchName = watch("customerName");
  const foundCustomerServiceCount = foundCustomer?._count?.tickets ?? foundCustomer?.tickets?.length ?? 0;

  useEffect(() => {
    const lookupByName = async () => {
      if (!watchName || watchName.trim().length < 2) {
        setNameSuggestions([]);
        setShowNameSuggestions(false);
        return;
      }
      if (foundCustomer && watchName === foundCustomer.name) return;
      setIsLookingUpName(true);
      try {
        const results = await findCustomerByName(watchName);
        setNameSuggestions(results);
        setShowNameSuggestions(results.length > 0);
      } finally {
        setIsLookingUpName(false);
      }
    };
    const t = setTimeout(lookupByName, 350);
    return () => clearTimeout(t);
  }, [watchName, foundCustomer]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setShowMissingRequired(false);
        }}
      >
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            {trigger || (
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Yeni {getIndustryLabel(shop, "serviceTicket")} Kaydı</span>
              </Button>
            )}
          </DialogTrigger>
        )}

        <DialogContent className="w-full md:max-w-[700px] h-full md:h-auto md:max-h-[90vh] bg-background border-border/50 p-0 overflow-hidden md:rounded-[2.5rem] shadow-2xl flex flex-col">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            <div className="p-5 md:p-8 bg-card/50 border-b border-border/50">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-medium text-xl md:text-2xl">{isSimpleMode ? "Hızlı İşlem Kaydı" : getIndustryLabel(shop, "serviceTicket") + " Kaydı"}</DialogTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsSimpleMode(!isSimpleMode)}
                    className={cn(
                      "h-8 rounded-full gap-2 text-[10px] font-black tracking-widest uppercase transition-all px-4",
                      isSimpleMode ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-primary/5 text-muted-foreground border border-border/50"
                    )}
                  >
                    <Zap className={cn("h-3 w-3", isSimpleMode ? "text-amber-500" : "text-muted-foreground")} />
                    {isSimpleMode ? "Basit Mod Aktif" : "Basit Mod"}
                  </Button>
                </div>
                <DialogDescription className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {isSimpleMode ? "Hızlı işlemler için temel bilgileri girin." : "Kayıt oluşturmak için bilgileri eksiksiz doldurun."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-5 md:p-8 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
              {/* Müşteri Bilgileri - Daima yan yana */}
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-2 relative">
                  <Label htmlFor="customerName" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Müşteri Ad Soyad <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerName"
                      {...register("customerName", { required: "Müşteri adı gereklidir" })}
                      placeholder="Enes Başar"
                      autoComplete="off"
                      onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                      className="h-12 md:h-14 bg-muted/30 border-border/60 rounded-xl md:rounded-2xl pl-12 text-sm text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                    {isLookingUpName && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[100] bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-1">
                      {nameSuggestions.map((c) => {
                        const serviceCount = c?._count?.tickets ?? c?.tickets?.length ?? 0;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => {
                              setFoundCustomer(c);
                              setValue("customerName", c.name, { shouldValidate: true });
                              setValue("customerPhone", c.phone ?? "", { shouldValidate: true });
                              setPhoneValue(c.phone ?? "");
                              setShowNameSuggestions(false);
                              toast({ title: "Müşteri Seçildi", description: `${c.name} için ${serviceCount} geçmiş servis kaydı bulundu.` });
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-between gap-4"
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">{serviceCount} servis</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.customerName && <p className="text-[10px] text-red-500 ml-1">{errors.customerName.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <PhoneInput
                    label="TELEFON NUMARASI"
                    required
                    value={phoneValue}
                    isLookingUp={isLookingUp}
                    error={errors.customerPhone?.message as string}
                    onChange={(val: string) => {
                      setPhoneValue(val);
                      setValue("customerPhone", val, { shouldValidate: true });
                    }}
                  />
                </div>
              </div>

              {foundCustomer && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Geçmiş Analizi</span>
                  </div>
                  <span className="text-xs font-bold text-blue-500">{foundCustomerServiceCount} servis kaydı</span>
                </div>
              )}

              {/* Dinamik Sektörel Alanlar — basit modda gizli */}
              {!isSimpleMode && (
                <FormFactory
                  fields={industryFields}
                  register={register}
                  control={control}
                  errors={errors}
                  twoCol={true}
                  onPatternClick={() => setIsPatternModalOpen(true)}
                />
              )}

              {/* Arıza Açıklaması — basit modda sadeleştirilmiş */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="problemDesc" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">
                    {getIndustryLabel(shop, "problemDesc").toUpperCase()} {!isSimpleMode && <span className="text-red-500">*</span>}
                  </Label>
                  {!isSimpleMode && (
                    <Button type="button" size="sm" variant="outline"
                      className="h-8 rounded-full bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 gap-2 text-[10px] font-bold"
                      onClick={handleAIDiagnosis} disabled={isDiagnosticPending}
                    >
                      {isDiagnosticPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      BAŞAR AI ANALİZ
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="problemDesc" {...register("problemDesc", { required: !isSimpleMode ? "Arıza açıklaması gereklidir" : false })}
                    placeholder={isSimpleMode ? "İşlem özeti (İsteğe bağlı)..." : "Arıza detaylarını buraya yazın..."} className="h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl pl-12 text-sm" />
                </div>
                {errors.problemDesc && <p className="text-[10px] text-red-500 ml-1">{errors.problemDesc.message as string}</p>}
              </div>

              {/* Alınan Aksesuarlar / Parçalar — basit modda gizli */}
              {!isSimpleMode && (
                <div className="space-y-3">
                  <Label className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Aksesuar / Emanet Parçalar</Label>
                  <div className="flex flex-wrap gap-2">
                    {getIndustryAccessories(shop).map((item) => (
                      <Label key={item} className="font-medium inline-flex items-center gap-2 cursor-pointer bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 rounded-xl px-4 py-2.5 transition-all">
                        <Checkbox
                          className="rounded-sm border-muted-foreground/40 h-4 w-4"
                          onCheckedChange={(checked) => {
                            const current = watch("accessories") || [];
                            if (checked) setValue("accessories", [...current, item]);
                            else setValue("accessories", current.filter((i: string) => i !== item));
                          }}
                        />
                        <span className="text-[13px] font-medium whitespace-nowrap">{item}</span>
                      </Label>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Teşhis Sonucu */}
              {diagnosticResult && (
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold">BAŞAR AI Sektörel Analiz</span>
                    <div className="ml-auto px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-bold">Risk: {diagnosticResult.riskLevel}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-blue-600/70 uppercase">Olası Sebepler</span>
                      <ul className="text-[11px] text-blue-900 list-disc list-inside">
                        {diagnosticResult.possibleCauses?.slice(0, 2).map((c: string, i: number) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-blue-600/70 uppercase">Önerilen Malzemeler</span>
                      <div className="flex flex-wrap gap-1">
                        {diagnosticResult.suggestedParts?.map((p: any, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded-md bg-white border border-blue-100 text-[10px] text-blue-800">{p.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-100/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-blue-600/70 uppercase">TAHMİNİ SÜRE</span>
                      <span className="text-xs font-bold text-blue-900">{diagnosticResult.repairTimeRange}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-medium text-blue-600/70 uppercase">PROJE BEDELİ</span>
                      <span className="text-lg font-black text-emerald-600 tabular-nums">{formatCurrency(diagnosticResult.estimatedTotalPrice)}</span>
                    </div>
                  </div>
                  {diagnosticResult.summaryReport && (
                    <div className="pt-3 border-t border-blue-100/30">
                      <span className="text-[10px] font-bold text-blue-100 dark:text-blue-400 uppercase block mb-1">🔍 BAŞAR AI SEKTÖREL ANALİZ RAPORU</span>
                      <p className="text-[11px] text-blue-900/80 dark:text-blue-100/80 leading-relaxed italic">"{diagnosticResult.summaryReport}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Basit Mod: Marka ve Model */}
              {isSimpleMode && (
                <div className="grid grid-cols-2 gap-3 md:gap-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="deviceBrandSimple" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">
                      {getIndustryLabel(shop, "brandLabel").toUpperCase()}
                    </Label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deviceBrandSimple"
                        {...register("deviceBrand")}
                        placeholder={getIndustryLabel(shop, "brandLabel") + "..."}
                        className="h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl pl-12 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deviceModelSimple" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">
                      {getIndustryLabel(shop, "modelLabel").toUpperCase()}
                    </Label>
                    <div className="relative">
                      <MonitorSmartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deviceModelSimple"
                        {...register("deviceModel")}
                        placeholder={getIndustryLabel(shop, "modelLabel") + "..."}
                        className="h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl pl-12 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Basit Mod: Cihaz Şifresi */}
              {isSimpleMode && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="devicePassword" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Cihaz Şifresi</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-sm bg-muted/40 border-border/50 gap-2 text-[9px] font-bold"
                      onClick={() => setIsPatternModalOpen(true)}
                    >
                      <Grid className="h-3 w-3" />
                      DESEN ÇİZ
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="devicePassword"
                      {...register("devicePassword")}
                      placeholder="Şifre veya Pin..."
                      className="h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl pl-12 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Tahmini Maliyet */}
              <div className="space-y-2">
                <Label className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Tahmini Ücret</Label>
                <PriceInput
                  id="estimatedCost"
                  value={watch("estimatedCost")}
                  onChange={(v) => setValue("estimatedCost", String(v), { shouldValidate: true })}
                  placeholder="0,00"
                  className="h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl pl-10 text-sm transition-all tabular-nums text-emerald-500 font-bold"
                />
              </div>

              {showMissingRequired && !canCompleteService && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm dark:border-amber-400/25 dark:bg-amber-400/10">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">Kaydi tamamlamak icin gerekli alanlar</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingRequiredFields.map((field) => (
                      <span key={field.key} className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[10px] font-black text-slate-700 shadow-sm dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 md:p-8 bg-card/50 border-t border-border/50">
              <DialogFooter className="flex-row gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl text-muted-foreground uppercase text-[11px] font-bold tracking-widest">Kapat</Button>
                <Button
                  type={canCompleteService ? "submit" : "button"}
                  disabled={isPending}
                  onClick={() => {
                    if (!canCompleteService) setShowMissingRequired(true);
                  }}
                  className="flex-[2] h-12 md:h-14 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold rounded-xl md:rounded-2xl gap-3 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-70"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (canCompleteService ? <PlusCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />)}
                  {canCompleteService ? "Kaydı Tamamla" : "Zorunlu Alanları Doldur"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>

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
                    setValue("devicePassword", "DESEN:" + tempPattern.join(","), { shouldDirty: true });
                    setIsPatternModalOpen(false);
                  }
                }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                  <CheckCircle2 className="w-4 h-4" /> Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Dialog>

      <ServiceTicketLabelPrintArea
        label={serviceLabel}
        onPrinted={() => setServiceLabel(null)}
      />

      <ServiceReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        ticket={createdTicketInfo}
      />

      {showSuccessModal && createdTicketInfo && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-emerald-500/30 bg-slate-950/95 p-6 md:p-8 text-center shadow-[0_30px_90px_rgba(16,185,129,0.25)] animate-in zoom-in-95 duration-200">
            {/* Ambient Top Glow */}
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            {/* Close Button top-right */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
              }}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Success Icon */}
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/25">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-in zoom-in duration-300" strokeWidth={2.4} />
            </div>

            {/* Header info */}
            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Hızlı Kayıt Başarılı
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {createdTicketInfo.ticketNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (createdTicketInfo?.ticketNumber) {
                      navigator.clipboard.writeText(createdTicketInfo.ticketNumber);
                      setIsCopiedTicketNo(true);
                      toast({ title: "Kopyalandı", description: `${createdTicketInfo.ticketNumber} panoya kopyalandı.` });
                      setTimeout(() => setIsCopiedTicketNo(false), 2000);
                    }
                  }}
                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Numarayı Kopyala"
                >
                  {isCopiedTicketNo ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-xs font-medium text-slate-300">
                {createdTicketInfo.customer?.name || createdTicketInfo.customerName}
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 mb-5 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 font-medium">Cihaz:</span>
                <span className="font-semibold text-white">
                  {createdTicketInfo.deviceBrand} {createdTicketInfo.deviceModel}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 font-medium">Telefon:</span>
                <span className="font-medium text-slate-200">
                  {createdTicketInfo.customer?.phone || createdTicketInfo.customerPhone || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1.5 border-t border-white/5">
                <span className="text-slate-400 font-medium">Tahmini Tutar:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatCurrency(createdTicketInfo.estimatedCost || 0)} ₺
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setServiceLabel(buildServiceTicketLabelData(createdTicketInfo, shop));
                    toast({ title: "Barkod Etiketi", description: "Yazdırma penceresi hazırlanıyor..." });
                  }}
                  className="h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 font-semibold text-xs gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Tag className="h-4 w-4" />
                  Barkod Etiketi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowReceiptModal(true);
                  }}
                  className="h-11 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300 font-semibold text-xs gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <FileText className="h-4 w-4" />
                  Servis Fişi
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setOpen(true);
                  }}
                  className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 font-semibold text-xs gap-2 transition-all active:scale-95"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-400" />
                  Yeni Kayıt
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                >
                  Tamam
                </Button>
              </div>
            </div>

            {/* Subtle link to ticket list if on another page */}
            {pathname !== "/servis" && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/servis");
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  <span>Servis listesine git</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Auto-close Progress Bar (5 seconds) */}
            <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 animate-[progress_5s_linear_forwards]"
                onAnimationEnd={() => setShowSuccessModal(false)}
              />
            </div>
          </div>
          <style jsx>{`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
