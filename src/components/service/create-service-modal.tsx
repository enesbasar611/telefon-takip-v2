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
import { PlusCircle, Loader2 } from "lucide-react";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";

const serviceSchema = z.object({
  customerName: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır"),
  customerPhone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      estimatedCost: "0",
    }
  });

  const onSubmit = async (data: ServiceFormValues) => {
    startTransition(async () => {
      const result = await createServiceTicket({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deviceBrand: data.deviceBrand,
        deviceModel: data.deviceModel,
        imei: data.imei,
        problemDesc: data.problemDesc,
        estimatedCost: Number(data.estimatedCost),
      });

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Servis kaydı başarıyla oluşturuldu.",
        });
        setOpen(false);
        reset();
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Yeni Servis Kaydı Oluştur</DialogTitle>
            <DialogDescription>
              Müşteri ve cihaz bilgilerini girerek yeni bir teknik servis kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Ad Soyad</Label>
                <Input id="customerName" {...register("customerName")} placeholder="Ali Yılmaz" />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefon Numarası</Label>
                <Input id="customerPhone" {...register("customerPhone")} placeholder="05XX XXX XX XX" />
                {errors.customerPhone && <p className="text-xs text-red-500">{errors.customerPhone.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceBrand">Cihaz Markası</Label>
                <Input id="deviceBrand" {...register("deviceBrand")} placeholder="Apple, Samsung..." />
                {errors.deviceBrand && <p className="text-xs text-red-500">{errors.deviceBrand.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceModel">Cihaz Modeli</Label>
                <Input id="deviceModel" {...register("deviceModel")} placeholder="iPhone 13, Galaxy S21..." />
                {errors.deviceModel && <p className="text-xs text-red-500">{errors.deviceModel.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI / Seri No (Opsiyonel)</Label>
              <Input id="imei" {...register("imei")} placeholder="15 haneli IMEI" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="problemDesc">Sorun Açıklaması</Label>
              <Input id="problemDesc" {...register("problemDesc")} placeholder="Ekran kırık, şarj almıyor..." />
              {errors.problemDesc && <p className="text-xs text-red-500">{errors.problemDesc.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Tahmini Ücret (₺)</Label>
              <Input id="estimatedCost" type="number" {...register("estimatedCost")} placeholder="0.00" />
              {errors.estimatedCost && <p className="text-xs text-red-500">{errors.estimatedCost.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Vazgeç</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydı Tamamla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
