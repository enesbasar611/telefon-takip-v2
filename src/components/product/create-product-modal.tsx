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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  buyPrice: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz"),
  sellPrice: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz"),
  stock: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz"),
  barcode: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function CreateProductModal({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      buyPrice: "0",
      sellPrice: "0",
      stock: "0",
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    startTransition(async () => {
      try {
        await createProduct({
          name: data.name,
          categoryId: data.categoryId,
          buyPrice: Number(data.buyPrice),
          sellPrice: Number(data.sellPrice),
          stock: Number(data.stock),
          barcode: data.barcode || undefined,
        });

        toast({ title: "Başarılı", description: "Ürün başarıyla oluşturuldu." });
        setOpen(false);
        reset();
      } catch (error) {
        toast({ title: "Hata", description: "Ürün oluşturulurken bir hata oluştu.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Yeni Ürün Ekle</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Yeni Ürün Oluştur</DialogTitle>
            <DialogDescription>
              Stok bilgilerini girerek yeni bir ürün kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı</Label>
              <Input id="name" {...register("name")} placeholder="iPhone 13 Ekran" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select onValueChange={(val) => setValue("categoryId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyPrice">Alış Fiyatı (₺)</Label>
                <Input id="buyPrice" type="number" {...register("buyPrice")} />
                {errors.buyPrice && <p className="text-xs text-red-500">{errors.buyPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Satış Fiyatı (₺)</Label>
                <Input id="sellPrice" type="number" {...register("sellPrice")} />
                {errors.sellPrice && <p className="text-xs text-red-500">{errors.sellPrice.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Başlangıç Stok</Label>
                <Input id="stock" type="number" {...register("stock")} />
                {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barkod (Opsiyonel)</Label>
                <Input id="barcode" {...register("barcode")} placeholder="12345678" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Vazgeç</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ürünü Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
