"use client";

import React from "react";
import { Check, CheckCircle, ChevronRight, Plus, Search, User, UserCircle, UserPlus } from "lucide-react";
import { cn, formatPhone } from "@/lib/utils";
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

    if (isCompact) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">MÜŞTERİ SEÇİMİ</Label>
                    {customerSearch.length > 2 && !customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                        <button
                            onClick={() => onNewCustomer(customerSearch)}
                            disabled={isProcessing}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-all bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            HIZLI KAYIT
                        </button>
                    )}
                </div>

                <div className="relative group">
                    <UserCircle className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300",
                        selectedCustomerId ? "text-blue-500" : "text-muted-foreground group-focus-within:text-blue-500")}
                    />
                    <Input
                        placeholder="Müşteri ara veya yeni isim gir..."
                        value={activeCustomer ? activeCustomer.name : customerSearch}
                        onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            if (selectedCustomerId) setSelectedCustomerId(undefined);
                        }}
                        className="h-11 rounded-xl border border-border/50 bg-muted/40 pl-10 pr-3 text-xs font-medium text-foreground transition-all focus:bg-background focus:ring-4 focus:ring-blue-500/5"
                    />

                    {(customerSearch.length > 0 && !selectedCustomerId) && (
                        <div className="absolute bottom-full left-0 w-full mb-4 bg-background/95 backdrop-blur-xl border-2 border-border/50 rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="max-h-72 overflow-y-auto p-3 custom-scrollbar no-scrollbar">
                                {!customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                    <button
                                        onClick={() => onNewCustomer(customerSearch)}
                                        disabled={isProcessing}
                                        className="w-full text-left p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-between mb-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black opacity-70 uppercase tracking-widest">YENİ MÜŞTERİ</span>
                                                <span className="text-sm font-bold truncate max-w-[180px]">{customerSearch}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 opacity-50" />
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setSelectedCustomerId(undefined);
                                        setCustomerSearch("");
                                    }}
                                    className="w-full text-left p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-between mb-2 group border border-border/40"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted-foreground/10 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <span className="text-[11px] font-black text-muted-foreground group-hover:text-foreground tracking-widest">PERAKENDE (İSİMSİZ)</span>
                                    </div>
                                    <CheckCircle className={cn("h-5 w-5 text-emerald-500", !selectedCustomerId ? "opacity-100" : "opacity-0")} />
                                </button>

                                {customers
                                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
                                    .slice(0, 10)
                                    .map(customer => (
                                        <button
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomerId(customer.id);
                                                setCustomerSearch(customer.name);
                                            }}
                                            className="w-full text-left p-4 rounded-2xl hover:bg-muted/40 transition-all flex items-center justify-between mb-1 group border border-transparent hover:border-border/40"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-500/5 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                    <UserCircle className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{customer.name}</span>
                                                    {customer.phone && (
                                                        <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">{formatPhone(customer.phone)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <CheckCircle className={cn("h-5 w-5 text-blue-600 transition-opacity", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Standard Popover View for POSInterface
    return (
        <div className="flex items-center gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "flex-1 flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border transition-all active:scale-[0.98] group relative overflow-hidden",
                        selectedCustomerId
                            ? "bg-blue-500/5 border-blue-500/20 shadow-lg shadow-blue-500/5"
                            : "bg-muted/30 border-border/40 hover:bg-muted/50 hover:border-border"
                    )}>
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                            selectedCustomerId ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-muted-foreground/10 text-muted-foreground"
                        )}>
                            <User className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">MÜŞTERİ SEÇİMİ</span>
                            <span className="text-[15px] font-bold text-foreground truncate w-full flex items-center gap-2">
                                {activeCustomer ? activeCustomer.name : (customerSearch || "PERAKENDE SATIŞ")}
                                {activeCustomer?.isVip && <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                            </span>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0 rounded-[2rem] border-border/40 shadow-2xl" align="start">
                    <div className="p-4 border-b border-border/10 bg-muted/5">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                className="w-full bg-muted/40 border-none rounded-xl pl-11 pr-4 py-3 text-[13px] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="İsim veya telefon ile ara..."
                                autoFocus
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
                        {customerSearch.length > 2 && !customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                            <button
                                onClick={() => onNewCustomer(customerSearch)}
                                className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all mb-2 shadow-xl shadow-primary/10"
                            >
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black opacity-70 uppercase tracking-widest">YENİ MÜŞTERİ OLUŞTUR</span>
                                    <span className="text-[14px] font-bold truncate max-w-[200px]">{customerSearch}</span>
                                </div>
                            </button>
                        )}

                        <button
                            onClick={() => { setSelectedCustomerId(undefined); setCustomerSearch(""); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] transition-all hover:bg-primary/5 border-b border-border/10 mb-1 group"
                        >
                            <div className="h-9 w-9 rounded-lg bg-muted-foreground/10 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-muted-foreground group-hover:text-foreground tracking-tight">PERAKENDE (İSİMSİZ)</span>
                            {!selectedCustomerId && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                        </button>

                        {customers
                            .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
                            .slice(0, 50)
                            .map(customer => (
                                <button
                                    key={customer.id}
                                    onClick={() => { setSelectedCustomerId(customer.id); }}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] transition-all hover:bg-primary/5 border-b border-border/10 last:border-none",
                                        selectedCustomerId === customer.id && "bg-primary/10"
                                    )}
                                >
                                    <div className={cn(
                                        "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                                        selectedCustomerId === customer.id ? "bg-primary text-white" : "bg-muted/40 text-muted-foreground"
                                    )}>
                                        <UserCircle className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="font-bold text-foreground/90 truncate">{customer.name}</span>
                                        {customer.phone && (
                                            <span className="text-[10px] text-blue-500 font-medium">{formatPhone(customer.phone)}</span>
                                        )}
                                    </div>
                                    {selectedCustomerId === customer.id && <CheckCircle className="ml-auto h-4 w-4 text-primary" />}
                                </button>
                            ))
                        }
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
