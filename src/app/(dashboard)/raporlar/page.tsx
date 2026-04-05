import { getDashboardStats, getSalesReport, getServiceMetrics, getTopProductsReport, getDeviceBrandDistribution, getCashflowReport, getDetailedExportData } from "@/lib/actions/report-actions";
import { RaporlarClient } from "@/components/reports/raporlar-client";

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  PENDING: "#94a3b8",
  APPROVED: "#3b82f6",
  REPAIRING: "#3b82f6",
  WAITING_PART: "#8b5cf6",
  READY: "#10b981",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
};

const statusLabels: Record<string, string> = {
  PENDING: "Beklemede", APPROVED: "Onay Bekliyor", REPAIRING: "Tamirde",
  WAITING_PART: "Parça Bekliyor", READY: "Hazır", DELIVERED: "Teslim Edildi", CANCELLED: "İptal"
};

export default async function RaporlarPage() {
  const [stats, salesData, serviceMetricsRaw, topProductsRaw, brandDistribution, cashflow, exportData] = await Promise.all([
    getDashboardStats(),
    getSalesReport(),
    getServiceMetrics(),
    getTopProductsReport(6),
    getDeviceBrandDistribution(),
    getCashflowReport(),
    getDetailedExportData()
  ]);

  const serviceMetrics = serviceMetricsRaw.map((m: any) => ({
    ...m,
    name: statusLabels[m.name] || m.name,
    color: statusColors[m.name] || "#cbd5e1"
  }));

  const topProducts = topProductsRaw.map((p: any) => ({
    name: p.name,
    sales: p.sales ?? p._count?.saleItems ?? 0,
    price: p.price ?? p.sellPrice ?? 0,
    categoryName: p.categoryName
  }));

  return (
    <RaporlarClient
      stats={stats}
      salesData={salesData}
      serviceMetrics={serviceMetrics}
      cashflow={cashflow}
      topProducts={topProducts}
      brandDistribution={brandDistribution}
      exportData={exportData}
    />
  );
}



