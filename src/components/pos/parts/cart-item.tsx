"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Minus, Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CartItemProps {
    item: any;
    updateQuantity: (id: string, delta: number) => void;
    updatePrice: (id: string, price: number, currency?: "TRY" | "USD") => void;
    removeFromCart: (id: string) => void;
    getCartCurrencySymbol: () => string;
    getEquivalentDisplay: (item: any) => string;
    displayPrice?: number;
    isCompact?: boolean;
    saleCurrency?: "TRY" | "USD";
    usdRate?: number;
}

export const CartItem = React.memo(({
    item,
    updateQuantity,
    updatePrice,
    removeFromCart,
    getCartCurrencySymbol,
    getEquivalentDisplay,
    displayPrice,
    isCompact = false,
    saleCurrency = "TRY",
    usdRate = 1
}: CartItemProps) => {
    const rate = usdRate && usdRate > 0 ? usdRate : 1;
    const [inputCurrency, setInputCurrency] = useState<"TRY" | "USD">(saleCurrency || "TRY");
    const [isFocused, setIsFocused] = useState(false);

    // Keep inputCurrency in sync with parent saleCurrency when changed
    useEffect(() => {
        setInputCurrency(saleCurrency || "TRY");
    }, [saleCurrency]);

    const getPriceForCurrency = useCallback((currency: "TRY" | "USD") => {
        if (currency === "USD") {
            if (item.sellPriceUsd !== undefined && item.sellPriceUsd !== null && Number(item.sellPriceUsd) > 0) {
                return Number(item.sellPriceUsd).toFixed(2);
            }
            const tl = Number(item.sellPrice ?? (saleCurrency === "TRY" ? item.unitPrice : 0) ?? 0);
            return Number(tl / rate).toFixed(2);
        } else {
            if (item.sellPrice !== undefined && item.sellPrice !== null && Number(item.sellPrice) > 0) {
                return Number(item.sellPrice).toFixed(2);
            }
            const usd = Number(item.sellPriceUsd ?? (saleCurrency === "USD" ? item.unitPrice : 0) ?? 0);
            return Number(usd * rate).toFixed(2);
        }
    }, [item.sellPrice, item.sellPriceUsd, item.unitPrice, saleCurrency, rate]);

    const [localPrice, setLocalPrice] = useState(() => getPriceForCurrency(inputCurrency));

    useEffect(() => {
        if (!isFocused) {
            setLocalPrice(getPriceForCurrency(inputCurrency));
        }
    }, [inputCurrency, getPriceForCurrency, isFocused]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalPrice(e.target.value);
    };

    const handlePriceBlur = () => {
        setIsFocused(false);
        const parsed = parseFloat(localPrice.replace(',', '.')) || 0;
        updatePrice(item.id, parsed, inputCurrency);
        setLocalPrice(parsed.toFixed(2));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    const handleCurrencyToggle = (newCurrency: "TRY" | "USD") => {
        if (newCurrency === inputCurrency) return;
        const currentVal = parseFloat(localPrice.replace(',', '.')) || 0;
        let convertedVal = 0;
        if (newCurrency === "USD") {
            convertedVal = Number((currentVal / rate).toFixed(2));
        } else {
            convertedVal = Number((currentVal * rate).toFixed(2));
        }
        setInputCurrency(newCurrency);
        setLocalPrice(convertedVal.toFixed(2));
        updatePrice(item.id, convertedVal, newCurrency);
    };

    // Live equivalent calculation for secondary hint
    const numericCurrent = parseFloat(localPrice.replace(',', '.')) || 0;
    const secondaryEquivalent = useMemo(() => {
        if (inputCurrency === "TRY") {
            const usdVal = numericCurrent / rate;
            return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            const tryVal = numericCurrent * rate;
            return `₺${tryVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }, [numericCurrent, inputCurrency, rate]);

    // Active row total in cart currency
    const activeUnitDisplay = displayPrice ?? (saleCurrency === "USD" ? item.sellPriceUsd : item.sellPrice) ?? item.unitPrice ?? 0;
    const rowTotalFormatted = Number(Number(activeUnitDisplay) * item.quantity).toLocaleString(
        saleCurrency === "USD" ? 'en-US' : 'tr-TR',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );

    if (isCompact) {
        return (
            <div className="bg-card border border-border/50 p-3 sm:p-4 rounded-2xl space-y-3 shadow-sm hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate uppercase tracking-tight">{item.name}</h4>
                        
                        {/* Price & Currency Controls */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-background/80 border border-border/70 rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary shadow-xs">
                                {/* Segmented Currency Toggle */}
                                <div className="flex items-center bg-muted/70 rounded-lg p-0.5 border border-border/40 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleCurrencyToggle("TRY")}
                                        className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-black transition-all",
                                            inputCurrency === "TRY"
                                                ? "bg-emerald-500 text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Fiyatı Türk Lirası (₺) olarak gir"
                                    >
                                        ₺
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCurrencyToggle("USD")}
                                        className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-black transition-all",
                                            inputCurrency === "USD"
                                                ? "bg-cyan-500 text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Fiyatı Dolar ($) olarak gir"
                                    >
                                        $
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={localPrice}
                                    onFocus={() => setIsFocused(true)}
                                    onChange={handlePriceChange}
                                    onBlur={handlePriceBlur}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none text-xs font-black text-foreground focus:ring-0 w-16 p-0 h-auto outline-none tabular-nums"
                                    title="Fiyatı değiştirmek için dokunun"
                                />
                                <Pencil className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0 pointer-events-none" />
                            </div>

                            {/* Secondary live equivalent badge */}
                            <span className="text-[10px] font-semibold text-muted-foreground/90 tabular-nums">
                                ≈ {secondaryEquivalent}
                            </span>

                            <Badge variant="outline" className="text-[9px] bg-muted/30 border-none text-muted-foreground uppercase ml-auto">
                                {item.category?.name || "GENEL"}
                            </Badge>
                        </div>
                    </div>

                    <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground/40 hover:text-rose-500 p-1.5 rounded-xl transition-all hover:bg-rose-500/10 shrink-0"
                        title="Sepetten Çıkar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div className="flex items-center bg-muted/40 rounded-xl p-0.5 border border-border/30">
                        <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-black text-xs tabular-nums text-foreground">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-black text-foreground tabular-nums">
                            {getCartCurrencySymbol()}{rowTotalFormatted}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Standard List View for POSInterface
    return (
        <div className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group border-b border-border/40 last:border-none gap-4">
            <div className="flex-1 min-w-0">
                <span className="text-[15px] font-medium text-foreground block leading-tight mb-2 truncate">{item.name}</span>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-2 py-1.5 shadow-xs transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
                        {/* Segmented Currency Toggle */}
                        <div className="flex items-center bg-muted/70 rounded-lg p-0.5 border border-border/40 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleCurrencyToggle("TRY")}
                                className={cn(
                                    "px-2 py-0.5 rounded text-[11px] font-black transition-all",
                                    inputCurrency === "TRY"
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Fiyatı Türk Lirası (₺) olarak gir"
                            >
                                ₺
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCurrencyToggle("USD")}
                                className={cn(
                                    "px-2 py-0.5 rounded text-[11px] font-black transition-all",
                                    inputCurrency === "USD"
                                        ? "bg-cyan-500 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Fiyatı Dolar ($) olarak gir"
                            >
                                $
                            </button>
                        </div>

                        <input
                            type="text"
                            inputMode="decimal"
                            value={localPrice}
                            onFocus={() => setIsFocused(true)}
                            onChange={handlePriceChange}
                            onBlur={handlePriceBlur}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent border-none text-[14px] font-black text-foreground focus:ring-0 w-24 p-0 h-auto outline-none tabular-nums"
                            title="Sepet fiyatı değiştirilebilir"
                        />
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 pointer-events-none" />
                    </div>

                    <div className="flex flex-col leading-none">
                        <span className="text-[11px] font-bold text-muted-foreground/90 tabular-nums">
                            ≈ {secondaryEquivalent}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/40">
                    <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white transition-all active:scale-95"
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-[14px] text-foreground w-10 text-center font-bold tabular-nums">{item.quantity}</span>
                    <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all active:scale-95"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
                <div className="text-right min-w-[70px]">
                    <span className="text-sm font-black text-foreground tabular-nums">
                        {getCartCurrencySymbol()}{rowTotalFormatted}
                    </span>
                </div>
                <button
                    className="h-9 w-9 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/30 active:scale-95 shrink-0"
                    onClick={() => removeFromCart(item.id)}
                    title="Sepetten Çıkar"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
});

CartItem.displayName = "CartItem";
