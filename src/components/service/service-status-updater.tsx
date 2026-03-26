"use client";

import { useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";

const statusMap: Record<ServiceStatus, { label: string; color: string }> = {
  PENDING: { label: "BEKLEMEDE", color: "bg-gray-500" },
  APPROVED: { label: "ONAYLANDI", color: "bg-blue-500" },
  REPAIRING: { label: "TAMİRDE", color: "bg-orange-500" },
  WAITING_PART: { label: "PARÇA BEKLİYOR", color: "bg-purple-500" },
  READY: { label: "HAZIR", color: "bg-emerald-500" },
  DELIVERED: { label: "TESLİM EDİLDİ", color: "bg-blue-500" },
  CANCELLED: { label: "İPTAL EDİLDİ", color: "bg-rose-500" },
};

export function ServiceStatusUpdater({ ticketId, currentStatus }: { ticketId: string; currentStatus: ServiceStatus }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (status: ServiceStatus) => {
    if (status === currentStatus) return;

    startTransition(async () => {
      const res = await updateServiceStatus(ticketId, status);
      if (res.success) {
        toast.success(`Durum ${statusMap[status].label} olarak güncellendi.`);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="w-full h-12 rounded-2xl bg-blue-500 text-black font-black   hover:bg-blue-400  transition-all flex items-center justify-center gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "DURUMU GÜNCELLE"}
          {!isPending && <ChevronDown className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white p-2 min-w-[220px] shadow-none">
        <DropdownMenuLabel className="text-[10px]   font-black text-gray-500 p-3">Yeni Durum Seçin</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        {Object.entries(statusMap).map(([status, info]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleUpdate(status as ServiceStatus)}
            disabled={status === currentStatus}
            className="p-3 text-[10px] font-black rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center group  "
          >
            <div className={cn("w-2 h-2 rounded-full", info.color)} />
            {info.label} YAP
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
