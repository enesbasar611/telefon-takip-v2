"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef } from "react";
import {
  PenLine, BadgeCheck, RotateCcw, Globe, X, Save, Loader2,
  Camera, Upload, FileText, CheckCircle2, Plus, Trash2, Paperclip
} from "lucide-react";
import { updateDeviceEntry } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { APPLE_COLORS, getColorHex } from "@/lib/device-utils";
import { cleanFormData } from "@/lib/formatters";

type Condition = "NEW" | "USED" | "INTERNATIONAL";

function formatCurrencyInput(val: string): string {
  const numeric = val.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("tr-TR").format(parseInt(numeric));
}

function parseCurrencyInput(val: string): string {
  return val.replace(/\D/g, "");
}

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
  buyPrice: z.string().min(1, "Alış fiyatı gereklidir").transform(v => parseCurrencyInput(v)),
  sellPrice: z.string().min(1, "Satış fiyatı gereklidir").transform(v => parseCurrencyInput(v)),
  sellerName: z.string().optional().or(z.literal("")),
  sellerTC: z.string().optional().or(z.literal("")),
  sellerPhone: z.string().optional().or(z.literal("")),
});

interface UpdateDeviceModalProps {
  device: any;
}

export function UpdateDeviceModal({ device }: UpdateDeviceModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [warrantyMode, setWarrantyMode] = useState<"date" | "months">("months");
  const router = useRouter();

  // File States
  const [existingPhotos, setExistingPhotos] = useState<string[]>(device.deviceInfo?.photoUrls || []);
  const [existingSellerIdPhoto, setExistingSellerIdPhoto] = useState<string | null>(device.deviceInfo?.sellerIdPhotoUrl || null);
  const [existingInvoice, setExistingInvoice] = useState<string | null>(device.deviceInfo?.invoiceUrl || null);

  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newSellerId, setNewSellerId] = useState<File | null>(null);
  const [newInvoice, setNewInvoice] = useState<File | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const sellerIdInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      brand: device.brand || device.name.split(" ")[0] || "",
      model: device.name.split(" ").slice(1).join(" ") || "",
      imei: device.deviceInfo?.imei || "",
      color: device.deviceInfo?.color || "",
      ram: device.deviceInfo?.ram || "",
      storage: device.deviceInfo?.storage || "",
      condition: device.deviceInfo?.condition || "USED",
      buyPrice: formatCurrencyInput(device.buyPrice.toString()),
      sellPrice: formatCurrencyInput(device.sellPrice.toString()),
      batteryHealth: device.deviceInfo?.batteryHealth?.toString() || "",
      cosmeticScore: device.deviceInfo?.cosmeticScore?.toString() || "10",
      replacedParts: device.deviceInfo?.expertChecklist?.notes || "",
      sellerName: device.deviceInfo?.sellerName || "",
      sellerTC: device.deviceInfo?.sellerTC || "",
      sellerPhone: device.deviceInfo?.sellerPhone || "",
      sim1NotUsed: device.deviceInfo?.sim1NotUsed || false,
      sim2NotUsed: device.deviceInfo?.sim2NotUsed || false,
      warrantyMonths: "24",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        brand: device.brand || device.name.split(" ")[0] || "",
        model: device.name.split(" ").slice(1).join(" ") || "",
        imei: device.deviceInfo?.imei || "",
        color: device.deviceInfo?.color || "",
        ram: device.deviceInfo?.ram || "",
        storage: device.deviceInfo?.storage || "",
        condition: device.deviceInfo?.condition || "USED",
        buyPrice: formatCurrencyInput(device.buyPrice.toString()),
        sellPrice: formatCurrencyInput(device.sellPrice.toString()),
        batteryHealth: device.deviceInfo?.batteryHealth?.toString() || "",
        cosmeticScore: device.deviceInfo?.cosmeticScore?.toString() || "10",
        replacedParts: device.deviceInfo?.expertChecklist?.notes || "",
        sellerName: device.deviceInfo?.sellerName || "",
        sellerTC: device.deviceInfo?.sellerTC || "",
        sellerPhone: device.deviceInfo?.sellerPhone || "",
        sim1NotUsed: device.deviceInfo?.sim1NotUsed || false,
        sim2NotUsed: device.deviceInfo?.sim2NotUsed || false,
        warrantyMonths: "24",
      });
      setExistingPhotos(device.deviceInfo?.photoUrls || []);
      setExistingSellerIdPhoto(device.deviceInfo?.sellerIdPhotoUrl || null);
      setExistingInvoice(device.deviceInfo?.invoiceUrl || null);
    }
  }, [open, device, reset]);

  const condition = watch("condition");
  const selectedBrand = watch("brand");
  const selectedColor = watch("color");
  const isNew = condition === "NEW";
  const isIntl = condition === "INTERNATIONAL";

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/finance/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      try {
        // Upload new files
        const newlyUploadedPhotos = [];
        for (const f of newPhotos) {
          const url = await uploadFile(f);
          newlyUploadedPhotos.push(url);
        }

        let finalSellerId = existingSellerIdPhoto;
        if (newSellerId) {
          finalSellerId = await uploadFile(newSellerId);
        }

        let finalInvoice = existingInvoice;
        if (newInvoice) {
          finalInvoice = await uploadFile(newInvoice);
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

        const result = await updateDeviceEntry(device.id, {
          ...cleaned,
          brand: cleaned.brand,
          model: cleaned.model,
          imei: cleaned.imei,
          expertChecklist: cleaned.replacedParts ? { notes: cleaned.replacedParts } : {},
          photoUrls: [...existingPhotos, ...newlyUploadedPhotos],
          sellerIdPhotoUrl: finalSellerId,
          invoiceUrl: finalInvoice,
        });

        if (result.success) {
          toast.success("Cihaz güncellendi.");
          router.refresh();
          setOpen(false);
          setNewPhotos([]);
          setNewSellerId(null);
          setNewInvoice(null);
        } else {
          toast.error(result.error || "Hata oluştu.");
        }
      } catch (err) {
        toast.error("Dosyalar yüklenirken hata oluştu.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400 transition-all border border-blue-500/20 hover:border-blue-500/40"
          title="Düzenle"
        >
          <PenLine className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0B0F19] border-border text-foreground/90 custom-scrollbar p-0 rounded-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-border/60 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <PenLine className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="font-medium text-2xl  text-white">Cihazı Düzenle</DialogTitle>
                <p className="text-sm text-muted-foreground/80 font-medium">{device.name} detaylarını güncelleyin.</p>
              </div>
            </div>
            <div className="flex bg-background p-1.5 rounded-2xl border border-border/50 shadow-inner">
              {(["NEW", "USED", "INTERNATIONAL"] as Condition[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("condition", c)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px]  tracking-widest transition-all duration-300 ${condition === c ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-muted-foreground/80 hover:text-foreground"}`}
                >
                  {c === "NEW" && <BadgeCheck className="h-3.5 w-3.5" />}
                  {c === "USED" && <RotateCcw className="h-3.5 w-3.5" />}
                  {c === "INTERNATIONAL" && <Globe className="h-3.5 w-3.5" />}
                  {c === "NEW" ? "SIFIR" : c === "USED" ? "2. EL" : "YURTDIŞI"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em] pl-1">Temel Bilgiler</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Marka</Label>
                    <Select value={selectedBrand} onValueChange={(val) => setValue("brand", val)}>
                      <SelectTrigger className="h-12 bg-card border-border rounded-xl focus:ring-blue-500 ">
                        <SelectValue placeholder="Marka Seç" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Realme", "Google"].map(b => (
                          <SelectItem key={b} value={b} className="">{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Model</Label>
                    <Input {...register("model")} className="h-12 bg-card border-border rounded-xl " />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-[11px]  text-muted-foreground ml-1">IMEI Numarası (15 Hane)</Label>
                  <Input {...register("imei")} maxLength={15} className="h-12 bg-card border-border rounded-xl font-mono text-sm tracking-widest " />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em] pl-1">Donanım & Görünüm</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Hafıza (GB)</Label>
                    <Input {...register("storage")} placeholder="128GB" className="h-12 bg-card border-border rounded-xl " />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">RAM</Label>
                    <Input {...register("ram")} placeholder="8GB" className="h-12 bg-card border-border rounded-xl " />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="font-medium text-[11px]  text-muted-foreground ml-1 uppercase tracking-tighter">Renk Seçimi</Label>
                  <div className="relative">
                    <Input
                      {...register("color")}
                      placeholder="Renk giriniz..."
                      className="h-12 bg-card border-border rounded-xl  uppercase pr-10"
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
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {APPLE_COLORS.slice(0, 12).map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setValue("color", c.name)}
                          className={`h-9 rounded-lg border-2 transition-all flex items-center justify-center ${selectedColor === c.name ? "border-blue-500 scale-105 shadow-md shadow-blue-500/20" : "border-transparent hover:border-border/80"}`}
                          title={c.name}
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor === c.name && <div className="h-2 w-2 rounded-full bg-white shadow-sm" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em] pl-1">Fiyatlandırma</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Alış Fiyatı (₺)</Label>
                    <Input
                      {...register("buyPrice")}
                      onChange={(e) => setValue("buyPrice", formatCurrencyInput(e.target.value))}
                      className="h-12 bg-card border-border rounded-xl  text-[16px] text-rose-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Satış Fiyatı (₺)</Label>
                    <Input
                      {...register("sellPrice")}
                      onChange={(e) => setValue("sellPrice", formatCurrencyInput(e.target.value))}
                      className="h-12 bg-card border-border rounded-xl  text-[16px] text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em] pl-1">{isIntl ? "IMEI Aktiflik Durumu" : "Garanti Takibi"}</h4>
                {!isIntl && (
                  <div className="space-y-4">
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
                        <Label className="font-medium text-[11px]  text-muted-foreground ml-1">
                          {isNew ? "Garanti Süresi (24 Ay)" : "Kalan Garanti Süresi"}
                        </Label>
                        <Select
                          defaultValue={isNew ? "24" : undefined}
                          onValueChange={(v) => setValue("warrantyMonths", v)}
                          disabled={isNew}
                        >
                          <SelectTrigger className="h-12 bg-card border-border rounded-xl ">
                            <SelectValue placeholder={isNew ? "24 Ay (Sabit)" : "Kaç ay kaldı?"} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {[24, 18, 12, 6, 3, 0].map((m) => (
                              <SelectItem key={m} value={String(m)} className="">
                                {m} Ay {isNew && m === 24 ? "✓" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Garanti Bitiş Tarihi</Label>
                        <Input type="date" {...register("warrantyEndDate")} className="h-12 bg-card border-border rounded-xl " />
                      </div>
                    )}
                  </div>
                )}

                {isIntl && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium text-[11px]  text-muted-foreground ml-1">SIM 1 Kapanış Tarihi</Label>
                      <Input type="date" {...register("sim1ExpirationDate")} className="h-12 bg-card border-border rounded-xl " />
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <Checkbox id="sim1NotUsed" checked={watch("sim1NotUsed")} onCheckedChange={(v) => setValue("sim1NotUsed", !!v)} />
                        <Label htmlFor="sim1NotUsed" className="font-medium text-[10px]  text-muted-foreground/80">Kullanılmadı</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-[11px]  text-muted-foreground ml-1">SIM 2 Kapanış Tarihi</Label>
                      <Input type="date" {...register("sim2ExpirationDate")} className="h-12 bg-card border-border rounded-xl " />
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <Checkbox id="sim2NotUsed" checked={watch("sim2NotUsed")} onCheckedChange={(v) => setValue("sim2NotUsed", !!v)} />
                        <Label htmlFor="sim2NotUsed" className="font-medium text-[10px]  text-muted-foreground/80">Kullanılmadı</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em] pl-1">Sağlık & Ekspertiz</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Pil Sağlığı (%)</Label>
                    <Input {...register("batteryHealth")} type="number" placeholder="100" className="h-12 bg-card border-border rounded-xl " />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Kozmetik Puanı / 10</Label>
                    <Select value={watch("cosmeticScore")} onValueChange={(val) => setValue("cosmeticScore", val)}>
                      <SelectTrigger className="h-12 bg-card border-border rounded-xl ">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {[10, 9, 8, 7, 6, 5].map(s => (
                          <SelectItem key={s} value={s.toString()} className="">{s} / 10</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Değişen Parçalar / Notlar</Label>
                  <Textarea {...register("replacedParts")} className="bg-card border-border rounded-xl font-medium min-h-[100px]" placeholder="Örn: Ekran değişti, Orijinal parça takıldı..." />
                </div>
              </div>
            </div>
          </div>

          {/* Yeni Eklenen Alanlar: Satıcı Bilgileri ve Belge Yönetimi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/20 mt-4">
            {/* Satıcı (Müşteri) Bilgileri */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Plus className="h-3 w-3 text-emerald-400" />
                </div>
                <h4 className="font-medium text-[10px]  text-emerald-400 uppercase tracking-widest pl-1">Satıcı (Müşteri) Bilgileri</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 border border-emerald-500/10 p-5 rounded-2xl bg-emerald-500/5">
                <div className="space-y-2">
                  <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Ad Soyad</Label>
                  <Input {...register("sellerName")} className="h-11 bg-card border-border rounded-xl " placeholder="Müşteri Adı" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-[11px]  text-muted-foreground ml-1">TC Kimlik No</Label>
                  <Input {...register("sellerTC")} maxLength={11} className="h-11 bg-card border-border rounded-xl " placeholder="11 Haneli" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="font-medium text-[11px]  text-muted-foreground ml-1">Telefon</Label>
                  <Input {...register("sellerPhone")} className="h-11 bg-card border-border rounded-xl  font-mono" placeholder="05xx..." />
                </div>
              </div>
            </div>

            {/* Dosya & Belge Yönetimi */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Upload className="h-3 w-3 text-blue-400" />
                </div>
                <h4 className="font-medium text-[10px]  text-blue-400 uppercase tracking-widest pl-1">Belge & Dosya Yönetimi</h4>
              </div>

              <div className="space-y-4 border border-blue-500/10 p-5 rounded-2xl bg-blue-500/5">
                {/* Mevcut Dosyalar */}
                {(existingPhotos.length > 0 || existingSellerIdPhoto || existingInvoice) && (
                  <div className="space-y-3">
                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest ml-1">YÜKLÜ DOSYALAR (SİLMEK İÇİN TIKLAYIN)</Label>
                    <div className="flex flex-wrap gap-2">
                      {existingPhotos.map((url, i) => (
                        <div key={i} className="group relative h-14 w-14 rounded-xl border border-border/80 overflow-hidden shadow-lg">
                          <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <button type="button" onClick={() => setExistingPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="h-4 w-4 text-white" /></button>
                        </div>
                      ))}
                      {existingSellerIdPhoto && (
                        <div className="group relative h-14 w-14 rounded-xl border border-blue-500/30 overflow-hidden shadow-lg flex items-center justify-center bg-card">
                          {existingSellerIdPhoto.toLowerCase().includes('.pdf') ? <FileText className="h-6 w-6 text-blue-500" /> : <img src={existingSellerIdPhoto} className="w-full h-full object-cover" />}
                          <div className="absolute top-0 right-0 p-0.5 bg-blue-600 text-[7px]  text-white px-1">TC</div>
                          <button type="button" onClick={() => setExistingSellerIdPhoto(null)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="h-4 w-4 text-white" /></button>
                        </div>
                      )}
                      {existingInvoice && (
                        <div className="group relative h-14 w-14 rounded-xl border border-purple-500/30 overflow-hidden shadow-lg flex items-center justify-center bg-card">
                          {existingInvoice.toLowerCase().includes('.pdf') ? <FileText className="h-6 w-6 text-red-500" /> : <img src={existingInvoice} className="w-full h-full object-cover" />}
                          <div className="absolute top-0 right-0 p-0.5 bg-purple-600 text-[7px]  text-white px-1">FATURA</div>
                          <button type="button" onClick={() => setExistingInvoice(null)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="h-4 w-4 text-white" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Yeni Dosya Ekleme */}
                <div className="grid grid-cols-3 gap-2">
                  <input ref={photoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => setNewPhotos(prev => [...prev, ...Array.from(e.target.files || [])])} />
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="h-14 border border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center gap-0.5 hover:border-blue-500/40 hover:bg-card transition-all text-muted-foreground/80 hover:text-blue-400">
                    <Camera className="h-4 w-4" />
                    <span className="text-[8px]  uppercase">Fotoğraf</span>
                  </button>
                  <input ref={sellerIdInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setNewSellerId(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => sellerIdInputRef.current?.click()} className={`h-14 border border-dashed rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${newSellerId ? "bg-blue-600/20 border-blue-600 text-blue-400" : "border-border/80 text-muted-foreground/80"}`}>
                    {newSellerId ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    <span className="text-[8px]  uppercase">Kimlik</span>
                  </button>
                  <input ref={invoiceInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setNewInvoice(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => invoiceInputRef.current?.click()} className={`h-14 border border-dashed rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${newInvoice ? "bg-purple-600/20 border-purple-600 text-purple-400" : "border-border/80 text-muted-foreground/80"}`}>
                    {newInvoice ? <CheckCircle2 className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                    <span className="text-[8px]  uppercase">Fatura</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 rounded-xl ">İptal</Button>
            <Button disabled={isPending} type="submit" className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white  shadow-lg shadow-blue-600/20 gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              DEĞİŞİKLİKLERİ KAYDET
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}






