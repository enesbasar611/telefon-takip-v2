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
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function LiveActivityFeed({ activity }: { activity: any[] }) {
  return (
    <Card className="bg-[#141416] border-white/5 shadow-2xl h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Activity className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Canlı Akış</CardTitle>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Sistem Etkinlikleri</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-black border-cyan-500/20 text-cyan-500 bg-cyan-500/5 px-2 animate-pulse">
          LIVE
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {activity.map((item) => (
            <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center border ${
                  item.type === 'SERVICE'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {item.type === 'SERVICE' ? <Wrench className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-black text-white uppercase truncate">{item.title}</h4>
                    <span className="text-[9px] font-bold text-gray-600 uppercase whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-gray-500 truncate group-hover:text-gray-300 transition-colors">
                    {item.user} • {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {activity.length === 0 && (
             <div className="p-10 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                Henüz etkinlik yok.
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
