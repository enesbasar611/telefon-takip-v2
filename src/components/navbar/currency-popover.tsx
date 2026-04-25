"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

interface CurrencyPopoverProps {
    type: "usd" | "eur" | "ga";
    rate: number;
    trigger: React.ReactNode;
}

export function CurrencyPopover({ type, rate, trigger }: CurrencyPopoverProps) {
    const { rates } = useDashboardData();
    const [val, setVal] = useState<string>("");
    const [tlVal, setTlVal] = useState<string>("");
    const [markupType, setMarkupType] = useState<"none" | "dealer" | "customer">("none");

    const dealerProfit = rates?.dealerProfit || 0;
    const customerProfit = rates?.customerProfit || 0;

    const currentProfit = markupType === "dealer" ? dealerProfit : markupType === "customer" ? customerProfit : 0;

    const title = type === "usd" ? "Dolar Çevirici" : type === "eur" ? "Euro Çevirici" : "Altın Çevirici";
    const label = type === "usd" ? "Dolar Miktarı" : type === "eur" ? "Euro Miktarı" : "Gram Altın";

    const calculateTl = (unitVal: string, profit: number) => {
        const num = parseFloat(unitVal);
        if (!isNaN(num)) {
            setTlVal((num * rate + profit).toFixed(2));
        } else {
            setTlVal("");
        }
    };

    const calculateUnit = (totalTl: string, profit: number) => {
        const num = parseFloat(totalTl);
        if (!isNaN(num)) {
            const unit = (num - profit) / rate;
            setVal(unit.toFixed(2));
        } else {
            setVal("");
        }
    };

    const onValChange = (v: string) => {
        setVal(v);
        calculateTl(v, currentProfit);
    };

    const onTlChange = (v: string) => {
        setTlVal(v);
        calculateUnit(v, currentProfit);
    };

    const handleMarkupChange = (type: "dealer" | "customer") => {
        const newType = markupType === type ? "none" : type;
        setMarkupType(newType);

        const newProfit = newType === "dealer" ? dealerProfit : newType === "customer" ? customerProfit : 0;

        // Recalculate TL based on current Unit valuation
        if (val) {
            calculateTl(val, newProfit);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 rounded-[1.5rem] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl animate-in zoom-in-95 duration-200" sideOffset={8}>
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-sm tracking-tight">{title}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">1 Birim = ₺{rate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">{label}</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={val}
                                    onChange={(e) => onValChange(e.target.value)}
                                    className="h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-sm font-bold pr-10"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50 uppercase">
                                    {type === "ga" ? "GR" : type.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="h-4 w-[1px] bg-border/50" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">TL Karşılığı</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={tlVal}
                                    onChange={(e) => onTlChange(e.target.value)}
                                    className="h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-sm font-bold pr-10"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50 uppercase">TRY</span>
                            </div>
                        </div>

                        {/* Markup Options */}
                        <div className="pt-2 flex items-center justify-between gap-4 border-t border-border/40 mt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`dealer-${type}`}
                                    checked={markupType === "dealer"}
                                    onCheckedChange={() => handleMarkupChange("dealer")}
                                    className="rounded-md"
                                />
                                <label
                                    htmlFor={`dealer-${type}`}
                                    className="text-[10px] font-bold uppercase leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Bayi
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`customer-${type}`}
                                    checked={markupType === "customer"}
                                    onCheckedChange={() => handleMarkupChange("customer")}
                                    className="rounded-md"
                                />
                                <label
                                    htmlFor={`customer-${type}`}
                                    className="text-[10px] font-bold uppercase leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Müşteri
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
