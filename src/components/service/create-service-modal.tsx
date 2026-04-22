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
import { PlusCircle, Loader2, User, AlertCircle, Banknote, Sparkles, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";
import { PriceInput } from "@/components/ui/price-input";
import { formatCurrency } from "@/lib/utils";
import { findCustomerByPhone } from "@/lib/actions/customer-lookup-actions";
import { ServiceReceiptModal } from "./service-receipt-modal";
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
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState<number[]>([]);
  const { toast } = useToast();
  const router = useRouter();

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
  const deviceModel = watch("deviceModel");

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
        toast({ title: "Başarılı", description: `${getIndustryLabel(shop, "serviceTicket")} kaydı başarıyla oluşturuldu.` });
        setCreatedTicket(result.data);
        setShowReceipt(true);
        setOpen(false);
        reset({
          estimatedCost: "0",
          customerEmail: "",
          accessories: [],
        });
        setDiagnosticResult(null);
        router.refresh();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              <div className="space-y-2">
                <Label htmlFor="customerName" className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Müşteri Ad Soyad <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="customerName" {...register("customerName", { required: "Müşteri adı gereklidir" })} placeholder="Ali Yılmaz" className="h-12 md:h-14 bg-muted/30 border-border/60 rounded-xl md:rounded-2xl pl-12 text-sm text-foreground focus:ring-2 focus:ring-primary/20" />
                </div>
                {errors.customerName && <p className="text-[10px] text-red-500 ml-1">{errors.customerName.message as string}</p>}
              </div>
              <PhoneInput
                label="TELEFON NUMARASI"
                required
                value={phoneValue}
                isLookingUp={isLookingUp}
                error={errors.customerPhone?.message as string}
                onChange={(val: string) => {
                  setPhoneValue(val);
                  setValue("customerPhone", val);
                }}
              />
            </div>

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
          </div>

          <div className="p-5 md:p-8 bg-card/50 border-t border-border/50">
            <DialogFooter className="flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl text-muted-foreground uppercase text-[11px] font-bold tracking-widest">Kapat</Button>
              <Button type="submit" disabled={isPending} className="flex-[2] h-12 md:h-14 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold rounded-xl md:rounded-2xl gap-3 transition-all active:scale-95 uppercase tracking-widest">
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                Kaydı Tamamla
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>

      {createdTicket && (
        <ServiceReceiptModal isOpen={showReceipt} onClose={() => { setShowReceipt(false); setCreatedTicket(null); }} ticket={createdTicket} />
      )}

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
  );
}
