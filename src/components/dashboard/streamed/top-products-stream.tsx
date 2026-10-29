"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, Tag, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTopProducts } from "@/lib/actions/dashboard-actions";
import { useQuery } from "@tanstack/react-query";
import { CountingNumber } from "@/components/ui/counting-number";

export function TopProductsStream({ viewMode = 'grid', shopId, cols = 12, rows = 3, onDataStatus }: { viewMode?: 'grid' | 'list', shopId?: string, cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
    const isSmall = cols < 8;
    const isVerySmall = cols < 6;
    const isShort = rows < 2;
    const limit = viewMode === 'grid' ? (cols >= 12 ? (rows >= 3 ? 8 : 4) : (cols >= 8 ? 4 : 2)) : (rows >= 3 ? 10 : 5);

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
            <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse">
                <div className="h-full w-full bg-muted/20" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 bg-muted/10",
                isVerySmall || isShort ? "p-3 pb-2.5" : "px-5 py-3.5"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500",
                        isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
                    )}>
                        <TrendingUp className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
                    </div>
                    <div>
                        <CardTitle className={cn(
                            "font-semibold tracking-tight uppercase text-foreground",
                            isVerySmall || isShort ? "text-xs" : "text-sm"
                        )}>Trend Ürünler</CardTitle>
                        {!isVerySmall && !isShort && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">En Çok Tercih Edilenler</p>}
                    </div>
                </div>
            </CardHeader>

            <CardContent className={cn(
                "flex-1 overflow-y-auto custom-scrollbar",
                isVerySmall || isShort ? "p-3" : "p-4 sm:p-5"
            )}>
                {viewMode === 'grid' ? (
                    <div className={cn(
                        "grid gap-3.5",
                        cols >= 18 ? "grid-cols-6" : (cols >= 12 ? "grid-cols-4" : (cols >= 8 ? "grid-cols-2" : "grid-cols-1"))
                    )}>
                        {(topProducts ?? []).map((product: any) => (
                            <div key={product.id} className={cn(
                                "group relative bg-muted/20 hover:bg-muted/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] rounded-xl border border-border/40 hover:border-border transition-all duration-200 flex flex-col justify-between",
                                isVerySmall || isShort ? "p-2.5" : "p-3.5"
                            )}>
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="h-9 w-9 rounded-lg bg-card border border-border/40 flex items-center justify-center text-primary/70 shrink-0 shadow-xs">
                                            <Package className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                            {product.stock <= product.criticalStock && (
                                                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold uppercase tracking-wider">
                                                    KRİTİK
                                                </span>
                                            )}
                                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold uppercase tracking-tight tabular-nums">
                                                <CountingNumber value={product.sales} suffix=" Satış" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <h4 className={cn(
                                            "font-semibold text-foreground tracking-tight line-clamp-1 uppercase leading-snug group-hover:text-primary transition-colors",
                                            isVerySmall || isShort ? "text-xs" : "text-sm"
                                        )}>{product.name}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate mt-0.5 opacity-70">
                                            {product.category || "Genel"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-baseline justify-between pt-2.5 mt-2.5 border-t border-border/30">
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Fiyat</span>
                                    <span className="text-sm font-bold text-blue-500 dark:text-blue-400 tracking-tight tabular-nums">
                                        <CountingNumber value={product.price || 0} prefix="₺" grouping />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(topProducts ?? []).map((product: any) => (
                            <div key={product.id} className={cn(
                                "flex items-center justify-between rounded-xl bg-muted/20 hover:bg-muted/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-border/40 hover:border-border transition-all duration-200 group",
                                isVerySmall || isShort ? "p-2 gap-2" : "p-3 gap-4"
                            )}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-lg bg-card border border-border/40 flex items-center justify-center text-primary/70 shrink-0 shadow-xs">
                                        <Package className="h-4 w-4 group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-xs text-foreground tracking-tight truncate uppercase group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h4>
                                            {product.stock <= product.criticalStock && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate mt-0.5 opacity-70">
                                            {product.category} • <span className="text-foreground/80 font-semibold"><CountingNumber value={product.sales} suffix=" Satış" /></span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-bold text-xs sm:text-sm text-blue-500 dark:text-blue-400 tracking-tight tabular-nums">
                                        <CountingNumber value={product.price || 0} prefix="₺" grouping />
                                    </span>
                                    {!isVerySmall && !isShort && (
                                        <p className={cn(
                                            "text-[9px] uppercase tracking-wider mt-0.5",
                                            product.stock <= product.criticalStock ? "text-rose-500 font-bold" : "text-muted-foreground/60"
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
