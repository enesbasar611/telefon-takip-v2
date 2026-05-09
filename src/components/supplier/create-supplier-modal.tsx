"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Building2,
  MapPin,
  PhoneCall,
  Mail,
  ShieldCheck,
  Settings,
  Hash,
  Landmark,
  CreditCard,
  Building,
  HeadphonesIcon,
  Smartphone,
  Info,
  Save,
  Loader2,
  FolderOpen
} from "lucide-react";
import { createSupplier } from "@/lib/actions/supplier-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const supplierSchema = z.object({
  name: z.string().min(2, "Firma adı zorunludur"),
  taxInfo: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Geçerli e-posta giriniz").optional().or(z.literal("")),
  address: z.string().optional(),
  category: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  trustScore: z.number().min(0).max(10),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const CATEGORIES = [
  { id: "Yedek Parça", icon: Settings, color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "Aksesuar", icon: HeadphonesIcon, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: "Cihaz", icon: Smartphone, color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "Diğer", icon: Hash, color: "text-muted-foreground", bg: "bg-slate-400/10" },
];

const formatPhone = (val: string) => {
  let raw = val.replace(/\D/g, "");
  if (raw.startsWith("90") && raw.length > 2) raw = raw.slice(2);
  if (raw.startsWith("0")) raw = raw.slice(1);
  if (raw.length > 0 && raw[0] !== '5') {
    const firstFive = raw.indexOf('5');
    if (firstFive !== -1) raw = raw.slice(firstFive);
    else raw = "";
  }
  const d = raw.slice(0, 10);
  if (d.length === 0) return "";
  let f = "+90 (" + d.slice(0, 3);
  if (d.length >= 3) {
    f += ") ";
    if (d.length > 3) f += d.slice(3, 6);
    if (d.length > 6) f += " " + d.slice(6, 10);
  }
  return f;
};

const formatIban = (val: string) => {
  let cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length > 0 && !cleaned.startsWith("TR")) {
    cleaned = "TR" + cleaned;
  }
  let formatted = "";
  for (let i = 0; i < cleaned.length; i++) {
    if (i > 0 && i % 4 === 0) formatted += " ";
    formatted += cleaned[i];
  }
  return formatted.slice(0, 32); // Limit to 26 chars + 6 spaces
};

