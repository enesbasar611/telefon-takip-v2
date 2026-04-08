"use client";

import { useState, useEffect } from "react";
import { DollarSign, Euro, Coins, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { CurrencyConverterModal } from "./currency-converter-modal";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

export function CurrencyDisplay() {
  const { rates } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!rates) {
    return (
      <div className="flex gap-3">
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-xl border border-border" />
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { syncAllRates } = await import("@/lib/actions/currency-actions");
      const result = await syncAllRates();
      if (result.success) {
        toast.success("Kurlar başarıyla güncellendi.");
      } else {
        toast.error(result.error || "Güncelleme sınırına takıldınız.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const badgeClass = "h-10 px-4 bg-surface-container-low border-none rounded-xl text-xs text-foreground hover:bg-surface-container-highest transition-all flex items-center gap-3 shadow-sm group";

  return (
    <div className="flex items-center gap-3">
      <CurrencyConverterModal
        rates={rates}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-blue-500" strokeWidth={1.5} />
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
              <Euro className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
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
              <Coins className="h-3.5 w-3.5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-foreground font-semibold">Altın:</span>
            </div>
            <span className="text-foreground font-extrabold">₺{rates.ga.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </button>
        }
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing || rates.isLocked}
        className="h-10 w-10 rounded-xl hover:bg-surface-container-highest text-muted-foreground hover:text-foreground transition-all"
        title={rates.isLocked ? `${rates.remainingMinutes} dk bekleyin` : "Kurları Güncelle"}
      >
        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      </Button>
    </div>
  );
}




