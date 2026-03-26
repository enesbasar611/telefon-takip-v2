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

export default async function DashboardOzetSubPage() {
  const statsData = await getDashboardStats();
  const recentTicketsRaw = await getRecentServiceTickets();
  const recentTransactions = await getRecentTransactions();
  const topProducts = await getTopSellingProducts();
  const salesTrend = await getSalesReport();
  const serviceMetricsRaw = await getServiceMetrics();
  const liveActivity = await getLiveActivity();
  const profitMatrix = await getProfitMatrix("THIS_MONTH");

  return (
    <DashboardCore
      title="Özet rapor"
      subtitle="İşletme genel durum ve verimlilik raporu"
      statsData={statsData}
      recentTicketsRaw={recentTicketsRaw}
      recentTransactions={recentTransactions}
      topProducts={topProducts}
      salesTrend={salesTrend}
      serviceMetricsRaw={serviceMetricsRaw}
      liveActivity={liveActivity}
      profitMatrix={profitMatrix}
      showFullDetails={false}
    />
  );
}
