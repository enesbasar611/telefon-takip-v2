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
  UserCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

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

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(params.id);

  if (!customer) {
    notFound();
  }

  const totalRevenue = (customer.sales?.reduce((acc: number, s: any) => acc + Number(s.finalAmount), 0) || 0) +
                       (customer.tickets?.reduce((acc: number, t: any) => acc + Number(t.actualCost), 0) || 0);

  const activeTicketsCount = customer.tickets?.filter((t: any) => !["DELIVERED", "CANCELLED"].includes(t.status)).length || 0;

  const totalDebt = customer.debts?.reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0) || 0;

  return (
    <div className="p-6 space-y-8 bg-[#0a0a0b] text-white min-h-screen">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="flex gap-6 items-center">
          <div className="h-24 w-24 rounded-full bg-blue-600/10 border-4 border-[#141416] flex items-center justify-center relative shadow-xl overflow-hidden">
            {customer.photo ? (
              <img src={customer.photo} alt={customer.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-blue-500" />
            )}
            {customer.isVip && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 p-1.5 rounded-full border-4 border-[#141416]">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tighter uppercase">{customer.name}</h1>
              {customer.isVip && (
                <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[10px] tracking-tighter px-3">VIP MÜŞTERİ</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-bold border-white/10 text-gray-400">
                  {customer.type === 'KURUMSAL' ? <Building2 className="h-3 w-3 mr-1" /> : <UserCircle className="h-3 w-3 mr-1" />}
                  {customer.type}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
           <Link href={`/musteriler/duzenle/${customer.id}`}>
             <Badge className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border-none px-4 py-2 cursor-pointer font-bold">PROFİLİ DÜZENLE</Badge>
           </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#141416] border-none shadow-sm group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">TOPLAM CİRO</p>
              <h3 className="text-2xl font-black tracking-tighter">₺{totalRevenue.toLocaleString('tr-TR')}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AKTİF SERVİS</p>
              <h3 className="text-2xl font-black tracking-tighter">{activeTicketsCount} Adet</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">TOPLAM BORÇ</p>
              <h3 className="text-2xl font-black tracking-tighter">₺{totalDebt.toLocaleString('tr-TR')}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-8 mb-6">
          <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 px-0 py-3 font-bold uppercase text-[10px] tracking-widest">İŞLEM GEÇMİŞİ</TabsTrigger>
          <TabsTrigger value="debts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 px-0 py-3 font-bold uppercase text-[10px] tracking-widest">BORÇ & ALACAK</TabsTrigger>
          <TabsTrigger value="warranty" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 px-0 py-3 font-bold uppercase text-[10px] tracking-widest">GARANTİ TAKİBİ</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 px-0 py-3 font-bold uppercase text-[10px] tracking-widest">ÖZEL NOTLAR</TabsTrigger>
        </TabsList>

        {/* Transaction History */}
        <TabsContent value="history" className="space-y-4">
           {!customer.tickets?.length && !customer.sales?.length ? (
             <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Herhangi bir işlem kaydı bulunamadı.</p>
             </div>
           ) : (
             <div className="grid gap-4">
                {[...(customer.tickets || []), ...(customer.sales || [])]
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((item: any, idx: number) => (
                    <div key={idx} className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.ticketNumber ? 'bg-blue-600/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                             {item.ticketNumber ? <Wrench className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />}
                          </div>
                          <div>
                             <h4 className="font-bold text-sm">
                               {item.ticketNumber ? `${item.deviceBrand} ${item.deviceModel} (Servis)` : `${item.saleNumber} (Satış)`}
                             </h4>
                             <p className="text-[10px] text-gray-500 font-medium">
                               {format(new Date(item.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-10">
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">DURUM</p>
                             <Badge variant="outline" className={`text-[10px] font-black border-none px-3 ${item.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                               {item.status ? statusLabels[item.status] : "TAMAMLANDI"}
                             </Badge>
                          </div>
                          <div className="text-right min-w-[100px]">
                             <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">TUTAR</p>
                             <span className="text-lg font-black">₺{(Number(item.actualCost) || Number(item.finalAmount) || 0).toLocaleString('tr-TR')}</span>
                          </div>
                       </div>
                    </div>
                  ))
                }
             </div>
           )}
        </TabsContent>

        {/* Debts Content */}
        <TabsContent value="debts" className="space-y-4">
           {!customer.debts?.length ? (
             <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
                <ArrowDownCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Aktif veya geçmiş borç kaydı bulunmuyor.</p>
             </div>
           ) : (
             <div className="grid gap-4">
                {customer.debts.map((debt: any) => (
                   <div key={debt.id} className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${debt.isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            <Wallet className="h-6 w-6" />
                         </div>
                         <div>
                            <h4 className="font-bold text-sm">Borç Kaydı</h4>
                            <p className="text-[10px] text-gray-500 font-medium">
                               Oluşturma: {format(new Date(debt.createdAt), "d MMM yyyy", { locale: tr })}
                               {debt.dueDate && ` • Vade: ${format(new Date(debt.dueDate), "d MMM yyyy", { locale: tr })}`}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">DURUM</p>
                            <Badge variant="outline" className={`text-[10px] font-black border-none px-3 ${debt.isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                               {debt.isPaid ? 'ÖDENDİ' : 'BEKLEYEN'}
                            </Badge>
                         </div>
                         <div className="text-right min-w-[120px]">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">KALAN TUTAR</p>
                            <span className={`text-lg font-black ${!debt.isPaid ? 'text-rose-500' : ''}`}>₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </TabsContent>

        {/* Warranty Content */}
        <TabsContent value="warranty" className="space-y-6">
           {!customer.tickets?.filter((t: any) => t.warrantyExpiry).length ? (
             <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
                <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Aktif garanti kaydı bulunmuyor.</p>
             </div>
           ) : (
             <div className="grid gap-6 md:grid-cols-2">
                {customer.tickets.filter((t: any) => t.warrantyExpiry).map((ticket: any) => {
                   const now = new Date();
                   const expiry = new Date(ticket.warrantyExpiry);
                   const start = new Date(ticket.deliveredAt || ticket.createdAt);
                   const totalDays = differenceInDays(expiry, start);
                   const daysLeft = differenceInDays(expiry, now);
                   const percent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
                   const isExpired = daysLeft < 0;

                   return (
                     <Card key={ticket.id} className="bg-[#141416] border-none shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-white/5">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                 <Smartphone className="h-5 w-5" />
                               </div>
                               <div>
                                 <CardTitle className="text-sm font-bold">{ticket.deviceBrand} {ticket.deviceModel}</CardTitle>
                                 <CardDescription className="text-[10px] font-medium uppercase tracking-tight text-gray-500">{ticket.ticketNumber}</CardDescription>
                               </div>
                             </div>
                             <Badge className={`${isExpired ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} border-none font-black text-[9px] uppercase`}>
                               {isExpired ? 'GARANTİ BİTTİ' : 'AKTİF GARANTİ'}
                             </Badge>
                           </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">KALAN SÜRE</span>
                              <span className={`text-[10px] font-black uppercase ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                                 {isExpired ? '0 GÜN' : `${daysLeft} GÜN`}
                              </span>
                           </div>
                           <Progress value={percent} className={`h-2 bg-white/5 ${isExpired ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'}`} />
                           <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                                 <Calendar className="h-3 w-3" />
                                 <span>BİTİŞ: {format(expiry, "d MMM yyyy", { locale: tr })}</span>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                   );
                })}
             </div>
           )}
        </TabsContent>

        {/* Notes Content */}
        <TabsContent value="notes">
           <Card className="bg-[#141416] border-none shadow-sm">
              <CardHeader>
                 <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">MÜŞTERİ NOTLARI</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="pb-8">
                 <div className="bg-[#0a0a0b] p-6 rounded-2xl border border-white/5 min-h-[200px] text-gray-400 text-sm whitespace-pre-wrap italic">
                    {customer.notes || "Bu müşteri için henüz bir not eklenmemiş."}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
