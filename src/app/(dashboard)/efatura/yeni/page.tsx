"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Send, FileText, Search, UserPlus, Hash, Landmark, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

const lineSchema = z.object({
    name: z.string().min(1, "Ürün/Hizmet adı zorunludur."),
    quantity: z.coerce.number().min(1, "Adet en az 1 olmalıdır."),
    unitPrice: z.coerce.number().min(0.01, "Birim fiyat 0'dan büyük olmalıdır."),
    vatRate: z.coerce.number().min(0).max(100).default(18),
    unitCode: z.string().default("C62"),
});

const invoiceSchema = z.object({
    customerId: z.string().optional(),
    lines: z.array(lineSchema).min(1, "En az bir kalem eklenmelidir."),
    issueDate: z.string().optional(),
    currency: z.string().default("TRY"),
    note: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

type Customer = {
    id: string;
    name: string;
    phone: string;
    taxNumber?: string | null;
    taxOffice?: string | null;
};

export default function EfaturaYeniPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [sending, setSending] = useState(false);

    // Seçili müşterinin VKN/TCKN düzenleme modu
    const [editingTax, setEditingTax] = useState(false);
    const [editTaxNumber, setEditTaxNumber] = useState("");
    const [editTaxOffice, setEditTaxOffice] = useState("");
    const [savingTax, setSavingTax] = useState(false);

    // Manuel müşteri girişi
    const [manualMode, setManualMode] = useState(false);
    const [manualCustomer, setManualCustomer] = useState({
        name: "",
        taxNumber: "",
        taxOffice: "",
        address: "",
    });

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<InvoiceForm>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            currency: "TRY",
            lines: [{ name: "", quantity: 1, unitPrice: 0, vatRate: 18, unitCode: "C62" }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "lines" });
    const lines = watch("lines");

    const totals = lines.reduce(
        (acc, line) => {
            const subtotal = (line.quantity || 0) * (line.unitPrice || 0);
            const vatAmount = subtotal * ((line.vatRate || 18) / 100);
            return {
                subtotal: acc.subtotal + subtotal,
                vatTotal: acc.vatTotal + vatAmount,
                total: acc.total + subtotal + vatAmount,
            };
        },
        { subtotal: 0, vatTotal: 0, total: 0 }
    );

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
                toast.error("Müşteriler yüklenirken hata oluştu.");
            } finally {
                setLoadingCustomers(false);
            }
        }
        loadCustomers();
    }, []);

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

    const onSubmit = async (values: InvoiceForm) => {
        let customerData: any;

        if (manualMode) {
            if (!manualCustomer.name || !manualCustomer.taxNumber) {
                toast.error("Manuel müşteri için ad ve VKN/TCKN zorunludur.");
                return;
            }
            if (manualCustomer.taxNumber.length !== 10 && manualCustomer.taxNumber.length !== 11) {
                toast.error("VKN 10, TCKN 11 haneli olmalıdır.");
                return;
            }
            customerData = {
                customerId: null,
                manualCustomer: {
                    name: manualCustomer.name,
                    taxNumber: manualCustomer.taxNumber,
                    taxOffice: manualCustomer.taxOffice || undefined,
                    address: manualCustomer.address || undefined,
                },
            };
        } else {
            if (!selectedCustomer) {
                toast.error("Lütfen bir müşteri seçin veya manuel giriş yapın.");
                return;
            }
            if (!selectedCustomer.taxNumber) {
                toast.error("Seçili müşterinin VKN/TCKN bilgisi eksik. Lütfen aşağıdan ekleyin.");
                setEditingTax(true);
                setEditTaxNumber("");
                setEditTaxOffice(selectedCustomer.taxOffice || "");
                return;
            }
            customerData = {
                customerId: selectedCustomer.id,
                manualCustomer: null,
            };
        }

        setSending(true);
        try {
            const res = await fetch("/api/edm/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    ...customerData,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Fatura başarıyla gönderildi!");
                router.push(`/efatura/${data.invoice.id}`);
            } else {
                toast.error(data.error || "Fatura gönderimi başarısız.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-8 animate-in fade-in duration-700">
            <PageHeader
                title="Yeni e-Fatura"
                description="Mevcut müşterilerinizden seçim yaparak veya manuel bilgi girerek yeni e-Fatura oluşturun."
                icon={FileText}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Müşteri Seçimi</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setManualMode(!manualMode);
                                    setSelectedCustomer(null);
                                }}
                                className="rounded-xl"
                            >
                                {manualMode ? (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Kayıtlı Müşteriler
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Manuel Giriş
                                    </>
                                )}
                            </Button>
                        </div>

                        {manualMode ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="mc-name">Müşteri Adı / Ünvan</Label>
                                    <Input
                                        id="mc-name"
                                        placeholder="Örn: Ahmet Yılmaz veya ABC LTD. ŞTİ."
                                        value={manualCustomer.name}
                                        onChange={(e) => setManualCustomer({ ...manualCustomer, name: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mc-tax">VKN / TCKN</Label>
                                    <Input
                                        id="mc-tax"
                                        placeholder="10 veya 11 hane"
                                        maxLength={11}
                                        value={manualCustomer.taxNumber}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                                            setManualCustomer({ ...manualCustomer, taxNumber: v });
                                        }}
                                        className="rounded-xl"
                                    />
                                    {manualCustomer.taxNumber && manualCustomer.taxNumber.length !== 10 && manualCustomer.taxNumber.length !== 11 && (
                                        <p className="text-xs text-amber-500">VKN 10, TCKN 11 haneli olmalıdır.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mc-office">Vergi Dairesi</Label>
                                    <Input
                                        id="mc-office"
                                        placeholder="Örn: Beyoğlu"
                                        value={manualCustomer.taxOffice}
                                        onChange={(e) => setManualCustomer({ ...manualCustomer, taxOffice: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="mc-address">Adres</Label>
                                    <Input
                                        id="mc-address"
                                        placeholder="Örn: Test Mahallesi 1. Sokak No:1"
                                        value={manualCustomer.address}
                                        onChange={(e) => setManualCustomer({ ...manualCustomer, address: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Müşteri Ara</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="İsim, telefon veya VKN ile arayın..."
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            className="pl-10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {loadingCustomers ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Müşteriler yükleniyor...
                                    </div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                        {filteredCustomers.length === 0 ? (
                                            <p className="p-4 text-sm text-slate-500">Müşteri bulunamadı. Manuel giriş yapabilirsiniz.</p>
                                        ) : (
                                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredCustomers.map((c) => (
                                                    <li
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(c);
                                                            setValue("customerId", c.id);
                                                        }}
                                                        className={`cursor-pointer p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                                            selectedCustomer?.id === c.id
                                                                ? "bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500"
                                                                : ""
                                                        }`}
                                                    >
                                                        <div className="font-medium">{c.name}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {c.phone}
                                                            {c.taxNumber ? ` • VKN/TCKN: ${c.taxNumber}` : " • VKN/TCKN yok"}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {selectedCustomer && (
                                    <div className="rounded-xl bg-sky-50 p-4 text-sm dark:bg-sky-900/20 space-y-3">
                                        <div>
                                            <strong>Seçili Müşteri:</strong> {selectedCustomer.name}
                                            <br />
                                            <strong>VKN/TCKN:</strong> {selectedCustomer.taxNumber || "—"}
                                            <br />
                                            <strong>Vergi Dairesi:</strong> {selectedCustomer.taxOffice || "—"}
                                        </div>

                                        {(!selectedCustomer.taxNumber || editingTax) && (
                                            <div className="rounded-lg bg-white dark:bg-slate-800 p-3 space-y-3 border border-sky-200 dark:border-sky-800">
                                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                    VKN/TCKN bilgisi eksik. Fatura oluşturmak için lütfen ekleyin:
                                                </p>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">VKN / TCKN</Label>
                                                        <div className="relative">
                                                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                            <Input
                                                                placeholder="10 veya 11 hane"
                                                                maxLength={11}
                                                                value={editTaxNumber}
                                                                onChange={(e) => {
                                                                    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                                                                    setEditTaxNumber(v);
                                                                }}
                                                                className="pl-10 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Vergi Dairesi</Label>
                                                        <div className="relative">
                                                            <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                            <Input
                                                                placeholder="Örn: Beyoğlu"
                                                                value={editTaxOffice}
                                                                onChange={(e) => setEditTaxOffice(e.target.value)}
                                                                className="pl-10 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={savingTax || (editTaxNumber.length !== 10 && editTaxNumber.length !== 11)}
                                                        onClick={async () => {
                                                            setSavingTax(true);
                                                            try {
                                                                const res = await fetch(`/api/customers/${selectedCustomer.id}/tax`, {
                                                                    method: "PATCH",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        taxNumber: editTaxNumber,
                                                                        taxOffice: editTaxOffice,
                                                                    }),
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok) {
                                                                    toast.success("Müşteri bilgileri güncellendi.");
                                                                    setSelectedCustomer({
                                                                        ...selectedCustomer,
                                                                        taxNumber: editTaxNumber,
                                                                        taxOffice: editTaxOffice,
                                                                    });
                                                                    setEditingTax(false);
                                                                } else {
                                                                    toast.error(data.error || "Güncelleme başarısız.");
                                                                }
                                                            } catch (error) {
                                                                toast.error("Bağlantı hatası.");
                                                            } finally {
                                                                setSavingTax(false);
                                                            }
                                                        }}
                                                        className="rounded-xl"
                                                    >
                                                        {savingTax ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Save className="mr-2 h-3 w-3" />
                                                                Kaydet
                                                            </>
                                                        )}
                                                    </Button>
                                                    {selectedCustomer.taxNumber && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingTax(false);
                                                                setEditTaxNumber(selectedCustomer.taxNumber || "");
                                                                setEditTaxOffice(selectedCustomer.taxOffice || "");
                                                            }}
                                                            className="rounded-xl"
                                                        >
                                                            İptal
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fatura Kalemleri</h3>
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 md:grid-cols-6"
                            >
                                <div className="md:col-span-2">
                                    <Label>Ürün/Hizmet</Label>
                                    <Input
                                        {...register(`lines.${index}.name`)}
                                        placeholder="Örn: Ekran Değişimi"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>Adet</Label>
                                    <Input
                                        type="number"
                                        {...register(`lines.${index}.quantity`)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>Birim Fiyat</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register(`lines.${index}.unitPrice`)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>KDV %</Label>
                                    <Input
                                        type="number"
                                        {...register(`lines.${index}.vatRate`)}
                                        className="rounded-xl"
                                    />
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
                                append({ name: "", quantity: 1, unitPrice: 0, vatRate: 18, unitCode: "C62" })
                            }
                            className="rounded-xl"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Kalem Ekle
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fatura Detayları</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Düzenleme Tarihi</Label>
                                <Input
                                    type="date"
                                    {...register("issueDate")}
                                    defaultValue={new Date().toISOString().slice(0, 10)}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Para Birimi</Label>
                                <Input {...register("currency")} disabled className="rounded-xl" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Not</Label>
                                <Textarea
                                    {...register("note")}
                                    placeholder="Fatura notu..."
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
                            <div className="flex justify-between text-sm">
                                <span>Ara Toplam:</span>
                                <span className="font-medium">{totals.subtotal.toFixed(2)} TRY</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>KDV Toplam:</span>
                                <span className="font-medium">{totals.vatTotal.toFixed(2)} TRY</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <span>Genel Toplam:</span>
                                <span>{totals.total.toFixed(2)} TRY</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={sending}
                        className="h-12 rounded-2xl bg-slate-950 text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Faturayı Gönder
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
