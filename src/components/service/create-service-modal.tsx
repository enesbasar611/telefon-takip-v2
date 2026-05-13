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
import { PlusCircle, Loader2, User, AlertCircle, Sparkles, Wrench } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";
import { PriceInput } from "@/components/ui/price-input";
import { formatCurrency } from "@/lib/utils";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { FormFactory } from "@/components/common/form-factory";
import { getIndustryLabel, getServiceFormFields, extractCoreAndAttributes, getIndustryAccessories } from "@/lib/industry-utils";
import { PatternLock } from "@/components/ui/pattern-lock";
import { Trash, CheckCircle2, Grid } from "lucide-react";

interface CreateServiceModalProps {
  trigger?: ReactNode;
  shop?: any;
}

export function CreateServiceModal({ trigger, shop }: CreateServiceModalProps) {
  const [open, setOpen] = useState(false);
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
  const [showMissingRequired, setShowMissingRequired] = useState(false);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState<number[]>([]);
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
    { key: "problemDesc", label: getIndustryLabel(shop, "problemDesc"), missing: !String(problemDesc ?? "").trim() },
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
      // Split form data into core DB fields and dynamic attributes
      const { deviceBrand, deviceModel, imei, attributes } = extractCoreAndAttributes(industryFields, data);

      const result = await createServiceTicket({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        deviceBrand,
        deviceModel,
        imei,
        problemDesc: data.problemDesc,
        estimatedCost: Number(data.estimatedCost),
        devicePassword: data.devicePassword,
        attributes,
      });

      if (result.success) {
        setShowSuccessModal(true);
        setOpen(false);
        reset({
          estimatedCost: "0",
          customerEmail: "",
          accessories: [],
        });
        setDiagnosticResult(null);
      } else {
        toast({ title: "Hata", description: result.error || "Kayıt oluşturulurken bir hata oluştu.", variant: "destructive" });
      }
    });
  };

  // Auto-lookup customer when phone is entered
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
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Yeni {getIndustryLabel(shop, "serviceTicket")} Kaydı</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-full md:max-w-[700px] h-full md:h-auto md:max-h-[90vh] bg-background border-border/50 p-0 overflow-hidden md:rounded-[2.5rem] shadow-2xl flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
          <div className="p-5 md:p-8 bg-card/50 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="font-medium text-xl md:text-2xl">{getIndustryLabel(shop, "serviceTicket")} Kaydı</DialogTitle>
              <DialogDescription className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Kayıt oluşturmak için bilgileri eksiksiz doldurun.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-5 md:p-8 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

            {/* Dynamic Industry Fields — from FormFactory */}
            <FormFactory
              fields={industryFields}
              register={register}
              control={control}
              errors={errors}
              twoCol={true}
              onPatternClick={() => setIsPatternModalOpen(true)}
            />

            {/* Problem Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="problemDesc" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">
                  {getIndustryLabel(shop, "problemDesc").toUpperCase()} <span className="text-red-500">*</span>
                </Label>
                <Button type="button" size="sm" variant="outline"
                  className="h-8 rounded-full bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 gap-2 text-[10px] font-bold"
                  onClick={handleAIDiagnosis} disabled={isDiagnosticPending}
                >
                  {isDiagnosticPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  BAŞAR AI ANALİZ
                </Button>
              </div>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="problemDesc" {...register("problemDesc", { required: "Arıza açıklaması gereklidir" })}
                  placeholder="Arıza detaylarını buraya yazın..." className="h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl pl-12 text-sm" />
              </div>
              {errors.problemDesc && <p className="text-[10px] text-red-500 ml-1">{errors.problemDesc.message as string}</p>}
            </div>

            {/* Accessories / Parts Received */}
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

            {/* AI Diagnostic Result */}
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

            {/* Estimated Cost */}
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
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em]">Kaydi tamamlamak icin gerekli alanlar</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingRequiredFields.map((field) => (
                    <span key={field.key} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-bold text-amber-100">
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

      {showSuccessModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-[min(92vw,420px)] overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-slate-950/95 p-8 text-center shadow-[0_30px_90px_rgba(16,185,129,0.28)]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/25">
              <div className="absolute inset-2 rounded-full border border-dashed border-emerald-300/40 animate-spin [animation-duration:2s]" />
              <div className="absolute -right-1 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-bounce">
                <Wrench className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <CheckCircle2 className="h-12 w-12 text-emerald-300 animate-in zoom-in duration-500" strokeWidth={2.4} />
            </div>
            <div className="relative space-y-3">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Servis Kaydı Hazır
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Kayıt tamamlandı</h2>
              <p className="text-sm font-medium text-slate-300">Servis kaydı işlendi.</p>
            </div>
            <div className="relative mt-7 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-300 animate-[progress_2s_ease-out_forwards]"
                onAnimationEnd={() => {
                  setShowSuccessModal(false);
                  setShowMissingRequired(false);
                  setFoundCustomer(null);
                  setPhoneValue("");
                  setDiagnosticResult(null);
                  if (pathname === "/servis") {
                    router.refresh();
                  } else {
                    router.push("/servis");
                  }
                }}
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
