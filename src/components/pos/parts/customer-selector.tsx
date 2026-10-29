"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, CheckCircle, ChevronRight, Plus, Search, User, UserCircle, UserPlus, X } from "lucide-react";
import { cn, formatPhone, normalizeSearchText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface CustomerSelectorProps {
    customers: any[];
    selectedCustomerId?: string;
    setSelectedCustomerId: (id: string | undefined) => void;
    customerSearch: string;
    setCustomerSearch: (s: string) => void;
    isCompact?: boolean;
    onNewCustomer: (name: string) => Promise<void>;
    isProcessing?: boolean;
}

export const CustomerSelector = ({
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    customerSearch,
    setCustomerSearch,
    isCompact = false,
    onNewCustomer,
    isProcessing = false
}: CustomerSelectorProps) => {
    const activeCustomer = customers.find(c => c.id === selectedCustomerId);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClear = () => {
        setSelectedCustomerId(undefined);
        setCustomerSearch("");
        setIsOpen(false);
        inputRef.current?.focus();
    };

    if (isCompact) {
        const filteredCustomers = customers
            .filter(c => !customerSearch || normalizeSearchText(c.name).includes(normalizeSearchText(customerSearch)) || (c.phone && c.phone.includes(customerSearch)))
            .slice(0, 10);

        const hasExactMatch = customers.some(c => normalizeSearchText(c.name) === normalizeSearchText(customerSearch));
        const showDropdown = isOpen && (!selectedCustomerId || customerSearch.length > 0);

        return (
            <div className="space-y-1.5" ref={containerRef}>
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                        MÜŞTERİ SEÇİMİ
                    </Label>
                    {customerSearch.length > 2 && !hasExactMatch && !selectedCustomerId && (
                        <button
                            type="button"
                            onClick={() => onNewCustomer(customerSearch)}
                            disabled={isProcessing}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-all bg-primary/10 px-2 py-0.5 rounded-md disabled:opacity-50"
                        >
                            <Plus className="h-3 w-3" />
                            HIZLI KAYIT
                        </button>
                    )}
                </div>

                <div className="relative group">
                    <UserCircle className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors shrink-0 pointer-events-none",
                        selectedCustomerId ? "text-primary" : "text-muted-foreground group-focus-within:text-primary"
                    )} />

                    <Input
                        ref={inputRef}
                        placeholder="Müşteri ara veya yeni isim gir..."
                        value={activeCustomer ? activeCustomer.name : customerSearch}
                        onFocus={() => setIsOpen(true)}
                        onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            if (selectedCustomerId) setSelectedCustomerId(undefined);
                            setIsOpen(true);
                        }}
                        className={cn(
                            "h-9 rounded-xl border border-border/50 bg-background/80 pl-9 pr-8 text-xs font-medium text-foreground transition-all focus:bg-background focus:ring-1 focus:ring-primary/30",
                            selectedCustomerId && "font-bold text-primary bg-primary/5 border-primary/30"
                        )}
                    />

                    {(selectedCustomerId || customerSearch.length > 0) && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Temizle"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {/* Dropdown Opening DOWNWARDS */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 w-full mt-1.5 bg-card/95 dark:bg-[#0c121d]/95 backdrop-blur-2xl border border-border/70 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
                            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar no-scrollbar space-y-1">
                                {/* Quick New Customer Creation */}
                                {customerSearch.length > 1 && !hasExactMatch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onNewCustomer(customerSearch);
                                            setIsOpen(false);
                                        }}
                                        disabled={isProcessing}
                                        className="w-full text-left p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-between shadow-xs disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                                                <Plus className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest leading-none">YENİ MÜŞTERİ</span>
                                                <span className="text-xs font-bold truncate mt-0.5">{customerSearch}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 opacity-70 shrink-0" />
                                    </button>
                                )}

                                {/* Retail (Nameless) Option */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCustomerId(undefined);
                                        setCustomerSearch("");
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-all flex items-center justify-between group border border-border/40"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-md bg-muted-foreground/10 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                                            <User className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground tracking-wide">PERAKENDE (İSİMSİZ)</span>
                                    </div>
                                    <CheckCircle className={cn("h-4 w-4 text-emerald-500 shrink-0", !selectedCustomerId ? "opacity-100" : "opacity-0")} />
                                </button>

                                {/* Customer Results */}
                                {filteredCustomers.map(customer => (
                                    <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerId(customer.id);
                                            setCustomerSearch(customer.name);
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-all flex items-center justify-between group border border-transparent hover:border-border/30"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                                                <UserCircle className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate">{customer.name}</span>
                                                {customer.phone && (
                                                    <span className="text-[10px] text-muted-foreground font-medium">{formatPhone(customer.phone)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <CheckCircle className={cn("h-4 w-4 text-primary shrink-0 transition-opacity", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                                    </button>
                                ))}

                                {filteredCustomers.length === 0 && customerSearch.length > 0 && hasExactMatch && (
                                    <p className="p-2 text-center text-xs text-muted-foreground">Müşteri bulunamadı.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Standard Popover View for other screens
    return (
        <div className="flex items-center gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98] group relative overflow-hidden",
                        selectedCustomerId
                            ? "bg-primary/5 border-primary/20 shadow-xs"
                            : "bg-muted/30 border-border/40 hover:bg-muted/50 hover:border-border"
                    )}>
                        <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                            selectedCustomerId ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                        )}>
                            <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">MÜŞTERİ SEÇİMİ</span>
                            <span className="text-xs font-bold text-foreground truncate w-full flex items-center gap-1.5">
                                {activeCustomer ? activeCustomer.name : (customerSearch || "PERAKENDE SATIŞ")}
                                {activeCustomer?.isVip && <CheckCircle className="h-3 w-3 text-primary shrink-0" />}
                            </span>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0 rounded-xl border-border/50 shadow-2xl" align="start">
                    <div className="p-3 border-b border-border/20 bg-muted/10">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                className="w-full bg-background/80 border border-border/40 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                                placeholder="İsim veya telefon ile ara..."
                                autoFocus
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1.5 custom-scrollbar space-y-1">
                        {customerSearch.length > 2 && !customers.find(c => normalizeSearchText(c.name) === normalizeSearchText(customerSearch)) && (
                            <button
                                onClick={() => onNewCustomer(customerSearch)}
                                className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                            >
                                <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                                    <UserPlus className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">YENİ MÜŞTERİ OLUŞTUR</span>
                                    <span className="text-xs font-bold truncate">{customerSearch}</span>
                                </div>
                            </button>
                        )}

                        <button
                            onClick={() => { setSelectedCustomerId(undefined); setCustomerSearch(""); }}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all hover:bg-muted border border-border/20"
                        >
                            <div className="h-7 w-7 rounded-md bg-muted-foreground/10 text-muted-foreground flex items-center justify-center shrink-0">
                                <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-bold text-muted-foreground hover:text-foreground tracking-wide">PERAKENDE (İSİMSİZ)</span>
                            {!selectedCustomerId && <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                        </button>

                        {customers
                            .filter(c => normalizeSearchText(c.name).includes(normalizeSearchText(customerSearch)) || (c.phone && c.phone.includes(customerSearch)))
                            .slice(0, 50)
                            .map(customer => (
                                <button
                                    key={customer.id}
                                    onClick={() => { setSelectedCustomerId(customer.id); }}
                                    className={cn(
                                        "w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all hover:bg-muted/60",
                                        selectedCustomerId === customer.id && "bg-primary/10"
                                    )}
                                >
                                    <div className={cn(
                                        "h-7 w-7 rounded-md flex items-center justify-center transition-all shrink-0",
                                        selectedCustomerId === customer.id ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                                    )}>
                                        <UserCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-foreground truncate">{customer.name}</span>
                                        {customer.phone && (
                                            <span className="text-[10px] text-muted-foreground font-medium">{formatPhone(customer.phone)}</span>
                                        )}
                                    </div>
                                    {selectedCustomerId === customer.id && <CheckCircle className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                                </button>
                            ))
                        }
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
