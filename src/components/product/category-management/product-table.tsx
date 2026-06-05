"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { Trash2, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, PriceCurrency } from "./types";

interface ProductTableProps {
    products: Product[];
    editingProducts: Record<string, { name: string; buyPrice: number; sellPrice: number }>;
    setEditingProducts: React.Dispatch<React.SetStateAction<Record<string, { name: string; buyPrice: number; sellPrice: number }>>>;
    savingId: string | null;
    onSaveProduct: (id: string) => void;
    onDeleteProduct: (id: string) => void;
    getCurrencySymbol: () => string;
    priceCurrency: PriceCurrency;
    getCurrencyRate: () => number;
    selectedProductIds: string[];
    setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProductTable({
    products,
    editingProducts,
    setEditingProducts,
    savingId,
    onSaveProduct,
    onDeleteProduct,
    getCurrencySymbol,
    priceCurrency,
    getCurrencyRate,
    selectedProductIds,
    setSelectedProductIds
}: ProductTableProps) {
    const toggleSelection = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedProductIds((prev: string[]) =>
            prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-4">
            {products.map((product) => {
                const getDisplayPrice = (val: number, valUsd: number | null | undefined) => {
                    if (priceCurrency === "TRY") return val;
                    if (valUsd) return valUsd;
                    const rate = getCurrencyRate();
                    return Math.round((val / (rate || 1)) * 100) / 100;
                };

                const initialBuyPrice = getDisplayPrice(product.buyPrice, product.buyPriceUsd);
                const initialSellPrice = getDisplayPrice(product.sellPrice, product.sellPriceUsd);

                const editData = editingProducts[product.id] || {
                    name: product.name,
                    buyPrice: initialBuyPrice,
                    sellPrice: initialSellPrice
                };

                const hasChanges = editData.name !== product.name ||
                    editData.buyPrice !== initialBuyPrice ||
                    editData.sellPrice !== initialSellPrice;

                return (
                    <div
                        key={product.id}
                        onClick={() => toggleSelection(product.id)}
                        className={cn(
                            "group p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                            selectedProductIds.includes(product.id)
                                ? "bg-indigo-500/10 border-indigo-500/40 shadow-indigo-500/10"
                                : "bg-white/[0.02] border-border/50 hover:border-indigo-500/20"
                        )}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <input
                                        value={editData.name}
                                        onChange={e => setEditingProducts(prev => ({
                                            ...prev,
                                            [product.id]: { ...editData, name: e.target.value }
                                        }))}
                                        onClick={e => e.stopPropagation()}
                                        className="bg-transparent border-none p-0 h-auto text-[15px] font-bold text-foreground dark:text-white focus:ring-0 w-full placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className={cn(
                                            "h-10 px-6 rounded-xl transition-all font-bold",
                                            hasChanges
                                                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                                                : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSaveProduct(product.id);
                                        }}
                                        disabled={savingId === product.id}
                                    >
                                        {savingId === product.id ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <div className="text-[10px]">KAYDET</div>}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-red-500/10 dark:hover:bg-red-500/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteProduct(product.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Alış Fiyatı ({priceCurrency})</Label>
                                    <div className="relative">
                                        <PriceInput
                                            value={editData.buyPrice}
                                            onChange={value => setEditingProducts(prev => ({
                                                ...prev,
                                                [product.id]: { ...editData, buyPrice: value }
                                            }))}
                                            prefix={getCurrencySymbol()}
                                            className="bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-border/50 h-10 text-[13px] font-bold text-foreground dark:text-white shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Satış Fiyatı ({priceCurrency})</Label>
                                    <div className="relative">
                                        <PriceInput
                                            value={editData.sellPrice}
                                            onChange={value => setEditingProducts(prev => ({
                                                ...prev,
                                                [product.id]: { ...editData, sellPrice: value }
                                            }))}
                                            prefix={getCurrencySymbol()}
                                            className="bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/10 h-10 text-[13px] font-bold text-indigo-600 dark:text-indigo-300 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[9px]  text-slate-600 uppercase tracking-[0.2em]">Stok Durumu: {product.stock} ADET</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-zinc-200 dark:border-border/50 rounded-2xl bg-zinc-50 dark:bg-white/[0.01]">
                    <Package className="h-8 w-8 text-zinc-400 dark:text-slate-700 mb-3" />
                    <p className="text-xs text-muted-foreground font-bold">Bu kategoride ürün bulunmuyor.</p>
                </div>
            )}
        </div>
    );
}
