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

interface EditProductModalProps {
    product: any;
    categories: any[];
    isOpen: boolean;
    onClose: () => void;
}

export function EditProductModal({ product, categories, isOpen, onClose }: EditProductModalProps) {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
    });

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                categoryId: product.categoryId,
                buyPrice: product.buyPrice.toString(),
                sellPrice: product.sellPrice.toString(),
                stock: product.stock.toString(),
                criticalStock: product.criticalStock.toString(),
                barcode: product.barcode || "",
                location: product.location || "",
            });
        }
    }, [product, reset]);

    const onSubmit = async (data: ProductFormValues) => {
        startTransition(async () => {
            const result = await updateProduct(product.id, {
                name: data.name,
                categoryId: data.categoryId,
                buyPrice: Number(data.buyPrice),
                sellPrice: Number(data.sellPrice),
                stock: Number(data.stock),
                criticalStock: Number(data.criticalStock),
                barcode: data.barcode,
                location: data.location,
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
            <DialogContent className="sm:max-w-[550px] bg-card border-white/5 text-white p-0 overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-8 space-y-8">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Edit className="h-5 w-5 text-blue-500" />
                                </div>
                                <DialogTitle className="text-xl font-bold">Ürün Düzenle</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs font-medium text-gray-400">
                                "{product?.name}" bilgilerini güncelleyin.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ürün Adı</Label>
                                <Input id="name" {...register("name")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                                {errors.name && <p className="text-[10px] text-rose-500 font-bold">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kategori</Label>
                                    <Select onValueChange={(val) => setValue("categoryId", val)} defaultValue={product?.categoryId}>
                                        <SelectTrigger className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/5 text-white">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold py-3">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="barcode" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Barcode className="h-3 w-3" /> Barkod
                                    </Label>
                                    <Input id="barcode" {...register("barcode")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="buyPrice" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Alış Fiyatı (₺)</Label>
                                    <Input id="buyPrice" type="number" step="0.01" {...register("buyPrice")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sellPrice" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Satış Fiyatı (₺)
                                    </Label>
                                    <Input id="sellPrice" type="number" step="0.01" {...register("sellPrice")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mevcut Stok</Label>
                                    <Input id="stock" type="number" {...register("stock")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="criticalStock" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-rose-500" /> Kritik Limit
                                    </Label>
                                    <Input id="criticalStock" type="number" {...register("criticalStock")} className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                                    <MapPin className="h-3 w-3 text-blue-500" /> Raf / Konum
                                </Label>
                                <Input id="location" {...register("location")} placeholder="Raf No, Kutu No vb." className="bg-white/[0.03] border-white/5 rounded-xl h-12 text-sm font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="h-12 rounded-xl text-xs font-bold text-gray-500 hover:text-white">
                            İptal
                        </Button>
                        <Button type="submit" disabled={isPending} className="h-12 rounded-xl bg-blue-500 text-black font-bold px-8 hover:bg-blue-400">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
                            GÜNCELLEMEYİ KAYDET
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
