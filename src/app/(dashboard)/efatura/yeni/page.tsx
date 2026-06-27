"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Plus, Trash2, Send, FileText, Search, UserPlus,
    Hash, Landmark, MapPin, AlertCircle, CheckCircle2, Info,
    Building2, Receipt, Save, Eye, ChevronRight, Zap, Coins,
    Calendar, Mail, Phone, Tag, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TURKEY_CITIES, getDistrictsByCity } from "@/lib/data/turkey-cities";

/* ─── Zod Schema ─── */
const lineSchema = z.object({
    name: z.string().trim().min(1, "Ürün/Hizmet adı zorunludur."),
    quantity: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır."),
    unitPrice: z.coerce.number().nonnegative("Birim fiyat negatif olamaz."),
    vatRate: z.coerce.number().min(0).max(100),
    unitCode: z.string(),
    unitName: z.string(),
});

const invoiceSchema = z.object({
    customerName: z.string().trim().min(2, "Müşteri adı en az 2 karakter olmalıdır."),
    customerVkn: z.string().regex(/^\d{10,11}$/, "VKN 10, TCKN 11 haneli olmalıdır."),
    customerTaxOffice: z.string().trim().min(2, "Vergi dairesi zorunludur."),
    customerAddress: z.string().trim().min(5, "Adres en az 5 karakter olmalıdır."),
    customerCity: z.string().min(1, "İl seçimi zorunludur."),
    customerDistrict: z.string().min(1, "İlçe seçimi zorunludur."),
    customerEmail: z.string().trim().email("Geçerli e-posta giriniz.").optional().or(z.literal("")),
    customerPhone: z.string().trim().optional().or(z.literal("")),
    lines: z.array(lineSchema).min(1, "En az bir kalem eklenmelidir."),
    issueDate: z.string().min(1),
    currency: z.string(),
    note: z.string().trim().optional(),
    invoiceScenario: z.enum(["TEMEL", "TICARI"]),
    invoiceType: z.enum(["SATIS", "IADE", "TEVKIFAT"]),
    prefix: z.string().length(3),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

const defaultInvoice: InvoiceForm = {
    customerName: "",
    customerVkn: "",
    customerTaxOffice: "",
    customerAddress: "",
    customerCity: "",
    customerDistrict: "",
    customerEmail: "",
    customerPhone: "",
    lines: [{ name: "", quantity: 1, unitPrice: 0, vatRate: 20, unitCode: "C62", unitName: "Adet" }],
    issueDate: new Date().toISOString().slice(0, 10),
    currency: "TRY",
    note: "",
    invoiceScenario: "TEMEL",
    invoiceType: "SATIS",
    prefix: "BSR",
};

/* ─── Styles ─── */
const cardClass = "bg-card/40 dark:bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-border/40 dark:border-white/5 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl group/card relative overflow-hidden";
const labelClass = "text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 block ml-1 transition-colors group-hover/card:text-primary";
const inputClass = "h-11 bg-background/50 dark:bg-white/[0.02] border border-border/40 rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-300 hover:border-border/80 focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/5 shadow-none";

export default function EfaturaYeniPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [checkUserResult, setCheckUserResult] = useState<{ isEInvoice: boolean; loading: boolean }>({ isEInvoice: false, loading: false });
    const [edmSettings, setEdmSettings] = useState<any>(null);

    const form = useForm<InvoiceForm>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: defaultInvoice,
        mode: "onChange",
    });

    const { register, control, handleSubmit, setValue, watch, formState: { errors, isValid } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "lines" });

    const watchedLines = watch("lines");
    const watchedCity = watch("customerCity");
    const watchedScenario = watch("invoiceScenario");
    const watchedType = watch("invoiceType");
    const watchedPrefix = watch("prefix");

    // Totals Calculation
    const totals = useMemo(() => {
        return watchedLines.reduce((acc, line) => {
            const sub = (line.quantity || 0) * (line.unitPrice || 0);
            const vat = sub * ((line.vatRate || 0) / 100);
            return {
                subtotal: acc.subtotal + sub,
                vatTotal: acc.vatTotal + vat,
                total: acc.total + sub + vat
            };
        }, { subtotal: 0, vatTotal: 0, total: 0 });
    }, [watchedLines]);

    // Initial Load: Customers & Settings
    useEffect(() => {
        async function init() {
            setLoadingCustomers(true);
            try {
                const [custRes, setRes] = await Promise.all([
                    fetch("/api/customers"),
                    fetch("/api/edm/settings")
                ]);
                const custData = await custRes.json();
                const setData = await setRes.json();

                setCustomers(custData.customers || custData || []);
                setEdmSettings(setData.settings);

                if (setData.settings?.invoicePrefix) {
                    setValue("prefix", setData.settings.invoicePrefix);
                }

            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoadingCustomers(false);
            }
        }
        init();
    }, [setValue]);

    // Check User VKN
    const handleCheckUserVkn = useCallback(async (vkn: string) => {
        if (!vkn || vkn.length < 10) return;
        setCheckUserResult(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch("/api/edm/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vknTckn: vkn }),
            });
            const data = await res.json();
            setCheckUserResult({ isEInvoice: data.isEInvoice, loading: false });

            // Auto update scenario based on membership
            if (data.isEInvoice) {
                setValue("invoiceScenario", "TEMEL");
                toast.info("e-Fatura Mükellefi Tespit Edildi", { description: "Senaryo otomatik güncellendi." });
            } else {
                toast.info("e-Arşiv Mükellefi", { description: "Bu fatura e-Arşiv olarak gönderilecektir." });
            }
        } catch (err) {
            setCheckUserResult({ isEInvoice: false, loading: false });
        }
    }, [setValue]);

    // Form Submission
    const onSubmit = async (values: InvoiceForm) => {
        setSending(true);
        try {
            const year = new Date().getFullYear();
            // Kanka, geçici olarak benzersiz bir ID oluşturuyoruz. 
            // Normalde bu backend'de seq id ile yönetilmeli ama TEST için saniye bazlı unique'lik sağlıyoruz.
            const timestamp = Math.floor(Date.now() / 1000).toString().slice(-9);
            const autoInvoiceId = `${values.prefix}${year}${timestamp}`;

            const res = await fetch("/api/edm/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: autoInvoiceId,
                    issueDate: values.issueDate,
                    currency: values.currency,
                    note: values.note,
                    invoiceScenario: values.invoiceScenario,
                    invoiceType: values.invoiceType,
                    customer: {
                        vknTckn: values.customerVkn,
                        name: values.customerName,
                        address: values.customerAddress,
                        city: values.customerCity,
                        district: values.customerDistrict,
                        taxOffice: values.customerTaxOffice,
                        email: values.customerEmail,
                        phone: values.customerPhone,
                    },
                    items: values.lines.map(line => ({
                        name: line.name,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        vatRate: line.vatRate,
                        unitCode: line.unitCode || "C62"
                    }))
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Fatura Başarıyla Gönderildi", { description: "GİB portalına başarıyla iletildi." });
                router.push(`/efatura/${data.uuid}`);
            } else {
                toast.error("Gönderim Hatası", { description: data.error || "Beklenmedik bir hata oluştu." });
            }
        } catch (err) {
            toast.error("Bağlantı Hatası");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pb-32 animate-in fade-in duration-700">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kurumsal e-Dönüşüm</h1>
                            {edmSettings?.senderName && (
                                <Badge variant="secondary" className="rounded-lg bg-violet-500/10 text-violet-600 border-none font-bold">
                                    {edmSettings.senderName}
                                </Badge>
                            )}
                        </div>
                        <p className="text-slate-500 text-lg">Yeni Elektronik Belge Oluşturma Paneli</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-50 transition-all font-semibold">
                            <Save className="h-4 w-4 mr-2 text-slate-500" />
                            Taslak Olarak Kaydet
                        </Button>
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={sending}
                            className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {sending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Gönderiliyor...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    Faturayı Onayla ve Gönder
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                <FormProvider {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* ──── LEFT COLUMN ───────────────────────────────────── */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* 1. Fatura Ayarları */}
                            <section className={cardClass}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-black tracking-tight text-foreground uppercase">Fatura Ayarları</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label className={labelClass}>Seri / Prefix</Label>
                                        <Select onValueChange={(v) => setValue("prefix", v)} value={watchedPrefix}>
                                            <SelectTrigger className={inputClass}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BSR">BSR (Varsayılan)</SelectItem>
                                                <SelectItem value="ETS">ETS (Satış)</SelectItem>
                                                <SelectItem value="IAD">IAD (İade)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className={labelClass}>Senaryo</Label>
                                        <Select onValueChange={(v: any) => setValue("invoiceScenario", v)} value={watchedScenario}>
                                            <SelectTrigger className={inputClass}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEMEL">Temel Fatura</SelectItem>
                                                <SelectItem value="TICARI">Ticari Fatura</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className={labelClass}>Fatura Tipi</Label>
                                        <Select onValueChange={(v: any) => setValue("invoiceType", v)} value={watchedType}>
                                            <SelectTrigger className={inputClass}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SATIS">Satış</SelectItem>
                                                <SelectItem value="IADE">İade</SelectItem>
                                                <SelectItem value="TEVKIFAT">Tevkifat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className={labelClass}>Fatura Tarihi</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <Input
                                                type="date"
                                                {...register("issueDate")}
                                                className={cn(inputClass, "pl-11")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Müşteri Bilgileri */}
                            <section className={cn(cardClass, "!overflow-visible")}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-sm font-black tracking-tight text-foreground uppercase">Müşteri Bilgileri</h3>
                                    </div>
                                    <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold text-[10px] tracking-wider px-3">
                                        {checkUserResult.isEInvoice ? "E-FATURA MÜKELLEFİ" : "E-ARŞİV"}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-8 relative">
                                        <Label className={labelClass}>Müşteri Adı / Ünvan</Label>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <Input
                                                {...register("customerName")}
                                                className={cn(inputClass, "pl-11")}
                                                placeholder="Müşteri ara veya manuel yaz..."
                                                onFocus={() => setShowSuggestions(true)}
                                                onChange={(e) => {
                                                    register("customerName").onChange(e);
                                                    setCustomerSearch(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                            />
                                            <AnimatePresence>
                                                {showSuggestions && (customerSearch.length >= 2) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                                                    >
                                                        <div className="max-h-64 overflow-y-auto">
                                                            {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map((c, i) => (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    className="w-full px-5 py-3 text-left hover:bg-primary/5 transition-colors flex items-center justify-between group/item"
                                                                    onClick={() => {
                                                                        setValue("customerName", c.name);
                                                                        setValue("customerVkn", c.taxNumber || "");
                                                                        setValue("customerTaxOffice", c.taxOffice || "");
                                                                        setValue("customerAddress", c.address || "");
                                                                        setValue("customerCity", c.city || "");
                                                                        setValue("customerDistrict", c.district || "");
                                                                        setValue("customerEmail", c.email || "");
                                                                        setValue("customerPhone", c.phone || "");
                                                                        setShowSuggestions(false);
                                                                        handleCheckUserVkn(c.taxNumber);
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <p className="font-bold text-sm">{c.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{c.taxNumber || "VKN yok"}</p>
                                                                    </div>
                                                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="md:col-span-4">
                                        <Label className={labelClass}>VKN / TCKN</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <Input
                                                {...register("customerVkn")}
                                                className={cn(inputClass, "pl-11 font-mono tracking-wider")}
                                                placeholder="10/11 haneli"
                                                onBlur={(e) => handleCheckUserVkn(e.target.value)}
                                            />
                                            {checkUserResult.loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                                        </div>
                                    </div>

                                    <div className="md:col-span-4">
                                        <Label className={labelClass}>Vergi Dairesi</Label>
                                        <div className="relative">
                                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <Input {...register("customerTaxOffice")} className={cn(inputClass, "pl-11")} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-4">
                                        <Label className={labelClass}>Şehir</Label>
                                        <Select onValueChange={(v) => {
                                            setValue("customerCity", v);
                                            setValue("customerDistrict", "");
                                        }} value={watchedCity}>
                                            <SelectTrigger className={inputClass}>
                                                <SelectValue placeholder="Seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {TURKEY_CITIES.map(city => <SelectItem key={city.plateCode} value={city.name}>{city.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-4">
                                        <Label className={labelClass}>İlçe</Label>
                                        <Select onValueChange={(v) => setValue("customerDistrict", v)} value={watch("customerDistrict")} disabled={!watchedCity}>
                                            <SelectTrigger className={inputClass}>
                                                <SelectValue placeholder="Seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {getDistrictsByCity(watchedCity || "").map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-12">
                                        <Label className={labelClass}>Adres</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3 h-4 w-4 text-muted-foreground/40" />
                                            <Textarea {...register("customerAddress")} className={cn(inputClass, "pl-11 min-h-[80px] pt-3")} placeholder="Mahalle, Cadde, No..." />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Fatura Kalemleri */}
                            <section className={cardClass}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                                            <Tag className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-sm font-black tracking-tight text-foreground uppercase">Hizmet / Ürün Kalemleri</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ name: "", quantity: 1, unitPrice: 0, vatRate: 20, unitCode: "C62", unitName: "Adet" })}
                                        className="rounded-full border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 gap-2 font-bold text-[10px] h-8"
                                    >
                                        <Plus className="h-3 w-3" /> KALEM EKLE
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {fields.map((field, index) => (
                                            <motion.div
                                                key={field.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl bg-white/[0.03] border border-border/20 group/line"
                                            >
                                                <div className="md:col-span-4">
                                                    <Label className="text-[9px] font-bold text-muted-foreground/40 ml-1 uppercase mb-1 block">Açıklama</Label>
                                                    <Input {...register(`lines.${index}.name`)} className={cn(inputClass, "h-10")} placeholder="Ürün veya Hizmet..." />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-[9px] font-bold text-muted-foreground/40 ml-1 uppercase mb-1 block">Adet</Label>
                                                    <Input type="number" {...register(`lines.${index}.quantity`)} className={cn(inputClass, "h-10")} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-[9px] font-bold text-muted-foreground/40 ml-1 uppercase mb-1 block">Birim Fiyat</Label>
                                                    <Input type="number" {...register(`lines.${index}.unitPrice`)} className={cn(inputClass, "h-10")} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-[9px] font-bold text-muted-foreground/40 ml-1 uppercase mb-1 block">KDV %</Label>
                                                    <Select onValueChange={(v) => setValue(`lines.${index}.vatRate`, parseInt(v))} defaultValue={String(field.vatRate || 20)}>
                                                        <SelectTrigger className={cn(inputClass, "h-10")}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="0">%0</SelectItem>
                                                            <SelectItem value="1">%1</SelectItem>
                                                            <SelectItem value="10">%10</SelectItem>
                                                            <SelectItem value="20">%20</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <Label className="text-[9px] font-bold text-muted-foreground/40 ml-1 uppercase mb-1 block">Birim</Label>
                                                    <Select
                                                        value={watchedLines[index]?.unitName || "Adet"}
                                                        onValueChange={(val) => {
                                                            setValue(`lines.${index}.unitName`, val);
                                                            const unitCodeMap: Record<string, string> = {
                                                                "Adet": "C62",
                                                                "Paket": "PA",
                                                                "Kilo": "KGM",
                                                                "Metre": "MTR",
                                                                "Saat": "HUR",
                                                                "Gün": "DAY",
                                                            };
                                                            setValue(`lines.${index}.unitCode`, unitCodeMap[val] || "C62");
                                                        }}
                                                    >
                                                        <SelectTrigger className={cn(inputClass, "h-10 px-2")}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Adet">Adet</SelectItem>
                                                            <SelectItem value="Paket">Paket</SelectItem>
                                                            <SelectItem value="Kilo">Kilo</SelectItem>
                                                            <SelectItem value="Metre">Metre</SelectItem>
                                                            <SelectItem value="Saat">Saat</SelectItem>
                                                            <SelectItem value="Gün">Gün</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="md:col-span-1 flex items-end justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                        className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        </div>

                        {/* ──── RIGHT COLUMN (Sticky Summary) ───────────────────────── */}
                        <div className="lg:col-span-4 sticky top-10 space-y-6">

                            {/* Summary Card */}
                            <section className={cn(cardClass, "bg-primary/5 border-primary/10 shadow-primary/5")}>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-black tracking-tight text-foreground uppercase">Fatura Özeti</h3>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">Ara Toplam</span>
                                        <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">KDV Toplam</span>
                                        <span className="font-bold text-orange-500">+{formatCurrency(totals.vatTotal)}</span>
                                    </div>
                                    <div className="h-px bg-border/40 my-2" />
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black tracking-widest text-primary uppercase">Genel Toplam</span>
                                            <span className="text-3xl font-black tracking-tighter">
                                                {formatCurrency(totals.total)}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-primary/40 mb-1 ml-1">TRY</span>
                                    </div>
                                </div>


                                <div className="space-y-3">
                                    <Button
                                        type="submit"
                                        disabled={sending || !isValid}
                                        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {sending ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                İŞLENİYOR...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Send className="h-5 w-5" />
                                                FATURAYI GÖNDER
                                            </div>
                                        )}
                                    </Button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-12 rounded-xl font-bold text-xs gap-2 border-border/40 hover:bg-white/5"
                                        >
                                            <Eye className="h-4 w-4" /> ÖNİZLEME
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-12 rounded-xl font-bold text-xs gap-2 border-border/40 hover:bg-white/5"
                                        >
                                            <Save className="h-4 w-4" /> TASLAK
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            <section className={cardClass}>
                                <Label className={labelClass}>Ek Notlar</Label>
                                <Textarea
                                    {...register("note")}
                                    className={cn(inputClass, "min-h-[120px] resize-none")}
                                    placeholder="Faturada görünecek ek notlar..."
                                />
                                <div className="mt-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                    <p className="text-[10px] leading-relaxed text-blue-600/80 font-medium">
                                        GİB mevzuatına göre fatura tarihi bugünden en fazla 7 gün geriye dönük olabilir.
                                    </p>
                                </div>
                            </section>
                        </div>

                    </form>
                </FormProvider>
            </div>
        </div>
    );
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + " TRY";
};
