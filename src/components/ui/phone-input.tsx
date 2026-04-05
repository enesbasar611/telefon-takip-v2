"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface PhoneInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    isLookingUp?: boolean;
    label?: string;
    required?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, value, onChange, error, isLookingUp, label, required, ...props }, ref) => {
        const formatPhoneNumber = (value: string) => {
            let raw = value.replace(/[^0-9]/g, "");
            if (raw.startsWith("90") && raw.length > 2) raw = raw.substring(2);
            if (raw.startsWith("0")) raw = raw.substring(1);

            const trimmed = raw.substring(0, 10);
            let formatted = trimmed;
            if (trimmed.length > 3 && trimmed.length <= 6) {
                formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3);
            } else if (trimmed.length > 6 && trimmed.length <= 8) {
                formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6);
            } else if (trimmed.length > 8) {
                formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6, 8) + " " + trimmed.slice(8);
            }
            return formatted;
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhoneNumber(e.target.value);
            onChange(formatted);
        };

        return (
            <div className="space-y-2 w-full">
                {label && (
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1 mb-2 block">
                        {label} {required && <span className="text-destructive">*</span>}
                    </Label>
                )}
                <div className={cn(
                    "flex items-center bg-muted/30 border-2 rounded-xl overflow-hidden transition-all shadow-sm focus-within:bg-background h-[calc(3rem+4px)]",
                    error
                        ? "border-destructive/50 ring-4 ring-destructive/10"
                        : "border-transparent hover:border-border/80 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10",
                    className
                )}>
                    <div className="pl-4 pr-3 flex items-center justify-center border-r border-border/50 h-full bg-muted/20">
                        <span className="text-sm font-bold text-primary/80 select-none">+90</span>
                    </div>
                    <input
                        {...props}
                        type="tel"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="5xx xxx xx xx"
                        className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 h-full w-full"
                        value={value}
                        onChange={handleChange}
                        ref={ref}
                    />
                    {isLookingUp && <Loader2 className="mr-4 h-4 w-4 animate-spin text-primary" />}
                </div>
                {error && <p className="text-xs text-destructive font-bold mt-2 animate-in slide-in-from-top-1 px-1">*{error}</p>}
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
