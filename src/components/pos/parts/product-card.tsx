"use client";

import React from "react";
import { Tag, Package, Plus, Barcode, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getCategoryTheme } from "@/lib/category-colors";

interface ProductCardProps {
    product: any;
    onAdd: (product: any) => void;
    getEquivalentDisplay: (product: any) => string;
    getCartCurrencySymbol: () => string;
    displayPrice?: number;
    isCompact?: boolean;
}

export const ProductCard = React.memo(({
    product,
    onAdd,
    getEquivalentDisplay,
    getCartCurrencySymbol,
    displayPrice,
    isCompact = false
}: ProductCardProps) => {
    const stock = product.stock ?? 0;
    const isOutOfStock = stock <= 0;
    const priceStr = formatCurrency(displayPrice ?? product.sellPrice ?? 0);
    const categoryName = product.category?.parent?.name
        ? `${product.category.parent.name} > ${product.category.name}`
        : (product.category?.name || "GENEL");

    const categoryTheme = getCategoryTheme(product.category?.name || product.categoryId || categoryName);

    // 1. Kompakt Liste Görünümü
    if (isCompact) {
        return (
            <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    "group flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card/80 hover:bg-card px-3.5 py-2.5 transition-all duration-200 hover:shadow-xs active:scale-[0.99]",
                    categoryTheme.cardBorder,
                    isOutOfStock && "opacity-50 grayscale cursor-not-allowed hover:border-border/40 hover:bg-card/80"
                )}
                onClick={() => !isOutOfStock && onAdd(product)}
            >
                <div className="flex min-w-0 items-center gap-3 overflow-hidden flex-1">
                    <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        categoryTheme.iconWrapper
                    )}>
                        <Package className="h-4 w-4 transition-colors" />
                    </div>
                    <div className="flex min-w-0 flex-col flex-1">
                        <h4 className="truncate text-xs font-bold uppercase tracking-tight text-foreground transition-colors">
                            {product.name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className={cn(
                                "text-[9px] uppercase tracking-wider truncate max-w-[120px] px-2 py-0.5 rounded border font-semibold",
                                categoryTheme.badge
                            )}>
                                {categoryName}
                            </span>
                            <span className="text-[9px] text-muted-foreground/40">•</span>
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                    isOutOfStock ? "bg-rose-500" : stock <= 5 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                )} />
                                <span className={cn(
                                    "text-[9px] font-bold tabular-nums",
                                    isOutOfStock ? "text-rose-500" : stock <= 5 ? "text-amber-500" : "text-emerald-500"
                                )}>
                                    {isOutOfStock ? "Tükendi" : `${stock} adet`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-foreground tabular-nums transition-colors">
                            {getCartCurrencySymbol()}{priceStr}
                        </div>
                        <div className="text-[9px] text-muted-foreground/75 font-semibold tabular-nums">
                            ({getEquivalentDisplay(product)})
                        </div>
                    </div>
                    <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200",
                        isOutOfStock
                            ? "bg-muted text-muted-foreground/30 border-transparent"
                            : categoryTheme.addButton
                    )}>
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
            </motion.div>
        );
    }

    // 2. Standart / Bento Izgara Kartı
    return (
        <motion.button
            type="button"
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            whileHover={!isOutOfStock ? { y: -3, scale: 1.015 } : undefined}
            whileTap={!isOutOfStock ? { scale: 0.97 } : undefined}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
                "group relative flex flex-col justify-between text-left rounded-2xl border bg-card/85 dark:bg-[#0c121d]/85 p-3.5 sm:p-4 backdrop-blur-xl transition-all duration-300 shadow-xs hover:shadow-md select-none overflow-hidden h-full min-h-[148px] sm:min-h-[160px]",
                categoryTheme.cardBorder,
                isOutOfStock && "opacity-45 grayscale cursor-not-allowed hover:border-border/40 hover:shadow-none"
            )}
        >
            {/* Top Row: Category & Stock Status */}
            <div className="flex items-center justify-between gap-2 w-full mb-2">
                <span className={cn(
                    "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate max-w-[120px] sm:max-w-[150px] px-2 py-0.5 rounded-md border",
                    categoryTheme.badge
                )}>
                    {categoryName}
                </span>

                <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border shrink-0 transition-transform group-hover:scale-105",
                    isOutOfStock
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : stock <= 5
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}>
                    <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        isOutOfStock ? "bg-rose-500" : stock <= 5 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    )} />
                    <span>{isOutOfStock ? "TÜKENDİ" : `${stock} ADET`}</span>
                </div>
            </div>

            {/* Middle: Product Name (Bold & Net) */}
            <div className="my-auto py-1">
                <h3 className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-tight line-clamp-2 leading-snug transition-colors">
                    {product.name}
                </h3>
            </div>

            {/* Bottom Row: Price & Hover Quick Action */}
            <div className="pt-2 mt-auto border-t border-border/30 w-full flex items-end justify-between gap-2">
                <div className="flex flex-col min-w-0">
                    <div className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground/75 truncate tabular-nums">
                        ({getEquivalentDisplay(product)})
                    </div>
                    <div className="text-base sm:text-lg font-black text-foreground transition-colors tabular-nums tracking-tight leading-none mt-0.5">
                        {getCartCurrencySymbol()}{priceStr}
                    </div>
                </div>

                {/* Micro Action Button */}
                <div className={cn(
                    "flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-xl transition-all duration-200 shrink-0 shadow-xs",
                    isOutOfStock
                        ? "bg-muted text-muted-foreground/30"
                        : categoryTheme.addButton
                )}>
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:rotate-90 group-hover:scale-110" />
                    <span className="hidden sm:inline">Ekle</span>
                </div>
            </div>
        </motion.button>
    );
});

ProductCard.displayName = "ProductCard";
