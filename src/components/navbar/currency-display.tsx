"use client";

import { useState, useEffect } from "react";
import { DollarSign, Euro, Coins, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { CurrencyPopover } from "./currency-popover";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { cn } from "@/lib/utils";

export function CurrencyDisplay({ mobile = false }: { mobile?: boolean }) {
  const { rates } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!rates) {
    return (
      <div className="flex gap-2">
        <div className={cn("bg-muted animate-pulse rounded-xl border border-border", mobile ? "h-8 w-16" : "h-10 w-24")} />
        <div className={cn("bg-muted animate-pulse rounded-xl border border-border", mobile ? "h-8 w-16" : "h-10 w-24")} />
        <div className={cn("bg-muted animate-pulse rounded-xl border border-border", mobile ? "h-8 w-16" : "h-10 w-24")} />
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

  const badgeClass = cn(
    "bg-muted/40 border border-border/40 rounded-xl text-foreground hover:bg-primary/5 hover:border-primary/20 transition-all flex items-center shadow-none group shrink-0",
    mobile ? "h-8 px-2.5 text-[10px] gap-2" : "h-10 px-4 text-xs gap-3"
  );

  return (
    <div className="flex items-center gap-2">
      <CurrencyPopover
        type="usd"
        rate={rates.usd}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-blue-500" strokeWidth={1.5} />
              <span className="text-foreground font-semibold uppercase">Dolar</span>
            </div>
            <span className="text-foreground font-extrabold tracking-tight">
              {mounted ? `₺${rates.usd.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '₺--'}
            </span>
          </button>
        }
      />

      <CurrencyPopover
        type="eur"
        rate={rates.eur}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <Euro className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
              <span className="text-foreground font-semibold uppercase">Euro</span>
            </div>
            <span className="text-foreground font-extrabold tracking-tight">
              {mounted ? `₺${rates.eur.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '₺--'}
            </span>
          </button>
        }
      />

      <CurrencyPopover
        type="ga"
        rate={rates.ga}
        trigger={
          <button className={badgeClass}>
            <div className="flex items-center gap-1.5 border-r border-foreground/10 pr-3 group-hover:border-foreground/20 transition-colors">
              <Coins className="h-3.5 w-3.5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-foreground font-semibold uppercase">Altın</span>
            </div>
            <span className="text-foreground font-extrabold tracking-tight">
              {mounted ? `₺${rates.ga.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '₺--'}
            </span>
          </button>
        }
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing || rates.isLocked}
        className={cn("rounded-xl hover:bg-surface-container-highest text-muted-foreground hover:text-foreground transition-all shrink-0", mobile ? "h-8 w-8" : "h-10 w-10")}
        title={rates.isLocked ? `${rates.remainingMinutes} dk bekleyin` : "Kurları Güncelle"}
      >
        {isRefreshing ? <Loader2 className={cn("animate-spin", mobile ? "h-3 w-3" : "h-4 w-4")} /> : <RefreshCw className={cn(mobile ? "h-3 w-3" : "h-4 w-4")} />}
      </Button>
    </div>
  );
}




