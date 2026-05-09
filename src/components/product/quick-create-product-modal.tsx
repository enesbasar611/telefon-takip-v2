"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Package, PlusCircle, Loader2, DollarSign, TrendingUp, ChevronRight, ArrowRightLeft } from "lucide-react";
import { createProduct } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { PriceInput } from "@/components/ui/price-input";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

const quickProductSchema = z.object({
    name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
    categoryId: z.string().min(1, "Kategori seçiniz"),
    buyPrice: z.string().min(1, "Alış fiyatı gereklidir"),
    sellPrice: z.string().min(1, "Satış fiyatı gereklidir"),
});

type QuickProductFormValues = z.infer<typeof quickProductSchema>;

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface QuickCreateProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    initialName?: string;
    onSuccess: (product: any) => void;
}

export function QuickCreateProductModal({
    open,
    onOpenChange,
    categories,
    initialName = "",
    onSuccess
}: QuickCreateProductModalProps) {
    const { rates: exchangeRates } = useDashboardData();
    const [isPending, startTransition] = useTransition();
    const [categoryPath, setCategoryPath] = useState<string[]>([]);
    const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<QuickProductFormValues>({
        resolver: zodResolver(quickProductSchema),
        defaultValues: {
            name: initialName,
            buyPrice: "0",
            sellPrice: "0",
        }
    });

    const calculateTryPrice = (val: string) => {
        const num = parseFloat(val) || 0;
        if (currency === "USD") return (num * exchangeRates.usd).toFixed(2);
        if (currency === "EUR") return (num * exchangeRates.eur).toFixed(2);
        return num.toFixed(2);
    };

    const onSubmit = async (data: QuickProductFormValues) => {
        startTransition(async () => {
            let finalBuyPrice = Number(data.buyPrice);
            let finalSellPrice = Number(data.sellPrice);
            let buyPriceUsd = currency === "USD" ? finalBuyPrice : null;

            if (currency === "USD") {
                finalBuyPrice = Math.ceil(finalBuyPrice * exchangeRates.usd);
                finalSellPrice = Math.ceil(finalSellPrice * exchangeRates.usd);
            } else if (currency === "EUR") {
                finalBuyPrice = Math.ceil(finalBuyPrice * exchangeRates.eur);
                finalSellPrice = Math.ceil(finalSellPrice * exchangeRates.eur);
            } else {
                finalBuyPrice = Math.ceil(finalBuyPrice);
                finalSellPrice = Math.ceil(finalSellPrice);
            }

            const result = await createProduct({
                name: data.name,
                categoryId: data.categoryId,
                buyPrice: finalBuyPrice,
                buyPriceUsd: buyPriceUsd,
                sellPrice: finalSellPrice,
                stock: 0, // Quick creation starts with 0 stock as per user intent
                criticalStock: 5,
            });

            if (result.success) {
                toast.success("Ürün tanımlandı ve seçildi.");
                onSuccess(result.product);
                onOpenChange(false);
                reset();
            } else {
                toast.error(result.error || "Ürün eklenirken bir hata oluştu.");
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background border border-border">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Package className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Hızlı Ürün Tanımla</DialogTitle>
                            <DialogDescription className="text-xs">
                                {initialName} için alış ve satış fiyatlarını belirleyin.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Ürün Adı</Label>
                        <Input
                            {...register("name")}
                            placeholder="Ürün Adı"
                            className="h-11 bg-muted/50 rounded-xl"
                        />
                        {errors.name && <p className="text-[10px] text-rose-500">{errors.name.message}</p>}
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                        <Label className="text-xs font-semibold text-indigo-400 uppercase">Kategori Seçimi</Label>
                        <div className="grid gap-3">
                            {dropdownsToRender.map((dropdown, idx) => (
                                <div key={idx} className="space-y-1.5 flex-1">
                                    <Select
                                        value={dropdown.selectedValue}
                                        onValueChange={(val) => handleCategorySelect(dropdown.level, val)}
                                    >
                                        <SelectTrigger className="bg-background border-border rounded-xl h-10 text-[13px]">
                                            <SelectValue placeholder={idx === 0 ? "Ana Kategori" : "Alt Kategori"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dropdown.options.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-[13px]">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        {errors.categoryId && <p className="text-[10px] text-rose-500">{errors.categoryId.message}</p>}
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-3">
                            <h4 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" /> Fiyatlandırma
                            </h4>
                            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50 shrinks-0">
                                {(["TRY", "USD", "EUR"] as const).map((c) => (
                                    <Button key={c} type="button" size="sm" variant={currency === c ? "default" : "ghost"}
                                        onClick={() => setCurrency(c)}
                                        className={`h-7 px-3 text-[11px] rounded-lg transition-colors ${currency === c
                                            ? c === "TRY" ? "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20"
                                                : c === "USD" ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                                                    : "bg-blue-500 hover:bg-blue-400 text-black"
                                            : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        {c === "TRY" ? "₺ TRY" : c === "USD" ? "$ USD" : "€ EUR"}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <DollarSign className="h-3 w-3 text-amber-500" /> Alış Fiyatı ({currency})
                                </Label>
                                <PriceInput
                                    value={watch("buyPrice")}
                                    onChange={(v) => setValue("buyPrice", String(v), { shouldValidate: true })}
                                    prefix={currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                                    className="h-11 bg-muted/50 rounded-xl"
                                />
                                {errors.buyPrice && <p className="text-[10px] text-rose-500">{errors.buyPrice.message}</p>}
                                {currency !== "TRY" && (
                                    <div className="flex items-center gap-1.5 mt-2 px-1 opacity-90 text-[10px] font-medium text-muted-foreground">
                                        <ArrowRightLeft className="h-3 w-3 text-blue-400" />
                                        ≈ {calculateTryPrice(watch("buyPrice"))} ₺
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" /> Satış Fiyatı ({currency})
                                </Label>
                                <PriceInput
                                    value={watch("sellPrice")}
                                    onChange={(v) => setValue("sellPrice", String(v), { shouldValidate: true })}
                                    prefix={currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"}
                                    className="h-11 bg-muted/50 rounded-xl"
                                />
                                {errors.sellPrice && <p className="text-[10px] text-rose-500">{errors.sellPrice.message}</p>}
                                {currency !== "TRY" && (
                                    <div className="flex items-center gap-1.5 mt-2 px-1 opacity-90 text-[10px] font-medium text-muted-foreground">
                                        <ArrowRightLeft className="h-3 w-3 text-blue-400" />
                                        ≈ {calculateTryPrice(watch("sellPrice"))} ₺
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-11 rounded-xl"
                            disabled={isPending}
                        >
                            Vazgeç
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-500/20"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                            Ürünü Tanımla ve Seç
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
