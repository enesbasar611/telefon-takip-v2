"use client";

import { useState, useEffect } from "react";
import { DollarSign, Euro, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { CurrencyConverterModal } from "./currency-converter-modal";

export function CurrencyDisplay() {
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      const data = await getExchangeRates();
      setRates(data);
      setLoading(false);
    }
    fetchRates();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
      </div>
    );
  }

  const badgeClass = "h-10 px-4 bg-muted border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-blue-500 hover:border-blue-500/20 transition-all flex items-center gap-3 shadow-sm group";

  return (
    <div className="flex items-center gap-3">
      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-border pr-3 group-hover:border-blue-500/20 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
              <span className="text-foreground">Dolar:</span>
            </div>
            <span className="text-foreground">₺{rates.usd.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />

      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-border pr-3 group-hover:border-blue-500/20 transition-colors">
              <Euro className="h-3.5 w-3.5 text-blue-500" strokeWidth={1.5} />
              <span className="text-foreground">Euro:</span>
            </div>
            <span className="text-foreground">₺{rates.eur.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />

      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-border pr-3 group-hover:border-blue-500/20 transition-colors">
              <Coins className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
              <span className="text-foreground">Altın:</span>
            </div>
            <span className="text-foreground">₺{rates.ga.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />
    </div>
  );
}
