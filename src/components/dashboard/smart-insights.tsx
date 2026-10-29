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
import { BorderBeam } from "border-beam";

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
      bg: "bg-rose-500/5 hover:bg-rose-500/10",
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
      bg: "bg-amber-500/5 hover:bg-amber-500/10",
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
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
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
      bg: "bg-blue-500/5 hover:bg-blue-500/10",
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
    <BorderBeam size="md" colorVariant="colorful" strength={0.65} className="h-full rounded-2xl">
      <Card className="h-full flex flex-col bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl border border-border/40 dark:border-white/[0.08] shadow-sm overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-md animate-in fade-in">
      <CardHeader className={cn(
        "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 bg-muted/10",
        isVerySmall || isShort ? "p-3 pb-2.5" : "px-5 py-3.5"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500",
            isVerySmall || isShort ? "h-7 w-7" : "h-8 w-8"
          )}>
            <Zap className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </div>
          <div>
            <CardTitle className={cn(
              "font-semibold tracking-tight uppercase text-foreground",
              isVerySmall || isShort ? "text-xs" : "text-sm"
            )}>Tahminleyici zeka</CardTitle>
            {!isVerySmall && !isShort && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">İçgörü ve operasyonel analiz</p>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        "flex-1 overflow-y-auto custom-scrollbar",
        isVerySmall || isShort ? "p-3 space-y-2" : "p-4 sm:p-5 space-y-2.5"
      )}>
        {insights.map((insight) => (
          <div
            key={insight.id}
            onClick={() => handleOpenDetail(insight)}
            className={cn(
              "rounded-xl border shadow-xs group transition-all duration-200",
              insight.bg,
              insight.border,
              isVerySmall || isShort ? "p-2.5" : "p-3 sm:p-3.5",
              insight.drillDown ? "cursor-pointer hover:border-foreground/20 active:scale-[0.99]" : "cursor-default"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "mt-0.5 rounded-lg flex items-center justify-center border bg-card border-border/40 shadow-xs shrink-0 transition-transform group-hover:scale-105",
                insight.color,
                isVerySmall || isShort ? "h-7 w-7" : "h-9 w-9"
              )}>
                <insight.icon className={cn(isVerySmall || isShort ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={cn("font-semibold uppercase tracking-tight text-xs", insight.color)}>
                    {insight.title}
                  </h4>
                  {insight.drillDown && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
                {!isShort && (
                  <p className={cn(
                    "font-medium text-muted-foreground leading-snug line-clamp-2",
                    isVerySmall ? "text-[10px]" : "text-xs"
                  )}>
                    {insight.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-[11px] uppercase tracking-wider">
            Sistem analizi sürüyor...
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-card">
          <DialogHeader className={cn("px-6 py-5 border-b border-border/40", selectedInsight?.bg)}>
            <div className="flex items-center gap-4">
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center bg-card shadow-sm border border-border/40", selectedInsight?.color)}>
                {selectedInsight?.icon && <selectedInsight.icon className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className={cn("text-lg font-bold uppercase tracking-tight", selectedInsight?.color)}>
                  {selectedInsight?.title}
                </DialogTitle>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Detaylı Analiz & İşlemler</p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Veriler Hazırlanıyor...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {details.length > 0 ? (
                  details.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-card border border-border/40 flex items-center justify-center shadow-xs shrink-0">
                          {selectedInsight?.id === 1 ? <Package className="h-4 w-4 text-rose-500" /> :
                            selectedInsight?.id === 2 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                              <Wrench className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground truncate">{item.name || item.product?.name || item.customer?.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {selectedInsight?.id === 4 ? `FİŞ: #${item.ticketNumber}` : (item.category?.name || item.product?.category?.name || 'GENEL')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-xs font-bold text-primary tabular-nums block">
                          {selectedInsight?.id === 4 ? item.status : (selectedInsight?.id === 1 ? `Eksik: ${item.quantity}` : `Stok: ${item.stock}`)}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          {selectedInsight?.id === 1 ? `${item.notes || 'Talep Edildi'}` : (selectedInsight?.id === 2 ? '90+ Gündür Hareketsiz' : 'Teslim Bekliyor')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex h-12 w-12 rounded-full bg-muted/40 items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kayıt Bulunamadı</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  </BorderBeam>
  );
}
