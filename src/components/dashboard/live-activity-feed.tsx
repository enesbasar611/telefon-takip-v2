"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Activity,
  History,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Banknote,
  Wrench,
  Package,
  ShoppingCart,
  Users,
  ChevronRight,
  ShieldAlert,
  Scale
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LiveActivityFeed({ activity }: { activity: any[] }) {
  return (
    <Card className="bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl border border-border/40 dark:border-white/[0.08] shadow-sm h-full flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-md animate-in fade-in">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 px-5 py-3.5 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="font-semibold text-sm tracking-tight uppercase text-foreground">Canlı akış</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gerçek zamanlı etkinlik trafiği</p>
          </div>
        </div>
        <Link href="/raporlar">
          <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all">
            Hepsini gör <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar relative">
        <div className="divide-y divide-border/20">
          {activity.slice(0, 5).map((item) => (
            <div key={item.id} className="p-3 sm:p-3.5 hover:bg-muted/30 transition-colors group">
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
                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <h4 className="font-semibold text-xs text-foreground truncate uppercase">{item.title}</h4>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap tracking-tight bg-muted/60 px-1.5 py-0.5 rounded-md tabular-nums">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground truncate group-hover:text-foreground transition-colors leading-snug">
                    <span className="text-foreground/90 font-semibold">{item.user}</span> • {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {activity.length > 5 && (
            <Link href="/raporlar" className="flex items-center justify-center gap-1.5 py-2.5 bg-muted/10 hover:bg-muted/20 text-[10px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors">
              <span>{activity.length - 5} KAYIT DAHA VAR</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
          {activity.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
              Henüz etkinlik yok.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
