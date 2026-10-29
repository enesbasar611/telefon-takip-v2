"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, UserPlus, UserCheck, X, Check, Phone, Plus, Sparkles } from "lucide-react";
import { cn, formatPhone, normalizeSearchText } from "@/lib/utils";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  selectedCustomerId?: string;
  onSelectCustomer: (id: string | undefined, name?: string) => void;
  onQuickCreateCustomer: (name: string) => Promise<void>;
  isCreatingCustomer?: boolean;
}

export function CustomerModal({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onQuickCreateCustomer,
  isCreatingCustomer = false,
}: CustomerModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers.slice(0, 25);
    const s = normalizeSearchText(search);
    return customers
      .filter((c: any) => normalizeSearchText(c.name).includes(s) || (c.phone && c.phone.includes(search)))
      .slice(0, 30);
  }, [customers, search]);

  const hasExactMatch = useMemo(() => {
    if (!search.trim()) return false;
    const s = normalizeSearchText(search);
    return customers.some((c: any) => normalizeSearchText(c.name) === s);
  }, [customers, search]);

  const handleSelect = (id: string | undefined, name?: string) => {
    onSelectCustomer(id, name);
    onClose();
  };

  const handleCreate = async () => {
    if (!search.trim()) return;
    await onQuickCreateCustomer(search.trim());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-0 rounded-2xl border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden gap-0">
        <DialogHeader className="p-4 pb-3 border-b border-border/40 bg-muted/15">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold tracking-tight">
                Müşteri Seçimi
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Cari hesap seçin veya perakende devam edin.
              </DialogDescription>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="İsim veya telefon ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-9 bg-background/80 border-border/50 rounded-xl text-xs font-medium focus:bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="max-h-[55vh] overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {/* Quick Option 1: Perakende (İsimsiz) */}
          <button
            type="button"
            onClick={() => handleSelect(undefined, "")}
            className={cn(
              "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group active:scale-[0.99]",
              !selectedCustomerId
                ? "bg-emerald-500/10 border-emerald-500/40 text-foreground shadow-xs"
                : "bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                !selectedCustomerId ? "bg-emerald-500 text-white" : "bg-muted-foreground/10 text-muted-foreground"
              )}>
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">PERAKENDE SATIŞ</div>
                <div className="text-[10px] text-muted-foreground">İsimsiz / Anlık Müşteri</div>
              </div>
            </div>
            {!selectedCustomerId && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <Check className="h-3.5 w-3.5" />
                <span>Seçili</span>
              </div>
            )}
          </button>

          {/* Quick Option 2: Yeni Müşteri Oluştur (if search text exists and not matched) */}
          {search.trim().length > 1 && !hasExactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreatingCustomer}
              className="w-full text-left p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-between shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">HIZLI MÜŞTERİ EKLE</div>
                  <div className="text-xs font-bold truncate">"{search.trim()}"</div>
                </div>
              </div>
              <Plus className="h-4 w-4 opacity-80 shrink-0" />
            </button>
          )}

          {/* Customer List Header */}
          <div className="pt-1 px-1 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Kayıtlı Müşteriler</span>
            <span>{filtered.length} sonuç</span>
          </div>

          {/* Customer Cards */}
          <div className="space-y-1">
            {filtered.map((customer: any) => {
              const isSelected = selectedCustomerId === customer.id;
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer.id, customer.name)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group active:scale-[0.99]",
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-foreground shadow-xs"
                      : "bg-card/70 border-border/30 hover:border-border/60 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    )}>
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">{customer.name}</span>
                        {customer.isVip && (
                          <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">VIP</span>
                        )}
                      </div>
                      {customer.phone && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5 opacity-60" />
                          <span>{formatPhone(customer.phone)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && search.trim() && hasExactMatch && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Müşteri bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/40 bg-muted/10 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-semibold rounded-lg text-muted-foreground"
          >
            Kapat
          </Button>
          {selectedCustomerId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelect(undefined, "")}
              className="h-8 text-xs font-bold rounded-lg border-border/40 hover:bg-rose-500/10 hover:text-rose-600"
            >
              Müşteriyi Kaldır (Perakende)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

