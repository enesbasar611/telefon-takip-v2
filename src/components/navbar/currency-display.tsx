"use client";

import { useState, useEffect } from "react";
import { DollarSign, Euro, Coins, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyPopover } from "./currency-popover";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { cn } from "@/lib/utils";
import { CountingNumber } from "@/components/ui/counting-number";

export function CurrencyDisplay({ mobile = false }: { mobile?: boolean }) {
  const { rates } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!rates) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn("bg-emerald-500/10 animate-pulse rounded-xl border border-emerald-500/25 shrink-0", mobile ? "h-8 w-[114px]" : "h-10 w-[144px]")} />
        <div className={cn("bg-sky-500/10 animate-pulse rounded-xl border border-sky-500/25 shrink-0", mobile ? "h-8 w-[114px]" : "h-10 w-[144px]")} />
        <div className={cn("bg-amber-500/10 animate-pulse rounded-xl border border-amber-500/25 shrink-0", mobile ? "h-8 w-[138px]" : "h-10 w-[174px]")} />
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

  // Base pill class with fixed immutable dimensions and zero width layout animation
  const badgeBaseClass = cn(
    "rounded-xl border transition-colors duration-150 flex items-center justify-between shadow-none group shrink-0 select-none overflow-hidden backdrop-blur-md",
    mobile ? "h-8 px-2 text-[10px]" : "h-10 px-3 text-xs"
  );

  // 1. Dolar - Yeşil (Emerald) Teması
  const usdClass = cn(
    badgeBaseClass,
    mobile ? "w-[114px]" : "w-[144px]",
    "bg-emerald-500/8 hover:bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_2px_10px_rgba(16,185,129,0.06)] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/35 dark:hover:border-emerald-400/60 dark:shadow-[0_0_12px_rgba(16,185,129,0.12)]"
  );

  // 2. Euro - Mavi (Sky/Blue) Teması
  const eurClass = cn(
    badgeBaseClass,
    mobile ? "w-[114px]" : "w-[144px]",
    "bg-sky-500/8 hover:bg-sky-500/15 border-sky-500/30 hover:border-sky-500/50 shadow-[0_2px_10px_rgba(14,165,233,0.06)] dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:border-sky-500/35 dark:hover:border-sky-400/60 dark:shadow-[0_0_12px_rgba(14,165,233,0.12)]"
  );

  // 3. Altın - Sarı (Amber/Gold) Teması
  const gaClass = cn(
    badgeBaseClass,
    mobile ? "w-[138px]" : "w-[174px]",
    "bg-amber-500/8 hover:bg-amber-500/15 border-amber-500/30 hover:border-amber-500/50 shadow-[0_2px_10px_rgba(245,158,11,0.06)] dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:border-amber-500/35 dark:hover:border-amber-400/60 dark:shadow-[0_0_12px_rgba(245,158,11,0.12)]"
  );

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* DOLAR - YEŞİL */}
      <CurrencyPopover
        type="usd"
        rate={rates.usd}
        trigger={
          <button className={usdClass}>
            <div className="flex items-center gap-1.5 border-r border-emerald-500/20 pr-2 shrink-0 group-hover:border-emerald-500/40 transition-colors">
              <DollarSign className={cn("text-emerald-600 dark:text-emerald-400 shrink-0", mobile ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={1.75} />
              <span className="text-emerald-900 dark:text-emerald-200 font-bold uppercase shrink-0">Dolar</span>
            </div>
            <div className="flex-1 text-right font-extrabold tracking-tight tabular-nums flex items-center justify-end overflow-hidden pl-1.5">
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold tracking-tight tabular-nums inline-block text-right">
                {mounted && rates.usd ? (
                  <CountingNumber value={rates.usd} prefix="₺" decimals={2} className="tabular-nums" />
                ) : '₺--'}
              </span>
            </div>
          </button>
        }
      />

      {/* EURO - MAVİ */}
      <CurrencyPopover
        type="eur"
        rate={rates.eur}
        trigger={
          <button className={eurClass}>
            <div className="flex items-center gap-1.5 border-r border-sky-500/20 pr-2 shrink-0 group-hover:border-sky-500/40 transition-colors">
              <Euro className={cn("text-sky-600 dark:text-sky-400 shrink-0", mobile ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={1.75} />
              <span className="text-sky-900 dark:text-sky-200 font-bold uppercase shrink-0">Euro</span>
            </div>
            <div className="flex-1 text-right font-extrabold tracking-tight tabular-nums flex items-center justify-end overflow-hidden pl-1.5">
              <span className="text-sky-700 dark:text-sky-300 font-extrabold tracking-tight tabular-nums inline-block text-right">
                {mounted && rates.eur ? (
                  <CountingNumber value={rates.eur} prefix="₺" decimals={2} className="tabular-nums" />
                ) : '₺--'}
              </span>
            </div>
          </button>
        }
      />

      {/* ALTIN - SARI */}
      <CurrencyPopover
        type="ga"
        rate={rates.ga}
        trigger={
          <button className={gaClass}>
            <div className="flex items-center gap-1.5 border-r border-amber-500/20 pr-2 shrink-0 group-hover:border-amber-500/40 transition-colors">
              <Coins className={cn("text-amber-600 dark:text-amber-400 shrink-0", mobile ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={1.75} />
              <span className="text-amber-900 dark:text-amber-200 font-bold uppercase shrink-0">Altın</span>
            </div>
            <div className="flex-1 text-right font-extrabold tracking-tight tabular-nums flex items-center justify-end overflow-hidden pl-1.5">
              <span className="text-amber-700 dark:text-amber-300 font-extrabold tracking-tight tabular-nums inline-block text-right">
                {mounted && rates.ga ? (
                  <CountingNumber value={rates.ga} prefix="₺" decimals={2} className="tabular-nums" />
                ) : '₺--'}
              </span>
            </div>
          </button>
        }
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing || rates.isLocked}
        className={cn("rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0", mobile ? "h-8 w-8" : "h-10 w-10")}
        title={rates.isLocked ? `${rates.remainingMinutes} dk bekleyin` : "Kurları Güncelle"}
      >
        {isRefreshing ? <Loader2 className={cn("animate-spin", mobile ? "h-3 w-3" : "h-4 w-4")} /> : <RefreshCw className={cn(mobile ? "h-3 w-3" : "h-4 w-4")} />}
      </Button>
    </div>
  );
}
