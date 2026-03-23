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
import { Plus, Users, Search, Phone, Star, Building2, UserCircle, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="p-6 bg-[#0a0a0b] text-white min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Users className="h-8 w-8 text-blue-500" />
             Müşteri Portföyü
          </h1>
          <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">TOPLAM {customers.length} KAYITLI MÜŞTERİ</p>
        </div>
        <Link href="/musteriler/yeni">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-12 rounded-xl flex gap-2">
            <Plus className="h-5 w-5" />
            Yeni Müşteri Ekle
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="relative group col-span-2">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
           <Input
             placeholder="Müşteri adı veya telefon numarası ile ara..."
             className="bg-[#141416] border-none h-14 pl-12 rounded-2xl text-lg font-medium placeholder:text-gray-700 focus:ring-blue-600 shadow-sm"
           />
         </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" className="h-14 flex-1 bg-[#141416] border-none rounded-2xl font-bold uppercase text-[10px] tracking-widest text-gray-500 hover:text-white">VIP Müşteriler</Button>
            <Button variant="outline" className="h-14 flex-1 bg-[#141416] border-none rounded-2xl font-bold uppercase text-[10px] tracking-widest text-gray-500 hover:text-white">Kurumsal</Button>
         </div>
      </div>

      <div className="bg-[#141416] rounded-3xl overflow-hidden border border-white/5 shadow-xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-gray-500 font-bold text-[10px] uppercase tracking-widest px-8 py-5">MÜŞTERİ BİLGİSİ</TableHead>
              <TableHead className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">MÜŞTERİ TİPİ</TableHead>
              <TableHead className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">İLETİŞİM</TableHead>
              <TableHead className="text-gray-500 font-bold text-[10px] uppercase tracking-widest text-center">İŞLEMLER</TableHead>
              <TableHead className="text-gray-500 font-bold text-[10px] uppercase tracking-widest text-right px-8">AKSİYON</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer: any) => (
              <TableRow key={customer.id} className="border-b border-white/5 group hover:bg-white/[0.01] transition-colors">
                <TableCell className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 text-lg">
                         {customer.name.charAt(0)}
                      </div>
                      <div>
                         <div className="flex items-center gap-2">
                            <span className="font-black text-lg uppercase tracking-tight">{customer.name}</span>
                            {customer.isVip && (
                               <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[9px] px-1.5 py-0.5 rounded-full">VIP</Badge>
                            )}
                         </div>
                         <div className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2 mt-1">
                            <Star className={`h-3 w-3 ${customer.isVip ? 'fill-amber-500 text-amber-500' : 'text-gray-700'}`} />
                            Sadakat Puanı: {customer.loyaltyPoints}
                         </div>
                      </div>
                   </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-white/10 text-gray-400 font-bold text-[10px] tracking-tight bg-white/[0.02] px-3 py-1">
                    {customer.type === 'KURUMSAL' ? <Building2 className="h-3 w-3 mr-1" /> : <UserCircle className="h-3 w-3 mr-1" />}
                    {customer.type || "BİREYSEL"}
                  </Badge>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
                         <Phone className="h-3 w-3" />
                         {customer.phone}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                         {customer.email || "E-posta yok"}
                      </div>
                   </div>
                </TableCell>
                <TableCell className="text-center">
                   <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500">
                      <div className="flex flex-col items-center">
                         <span className="text-white text-sm">{customer.tickets?.length || 0}</span>
                         <span className="text-[8px] uppercase">Servis</span>
                      </div>
                      <div className="flex flex-col items-center">
                         <span className="text-white text-sm">{customer.sales?.length || 0}</span>
                         <span className="text-[8px] uppercase">Satış</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell className="px-8 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Link href={`/musteriler/${customer.id}`}>
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-all">
                           <Eye className="h-5 w-5" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5">
                               <MoreHorizontal className="h-5 w-5" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white p-2 min-w-[160px]">
                            <Link href={`/musteriler/duzenle/${customer.id}`}>
                              <DropdownMenuItem className="focus:bg-blue-600/10 focus:text-blue-500 rounded-lg cursor-pointer font-bold text-xs p-3">Profili Düzenle</DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="focus:bg-emerald-600/10 focus:text-emerald-500 rounded-lg cursor-pointer font-bold text-xs p-3">WhatsApp'tan Yaz</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-rose-600/10 focus:text-rose-500 rounded-lg cursor-pointer font-bold text-xs p-3">Kalıcı Olarak Sil</DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-gray-600">
                   <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
                   <p className="font-bold text-lg">Henüz kayıtlı müşteri bulunmuyor.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
