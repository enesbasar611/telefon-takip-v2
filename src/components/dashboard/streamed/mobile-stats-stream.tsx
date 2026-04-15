import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { getShopId } from "@/lib/auth";
import { MobileStatsHeader } from "../mobile-stats-header";

export async function MobileStatsStream() {
    const shopId = await getShopId();
    const stats = await getDashboardStats(shopId);

    const formattedStats = {
        pendingServices: parseInt(stats.pendingServices) || 0,
        readyAssets: parseInt(stats.readyDevices) || 0,
        todayRevenue: stats.todaySalesRaw || 0,
        activeRepairs: parseInt(stats.pendingServices) || 0,
        kasaBalance: stats.kasaBalance,
        kasaBalanceRaw: stats.kasaBalanceRaw,
        totalDevices: parseInt(stats.totalDevices) || 0,
    };

    return <MobileStatsHeader stats={formattedStats} />;
}
