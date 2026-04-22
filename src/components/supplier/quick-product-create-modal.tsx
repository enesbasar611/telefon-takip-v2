"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories, bulkCreateProducts } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { Loader2, Plus, Box, Bookmark, Info } from "lucide-react";
import { getIndustryLabel } from "@/lib/industry-utils";
import { cn } from "@/lib/utils";

interface NewProductItem {
    tempId: string;
    name: string;
    buyPrice: number;
    currency: "TRY" | "USD";
}

interface QuickProductCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: NewProductItem[];
    onSuccess: (mappedItems: { tempId: string; productId: string }[]) => void;
    shop?: any;
}

export function QuickProductCreateModal({
    isOpen,
    onClose,
    items,
    onSuccess,
    shop,
}: QuickProductCreateModalProps) {
    const productLabel = getIndustryLabel(shop, "productLabel");
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [productDetails, setProductDetails] = useState<Record<string, { categoryId: string; sellPrice: string }>>({});

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            const initialDetails: Record<string, { categoryId: string; sellPrice: string }> = {};
            items.forEach((item) => {
                initialDetails[item.tempId] = {
                    categoryId: "",
                    sellPrice: "",
                };
            });
            setProductDetails(initialDetails);
        }
    }, [isOpen, items]);

    async function loadCategories() {
        const cats = await getCategories();
        setCategories(cats);
    }

    const handleDetailChange = (tempId: string, field: "categoryId" | "sellPrice", value: string) => {
        setProductDetails((prev) => ({
            ...prev,
            [tempId]: {
                ...prev[tempId],
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        for (const item of items) {
            if (!productDetails[item.tempId]?.categoryId) {
                toast.error(`${item.name} için kategori seçmelisiniz.`);
                return;
            }
        }

        setIsLoading(true);
        try {
            const productsToCreate = items.map((item) => ({
                name: item.name,
                categoryId: productDetails[item.tempId].categoryId,
                buyPrice: item.buyPrice,
                buyPriceUsd: item.currency === "USD" ? item.buyPrice : 0,
                sellPrice: Number(productDetails[item.tempId].sellPrice) || 0,
                stock: 0,
                isSecondHand: false,
            }));

            const result = await bulkCreateProducts(productsToCreate);

            if (result.success && result.products) {
                toast.success(`${result.count} yeni ürün başarıyla oluşturuldu.`);
                const mapped = items.map((item, index) => ({
                    tempId: item.tempId,
                    productId: result.products[index].id,
                }));
                onSuccess(mapped);
            } else {
                toast.error(result.error || "Ürünler oluşturulurken bir hata oluştu.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Beklenmedik bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-background border-border p-0 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="font-bold text-2xl tracking-tight text-foreground">Yeni Ürün Kartlarını Oluştur</DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground uppercase tracking-widest pt-1 font-semibold flex items-center gap-2">
                                    <span>STOK YÖNETİMİ</span>
                                    <Box className="h-3 w-3" />
                                    <span className="text-blue-600">HIZLI ÜRÜN TANIMLAMA</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="bg-blue-500/5 rounded-2xl p-4 flex gap-3 border border-blue-500/10 mb-2">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Sipariş listesine eklediğiniz ancak sistemde kaydı bulunmayan ürünler için yeni kartlar oluşturulacak. Bu işlemden sonra sipariş kaydınız otomatik olarak tamamlanacaktır.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.tempId} className="p-5 rounded-2xl bg-accent/5 border border-border/50 space-y-5 transition-all hover:border-blue-500/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Box className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-sm text-foreground uppercase tracking-tight">{item.name}</span>
                                            <p className="text-[10px] text-muted-foreground font-medium">Alış Fiyatı: {item.buyPrice.toLocaleString()} {item.currency}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-1">Kategori</Label>
                                        <Select
                                            value={productDetails[item.tempId]?.categoryId}
                                            onValueChange={(val) => handleDetailChange(item.tempId, "categoryId", val)}
                                        >
                                            <SelectTrigger className="h-11 bg-background border-border rounded-xl text-xs font-medium">
                                                <SelectValue placeholder="Kategori Seç..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-1">Satış Fiyatı (₺)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="h-11 bg-background border-border rounded-xl text-sm font-medium"
                                            value={productDetails[item.tempId]?.sellPrice}
                                            onChange={(e) => handleDetailChange(item.tempId, "sellPrice", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-accent/5 border-t border-border flex items-center justify-between sm:justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-widest">
                        Vazgeç
                    </Button>
                    <Button
                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                        Kartları Oluştur ve Devam Et
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
