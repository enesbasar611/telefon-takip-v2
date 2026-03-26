"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ServiceStatus } from "@prisma/client";
import { updateServiceStatus } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wrench } from "lucide-react";

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "bg-slate-500" },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-500" },
  REPAIRING: { label: "Tamirde", color: "bg-orange-500" },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-500" },
  READY: { label: "Hazır", color: "bg-emerald-500" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-600" },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-500" },
};

interface ServiceStatusModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceStatusModal({ ticket, isOpen, onClose }: ServiceStatusModalProps) {
  const [status, setStatus] = useState<ServiceStatus>(ticket?.status as ServiceStatus || "PENDING");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  if (!ticket) return null;

  const handleUpdate = async () => {
    setIsPending(true);
    try {
      const result = await updateServiceStatus(ticket.id, status);
      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Servis durumu güncellendi.",
        });
        onClose();
      } else {
        toast({
          title: "Hata",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-none shadow-none p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-muted/30 pb-4">
          <div className="flex items-center gap-3">
             <div className="bg-orange-500/10 p-2 rounded-xl">
                <Wrench className="h-5 w-5 text-orange-500" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black ">Durum Güncelle</DialogTitle>
                <DialogDescription className="text-xs font-bold   text-muted-foreground">
                    {ticket.ticketNumber} - {ticket.customer?.name}
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
             <Label className="text-[10px] font-black   text-muted-foreground ml-1">Yeni Durum Seçin</Label>
             <Select value={status} onValueChange={(val) => setStatus(val as ServiceStatus)}>
                <SelectTrigger className="bg-muted/50 border-none h-12 font-bold text-sm focus:ring-1 focus:ring-primary shadow-inner">
                    <SelectValue placeholder="Durum Seçin" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-xs font-bold  py-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                {config.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center ml-1">
                <Label className="text-[10px] font-black   text-muted-foreground">İşlem Notu (Opsiyonel)</Label>
                <span className="text-[9px] font-bold text-muted-foreground italic">Opsiyonel</span>
             </div>
             <Textarea
                placeholder="Bu aşamada yapılan işlemler hakkında not ekleyin..."
                className="bg-muted/50 border-none min-h-[100px] text-xs font-medium focus:ring-1 focus:ring-primary shadow-inner p-4"
             />
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t border-border/50">
           <div className="flex items-center justify-between w-full">
                <Button variant="ghost" className="text-xs font-bold " onClick={onClose}>İptal</Button>
                <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black  text-xs px-8 shadow-lg shadow-orange-500/20 gap-2 h-11"
                    onClick={handleUpdate}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                    Durumu Kaydet
                </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
