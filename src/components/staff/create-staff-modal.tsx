"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { Role } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Camera, X, Shield, MapPin, UserPlus, Image as ImageIcon, Settings2, Edit2 } from "lucide-react";
import { createStaff, updateStaff, getRoleTemplates } from "@/lib/actions/staff-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { getDefaultStaffPermissions, STAFF_PERMISSION_FIELDS } from "@/lib/staff-permissions";
import { getExchangeRate } from "@/lib/currency-utils";

const staffSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(0),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "TECHNICIAN", "STAFF", "COURIER"]),
  branch: z.string().min(1, "Şube seçiniz"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string(),
  customImage: z.string(),
  // commissionRate removed
  baseSalary: z.number().min(0),
  salaryCurrency: z.string().min(1),
  serviceCommissionAmount: z.number().min(0),
  canSell: z.boolean(),
  canService: z.boolean(),
  canStock: z.boolean(),
  canFinance: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface CreateStaffModalProps {
  onSuccess?: () => void;
  staff?: any;
}

export function CreateStaffModal({ onSuccess, staff }: CreateStaffModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [roleTemplates, setRoleTemplates] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(35.0);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: staff ? {
      ...staff,
      password: "", // Don't show password for edit
      // commissionRate removed
      baseSalary: Number(staff.baseSalary || 0),
      serviceCommissionAmount: Number(staff.serviceCommissionAmount || 0),
      salaryCurrency: staff.salaryCurrency || "TRY",
      phone: staff.phone || "",
      customImage: staff.customImage || "",
    } : {
      name: "",
      surname: "",
      email: "",
      password: "",
      role: "STAFF",
      branch: "Ana Şube",
      gender: "MALE",
      phone: "",
      customImage: "",
      // commissionRate removed
      baseSalary: 0,
      serviceCommissionAmount: 0,
      salaryCurrency: "TRY",
      ...getDefaultStaffPermissions("STAFF"),
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    getExchangeRate().then(setExchangeRate);
    getRoleTemplates().then(setRoleTemplates);
    if (staff) {
      reset({
        ...staff,
        password: "",
        // commissionRate removed
        baseSalary: Number(staff.baseSalary || 0),
        serviceCommissionAmount: Number(staff.serviceCommissionAmount || 0),
        salaryCurrency: staff.salaryCurrency || "TRY",
        phone: staff.phone || "",
        customImage: staff.customImage || "",
      });
    }
  }, [isOpen, staff, reset]);

  const applyRolePermissions = (role: StaffFormValues["role"]) => {
    const template = roleTemplates.find((t) => t.role === role) || getDefaultStaffPermissions(role);
    setValue("role", role);
    STAFF_PERMISSION_FIELDS.forEach((field) => {
      // Check if permission is prohibited for this role
      const isProhibited = field.prohibitedRoles?.includes(role);
      setValue(field.key as any, isProhibited ? false : template[field.key]);
    });
  };

  const onSubmit = async (data: StaffFormValues) => {
    startTransition(async () => {
      const result = staff
        ? await updateStaff(staff.id, data)
        : await createStaff(data as any);

      if (result.success) {
        toast({
          title: staff ? "Personel güncellendi" : "Personel eklendi",
          description: "İşlem başarıyla tamamlandı.",
        });
        setIsOpen(false);
        reset();
        onSuccess?.();
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {staff ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
            <UserPlus className="h-4 w-4" />
            <span>Personel Ekle</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-none shadow-2xl rounded-3xl h-[85vh] sm:h-auto flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

        <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-slate-50/50 dark:bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
              {staff ? <Settings2 className="h-5 w-5 text-emerald-600" /> : <UserPlus className="h-5 w-5 text-emerald-600" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {staff ? "Personel Düzenle" : "Yeni Personel Tanımla"}
              </DialogTitle>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-medium mt-0.5">
                PERSONEL VE YETKİLENDİRME SİSTEMİ
              </p>
            </div>
          </div>
          {/* REMOVED EXTRA CLOSE BUTTON */}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-6 space-y-8">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50/50 dark:bg-muted/10 border border-slate-100 dark:border-white/5">
              <div className="space-y-1.5">
                <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">AD</Label>
                <Input {...register("name")} className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs" />
                {errors.name && <p className="text-[10px] text-red-500 ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">SOYAD</Label>
                <Input {...register("surname")} className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs" />
                {errors.surname && <p className="text-[10px] text-red-500 ml-1">{errors.surname.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">ROL</Label>
                <Select onValueChange={(val: any) => applyRolePermissions(val)} defaultValue={watch("role")}>
                  <SelectTrigger className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs">
                    <SelectValue placeholder="Rol Seçin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="ADMIN">Yönetici</SelectItem>
                    <SelectItem value="MANAGER">Müdür</SelectItem>
                    <SelectItem value="TECHNICIAN">Teknisyen</SelectItem>
                    <SelectItem value="CASHIER">Kasiyer</SelectItem>
                    <SelectItem value="COURIER">Kurye</SelectItem>
                    <SelectItem value="STAFF">Personel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">E-POSTA</Label>
                <Input {...register("email")} type="email" className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs" />
                {errors.email && <p className="text-[10px] text-red-500 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">TELEFON</Label>
                <PhoneInput value={watch("phone") || ""} onChange={(v) => setValue("phone", v)} className="h-11 border-none bg-white dark:bg-muted/50" />
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">ŞİFRE</Label>
                <Input {...register("password")} type="password" placeholder={staff ? "Değiştirmek istemiyorsanız boş bırakın" : "*******"} className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs" />
              </div>

              {/* Removed Commission Rate Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">SABİT MAAŞ</Label>
                  {watch("baseSalary") > 0 && exchangeRate > 0 && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {watch("salaryCurrency") === "TRY"
                        ? `(${(watch("baseSalary") / exchangeRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`
                        : `(${(watch("baseSalary") * exchangeRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL)`}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      key={watch("salaryCurrency")} // Fix: Re-mount to handle placeholder/formatting shifts if needed
                      defaultValue={watch("baseSalary") > 0 ? (watch("baseSalary") % 1 === 0 ? watch("baseSalary").toString() : watch("baseSalary").toFixed(2).replace(".", ",")) : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,.]/g, "");
                        // Intelligent parsing: replaces comma with dot if it's the decimal separator
                        const numericValue = val.includes(",") && !val.includes(".")
                          ? parseFloat(val.replace(",", "."))
                          : parseFloat(val.replace(/,/g, ""));

                        if (!isNaN(numericValue)) {
                          setValue("baseSalary", numericValue);
                        } else if (val === "") {
                          setValue("baseSalary", 0);
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value.replace(",", "."));
                        if (!isNaN(val)) {
                          e.target.value = val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                      }}
                      placeholder="0,00"
                      className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs pr-10 font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="text-[10px] font-black text-slate-300">
                        {watch("salaryCurrency") === "TRY" ? "₺" : "$"}
                      </span>
                    </div>
                  </div>
                  <Select
                    value={watch("salaryCurrency")}
                    onValueChange={(v) => setValue("salaryCurrency", v)}
                  >
                    <SelectTrigger className="w-20 h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="TRY">₺ TL</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {watch("baseSalary") > 0 && (
                  <p className="text-[9px] text-emerald-600/70 font-medium ml-1">
                    Kesin Değer: <span className="font-bold underline">{watch("baseSalary").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {watch("salaryCurrency") === "TRY" ? "₺" : "$"}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest ml-1">SERVİS BAŞI PRİM</Label>
                  <span className="text-[8px] text-slate-400 font-bold uppercase italic">SABİT TUTAR</span>
                </div>
                <Input
                  {...register("serviceCommissionAmount", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="h-11 bg-white dark:bg-muted/50 border-none rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Yetkiler */}
            <div className="space-y-4">
              <Label className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4" /> YETKİLENDİRME MODÜLLERİ
              </Label>
              <TooltipProvider>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {STAFF_PERMISSION_FIELDS.map((field) => {
                    const isAllowed = !field.prohibitedRoles?.includes(watch("role"));
                    const isChecked = watch(field.key as any);

                    return (
                      <Tooltip key={field.key} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => isAllowed && setValue(field.key as any, !isChecked)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-2xl text-left transition-all border-2",
                              isChecked && isAllowed
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm hover:bg-emerald-500/20"
                                : "bg-slate-50 dark:bg-muted/10 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5",
                              !isAllowed && "opacity-50 cursor-not-allowed grayscale"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all",
                              isChecked && isAllowed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-700"
                            )}>
                              {isChecked && isAllowed && <X className="h-3 w-3 text-white rotate-45" />}
                              {!isAllowed && <Shield className="h-2.5 w-2.5 text-slate-400" />}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{field.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none rounded-xl p-3 shadow-2xl max-w-[200px]">
                          <p className="text-[10px] leading-relaxed">
                            {!isAllowed
                              ? <span className="text-red-400 block mb-1 font-bold">⚠️ BU ROL İÇİN YETKİ VERİLEMEZ</span>
                              : null
                            }
                            {field.description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 dark:bg-muted/20 border-t border-slate-100 dark:border-white/5 flex gap-3">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]">İptal</Button>
            </DialogClose>
            <Button disabled={isPending} type="submit" className="flex-[2] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (staff ? "Güncelle" : "Personel Oluştur")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
