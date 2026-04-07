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

            // Remove 90 if it exists at the start
            if (raw.startsWith("90") && raw.length > 2) raw = raw.slice(2);
            // Remove 0 if it exists at the start
            if (raw.startsWith("0")) raw = raw.slice(1);

            // Re-enforce starting with 5 (per user rule)
            if (raw.length > 0 && raw[0] !== '5') {
                const firstFive = raw.indexOf('5');
                if (firstFive !== -1) {
                    raw = raw.slice(firstFive);
                } else {
                    raw = "";
                }
            }

            const d = raw.slice(0, 10);
            if (d.length === 0) return "";

            let f = "(" + d.slice(0, 3);
            if (d.length >= 3) {
                f += ") ";
                if (d.length > 3) {
                    f += d.slice(3, 6);
                }
                if (d.length > 6) {
                    f += " " + d.slice(6, 10);
                }
            }
            return f;
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhoneNumber(e.target.value);
            onChange(formatted);
        };

        return (
            <div className="space-y-2 w-full">
                {label && (
                    <Label className="font-medium text-[11px]  text-muted-foreground uppercase ml-1 mb-2 block">
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
                        <span className="text-sm  text-primary/80 select-none">+90</span>
                    </div>
                    <input
                        {...props}
                        type="tel"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="(5xx) xxx xxxx"
                        className="flex-1 bg-transparent border-none outline-none px-4 text-sm  text-foreground placeholder:text-muted-foreground/40 h-full w-full"
                        value={value}
                        onChange={handleChange}
                        ref={ref}
                    />
                    {isLookingUp && <Loader2 className="mr-4 h-4 w-4 animate-spin text-primary" />}
                </div>
                {error && <p className="text-xs text-destructive  mt-2 animate-in slide-in-from-top-1 px-1">*{error}</p>}
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };




