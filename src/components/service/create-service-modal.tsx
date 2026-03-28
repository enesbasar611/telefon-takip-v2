"use client";

import { useState, useTransition, ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, User, Smartphone, Hash, AlertCircle, Banknote, SmartphoneIcon } from "lucide-react";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Müşteri adı sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .regex(/^5\d{9}$/, "Geçerli bir Türkiye telefon numarası giriniz (5xx xxx xxxx)"),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || (val.length === 15 && /^\d+$/.test(val)), {
      message: "IMEI numarası tam olarak 15 haneli rakamlardan oluşmalıdır"
    }),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  estimatedCost: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface CreateServiceModalProps {
  trigger?: ReactNode;
}

export function CreateServiceModal({ trigger }: CreateServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      estimatedCost: "0",
      customerPhone: "5",
    }
  });

  const onSubmit = async (data: ServiceFormValues) => {
    startTransition(async () => {
      const result = await createServiceTicket({
        ...data,
        estimatedCost: Number(data.estimatedCost),
      });

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Servis kaydı başarıyla oluşturuldu.",
        });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast({
          title: "Hata",
          description: result.error || "Kayıt oluşturulurken bir hata oluştu.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Yeni Servis Kaydı</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/5 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="p-8 bg-slate-900/50 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Yeni Servis Kaydı</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Müşteri ve cihaz bilgilerini girerek yeni bir teknik servis kaydı oluşturun.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="customerName" className="text-xs font-bold text-muted-foreground">Müşteri Ad Soyad</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="customerName" {...register("customerName")} placeholder="Ali Yılmaz" className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-12 text-sm font-bold" />
                </div>
                {errors.customerName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.customerName.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="customerPhone" className="text-xs font-bold text-muted-foreground">Telefon Numarası</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-500/50">+90</span>
                  <Input
                    id="customerPhone"
                    {...register("customerPhone")}
                    placeholder="5XX XXX XX XX"
                    maxLength={10}
                    className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-14 text-sm font-bold"
                  />
                </div>
                {errors.customerPhone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.customerPhone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="deviceBrand" className="text-xs font-bold text-muted-foreground">Cihaz Markası</Label>
                <div className="relative group">
                  <SmartphoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="deviceBrand" {...register("deviceBrand")} placeholder="Apple, Samsung..." className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-12 text-sm font-bold" />
                </div>
                {errors.deviceBrand && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.deviceBrand.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="deviceModel" className="text-xs font-bold text-muted-foreground">Cihaz Modeli</Label>
                <Input id="deviceModel" {...register("deviceModel")} placeholder="iPhone 13, Galaxy S21..." className="h-14 bg-slate-900 border-white/5 rounded-2xl px-6 text-sm font-bold" />
                {errors.deviceModel && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.deviceModel.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="imei" className="text-xs font-bold text-muted-foreground">IMEI / Seri No</Label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="imei" {...register("imei")} placeholder="15 haneli IMEI" maxLength={15} className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-12 text-sm font-bold" />
                </div>
                {errors.imei && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.imei.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="estimatedCost" className="text-xs font-bold text-muted-foreground">Tahmini Ücret</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-500/50">₺</span>
                  <Input id="estimatedCost" type="number" {...register("estimatedCost")} placeholder="0.00" className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-10 text-sm font-bold transition-all tabular-nums text-emerald-500" />
                </div>
                {errors.estimatedCost && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.estimatedCost.message}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="problemDesc" className="text-xs font-bold text-muted-foreground">Arıza Tanımı</Label>
              <div className="relative group">
                <AlertCircle className="absolute left-4 top-5 h-4 w-4 text-muted-foreground" />
                <Input id="problemDesc" {...register("problemDesc")} placeholder="Ekran kırık, şarj almıyor..." className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-12 text-sm font-bold" />
              </div>
              {errors.problemDesc && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.problemDesc.message}</p>}
            </div>
          </div>

          <div className="p-8 bg-slate-900/50 border-t border-white/5">
            <DialogFooter className="gap-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-14 px-8 rounded-2xl font-bold text-slate-400">Vazgeç</Button>
              <Button type="submit" disabled={isPending} className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl gap-3 transition-all active:scale-95">
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                Kaydı Tamamla
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