export function CreateSupplierModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      trustScore: 8.5,
      category: "Aksesuar",
    }
  });

  const trustScore = watch("trustScore");
  const selectedCategory = watch("category");

  const onSubmit = async (data: SupplierFormValues) => {
    startTransition(async () => {
      // Split taxInfo into number / office
      const [taxNum, ...officeParts] = (data.taxInfo || "").split("/");
      const taxNumber = taxNum?.trim() || null;
      const taxOffice = officeParts.join("/").trim() || null;

      // Backend expects trustScore out of 100
      const score = Math.round(data.trustScore * 10);

      const result = await createSupplier({
        name: data.name,
        contact: data.contact || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        category: data.category || null,
        bankName: data.bankName || null,
        iban: data.iban || null,
        notes: data.notes || null,
        trustScore: score,
        taxNumber,
        taxOffice,
      });

      if (result.success) {
        toast.success("Tedarikçi başarıyla kaydedildi.");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error || "Bir hata oluştu.");
      }
    });
  };

  const getRiskLevel = (score: number) => {
    if (score >= 8.5) return { label: 'Stratejik Ortak', color: 'bg-blue-500', bars: 4 };
    if (score >= 6.0) return { label: 'Güvenilir Tedarikçi', color: 'bg-emerald-500', bars: 3 };
    if (score >= 4.0) return { label: 'Standart', color: 'bg-yellow-500', bars: 2 };
    return { label: 'Riskli', color: 'bg-rose-500', bars: 1 };
  };

  const risk = getRiskLevel(trustScore);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="create-supplier-trigger" className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-500/20">
          <Building className="h-4 w-4" />
          <span>Yeni Tedarikçi</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl bg-background border-border/50 p-0 overflow-hidden shadow-2xl [&>button]:hidden">
        <DialogTitle className="font-medium sr-only">Yeni Tedarikçi Ekle</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[90vh] sm:h-[80vh] max-h-[850px]">

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="flex flex-col lg:flex-row gap-6">

              <div className="flex-1 space-y-6">
                <div className="rounded-2xl bg-accent/5 border border-border/50 p-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-sm text-foreground">Kurumsal Kimlik & İletişim</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">FİRMA ADI</Label>
                      <Input id="name" {...register("name")} placeholder="Örn: Teknoloji Lojistik A.Ş." className="bg-background border-border/50 h-10 rounded-xl text-sm text-foreground focus-visible:ring-blue-500" />
                      {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxInfo" className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">VERGİ NO / DAİRESİ</Label>
                      <Input id="taxInfo" {...register("taxInfo")} placeholder="1234567890 / Boğaziçi VD" className="bg-background border-border/50 h-10 rounded-xl text-sm text-foreground focus-visible:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">YETKİLİ KİŞİ</Label>
                      <Input id="contact" {...register("contact")} placeholder="Ad Soyad" className="bg-background border-border/50 h-10 rounded-xl text-sm text-foreground focus-visible:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">TELEFON</Label>
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            placeholder="Telefon..."
                            {...field}
                            value={field.value || ""}
                            onChange={(val) => field.onChange(val)}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    <Label htmlFor="email" className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">E-POSTA ADRESİ</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
                      <Input id="email" type="email" {...register("email")} placeholder="iletisim@tedarikci.com" className="pl-9 bg-background border-border/50 h-10 rounded-xl text-sm text-foreground focus-visible:ring-blue-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">FİRMA AÇIK ADRESİ</Label>
                    <Textarea
                      id="address"
                      {...register("address")}
                      placeholder="Sokak, Mahalle, İlçe/İl detaylarını giriniz..."
                      className="bg-background border-border/50 min-h-[80px] rounded-xl text-sm text-foreground focus-visible:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-accent/5 border border-border/50 p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground">Tedarik Kategorisi</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setValue("category", cat.id)}
                            className={cn(
                              "flex items-center justify-center gap-2 h-10 rounded-xl text-xs transition-all border",
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                : "bg-background border-border/50 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {cat.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-accent/5 border border-border/50 p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <Landmark className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground">Banka Bilgileri</h3>
                    </div>
                    <div className="space-y-3">
                      <Input
                        {...register("bankName")}
                        placeholder="Banka Adı"
                        className="bg-background border-border/50 h-10 rounded-xl text-sm text-foreground focus-visible:ring-blue-500"
                      />
                      <Controller
                        name="iban"
                        control={control}
                        render={({ field }) => (
                          <Input
                            placeholder="IBAN (TR...)"
                            className="bg-background border-border/50 h-10 rounded-xl text-sm text-foreground focus-visible:ring-blue-500 uppercase font-mono"
                            {...field}
                            onChange={(e) => field.onChange(formatIban(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[340px] shrink-0 space-y-6">
                <div className="rounded-2xl bg-accent/5 border border-border/50 p-5">
                  <h3 className="font-medium text-[10px] tracking-wider text-muted-foreground uppercase mb-4">MÜKEMMELLİYET PUANLAMASI</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-foreground">Güvenilirlik Skoru</span>
                    <span className="text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Aktif: {trustScore?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                  <Controller
                    name="trustScore"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        defaultValue={[field.value]}
                        max={10}
                        step={0.1}
                        onValueChange={(vals: number[]) => field.onChange(vals[0])}
                        className="my-5"
                      />
                    )}
                  />
                  <div className="mt-6 rounded-xl bg-background border border-border/50 p-4 text-center">
                    <p className="text-[10px] text-muted-foreground/80 uppercase tracking-widest mb-3">KRİTİKLİK SEVİYESİ</p>
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all duration-300", i < risk.bars ? risk.color : "bg-muted")} />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-2">
                      Bu tedarikçi <span className={cn("text-foreground", risk.color.replace('bg-', 'text-'))}>"{risk.label}"</span> olarak değerlendirilmektedir.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-accent/5 border border-border/50 p-5 flex flex-col h-[200px]">
                  <DialogHeader className="p-0 mb-4">
                    <DialogTitle className="font-medium text-sm text-foreground flex items-center gap-3">
                      <Settings className="h-4 w-4 text-blue-600" />
                      Tedarikçi Notları
                    </DialogTitle>
                  </DialogHeader>
                  <Textarea
                    {...register("notes")}
                    placeholder="Tedarikçi ile ilgili ilk görüşme notları, özel anlaşmalar veya kritik uyarıları buraya ekleyin..."
                    className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] text-muted-foreground/80 uppercase tracking-wider">SİSTEM TARAFINDAN OTOMATİK KAYDEDİLİYOR</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-5 flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Info className="h-3 w-3 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-xs text-indigo-300 mb-1">Hızlı İpucu</h4>
                    <p className="text-xs font-medium text-indigo-400/70 leading-relaxed">
                      Banka bilgilerini IBAN tarayıcı ile otomatik doldurmak için mobil uygulamayı kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:px-6 sm:py-4 border-t border-border/50 bg-background flex items-center justify-between shrink-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="text-muted-foreground hover:text-foreground h-11 px-6 rounded-xl hover:bg-accent/5">
              İptal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20 gap-2 transition-all">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Tedarikçiyi Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



