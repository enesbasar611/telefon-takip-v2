import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Landmark, ArrowUpRight, ArrowDownRight, Search, Filter, History, Calendar } from "lucide-react";
import { getTransactions, getFinancialSummary } from "@/lib/actions/finance-actions";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const transactions = await getTransactions();
  const summary = await getFinancialSummary();

  const stats = [
    { label: "TOPLAM GELİR", value: summary.totalIncome, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "TOPLAM GİDER", value: summary.totalExpense, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { label: "KASA (NAKİT)", value: summary.cashBalance, icon: Wallet, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { label: "BANKA / POS", value: summary.bankBalance, icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/80">Finans Merkezi</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Kasa & Muhasebe</h1>
          <p className="text-sm text-gray-500 font-medium max-w-md mt-1">İşletmenizin finansal sağlığını ve nakit akışını gerçek zamanlı izleyin.</p>
        </div>
        <CreateTransactionModal />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white/[0.02] border-white/5 whisper-border shadow-2xl group overflow-hidden relative">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-cyan-500 group-hover:opacity-10 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/5 bg-white/[0.02] text-gray-600">AKTİF</Badge>
              </div>
              <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{stat.label}</p>
              <div className="mt-1">
                 <RevealFinancial amount={stat.value} className="text-3xl font-black text-white" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/[0.02] border-white/5 whisper-border shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-cyan-sm">
                <History className="h-4 w-4 text-cyan-500" />
             </div>
             <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Finansal Hareketler</CardTitle>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Gerçek zamanlı nakit akışı kaydı</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
               <Input
                 placeholder="İşlem veya personel ara..."
                 className="pl-10 h-9 bg-black/40 border-white/5 rounded-xl text-xs font-bold"
               />
            </div>
            <Button variant="ghost" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5">
                <Filter className="h-3.5 w-3.5 mr-2" /> FİLTRELE
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4 pl-8">TARİH & SAAT</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">AÇIKLAMA</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">ÖDEME KANALI</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">SORUMLU</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">TUTAR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-gray-600 uppercase tracking-widest italic">Henüz finansal hareket bulunmuyor.</TableCell>
                </TableRow>
              ) : (
                transactions.map((t: any) => (
                  <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-2">
                         <Calendar className="h-3.5 w-3.5 text-gray-600" />
                         <span className="text-[11px] font-black text-white uppercase">{format(new Date(t.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter bg-white/[0.03] px-1.5 rounded-lg">{format(new Date(t.createdAt), "HH:mm")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-tight group-hover:text-white transition-colors">{t.description}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/[0.03] border-white/5 text-[9px] font-black text-gray-400 py-0.5 px-3 rounded-xl uppercase tracking-widest group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                        {t.paymentMethod === 'CASH' ? 'NAKİT' : t.paymentMethod === 'CARD' ? 'KART' : 'HAVALE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-500">
                           {t.user?.name?.charAt(0) || 'S'}
                        </div>
                        <span className="text-[10px] font-black text-white uppercase">{t.user?.name || 'SİSTEM'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex flex-col items-end">
                          <div className={cn("flex items-center gap-1.5 text-sm font-black italic tracking-tighter", t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500')}>
                             {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                             {t.type === 'INCOME' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          </div>
                          <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mt-0.5">{t.type === 'INCOME' ? 'TAHSİLAT' : 'ÖDEME'}</span>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
           <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">TOPLAM {transactions.length} İŞLEM LİSTELENİYOR</p>
           <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-cyan-500 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-6 hover:bg-cyan-500/10 shadow-cyan-sm">TÜM ARŞİVİ GÖR</Button>
        </div>
      </Card>
    </div>
  );
}
