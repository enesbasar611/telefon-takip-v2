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
import { PlusCircle, Loader2, Package, Barcode, TrendingUp, AlertTriangle } from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  buyPrice: z.string().min(1, "Alış fiyatı gereklidir"),
  sellPrice: z.string().min(1, "Satış fiyatı gereklidir"),
  stock: z.string().min(1, "Stok miktarı gereklidir"),
  criticalStock: z.string().min(1, "Kritik stok gereklidir"),
  barcode: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface CreateProductModalProps {
  categories: any[];
}

export function CreateProductModal({ categories }: CreateProductModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: "0",
      criticalStock: "5",
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    startTransition(async () => {
      const result = await createProduct({
        name: data.name,
        categoryId: data.categoryId,
        buyPrice: Number(data.buyPrice),
        sellPrice: Number(data.sellPrice),
        stock: Number(data.stock),
        criticalStock: Number(data.criticalStock),
        barcode: data.barcode,
      });

      if (result.success) {
        toast.success("Ürün başarıyla eklendi.");
        setOpen(false);
        reset();
      } else {
        toast.error("Ürün eklenirken bir hata oluştu.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-10 px-6 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 shadow-cyan-strong transition-all">
          <PlusCircle className="h-4 w-4" />
          <span>YENİ ÜRÜN EKLE</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-[#141416] border-white/5 text-white p-0 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <Package className="h-5 w-5 text-cyan-500" />
                 </div>
                 <DialogTitle className="text-xl font-black uppercase tracking-tighter">Envanter Tanımlama</DialogTitle>
              </div>
              <DialogDescription className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                Sisteme yeni bir yedek parça, aksesuar veya sarf malzemesi kaydedin.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ürün Adı & Tanımı</Label>
                <Input id="name" {...register("name")} placeholder="Örn: iPhone 13 Pro Max Ekran (Orijinal)" className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                {errors.name && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Kategori Sınıfı</Label>
                  <Select onValueChange={(val) => setValue("categoryId", val)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141416] border-white/5 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold uppercase py-3">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{errors.categoryId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Barcode className="h-3 w-3" /> Barkod No
                  </Label>
                  <Input id="barcode" {...register("barcode")} placeholder="869..." className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="space-y-2">
                  <Label htmlFor="buyPrice" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Alış Fiyatı (₺)</Label>
                  <div className="relative">
                    <Input id="buyPrice" type="number" {...register("buyPrice")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 pl-8 text-sm font-bold" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-600">₺</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice" className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" /> Satış Fiyatı (₺)
                  </Label>
                  <div className="relative">
                    <Input id="sellPrice" type="number" {...register("sellPrice")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 pl-8 text-sm font-bold" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-600">₺</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Başlangıç Stoğu</Label>
                  <Input id="stock" type="number" {...register("stock")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="criticalStock" className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-rose-500" /> Kritik Limit
                  </Label>
                  <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-12 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">
                İptal Et
            </Button>
            <Button type="submit" disabled={isPending} className="h-12 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest px-8 hover:bg-cyan-400 shadow-cyan-strong transition-all">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              KAYDI TAMAMLA
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
