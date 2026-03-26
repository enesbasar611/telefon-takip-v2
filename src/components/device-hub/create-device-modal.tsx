"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Smartphone, Zap, ShieldCheck } from "lucide-react";
import { createDeviceEntry } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const deviceSchema = z.object({
  brand: z.string().min(1, "Marka gereklidir"),
  model: z.string().min(1, "Model gereklidir"),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  imei: z.string().length(15, "IMEI 15 haneli olmalıdır"),
  serialNumber: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  capacity: z.string().optional().or(z.literal("")),
  batteryHealth: z.string().optional().or(z.literal("")),
  condition: z.enum(["NEW", "USED"]),
  buyPrice: z.string().min(1, "Alış fiyatı gereklidir"),
  sellPrice: z.string().min(1, "Satış fiyatı gereklidir"),
  purchasedFrom: z.string().optional().or(z.literal("")),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

export function CreateDeviceModal({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      condition: "USED",
      buyPrice: "0",
      sellPrice: "0",
    }
  });

  const condition = watch("condition");

  const onSubmit = async (data: DeviceFormValues) => {
    startTransition(async () => {
      const result = await createDeviceEntry({
        ...data,
        batteryHealth: data.batteryHealth ? parseInt(data.batteryHealth) : undefined,
        buyPrice: parseFloat(data.buyPrice),
        sellPrice: parseFloat(data.sellPrice),
        cosmeticScore: data.condition === "NEW" ? 10 : 8,
        expertChecklist: {},
      });

      if (result.success) {
        toast.success("Cihaz başarıyla envantere eklendi.");
        setOpen(false);
        reset();
      } else {
        toast.error("İşlem başarısız.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-12 px-8 bg-blue-600 text-white font-black   rounded-2xl hover:bg-blue-500  transition-all italic">
          <PlusCircle className="h-5 w-5" />
          <span>YENİ CİHAZ GİRİŞİ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-[#020617] border-slate-800 text-white p-0 overflow-hidden rounded-[2.5rem]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-10 space-y-8">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                 <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                    <Smartphone className="h-6 w-6 text-blue-500" />
                 </div>
                 <DialogTitle className="text-2xl font-black  ">Envanter Tanımlama</DialogTitle>
              </div>
              <DialogDescription className="text-xs font-medium text-slate-500  ">
                Sıfır veya İkinci el cihazları 2026 Orgelux standartlarında kaydedin.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black   text-slate-500">Cihaz Durumu</Label>
                  <div className="flex gap-2 p-1.5 bg-slate-900/40 border border-slate-800 rounded-2xl">
                    <Button
                      type="button"
                      variant="ghost"
                      className={`flex-1 h-10 rounded-xl text-[10px] font-black   transition-all ${condition === "NEW" ? 'bg-blue-600 text-white ' : 'text-slate-500'}`}
                      onClick={() => setValue("condition", "NEW")}
                    >
                      <Zap className="h-3.5 w-3.5 mr-2" /> SIFIR
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className={`flex-1 h-10 rounded-xl text-[10px] font-black   transition-all ${condition === "USED" ? 'bg-blue-600 text-white ' : 'text-slate-500'}`}
                      onClick={() => setValue("condition", "USED")}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-2" /> 2. EL
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black   text-slate-500">Marka</Label>
                            <Input {...register("brand")} placeholder="Apple" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black   text-slate-500">Model</Label>
                            <Input {...register("model")} placeholder="iPhone 15 Pro" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500">IMEI Numarası</Label>
                        <Input {...register("imei")} maxLength={15} placeholder="352..." className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold" />
                    </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500">Renk</Label>
                        <Input {...register("color")} placeholder="Natural Titanium" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500">Kapasite</Label>
                        <Input {...register("capacity")} placeholder="256 GB" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500">Batarya Sağlığı (%)</Label>
                        <Input {...register("batteryHealth")} type="number" placeholder="100" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500">Kategori</Label>
                        <Select onValueChange={(v) => setValue("categoryId", v)}>
                            <SelectTrigger className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-bold">
                                <SelectValue placeholder="Seç" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>

                 <Separator className="bg-slate-800/50" />

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500 italic">ALIŞ FİYATI (₺)</Label>
                        <Input {...register("buyPrice")} type="number" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-black text-rose-500" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black   text-slate-500 italic text-blue-400">SATIŞ FİYATI (₺)</Label>
                        <Input {...register("sellPrice")} type="number" className="bg-slate-900 border-slate-800 rounded-xl h-11 text-xs font-black text-blue-400" />
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="p-10 border-t border-slate-800/50 bg-slate-900/20 flex items-center justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="text-[10px] font-black   text-slate-500 hover:text-white">Vazgeç</Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white font-black   px-12 h-14 rounded-2xl  transition-all italic">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5 mr-3" />}
              KAYDI TAMAMLA
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
