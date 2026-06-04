"use client";

import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CartItemProps {
    item: any;
    updateQuantity: (id: string, delta: number) => void;
    updatePrice: (id: string, price: number) => void;
    removeFromCart: (id: string) => void;
    getCartCurrencySymbol: () => string;
    getEquivalentDisplay: (item: any) => string;
    displayPrice?: number;
    isCompact?: boolean;
}

export const CartItem = React.memo(({
    item,
    updateQuantity,
    updatePrice,
    removeFromCart,
    getCartCurrencySymbol,
    getEquivalentDisplay,
    displayPrice,
    isCompact = false
}: CartItemProps) => {
    if (isCompact) {
        return (
            <div className="bg-card border-2 border-border/40 p-4 rounded-[1.5rem] space-y-4 shadow-sm hover:border-blue-500/20 transition-all">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-foreground truncate uppercase tracking-tight">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl transition-all hover:bg-blue-500/10">
                                <span className="text-[10px] text-blue-600 font-black">{getCartCurrencySymbol()}</span>
                                <input
                                    type="number"
                                    value={displayPrice ?? item.sellPrice}
                                    onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                    className="bg-transparent border-none text-[11px] text-blue-700 font-extrabold focus:ring-0 w-20 p-0 h-auto outline-none tabular-nums"
                                />
                            </div>
                            <Badge variant="outline" className="text-[9px] bg-muted/30 border-none text-muted-foreground uppercase">
                                {item.category?.name || "KATEGORİSİZ"}
                            </Badge>
                        </div>
                    </div>
                    <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground/30 hover:text-rose-500 p-2 rounded-xl transition-all hover:bg-rose-500/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t-2 border-border/30">
                    <div className="flex items-center bg-muted/40 rounded-xl p-1 border border-border/30">
                        <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-black text-xs tabular-nums text-foreground">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-black text-foreground tabular-nums">
                            {getCartCurrencySymbol()}{((displayPrice ?? item.sellPrice) * item.quantity).toLocaleString('tr-TR')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Standard List View for POSInterface
    return (
        <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group border-b border-border/40 last:border-none gap-6">
            <div className="flex-1 min-w-0">
                <span className="text-[15px] text-foreground block leading-tight mb-1 truncate">{item.name}</span>
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center rounded-xl border border-primary/35 bg-primary/10 px-2 py-1.5 shadow-sm transition-all group-hover:border-primary/60 group-hover:bg-primary/15">
                        <span className="text-[12px] text-primary font-black absolute left-3">{getCartCurrencySymbol()}</span>
                        <input
                            type="number"
                            value={displayPrice ?? item.sellPrice}
                            onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-none text-[14px] text-primary font-black focus:ring-0 w-24 pl-5 py-0 h-auto"
                            title="Sepet fiyatı değiştirilebilir"
                        />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[11px] font-bold text-muted-foreground/80">
                            {getEquivalentDisplay(item)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
                <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/40">
                    <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white transition-all active:scale-95"
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-[14px] text-foreground w-10 text-center">{item.quantity}</span>
                    <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all active:scale-95"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
                <button
                    className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/40 active:scale-95 group-hover:shadow-lg group-hover:shadow-rose-500/10"
                    onClick={() => removeFromCart(item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
});

CartItem.displayName = "CartItem";
