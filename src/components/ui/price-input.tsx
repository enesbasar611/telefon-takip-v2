import React, { useEffect, useState } from "react";
import { Input } from "./input";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number | string;
    onChange: (value: number) => void;
    prefix?: string;
}

const isEmptyPrice = (value: number | string | null | undefined) => {
    return value === "" || value === null || value === undefined || Number(value) === 0;
};

const getDisplayValue = (value: number | string) => {
    return isEmptyPrice(value) ? "" : formatCurrency(value);
};

export const PriceInput = ({ value, onChange, prefix = "₺", className, ...props }: PriceInputProps) => {
    const [displayValue, setDisplayValue] = useState(getDisplayValue(value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(getDisplayValue(value));
        }
    }, [value, isFocused]);

    const handleBlur = () => {
        setIsFocused(false);
        if (!displayValue.trim()) {
            onChange(0);
            setDisplayValue("");
            return;
        }

        const numericValue = parseCurrency(displayValue);
        onChange(numericValue);
        setDisplayValue(getDisplayValue(numericValue));
    };

    const handleFocus = () => {
        setIsFocused(true);
        setDisplayValue(isEmptyPrice(value) ? "" : String(value).replace(".", ","));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = e.target.value.replace(/[^0-9,.]/g, "");
        setDisplayValue(cleaned);
    };

    return (
        <div className="relative group">
            {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    {prefix}
                </span>
            )}
            <Input
                {...props}
                className={cn(className, prefix ? "pl-10" : "")}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                inputMode="decimal"
            />
        </div>
    );
};
