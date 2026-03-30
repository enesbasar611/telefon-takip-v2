import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { serializePrisma } from "@/lib/utils";
import { StatType } from "../modals/stat-detail-modal";
import { StatsClientWrapper } from "./stats-client-wrapper";

export async function StatsGridStream() {
    const statsDataRaw = await getDashboardStats();
    const statsData = serializePrisma(statsDataRaw);

    const stats = [
        { label: "Kasa Bakiyesi", value: statsData?.todaySales || "₺0", subValue: `Kasa: ${statsData?.kasaBalance || "₺0"}`, iconId: "ShoppingCart", accent: "primary", colorClass: "text-primary", bgClass: "bg-primary/10", badge: "Güncel" },
        { label: "Tamir gelirleri", value: statsData?.todayRepairIncome || "₺0", iconId: "Wrench", accent: "secondary", colorClass: "text-secondary", bgClass: "bg-secondary/10", trend: "+8%" },
        { label: "Tahsilatlar", value: statsData?.collectedPayments || "₺0", iconId: "Banknote", accent: "tertiary", colorClass: "text-amber-500", bgClass: "bg-amber-500/10" },
        { label: "Bekleyen servisler", value: statsData?.pendingServices || "0", iconId: "Clock", accent: "primary", colorClass: "text-blue-500", bgClass: "bg-blue-500/10", badge: "Acil" },
        { label: "Hazır cihazlar", value: statsData?.readyDevices || "0", iconId: "CheckCircle2", accent: "secondary", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
        { label: "Kritik stok", value: statsData?.criticalStock || "0", iconId: "AlertTriangle", accent: "destructive", colorClass: "text-rose-500", bgClass: "bg-rose-500/10", badge: "Kritik", type: "CRITICAL_STOCK" },
        { label: "Toplam borçlar", value: statsData?.totalDebts || "₺0", iconId: "ArrowDownCircle", accent: "primary", colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10", type: "TOTAL_DEBTS" },
        { label: "Kasa & Hesaplar", value: statsData?.cashBalance || "₺0", iconId: "Wallet", accent: "primary", colorClass: "text-primary", bgClass: "bg-primary/10", type: "CASH_BALANCE" },
    ];

    const statTypes: Record<string, StatType> = {
        "Kasa Bakiyesi": "DAILY_SALES",
        "Tamir gelirleri": "REPAIR_INCOME",
        "Tahsilatlar": "COLLECTIONS",
        "Bekleyen servisler": "PENDING_SERVICES",
        "Hazır cihazlar": "READY_DEVICES",
        "Kritik stok": "CRITICAL_STOCK",
        "Toplam borçlar": "TOTAL_DEBTS",
        "Kasa & Hesaplar": "CASH_BALANCE",
    };

    return <StatsClientWrapper stats={stats} statTypes={statTypes} statsData={statsData} />;
}
