"use client";

import { useState, useTransition, useEffect } from "react";
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
  PenLine, BadgeCheck, RotateCcw, Globe, X, Save, Loader2,
} from "lucide-react";
import { updateDeviceEntry } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { APPLE_COLORS, getColorHex } from "@/lib/device-utils";

type Condition = "NEW" | "USED" | "INTERNATIONAL";

function toTitleCase(str: string): string {
  if (!str) return str;
  return str.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

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

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      brand: device.brand || "",
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

  const condition = watch("condition");
  const selectedBrand = watch("brand");
  const selectedColor = watch("color");
  const isNew = condition === "NEW";
  const isIntl = condition === "INTERNATIONAL";

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      const result = await updateDeviceEntry(device.id, {
        ...data,
        brand: toTitleCase(data.brand),
        model: toTitleCase(data.model),
        expertChecklist: data.replacedParts ? { notes: data.replacedParts } : {},
      });

      if (result.success) {
        toast.success("Cihaz güncellendi.");
        setOpen(false);
      } else {
        toast.error(result.error || "Hata oluştu.");
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0B0F19] border-slate-800 text-slate-200 custom-scrollbar p-0 rounded-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <PenLine className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-white">Cihazı Düzenle</DialogTitle>
                <p className="text-sm text-slate-500 font-medium">{device.name} detaylarını güncelleyin.</p>
              </div>
            </div>
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/50 shadow-inner">
              {(["NEW", "USED", "INTERNATIONAL"] as Condition[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("condition", c)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${condition === c ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-slate-500 hover:text-slate-300"}`}
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
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Temel Bilgiler</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Marka</Label>
                    <Select value={selectedBrand} onValueChange={(val) => setValue("brand", val)}>
                      <SelectTrigger className="h-12 bg-slate-900 border-slate-800 rounded-xl focus:ring-blue-500 font-bold">
                        <SelectValue placeholder="Marka Seç" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Realme", "Google"].map(b => (
                          <SelectItem key={b} value={b} className="font-bold">{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Model</Label>
                    <Input {...register("model")} className="h-12 bg-slate-900 border-slate-800 rounded-xl font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 ml-1">IMEI Numarası (15 Hane)</Label>
                  <Input {...register("imei")} maxLength={15} className="h-12 bg-slate-900 border-slate-800 rounded-xl font-mono text-sm tracking-widest font-black" />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Donanım & Görünüm</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Hafıza (GB)</Label>
                    <Input {...register("storage")} placeholder="128GB" className="h-12 bg-slate-900 border-slate-800 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">RAM</Label>
                    <Input {...register("ram")} placeholder="8GB" className="h-12 bg-slate-900 border-slate-800 rounded-xl font-bold" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-tighter">Renk Seçimi</Label>
                  <Input {...register("color")} placeholder="Renk giriniz..." className="h-12 bg-slate-900 border-slate-800 rounded-xl font-bold uppercase" />
                  {selectedBrand?.toLowerCase() === "apple" && (
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {APPLE_COLORS.slice(0, 12).map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setValue("color", c.name)}
                          className={`h-9 rounded-lg border-2 transition-all flex items-center justify-center ${selectedColor === c.name ? "border-blue-500 scale-105 shadow-md shadow-blue-500/20" : "border-transparent hover:border-slate-700"}`}
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
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Fiyatlandırma</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Alış Fiyatı (₺)</Label>
                    <Input
                      {...register("buyPrice")}
                      onChange={(e) => setValue("buyPrice", formatCurrencyInput(e.target.value))}
                      className="h-12 bg-slate-900 border-slate-800 rounded-xl font-black text-[16px] text-rose-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Satış Fiyatı (₺)</Label>
                    <Input
                      {...register("sellPrice")}
                      onChange={(e) => setValue("sellPrice", formatCurrencyInput(e.target.value))}
                      className="h-12 bg-slate-900 border-slate-800 rounded-xl font-black text-[16px] text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Sağlık & Ekspertiz</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Pil Sağlığı (%)</Label>
                    <Input {...register("batteryHealth")} type="number" placeholder="100" className="h-12 bg-slate-900 border-slate-800 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 ml-1">Kozmetik Puanı / 10</Label>
                    <Select value={watch("cosmeticScore")} onValueChange={(val) => setValue("cosmeticScore", val)}>
                      <SelectTrigger className="h-12 bg-slate-900 border-slate-800 rounded-xl font-bold">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {[10, 9, 8, 7, 6, 5].map(s => (
                          <SelectItem key={s} value={s.toString()} className="font-bold">{s} / 10</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 ml-1">Değişen Parçalar / Notlar</Label>
                  <Textarea {...register("replacedParts")} className="bg-slate-900 border-slate-800 rounded-xl font-medium min-h-[100px]" placeholder="Örn: Ekran değişti, Orijinal parça takıldı..." />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 rounded-xl font-bold">İptal</Button>
            <Button disabled={isPending} type="submit" className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-600/20 gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              DEĞİŞİKLİKLERİ KAYDET
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
