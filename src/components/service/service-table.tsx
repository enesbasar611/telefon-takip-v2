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
import { MoreHorizontal, Trash, CheckCircle2, Clock, Wrench as WrenchIcon, Package as PackageIcon, CheckCircle, XCircle } from "lucide-react";
import { updateServiceStatus, deleteServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";

interface ServiceTableProps {
  data: any[];
}

const statusMap: Record<ServiceStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Beklemede", color: "bg-gray-100 text-gray-800", icon: Clock },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  REPAIRING: { label: "Tamirde", color: "bg-amber-100 text-amber-800", icon: WrenchIcon },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-100 text-purple-800", icon: PackageIcon },
  READY: { label: "Hazır", color: "bg-green-100 text-green-800", icon: CheckCircle },
  DELIVERED: { label: "Teslim Edildi", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-100 text-red-800", icon: XCircle },
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

  return (
    <div className="rounded-md border bg-card">
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
            <TableHead className="w-[50px]"></TableHead>
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
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{ticket.customer.name}</span>
                    <span className="text-xs text-muted-foreground">{ticket.customer.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{ticket.deviceBrand} {ticket.deviceModel}</span>
                    {ticket.imei && <span className="text-xs text-muted-foreground">IMEI: {ticket.imei}</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {ticket.problemDesc}
                </TableCell>
                <TableCell>
                  <Badge className={`${statusMap[ticket.status as ServiceStatus].color} gap-1`} variant="outline">
                    {/* {statusMap[ticket.status as ServiceStatus].icon && <statusMap[ticket.status as ServiceStatus].icon className="h-3 w-3" />} */}
                    {statusMap[ticket.status as ServiceStatus].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {format(new Date(ticket.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₺{Number(ticket.estimatedCost).toLocaleString("tr-TR")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(statusMap).map(([status, info]) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusUpdate(ticket.id, status as ServiceStatus)}
                          disabled={ticket.status === status}
                        >
                          {info.label} Yap
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ticket.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
