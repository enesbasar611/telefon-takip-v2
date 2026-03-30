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
  let statsData: any = null;
  let recentTicketsRaw: any[] = [];
  let recentTransactions: any[] = [];
  let topProducts: any[] = [];
  let salesTrend: any[] = [];
  let serviceMetricsRaw: any = null;
  let liveActivity: any[] = [];
  let profitMatrix: any = null;

  try {
    [statsData, recentTicketsRaw, recentTransactions, topProducts, salesTrend, serviceMetricsRaw, liveActivity, profitMatrix] = await Promise.all([
      getDashboardStats(),
      getRecentServiceTickets(),
      getRecentTransactions(),
      getTopSellingProducts(),
      getSalesReport(),
      getServiceMetrics(),
      getLiveActivity(),
      getProfitMatrix("THIS_MONTH"),
    ]);
  } catch (err) {
    console.error("Dashboard: DB connection failed", err);
  }

  if (!statsData) return <div className="p-12 text-center text-muted-foreground">Veritabanı bağlantısı kurulamadı. Lütfen Neon konsolunu kontrol edin ve sayfayı yenileyin.</div>;

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
