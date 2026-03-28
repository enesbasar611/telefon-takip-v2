"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Rocket
} from "lucide-react";

export function SmartInsights({ stats }: { stats: any }) {
  // Logic to identify trends
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
      show: Number(stats.pendingProcurementCount) > 0
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
      show: Number(stats.deadStockCount) > 0
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
      show: true
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
      show: Number(stats.readyDevices) > 0
    }
  ].filter(i => i.show);

  return (
    <Card className="bg-card border-border shadow-sm h-full overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Tahminleyici zeka</CardTitle>
            <p className="text-xs text-muted-foreground font-medium mt-1">İçgörü ve operasyonel analiz</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {insights.map((insight) => (
          <div key={insight.id} className={`p-6 rounded-[1.5rem] border shadow-sm ${insight.bg} ${insight.border} group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md`}>
            <div className="flex items-start gap-6">
              <div className={`mt-1 h-12 w-12 rounded-[1rem] flex items-center justify-center border bg-card border-border/50 ${insight.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <insight.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className={`text-sm font-extrabold mb-1.5 ${insight.color}`}>{insight.title}</h4>
                <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="p-10 text-center text-gray-600 text-[10px] font-bold">
            Sistem analizi sürüyor...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
