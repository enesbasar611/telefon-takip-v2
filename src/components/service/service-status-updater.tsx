"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { ServiceStatus } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateServiceStatus } from "@/lib/actions/service-actions";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getLoyaltyTier } from "@/lib/loyalty-utils";
import { Sparkles, CreditCard, Banknote, History, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getSettings } from "@/lib/actions/setting-actions";

const statusMap: Record<ServiceStatus, { label: string; color: string }> = {
  PENDING: { label: "BEKLEMEDE", color: "bg-gray-500" },
  APPROVED: { label: "ONAYLANDI", color: "bg-blue-500" },
  REPAIRING: { label: "TAMİRDE", color: "bg-orange-500" },
  WAITING_PART: { label: "PARÇA BEKLİYOR", color: "bg-purple-500" },
  READY: { label: "HAZIR", color: "bg-emerald-500" },
  DELIVERED: { label: "TESLİM EDİLDİ", color: "bg-blue-500" },
  CANCELLED: { label: "İPTAL EDİLDİ", color: "bg-rose-500" },
};

export function ServiceStatusUpdater({ ticket }: { ticket: any }) {
  const [isPending, startTransition] = useTransition();
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    paymentMethod: "CASH",
    applyLoyaltyDiscount: false
  });

  const ticketId = ticket.id;
  const currentStatus = ticket.status;

  const [pointValueTl, setPointValueTl] = useState<number>(5);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

  // Load points settings
  useEffect(() => {
    async function fetchPointsSettings() {
      try {
        const settings = await getSettings();
        const config = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
        setPointValueTl(Number(config.loyalty_point_value_tl) || 5);
        setLoyaltyEnabled(config.loyalty_enabled !== "false");
      } catch (err) {
        // ignore
      }
    }
    if (isDeliveryModalOpen) {
      fetchPointsSettings();
    }
  }, [isDeliveryModalOpen]);

  const handleUpdate = (status: ServiceStatus) => {
    if (status === currentStatus) return;

    if (status === "DELIVERED") {
      setIsDeliveryModalOpen(true);
      return;
    }

    startTransition(async () => {
      const res = await updateServiceStatus(ticketId, status);
      if (res.success) {
        toast.success(`Durum ${statusMap[status].label} olarak güncellendi.`);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDeliveryConfirm = () => {
    startTransition(async () => {
      const res = await updateServiceStatus(
        ticketId,
        "DELIVERED" as ServiceStatus,
        deliveryData.paymentMethod,
        undefined,
        loyaltyDiscountAmount,
        usedPoints // new parameter to subtract
      );
      if (res.success) {
        toast.success("Cihaz teslim edildi ve işlem kaydedildi.");
        setIsDeliveryModalOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  // Loyalty calculations
  const partsTotal = ticket.usedParts.reduce((acc: number, part: any) => acc + (Number(part.unitPrice) * (part.quantity || 1)), 0);
  const laborTotal = Number(ticket.actualCost) || Number(ticket.estimatedCost);
  const subtotal = partsTotal + laborTotal;

  const totalPoints = ticket.customer?.loyaltyPoints || 0;

  // Calculate discount dynamically based on points
  const loyaltyDiscountAmount = useMemo(() => {
    if (!deliveryData.applyLoyaltyDiscount || totalPoints <= 0 || !loyaltyEnabled) return 0;

    const maxPointsDiscount = totalPoints * pointValueTl;
    // Disocunt cannot exceed subtotal
    return Math.min(maxPointsDiscount, subtotal);
  }, [deliveryData.applyLoyaltyDiscount, totalPoints, subtotal, pointValueTl, loyaltyEnabled]);

  // Points that were exactly consumed to match the discount
  const usedPoints = Math.ceil(loyaltyDiscountAmount / pointValueTl);

  const finalTotal = subtotal - loyaltyDiscountAmount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="w-full h-12 rounded-2xl bg-blue-500 text-black  hover:bg-blue-400 transition-all flex items-center justify-center gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "DURUMU GÜNCELLE"}
          {!isPending && <ChevronDown className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border/50 text-white p-2 min-w-[220px] shadow-none">
        <DropdownMenuLabel className="text-[10px]  text-gray-500 p-3">Yeni Durum Seçin</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        {Object.entries(statusMap).map(([status, info]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleUpdate(status as ServiceStatus)}
            disabled={status === currentStatus}
            className="p-3 text-[10px]  rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center group"
          >
            <div className={cn("w-2 h-2 rounded-full", info.color)} />
            {info.label} YAP
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>

      <Dialog open={isDeliveryModalOpen} onOpenChange={setIsDeliveryModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-border text-white rounded-[2.5rem] p-0 overflow-hidden sm:max-w-[500px]">
          <div className="p-8 border-b border-white/[0.03] bg-white/[0.01]">
            <DialogTitle className="text-2xl ">Cihaz Teslimatı</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">
              Ödeme yöntemini seçin ve varsa sadakat indirimini uygulayın.
            </DialogDescription>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">ÖDEME YÖNTEMİ</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "CASH", label: "NAKİT", icon: Banknote },
                  { id: "CREDIT_CARD", label: "KART", icon: CreditCard },
                  { id: "TRANSFER", label: "HAVALE", icon: Banknote }, // Reuse icon for bank
                  { id: "DEBT", label: "VERESİYE", icon: History }
                ].map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    className={cn(
                      "h-16 flex items-center justify-start gap-4 rounded-2xl border-border/40 transition-all px-6",
                      deliveryData.paymentMethod === method.id
                        ? "bg-blue-500 text-black border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-white/[0.03] text-gray-400 hover:bg-white/5"
                    )}
                    onClick={() => setDeliveryData({ ...deliveryData, paymentMethod: method.id })}
                  >
                    <method.icon className="h-5 w-5" />
                    <span className="text-xs ">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {loyaltyEnabled && totalPoints > 0 && (
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-500 tracking-wide">CÜZDAN BAKİYESİ KULLAN</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Müşterinin <strong>{totalPoints} Puanı</strong> ({formatCurrency(totalPoints * pointValueTl)} TL değeri) var.
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={deliveryData.applyLoyaltyDiscount}
                  onCheckedChange={(checked) => setDeliveryData({ ...deliveryData, applyLoyaltyDiscount: !!checked })}
                  className="h-6 w-6 rounded-lg border-blue-500/50 data-[state=checked]:bg-blue-500"
                />
              </div>
            )}

            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Ara Toplam</span>
                <span className="text-white">₺{formatCurrency(subtotal)}</span>
              </div>
              {loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-500">Sadakat İndirimi</span>
                  <span className="text-blue-500">- ₺{formatCurrency(loyaltyDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-white/[0.03]">
                <span className="text-sm ">TOPLAM TAHSİLAT</span>
                <span className="text-2xl  text-emerald-500">₺{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/[0.01] border-t border-white/[0.03]">
            <Button
              className="w-full h-16 rounded-2xl bg-emerald-500 text-black  hover:bg-emerald-400 shadow-xl shadow-emerald-500/10 gap-3"
              disabled={isPending}
              onClick={handleDeliveryConfirm}
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              TESLİMATI TAMAMLA VE KAYDET
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}



