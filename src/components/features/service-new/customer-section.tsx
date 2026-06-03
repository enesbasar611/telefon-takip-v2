"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
    CheckCircle2,
    PersonStanding,
    AlertCircle,
    Loader2,
    UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { normalizePhoneNumber } from "@/components/features/service-new/utils";

interface CustomerSectionProps {
    foundCustomer: any;
    isCustomerCreated: boolean;
    isCreatingCustomer: boolean;
    foundCustomerServiceCount: number;
    handleQuickCustomerCreate: () => void;
    nameSuggestions: any[];
    showNameSuggestions: boolean;
    setShowNameSuggestions: (val: boolean) => void;
    onSuggestionSelect: (customer: any) => void;
}

export function CustomerSection({
    foundCustomer,
    isCustomerCreated,
    isCreatingCustomer,
    foundCustomerServiceCount,
    handleQuickCustomerCreate,
    nameSuggestions,
    showNameSuggestions,
    setShowNameSuggestions,
    onSuggestionSelect
}: CustomerSectionProps) {
    const { register, formState: { errors }, watch, setValue } = useFormContext();

    const watchedPhone = watch("customerPhone");
    const watchedName = watch("customerName");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Input */}
                <div className="space-y-2 group">
                    <Label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1 transition-colors group-hover:text-primary">
                        TELEFON NUMARASI
                    </Label>
                    <div className="relative">
                        <PhoneInput
                            {...register("customerPhone")}
                            onChange={(val: string) => setValue("customerPhone", val)}
                            value={watchedPhone}
                            className={cn(
                                "h-11 rounded-2xl transition-all duration-300",
                                errors.customerPhone ? "border-destructive/40 bg-destructive/5" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                            )}
                        />
                        {foundCustomer && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px]">
                                    KAYITLI MÜŞTERİ
                                </Badge>
                            </div>
                        )}
                    </div>
                    {errors.customerPhone && (
                        <p className="text-[10px] font-bold text-destructive/80 ml-2 animate-in slide-in-from-top-1">
                            {(errors.customerPhone as any).message}
                        </p>
                    )}
                </div>

                {/* Name Input */}
                <div className="space-y-2 group relative">
                    <Label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1 transition-colors group-hover:text-primary">
                        AD SOYAD / ÜNVAN
                    </Label>
                    <div className="relative">
                        <Input
                            {...register("customerName")}
                            placeholder="Müşteri adını girin..."
                            className={cn(
                                "h-11 rounded-2xl pl-10 transition-all duration-300",
                                errors.customerName ? "border-destructive/40 bg-destructive/5" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                            )}
                            onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                        />
                        <PersonStanding className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>

                    {/* Suggestions Dropdown */}
                    {showNameSuggestions && nameSuggestions.length > 0 && (
                        <div className="absolute z-[110] left-0 right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest px-2">EŞLEŞEN MÜŞTERİLER</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                                {nameSuggestions.map((customer) => (
                                    <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() => onSuggestionSelect(customer)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 group/item"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-black text-white group-hover/item:text-primary transition-colors">{customer.name}</span>
                                            <span className="text-[10px] font-medium text-muted-foreground/60">{customer.phone}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-bold border-white/10">{customer.loyaltyPoints || 0} PUAN</Badge>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {errors.customerName && (
                        <p className="text-[10px] font-bold text-destructive/80 ml-2 animate-in slide-in-from-top-1">
                            {(errors.customerName as any).message}
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Customer Actions */}
            {!foundCustomer && watchedPhone && normalizePhoneNumber(watchedPhone).length >= 10 && (
                <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-500">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <Button
                            type="button"
                            onClick={handleQuickCustomerCreate}
                            disabled={isCreatingCustomer || isCustomerCreated}
                            className={cn(
                                "relative rounded-full font-black text-[10px] px-8 h-12 tracking-[0.2em] transition-all duration-500 overflow-hidden",
                                isCustomerCreated
                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.3)] border-transparent text-white"
                                    : "bg-blue-600 hover:bg-blue-500 shadow-[0_10px_20px_rgba(37,99,235,0.2)] border-transparent text-white"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {isCreatingCustomer ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center"
                                    >
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        İŞLENİYOR
                                    </motion.div>
                                ) : isCustomerCreated ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        KAYDEDİLDİ
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="default"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        HEMEN KAYDET
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isCustomerCreated && !isCreatingCustomer && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20 animate-pulse" />
                            )}
                        </Button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
