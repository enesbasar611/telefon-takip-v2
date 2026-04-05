"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  User,
  Phone,
  Calendar,
  Clock,
  FileText,
  Wrench,
  Package,
  History
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ServiceStatus } from "@prisma/client";
import { cn, formatPhone } from "@/lib/utils";

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "bg-slate-500" },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-500" },
  REPAIRING: { label: "Tamirde", color: "bg-orange-500" },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-500" },
  READY: { label: "Hazır", color: "bg-emerald-500" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-600" },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-500" },
};

interface ServiceDetailsModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceDetailsModal({ ticket, isOpen, onClose }: ServiceDetailsModalProps) {
  if (!ticket) return null;

  const status = statusConfig[ticket.status as ServiceStatus];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-card border-none shadow-none">
        <DialogHeader className="p-6 bg-muted/30 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2.5 rounded-2xl">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="font-medium text-2xl ">{ticket.ticketNumber}</DialogTitle>
                <DialogDescription className="text-xs  text-slate-500">
                  {ticket.deviceBrand} {ticket.deviceModel}
                </DialogDescription>
              </div>
            </div>
            <Badge className={cn("text-[10px]  px-5 py-2 shadow-xl border-none", status.color)}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 py-2 h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Customer & Device Section */}
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm ">Müşteri Bilgileri</h4>
                </div>
                <div className="bg-slate-900/50 rounded-3xl p-6 space-y-4 border border-white/5 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-slate-500">Ad Soyad</span>
                    <span className="text-sm  text-slate-200">{ticket.customer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-slate-500">Telefon</span>
                    <span className="text-sm  text-blue-400 font-mono">{formatPhone(ticket.customer?.phone)}</span>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm ">Cihaz Bilgileri</h4>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 space-y-3 border border-border/50 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">Marka / Model</span>
                    <span className="text-sm ">{ticket.deviceBrand} {ticket.deviceModel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">IMEI</span>
                    <span className="text-sm  select-all">{ticket.imei || "Bilinmiyor"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">Seri No</span>
                    <span className="text-sm  select-all">{ticket.serialNumber || "Bilinmiyor"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">Kozmetik Durum</span>
                    <span className="text-xs font-medium text-right">"{ticket.cosmeticCondition || "Belirtilmedi"}"</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Service & Finance Section */}
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm ">Arıza Detayları</h4>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 shadow-inner">
                  <p className="text-sm font-medium leading-relaxed">"{ticket.problemDesc}"</p>
                  {ticket.notes && (
                    <>
                      <Separator className="my-3 opacity-20" />
                      <div className="space-y-1">
                        <span className="text-[10px]  text-muted-foreground">Teknik Notlar</span>
                        <p className="text-xs font-medium text-muted-foreground">{ticket.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm ">Tarih ve Atama</h4>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 space-y-3 border border-border/50 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">Kayıt Tarihi</span>
                    <span className="text-sm ">{format(new Date(ticket.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">Teslim Tarihi</span>
                    <span className="text-sm  text-primary">
                      {ticket.estimatedDeliveryDate ? format(new Date(ticket.estimatedDeliveryDate), "dd MMMM yyyy", { locale: tr }) : "Belirtilmedi"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]  text-muted-foreground">Teknisyen</span>
                    <Badge variant="outline" className="text-[10px] ">{ticket.technician?.name || "Atanmamış"}</Badge>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <Separator className="my-6 opacity-20" />

          {/* Service Logs */}
          <section className="pb-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm ">İşlem Geçmişi</h4>
            </div>
            <div className="space-y-3">
              {ticket.logs?.map((log: any, idx: number) => (
                <div key={log.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === 0 ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                    {idx !== ticket.logs.length - 1 && <div className="w-px h-full bg-muted-foreground/10 group-hover:bg-primary/20 transition-colors" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs  text-foreground">{log.status}</span>
                      <span className="text-[10px]  text-muted-foreground">{format(new Date(log.createdAt), "dd MMM, HH:mm", { locale: tr })}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{log.message}</p>
                  </div>
                </div>
              ))}
              {(!ticket.logs || ticket.logs.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">Henüz işlem geçmişi bulunmuyor.</p>
              )}
            </div>
          </section>
        </ScrollArea>

        <DialogFooter className="p-4 bg-muted/30 border-t border-border/50">
          <div className="w-full flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px]  text-muted-foreground">Tahmini Tutar</span>
              <span className="text-lg  text-primary">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-xs  shadow-sm" onClick={onClose}>Kapat</Button>
              <Button className="text-xs  shadow-lg shadow-primary/20">Fatura Çıkar</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





