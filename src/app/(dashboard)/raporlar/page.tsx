"use client";

import { Suspense } from "react";
import {
  getDashboardStats,
  getSalesReport,
  getServiceMetrics,
  getTopProductsReport,
  getDeviceBrandDistribution,
  getCashflowReport
} from "@/lib/actions/report-actions";
import { RaporlarClient } from "@/components/reports/raporlar-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

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
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-4 w-60 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px] rounded-[2rem]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[410px] rounded-[2rem]" />
        <Skeleton className="h-[410px] rounded-[2rem]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[410px] rounded-[2rem]" />
        <Skeleton className="h-[410px] rounded-[2rem]" />
      </div>
    </div>
  );
}

function RaporlarData() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => {
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

      return {
        stats,
        salesData,
        serviceMetrics,
        cashflow,
        topProducts,
        brandDistribution
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !reports) {
    return <RaporlarSkeleton />;
  }

  return (
    <RaporlarClient
      stats={reports.stats}
      salesData={reports.salesData}
      serviceMetrics={reports.serviceMetrics}
      cashflow={reports.cashflow}
      topProducts={reports.topProducts}
      brandDistribution={reports.brandDistribution}
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
