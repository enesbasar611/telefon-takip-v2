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
import { PlusCircle, Loader2, Package, Barcode, TrendingUp, AlertTriangle, DollarSign, Euro, ArrowRightLeft } from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { toast } from "sonner";
import { useEffect } from "react";

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
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [exchangeRates, setExchangeRates] = useState({ usd: 1, eur: 1 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: "0",
      criticalStock: "5",
      buyPrice: "0",
      sellPrice: "0",
    }
  });

  const watchBuyPrice = watch("buyPrice");

  useEffect(() => {
    async function fetchRates() {
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    }
    fetchRates();
  }, []);

  const calculateTryPrice = (val: string) => {
    const num = parseFloat(val) || 0;
    if (currency === "USD") return (num * exchangeRates.usd).toFixed(2);
    if (currency === "EUR") return (num * exchangeRates.eur).toFixed(2);
    return num.toFixed(2);
  };

  const onSubmit = async (data: ProductFormValues) => {
    startTransition(async () => {
      let finalBuyPrice = Number(data.buyPrice);

      if (currency === "USD") finalBuyPrice = finalBuyPrice * exchangeRates.usd;
      if (currency === "EUR") finalBuyPrice = finalBuyPrice * exchangeRates.eur;

      const result = await createProduct({
        name: data.name,
        categoryId: data.categoryId,
        buyPrice: finalBuyPrice,
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
        <Button className="gap-2 h-10 px-6 bg-blue-500 text-black font-bold rounded-xl hover:bg-blue-400 transition-all">
          <PlusCircle className="h-4 w-4" />
          <span>YENİ ÜRÜN EKLE</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-card border-white/5 text-white p-0 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Package className="h-5 w-5 text-blue-500" />
                 </div>
                 <DialogTitle className="text-xl font-bold">Envanter Tanımlama</DialogTitle>
              </div>
              <DialogDescription className="text-xs font-medium text-gray-500">
                Sisteme yeni bir yedek parça, aksesuar veya sarf malzemesi kaydedin.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold text-gray-500">Ürün Adı & Tanımı</Label>
                <Input id="name" {...register("name")} placeholder="Örn: iPhone 13 Pro Max Ekran (Orijinal)" className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                {errors.name && <p className="text-[10px] text-rose-500 font-bold">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500">Kategori Sınıfı</Label>
                  <Select onValueChange={(val) => setValue("categoryId", val)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/5 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold py-3">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-[10px] text-rose-500 font-bold">{errors.categoryId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                    <Barcode className="h-3 w-3" /> Barkod No
                  </Label>
                  <Input id="barcode" {...register("barcode")} placeholder="869..." className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-[10px] font-bold text-gray-500">Maliyet & Satış Parametreleri</Label>
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                        <Button
                            type="button"
                            size="sm"
                            variant={currency === "TRY" ? "default" : "ghost"}
                            onClick={() => setCurrency("TRY")}
                            className={`h-7 px-3 text-[10px] font-bold rounded-md ${currency === "TRY" ? "bg-blue-500 text-black" : "text-gray-500"}`}
                        >₺</Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={currency === "USD" ? "default" : "ghost"}
                            onClick={() => setCurrency("USD")}
                            className={`h-7 px-3 text-[10px] font-bold rounded-md ${currency === "USD" ? "bg-emerald-500 text-black" : "text-gray-500"}`}
                        >$</Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={currency === "EUR" ? "default" : "ghost"}
                            onClick={() => setCurrency("EUR")}
                            className={`h-7 px-3 text-[10px] font-bold rounded-md ${currency === "EUR" ? "bg-blue-500 text-black" : "text-gray-500"}`}
                        >€</Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="buyPrice" className="text-[10px] font-bold text-gray-500">Alış ({currency})</Label>
                    <div className="relative">
                        <Input id="buyPrice" type="number" step="0.01" {...register("buyPrice")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 pl-8 text-sm font-bold" />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                            {currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                        </span>
                    </div>
                    {currency !== "TRY" && (
                        <div className="flex items-center gap-2 mt-1 px-1">
                            <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-gray-500">≈ {calculateTryPrice(watchBuyPrice)} ₺</span>
                        </div>
                    )}
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="sellPrice" className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Satış (₺)
                    </Label>
                    <div className="relative">
                        <Input id="sellPrice" type="number" step="0.01" {...register("sellPrice")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 pl-8 text-sm font-bold" />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">₺</span>
                    </div>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[10px] font-bold text-gray-500">Başlangıç Stoğu</Label>
                  <Input id="stock" type="number" {...register("stock")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="criticalStock" className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-rose-500" /> Kritik Limit
                  </Label>
                  <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-12 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all">
                İptal Et
            </Button>
            <Button type="submit" disabled={isPending} className="h-12 rounded-xl bg-blue-500 text-black font-bold px-8 hover:bg-blue-400 transition-all">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              KAYDI TAMAMLA
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
