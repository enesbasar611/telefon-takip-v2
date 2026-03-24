"use client";

import { useTransition, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ServiceStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Trash,
  CheckCircle2,
  Clock,
  Wrench as WrenchIcon,
  Package as PackageIcon,
  CheckCircle,
  XCircle,
  Printer,
  MessageCircle,
  Eye,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { updateServiceStatus, deleteServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatWhatsAppLink, WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import Link from "next/link";

interface ServiceTableProps {
  data: any[];
}

const statusMap: Record<ServiceStatus, { label: string; color: string; icon: any; glow: string }> = {
  PENDING: { label: "BEKLEMEDE", color: "text-gray-500 bg-gray-500/10 border-gray-500/20", icon: Clock, glow: "" },
  APPROVED: { label: "ONAYLANDI", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: CheckCircle2, glow: "" },
  REPAIRING: { label: "TAMİRDE", color: "text-orange-500 bg-orange-500/10 border-orange-500/20", icon: WrenchIcon, glow: "" },
  WAITING_PART: { label: "PARÇA BEKLİYOR", color: "text-purple-500 bg-purple-500/10 border-purple-500/20", icon: PackageIcon, glow: "" },
  READY: { label: "HAZIR", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, glow: "shadow-emerald-500/20" },
  DELIVERED: { label: "TESLİM EDİLDİ", color: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-sm", icon: CheckCircle, glow: "shadow-amber-500/30 animate-pulse" },
  CANCELLED: { label: "İPTAL EDİLDİ", color: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: XCircle, glow: "" },
};

export function ServiceTable({ data }: ServiceTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleStatusUpdate = (id: string, status: ServiceStatus) => {
    startTransition(async () => {
      try {
        await updateServiceStatus(id, status);
        toast({ title: "Başarılı", description: "Durum güncellendi." });
      } catch (error) {
        toast({ title: "Hata", description: "Durum güncellenirken bir hata oluştu.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      try {
        await deleteServiceTicket(id);
        toast({ title: "Başarılı", description: "Kayıt silindi." });
      } catch (error) {
        toast({ title: "Hata", description: "Kayıt silinirken bir hata oluştu.", variant: "destructive" });
      }
    });
  };

  const sendWhatsApp = (ticket: any, type: keyof typeof WHATSAPP_TEMPLATES) => {
    const template = WHATSAPP_TEMPLATES[type];
    const message = replacePlaceholders(template, {
      customer: ticket.customer.name,
      device: `${ticket.deviceBrand} ${ticket.deviceModel}`,
      ticket: ticket.ticketNumber,
    });

    const link = formatWhatsAppLink(ticket.customer.phone, message);
    window.open(link, "_blank");
  };

  return (
    <div className="rounded-[2rem] obsidian overflow-hidden whisper-border border-white/5 shadow-2xl">
      <Table>
        <TableHeader className="bg-white/[0.01]">
          <TableRow className="border-b border-white/[0.03] hover:bg-transparent transition-none">
            <TableHead className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Fiş No</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Müşteri</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Cihaz Analizi</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">İşlem Durumu</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Kayıt Tarihi</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Maliyet</TableHead>
            <TableHead className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Aksiyon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-40 text-center text-[10px] font-black text-gray-600 uppercase tracking-widest bg-[#141416]/50">
                Kayıtlı veri bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            data.map((ticket) => (
              <TableRow key={ticket.id} className="border-b border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
                <TableCell className="px-8 py-6">
                    <span className="font-black text-xs text-white uppercase tracking-tighter shadow-amber-sm">#{ticket.ticketNumber}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-xs text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">{ticket.customer.name}</span>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">{ticket.customer.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/[0.02] whisper-border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all">
                        <Smartphone className="h-5 w-5 text-gray-600 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xs text-white uppercase tracking-tight">{ticket.deviceBrand} {ticket.deviceModel}</span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest truncate max-w-[120px]">"{ticket.problemDesc}"</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusMap[ticket.status as ServiceStatus].color} ${statusMap[ticket.status as ServiceStatus].glow} border-none font-black text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-xl transition-all`} variant="outline">
                    {statusMap[ticket.status as ServiceStatus].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {format(new Date(ticket.createdAt), "dd MMM, HH:mm", { locale: tr })}
                </TableCell>
                <TableCell className="text-right font-black text-sm text-white tracking-tighter">
                  ₺{Number(ticket.estimatedCost).toLocaleString("tr-TR")}
                </TableCell>
                <TableCell className="px-8">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/servis/${ticket.id}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl bg-white/[0.02] whisper-border border-white/5 text-gray-600 hover:text-amber-500 hover:bg-amber-500/5 transition-all"
                            title="Detayları Görüntüle"
                        >
                        <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-white/[0.02] whisper-border border-white/5 text-gray-600 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all"
                      onClick={() => sendWhatsApp(ticket, ticket.status === "READY" ? "READY" : "NEW_SERVICE")}
                      title="WhatsApp Gönder"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl bg-white/[0.02] whisper-border border-white/5 text-gray-600 hover:text-white hover:bg-white/5 transition-all" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white p-2 min-w-[200px] shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 p-3">Operasyonel Aksiyonlar</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        {Object.entries(statusMap).map(([status, info]) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusUpdate(ticket.id, status as ServiceStatus)}
                            disabled={ticket.status === status}
                            className="p-3 text-[10px] font-black rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center group uppercase tracking-widest"
                          >
                            <div className={cn("w-2 h-2 rounded-full", info.color.split(' ')[0])} />
                            {info.label} Yap
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem asChild className="p-3 text-[10px] font-black rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center uppercase tracking-widest">
                            <Link href={`/servis/yazdir?id=${ticket.id}`} target="_blank" className="w-full flex items-center gap-3">
                                <Printer className="h-4 w-4 text-amber-500" /> Formu Yazdır
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-3 text-[10px] font-black rounded-lg cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 flex gap-3 items-center uppercase tracking-widest" onClick={() => handleDelete(ticket.id)}>
                          <Trash className="h-4 w-4" /> Kaydı Arşivle
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
