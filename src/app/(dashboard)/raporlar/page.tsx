import { Suspense } from "react";
import { getDashboardStats, getSalesReport, getServiceMetrics, getTopProductsReport, getDeviceBrandDistribution, getCashflowReport, getDetailedExportData } from "@/lib/actions/report-actions";
import { RaporlarClient } from "@/components/reports/raporlar-client";
import { Skeleton } from "@/components/ui/skeleton";

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

function RaporlarSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-4 w-60 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[360px] rounded-3xl" />
        <Skeleton className="h-[360px] rounded-3xl" />
      </div>
      <Skeleton className="h-[300px] rounded-3xl" />
    </div>
  );
}

async function RaporlarData() {
  const [stats, salesData, serviceMetricsRaw, topProductsRaw, brandDistribution, cashflow] = await Promise.all([
    getDashboardStats(),
    getSalesReport(),
    getServiceMetrics(),
    getTopProductsReport(6),
    getDeviceBrandDistribution(),
    getCashflowReport()
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
    />
  );
}

export default function RaporlarPage() {
  return (
    <Suspense fallback={<RaporlarSkeleton />}>
      <RaporlarData />
    </Suspense>
  );
}
