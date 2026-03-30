"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { PlusCircle, Loader2, Package, Barcode, TrendingUp, AlertTriangle, DollarSign, Euro, ArrowRightLeft, MapPin, Mic, ChevronRight } from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  buyPrice: z.string().min(1, "Alış fiyatı gereklidir"),
  sellPrice: z.string().min(1, "Satış fiyatı gereklidir"),
  stock: z.string().min(1, "Stok miktarı gereklidir"),
  criticalStock: z.string().min(1, "Kritik stok gereklidir"),
  barcode: z.string().optional(),
  location: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface CreateProductModalProps {
  categories: Category[];
}

export function CreateProductModal({ categories }: CreateProductModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [exchangeRates, setExchangeRates] = useState({ usd: 1, eur: 1 });

  // Dinamik Kategori Yolu
  const [categoryPath, setCategoryPath] = useState<string[]>([]);

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
        location: data.location,
      });

      if (result.success) {
        toast.success("Ürün başarıyla eklendi.");
        // Modalı bilerek kapatmıyoruz. Veriler de sistemde kalıyor ki aynı kategoriden farklı varyant hızlıca eklenebilsin.
      } else if (result.isDuplicate) {
        toast.warning(result.message || "Aynı ürün zaten stokta mevcut!");
      } else {
        toast.error("Ürün eklenirken bir hata oluştu.");
      }
    });
  };

  // Kategori Ağacı Hesaplama
  const getChildren = (parentId: string | null) => {
    return categories.filter(c => c.parentId === parentId);
  };

  const handleCategorySelect = (level: number, catId: string) => {
    const newPath = categoryPath.slice(0, level);
    newPath.push(catId);
    setCategoryPath(newPath);
    setValue("categoryId", catId, { shouldValidate: true });

    // Kullanıcının Talebi: "farklı kategori seçilince sıfırlansın." 
    // Aynı isimli Inputları temizleyelim.
    reset({
      name: "",
      barcode: "",
      buyPrice: "0",
      sellPrice: "0",
      stock: "0",
      criticalStock: "5",
      location: "",
      categoryId: catId
    });
  };

  const rootCategories = getChildren(null);

  // Kaç tane dropdown çizileceğini belirleyelim
  const dropdownsToRender = [];

  // İlk seviye (Root)
  dropdownsToRender.push({
    level: 0,
    options: rootCategories,
    selectedValue: categoryPath[0] || "",
  });

  // Seçili olanlara göre alt seviyeleri ekle
  for (let i = 0; i < categoryPath.length; i++) {
    const children = getChildren(categoryPath[i]);
    if (children.length > 0) {
      dropdownsToRender.push({
        level: i + 1,
        options: children,
        selectedValue: categoryPath[i + 1] || "",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-10 px-6 bg-blue-500 text-black font-semibold rounded-xl hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <PlusCircle className="h-4 w-4" />
          <span>Yeni Ürün Ekle</span>
        </Button>
      </DialogTrigger>

      {/* max-w-[800px] ile modal büyütüldü */}
      <DialogContent className="sm:max-w-[800px] bg-[#0a0a0a] border border-white/10 text-white p-0 overflow-hidden shadow-2xl shadow-black/80">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">

            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                    <Package className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold tracking-tight">Akıllı Envanter Tanımlama</DialogTitle>
                    <DialogDescription className="text-[13px] font-medium text-slate-400 mt-1">
                      Sisteme yeni bir yedek parça, aksesuar veya cihaz kaydedin. <br />
                      <span className="text-indigo-400 opacity-80">Alt kategorileri sırayla seçerek ilerleyin.</span>
                    </DialogDescription>
                  </div>
                </div>

                {/* Gelecekte Eklenecek Sesli Ekleme Butonu */}
                <div className="group relative">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 cursor-not-allowed transition-all">
                    <Mic className="h-4 w-4 text-slate-500" />
                    <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">Sesli Tanımla</span>
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded-md text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Bu özellik yakında aktif edilecek
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-8">
              {/* Kategori Seçim Alanı (Dinamik Ağaç) */}
              <div className="space-y-4 bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

                <h4 className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Package className="h-3.5 w-3.5" /> Varyant ve Kategori Belirleme
                </h4>

                <div className="flex flex-wrap items-center gap-3 relative z-10 w-full">
                  {dropdownsToRender.map((dropdown, idx) => (
                    <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 flex-1 min-w-[200px]">
                      {idx > 0 && <ChevronRight className="h-4 w-4 text-indigo-500/50 hidden md:block" />}
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                          {idx === 0 ? "Ana Kategori" : `${idx}. Alt Kategori`}
                        </Label>
                        <Select
                          value={dropdown.selectedValue}
                          onValueChange={(val) => handleCategorySelect(dropdown.level, val)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-[13px] font-semibold text-white focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors w-full">
                            <SelectValue placeholder="Seçim Yapın..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0f172a] border-white/10 text-white shadow-2xl">
                            {dropdown.options.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-[13px] font-medium py-2.5 cursor-pointer focus:bg-white/10 transition-colors">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.categoryId && <p className="text-[11px] text-rose-500 font-semibold mt-2">{errors.categoryId.message}</p>}
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-slate-700/50 rounded-full"></div> Temel Kimlik
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-8 space-y-2">
                    <Label htmlFor="name" className="text-[12px] font-semibold text-slate-400">Ürün Adı & Kesin Tanımı</Label>
                    <Input id="name" {...register("name")} placeholder="Örn: iPhone 13 Pro Max Ön Cam Değişim Sınıfı" className="bg-white/[0.03] border-white/10 rounded-xl h-12 px-4 text-[14px] font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner" />
                    {errors.name && <p className="text-[11px] text-rose-500 font-medium">{errors.name.message}</p>}
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <Label htmlFor="barcode" className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5" /> Barkod No
                    </Label>
                    <Input id="barcode" {...register("barcode")} placeholder="Opsiyonel Serino" className="bg-white/[0.03] border-white/10 rounded-xl h-12 px-4 text-[13px] font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner" />
                  </div>
                </div>
              </div>

              {/* Finansal Detaylar (İkonlar Belirginleştirildi) */}
              <div className="space-y-5 bg-stone-900/30 p-5 rounded-2xl border border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-slate-700/50 rounded-full"></div> Finansal Parametreler
                  </h4>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <Button
                      type="button"
                      size="sm"
                      variant={currency === "TRY" ? "default" : "ghost"}
                      onClick={() => setCurrency("TRY")}
                      className={`h-8 px-4 text-[12px] font-bold rounded-lg transition-colors ${currency === "TRY" ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-slate-500 hover:text-white"}`}
                    >₺ TRY</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={currency === "USD" ? "default" : "ghost"}
                      onClick={() => setCurrency("USD")}
                      className={`h-8 px-4 text-[12px] font-bold rounded-lg transition-colors ${currency === "USD" ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-slate-500 hover:text-white"}`}
                    >$ USD</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={currency === "EUR" ? "default" : "ghost"}
                      onClick={() => setCurrency("EUR")}
                      className={`h-8 px-4 text-[12px] font-bold rounded-lg transition-colors ${currency === "EUR" ? "bg-blue-500 hover:bg-blue-400 text-black shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "text-slate-500 hover:text-white"}`}
                    >€ EUR</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Birim Maliyet */}
                  <div className="space-y-2">
                    <Label htmlFor="buyPrice" className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <div className="p-1.5 rounded-md bg-stone-800 border border-stone-700">
                        <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      Birim Tedarik Maliyeti ({currency})
                    </Label>
                    <div className="relative">
                      <Input id="buyPrice" type="number" step="0.01" {...register("buyPrice")} className="bg-black/40 border-stone-800 rounded-xl h-12 pl-12 text-[15px] font-bold text-white focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-all shadow-inner" />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-amber-500/80">
                        {currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                      </span>
                    </div>
                    {currency !== "TRY" && (
                      <div className="flex items-center gap-1.5 mt-2 px-1 opacity-90">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[11px] font-bold text-slate-400">Sistem Karşılığı ≈ {calculateTryPrice(watchBuyPrice)} ₺ (Günün Kuruyla)</span>
                      </div>
                    )}
                  </div>

                  {/* Satış Fiyatı */}
                  <div className="space-y-2">
                    <Label htmlFor="sellPrice" className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      Hedef Satış Fiyatı (₺)
                    </Label>
                    <div className="relative">
                      <Input id="sellPrice" type="number" step="0.01" {...register("sellPrice")} className="bg-black/40 border-emerald-500/20 rounded-xl h-12 pl-12 text-[15px] font-bold text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-500/50 transition-all shadow-inner" />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-emerald-500/80">₺</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stok ve Konum */}
              <div className="space-y-5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-slate-700/50 rounded-full"></div> Envanter Konumlandırması
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="stock" className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                      Başlangıç Stoğu
                    </Label>
                    <Input id="stock" type="number" {...register("stock")} className="bg-white/[0.03] border-white/10 rounded-xl h-12 text-[15px] font-bold focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner text-center" />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="criticalStock" className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Kritik Limit
                    </Label>
                    <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-rose-500/5 border-rose-500/20 rounded-xl h-12 text-[15px] font-bold text-rose-200 focus-visible:ring-1 focus-visible:ring-rose-500/50 transition-all shadow-inner text-center" />
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label htmlFor="location" className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" /> Raf / Konum
                    </Label>
                    <Input id="location" {...register("location")} placeholder="Örn: Arka Depo, Orta Çekmece, A-2" className="bg-white/[0.03] border-white/10 rounded-xl h-12 px-4 text-[13px] font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between rounded-b-2xl">
            <p className="text-[11px] font-medium text-slate-500 hidden md:block max-w-[300px]">
              * Kayıt tamamlandıktan sonra modal kapanmaz, aynı kategoride hızlıca seri numarası / varyant ekleyebilirsiniz.
            </p>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-12 px-6 rounded-xl text-[13px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                İptal Et
              </Button>
              <Button type="submit" disabled={isPending} className="h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-extrabold px-8 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                ÜRÜNÜ SİSTEME KAYDET
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
