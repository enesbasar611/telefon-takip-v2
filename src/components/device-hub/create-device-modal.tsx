"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, BadgeCheck, RotateCcw, Globe, X, Camera, FileText, Loader2, Upload, CheckCircle2, Search, Info, ShieldCheck, AlertCircle,
} from "lucide-react";
import { createDeviceEntry } from "@/lib/actions/device-hub-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { APPLE_COLORS, getColorHex } from "@/lib/device-utils";
import { cleanFormData } from "@/lib/formatters";

type Condition = "NEW" | "USED" | "INTERNATIONAL";

/* ─── Utility helpers ─── */
function formatCurrencyInput(val: string): string {
  const numeric = val.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("tr-TR").format(parseInt(numeric));
}

function parseCurrencyInput(val: string): string {
  return val.replace(/\D/g, "");
}

const POPULAR_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "Google",
  "OnePlus", "Oppo", "Realme",
];

const WARRANTY_MONTHS_OPTIONS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

/* ─── Zod schema ─── */
const deviceSchema = z.object({
  brand: z.string().min(1, "Marka gereklidir"),
  model: z.string().min(1, "Model gereklidir"),
  imei: z.string().length(15, "IMEI 15 haneli olmalıdır"),
  color: z.string().optional().or(z.literal("")),
  ram: z.string().optional().or(z.literal("")),
  storage: z.string().optional().or(z.literal("")),
  warrantyEndDate: z.string().optional().or(z.literal("")),
  warrantyMonths: z.string().optional().or(z.literal("")),
  sim1ExpirationDate: z.string().optional().or(z.literal("")),
  sim1NotUsed: z.boolean().default(false),
  sim2ExpirationDate: z.string().optional().or(z.literal("")),
  sim2NotUsed: z.boolean().default(false),
  batteryHealth: z.string().optional().or(z.literal("")),
  cosmeticScore: z.string().optional().or(z.literal("")),
  replacedParts: z.string().optional().or(z.literal("")),
  condition: z.enum(["NEW", "USED", "INTERNATIONAL"]),
  financeAccountId: z.string().min(1, "Ödeme hesabı seçilmelidir"),
  buyPrice: z
    .string()
    .min(1, "Alış fiyatı gereklidir")
    .transform((v) => parseCurrencyInput(v))
    .refine((v) => parseFloat(v) > 0, "Alış fiyatı 0'dan büyük olmalıdır"),
  sellPrice: z
    .string()
    .min(1, "Satış fiyatı gereklidir")
    .transform((v) => parseCurrencyInput(v))
    .refine((v) => parseFloat(v) > 0, "Satış fiyatı 0'dan büyük olmalıdır"),
  // Seller Info
  sellerName: z.string().optional().or(z.literal("")),
  sellerTC: z.string().optional().or(z.literal("")),
  sellerPhone: z.string().optional().or(z.literal("")),
  sellerIdPhotoUrl: z.string().optional().or(z.literal("")),
}).refine((data) => parseFloat(data.sellPrice) >= parseFloat(data.buyPrice), {
  message: "Satış fiyatı alış fiyatından düşük olamaz",
  path: ["sellPrice"],
});

interface DeviceFormValues {
  brand: string;
  model: string;
  imei: string;
  color?: string;
  ram?: string;
  storage?: string;
  warrantyEndDate?: string;
  warrantyMonths?: string;
  sim1ExpirationDate?: string;
  sim1NotUsed: boolean;
  sim2ExpirationDate?: string;
  sim2NotUsed: boolean;
  batteryHealth?: string;
  cosmeticScore?: string;
  replacedParts?: string;
  condition: Condition;
  financeAccountId: string;
  buyPrice: string;
  sellPrice: string;
  sellerName?: string;
  sellerTC?: string;
  sellerPhone?: string;
  sellerIdFrontUrl?: string;
  sellerIdBackUrl?: string;
}

