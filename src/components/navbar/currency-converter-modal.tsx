"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Euro, Coins, RefreshCcw, Loader2 } from "lucide-react";
import { syncAllRates } from "@/lib/actions/currency-actions";
import { toast } from "sonner";

interface CurrencyConverterModalProps {
  rates: {
    usd: number;
    eur: number;
    ga: number;
    isLocked: boolean;
    remainingMinutes: number;
  };
  trigger: React.ReactNode;
}

export function CurrencyConverterModal({ rates, trigger }: CurrencyConverterModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Converter states
  const [usd, setUsd] = useState<string>("");
  const [usdTl, setUsdTl] = useState<string>("");

  const [eur, setEur] = useState<string>("");
  const [eurTl, setEurTl] = useState<string>("");

  const [gold, setGold] = useState<string>("");
  const [goldTl, setGoldTl] = useState<string>("");

  const handleSync = async () => {
    setLoading(true);
    const result = await syncAllRates();
    setLoading(false);

    if (result.success) {
      toast.success("Kurlar başarıyla güncellendi.");
    } else {
      toast.error(result.error || "Bir hata oluştu.");
    }
  };

  // USD Logic
  const onUsdChange = (val: string) => {
    setUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setUsdTl((num * rates.usd).toFixed(2));
    } else {
      setUsdTl("");
    }
  };

  const onUsdTlChange = (val: string) => {
    setUsdTl(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setUsd((num / rates.usd).toFixed(2));
    } else {
      setUsd("");
    }
  };

  // EUR Logic
  const onEurChange = (val: string) => {
    setEur(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setEurTl((num * rates.eur).toFixed(2));
    } else {
      setEurTl("");
    }
  };

  const onEurTlChange = (val: string) => {
    setEurTl(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setEur((num / rates.eur).toFixed(2));
    } else {
      setEur("");
    }
  };

  // Gold Logic
  const onGoldChange = (val: string) => {
    setGold(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setGoldTl((num * rates.ga).toFixed(2));
    } else {
      setGoldTl("");
    }
  };

  const onGoldTlChange = (val: string) => {
    setGoldTl(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setGold((num / rates.ga).toFixed(2));
    } else {
      setGold("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-card border-border rounded-xl p-10 max-w-2xl shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between mb-8">
          <div>
            <DialogTitle className="text-2xl font-extrabold">Döviz ve altın çevirici</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Canlı kurlar üzerinden anlık hesaplama yapın</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={loading || rates.isLocked}
            className="rounded-xl border-border bg-muted hover:bg-blue-500/10 hover:text-blue-500 transition-all flex gap-2 h-10 px-6 font-bold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {rates.isLocked ? `${rates.remainingMinutes} dk` : "Güncelle"}
          </Button>
        </DialogHeader>

        <div className="space-y-10">
          {/* USD Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <DollarSign className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-extrabold">Amerikan doları</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Dolar miktarı</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={usd}
                  onChange={(e) => onUsdChange(e.target.value)}
                  className="rounded-xl border-border focus:ring-blue-500 focus:border-blue-500 h-12 text-base font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Türk lirası karşılığı</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={usdTl}
                  onChange={(e) => onUsdTlChange(e.target.value)}
                  className="rounded-xl border-border focus:ring-blue-500 focus:border-blue-500 h-12 text-base font-bold"
                />
              </div>
            </div>
          </div>

          {/* EUR Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Euro className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-extrabold">Avrupa para birimi</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Euro miktarı</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={eur}
                  onChange={(e) => onEurChange(e.target.value)}
                  className="rounded-xl border-border focus:ring-blue-500 focus:border-blue-500 h-12 text-base font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Türk lirası karşılığı</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={eurTl}
                  onChange={(e) => onEurTlChange(e.target.value)}
                  className="rounded-xl border-border focus:ring-blue-500 focus:border-blue-500 h-12 text-base font-bold"
                />
              </div>
            </div>
          </div>

          {/* Gold Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Coins className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-extrabold">Gram altın</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Altın miktarı (gr)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={gold}
                  onChange={(e) => onGoldChange(e.target.value)}
                  className="rounded-xl border-border focus:ring-blue-500 focus:border-blue-500 h-12 text-base font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Türk lirası karşılığı</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={goldTl}
                  onChange={(e) => onGoldTlChange(e.target.value)}
                  className="rounded-xl border-border focus:ring-blue-500 focus:border-blue-500 h-12 text-base font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
