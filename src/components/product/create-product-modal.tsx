"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  PlusCircle, Loader2, Package, Barcode, TrendingUp, AlertTriangle,
  DollarSign, ArrowRightLeft, MapPin, ChevronRight, Sparkles,
  ChevronDown, CheckCircle2, XCircle, Wand2
} from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { parseProductWithAI } from "@/lib/actions/gemini-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import { getInventoryFormFields, extractCoreAndAttributes, getIndustryLabel } from "@/lib/industry-utils";
import { FormFactory } from "@/components/common/form-factory";

import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { useAura } from "@/lib/context/aura-context";

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
  shop?: any;
  autoOpen?: boolean;
}

export function CreateProductModal({ categories, shop, autoOpen = false }: CreateProductModalProps) {
  const { rates: exchangeRates } = useDashboardData();
  const { triggerAura } = useAura();
  const [open, setOpen] = useState(autoOpen);
  const [isPending, startTransition] = useTransition();
  const [isAIPending, startAITransition] = useTransition();
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "success" | "error">("idle");

  const industryFields = getInventoryFormFields(shop);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(productSchema.passthrough()),
    defaultValues: { stock: "0", criticalStock: "5", buyPrice: "0", sellPrice: "0" }
  });

  const watchBuyPrice = watch("buyPrice");

  const calculateTryPrice = (val: string) => {
    const num = parseFloat(val) || 0;
    if (currency === "USD") return (num * exchangeRates.usd).toFixed(2);
    if (currency === "EUR") return (num * exchangeRates.eur).toFixed(2);
    return num.toFixed(2);
  };

  const handleAIAnalyze = () => {
    if (!aiDescription.trim()) {
      toast.warning("Lütfen bir ürün açıklaması girin.");
      return;
    }
    startAITransition(async () => {
      setAiStatus("idle");
      triggerAura("analyzing");
      const result = await parseProductWithAI(aiDescription);
      if (!result.success) {
        setAiStatus("error");
        triggerAura("error");
        toast.error(result.error || "AI analizi başarısız oldu.");
        return;
      }

      const { data } = result;
      setAiStatus("success");
      triggerAura("success");
      // Auto-fill the form fields
      if (data.name) setValue("name", data.name, { shouldValidate: true });
      if (data.buyPrice) setValue("buyPrice", String(data.buyPrice), { shouldValidate: true });
      if (data.sellPrice) setValue("sellPrice", String(data.sellPrice), { shouldValidate: true });
      if (data.stock) setValue("stock", String(data.stock), { shouldValidate: true });
      if (data.criticalStock) setValue("criticalStock", String(data.criticalStock), { shouldValidate: true });
      if (data.barcode) setValue("barcode", data.barcode);
      if (data.location) setValue("location", data.location);

      // Set category path
      if (data.categoryPath && data.categoryPath.length > 0) {
        setCategoryPath(data.categoryPath);
        const leafId = data.categoryPath[data.categoryPath.length - 1];
        setValue("categoryId", leafId, { shouldValidate: true });
      }

      setAiStatus("success");
      const confidenceLabels = { high: "yüksek", medium: "orta", low: "düşük" };
      toast.success(`AI alanları doldurdu! (Güven: ${confidenceLabels[data.confidence]})`, {
        description: "Lütfen bilgileri kontrol edip gerekirse düzeltin.",
      });
    });
  };

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      let finalBuyPrice = Number(data.buyPrice);
      if (currency === "USD") finalBuyPrice *= exchangeRates.usd;
      if (currency === "EUR") finalBuyPrice *= exchangeRates.eur;

      const { name, barcode, location, attributes } = extractCoreAndAttributes(industryFields, data);

      const result = await createProduct({
        name: name || data.name,
        categoryId: data.categoryId,
        buyPrice: finalBuyPrice,
        sellPrice: Number(data.sellPrice),
        stock: Number(data.stock),
        criticalStock: Number(data.criticalStock),
        barcode: barcode || data.barcode,
        location: location || data.location,
        attributes,
      });

      if (result.success) {
        toast.success("Ürün başarıyla eklendi.");
        triggerAura("success");
        setAiDescription("");
        setAiStatus("idle");
        reset(); // Reset form for next entry
      } else if (result.isDuplicate) {
        toast.warning(result.message || "Aynı ürün zaten stokta mevcut!");
      } else {
        toast.error("Ürün eklenirken bir hata oluştu.");
      }
    });
  };

  const getChildren = (parentId: string | null) =>
    categories.filter(c => c.parentId === parentId);

  const handleCategorySelect = (level: number, catId: string) => {
    const newPath = categoryPath.slice(0, level);
    newPath.push(catId);
    setCategoryPath(newPath);
    setValue("categoryId", catId, { shouldValidate: true });
    reset({
      name: watch("name"),
      barcode: watch("barcode"),
      buyPrice: watch("buyPrice"),
      sellPrice: watch("sellPrice"),
      stock: watch("stock"),
      criticalStock: watch("criticalStock"),
      location: watch("location"),
      categoryId: catId
    });
  };

  const rootCategories = getChildren(null);
  const dropdownsToRender = [{ level: 0, options: rootCategories, selectedValue: categoryPath[0] || "" }];
  for (let i = 0; i < categoryPath.length; i++) {
    const children = getChildren(categoryPath[i]);
    if (children.length > 0) {
      dropdownsToRender.push({ level: i + 1, options: children, selectedValue: categoryPath[i + 1] || "" });
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

      <DialogContent className="sm:max-w-[820px] bg-[#0a0a0a] border border-border text-white p-0 overflow-hidden shadow-2xl shadow-black/80">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8 space-y-6 max-h-[88vh] overflow-y-auto custom-scrollbar">

            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                    <Package className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <DialogTitle className="font-medium text-xl  tracking-tight">Akıllı {getIndustryLabel(shop, "inventory")} Tanımlama</DialogTitle>
                    <DialogDescription className="text-[13px] font-medium text-muted-foreground mt-1">
                      Sisteme yeni bir {getIndustryLabel(shop, "customerAsset").toLowerCase()}, malzeme veya {getIndustryLabel(shop, "productLabel").toLowerCase()} kaydedin. <br />
                      <span className="text-indigo-400 opacity-80">Alt kategorileri sırayla seçerek ilerleyin.</span>
                    </DialogDescription>
                  </div>
                </div>

                {/* AI Toggle Button */}
                <Button
                  type="button"
                  onClick={() => setAiExpanded(prev => !prev)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border  text-[11px] tracking-wider uppercase transition-all",
                    aiExpanded
                      ? "bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-[0_0_16px_theme(colors.violet.500/0.2)]"
                      : "bg-white/[0.03] border-border text-muted-foreground hover:bg-white/[0.07] hover:text-white"
                  )}
                >
                  <Sparkles className={cn("h-4 w-4", aiExpanded && "text-violet-400 animate-pulse")} />
                  AI ile Doldur
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", aiExpanded && "rotate-180")} />
                </Button>
              </div>
            </DialogHeader>

            {/* ✨ AI Panel */}
            {aiExpanded && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-xl bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
                    <Wand2 className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[11px]  text-violet-400 uppercase tracking-widest">Gemini AI Asistan</p>
                    <p className="text-[10px] text-muted-foreground/80 font-medium">Ürünü serbest metin olarak tarif edin, AI formu otomatik dolduracak</p>
                  </div>
                  {aiStatus === "success" && (
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px]  text-emerald-400 uppercase tracking-wide">Dolduruldu</span>
                    </div>
                  )}
                  {aiStatus === "error" && (
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-[10px]  text-red-400 uppercase tracking-wide">Hata</span>
                    </div>
                  )}
                </div>

                <textarea
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                  placeholder={`Örnek: "iPhone 14 Pro ön cam 3 adet alış 850 TL satış 1200 TL, ekranlar kategorisinde, raf: A-2"\nVeya: "Samsung Galaxy Tab S9 batarya değişimi 5 adet, alış fiyatı 620, satış 900"`}
                  rows={4}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-[13px] font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition-all leading-relaxed"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAIAnalyze();
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-600 font-medium">
                    💡 Ctrl+Enter ile hızlı analiz · Doldurulmuş alanları istediğiniz gibi düzenleyebilirsiniz
                  </p>
                  <Button
                    type="button"
                    onClick={handleAIAnalyze}
                    disabled={isAIPending || !aiDescription.trim()}
                    className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white  text-[12px] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_28px_rgba(139,92,246,0.5)] disabled:opacity-40 gap-2"
                  >
                    {isAIPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analiz Ediliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analiz Et
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-8">
              {/* Kategori Hiyerarşisi */}
              <div className="space-y-4 bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                <h4 className="font-medium text-[11px]  text-indigo-400/80 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Package className="h-3.5 w-3.5" /> Varyant ve Kategori Belirleme
                </h4>
                <div className="flex flex-wrap items-center gap-3 relative z-10 w-full">
                  {dropdownsToRender.map((dropdown, idx) => (
                    <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 flex-1 min-w-[200px]">
                      {idx > 0 && <ChevronRight className="h-4 w-4 text-indigo-500/50 hidden md:block" />}
                      <div className="space-y-1.5 flex-1">
                        <Label className="font-medium text-[10px] font-semibold text-muted-foreground/80 uppercase">
                          {idx === 0 ? "Ana Kategori" : `${idx}. Alt Kategori`}
                        </Label>
                        <Select
                          value={dropdown.selectedValue}
                          onValueChange={(val) => handleCategorySelect(dropdown.level, val)}
                        >
                          <SelectTrigger className="bg-white/5 border-border rounded-xl h-11 text-[13px] font-semibold text-white focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors w-full">
                            <SelectValue placeholder="Seçim Yapın..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0f172a] border-border text-white shadow-2xl">
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
                {errors.categoryId && <p className="text-[11px] text-rose-500 font-semibold mt-2">{String(errors.categoryId.message || "")}</p>}
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-5">
                <h4 className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-slate-700/50 rounded-full" /> Temel Kimlik & Sektörel Detaylar
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-4">
                  <div className="md:col-span-8 space-y-2">
                    <Label htmlFor="name" className="font-medium text-[12px] font-semibold text-muted-foreground">{getIndustryLabel(shop, "productLabel")} Adı &amp; Kesin Tanımı</Label>
                    <Input id="name" {...register("name")} placeholder={`Örn: ${getIndustryLabel(shop, "productLabel")} adı / modeli / türü`} className="bg-white/[0.03] border-border rounded-xl h-12 px-4 text-[14px] font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner" />
                    {errors.name && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {String(errors.name.message || "")}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <Label htmlFor="barcode" className="font-medium text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5" /> Barkod No
                    </Label>
                    <Input id="barcode" {...register("barcode")} placeholder="Opsiyonel" className="bg-white/[0.03] border-border rounded-xl h-12 px-4 text-[13px] font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner" />
                  </div>
                </div>

                {/* Industry Specific Fields */}
                <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05]">
                  <FormFactory
                    fields={industryFields}
                    register={register}
                    control={control}
                    errors={errors}
                    twoCol={true}
                  />
                </div>
              </div>

              {/* Finansal Parametreler */}
              <div className="space-y-5 bg-stone-900/30 p-5 rounded-2xl border border-border/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <h4 className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-slate-700/50 rounded-full" /> Finansal Parametreler
                  </h4>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-border/50">
                    {(["TRY", "USD", "EUR"] as const).map((c) => (
                      <Button key={c} type="button" size="sm" variant={currency === c ? "default" : "ghost"}
                        onClick={() => setCurrency(c)}
                        className={`h-8 px-4 text-[12px]  rounded-lg transition-colors ${currency === c
                          ? c === "TRY" ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            : c === "USD" ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                              : "bg-blue-500 hover:bg-blue-400 text-black"
                          : "text-muted-foreground/80 hover:text-white"}`}
                      >
                        {c === "TRY" ? "₺ TRY" : c === "USD" ? "$ USD" : "€ EUR"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="buyPrice" className="font-medium text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <div className="p-1.5 rounded-md bg-stone-800 border border-stone-700">
                        <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      Birim Tedarik Maliyeti ({currency})
                    </Label>
                    <div className="relative">
                      <PriceInput
                        id="buyPrice"
                        value={watch("buyPrice")}
                        onChange={(v) => setValue("buyPrice", String(v), { shouldValidate: true })}
                        prefix={currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                        className="bg-black/40 border-stone-800 rounded-xl h-12 pl-12 text-[15px]  text-white focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-all shadow-inner"
                      />
                    </div>
                    {currency !== "TRY" && (
                      <div className="flex items-center gap-1.5 mt-2 px-1 opacity-90">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[11px]  text-muted-foreground">≈ {calculateTryPrice(watchBuyPrice)} ₺ (Günün Kuruyla)</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellPrice" className="font-medium text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      Hedef Satış Fiyatı (₺)
                    </Label>
                    <div className="relative">
                      <PriceInput
                        id="sellPrice"
                        value={watch("sellPrice")}
                        onChange={(v) => setValue("sellPrice", String(v), { shouldValidate: true })}
                        className="bg-black/40 border-emerald-500/20 rounded-xl h-12 pl-12 text-[15px]  text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-500/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stok ve Konum */}
              <div className="space-y-5">
                <h4 className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-slate-700/50 rounded-full" /> Envanter Konumlandırması
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="stock" className="font-medium text-[12px] font-semibold text-muted-foreground">Başlangıç Stoğu</Label>
                    <Input id="stock" type="number" {...register("stock")} className="bg-white/[0.03] border-border rounded-xl h-12 text-[15px]  focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner text-center" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="criticalStock" className="font-medium text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Kritik Limit
                    </Label>
                    <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-rose-500/5 border-rose-500/20 rounded-xl h-12 text-[15px]  text-rose-200 focus-visible:ring-1 focus-visible:ring-rose-500/50 transition-all shadow-inner text-center" />
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <Label htmlFor="location" className="font-medium text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" /> Raf / Konum
                    </Label>
                    <Input id="location" {...register("location")} placeholder="Örn: Arka Depo, Orta Çekmece, A-2" className="bg-white/[0.03] border-border rounded-xl h-12 px-4 text-[13px] font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all shadow-inner" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border/50 bg-black/40 flex items-center justify-between rounded-b-2xl">
            <p className="text-[11px] font-medium text-muted-foreground/80 hidden md:block max-w-[300px]">
              * Kayıt tamamlandıktan sonra modal kapanmaz, seri varyant hızlıca ekleyebilirsiniz.
            </p>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-12 px-6 rounded-xl text-[13px]  text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
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






