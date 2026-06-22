"use client";

import React from "react";
import { Tag, Package, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

    if (isCompact) {
        return (
            <div
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/70 px-3 py-2.5 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/5 active:scale-[0.99]"
                onClick={() => onAdd(product)}
            >
                <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/40 transition-colors group-hover:border-blue-500/10 group-hover:bg-blue-500/5">
                        <Package className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-blue-500/50" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <h4 className="truncate text-xs font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-blue-600">
                            {product.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="rounded-md border-none bg-muted/50 px-2 py-0.5 text-[8px] text-muted-foreground uppercase">
                                {product.category?.name || "GENEL"}
                            </Badge>
                            <div className="flex items-center gap-1">
                                <div className={cn("h-1.5 w-1.5 rounded-full", stock <= 5 ? "bg-rose-500" : "bg-emerald-500")} />
                                <span className={cn("text-[9px] font-black", stock <= 5 ? "text-rose-500" : "text-emerald-500")}>
                                    {stock}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                        <span className="text-sm font-black text-foreground tabular-nums">
                            {getCartCurrencySymbol()}{priceStr}
                        </span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white">
                        <Plus className="h-4 w-4" />
                    </div>
                </div>
            </div>
        );
    }

    // Standard Grid View for POSInterface
    return (
        <button
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            className={cn(
                "flex flex-col text-left bg-card border border-border/40 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 group disabled:opacity-40 relative overflow-hidden aspect-[1/1.1] sm:aspect-[1/1.2]",
                isOutOfStock && "grayscale cursor-not-allowed"
            )}
        >
            {/* Top Row: Category & Stock */}
            <div className="flex items-start justify-between gap-2 mb-auto z-10 w-full">
                <div className="text-[8px] sm:text-[10px] text-primary flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity min-w-0 flex-1">
                    <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                    <span className="truncate">
                        {product.category?.parent?.name ? `${product.category.parent.name} > ${product.category.name}` : product.category?.name}
                    </span>
                </div>
                <div className={cn(
                    "shrink-0 flex items-center justify-center h-5 sm:h-6 px-1.5 sm:px-2 rounded-full text-[8px] sm:text-[10px] font-bold border shadow-sm transition-transform group-hover:scale-105",
                    stock <= 5
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse mr-1", stock <= 5 ? "bg-rose-500" : "bg-emerald-500")} />
                    {stock}
                </div>
            </div>

            {/* Bottom Row: Price & Title */}
            <div className="flex flex-col gap-0 z-10 w-full mt-auto">
                <div className="text-[11px] sm:text-[13px] font-bold text-muted-foreground/80 mb-0">
                    ({getEquivalentDisplay(product)})
                </div>
                <div className="text-foreground tabular-nums w-full leading-tight whitespace-nowrap overflow-visible drop-shadow-sm text-lg sm:text-xl font-black">
                    {getCartCurrencySymbol()}{priceStr}
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-[12px] line-clamp-2 leading-tight font-medium overflow-hidden text-ellipsis h-[2.4em] sm:h-[2.6em] mt-1">
                    {product.name}
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
        </button>
    );
});

ProductCard.displayName = "ProductCard";
