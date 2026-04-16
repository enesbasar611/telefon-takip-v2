"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories, bulkCreateProducts } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { Loader2, Plus, Box, Bookmark } from "lucide-react";
import { getIndustryLabel } from "@/lib/industry-utils";

interface NewProductItem {
    tempId: string;
    name: string;
    buyPrice: number;
    currency: "TL" | "USD";
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
    const inventoryLabel = getIndustryLabel(shop, "inventory");
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [productDetails, setProductDetails] = useState<Record<string, { categoryId: string; sellPrice: string }>>({});

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            // Initialize details for each item
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
        // Validation
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
                sellPrice: Number(productDetails[item.tempId].sellPrice) || 0,
                stock: 0, // Stock will be added by the purchase order
                isSecondHand: false,
            }));

            const result = await bulkCreateProducts(productsToCreate);

            if (result.success && result.products) {
                toast.success(`${result.count} yeni ürün başarıyla oluşturuldu.`);

                // Map created products back to items using name matching (since order is preserved in results)
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
            <DialogContent className="max-w-2xl bg-[#0a0f18] border-white/10 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Plus className="w-5 h-5 text-blue-400" />
                        Yeni {productLabel} Kaydı
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        Sipariş listesindeki yeni {productLabel.toLowerCase()}lerin kategorilerini ve satış fiyatlarını belirleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {items.map((item) => (
                        <div key={item.tempId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                        <Box className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{item.name}</span>
                                </div>
                                <div className="text-xs text-white/40">
                                    Alış: {item.buyPrice} {item.currency}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-white/50">{inventoryLabel} Kategorisi</Label>
                                    <Select
                                        value={productDetails[item.tempId]?.categoryId}
                                        onValueChange={(val) => handleDetailChange(item.tempId, "categoryId", val)}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue placeholder="Kategori Seç" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0f172a] border-white/10 text-white">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-white/50">Satış Fiyatı (TL)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="bg-white/5 border-white/10"
                                        value={productDetails[item.tempId]?.sellPrice}
                                        onChange={(e) => handleDetailChange(item.tempId, "sellPrice", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        İptal
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-500"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                        {productLabel}leri Kaydet ve Devam Et
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