/* ─── Component ─── */
export function CreateDeviceModal({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [sellerIdFront, setSellerIdFront] = useState<File | null>(null);
  const [sellerIdBack, setSellerIdBack] = useState<File | null>(null);
  const [warrantyMode, setWarrantyMode] = useState<"date" | "months" | "intl">("months");
  const [accounts, setAccounts] = useState<any[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const sellerIdFrontInputRef = useRef<HTMLInputElement>(null);
  const sellerIdBackInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema) as any,
    defaultValues: {
      condition: "NEW",
      brand: "",
      model: "",
      imei: "",
      buyPrice: "",
      sellPrice: "",
      cosmeticScore: "10",
      batteryHealth: "100",
      warrantyMonths: "24",
      sim1NotUsed: false,
      sim2NotUsed: false,
      financeAccountId: "",
    },
  });

  // Fetch accounts on mount or when open
  useEffect(() => {
    if (open) {
      getAccounts().then((res) => {
        setAccounts(res);
        // Set default primary account if available
        const primary = res.find((a: any) => a.isDefault) || res[0];
        if (primary) setValue("financeAccountId", primary.id);
      });
    }
  }, [open, setValue]);

  const condition = watch("condition");
  const buyPrice = watch("buyPrice");
  const selectedBrand = watch("brand");
  const sim1NotUsed = watch("sim1NotUsed");
  const sim2NotUsed = watch("sim2NotUsed");
  const selectedColor = watch("color");

  const isNew = condition === "NEW";
  const isIntl = condition === "INTERNATIONAL";

  // When condition changes to NEW → auto-set 24 months warranty
  useEffect(() => {
    if (condition === "NEW") {
      setWarrantyMode("months");
      setValue("warrantyMonths", "24");
    }
  }, [condition, setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles((prev) => [...prev, ...files].slice(0, 5));
  };
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceFile(e.target.files?.[0] ?? null);
  };
  const removePhoto = (idx: number) => setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async (data: DeviceFormValues) => {
    startTransition(async () => {
      try {
        const expertChecklist = data.replacedParts ? { notes: data.replacedParts } : {};

        let sellerIdFrontUrl = "";
        let sellerIdBackUrl = "";
        let uploadedPhotoUrls: string[] = [];

        if (photoFiles.length > 0) {
          const photoFormData = new FormData();
          photoFiles.forEach(f => photoFormData.append("files", f));
          const pRes = await fetch("/api/finance/upload", { method: "POST", body: photoFormData });
          const pJson = await pRes.json();
          if (pJson.success) {
            uploadedPhotoUrls = pJson.attachments.map((a: any) => a.url);
          }
        }

        if (sellerIdFront) {
          const formData = new FormData();
          formData.append("files", sellerIdFront);
          const res = await fetch("/api/finance/upload", { method: "POST", body: formData });
          const json = await res.json();
          sellerIdFrontUrl = json.attachments[0].url;
        }

        if (sellerIdBack) {
          const formData = new FormData();
          formData.append("files", sellerIdBack);
          const res = await fetch("/api/finance/upload", { method: "POST", body: formData });
          const json = await res.json();
          sellerIdBackUrl = json.attachments[0].url;
        }

        // Data Standardization (The Constitution)
        const cleaned = cleanFormData(data, {
          brand: "title",
          model: "title",
          color: "title",
          imei: "upper",
          sellerName: "proper",
          replacedParts: "sentence"
        });

        const result = await createDeviceEntry({
          brand: cleaned.brand,
          model: cleaned.model,
          imei: cleaned.imei,
          color: cleaned.color || undefined,
          ram: cleaned.ram || undefined,
          storage: cleaned.storage || undefined,
          condition: cleaned.condition,
          warrantyEndDate: warrantyMode === "date" && !isNew ? cleaned.warrantyEndDate || undefined : undefined,
          warrantyMonths: isNew ? "24" : (warrantyMode === "months" ? cleaned.warrantyMonths || undefined : undefined),
          sim1ExpirationDate: cleaned.sim1ExpirationDate || undefined,
          sim1NotUsed: cleaned.sim1NotUsed,
          sim2ExpirationDate: cleaned.sim2ExpirationDate || undefined,
          sim2NotUsed: cleaned.sim2NotUsed,
          batteryHealth: cleaned.batteryHealth ? parseInt(cleaned.batteryHealth) : undefined,
          cosmeticScore: parseInt(cleaned.cosmeticScore || "10"),
          expertChecklist: cleaned.replacedParts ? { notes: cleaned.replacedParts } : {},
          buyPrice: parseFloat(cleaned.buyPrice),
          sellPrice: parseFloat(cleaned.sellPrice),
          financeAccountId: cleaned.financeAccountId,
          sellerName: cleaned.sellerName || undefined,
          sellerTC: cleaned.sellerTC || undefined,
          sellerPhone: cleaned.sellerPhone || undefined,
          sellerIdPhotoUrl: sellerIdFrontUrl || undefined,
          photoUrls: uploadedPhotoUrls,
          invoiceUrl: null,
        });

        if (result.success) {
          toast.success("Cihaz başarıyla envantere eklendi.");
          setOpen(false);
          reset();
          setPhotoFiles([]);
          setInvoiceFile(null);
          setSellerIdFront(null);
          setSellerIdBack(null);
          setWarrantyMode("months");
        } else {
          toast.error(result.error ?? "İşlem başarısız.");
        }
      } catch (err) {
        toast.error("Bir hata oluştu.");
      }
    });
  };

  /* ─── Subcomponent: Condition Card ─── */
  const ConditionCard = ({
    type, icon: Icon, title, desc, color,
  }: { type: Condition; icon: any; title: string; desc: string; color: string }) => {
    const active = condition === type;
    const colorMap: Record<string, string> = {
      emerald: active ? "border-emerald-500 bg-emerald-500/5" : "border-border bg-card hover:border-emerald-500/40",
      amber: active ? "border-amber-500 bg-amber-500/5" : "border-border bg-card hover:border-amber-500/40",
      purple: active ? "border-purple-500 bg-purple-500/5" : "border-border bg-card hover:border-purple-500/40",
    };
    const iconBg: Record<string, string> = {
      emerald: active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/80",
      amber: active ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground/80",
      purple: active ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground/80",
    };
    const dotBg: Record<string, string> = {
      emerald: "bg-emerald-500", amber: "bg-amber-500", purple: "bg-purple-500",
    };
    return (
      <button
        type="button"
        onClick={() => setValue("condition", type)}
        className={`flex items-start gap-3 p-4 rounded-2xl transition-all border-2 text-left relative overflow-hidden ${colorMap[color]}`}
      >
        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${iconBg[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h4 className={`text-[14px]  leading-tight ${active ? "text-white" : "text-muted-foreground/80"}`}>{title}</h4>
          <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5 leading-snug">{desc}</p>
        </div>
        {active && <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${dotBg[color]}`} />}
      </button>
    );
  };

  const inputCls = "bg-background border-border rounded-xl h-11 text-[13px] font-medium dark:text-white placeholder:text-slate-600";
  const labelCls = "text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-0.5";
  const sectionCls = "p-5 rounded-2xl bg-card border border-border/60 space-y-4";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2  h-10 px-6 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4" /> Cihaz Ekle
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[820px] max-w-full w-full h-full sm:h-auto sm:max-h-[95vh] p-0 bg-[#0B0F19] text-foreground/90 border border-border/60 shadow-2xl rounded-none sm:rounded-2xl overflow-y-auto">
        {/* Header */}
        <div className="px-7 pt-6 pb-4 flex justify-between items-start border-b border-border/60">
          <div>
            <DialogTitle className="font-medium text-[21px]  text-white leading-tight">Yeni Cihaz Kaydı</DialogTitle>
            <p className="text-[12px] text-muted-foreground/80 font-medium mt-0.5">Kategori otomatik atanır · Sıfır / 2. El / Yurtdışı</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">

            {/* Condition Selection */}
            <div className="space-y-3">
              <Label className={labelCls}>Cihaz Kondisyonu</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ConditionCard type="NEW" icon={BadgeCheck} title="Sıfır" desc="Distribütör garantili" color="emerald" />
                <ConditionCard type="USED" icon={RotateCcw} title="2. El" desc="Kullanılmış, ekspertizli" color="amber" />
                <ConditionCard type="INTERNATIONAL" icon={Globe} title="Yurdışı" desc="Kısıtlı ithal cihaz" color="purple" />
              </div>
            </div>

            {/* Temel Bilgiler */}
            <div className={sectionCls}>
              <p className={labelCls}>Cihaz Bilgileri</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand Dropdown */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Marka</Label>
                  <Select onValueChange={(v) => setValue("brand", v)}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Marka Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {POPULAR_BRANDS.map((b) => (
                        <SelectItem key={b} value={b} className="">{b}</SelectItem>
                      ))}
                      <SelectItem value="Diğer" className=" text-muted-foreground">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.brand && <p className="text-[10px] text-rose-500">{errors.brand.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Tam Model Adı</Label>
                  <Input {...register("model")} placeholder="iPhone 15 Pro Max" className={inputCls} />
                  {errors.model && <p className="text-[10px] text-rose-500">{errors.model.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>IMEI (15 Hane)</Label>
                  <Input {...register("imei")} maxLength={15} placeholder="352000000000000" className={`${inputCls} font-mono tracking-widest`} />
                  {errors.imei && <p className="text-[10px] text-rose-500">{errors.imei.message}</p>}
                </div>


                <div className="col-span-2 space-y-1.5">
                  <Label className={labelCls}>Renk Seçimi</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        {...register("color")}
                        placeholder="Örn: Yeşil, Beyaz, Mavi"
                        className={`${inputCls} pr-10`}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[0-9]/g, '');
                          setValue("color", val);
                        }}
                      />
                      {getColorHex(selectedBrand, selectedColor) && (
                        <div
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all animate-in fade-in zoom-in duration-300"
                          style={{ backgroundColor: getColorHex(selectedBrand, selectedColor) ?? undefined }}
                        />
                      )}
                    </div>
                    {selectedBrand?.toLowerCase() === "apple" && (
                      <div className="flex flex-wrap gap-2.5 p-3 bg-background/50 rounded-2xl border border-border">
                        {APPLE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setValue("color", c.name)}
                            className={`group relative flex flex-col items-center gap-1.5 transition-all outline-none`}
                          >
                            <div
                              className={`h-8 w-8 rounded-full border-2 transition-all shadow-lg ${selectedColor?.toLowerCase() === c.name.toLowerCase() ? "border-blue-500 scale-110 shadow-blue-500/30" : "border-border hover:border-slate-600 scale-100 shadow-black/40"}`}
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className={`text-[8px]  uppercase tracking-tighter transition-colors ${selectedColor?.toLowerCase() === c.name.toLowerCase() ? "text-blue-400" : "text-muted-foreground/80 group-hover:text-foreground"}`}>
                              {c.name.split(" ")[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedColor && <p className="text-[10px]  text-blue-400/80 mt-1 pl-1 capitalize">Seçilen Renk: {selectedColor}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>RAM</Label>
                  <Select onValueChange={(v) => setValue("ram", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Örn: 8 GB" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"].map((v) => (
                        <SelectItem key={v} value={v} className="">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Dahili Depolama</Label>
                  <Select onValueChange={(v) => setValue("storage", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Örn: 256 GB" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"].map((v) => (
                        <SelectItem key={v} value={v} className="">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Garanti / Aktiflik */}
            <div className={sectionCls}>
              <p className={labelCls}>{isIntl ? "IMEI Aktiflik Durumu" : "Garanti Takibi"}</p>

              {!isIntl && (
                <>
                  <div className="flex items-center bg-background rounded-xl p-1 border border-border w-fit gap-1">
                    <button type="button" onClick={() => setWarrantyMode("months")}
                      className={`px-4 py-1.5 text-xs  rounded-lg transition-all ${warrantyMode === "months" ? "bg-slate-700 text-white" : "text-muted-foreground/80 hover:text-white"}`}>
                      Ay Seç
                    </button>
                    <button
                      type="button"
                      disabled={isNew}
                      onClick={() => setWarrantyMode("date")}
                      className={`px-4 py-1.5 text-xs  rounded-lg transition-all ${isNew ? "opacity-30 cursor-not-allowed" : ""} ${warrantyMode === "date" ? "bg-slate-700 text-white" : "text-muted-foreground/80 hover:text-white"}`}>
                      Tarih Gir
                    </button>
                  </div>

                  {warrantyMode === "months" || isNew ? (
                    <div className="space-y-1.5">
                      <Label className={labelCls}>
                        {isNew ? "Garanti Süresi (24 Ay)" : "Kalan Garanti Süresi"}
                      </Label>
                      <Select
                        defaultValue={isNew ? "24" : undefined}
                        onValueChange={(v) => setValue("warrantyMonths", v)}
                        disabled={isNew}
                      >
                        <SelectTrigger className={inputCls}>
                          <SelectValue placeholder={isNew ? "24 Ay (Sabit)" : "Kaç ay kaldı?"} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {WARRANTY_MONTHS_OPTIONS.map((m) => (
                            <SelectItem key={m} value={String(m)} className="">
                              {m} Ay {isNew && m === 24 ? "✓ (Sabit)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isNew && (
                        <p className="text-[10px] text-emerald-400 font-medium pl-0.5 animate-pulse">
                          ✨ Sıfır cihazlarda 24 ay garanti otomatik atanmıştır. Satış yapıldığında takibe başlar.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Garanti Bitiş Tarihi</Label>
                      <Input {...register("warrantyEndDate")} type="date" className={inputCls} />
                    </div>
                  )}
                </>
              )}

              {isIntl && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <Label className={labelCls}>Sim 1 Bitiş Tarihi</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sim1NotUsed"
                          checked={sim1NotUsed}
                          onCheckedChange={(checked) => setValue("sim1NotUsed", checked === true)}
                        />
                        <Label htmlFor="sim1NotUsed" className="font-medium text-[10px]  text-muted-foreground/80 cursor-pointer">Kullanılmadı</Label>
                      </div>
                    </div>
                    <Input {...register("sim1ExpirationDate")} type="date" className={inputCls} disabled={sim1NotUsed} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <Label className={labelCls}>Sim 2 / E-Sim Bitiş Tarihi</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sim2NotUsed"
                          checked={sim2NotUsed}
                          onCheckedChange={(checked) => setValue("sim2NotUsed", checked === true)}
                        />
                        <Label htmlFor="sim2NotUsed" className="font-medium text-[10px]  text-muted-foreground/80 cursor-pointer">Kullanılmadı</Label>
                      </div>
                    </div>
                    <Input
                      {...register("sim2ExpirationDate")}
                      type="date"
                      className={inputCls}
                      disabled={sim2NotUsed}
                    />
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] text-purple-300 font-medium ">
                    💡 Yurtdışı cihazlarda her SIM için yıllık 120 gün kullanım hakkı verilir. BTK'dan kalan süreleri öğrenip manuel tarih olarak giriniz.
                  </div>
                </div>
              )}
            </div>

            {/* Ekspertiz */}
            <div className={`${sectionCls} transition-opacity ${isNew ? "opacity-40 pointer-events-none" : ""}`}>
              <p className={labelCls}>Ekspertiz &amp; Kondisyon</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Pil Sağlığı</Label>
                  <div className="relative">
                    <Input {...register("batteryHealth")} type="number" min={1} max={100} placeholder="100" className={inputCls} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]  text-muted-foreground/80">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Kozmetik Durum</Label>
                  <Select onValueChange={(v) => setValue("cosmeticScore", v)} defaultValue="10">
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent className="bg-card border-border ">
                      <SelectItem value="10">Kusursuz (10/10)</SelectItem>
                      <SelectItem value="9">Çok İyi (9/10)</SelectItem>
                      <SelectItem value="8">İyi – Ufak Çizikler (8/10)</SelectItem>
                      <SelectItem value="7">Orta – Görünür Hasar (7/10)</SelectItem>
                      <SelectItem value="6">Kötü Kozmetik (6/10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className={labelCls}>Değiştirilen / Onarılan Parçalar</Label>
                  <Textarea {...register("replacedParts")} placeholder="Örn: Ön cam, batarya değişimi" className="bg-background border-border rounded-xl min-h-[70px] text-[13px] font-medium placeholder:text-slate-600 resize-none p-3" />
                </div>
              </div>
            </div>

            {/* Seller Info (Müşteri Bilgileri) - NEW Section */}
            <div className={`${sectionCls} border-emerald-500/20 bg-emerald-500/5`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-5 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Plus className="h-3 w-3 text-emerald-400" />
                </div>
                <p className="text-[10px]  text-emerald-400 uppercase tracking-widest italic">Satıcı (Müşteri) Bilgileri - Opsiyonel</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Ad Soyad</Label>
                  <Input {...register("sellerName")} placeholder="Örn: Enes Başar" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>TC Kimlik No</Label>
                  <Input {...register("sellerTC")} maxLength={11} placeholder="11 Haneli" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Telefon</Label>
                  <Input {...register("sellerPhone")} placeholder="05xx..." className={inputCls} />
                </div>
                <div className="col-span-3 space-y-3">
                  <Label className={labelCls}>Kimlik Fotoğrafları (Ön & Arka)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <input ref={sellerIdFrontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setSellerIdFront(e.target.files?.[0] ?? null)} />
                    <input ref={sellerIdBackInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setSellerIdBack(e.target.files?.[0] ?? null)} />

                    <button
                      type="button"
                      onClick={() => sellerIdFrontInputRef.current?.click()}
                      className={`h-14 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${sellerIdFront ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-background border-border text-muted-foreground/80 hover:text-foreground"}`}
                    >
                      {sellerIdFront ? <CheckCircle2 className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                      <span className="text-[9px]  uppercase tracking-tight">{sellerIdFront ? "ÖN YÜZ TAMAM ✅" : "ÖN YÜZ ÇEK"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sellerIdBackInputRef.current?.click()}
                      className={`h-14 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${sellerIdBack ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-background border-border text-muted-foreground/80 hover:text-foreground"}`}
                    >
                      {sellerIdBack ? <CheckCircle2 className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                      <span className="text-[9px]  uppercase tracking-tight">{sellerIdBack ? "ARKA YÜZ TAMAM ✅" : "ARKA YÜZ ÇEK"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fiyat & Ödeme Hesabı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-blue-900/10 border border-blue-500/20">
              <div className="col-span-2 space-y-1.5 pb-2">
                <Label className="font-medium text-[9px]  text-blue-400 uppercase tracking-widest pl-0.5">Ödeme Hesabı (Alış Fiyatı Bu Hesaptan Düşülecek)</Label>
                <Select
                  value={watch("financeAccountId")}
                  onValueChange={(v) => setValue("financeAccountId", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="bg-background border-border h-11 text-[13px] ">
                    <SelectValue placeholder="Ödeme Hesabı Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id} className="">
                        {acc.name} - <span className="text-blue-400">{acc.balance.toLocaleString("tr-TR")} ₺</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.financeAccountId && <p className="text-[10px] text-rose-500  mt-1">{errors.financeAccountId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[9px]  text-blue-400 uppercase tracking-widest pl-0.5">Alış Fiyatı *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]  text-blue-500">₺</span>
                  <Input
                    {...register("buyPrice")}
                    placeholder="0"
                    className="bg-background border-border rounded-xl h-11 text-[15px]  pl-8 dark:text-white"
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setValue("buyPrice", formatted, { shouldValidate: true });
                    }}
                  />
                </div>
                {errors.buyPrice && <p className="text-[10px] text-rose-500  mt-1">{errors.buyPrice.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-[9px]  text-emerald-400 uppercase tracking-widest pl-0.5">Satış Fiyatı * (≥ Alış)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]  text-emerald-500">₺</span>
                  <Input
                    {...register("sellPrice")}
                    placeholder="0"
                    className="bg-background border-border rounded-xl h-11 text-[15px]  pl-8 text-emerald-400"
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setValue("sellPrice", formatted, { shouldValidate: true });
                    }}
                  />
                </div>
                {errors.sellPrice && <p className="text-[10px] text-rose-500  mt-1">{errors.sellPrice.message}</p>}
              </div>
            </div>

            {/* Dosya Yükleme */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelCls}>Cihaz Fotoğrafları (maks 5)</Label>
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border/80 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 bg-card/50 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground/80" />
                  <span className="text-[11px]  text-muted-foreground/80">Fotoğraf Seç</span>
                </button>
                {photoFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photoFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px]  text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {f.name.slice(0, 12)}...
                        <button type="button" onClick={() => removePhoto(i)} className="ml-1 text-muted-foreground/80 hover:text-rose-400"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Fatura / PDF Belgesi</Label>
                <input ref={invoiceInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleInvoiceChange} />
                <button type="button" onClick={() => invoiceInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border/80 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 bg-card/50 transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground/80" />
                  <span className="text-[11px]  text-muted-foreground/80">Fatura Seç</span>
                </button>
                {invoiceFile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-[11px]  text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {invoiceFile.name.slice(0, 20)}
                    <button type="button" onClick={() => setInvoiceFile(null)} className="ml-auto text-muted-foreground/80 hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-border/60 bg-[#0B0F19] flex sm:flex-row flex-col gap-4 justify-between items-center sm:sticky bottom-0 z-50">
            <p className="text-[11px] text-slate-600 font-medium sm:text-left text-center">
              Otomatik kategori:{" "}
              <span className="text-muted-foreground ">
                Telefonlar &gt; {condition === "NEW" ? "Sıfır" : condition === "USED" ? "2. El" : "Yurtdışı"}
              </span>
            </p>
            <Button type="submit" disabled={isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white  text-[13px] h-12 w-full sm:w-auto sm:h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Kaydı Tamamla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}





