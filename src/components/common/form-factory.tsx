"use client";

import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";
import { FieldDef } from "@/config/industries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormFactoryProps {
    fields: FieldDef[];
    register: UseFormRegister<any>;
    control: Control<any>;
    errors: FieldErrors<any>;
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    /** If true, renders fields in a 2-column grid */
    twoCol?: boolean;
    /** Optional callback for pattern lock fields */
    onPatternClick?: (fieldKey: string) => void;
}

/**
 * Renders a dynamic set of input fields from an industry FieldDef[] config.
 * Supports: text, number, select, textarea.
 * Applies IMEI validation when field.validate === 'imei'.
 */
export function FormFactory({
    fields,
    register,
    control,
    errors,
    className,
    inputClassName,
    labelClassName,
    twoCol = false,
    onPatternClick,
}: FormFactoryProps) {
    const baseInput = cn(
        "h-14 bg-card border-border/50 rounded-2xl px-5 text-sm transition-all",
        inputClassName
    );

    const baseLabel = cn(
        "font-medium text-xs text-muted-foreground",
        labelClassName
    );

    return (
        <div className={cn(
            "grid gap-5",
            twoCol ? "grid-cols-2" : "grid-cols-1",
            className
        )}>
            {fields.map((field) => {
                const error = errors[field.key];

                const validationRules: any = {
                    required: field.required ? `${field.label} gereklidir` : false,
                };

                if (field.validate === "imei") {
                    validationRules.validate = (val: string) => {
                        if (!val) return true; // not required unless field.required
                        if (!/^\d{15}$/.test(val)) return "IMEI numarası tam olarak 15 haneli rakamlardan oluşmalıdır";
                        return true;
                    };
                }

                return (
                    <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key} className={baseLabel}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>

                        {field.type === "select" ? (
                            <Controller
                                name={field.key}
                                control={control}
                                rules={validationRules}
                                render={({ field: controlledField }) => (
                                    <Select
                                        onValueChange={controlledField.onChange}
                                        value={controlledField.value || ""}
                                    >
                                        <SelectTrigger className={cn(baseInput, "px-5")}>
                                            <SelectValue placeholder={field.placeholder || `${field.label} seçin...`} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border/50 text-foreground">
                                            {field.options?.map((opt) => (
                                                <SelectItem key={opt} value={opt} className="text-sm py-2.5">
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        ) : field.type === "textarea" ? (
                            <Textarea
                                id={field.key}
                                placeholder={field.placeholder}
                                {...register(field.key, validationRules)}
                                className={cn(baseInput, "h-24 py-4 resize-none")}
                            />
                        ) : (
                            <div className="relative">
                                {field.validate === "imei" && (
                                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                )}
                                <Input
                                    id={field.key}
                                    type={field.type === "number" ? "number" : "text"}
                                    placeholder={field.placeholder}
                                    {...register(field.key, validationRules)}
                                    className={cn(
                                        baseInput,
                                        field.validate === "imei" && "pl-12",
                                        field.validate === "pattern" && "pr-16"
                                    )}
                                />
                                {field.validate === "pattern" && onPatternClick && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onPatternClick(field.key)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                                        title="Desen Çiz"
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {error && (
                            <p className="text-[10px] text-red-500 ml-1">
                                {error.message as string}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
