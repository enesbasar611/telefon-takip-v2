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
import { Edit, Loader2, Package, Barcode, TrendingUp, AlertTriangle, MapPin } from "lucide-react";
import { updateProduct } from "@/lib/actions/product-actions";
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

    const onSubmit = async (data: any) => {
        startTransition(async () => {
            const { name, barcode, location, attributes } = extractCoreAndAttributes(industryFields, data);

            const result = await updateProduct(product.id, {
                name: name || data.name,
                categoryId: data.categoryId,
                buyPrice: Number(data.buyPrice),
                buyPriceUsd: data.buyPriceUsd ? Number(data.buyPriceUsd) : null,
                sellPrice: Number(data.sellPrice),
                stock: Number(data.stock),
                criticalStock: Number(data.criticalStock),
                barcode: barcode || data.barcode,
                location: location || data.location,
                attributes,
            });

            if (result.success) {
                toast.success("Ürün başarıyla güncellendi.");
                onClose();
            } else {
                toast.error("Ürün güncellenirken bir hata oluştu.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] bg-card border-border/50 text-white p-0 overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-8 space-y-8">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Edit className="h-5 w-5 text-blue-500" />
                                </div>
                                <DialogTitle className="font-medium text-xl ">{getIndustryLabel(shop, "inventory")} Düzenle</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs font-medium text-gray-400">
                                "{product?.name}" bilgilerini güncelleyin.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest">{getIndustryLabel(shop, "productLabel")} Adı</Label>
                                <Input id="name" {...register("name")} className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm " />
                                {errors.name && <p className="text-[10px] text-rose-500 ">{String(errors.name.message || "")}</p>}
                            </div>

                            <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05] space-y-4">
                                <FormFactory
                                    fields={industryFields}
                                    register={register}
                                    control={control}
                                    errors={errors}
                                    twoCol={true}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest">Kategori</Label>
                                    <Select onValueChange={(val) => setValue("categoryId", val)} defaultValue={product?.categoryId}>
                                        <SelectTrigger className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm ">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border/50 text-white">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-xs  py-3">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="barcode" className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Barcode className="h-3 w-3" /> Barkod
                                    </Label>
                                    <Input id="barcode" {...register("barcode")} className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm " />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="buyPrice" className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest">Alış Fiyatı (TL)</Label>
                                        <PriceInput
                                            id="buyPrice"
                                            value={watch("buyPrice")}
                                            onChange={(v) => setValue("buyPrice", String(v), { shouldValidate: true })}
                                            className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm "
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="buyPriceUsd" className="font-medium text-[10px]  text-blue-400 uppercase tracking-widest">Dollar Alış ($)</Label>
                                        <PriceInput
                                            id="buyPriceUsd"
                                            value={watch("buyPriceUsd")}
                                            onChange={(v) => handleUsdChange(Number(v))}
                                            prefix="$"
                                            className="bg-blue-500/5 border-blue-500/20 rounded-xl h-12 text-sm text-blue-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sellPrice" className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Satış Fiyatı
                                    </Label>
                                    <PriceInput
                                        id="sellPrice"
                                        value={watch("sellPrice")}
                                        onChange={(v) => setValue("sellPrice", String(v), { shouldValidate: true })}
                                        className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm "
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest">Mevcut Stok</Label>
                                    <Input id="stock" type="number" {...register("stock")} className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm " />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="criticalStock" className="font-medium text-[10px]  text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-rose-500" /> Kritik Limit
                                    </Label>
                                    <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm " />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location" className="font-medium text-[10px]  text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                                    <MapPin className="h-3 w-3 text-blue-500" /> Raf / Konum
                                </Label>
                                <Input id="location" {...register("location")} placeholder="Raf No, Kutu No vb." className="bg-white/[0.03] border-border/50 rounded-xl h-12 text-sm " />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-border/50 bg-white/[0.01] flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="h-12 rounded-xl text-xs  text-gray-500 hover:text-white">
                            İptal
                        </Button>
                        <Button type="submit" disabled={isPending} className="h-12 rounded-xl bg-blue-500 text-black  px-8 hover:bg-blue-400">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
                            GÜNCELLEMEYİ KAYDET
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}





