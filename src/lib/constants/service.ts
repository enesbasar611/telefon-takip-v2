import { ServiceStatus } from "@prisma/client";
import { Clock, CheckCircle2, Wrench, PackagePlus, ShoppingBag, XCircle } from "lucide-react";

export const SERVICE_STATUS_GROUPS = {
    ACTIVE: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"] as ServiceStatus[],
    READY: ["READY"] as ServiceStatus[],
    DONE: ["DELIVERED", "CANCELLED"] as ServiceStatus[],
};

export const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; icon: any; glow?: string }> = {
    PENDING: { label: "Beklemede", color: "bg-slate-500", icon: Clock },
    APPROVED: { label: "Onaylandı", color: "bg-blue-500", icon: CheckCircle2 },
    REPAIRING: { label: "Tamirde", color: "bg-orange-500", icon: Wrench },
    WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-500", icon: PackagePlus },
    READY: { label: "Hazır", color: "bg-emerald-500", icon: CheckCircle2, glow: "shadow-emerald-500/20" },
    DELIVERED: { label: "Teslim Edildi", color: "bg-green-600", icon: ShoppingBag, glow: "shadow-blue-500/30 animate-pulse" },
    CANCELLED: { label: "İptal Edildi", color: "bg-red-500", icon: XCircle },
};
