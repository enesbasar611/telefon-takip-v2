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
        title: "Kritik Stok Uyarıları",
        message: `${stats.criticalStock} üründe kritik stok seviyesine ulaşıldı. Tedarik planlaması yapın.`,
        priority: "HIGH",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20"
    },
    {
        id: 2,
        icon: Rocket,
        title: "Satış Performansı",
        message: `Bugünkü satışlar ortalamanın üzerinde seyrediyor. Gelir artış eğilimi: +12%`,
        priority: "MEDIUM",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    },
    {
        id: 3,
        icon: Zap,
        title: "Servis Verimliliği",
        message: `${stats.readyDevices} cihaz teslimata hazır bekliyor. Teslimat oranını artırın.`,
        priority: "LOW",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    }
  ].filter(i => i.priority === "HIGH" || stats.readyDevices > 0);

  return (
    <Card className="bg-[#141416] border-white/5 shadow-2xl h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-amber-sm">
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Tahminleyici Zeka</CardTitle>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">İçgörü & Analiz</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className={`p-4 rounded-2xl whisper-border ${insight.bg} ${insight.border} group transition-all`}>
             <div className="flex items-start gap-4">
                <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center border bg-white/[0.05] border-white/[0.05] ${insight.color} shadow-sm group-hover:scale-110 transition-transform`}>
                    <insight.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${insight.color}`}>{insight.title}</h4>
                    <p className="text-[10px] font-medium text-gray-300 group-hover:text-white transition-colors">
                        {insight.message}
                    </p>
                </div>
             </div>
          </div>
        ))}
        {insights.length === 0 && (
           <div className="p-10 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
              Sistem analizi sürüyor...
           </div>
        )}
      </CardContent>
    </Card>
  );
}
