import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { AlertTriangle, AlertCircle, Wrench, Package, ShieldAlert, Zap, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function DashboardUyarilarPage() {
  const notifications = await getSystemNotifications();

  return (
    <div className="flex flex-col gap-8 pb-20 bg-[#0a0a0b] text-white min-h-screen p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-rose-500/10">
                <ShieldAlert className="h-7 w-7 text-rose-500" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase">Kritik <span className="text-rose-500">Uyarılar</span></h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1 italic">Sistem Anomalileri & Operasyonel Riskler</p>
            </div>
        </div>
        <div className="bg-rose-500/10 text-rose-500 px-6 py-2.5 rounded-2xl whisper-border border-rose-500/20 flex items-center gap-3 shadow-rose-500/10">
          <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-black uppercase text-xs tracking-widest">TOPLAM {notifications.length} AKTİF RİSK</span>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Critical Stock Card */}
        <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian overflow-hidden group">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/[0.03] bg-white/[0.01] px-8 py-6">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                 <Package className="h-4 w-4 text-rose-500" /> Stok Seviyesi Kritik Ürünler
              </CardTitle>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">İvedi tedarik planlaması gerektiren kalemler</p>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              {notifications.filter((n: any) => n.type === 'CRITICAL_STOCK').length > 0 ? (
                notifications.filter((n: any) => n.type === 'CRITICAL_STOCK').map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-6 whisper-border border-white/5 rounded-[1.5rem] bg-white/[0.02] hover:bg-white/[0.04] transition-all group/item shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                           <Zap className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-black uppercase tracking-tight text-white group-hover/item:text-rose-400 transition-colors">{n.title}</span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 italic">{n.message}</span>
                        </div>
                    </div>
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest px-6 h-10 rounded-xl shadow-rose-500/20 transition-all">HEMEN SİPARİŞ VER</Button>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] text-gray-600">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-sm">Tüm stoklar optimize edildi. Her şey yolunda!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Service Card */}
        <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian overflow-hidden group">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-orange-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/[0.03] bg-white/[0.01] px-8 py-6">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                 <Wrench className="h-4 w-4 text-orange-500" /> Geciken Servis Kayıtları
              </CardTitle>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">3 günü aşan operasyonel gecikmeler</p>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              {notifications.filter((n: any) => n.type === 'OVERDUE_SERVICE').length > 0 ? (
                notifications.filter((n: any) => n.type === 'OVERDUE_SERVICE').map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-6 whisper-border border-white/5 rounded-[1.5rem] bg-white/[0.02] hover:bg-white/[0.04] transition-all group/item shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                           <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-black uppercase tracking-tight text-white group-hover/item:text-orange-400 transition-colors">{n.title}</span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 italic">{n.message}</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-orange-500 bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 font-black uppercase text-[10px] tracking-widest px-6 h-10 rounded-xl transition-all">KUYRUĞA GİT</Button>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] text-gray-600">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-sm">Geciken kayıt bulunmuyor. Teknik masa mükemmel çalışıyor!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Reminders Card */}
        <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian overflow-hidden group opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/[0.03] bg-white/[0.01] px-8 py-6">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                 <AlertCircle className="h-4 w-4 text-blue-500" /> Tahsilat & Ödeme Hatırlatmaları
              </CardTitle>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Vadesi yaklaşan veya geçen finansal kalemler</p>
            </div>
          </CardHeader>
          <CardContent className="p-8">
             <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] text-gray-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-sm">Gelecek dönem ödemeleri burada analiz edilecektir.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
