"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Edit, Loader2, Package, Barcode, TrendingUp, AlertTriangle, MapPin, Settings2, Truck } from "lucide-react";
import { updateProduct } from "@/lib/actions/product-actions";
import { resolveAIAlertsForProduct } from "@/lib/actions/stock-ai-actions";
import { toast } from "sonner";
import { PriceInput } from "@/components/ui/price-input";
import { formatCurrency } from "@/lib/utils";
import { getInventoryFormFields, extractCoreAndAttributes, getIndustryLabel } from "@/lib/industry-utils";
import { FormFactory } from "@/components/common/form-factory";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

const productSchema = z.object({
    name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
    categoryId: z.string().min(1, "Kategori seçiniz"),
    supplierId: z.string().optional(),
    buyPrice: z.string().min(1, "Alış fiyatı gereklidir"),
    buyPriceUsd: z.string().optional(),
    sellPrice: z.string().min(1, "Satış fiyatı gereklidir"),
    sellPriceUsd: z.string().optional(),
    stock: z.string().min(1, "Stok miktarı gereklidir"),
    criticalStock: z.string().min(1, "Kritik stok gereklidir"),
    barcode: z.string().optional(),
    location: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface EditProductModalProps {
    product: any;
    categories: any[];
    suppliers?: any[];
    isOpen: boolean;
    onClose: () => void;
    shop?: any;
}

export function EditProductModal({ product, categories, suppliers = [], isOpen, onClose, shop }: EditProductModalProps) {
    const { rates: exchangeRates, defaultCurrency } = useDashboardData();
    const [isPending, startTransition] = useTransition();
    const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">(defaultCurrency);

    useEffect(() => {
        if (defaultCurrency) {
            setCurrency(defaultCurrency as any);
        }
    }, [defaultCurrency]);

    const industryFields = getInventoryFormFields(shop);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors },
        reset,
    } = useForm<any>({
        resolver: zodResolver(productSchema.passthrough()),
    });

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                categoryId: product.categoryId,
                buyPrice: product.buyPrice.toString(),
                buyPriceUsd: product.buyPriceUsd?.toString() || "",
                sellPrice: product.sellPrice.toString(),
                sellPriceUsd: product.sellPriceUsd?.toString() || "",
                stock: product.stock.toString(),
                criticalStock: product.criticalStock.toString(),
                barcode: product.barcode || "",
                location: product.location || "",
                supplierId: product.supplierId || "none",
                ...(product.attributes || {}),
            });
        }
    }, [product, reset]);

    const handlePriceChange = (type: "buy" | "sell", value: number) => {
        const rate = currency === "USD" ? (exchangeRates?.usd || 34) : currency === "EUR" ? (exchangeRates?.eur || 37) : 1;

        if (type === "buy") {
            if (currency === "TRY") {
                setValue("buyPrice", String(value));
                setValue("buyPriceUsd", (value / (exchangeRates?.usd || 34)).toFixed(2));
            } else if (currency === "USD") {
                setValue("buyPriceUsd", String(value));
                setValue("buyPrice", Math.ceil(value * (exchangeRates?.usd || 34)).toString());
            } else if (currency === "EUR") {
                const tlVal = Math.ceil(value * (exchangeRates?.eur || 37));
                setValue("buyPrice", String(tlVal));
                setValue("buyPriceUsd", (tlVal / (exchangeRates?.usd || 34)).toFixed(2));
            }
        } else {
            if (currency === "TRY") {
                setValue("sellPrice", String(value));
                setValue("sellPriceUsd", (value / (exchangeRates?.usd || 34)).toFixed(2));
            } else if (currency === "USD") {
                setValue("sellPriceUsd", String(value));
                setValue("sellPrice", Math.ceil(value * (exchangeRates?.usd || 34)).toString());
            } else if (currency === "EUR") {
                const tlVal = Math.ceil(value * (exchangeRates?.eur || 37));
                setValue("sellPrice", String(tlVal));
                setValue("sellPriceUsd", (tlVal / (exchangeRates?.usd || 34)).toFixed(2));
            }
        }
    };

    const getDisplayPrice = (type: "buy" | "sell") => {
        const val = watch(type === "buy" ? "buyPrice" : "sellPrice");
        const valUsd = watch(type === "buy" ? "buyPriceUsd" : "sellPriceUsd");

        if (currency === "TRY") return val;
        if (currency === "USD") return valUsd || (Number(val) / (exchangeRates?.usd || 34)).toFixed(2);
        if (currency === "EUR") return (Number(val) / (exchangeRates?.eur || 37)).toFixed(2);
        return val;
    };

    const onSubmit = async (data: any) => {
        startTransition(async () => {
            const { name, barcode, location, attributes } = extractCoreAndAttributes(industryFields, data);

            const result = await updateProduct(product.id, {
                name: name || data.name,
                categoryId: data.categoryId,
                supplierId: data.supplierId === "none" ? null : data.supplierId,
                buyPrice: Number(data.buyPrice),
                buyPriceUsd: data.buyPriceUsd ? Number(data.buyPriceUsd) : null,
                sellPrice: Number(data.sellPrice),
                sellPriceUsd: data.sellPriceUsd ? Number(data.sellPriceUsd) : null,
                stock: Number(data.stock),
                criticalStock: Number(data.criticalStock),
                barcode: barcode || data.barcode,
                location: location || data.location,
                attributes,
            });

            if (result.success) {
                await resolveAIAlertsForProduct(product.id);
                toast.success("Ürün başarıyla güncellendi.");
                onClose();
            } else {
                toast.error("Ürün güncellenirken bir hata oluştu.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[650px] bg-card border-border/50 p-0 overflow-hidden shadow-2xl rounded-3xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-6 md:p-8 space-y-6 md:space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                    <Edit className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <DialogTitle className="font-bold text-2xl text-foreground tracking-tight">{getIndustryLabel(shop, "inventory")} Düzenle</DialogTitle>
                                    <DialogDescription className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mt-1">
                                        Ürün Detaylarını ve Stok Durumunu Yönetin
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="name" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1">{getIndustryLabel(shop, "productLabel")} Adı</Label>
                                <Input id="name" {...register("name")} className="bg-muted/30 border-border/60 rounded-2xl h-14 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 text-foreground" />
                                {errors.name && <p className="text-[10px] text-rose-500 font-bold ">{String(errors.name.message || "")}</p>}
                            </div>

                            <div className="bg-muted/30 p-6 md:p-8 rounded-[2rem] border border-border/60 space-y-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Package className="h-24 w-24 text-blue-500 -mr-8 -mt-8" />
                                </div>
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Settings2 className="h-3 w-3 text-blue-500" /> Teknik Özellikler
                                </h4>
                                <FormFactory
                                    fields={industryFields}
                                    register={register}
                                    control={control}
                                    errors={errors}
                                    twoCol={true}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1">Kategori</Label>
                                    <Select onValueChange={(val) => setValue("categoryId", val)} defaultValue={product?.categoryId}>
                                        <SelectTrigger className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border/50">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-xs py-3">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="barcode" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Barcode className="h-3 w-3" /> Barkod
                                    </Label>
                                    <Input id="barcode" {...register("barcode")} className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium" />
                                </div>
                            </div>

                            <div className="space-y-5 bg-muted/20 p-5 rounded-[2rem] border border-border/40">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                    <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-blue-500" /> Fiyatlandırma ({currency})
                                    </h4>
                                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
                                        {(["TRY", "USD", "EUR"] as const).map((c) => (
                                            <Button
                                                key={c}
                                                type="button"
                                                size="sm"
                                                variant={currency === c ? "default" : "ghost"}
                                                onClick={() => setCurrency(c)}
                                                className={`h-8 px-4 text-[10px] font-bold rounded-lg transition-all ${currency === c
                                                    ? c === "TRY" ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                                                        : c === "USD" ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                                                            : "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20"
                                                    : "text-muted-foreground hover:text-foreground"}`}
                                            >
                                                {c === "TRY" ? "₺ TRY" : c === "USD" ? "$ USD" : "€ EUR"}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="buyPrice" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1">Alış Fiyatı</Label>
                                        <PriceInput
                                            id="buyPrice"
                                            value={getDisplayPrice("buy")}
                                            onChange={(v) => handlePriceChange("buy", Number(v))}
                                            prefix={currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                                            className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-semibold"
                                        />
                                        {currency !== "TRY" && (
                                            <p className="text-[10px] font-bold text-muted-foreground/60 px-2 italic">
                                                ≈ {formatCurrency(Number(watch("buyPrice")))} TL
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="sellPrice" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1">Satış Fiyatı</Label>
                                        <PriceInput
                                            id="sellPrice"
                                            value={getDisplayPrice("sell")}
                                            onChange={(v) => handlePriceChange("sell", Number(v))}
                                            prefix={currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                                            className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl h-14 text-sm text-emerald-600 font-bold"
                                        />
                                        {currency !== "TRY" && (
                                            <p className="text-[10px] font-bold text-emerald-600/60 px-2 italic">
                                                ≈ {formatCurrency(Number(watch("sellPrice")))} TL
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label htmlFor="stock" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1">Mevcut Stok</Label>
                                    <Input id="stock" type="number" {...register("stock")} className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="criticalStock" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Kritik Limit
                                    </Label>
                                    <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label htmlFor="location" className="font-bold text-[10px] text-muted-foreground flex items-center gap-2 uppercase tracking-[0.2em] ml-1">
                                        <MapPin className="h-3.5 w-3.5 text-blue-500" /> Raf / Konum Bilgisi
                                    </Label>
                                    <Input id="location" {...register("location")} placeholder="Örn: A-12, Arka Depo" className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="supplierId" className="font-bold text-[10px] text-muted-foreground flex items-center gap-2 uppercase tracking-[0.2em] ml-1">
                                        <Truck className="h-3.5 w-3.5 text-orange-400" /> Varsayılan Tedarikçi
                                    </Label>
                                    <Select onValueChange={(val) => setValue("supplierId", val)} value={watch("supplierId")}>
                                        <SelectTrigger id="supplierId" className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium">
                                            <SelectValue placeholder="Tedarikçi Seçin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="none" className="text-[13px]">Seçilmedi</SelectItem>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id} className="text-[13px]">{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 border-t border-border/40 bg-accent/5 flex flex-col md:flex-row items-center justify-end gap-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="w-full md:w-auto h-14 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-accent/20">
                            Değişiklikleri İptal Et
                        </Button>
                        <Button type="submit" disabled={isPending} className="w-full md:w-auto h-14 rounded-2xl bg-blue-600 text-white px-10 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-[11px] font-bold uppercase tracking-widest gap-3">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                            GÜNCELLEMEYİ TAMAMLA
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}





