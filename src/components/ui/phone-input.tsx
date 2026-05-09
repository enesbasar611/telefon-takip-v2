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
        // Extract prefix and body from value (e.g., "+90 (533) 111 2233")
        const splitValue = (val: string) => {
            const parts = val.split(" ");
            if (parts.length > 1 && parts[0].startsWith("+")) {
                return { prefix: parts[0], body: parts.slice(1).join(" ") };
            }
            return { prefix: "+90", body: val };
        };

        const { prefix: currentPrefix, body: currentBody } = splitValue(value || "");

        const formatBody = (input: string) => {
            let raw = input.replace(/[^0-9]/g, "");

            // If it's a standard TR number with +90, we can still apply pretty formatting
            // but we won't FORCE it to start with 5 anymore, just pretty format it
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

        const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let p = e.target.value;
            if (!p.startsWith("+")) p = "+" + p.replace(/[^0-9]/g, "");
            else p = "+" + p.slice(1).replace(/[^0-9]/g, "");

            onChange(`${p} ${currentBody}`);
        };

        const handleBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatBody(e.target.value);
            onChange(`${currentPrefix} ${formatted}`);
        };

        return (
            <div className="space-y-2 w-full group">
                {label && (
                    <Label className="font-black text-[10px] text-muted-foreground uppercase ml-1 mb-2 block tracking-widest opacity-70 group-focus-within:opacity-100 group-focus-within:text-blue-500 transition-all">
                        {label} {required && <span className="text-destructive">*</span>}
                    </Label>
                )}
                <div className={cn(
                    "flex items-center bg-card/40 border-2 rounded-2xl overflow-hidden transition-all shadow-sm focus-within:bg-card h-14",
                    error
                        ? "border-destructive/50 ring-4 ring-destructive/10"
                        : "border-border/50 hover:border-border focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10",
                    className
                )}>
                    <div className="flex items-center border-r border-border/50 bg-muted/20 h-full">
                        <input
                            type="text"
                            value={currentPrefix}
                            onChange={handlePrefixChange}
                            className="w-16 bg-transparent border-none outline-none px-3 text-sm font-black text-blue-500 text-center h-full focus:bg-blue-500/10 transition-colors"
                            placeholder="+90"
                        />
                    </div>
                    <input
                        {...props}
                        type="tel"
                        inputMode="numeric"
                        maxLength={16}
                        placeholder="(5xx) xxx xxxx"
                        className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-black text-foreground placeholder:text-muted-foreground/30 h-full w-full tracking-wider"
                        value={currentBody}
                        onChange={handleBodyChange}
                        ref={ref}
                    />
                    {isLookingUp && <Loader2 className="mr-4 h-5 w-5 animate-spin text-blue-500" />}
                </div>
                {error && <p className="text-[10px] font-black text-destructive mt-1 animate-in slide-in-from-top-1 px-1 uppercase tracking-tight">*{error}</p>}
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };




