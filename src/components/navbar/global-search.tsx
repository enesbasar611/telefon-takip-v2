"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Search, User, Smartphone, Ticket, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { globalSearchAction } from "@/lib/actions/search-actions";
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
          const res = await globalSearchAction(query);
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
        placeholder="Ürün, Müşteri veya Servis ara..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        className="w-full bg-slate-900/40 border-border/10/50 pl-10 h-10 rounded-xl text-[10px] font-bold text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:bg-slate-900/60 transition-all"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[8px] font-black text-slate-500">SHIFT + S</span>
        </div>
      </div>

      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0F172A]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
            <div className="p-3 mb-2 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3 text-blue-400" />
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest text-center">
                Shift + S ile Detaylı Arama Yap
              </p>
            </div>

            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((r: any, i: number) => (
                  <Link
                    key={i}
                    href={r.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-600/10 group transition-all"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{r.breadcrumb}</span>
                        <Badge className="h-3 text-[7px] font-black px-1 pb-0 border-none bg-white/10 text-slate-300">
                          {r.type}
                        </Badge>
                      </div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">{r.title}</span>
                      <span className="text-[9px] text-slate-600 font-bold truncate max-w-[250px]">{r.subtitle}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-[10px] font-bold text-slate-600">Sonuç bulunamadı.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
