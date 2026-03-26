"use client";

import { useState, useEffect } from "react";
import { DollarSign, Euro, TrendingUp, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getExchangeRates } from "@/lib/actions/currency-actions";

export function CurrencyDisplay() {
  const [rates, setRates] = useState({ usd: 0, eur: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      const data = await getExchangeRates();
      setRates(data);
      setLoading(false);
    }
    fetchRates();
  }, []);

  if (loading) return <div className="h-10 w-24 bg-slate-900/40 animate-pulse rounded-xl border border-slate-800/50" />;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-10 px-4 bg-slate-900/40 border border-slate-800/50 rounded-xl text-[10px] font-black   text-slate-400 hover:text-blue-500 hover:border-blue-500/20 transition-all flex gap-3 shadow-none group">
            <div className="flex items-center gap-1.5 border-r border-slate-800/50 pr-3 group-hover:border-blue-500/20 transition-colors">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              <span className="text-white">{rates.usd.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Euro className="h-3 w-3 text-blue-500" />
              <span className="text-white">{rates.eur.toFixed(2)}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white p-2 min-w-[180px] shadow-none">
          <div className="p-3">
             <p className="text-[10px] font-black   text-gray-500 mb-1">Döviz Kurları</p>
             <p className="text-[9px] font-bold text-gray-600 ">Son Güncelleme: Otomatik</p>
          </div>
          <DropdownMenuItem className="p-3 text-xs font-bold rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center group">
             <RefreshCcw className="h-4 w-4 text-blue-500 group-hover:rotate-180 transition-transform duration-500" /> Kurları Güncelle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
