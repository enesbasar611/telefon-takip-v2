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
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LiveActivityFeed({ activity }: { activity: any[] }) {
  return (
    <Card className="bg-card border border-border/5 shadow-2xl h-auto flex flex-col overflow-hidden rounded-[2rem] transition-all duration-500">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-slate-100 dark:border-border/50 p-8 pb-6 bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shadow-primary/5">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-medium text-lg font-sans">Canlı akış</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Gerçek zamanlı etkinlik trafiği</p>
          </div>
        </div>
        <Link href="/raporlar">
          <Button variant="outline" className="text-[10px] uppercase tracking-tighter text-primary border-primary/20 hover:bg-primary/5 h-9 rounded-xl px-4 transition-all">
            Hepsini gör <ChevronRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar relative">
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {activity.slice(0, 5).map((item) => (
            <div key={item.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all duration-300 group">
              <div className="flex items-start gap-5">
                <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${item.type === 'SERVICE' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/10 border-secondary/20 text-secondary'}`}>
                  {item.type === 'SERVICE' ? <Wrench className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h4 className="font-medium text-[13px] text-foreground truncate font-sans">{item.title}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap tracking-[0.1em] bg-muted px-2 py-0.5 rounded">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-muted-foreground truncate group-hover:text-foreground transition-colors leading-relaxed">
                    <span className="text-foreground">{item.user}</span> • {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {activity.length > 5 && (
            <Link href="/raporlar" className="flex flex-col items-center justify-center py-4 bg-muted/5 border-t border-border/10 group cursor-pointer">
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] group-hover:text-primary transition-colors">
                {activity.length - 5} KAYIT DAHA VAR
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 rotate-90 mt-1 animate-bounce" />
            </Link>
          )}
          {activity.length === 0 && (
            <div className="p-10 text-center text-gray-600 text-[10px]">
              Henüz etkinlik yok.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





