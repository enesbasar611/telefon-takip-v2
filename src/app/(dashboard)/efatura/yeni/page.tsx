"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
    Loader2, Plus, Trash2, Send, FileText, Search, UserPlus,
    Hash, Landmark, MapPin, AlertCircle, CheckCircle2, Info, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TURKEY_CITIES, getDistrictsByCity } from "@/lib/data/turkey-cities";

/* ─── Zod Schema — Profesyonel Validasyon ─── */

const lineSchema = z.object({
    name: z.string().trim().min(1, "Ürün/Hizmet adı zorunludur.").max(200, "En fazla 200 karakter."),
    quantity: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır.").max(999999, "Çok büyük."),
    unitPrice: z.coerce.number().nonnegative("Birim fiyat negatif olamaz.").max(999999999.99, "Çok büyük."),
    vatRate: z.coerce.number().min(0, "KDV negatif olamaz.").max(100, "KDV %100'ü geçemez."),
    unitCode: z.string().default("C62"),
    unitName: z.string().default("Adet"),
});

const invoiceSchema = z.object({
    customerId: z.string().optional(),
    customerName: z.string().trim().min(2, "Müşteri adı en az 2 karakter olmalıdır.").max(200, "Çok uzun."),
    customerVkn: z.string().regex(/^\d{10}$|^\d{11}$/, "VKN 10, TCKN 11 haneli rakam olmalıdır."),
    customerTaxOffice: z.string().trim().min(2, "Vergi dairesi zorunludur.").max(100, "Çok uzun."),
    customerAddress: z.string().trim().min(5, "Adres en az 5 karakter olmalıdır.").max(250, "Çok uzun."),
    customerCity: z.string().min(1, "İl seçimi zorunludur."),
    customerDistrict: z.string().min(1, "İlçe seçimi zorunludur."),
    customerEmail: z.string().trim().email("Geçerli e-posta giriniz.").optional().or(z.literal("")),
    customerPhone: z.string().trim().regex(/^\+?\d{10,15}$/, "Geçerli telefon numarası.").optional().or(z.literal("")),
    lines: z.array(lineSchema).min(1, "En az bir kalem eklenmelidir.").max(100, "En fazla 100 kalem."),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG formatında olmalıdır."),
    currency: z.string().default("TRY"),
    note: z.string().trim().max(500, "Not en fazla 500 karakter.").optional(),
    invoiceScenario: z.enum(["TEMEL", "TICARI"]).default("TEMEL"),
    invoiceType: z.enum(["SATIS", "IADE", "TEVKIFAT"]).default("SATIS"),
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
};

type Customer = {
    id: string;
    name: string;
    phone: string;
    taxNumber?: string | null;
    taxOffice?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
};

/**
 * Yeni e-Fatura Oluşturma Sayfası
 * GİB/EDM mevzuatına tam uyumlu, SaaS standartlarında tasarlanmış
 */
export default function EfaturaYeniPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [sending, setSending] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [checkUserResult, setCheckUserResult] = useState<{ isEInvoice: boolean; alias?: string; loading: boolean }>({ isEInvoice: false, loading: false });
    const [edmActive, setEdmActive] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkEdm() {
            try {
                const res = await fetch("/api/edm/settings");
                const data = await res.json();
                const isActive = data.settings?.edmActive === true || data.edmActive === true;
                setEdmActive(isActive);
                if (!isActive) {
                    toast.error("e-Fatura modülü aktif değil.");
                    router.push("/efatura");
                }
            } catch {
                setEdmActive(false);
                router.push("/efatura");
            }
        }
        checkEdm();
    }, [router]);

    const handleCheckUser = async (targetVkn: string) => {
        if (!edmActive || targetVkn.length !== 10 && targetVkn.length !== 11) return;
        setCheckUserResult(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch("/api/edm/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vknTckn: targetVkn }),
            });
            const data = await res.json();
            if (res.ok) {
                setCheckUserResult({ isEInvoice: data.isEInvoice, alias: data.alias, loading: false });
            } else {
                setCheckUserResult({ isEInvoice: false, loading: false });
            }
        } catch {
            setCheckUserResult({ isEInvoice: false, loading: false });
        }
    };



    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<InvoiceForm>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: defaultInvoice,
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({ control, name: "lines" });
    const lines = watch("lines");
    const customerCity = watch("customerCity");
    const invoiceScenario = watch("invoiceScenario");
    const invoiceType = watch("invoiceType");

    // Hesapla: Ara Toplam, KDV, Genel Toplam
    const totals = lines.reduce(
        (acc, line) => {
            const qty = Number(line.quantity) || 0;
            const price = Number(line.unitPrice) || 0;
            const vat = Number(line.vatRate) || 0;
            const subtotal = qty * price;
            const vatAmount = subtotal * (vat / 100);
            return {
                subtotal: acc.subtotal + subtotal,
                vatTotal: acc.vatTotal + vatAmount,
                total: acc.total + subtotal + vatAmount,
            };
        },
        { subtotal: 0, vatTotal: 0, total: 0 }
    );

    // Müşterileri yükle
    useEffect(() => {
        async function loadCustomers() {
            setLoadingCustomers(true);
            try {
                const res = await fetch("/api/customers");
                const data = await res.json();
                const list = Array.isArray(data) ? data : data.customers || [];
                setCustomers(list);
                setFilteredCustomers(list);
            } catch (error) {
                console.error("[Efatura] Müşteriler yüklenirken hata:", error);
                toast.error("Müşteriler yüklenirken hata oluştu.");
            } finally {
                setLoadingCustomers(false);
            }
        }
        loadCustomers();
    }, []);

    // Müşteri arama filtresi
    useEffect(() => {
        if (!customerSearch.trim()) {
            setFilteredCustomers(customers);
            return;
        }
        const q = customerSearch.toLowerCase();
        setFilteredCustomers(
            customers.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.phone.includes(q) ||
                    (c.taxNumber || "").includes(q)
            )
        );
    }, [customerSearch, customers]);

    // Müşteri seçildiğinde formu doldur
    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setValue("customerName", customer.name);
        setValue("customerVkn", customer.taxNumber || "");
        setValue("customerTaxOffice", customer.taxOffice || "");
        setValue("customerAddress", customer.address || "");
        setValue("customerCity", customer.city || "");
        setValue("customerDistrict", customer.district || "");
        setValidationErrors({});
    };

    const onSubmit = async (values: InvoiceForm) => {
        setSending(true);
        setValidationErrors({});

        try {
            console.log("[Efatura] Fatura gönderiliyor:", {
                invoiceId: `INV-${Date.now()}`,
                scenario: values.invoiceScenario,
                type: values.invoiceType,
                items: values.lines.length,
            });

            const res = await fetch("/api/edm/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: `INV-${Date.now()}`,
                    issueDate: values.issueDate,
                    currency: values.currency,
                    note: values.note || undefined,
                    invoiceScenario: values.invoiceScenario,
                    invoiceType: values.invoiceType,
                    customer: {
                        vknTckn: values.customerVkn,
                        name: values.customerName,
                        address: values.customerAddress,
                        city: values.customerCity,
                        district: values.customerDistrict,
                        taxOffice: values.customerTaxOffice,
                        email: values.customerEmail || undefined,
                        phone: values.customerPhone || undefined,
                    },
                    items: values.lines.map((line) => ({
                        name: line.name,
                        quantity: Number(line.quantity),
                        unitPrice: Number(line.unitPrice),
                        vatRate: Number(line.vatRate),
                        unitCode: line.unitCode || "C62",
                        unitName: line.unitName || "Adet",
                    })),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                console.log("[Efatura] Fatura gönderimi başarılı:", data);
                toast.success("✓ Fatura başarıyla oluşturuldu ve GİB'e gönderildi!");
                // Başarılı sonra fatura detay sayfasına yönlendir
                setTimeout(() => {
                    router.push(`/efatura/${data.invoiceId}`);
                }, 1000);
            } else {
                console.error("[Efatura] Fatura gönderimi başarısız:", data);

                // Detaylı hata mesajlarını göster - her hata ayrı toast
                if (data.details && Array.isArray(data.details)) {
                    const errorMap: Record<string, string> = {};
                    data.details.forEach((err: any) => {
                        errorMap[err.field] = err.message;
                        // Her hatayı ayrı toast olarak göster
                        toast.error(err.message || "Validasyon hatası");
                    });
                    setValidationErrors(errorMap);
                } else {
                    toast.error(data.error || "Fatura gönderimi başarısız oldu.");
                }
            }
        } catch (error: any) {
            console.error("[Efatura] Bağlantı hatası:", error);
            toast.error("Sunucuyla bağlantı kurulamadı. Lütfen bağlantınızı kontrol edin.");
        } finally {
            setSending(false);
        }
    };

    const districtOptions = getDistrictsByCity(customerCity || "");

    if (edmActive === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
            </div>
        );
    }

    if (edmActive === false) return null;

    return (
        <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="Yeni e-Fatura Oluştur"
                description="GİB/EDM standartlarında e-fatura oluşturun ve EMail olarak gönderin"
                icon={FileText}
            />

            {/* Bilgi Notu */}
            <div className="border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    e-Fatura {invoiceScenario === "TEMEL" ? "TEMEL" : "TİCARİ"} senaryo,
                    {invoiceType === "SATIS" ? " SATIŞ" : invoiceType === "IADE" ? " İADE" : " TEVKİFAT"} tipinde oluşturulacaktır.
                    Tüm bilgilerin doğru olduğundan emin olun.
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FATURA AYARLARI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b border-slate-200 dark:border-slate-800">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Fatura Ayarları
                        </CardTitle>
                        <CardDescription>Fatura senaryosu, tipi ve tarihini belirleyin</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 dark:text-slate-300">Fatura Senaryosu *</Label>
                                <Select
                                    value={invoiceScenario}
                                    onValueChange={(val) => setValue("invoiceScenario", val as "TEMEL" | "TICARI")}
                                >
                                    <SelectTrigger className="rounded-lg border-slate-300 dark:border-slate-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEMEL">
                                            <span className="font-medium">TEMEL FATURA</span>
                                            <span className="text-xs text-slate-500 ml-2">(Basit faturalar)</span>
                                        </SelectItem>
                                        <SelectItem value="TICARI">
                                            <span className="font-medium">TİCARİ FATURA</span>
                                            <span className="text-xs text-slate-500 ml-2">(Intrastat, KDV detaylı)</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {invoiceScenario === "TEMEL"
                                        ? "Standart faturalandırma için"
                                        : "Dış ticaret işlemleri için"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 dark:text-slate-300">Fatura Tipi *</Label>
                                <Select
                                    value={invoiceType}
                                    onValueChange={(val) => setValue("invoiceType", val as "SATIS" | "IADE" | "TEVKIFAT")}
                                >
                                    <SelectTrigger className="rounded-lg border-slate-300 dark:border-slate-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SATIS">SATIŞ</SelectItem>
                                        <SelectItem value="IADE">İADE FATURASI</SelectItem>
                                        <SelectItem value="TEVKIFAT">TEVKİFAT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 dark:text-slate-300" htmlFor="issueDate">
                                    Fatura Tarihi *
                                </Label>
                                <Input
                                    id="issueDate"
                                    type="date"
                                    {...register("issueDate")}
                                    className="rounded-lg border-slate-300 dark:border-slate-600 font-medium"
                                />
                                {errors.issueDate && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.issueDate.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MÜŞTERI BİLGİLERİ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
                                <CardDescription>Faturalandırılan müşteri/alıcı bilgileri girin</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setManualMode(!manualMode);
                                    setSelectedCustomer(null);
                                }}
                                className="rounded-lg"
                            >
                                {manualMode ? (
                                    <><Search className="mr-1 h-4 w-4" /> Kayıtlı Müşteri</>
                                ) : (
                                    <><UserPlus className="mr-1 h-4 w-4" /> Manuel Giriş</>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {!manualMode && (
                            <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                                <Label className="font-semibold">Müşteri Ara</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="İsim, telefon veya VKN ile arain..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="pl-10 rounded-lg border-slate-300 dark:border-slate-600"
                                    />
                                </div>
                                {loadingCustomers ? (
                                    <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Müşteriler yükleniyor...
                                    </div>
                                ) : filteredCustomers.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950">
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredCustomers.map((c) => (
                                                <li
                                                    key={c.id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${selectedCustomer?.id === c.id
                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                                                        : ""
                                                        }`}
                                                >
                                                    <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {c.phone} {c.taxNumber && `• VKN/TCKN: ${c.taxNumber}`}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 py-3 text-center">Müşteri bulunamadı.</p>
                                )}
                            </div>
                        )}

                        {/* Müşteri Formu */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="customerName" className="font-semibold text-slate-700 dark:text-slate-300">
                                    Müşteri Adı / Ünvan *
                                </Label>
                                <Input
                                    id="customerName"
                                    {...register("customerName")}
                                    placeholder="Örn: ABC Ltd. Şti."
                                    className="rounded-lg border-slate-300 dark:border-slate-600"
                                />
                                {(errors.customerName || validationErrors.customerName) && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerName?.message || validationErrors.customerName}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customerVkn" className="font-semibold text-slate-700 dark:text-slate-300">
                                    VKN / TCKN *
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="customerVkn"
                                        {...register("customerVkn")}
                                        placeholder="10 veya 11 hane"
                                        maxLength={11}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                                            setValue("customerVkn", v);
                                            setCheckUserResult({ isEInvoice: false, loading: false });
                                            if (v.length === 10 || v.length === 11) {
                                                handleCheckUser(v);
                                            }
                                        }}
                                        className="pl-10 rounded-lg border-slate-300 dark:border-slate-600 font-mono"
                                    />
                                </div>
                                {(errors.customerVkn || validationErrors.customerVkn) && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerVkn?.message || validationErrors.customerVkn}
                                    </p>
                                )}
                                {checkUserResult.loading && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Mukellefiyet sorgulaniyor...
                                    </p>
                                )}
                                {!checkUserResult.loading && watch("customerVkn")?.length >= 10 && (
                                    <div className="mt-1">
                                        {checkUserResult.isEInvoice ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                                                <CheckCircle2 className="h-3 w-3" />
                                                e-Fatura Mukellefi
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                                                <Info className="h-3 w-3" />
                                                e-Arsiv Faturasi
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customerTaxOffice" className="font-semibold text-slate-700 dark:text-slate-300">
                                    Vergi Dairesi *
                                </Label>
                                <div className="relative">
                                    <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="customerTaxOffice"
                                        {...register("customerTaxOffice")}
                                        placeholder="Örn: Beyoğlu Vergi Dairesi"
                                        className="pl-10 rounded-lg border-slate-300 dark:border-slate-600"
                                    />
                                </div>
                                {(errors.customerTaxOffice || validationErrors.customerTaxOffice) && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerTaxOffice?.message || validationErrors.customerTaxOffice}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="customerAddress" className="font-semibold text-slate-700 dark:text-slate-300">
                                    Adres *
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="customerAddress"
                                        {...register("customerAddress")}
                                        placeholder="Örn: Karakoy Mahallesi, Galata Caddesi No:1"
                                        className="pl-10 rounded-lg border-slate-300 dark:border-slate-600"
                                    />
                                </div>
                                {(errors.customerAddress || validationErrors.customerAddress) && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerAddress?.message || validationErrors.customerAddress}
                                    </p>
                                )}
                            </div>

                            {/* İL / İLÇE İKİLİ DİNAMİK SELECT */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 dark:text-slate-300">İl *</Label>
                                <Select
                                    value={customerCity}
                                    onValueChange={(val) => {
                                        setValue("customerCity", val);
                                        setValue("customerDistrict", "");
                                    }}
                                >
                                    <SelectTrigger className="rounded-lg border-slate-300 dark:border-slate-600">
                                        <SelectValue placeholder="İl seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {TURKEY_CITIES.map((city) => (
                                            <SelectItem key={city.plateCode} value={city.name}>
                                                {city.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.customerCity && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerCity.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 dark:text-slate-300">İlçe *</Label>
                                <Select
                                    value={watch("customerDistrict")}
                                    onValueChange={(val) => setValue("customerDistrict", val)}
                                    disabled={!customerCity}
                                >
                                    <SelectTrigger className="rounded-lg border-slate-300 dark:border-slate-600 disabled:opacity-50">
                                        <SelectValue placeholder={customerCity ? "İlçe seçin" : "Önce il seçin"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {districtOptions.map((district) => (
                                            <SelectItem key={district} value={district}>
                                                {district}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.customerDistrict && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerDistrict.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customerEmail" className="font-semibold text-slate-700 dark:text-slate-300">
                                    E-Posta (İsteğe Bağlı)
                                </Label>
                                <Input
                                    id="customerEmail"
                                    type="email"
                                    {...register("customerEmail")}
                                    placeholder="ornek@firma.com.tr"
                                    className="rounded-lg border-slate-300 dark:border-slate-600"
                                />
                                {errors.customerEmail && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerEmail.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customerPhone" className="font-semibold text-slate-700 dark:text-slate-300">
                                    Telefon (İsteğe Bağlı)
                                </Label>
                                <Input
                                    id="customerPhone"
                                    {...register("customerPhone")}
                                    placeholder="+90 212 XXX XX XX"
                                    className="rounded-lg border-slate-300 dark:border-slate-600"
                                />
                                {errors.customerPhone && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.customerPhone.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fatura Üst Bilgileri */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fatura Bilgileri</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Fatura Senaryosu *</Label>
                                <Select
                                    value={watch("invoiceScenario") || "TEMEL"}
                                    onValueChange={(val) => setValue("invoiceScenario", val as "TEMEL" | "TICARI")}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Senaryo seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEMEL">TEMEL FATURA</SelectItem>
                                        <SelectItem value="TICARI">TİCARİ FATURA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fatura Tipi *</Label>
                                <Select
                                    value={watch("invoiceType") || "SATIS"}
                                    onValueChange={(val) => setValue("invoiceType", val as "SATIS" | "IADE" | "TEVKIFAT")}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Tip seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SATIS">SATIŞ</SelectItem>
                                        <SelectItem value="IADE">İADE</SelectItem>
                                        <SelectItem value="TEVKIFAT">TEVKİFAT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="issueDate">Fatura Tarihi *</Label>
                                <Input
                                    id="issueDate"
                                    type="date"
                                    {...register("issueDate")}
                                    className="rounded-xl"
                                />
                                {errors.issueDate && (
                                    <p className="text-xs text-red-500">{errors.issueDate.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fatura Kalemleri */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fatura Kalemleri</h3>
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 md:grid-cols-6"
                            >
                                <div className="md:col-span-2">
                                    <Label className="text-xs">Ürün/Hizmet *</Label>
                                    <Input
                                        {...register(`lines.${index}.name`)}
                                        placeholder="Örn: Ekran Değişimi"
                                        className="rounded-xl"
                                    />
                                    {errors.lines?.[index]?.name && (
                                        <p className="text-xs text-red-500">{errors.lines[index]?.name?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs">Adet *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        {...register(`lines.${index}.quantity`)}
                                        className="rounded-xl"
                                    />
                                    {errors.lines?.[index]?.quantity && (
                                        <p className="text-xs text-red-500">{errors.lines[index]?.quantity?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs">Birim Fiyat *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min={0.01}
                                        {...register(`lines.${index}.unitPrice`)}
                                        className="rounded-xl"
                                    />
                                    {errors.lines?.[index]?.unitPrice && (
                                        <p className="text-xs text-red-500">{errors.lines[index]?.unitPrice?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs">KDV % *</Label>
                                    <Select
                                        value={watch(`lines.${index}.vatRate`)?.toString() || "20"}
                                        onValueChange={(val) => setValue(`lines.${index}.vatRate`, parseInt(val))}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="KDV %" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">%0</SelectItem>
                                            <SelectItem value="1">%1</SelectItem>
                                            <SelectItem value="10">%10</SelectItem>
                                            <SelectItem value="20">%20</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.lines?.[index]?.vatRate && (
                                        <p className="text-xs text-red-500">{errors.lines[index]?.vatRate?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs">Birim *</Label>
                                    <Select
                                        value={watch(`lines.${index}.unitName`) || "Adet"}
                                        onValueChange={(val) => {
                                            setValue(`lines.${index}.unitName`, val);
                                            const unitCodeMap: Record<string, string> = {
                                                "Adet": "C62",
                                                "Paket": "PA",
                                                "Kilo": "KGM",
                                                "Metre": "MTR",
                                                "Saat": "HUR",
                                                "Gün": "DAY",
                                                "Ay": "MON",
                                            };
                                            setValue(`lines.${index}.unitCode`, unitCodeMap[val] || "C62");
                                        }}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Birim" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Adet">Adet</SelectItem>
                                            <SelectItem value="Paket">Paket</SelectItem>
                                            <SelectItem value="Kilo">Kilo</SelectItem>
                                            <SelectItem value="Metre">Metre</SelectItem>
                                            <SelectItem value="Saat">Saat</SelectItem>
                                            <SelectItem value="Gün">Gün</SelectItem>
                                            <SelectItem value="Ay">Ay</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <p className="text-xs text-muted-foreground mb-1">Toplam</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {formatCurrency(
                                            (watch(`lines.${index}.quantity`) || 0) *
                                            (watch(`lines.${index}.unitPrice`) || 0) *
                                            (1 + (watch(`lines.${index}.vatRate`) || 0) / 100)
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                append({ name: "", quantity: 1, unitPrice: 0, vatRate: 20, unitCode: "C62", unitName: "Adet" })
                            }
                            className="rounded-xl"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Kalem Ekle
                        </Button>
                    </CardContent>
                </Card>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ÖZETLEYİCİ / TOTALLERİ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b border-slate-200 dark:border-slate-800">
                        <CardTitle className="text-lg">Matematiksel Özet</CardTitle>
                        <CardDescription>Otomatik olarak hesaplanan toplamlar</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-3 mb-4">
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700 dark:text-slate-300">Para Birimi</Label>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                        {watch("currency")}
                                    </span>
                                </div>
                            </div>
                            {/* Para birimi readonly */}
                        </div>

                        {/* Matematiksel Toplam Tablosı */}
                        <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ara Toplam (KDV Hariç):</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(totals.subtotal)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Toplam KDV:</span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    +{formatCurrency(totals.vatTotal)}
                                </span>
                            </div>

                            <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-extrabold text-slate-900 dark:text-white">Genel Toplam (KDV Dahil):</span>
                                    <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                                        {formatCurrency(totals.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notlar */}
                        <div className="space-y-2 pt-4">
                            <Label htmlFor="note" className="font-semibold text-slate-700 dark:text-slate-300">
                                Fatura Notu (İsteğe Bağlı)
                            </Label>
                            <Textarea
                                id="note"
                                {...register("note")}
                                placeholder="Ödeme koşulları, teslimat bilgileri, şirket kuralları vb. eklenebilir..."
                                rows={3}
                                className="rounded-lg border-slate-300 dark:border-slate-600"
                            />
                            {errors.note && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.note.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ GÖNDERİM DÜĞMESI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="rounded-lg"
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        disabled={sending || !isValid}
                        className="h-11 px-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                E-Faturayı GİB'e Gönder
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
