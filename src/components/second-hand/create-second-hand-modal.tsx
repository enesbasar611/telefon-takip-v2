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
import { Smartphone, Loader2 } from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { useToast } from "@/hooks/use-toast";

const secondHandSchema = z.object({
  name: z.string().min(2, "Cihaz adı en az 2 karakter olmalıdır"),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  buyPrice: z.string().min(1, "Alış fiyatı gereklidir"),
  sellPrice: z.string().min(1, "Satış fiyatı gereklidir"),
  imei: z.string().min(15, "Geçerli bir IMEI giriniz"),
  color: z.string().optional(),
  capacity: z.string().optional(),
});

type SecondHandFormValues = z.infer<typeof secondHandSchema>;

export function CreateSecondHandModal({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SecondHandFormValues>({
    resolver: zodResolver(secondHandSchema),
  });

  const onSubmit = async (data: SecondHandFormValues) => {
    startTransition(async () => {
      const result = await createProduct({
        ...data,
        buyPrice: Number(data.buyPrice),
        sellPrice: Number(data.sellPrice),
        stock: 1,
        criticalStock: 0,
        isSecondHand: true,
      });
      if (result.success) {
        toast({ title: "Başarılı", description: "2. El cihaz kaydedildi." });
        setOpen(false);
        reset();
      } else {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Smartphone className="h-4 w-4" />
          <span>Yeni Cihaz Girişi</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>İkinci El Cihaz Girişi</DialogTitle>
            <DialogDescription>Müşteriden alınan veya stok için giren 2. el cihazı kaydedin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="name">Cihaz Modeli</Label>
                <Input id="name" {...register("name")} placeholder="iPhone 11" />
                </div>
                <div className="space-y-2">
                <Label>Kategori</Label>
                <Select onValueChange={(val) => setValue("categoryId", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="imei">IMEI Numarası</Label>
                <Input id="imei" {...register("imei")} placeholder="35XXXXXXXXXXXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Renk</Label>
                <Input id="color" {...register("color")} placeholder="Siyah" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasite</Label>
                <Input id="capacity" {...register("capacity")} placeholder="128 GB" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="buyPrice">Alış Fiyatı (₺)</Label>
                    <Input id="buyPrice" type="number" {...register("buyPrice")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sellPrice">Satış Fiyatı (₺)</Label>
                    <Input id="sellPrice" type="number" {...register("sellPrice")} />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Vazgeç</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cihazı Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
