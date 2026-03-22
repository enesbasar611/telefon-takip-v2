"use client";

import { useTransition } from "react";
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
  MessageCircle
} from "lucide-react";
import { updateServiceStatus, deleteServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatWhatsAppLink, WHATSAPP_TEMPLATES, replacePlaceholders } from "@/lib/utils/notifications";
import Link from "next/link";

interface ServiceTableProps {
  data: any[];
}

const statusMap: Record<ServiceStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Beklemede", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100", icon: Clock },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100", icon: CheckCircle2 },
  REPAIRING: { label: "Tamirde", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100", icon: WrenchIcon },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100", icon: PackageIcon },
  READY: { label: "Hazır", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100", icon: CheckCircle },
  DELIVERED: { label: "Teslim Edildi", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100", icon: CheckCircle },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100", icon: XCircle },
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
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fiş No</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead>Cihaz</TableHead>
            <TableHead>Problem</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">Tahmini Tutar</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Sonuç bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            data.map((ticket) => (
              <TableRow key={ticket.id} className="group">
                <TableCell className="font-bold text-primary">{ticket.ticketNumber}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{ticket.customer.name}</span>
                    <span className="text-[10px] text-muted-foreground">{ticket.customer.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{ticket.deviceBrand} {ticket.deviceModel}</span>
                    {ticket.imei && <span className="text-[10px] text-muted-foreground">IMEI: {ticket.imei}</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-xs italic">
                  "{ticket.problemDesc}"
                </TableCell>
                <TableCell>
                  <Badge className={`${statusMap[ticket.status as ServiceStatus].color} border-none font-bold text-[10px] uppercase tracking-wider`} variant="outline">
                    {statusMap[ticket.status as ServiceStatus].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] font-medium whitespace-nowrap">
                  {format(new Date(ticket.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                </TableCell>
                <TableCell className="text-right font-black text-primary">
                  ₺{Number(ticket.estimatedCost).toLocaleString("tr-TR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => sendWhatsApp(ticket, ticket.status === "READY" ? "READY" : "NEW_SERVICE")}
                      title="WhatsApp Mesajı Gönder"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Link href={`/servis/yazdir?id=${ticket.id}`} target="_blank">
                        <Printer className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Durum Güncelle</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(statusMap).map(([status, info]) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusUpdate(ticket.id, status as ServiceStatus)}
                            disabled={ticket.status === status}
                            className="text-xs"
                          >
                            <div className={cn("w-2 h-2 rounded-full mr-2", info.color.split(' ')[0])} />
                            {info.label} Yap
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive text-xs" onClick={() => handleDelete(ticket.id)}>
                          <Trash className="mr-2 h-3 w-3" />
                          Kaydı Sil
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
