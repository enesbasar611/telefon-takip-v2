"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  AlertTriangle,
  Target,
  Rocket,
  Loader2,
  Package,
  Wrench,
  Search,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPendingProcurement, getDeadStockProducts, getReadyDevices } from "@/lib/actions/insight-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function SmartInsights({ stats, cols = 8, rows = 4 }: { stats: any, cols?: number, rows?: number }) {
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isVerySmall = cols < 8;
  const isShort = rows < 3;

  const insights = [
    {
      id: 1,
      icon: Target,
      title: "Tedarik bekleyenler",
      message: `${stats.pendingProcurementCount} kalem ürün eksikler listesinde sipariş bekliyor.`,
      priority: "HIGH",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      show: Number(stats.pendingProcurementCount) > 0,
      drillDown: true
    },
    {
      id: 2,
      icon: AlertTriangle,
      title: "Ölü stok analizi",
      message: `${stats.deadStockCount} ürün son 90 gündür hiç satılmadı. Kampanya planlayın.`,
      priority: "MEDIUM",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      show: Number(stats.deadStockCount) > 0 && !isShort,
      drillDown: true
    },
    {
      id: 3,
      icon: Rocket,
      title: "Satış performansı",
      message: `Bugünkü satışlar ortalamanın üzerinde seyrediyor. Gelir artışı: +12%`,
      priority: "MEDIUM",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      show: !isVerySmall && !isShort,
      drillDown: false
    },
    {
      id: 4,
      icon: Zap,
      title: "Servis verimliliği",
      message: `${stats.readyDevices} cihaz teslimata hazır bekliyor.`,
      priority: "LOW",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      show: Number(stats.readyDevices) > 0,
      drillDown: true
    }
  ].filter(i => i.show);

  const handleOpenDetail = async (insight: any) => {
    if (!insight.drillDown) return;
    setSelectedInsight(insight);
    setLoading(true);
    setDetails([]);
    try {
      let data = [];
      if (insight.id === 1) data = await getPendingProcurement();
      if (insight.id === 2) data = await getDeadStockProducts();
      if (insight.id === 4) data = await getReadyDevices();
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border shadow-sm overflow-hidden rounded-xl">
      <CardHeader className={cn(
        "flex-shrink-0 flex flex-row items-center justify-between border-b border-border",
        isVerySmall || isShort ? "p-4 py-3" : "p-8 pb-6"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20",
            isVerySmall || isShort ? "h-8 w-8" : "h-10 w-10"
          )}>
            <Zap className={cn("text-emerald-500", isVerySmall || isShort ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          <div>
            <CardTitle className={cn(
              "font-medium tracking-tight font-sans uppercase",
              isVerySmall || isShort ? "text-sm" : "text-lg"
            )}>Tahminleyici zeka</CardTitle>
            {!isVerySmall && !isShort && <p className="text-xs text-muted-foreground font-medium mt-1">İçgörü ve operasyonel analiz</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "flex-1 overflow-y-auto custom-scrollbar",
        isVerySmall || isShort ? "p-4 space-y-3" : "p-8 space-y-6"
      )}>
        {insights.map((insight) => (
          <div
            key={insight.id}
            onClick={() => handleOpenDetail(insight)}
            className={cn(
              "rounded-[1.5rem] border shadow-sm group transition-all duration-300",
              insight.bg,
              insight.border,
              isVerySmall || isShort ? "p-3" : "p-6",
              insight.drillDown ? "cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-95" : "cursor-default"
            )}
          >
            <div className="flex items-start gap-4 md:gap-6">
              <div className={cn(
                "mt-0.5 rounded-[1rem] flex items-center justify-center border bg-card border-border/50 shadow-sm transition-all",
                insight.color,
                isVerySmall || isShort ? "h-8 w-8" : "h-12 w-12",
                insight.drillDown && "group-hover:scale-110 transition-all"
              )}>
                <insight.icon className={cn(isVerySmall || isShort ? "h-4 w-4" : "h-6 w-6")} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={cn("font-extrabold uppercase tracking-tight", isVerySmall || isShort ? "text-[10px]" : "text-sm", insight.color)}>{insight.title}</h4>
                </div>
                {!isShort && (
                  <p className={cn(
                    "font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed",
                    isVerySmall ? "text-[9px]" : "text-xs"
                  )}>
                    {insight.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="p-10 text-center text-gray-600 text-[10px] uppercase tracking-widest">
            Sistem analizi sürüyor...
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white dark:bg-zinc-950/95 backdrop-blur-xl">
          <DialogHeader className={cn("p-10 pb-6 rounded-t-[2.5rem]", selectedInsight?.bg)}>
            <div className="flex items-center gap-6">
              <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center bg-white dark:bg-zinc-900 shadow-xl border border-white/50 dark:border-white/10", selectedInsight?.color)}>
                {selectedInsight?.icon && <selectedInsight.icon className="h-8 w-8" />}
              </div>
              <div>
                <DialogTitle className={cn("text-2xl font-black uppercase tracking-tight", selectedInsight?.color)}>
                  {selectedInsight?.title}
                </DialogTitle>
                <p className="text-xs font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest">Detaylı Analiz & İşlemler</p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-10 pt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Veriler Hazırlanıyor...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {details.length > 0 ? (
                  details.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/10 dark:border-white/5 hover:bg-muted/50 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          {selectedInsight?.id === 1 ? <Package className="h-6 w-6 text-rose-500" /> :
                            selectedInsight?.id === 2 ? <AlertTriangle className="h-6 w-6 text-amber-500" /> :
                              <Wrench className="h-6 w-6 text-blue-500" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground line-clamp-1">{item.name || item.product?.name || item.customer?.name}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                            {selectedInsight?.id === 4 ? `FİŞ: #${item.ticketNumber}` : (item.category?.name || item.product?.category?.name || 'GENEL')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right flex flex-col">
                          <span className="text-sm font-black text-primary">
                            {selectedInsight?.id === 4 ? item.status : (selectedInsight?.id === 1 ? `Eksik: ${item.quantity}` : `Stok: ${item.stock}`)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">
                            {selectedInsight?.id === 1 ? `${item.notes || 'Talep Edildi'}` : (selectedInsight?.id === 2 ? '90+ Gündür Hareketsiz' : 'Teslim Bekliyor')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <div className="inline-flex h-20 w-20 rounded-full bg-muted/30 items-center justify-center mb-4">
                      <Search className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Kayıt Bulunamadı</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
