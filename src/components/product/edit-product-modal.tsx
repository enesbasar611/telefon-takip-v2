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
import { Edit, Loader2, Package, Barcode, TrendingUp, AlertTriangle, MapPin, Settings2 } from "lucide-react";
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
    isOpen: boolean;
    onClose: () => void;
    shop?: any;
}

export function EditProductModal({ product, categories, isOpen, onClose, shop }: EditProductModalProps) {
    const { rates: exchangeRates } = useDashboardData();
    const [isPending, startTransition] = useTransition();

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
                ...(product.attributes || {}),
            });
        }
    }, [product, reset]);

    const handleUsdChange = (usdVal: number) => {
        setValue("buyPriceUsd", String(usdVal));
        if (usdVal > 0 && exchangeRates?.usd) {
            const tlVal = Math.ceil(usdVal * exchangeRates.usd);
            setValue("buyPrice", String(tlVal));
        }
    };

    const handleSellUsdChange = (usdVal: number) => {
        setValue("sellPriceUsd", String(usdVal));
        if (usdVal > 0 && exchangeRates?.usd) {
            const tlVal = Math.ceil(usdVal * exchangeRates.usd);
            setValue("sellPrice", String(tlVal));
        }
    };

    const onSubmit = async (data: any) => {
        startTransition(async () => {
            const { name, barcode, location, attributes } = extractCoreAndAttributes(industryFields, data);

            const result = await updateProduct(product.id, {
                name: name || data.name,
                categoryId: data.categoryId,
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="buyPrice" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1">Alış (TL)</Label>
                                        <PriceInput
                                            id="buyPrice"
                                            value={watch("buyPrice")}
                                            onChange={(v) => setValue("buyPrice", String(v), { shouldValidate: true })}
                                            className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="buyPriceUsd" className="font-bold text-[10px] text-blue-500/70 uppercase tracking-[0.2em] ml-1">Dollar ($)</Label>
                                        <PriceInput
                                            id="buyPriceUsd"
                                            value={watch("buyPriceUsd")}
                                            onChange={(v) => handleUsdChange(Number(v))}
                                            prefix="$"
                                            className="bg-blue-500/5 border-blue-500/20 rounded-2xl h-14 text-sm text-blue-500 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="sellPrice" className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <TrendingUp className="h-3 w-3 text-emerald-500" /> Satış (TL)
                                        </Label>
                                        <PriceInput
                                            id="sellPrice"
                                            value={watch("sellPrice")}
                                            onChange={(v) => setValue("sellPrice", String(v), { shouldValidate: true })}
                                            className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="sellPriceUsd" className="font-bold text-[10px] text-emerald-500/70 uppercase tracking-[0.2em] ml-1">Dollar ($)</Label>
                                        <PriceInput
                                            id="sellPriceUsd"
                                            value={watch("sellPriceUsd")}
                                            onChange={(v) => handleSellUsdChange(Number(v))}
                                            prefix="$"
                                            className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl h-14 text-sm text-emerald-500 font-bold"
                                        />
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

                            <div className="space-y-2.5">
                                <Label htmlFor="location" className="font-bold text-[10px] text-muted-foreground flex items-center gap-2 uppercase tracking-[0.2em] ml-1">
                                    <MapPin className="h-3.5 w-3.5 text-blue-500" /> Raf / Konum Bilgisi
                                </Label>
                                <Input id="location" {...register("location")} placeholder="Örn: A-12, Arka Depo" className="bg-accent/5 border-border/40 rounded-2xl h-14 text-sm font-medium" />
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





