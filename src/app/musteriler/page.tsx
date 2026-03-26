import { getCustomers } from "@/lib/actions/customer-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search, Phone, Star, Building2, UserCircle, Eye, MoreHorizontal, Zap, Crown, ShieldCheck, Gem } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export const dynamic = 'force-dynamic';

const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { label: "PLATİN", color: "text-blue-400 bg-blue-400/10 border-blue-400/20 ", icon: Gem };
    if (points >= 500) return { label: "ALTIN", color: "text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-blue-400/10", icon: Crown };
    if (points >= 200) return { label: "GÜMÜŞ", color: "text-gray-300 bg-gray-300/10 border-gray-300/20", icon: ShieldCheck };
    return { label: "BRONZ", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Star };
};

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="p-8 bg-[#0a0a0b] text-white min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20  transition-transform hover:scale-110">
                <Users className="h-7 w-7 text-blue-500" />
            </div>
            <div>
                <h1 className="text-3xl font-black  ">Müşteri <span className="text-blue-500">Portföyü</span></h1>
                <p className="text-[10px] text-gray-500 font-bold   mt-1 italic">STRATEJİK CRM & SADAKAT YÖNETİMİ • {customers.length} KAYIT</p>
            </div>
        </div>
        <Link href="/musteriler/yeni">
          <Button className="bg-blue-500 hover:bg-blue-400 text-black font-black   px-8 h-12 rounded-2xl  transition-all hover:-translate-y-1 flex gap-3">
            <Plus className="h-5 w-5 stroke-[3px]" />
            YENİ MÜŞTERİ TANIMLA
          </Button>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
           <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
           </div>
           <Input
             placeholder="Müşteri adı veya telefon numarası ile ara..."
             className="bg-white/[0.02] border-white/5 h-16 pl-12 rounded-[1.5rem] text-sm font-black   placeholder:text-gray-700 focus:ring-1 focus:ring-blue-500/20 focus:bg-white/[0.04] shadow-none transition-all"
           />
         </div>
         <div className="flex items-center gap-3">
            <Button variant="ghost" className="h-16 flex-1 bg-white/[0.02] whisper-border border-white/5 rounded-[1.5rem] font-black  text-[10px]  text-gray-500 hover:text-white hover:bg-white/5 transition-all">VIP ÜYELER</Button>
            <Button variant="ghost" className="h-16 flex-1 bg-white/[0.02] whisper-border border-white/5 rounded-[1.5rem] font-black  text-[10px]  text-gray-500 hover:text-white hover:bg-white/5 transition-all">KURUMSAL</Button>
         </div>
      </div>

      {/* Main Table */}
      <div className="rounded-[2rem] obsidian whisper-border border-white/5 shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.01]">
            <TableRow className="border-b border-white/[0.03] hover:bg-transparent transition-none">
              <TableHead className="px-8 py-6 text-[10px] font-black text-gray-500  ">Profil Bilgisi</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-gray-500  ">Sadakat Seviyesi</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-gray-500  ">İletişim & CRM</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-gray-500   text-center">İşlem Hacmi</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-gray-500   text-right">Aksiyon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer: any) => {
              const tier = getLoyaltyTier(customer.loyaltyPoints);
              return (
                <TableRow key={customer.id} className="border-b border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white/[0.02] whisper-border border-white/5 flex items-center justify-center relative shadow-none group-hover:bg-white/5 transition-all overflow-hidden">
                           {customer.photo ? (
                               <img src={customer.photo} alt={customer.name} className="h-full w-full object-cover" />
                           ) : (
                               <UserCircle className="h-8 w-8 text-gray-700 group-hover:text-blue-500 transition-colors" />
                           )}
                           {customer.isVip && (
                              <div className="absolute top-0 right-0 h-4 w-4 bg-blue-500 flex items-center justify-center rounded-bl-lg ">
                                 <Zap className="h-2 w-2 text-black fill-black" />
                              </div>
                           )}
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <span className="font-black text-sm text-white   group-hover:text-blue-400 transition-colors">{customer.name}</span>
                              {customer.isVip && (
                                 <Badge className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] px-2 py-1 rounded-lg animate-pulse ">VIP</Badge>
                              )}
                           </div>
                           <div className="text-[9px] text-gray-600 font-bold  flex items-center gap-2 mt-1 ">
                              {customer.type === 'KURUMSAL' ? <Building2 className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />}
                              {customer.type || "BİREYSEL"}
                           </div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${tier.color} border-none font-black text-[9px]  px-4 py-2 rounded-xl flex items-center gap-2 w-fit transition-all group-hover:scale-105`}>
                        <tier.icon className="h-3 w-3" />
                        {tier.label} ({customer.loyaltyPoints} Puan)
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-black text-blue-500   ">
                           <Phone className="h-3 w-3" />
                           {customer.phone}
                        </div>
                        <div className="text-[9px] text-gray-600 font-bold   italic truncate max-w-[150px]">
                           {customer.email || "E-POSTA ADRESİ BELİRTİLMEDİ"}
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="flex items-center justify-center gap-6">
                        <div className="flex flex-col items-center">
                           <span className="text-white text-base font-black ">{customer.tickets?.length || 0}</span>
                           <span className="text-[8px] font-black text-gray-600   mt-1">Servis</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-white/5 pl-6">
                           <span className="text-white text-base font-black shadow-emerald-500/10">{customer.sales?.length || 0}</span>
                           <span className="text-[8px] font-black text-gray-600   mt-1">Satış</span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <Link href={`/musteriler/${customer.id}`}>
                          <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/[0.02] whisper-border border-white/5 text-gray-600 hover:text-blue-500 hover:bg-blue-500/5 transition-all">
                             <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/[0.02] whisper-border border-white/5 text-gray-600 hover:text-white hover:bg-white/5 transition-all">
                                 <MoreHorizontal className="h-5 w-5" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white p-2 min-w-[200px] shadow-none">
                              <DropdownMenuLabel className="text-[10px]   font-black text-gray-500 p-3 text-center">Profil Yönetimi</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <Link href={`/musteriler/duzenle/${customer.id}`}>
                                <DropdownMenuItem className="p-3 text-[10px] font-black rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center  ">
                                   <UserCircle className="h-4 w-4 text-blue-500" /> Profili Düzenle
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="p-3 text-[10px] font-black rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center   group">
                                 <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <ShieldCheck className="h-2 w-2 text-emerald-500" />
                                 </div> WhatsApp'tan Yaz
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem className="p-3 text-[10px] font-black rounded-lg cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 flex gap-3 items-center  ">
                                 Kalıcı Olarak Sil
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center text-gray-600 bg-[#141416]/50">
                   <div className="flex flex-col items-center gap-4">
                        <Users className="h-16 w-16 opacity-5 animate-pulse" />
                        <p className="font-black text-lg  ">Henüz kayıtlı müşteri bulunmuyor.</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
