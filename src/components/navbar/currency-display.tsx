"use client";

import { useState, useEffect } from "react";
import { DollarSign, Euro, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { CurrencyConverterModal } from "./currency-converter-modal";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

export function CurrencyDisplay() {
  const { rates } = useDashboardData();

  if (!rates) {
    return (
      <div className="flex gap-3">
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
      </div>
    );
  }

  const badgeClass = "h-10 px-4 bg-surface-container-low border-none rounded-xl text-xs font-bold text-foreground hover:bg-surface-container-highest transition-all flex items-center gap-3 shadow-sm group";

  return (
    <div className="flex items-center gap-3">
      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
              <span className="text-foreground font-semibold">Dolar:</span>
            </div>
            <span className="text-foreground font-extrabold">₺{rates.usd.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />

      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <Euro className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              <span className="text-foreground font-semibold">Euro:</span>
            </div>
            <span className="text-foreground font-extrabold">₺{rates.eur.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />

      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <Coins className="h-3.5 w-3.5 text-tertiary" strokeWidth={1.5} />
              <span className="text-foreground font-semibold">Altın:</span>
            </div>
            <span className="text-foreground font-extrabold">₺{rates.ga.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />
    </div>
  );
}
