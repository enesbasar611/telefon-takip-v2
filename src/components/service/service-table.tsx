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
import { cn, formatPhone } from "@/lib/utils";
import { WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import Link from "next/link";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServiceReceiptModal } from "./service-receipt-modal";
import { getIndustryLabel, getIndustryConfig } from "@/lib/industry-utils";

interface ServiceTableProps {
  data: any[];
  shop?: any;
}

const statusMap: Record<ServiceStatus, { label: string; color: string; icon: any; glow: string }> = {
  PENDING: { label: "BEKLEMEDE", color: "text-gray-500 bg-gray-500/10 border-gray-500/20", icon: Clock, glow: "" },
  APPROVED: { label: "ONAYLANDI", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: CheckCircle2, glow: "" },
  REPAIRING: { label: "TAMİRDE", color: "text-orange-500 bg-orange-500/10 border-orange-500/20", icon: WrenchIcon, glow: "" },
  WAITING_PART: { label: "PARÇA BEKLİYOR", color: "text-purple-500 bg-purple-500/10 border-purple-500/20", icon: PackageIcon, glow: "" },
  READY: { label: "HAZIR", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, glow: "shadow-emerald-500/20" },
  DELIVERED: { label: "TESLİM EDİLDİ", color: "text-blue-500 bg-blue-500/10 border-blue-500/20 ", icon: CheckCircle, glow: "shadow-blue-500/30 animate-pulse" },
  CANCELLED: { label: "İPTAL EDİLDİ", color: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: XCircle, glow: "" },
};

