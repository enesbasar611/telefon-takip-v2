"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Search, User, Smartphone, Ticket, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearch } from "@/lib/actions/search-actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        startTransition(async () => {
          const res = await globalSearch(query);
          setResults(res);
          setIsOpen(true);
        });
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-md group" ref={containerRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform group-focus-within:translate-x-1">
        {isPending ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" /> : <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-500" />}
      </div>
      <Input
        type="search"
        placeholder="Müşteri, cihaz veya IMEI ara..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        className="w-full bg-slate-900/40 border-border/10/50 pl-10 h-10 rounded-xl text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:bg-slate-900/60 transition-all"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <div className="h-5 w-5 rounded border border-white/10 flex items-center justify-center bg-white/[0.02] text-[10px] text-gray-700 font-black">
          ⌘K
        </div>
      </div>

      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/10/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-xl">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">

            {results.customers.length > 0 && (
              <div className="mb-4">
                <p className="px-3 py-2 text-[9px] font-black text-slate-600   flex items-center gap-2">
                  <User className="h-3 w-3" /> Müşteriler
                </p>
                {results.customers.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/musteriler/${c.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-600/10 group transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-200  group-hover:text-blue-400">{c.name}</span>
                      <span className="text-[9px] text-slate-600 font-bold">{c.phone}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}

            {results.tickets.length > 0 && (
              <div className="mb-4">
                <p className="px-3 py-2 text-[9px] font-black text-slate-600   flex items-center gap-2">
                  <Ticket className="h-3 w-3" /> Servis Kayıtları
                </p>
                {results.tickets.map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/servis/${t.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-600/10 group transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-200  group-hover:text-orange-400">{t.ticketNumber}</span>
                      <span className="text-[9px] text-slate-600 font-bold ">{t.customer.name} - {t.deviceBrand} {t.deviceModel}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-800 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}

            {results.devices.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-2 text-[9px] font-black text-slate-600   flex items-center gap-2">
                  <Smartphone className="h-3 w-3" /> Cihaz Merkezi
                </p>
                {results.devices.map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/cihaz-listesi`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-600/10 group transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-200  group-hover:text-emerald-400">{d.name}</span>
                      <span className="text-[9px] text-slate-600 font-bold ">IMEI: {d.deviceInfo?.imei}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-800 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}

            {results.customers.length === 0 && results.tickets.length === 0 && results.devices.length === 0 && (
              <p className="text-center py-8 text-[10px] font-black text-slate-600   italic">Sonuç bulunamadı.</p>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
