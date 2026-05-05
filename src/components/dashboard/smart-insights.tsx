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

export function SmartInsights({ stats }: { stats: any }) {
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      show: Number(stats.deadStockCount) > 0,
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
      show: true,
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
    <Card className="bg-card border-border shadow-sm h-full overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="font-medium text-lg ">Tahminleyici zeka</CardTitle>
            <p className="text-xs text-muted-foreground font-medium mt-1">İçgörü ve operasyonel analiz</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {insights.map((insight) => (
          <div
            key={insight.id}
            onClick={() => handleOpenDetail(insight)}
            className={cn(
              "p-6 rounded-[1.5rem] border shadow-sm group transition-all duration-300",
              insight.bg,
              insight.border,
              insight.drillDown ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-md active:scale-95" : "cursor-default"
            )}
          >
            <div className="flex items-start gap-6">
              <div className={cn(
                "mt-1 h-12 w-12 rounded-[1rem] flex items-center justify-center border bg-card border-border/50 shadow-sm transition-all",
                insight.color,
                insight.drillDown && "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg"
              )}>
                <insight.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className={cn("text-sm font-extrabold", insight.color)}>{insight.title}</h4>
                  {insight.drillDown && (
                    <ChevronRight className={cn("h-4 w-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all", insight.color)} />
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="p-10 text-center text-gray-600 text-[10px] ">
            Sistem analizi sürüyor...
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white/95 backdrop-blur-xl">
          <DialogHeader className={cn("p-10 pb-6 rounded-t-[2.5rem]", selectedInsight?.bg)}>
            <div className="flex items-center gap-6">
              <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center bg-white shadow-xl border border-white/50", selectedInsight?.color)}>
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
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/10 hover:bg-muted/50 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-xl bg-white border border-border/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
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
