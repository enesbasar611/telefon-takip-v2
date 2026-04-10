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

import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryConfig, isModuleEnabled, getIndustryLabel } from "@/lib/industry-utils";
import { cn } from "@/lib/utils";
import { SetupCheck } from "@/components/setup/setup-check";
import { DashboardOnboardingClient } from "@/components/setup/dashboard-onboarding-client";
import { getCategories } from "@/lib/actions/product-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const shop = await getShop();
  const categories = await getCategories();
  const industryConf = getIndustryConfig(shop?.industry);
  const showService = isModuleEnabled(shop, "SERVICE");
  const serviceLabel = getIndustryLabel(shop, "serviceTicket");
  const assetLabel = getIndustryLabel(shop, "customerAsset");

  const hasConfig = !!(shop?.themeConfig as any)?.aiServiceFields;

  return (
    <div className="flex-1 space-y-10 p-8 pt-6 bg-transparent min-h-screen font-sans selection:bg-primary/20 relative z-10">
      <SetupCheck
        isFirstLogin={shop?.isFirstLogin ?? false}
        shopName={shop?.name || "Dükkan"}
      />
      <DashboardOnboardingClient categories={categories} shop={shop} />

      <DashboardHeader
        title={shop?.name ? `${shop.name.toUpperCase()} PANELİ` : "YÖNETİM PANELİ"}
        subtitle={`${industryConf.name} operasyon ve finans takip merkezi`}
      />

      {/* Phase 1: Key Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsGridStream
          labels={{
            repairIncome: `${serviceLabel} Gelirleri`,
            pendingServices: `Bekleyen ${serviceLabel || 'Servis'}ler`,
            readyAssets: `Hazır ${assetLabel || 'Cihaz'}lar`
          }}
        />
      </Suspense>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Phase 2: Core Analytics */}
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueAnalysisStream />
        </Suspense>

        {/* Phase 2: Operational Health */}
        {showService && (
          <Suspense fallback={<ChartSkeleton />}>
            <ServiceStatusStream title={serviceLabel} />
          </Suspense>
        )}

        {/* Phase 3: AI Insights (Spans 2 columns if service is hidden) */}
        <div className={cn(showService ? "lg:col-span-1" : "lg:col-span-2")}>
          <Suspense fallback={<StatsSkeleton />}>
            <SmartInsightsStream />
          </Suspense>
        </div>

        {/* Phase 3: Live Feed */}
        <Suspense fallback={<ActivitySkeleton />}>
          <LiveActivityStream />
        </Suspense>

        {/* Phase 4: Operational Queues */}
        <Suspense fallback={<ListSkeleton />}>
          <RecentTransactionsStream />
        </Suspense>

        {showService && (
          <Suspense fallback={<ListSkeleton />}>
            <ServiceQueueStream title={`${serviceLabel} Kuyruğu`} />
          </Suspense>
        )}

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
