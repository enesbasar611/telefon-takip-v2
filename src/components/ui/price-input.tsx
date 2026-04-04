import React, { useState, useEffect } from "react";
import { Input } from "./input";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number | string;
    onChange: (value: number) => void;
    prefix?: string;
}

export const PriceInput = ({ value, onChange, prefix = "₺", className, ...props }: PriceInputProps) => {
    const [displayValue, setDisplayValue] = useState(formatCurrency(value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value, isFocused]);

    const handleBlur = () => {
        setIsFocused(false);
        const numericValue = parseCurrency(displayValue);
        onChange(numericValue);
        setDisplayValue(formatCurrency(numericValue));
    };

    const handleFocus = () => {
        setIsFocused(true);
        // When focusing, show raw numeric string but with dot replaced by comma just in case
        setDisplayValue(String(value).replace(".", ","));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Only allow digits, commas, and dots while typing
        const cleaned = val.replace(/[^0-9,.]/g, "");
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
                className={cn(prefix ? "pl-8" : "", className)}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </div>
    );
};
