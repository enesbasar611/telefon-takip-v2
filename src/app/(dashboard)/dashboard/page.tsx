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
import { DashboardOnboardingClient } from "@/components/setup/dashboard-onboarding-client";
import { getCategories } from "@/lib/actions/product-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LayoutDashboard } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";

export default async function DashboardPage() {
  const [shop, categories] = await Promise.all([
    getShop(),
    getCategories()
  ]);
  const industryConf = getIndustryConfig(shop?.industry);
  const showService = isModuleEnabled(shop, "SERVICE");
  const serviceLabel = getIndustryLabel(shop, "serviceTicket");
  const assetLabel = getIndustryLabel(shop, "customerAsset");

  return (
    <>
      <DashboardOnboardingClient categories={categories} shop={shop} />

      {/* Desktop Dashboard View */}
      <div className="hidden md:flex flex-col space-y-12 selection:bg-primary/20 relative z-10">
        <PageHeader
          title={shop?.name ? `${shop.name.toUpperCase()} PANELİ` : "YÖNETİM PANELİ"}
          description={`${industryConf.name} operasyon ve finans takip merkezi • ${format(new Date(), "d MMMM yyyy", { locale: tr })}`}
          icon={LayoutDashboard}
          badge={
            <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md border border-border/40 p-1 rounded-full shadow-sm">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-emerald-600/70 tracking-tighter uppercase leading-none font-bold">Sistem Durumu</span>
                  <span className="text-[10px] text-emerald-600 tracking-tight font-bold">AKTİF & STABİL</span>
                </div>
              </div>
              <div className="px-4 py-1.5 pr-6">
                <div className="flex flex-col">
                  <span className="text-[8px] text-muted-foreground/60 tracking-tighter uppercase leading-none font-bold">Veri Akışı</span>
                  <span className="text-[10px] text-foreground tracking-tight uppercase font-bold">GERÇEK ZAMANLI</span>
                </div>
              </div>
            </div>
          }
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

      {/* Mobile Dashboard View (Apple Style) */}
      <div className="md:hidden flex flex-col space-y-6 pt-2 pb-10">
        <MobileDashboard />
      </div>
    </>
  );
}
