import { getCustomerById } from "@/lib/actions/customer-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Wrench,
  ShoppingCart,
  ArrowDownCircle,
  History,
  Clock,
  CheckCircle2,
  FileText,
  Smartphone,
  Calendar,
  Wallet,
  Building2,
  UserCircle,
  Gem,
  Crown,
  ShieldCheck,
  ChevronLeft,
  ArrowUpRight,
  TrendingUp,
  Zap
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  PENDING: "BEKLEMEDE",
  APPROVED: "ONAYLANDI",
  REPAIRING: "TAMİRDE",
  WAITING_PART: "PARÇA BEKLİYOR",
  READY: "HAZIR",
  DELIVERED: "TESLİM EDİLDİ",
  CANCELLED: "İPTAL EDİLDİ",
};

const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { label: "PLATİN", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-cyan-sm", icon: Gem, next: 0, percent: 100 };
    if (points >= 500) return { label: "ALTIN", color: "text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-amber-400/10", icon: Crown, next: 1000, percent: (points/1000)*100 };
    if (points >= 200) return { label: "GÜMÜŞ", color: "text-gray-300 bg-gray-300/10 border-gray-300/20", icon: ShieldCheck, next: 500, percent: (points/500)*100 };
    return { label: "BRONZ", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Star, next: 200, percent: (points/200)*100 };
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(params.id);

  if (!customer) {
    notFound();
  }

  const totalRevenue = (customer.sales?.reduce((acc: number, s: any) => acc + Number(s.finalAmount), 0) || 0) +
                       (customer.tickets?.reduce((acc: number, t: any) => acc + Number(t.actualCost), 0) || 0);

  const activeTicketsCount = customer.tickets?.filter((t: any) => !["DELIVERED", "CANCELLED"].includes(t.status)).length || 0;

  const totalDebt = customer.debts?.reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0) || 0;
  const tier = getLoyaltyTier(customer.loyaltyPoints);

  return (
    <div className="p-8 space-y-8 bg-[#0a0a0b] text-white min-h-screen">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-10">
        <div className="flex gap-8 items-center">
          <Link href="/musteriler">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 text-gray-500 hover:text-white transition-all">
                <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-28 w-28 rounded-[2rem] bg-cyan-500/10 border-4 border-[#141416] flex items-center justify-center relative shadow-2xl overflow-hidden group hover:scale-105 transition-all">
            {customer.photo ? (
              <img src={customer.photo} alt={customer.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <UserCircle className="h-12 w-12 text-cyan-500" />
            )}
            {customer.isVip && (
              <div className="absolute top-0 right-0 h-6 w-6 bg-cyan-500 flex items-center justify-center rounded-bl-xl border-4 border-[#141416] shadow-cyan-sm">
                <Zap className="h-3 w-3 text-black fill-black" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase text-white">{customer.name}</h1>
              {customer.isVip && (
                <Badge className="bg-cyan-500/10 text-cyan-500 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-xl shadow-cyan-sm animate-pulse">VIP ÜYE</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <div className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-cyan-500" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-cyan-500" />
                  <span className="truncate max-w-[200px]">{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] font-black border-white/10 text-gray-400 bg-white/[0.02] px-3 py-1 rounded-lg">
                  {customer.type === 'KURUMSAL' ? <Building2 className="h-3 w-3 mr-2 text-cyan-500" /> : <UserCircle className="h-3 w-3 mr-2 text-cyan-500" />}
                  {customer.type || "BİREYSEL"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
           <Link href={`/musteriler/duzenle/${customer.id}`}>
             <Button className="bg-white/[0.03] whisper-border border-white/5 text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/5 px-6 h-12 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl">PROFİLİ DÜZENLE</Button>
           </Link>
           <Button className="bg-cyan-500 text-black px-6 h-12 rounded-2xl font-black uppercase tracking-widest shadow-cyan-strong hover:bg-cyan-400 transition-all">SATIŞ YAP</Button>
        </div>
      </div>

      {/* Main Grid: CRM Analiz & Sadakat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Loyalty Panel */}
        <Card className="lg:col-span-1 bg-[#141416] border-white/5 shadow-2xl group overflow-hidden relative">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-cyan-500" />
            <CardHeader className="border-b border-white/[0.03] pb-6 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-cyan-500 shadow-cyan-sm" />
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Sadakat Seviyesi</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center text-center">
                    <div className={`h-24 w-24 rounded-3xl ${tier.color} flex items-center justify-center border-none shadow-2xl mb-4 group-hover:scale-110 transition-transform`}>
                        <tier.icon className="h-12 w-12" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-widest uppercase">{tier.label}</h3>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mt-1 italic">Aktif Üyelik Seviyesi</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gelişim Puanı</span>
                        <span className="text-xs font-black text-cyan-500">{customer.loyaltyPoints} / {tier.next || customer.loyaltyPoints}</span>
                    </div>
                    <Progress value={tier.percent} className="h-2 bg-white/[0.03] [&>div]:bg-cyan-500 shadow-cyan-sm" />
                    {tier.next > 0 && (
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic text-center">
                           Bir sonraki seviye için {tier.next - customer.loyaltyPoints} puan daha gerekiyor.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Financial & Summary Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#141416] border-white/5 shadow-2xl group obsidian hover:-translate-y-1 transition-all overflow-hidden relative h-fit">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-emerald-500" />
                <CardContent className="p-8 flex flex-col gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">TOPLAM İŞLEM HACMİ</p>
                        <h3 className="text-3xl font-black tracking-tighter text-white">₺{totalRevenue.toLocaleString('tr-TR')}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#141416] border-white/5 shadow-2xl group obsidian hover:-translate-y-1 transition-all overflow-hidden relative h-fit">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-blue-500" />
                <CardContent className="p-8 flex flex-col gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-blue-500/10 group-hover:scale-110 transition-transform">
                        <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">AKTİF SERVİS ADEDİ</p>
                        <h3 className="text-3xl font-black tracking-tighter text-white">{activeTicketsCount} Cihaz</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#141416] border-white/5 shadow-2xl group obsidian hover:-translate-y-1 transition-all overflow-hidden relative h-fit">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-rose-500" />
                <CardContent className="p-8 flex flex-col gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-rose-500/10 group-hover:scale-110 transition-transform">
                        <ArrowDownCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">GÜNCEL BORÇ BAKİYESİ</p>
                        <h3 className="text-3xl font-black tracking-tighter text-rose-500">₺{totalDebt.toLocaleString('tr-TR')}</h3>
                    </div>
                </CardContent>
            </Card>

            {/* History Tabs */}
            <div className="col-span-1 md:col-span-3">
                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-10 mb-8">
                        <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-0 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">İŞLEM ARŞİVİ</TabsTrigger>
                        <TabsTrigger value="warranty" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-0 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">AKTİF GARANTİLER</TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-0 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">MÜŞTERİ NOTLARI</TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="space-y-4 outline-none">
                        {[...(customer.tickets || []), ...(customer.sales || [])]
                            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((item: any, idx: number) => (
                                <div key={idx} className="bg-[#141416] p-6 rounded-3xl whisper-border border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-all group shadow-2xl">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center relative shadow-xl ${item.ticketNumber ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                            {item.ticketNumber ? <Wrench className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />}
                                            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white/10 animate-pulse border-2 border-[#141416]" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                                            {item.ticketNumber ? `${item.deviceBrand} ${item.deviceModel} (TEKNİK SERVİS)` : `${item.saleNumber} (ÜRÜN SATIŞI)`}
                                            </h4>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 italic">
                                            {format(new Date(item.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })} • <span className="text-cyan-500">#{item.ticketNumber || item.saleNumber}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1.5">DURUM SINIFI</p>
                                            <Badge variant="outline" className={`text-[9px] font-black border-none px-4 py-1.5 rounded-xl shadow-lg ${item.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5' : 'bg-cyan-500/10 text-cyan-500 shadow-cyan-500/5'}`}>
                                            {item.status ? statusLabels[item.status] : "TAMAMLANDI"}
                                            </Badge>
                                        </div>
                                        <div className="text-right min-w-[120px]">
                                            <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1.5">NET TUTAR</p>
                                            <span className="text-xl font-black text-white shadow-cyan-sm">₺{(Number(item.actualCost) || Number(item.finalAmount) || 0).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </TabsContent>

                    <TabsContent value="warranty" className="space-y-6 outline-none">
                        <div className="grid gap-6 md:grid-cols-2">
                            {customer.tickets?.filter((t: any) => t.warrantyExpiry).map((ticket: any) => {
                                const now = new Date();
                                const expiry = new Date(ticket.warrantyExpiry);
                                const start = new Date(ticket.deliveredAt || ticket.createdAt);
                                const totalDays = differenceInDays(expiry, start);
                                const daysLeft = differenceInDays(expiry, now);
                                const percent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
                                const isExpired = daysLeft < 0;

                                return (
                                    <Card key={ticket.id} className="bg-[#141416] border-white/5 shadow-2xl overflow-hidden group">
                                        <CardHeader className="pb-4 border-b border-white/[0.03] bg-white/[0.01]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-cyan-sm">
                                                        <ShieldCheck className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xs font-black text-white uppercase tracking-widest">{ticket.deviceBrand} {ticket.deviceModel}</CardTitle>
                                                        <CardDescription className="text-[9px] font-bold uppercase tracking-tighter text-gray-600">SERVİS NO: {ticket.ticketNumber}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge className={`${isExpired ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5'} border-none font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-xl`}>
                                                    {isExpired ? 'GARANTİ SONLANDI' : 'AKTİF KORUMA'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">KORUMA PERİYODU</span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {isExpired ? '0 GÜN' : `${daysLeft} GÜN KALDI`}
                                                </span>
                                            </div>
                                            <Progress value={percent} className={`h-2 bg-white/[0.03] shadow-inner ${isExpired ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'}`} />
                                            <div className="flex items-center justify-between mt-5">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                    <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                                                    <span>BİTİŞ: {format(expiry, "d MMM yyyy", { locale: tr })}</span>
                                                </div>
                                                <Button variant="ghost" className="text-[8px] font-black uppercase text-cyan-500 hover:bg-cyan-500/5 px-0 h-auto">
                                                    DETAYI GÖR <ArrowUpRight className="h-2 w-2 ml-1" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="outline-none">
                        <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian">
                            <CardHeader className="border-b border-white/[0.03] bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-cyan-500" />
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Stratejik Müşteri Notları</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="bg-[#0a0a0b] p-8 rounded-[2rem] border border-white/5 min-h-[250px] text-gray-400 text-xs font-medium leading-relaxed whisper-border italic group hover:border-cyan-500/20 transition-all">
                                    {customer.notes || "Bu profil için henüz stratejik bir not girişi yapılmamıştır."}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>
  );
}
