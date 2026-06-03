"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTopProducts } from "@/lib/actions/dashboard-actions";
import { useQuery } from "@tanstack/react-query";

export function TopProductsStream({ viewMode = 'grid', shopId, cols = 8, rows = 2, onDataStatus }: { viewMode?: 'grid' | 'list', shopId?: string, cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
    const isSmall = cols < 8;
    const isVerySmall = cols < 6;
    const isShort = rows < 2;
    const limit = viewMode === 'grid' ? (cols >= 12 ? 8 : (cols >= 8 ? 4 : 2)) : (rows >= 3 ? 10 : 5);

    const { data: topProducts = [], isLoading } = useQuery({
        queryKey: ["dashboard-top-products", shopId || "", limit],
        queryFn: async () => {
            if (!shopId) return [];
            return await getTopProducts(shopId, limit);
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!topProducts || topProducts.length === 0);
        }
    }, [topProducts, isLoading, onDataStatus]);

    if (isLoading) {
        return (
            <Card className="h-full border border-border/40 bg-card rounded-[2.5rem] animate-pulse">
                <div className="h-full w-full bg-muted/20" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col border border-border/40 shadow-xl overflow-hidden rounded-[2.5rem] bg-card transition-all duration-500 animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40",
                isVerySmall || isShort ? "p-3 pb-2" : "p-8 pb-6"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner",
                        isVerySmall || isShort ? "h-7 w-7" : "h-11 w-11"
                    )}>
                        <TrendingUp className={cn("text-amber-500", isVerySmall || isShort ? "h-3 w-3" : "h-5 w-5")} />
                    </div>
                    <div>
                        <CardTitle className={cn(
                            "font-medium tracking-tight font-sans uppercase",
                            isVerySmall || isShort ? "text-xs" : "text-lg"
                        )}>Trend Ürünler</CardTitle>
                        {!isVerySmall && !isShort && <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">En Çok Tercih Edilenler</p>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cn(
                "flex-1 overflow-y-auto custom-scrollbar",
                isVerySmall || isShort ? "p-3" : "p-8"
            )}>
                {viewMode === 'grid' ? (
                    <div className={cn(
                        "grid gap-6 capitalize",
                        cols >= 18 ? "grid-cols-6" : (cols >= 12 ? "grid-cols-4" : (cols >= 8 ? "grid-cols-2" : "grid-cols-1"))
                    )}>
                        {(topProducts ?? []).map((product: any) => (
                            <div key={product.id} className={cn(
                                "group relative bg-muted/10 rounded-[1.8rem] border border-transparent hover:border-primary/10 transition-all",
                                isVerySmall || isShort ? "p-3" : "p-5"
                            )}>
                                <div className={cn(
                                    "rounded-[1.5rem] bg-card border border-border/40 flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all",
                                    isVerySmall || isShort ? "aspect-square mb-2 h-20 w-20 mx-auto" : "aspect-square mb-5"
                                )}>
                                    <Package className={cn("text-muted-foreground/20 group-hover:scale-110 transition-transform", isVerySmall || isShort ? "h-8 w-8" : "h-14 w-14")} />
                                    {product.stock <= product.criticalStock && (
                                        <div className={cn(
                                            "absolute top-1 left-1 bg-rose-500 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest shadow-lg font-bold",
                                            isVerySmall || isShort ? "text-[5px]" : "text-[8px] px-3 py-1 top-4 left-4"
                                        )}>KRİTİK</div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className={isVerySmall || isShort ? "min-h-[24px]" : "min-h-[44px]"}>
                                        <h4 className={cn(
                                            "font-medium text-foreground tracking-tight line-clamp-1 uppercase font-sans leading-tight",
                                            isVerySmall || isShort ? "text-[10px]" : "text-sm"
                                        )}>{product.name}</h4>
                                        {!isVerySmall && !isShort && <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 opacity-70">{product.category}</p>}
                                    </div>
                                    {!isShort && (
                                        <div className="flex items-end justify-between pt-2 border-t border-border/20">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-muted-foreground/60 uppercase tracking-widest mb-0.5">Fiyat</span>
                                                <span className={cn(
                                                    "text-blue-500 tracking-tighter",
                                                    isVerySmall ? "text-sm" : "text-xl"
                                                )}>₺{product.price.toLocaleString('tr-TR')}</span>
                                            </div>
                                            {!isVerySmall && (
                                                <div className="text-right">
                                                    <span className="text-[8px] text-muted-foreground/60 uppercase tracking-widest block mb-1">Satış</span>
                                                    <span className="text-xs text-foreground">{product.sales} ADET</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(topProducts ?? []).map((product: any) => (
                            <div key={product.id} className={cn(
                                "flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-transparent hover:border-primary/10 transition-all group",
                                isVerySmall || isShort ? "p-2 gap-2" : "p-4 gap-5"
                            )}>
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm relative shrink-0 group-hover:scale-105 transition-transform",
                                        isVerySmall || isShort ? "h-8 w-8" : "h-14 w-14"
                                    )}>
                                        <Package className={cn("text-primary/80", isVerySmall || isShort ? "h-4 w-4" : "h-7 w-7")} />
                                        {product.stock <= product.criticalStock && (
                                            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-background animate-pulse" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={cn(
                                            "font-medium text-foreground tracking-tight truncate font-sans uppercase group-hover:text-primary transition-colors",
                                            isVerySmall || isShort ? "text-[10px]" : "text-sm"
                                        )}>{product.name}</h4>
                                        {!isShort && (
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 truncate">
                                                {isVerySmall ? "" : `${product.category} • `}<span className="text-secondary tracking-tighter">{product.sales} Satış</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={cn(
                                        "font-bold text-blue-500 tracking-tight",
                                        isVerySmall || isShort ? "text-xs" : "text-lg"
                                    )}>₺{product.price.toLocaleString('tr-TR')}</span>
                                    {!isVerySmall && !isShort && (
                                        <p className={cn(
                                            "text-[9px] uppercase tracking-widest mt-1",
                                            product.stock <= product.criticalStock ? "text-rose-500 font-bold" : "text-muted-foreground opacity-60"
                                        )}>
                                            Stok: {product.stock}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
