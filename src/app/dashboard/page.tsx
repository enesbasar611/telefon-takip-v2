import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsGridStream } from "@/components/dashboard/streamed/stats-grid-stream";
import { RevenueAnalysisStream } from "@/components/dashboard/streamed/revenue-analysis-stream";
import { ServiceStatusStream } from "@/components/dashboard/streamed/service-status-stream";
import { SmartInsightsStream } from "@/components/dashboard/streamed/smart-insights-stream";
import { LiveActivityStream } from "@/components/dashboard/streamed/live-activity-stream";
import { RecentTransactionsStream } from "@/components/dashboard/streamed/recent-transactions-stream";
import { ServiceQueueStream } from "@/components/dashboard/streamed/service-queue-stream";
import { TopProductsStream } from "@/components/dashboard/streamed/top-products-stream";
import {
  StatsSkeleton,
  ChartSkeleton,
  ListSkeleton,
  ActivitySkeleton
} from "@/components/dashboard/dashboard-skeletons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  return (
    <div className="flex-1 space-y-10 p-8 pt-6 bg-gradient-to-br from-background via-background/95 to-muted/30 min-h-screen font-sans selection:bg-primary/20">
      <DashboardHeader />

      {/* Phase 1: Key Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsGridStream />
      </Suspense>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Phase 2: Core Analytics */}
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueAnalysisStream />
        </Suspense>

        {/* Phase 2: Operational Health */}
        <Suspense fallback={<ChartSkeleton />}>
          <ServiceStatusStream />
        </Suspense>

        {/* Phase 3: AI Insights (Spans 2 columns) */}
        <Suspense fallback={<StatsSkeleton />}>
          <SmartInsightsStream />
        </Suspense>

        {/* Phase 3: Live Feed */}
        <Suspense fallback={<ActivitySkeleton />}>
          <LiveActivityStream />
        </Suspense>

        {/* Phase 4: Operational Queues */}
        <Suspense fallback={<ListSkeleton />}>
          <RecentTransactionsStream />
        </Suspense>

        <Suspense fallback={<ListSkeleton />}>
          <ServiceQueueStream />
        </Suspense>

        {/* Phase 4: Inventory Trends (Full width) */}
        <div className="lg:col-span-3">
          <Suspense fallback={<ListSkeleton />}>
            <TopProductsStream />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

