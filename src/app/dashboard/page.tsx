import {
  getDashboardStats,
  getRecentServiceTickets,
  getRecentTransactions,
  getTopSellingProducts
} from "@/lib/actions/dashboard-actions";
import { getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";
import { getLiveActivity } from "@/lib/actions/live-actions";
import { getProfitMatrix } from "@/lib/actions/analytics-actions";
import { DashboardCore } from "@/components/dashboard/dashboard-core";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const statsData = await getDashboardStats();
  const recentTicketsRaw = await getRecentServiceTickets();
  const recentTransactions = await getRecentTransactions();
  const topProducts = await getTopSellingProducts();
  const salesTrend = await getSalesReport();
  const serviceMetricsRaw = await getServiceMetrics();
  const liveActivity = await getLiveActivity();
  const profitMatrix = await getProfitMatrix("THIS_MONTH");

  if (!statsData) return <div className="p-12 text-center text-muted-foreground animate-pulse">Analitik veriler hazırlanıyor...</div>;

  const serializeDecimals = (data: any): any => {
    if (data === null || data === undefined) return data;
    if (typeof data.toNumber === 'function') return data.toNumber();
    if (Array.isArray(data)) return data.map(serializeDecimals);
    if (typeof data === 'object') {
      if (data.constructor && data.constructor.name === 'Decimal') return Number(data);
      const res: any = {};
      for (const key of Object.keys(data)) {
        res[key] = serializeDecimals(data[key]);
      }
      return res;
    }
    return data;
  };

  return (
    <DashboardCore
      statsData={serializeDecimals(statsData)}
      recentTicketsRaw={serializeDecimals(recentTicketsRaw)}
      recentTransactions={serializeDecimals(recentTransactions)}
      topProducts={serializeDecimals(topProducts)}
      salesTrend={serializeDecimals(salesTrend)}
      serviceMetricsRaw={serializeDecimals(serviceMetricsRaw)}
      liveActivity={serializeDecimals(liveActivity)}
      profitMatrix={serializeDecimals(profitMatrix)}
    />
  );
}