export function ServiceTable({ data, shop }: ServiceTableProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { toast } = useToast();
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappTicket, setWhatsappTicket] = useState<any>(null);

  const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(data, "createdAt", "desc");

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


  return (
    <div className="overflow-hidden shadow-none">
      <Table>
        <TableHeader className="font-medium bg-white/[0.01] hidden md:table-header-group">
          <TableRow className="border-b border-white/[0.03] hover:bg-transparent transition-none">
            <TableHead className="font-medium px-8 py-6 h-[70px]">
              <SortableHeader label="Fiş No" field="ticketNumber" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="font-medium py-6 h-[70px]">
              <SortableHeader label="Müşteri" field="customer.name" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="font-medium py-6 h-[70px]">
              <SortableHeader label={`${getIndustryLabel(shop, "customerAsset")} Analizi`} field="deviceBrand" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="font-medium py-6 h-[70px]">
              <SortableHeader label="İşlem Durumu" field="status" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="font-medium py-6 h-[70px]">
              <SortableHeader label="Kayıt Tarihi" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="font-medium py-6 h-[70px]">
              <SortableHeader label="Maliyet" field="estimatedCost" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
            </TableHead>
            <TableHead className="font-medium px-8 py-6 text-xs text-muted-foreground text-right">Aksiyon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="flex flex-col md:table-row-group divide-y divide-white/[0.03]">
          {sortedData.length === 0 ? (
            <TableRow className="flex flex-col md:table-row">
              <TableCell colSpan={7} className="h-40 text-center text-sm font-medium text-muted-foreground bg-card/50">
                Kayıtlı veri bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((ticket) => (
              <TableRow key={ticket.id} className="flex flex-col md:table-row border-b md:border-b-0 border-white/[0.03] group hover:bg-white/[0.01] transition-colors p-4 md:p-0">
                <TableCell className="md:px-8 md:py-6 p-0 md:h-[70px] flex md:table-cell justify-between items-center mb-2 md:mb-0">
                  <span className="text-[10px] md:hidden text-muted-foreground uppercase tracking-widest">FİŞ NO</span>
                  <span className="text-sm text-foreground font-mono">#{ticket.ticketNumber}</span>
                </TableCell>
                <TableCell className="p-0 md:py-6 md:h-[70px] flex md:table-cell justify-between items-center mb-3 md:mb-0">
                  <span className="text-[10px] md:hidden text-muted-foreground uppercase tracking-widest">MÜŞTERİ</span>
                  <div className="flex flex-col md:items-start items-end gap-0.5">
                    <span className="text-sm text-white group-hover:text-blue-500 transition-colors font-medium">{ticket.customer.name}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{formatPhone(ticket.customer.phone)}</span>
                  </div>
                </TableCell>
                <TableCell className="p-0 md:py-6 md:h-[70px] flex md:table-cell justify-between items-center mb-3 md:mb-0">
                  <span className="text-[10px] md:hidden text-muted-foreground uppercase tracking-widest">CİHAZ & PROBLEM</span>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex h-10 w-10 rounded-xl bg-muted/30 border border-border/50 items-center justify-center group-hover:bg-muted/50 transition-all">
                      {(() => {
                        const Icon = getIndustryConfig(shop?.industry).icon;
                        return <Icon className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />;
                      })()}
                    </div>
                    <div className="flex flex-col md:items-start items-end">
                      <span className="text-sm text-foreground">{ticket.deviceBrand} {ticket.deviceModel}</span>
                      <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">"{ticket.problemDesc}"</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-0 md:py-6 md:h-[70px] flex md:table-cell justify-between items-center mb-3 md:mb-0">
                  <span className="text-[10px] md:hidden text-muted-foreground uppercase tracking-widest">DURUM</span>
                  <Badge className={`${statusMap[ticket.status as ServiceStatus].color} ${statusMap[ticket.status as ServiceStatus].glow} border-none text-[10px] px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl transition-all font-bold`} variant="outline">
                    {statusMap[ticket.status as ServiceStatus].label}
                  </Badge>
                </TableCell>
                <TableCell className="p-0 md:py-6 md:h-[70px] flex md:table-cell justify-between items-center mb-3 md:mb-0">
                  <span className="text-[10px] md:hidden text-muted-foreground uppercase tracking-widest">KAYIT TARİHİ</span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {format(new Date(ticket.createdAt), "dd MMM, HH:mm", { locale: tr })}
                  </span>
                </TableCell>
                <TableCell className="p-0 md:py-6 md:h-[70px] flex md:table-cell justify-between items-center mb-4 md:mb-0 md:text-right">
                  <span className="text-[10px] md:hidden text-muted-foreground uppercase tracking-widest">MALİYET</span>
                  <span className="text-lg md:text-lg text-emerald-500 font-black">
                    ₺{Number(ticket.estimatedCost).toLocaleString("tr-TR")}
                  </span>
                </TableCell>
                <TableCell className="md:px-8 p-0 md:h-[70px]">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/servis/${ticket.id}`} className="flex-1 md:flex-none">
                      <Button
                        variant="ghost"
                        className="w-full md:h-9 md:w-9 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-all h-11"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="h-4 w-4 md:mr-0 mr-2" />
                        <span className="md:hidden text-xs uppercase tracking-widest font-bold">DETAY</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 md:h-9 md:w-9 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 transition-all"
                      onClick={() => {
                        setWhatsappTicket(ticket);
                        setWhatsappModalOpen(true);
                      }}
                      title="WhatsApp Gönder"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-11 w-11 md:h-9 md:w-9 p-0 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0B0F19] border-border/50 text-foreground p-2 min-w-[220px] shadow-2xl rounded-2xl">
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase p-3 tracking-widest">Operasyonel Aksiyonlar</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50 mx-2" />
                        {Object.entries(statusMap).map(([status, info]) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusUpdate(ticket.id, status as ServiceStatus)}
                            disabled={ticket.status === status}
                            className="p-3 text-[11px] font-bold rounded-xl cursor-pointer focus:bg-muted/50 flex gap-3 items-center group mb-1"
                          >
                            <div className={cn("w-2.5 h-2.5 rounded-full", info.color.split(' ')[0])} />
                            {info.label} YAP
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-border/50 mx-2" />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowReceipt(true);
                          }}
                          className="p-3 text-[11px] font-bold rounded-xl cursor-pointer focus:bg-muted/50 flex gap-3 items-center group mb-1"
                        >
                          <Printer className="h-4 w-4 text-blue-500" /> FORMU YAZDIR
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-3 text-[11px] font-bold rounded-xl cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 flex gap-3 items-center" onClick={() => handleDelete(ticket.id)}>
                          <Trash className="h-4 w-4" /> KAYDI ARŞİVLE
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
      {whatsappTicket && (
        <WhatsAppConfirmModal
          isOpen={whatsappModalOpen}
          onClose={() => {
            setWhatsappModalOpen(false);
            setWhatsappTicket(null);
          }}
          phone={whatsappTicket.customer?.phone || ""}
          customerName={whatsappTicket.customer?.name}
          initialMessage={replacePlaceholders(
            (() => {
              switch (whatsappTicket.status) {
                case "READY": return WHATSAPP_TEMPLATES.READY;
                case "APPROVED": return WHATSAPP_TEMPLATES.APPROVED;
                case "REPAIRING": return WHATSAPP_TEMPLATES.REPAIRING;
                case "WAITING_PART": return WHATSAPP_TEMPLATES.WAITING_PART;
                case "DELIVERED": return WHATSAPP_TEMPLATES.DELIVERED;
                default: return WHATSAPP_TEMPLATES.NEW_SERVICE;
              }
            })(),
            {
              customer: whatsappTicket.customer?.name || "",
              device: `${whatsappTicket.deviceBrand} ${whatsappTicket.deviceModel}`,
              ticket: whatsappTicket.ticketNumber || ""
            }
          )}
        />
      )}
      {selectedTicket && (
        <ServiceReceiptModal
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
}


