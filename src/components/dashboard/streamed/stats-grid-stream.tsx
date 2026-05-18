import { getDashboardStats, getDashboardInit } from "@/lib/actions/dashboard-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { StatType } from "../modals/stat-detail-modal";
import { StatsClientWrapper } from "./stats-client-wrapper";
import { getShopId } from "@/lib/auth";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export async function StatsGridStream({ labels }: { labels?: Record<string, string> }) {
    const shopId = await getShopId(false);

    // Prefetch for client cards
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
        queryKey: ["dashboard-init", shopId || ""],
        queryFn: () => getDashboardInit(shopId),
    });

    const statsDataRaw = await getDashboardStats(shopId);
    const statsData = serializePrisma(statsDataRaw);

    const stats = [
        { label: "Kasa Bakiyesi", value: statsData?.kasaBalance || "₺0", subValue: `Günün Satışı: ${statsData?.todaySales || "₺0"}`, iconId: "Wallet", accent: "primary", colorClass: "text-primary", bgClass: "bg-primary/10", badge: "Güncel", type: "DAILY_SALES" },
        { label: labels?.repairIncome || "Tamir gelirleri", value: statsData?.todayRepairIncome || "₺0", iconId: "Wrench", accent: "secondary", colorClass: "text-secondary", bgClass: "bg-secondary/10", trend: "+8%", type: "REPAIR_INCOME" },
        { label: "Tahsilatlar", value: statsData?.collectedPayments || "₺0", iconId: "Banknote", accent: "tertiary", colorClass: "text-amber-500", bgClass: "bg-amber-500/10", type: "COLLECTIONS" },
        { label: labels?.pendingServices || "Bekleyen servisler", value: statsData?.pendingServices || "0", iconId: "Clock", accent: "primary", colorClass: "text-blue-500", bgClass: "bg-blue-500/10", badge: "Acil", type: "PENDING_SERVICES" },
        { label: labels?.readyAssets || "Hazır cihazlar", value: statsData?.readyDevices || "0", iconId: "CheckCircle2", accent: "secondary", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", type: "READY_DEVICES" },
        { label: "Kritik stok", value: statsData?.criticalStock || "0", iconId: "AlertTriangle", accent: "destructive", colorClass: "text-rose-500", bgClass: "bg-rose-500/10", badge: "Kritik", type: "CRITICAL_STOCK" },
        { label: "Toplam borçlar", value: statsData?.totalDebts || "₺0", iconId: "ArrowDownCircle", accent: "primary", colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10", type: "TOTAL_DEBTS" },
        { label: "Satış Hacmi", value: statsData?.todaySales || "₺0", subValue: "Bugünkü ciro", iconId: "ShoppingCart", accent: "primary", colorClass: "text-primary", bgClass: "bg-primary/10", type: "CASH_BALANCE" },
    ];

    const statTypes: Record<string, StatType> = {
        "Kasa Bakiyesi": "DAILY_SALES",
        "Tamir gelirleri": "REPAIR_INCOME",
        "Tahsilatlar": "COLLECTIONS",
        "Bekleyen servisler": "PENDING_SERVICES",
        "Hazır cihazlar": "READY_DEVICES",
        "Kritik stok": "CRITICAL_STOCK",
        "Toplam borçlar": "TOTAL_DEBTS",
        "Satış Hacmi": "CASH_BALANCE",
    };

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <StatsClientWrapper stats={stats} statTypes={statTypes} statsData={statsData} />
        </HydrationBoundary>
    );
}
