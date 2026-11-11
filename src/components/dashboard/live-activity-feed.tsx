"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Banknote,
  Wrench,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActivityFilter = "ALL" | "SERVICE" | "AUDIT" | "FINANCE";

export function LiveActivityFeed({ activity }: { activity: any[] }) {
  const [filter, setFilter] = useState<ActivityFilter>("ALL");

  const safeActivity = activity ?? [];
  const filtered = filter === "ALL"
    ? safeActivity
    : safeActivity.filter((item) => item.type === filter);
  const visible = filtered.slice(0, 6);
  const viewAllHref = filter === "SERVICE" ? "/servis/liste" : filter === "FINANCE" ? "/satis/kasa" : "/ayarlar/loglar";

  return (
    <Card className="bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl border border-border/40 dark:border-white/[0.08] shadow-sm h-full flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-md animate-in fade-in">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between gap-2 border-b border-border/40 px-5 py-3.5 bg-muted/10 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="font-semibold text-sm tracking-tight uppercase text-foreground">Canlı akış</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Operasyon & denetim trafiği</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center p-0.5 rounded-lg bg-muted/50 border border-border/40">
            {[
              { id: "ALL" as const, label: "Tümü" },
              { id: "SERVICE" as const, label: "Servis" },
              { id: "AUDIT" as const, label: "Denetim" },
              { id: "FINANCE" as const, label: "Kasa" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] font-semibold transition-all cursor-pointer",
                  filter === tab.id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link href={viewAllHref}>
            <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all">
              Tümü <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar relative">
        <div className="divide-y divide-border/20">
          {visible.map((item) => {
            const href = item.type === "SERVICE"
              ? (item.ticketId ? `/servis/${item.ticketId}` : "/servis/liste")
              : item.type === "AUDIT"
                ? "/ayarlar/loglar"
                : "/satis/kasa";
            const currencySymbol = item.currency === "USD" ? "$" : item.currency === "EUR" ? "€" : "₺";

            return (
              <Link key={item.id} href={href} className="block p-3 sm:p-3.5 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 shrink-0 ${item.type === 'SERVICE' ? 'bg-primary/10 border-primary/20 text-primary' :
                      item.type === 'AUDIT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        'bg-secondary/10 border-secondary/20 text-secondary'
                    }`}>
                    {item.type === 'SERVICE' ? <Wrench className="h-4 w-4" /> :
                      item.type === 'AUDIT' ? <ShieldAlert className="h-4 w-4" /> :
                        <Banknote className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-semibold text-xs text-foreground truncate uppercase group-hover:text-primary transition-colors">
                        {item.title}
                        {item.amount !== undefined && (
                          <span className="ml-1.5 font-bold tabular-nums text-muted-foreground">
                            ({currencySymbol}{Number(item.amount).toLocaleString("tr-TR")})
                          </span>
                        )}
                      </h4>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap tracking-tight bg-muted/60 px-1.5 py-0.5 rounded-md tabular-nums">
                        {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: tr })}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground truncate group-hover:text-foreground transition-colors leading-snug">
                      <span className="text-foreground/90 font-semibold">{item.user}</span> • {item.message}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length > 6 && (
            <Link href={viewAllHref} className="flex items-center justify-center gap-1.5 py-2.5 bg-muted/10 hover:bg-muted/20 text-[10px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors">
              <span>{filtered.length - 6} KAYIT DAHA VAR</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
              Bu filtrede etkinlik yok.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
