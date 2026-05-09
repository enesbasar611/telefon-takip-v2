import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

import {
  StatsSkeleton,
} from "@/components/dashboard/dashboard-skeletons";

import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryConfig, isModuleEnabled, getIndustryLabel } from "@/lib/industry-utils";
import { serializePrisma } from "@/lib/utils";
import { getCategories } from "@/lib/actions/product-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LayoutDashboard } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";
import { LiveClock } from "@/components/dashboard/live-clock";
import { QuickShortcuts } from "@/components/dashboard/quick-shortcuts";
import { DashboardEditButton } from "@/components/dashboard/dashboard-edit-button";
import { ShortageStatusCard } from "@/components/dashboard/widgets/shortage-status-card";

import { getProfile } from "@/lib/actions/staff-actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AnnouncementsModal } from "@/components/dashboard/announcements-modal";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { StatWidgetWrapper } from "@/components/dashboard/stat-widget-wrapper";
import { getShopId } from "@/lib/auth";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { DashboardOnboardingClient } from "@/components/setup/dashboard-onboarding-client";

import {
  ChartSkeleton,
  ListSkeleton,
  ActivitySkeleton
} from "@/components/dashboard/dashboard-skeletons";
import { RevenueAnalysisStream } from "@/components/dashboard/streamed/revenue-analysis-stream";
import { ServiceStatusStream } from "@/components/dashboard/streamed/service-status-stream";
import { SmartInsightsStream } from "@/components/dashboard/streamed/smart-insights-stream";
import { ReceivablesStream } from "@/components/dashboard/streamed/receivables-stream";
import { LiveActivityStream } from "@/components/dashboard/streamed/live-activity-stream";
import { RecentTransactionsStream } from "@/components/dashboard/streamed/recent-transactions-stream";
import { ServiceQueueStream } from "@/components/dashboard/streamed/service-queue-stream";
import { TopProductsStream } from "@/components/dashboard/streamed/top-products-stream";

async function DashboardContentData() {
  const shopId = await getShopId(false);
  const [shop, categories, profile, statsDataRaw] = await Promise.all([
    getShop(),
    getCategories(),
    getProfile(),
    getDashboardStats(shopId)
  ]);

  const statsData = serializePrisma(statsDataRaw);
  const industryConf = getIndustryConfig(shop?.industry);
  const showService = isModuleEnabled(shop, "SERVICE");
  const serviceLabel = getIndustryLabel(shop, "serviceTicket");
  const assetLabel = getIndustryLabel(shop, "customerAsset");

  const statItems = [
    { id: "stat_sales", type: "DAILY_SALES", label: "Kasa Bakiyesi", value: statsData?.kasaBalance || "0", subValue: `Günün Satışı: ${statsData?.todaySales || "0"}`, iconId: "Wallet", colorClass: "text-primary", bgClass: "bg-primary/10", badge: "Güncel" },
    { id: "stat_income", type: "REPAIR_INCOME", label: `${serviceLabel} Gelirleri`, value: statsData?.todayRepairIncome || "0", iconId: "Wrench", colorClass: "text-secondary", bgClass: "bg-secondary/10", trend: "+8%" },
    { id: "stat_collections", type: "COLLECTIONS", label: "Tahsilatlar", value: statsData?.collectedPayments || "0", iconId: "Banknote", colorClass: "text-amber-500", bgClass: "bg-amber-500/10" },
    { id: "stat_pending", type: "PENDING_SERVICES", label: `Bekleyen ${serviceLabel || 'Servis'}ler`, value: statsData?.pendingServices || "0", iconId: "Clock", colorClass: "text-blue-500", bgClass: "bg-blue-500/10", badge: "Acil" },
    { id: "stat_ready", type: "READY_DEVICES", label: `Hazır ${assetLabel || 'Cihaz'}lar`, value: statsData?.readyDevices || "0", iconId: "CheckCircle2", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { id: "stat_stock", type: "CRITICAL_STOCK", label: "Kritik stok", value: statsData?.criticalStock || "0", iconId: "AlertTriangle", colorClass: "text-rose-500", bgClass: "bg-rose-500/10", badge: "Kritik" },
    { id: "stat_debts", type: "TOTAL_DEBTS", label: "Toplam borçlar", value: statsData?.totalDebts || "0", iconId: "ArrowDownCircle", colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10" },
    { id: "stat_accounts", type: "CASH_BALANCE", label: "Satış Hacmi", value: statsData?.todaySales || "0", iconId: "ShoppingCart", colorClass: "text-primary", bgClass: "bg-primary/10" },
  ];

  const defaultLayout = [
    ...statItems.map(s => s.id),
    "revenue",
    ...(showService ? ["service_status"] : []),
    "shortage_status",
    "ai_insights",
    "receivables",
    ...(showService ? ["service_queue"] : []),
    "activity",
    "transactions",
    "inventory"
  ];

  const savedLayout = profile?.dashboardLayout as any[];
  let layout: any[];

  if (Array.isArray(savedLayout) && savedLayout.length > 0) {
    // Smart Merge: Identify items in defaultLayout that are not in the savedLayout
    const missingItems = defaultLayout.filter(defaultId => {
      return !savedLayout.some(item => {
        const itemId = typeof item === 'string' ? item : item.id;
        return itemId === defaultId;
      });
    });

    // Append new items to the existing layout
    layout = [...savedLayout, ...missingItems];
  } else {
    layout = defaultLayout;
  }

  const widgets: any = {
    revenue: (
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueAnalysisStream />
      </Suspense>
    ),
    service_status: (
      <Suspense fallback={<ChartSkeleton />}>
        <ServiceStatusStream title={serviceLabel} />
      </Suspense>
    ),
    ai_insights: (
      <Suspense fallback={<StatsSkeleton />}>
        <SmartInsightsStream />
      </Suspense>
    ),
    shortage_status: (
      <ShortageStatusCard />
    ),
    receivables: (
      <Suspense fallback={<ListSkeleton />}>
        <ReceivablesStream />
      </Suspense>
    ),
    activity: (
      <Suspense fallback={<ActivitySkeleton />}>
        <LiveActivityStream />
      </Suspense>
    ),
    transactions: (
      <Suspense fallback={<ListSkeleton />}>
        <RecentTransactionsStream />
      </Suspense>
    ),
    service_queue: (
      <Suspense fallback={<ListSkeleton />}>
        <ServiceQueueStream title={`${serviceLabel} Kuyruğu`} />
      </Suspense>
    ),
    inventory: (
      <Suspense fallback={<ListSkeleton />}>
        <TopProductsStream />
      </Suspense>
    )
  };

  statItems.forEach(stat => {
    widgets[stat.id] = (
      <StatWidgetWrapper
        stat={stat}
        type={stat.type as any}
        statsData={statsData}
      />
    );
  });

  const widgetLabels: Record<string, string> = {
    receivables: "Alacaklarım",
    shortage_status: "Kurye Durumu",
  };
  statItems.forEach(s => { widgetLabels[s.id] = s.label; });

  return (
    <>
      <AnnouncementsModal />
      <DashboardOnboardingClient categories={categories} shop={shop} />
      <div className="hidden md:flex flex-col space-y-12 selection:bg-primary/20 relative z-10">
        <PageHeader
          title={shop?.name ? `${shop.name.toUpperCase()} PANELİ` : "YÖNETİM PANELİ"}
          description={
            <div className="flex items-center gap-1">
              <span>{industryConf.name} operasyon ve finance takip merkezi • {format(new Date(), "d MMMM yyyy", { locale: tr })}</span>
              <LiveClock />
            </div>
          }
          icon={LayoutDashboard}
          actions={
            <div className="flex items-center gap-3">
              <QuickShortcuts />
              <DashboardEditButton />
            </div>
          }
          badge={
            <div className="flex items-center bg-card/40 backdrop-blur-md border border-border/40 p-0 rounded-full shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-500/5 border-r border-border/40">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-emerald-600/70 tracking-tighter uppercase leading-none font-bold">Sistem Durumu</span>
                  <span className="text-[10px] text-emerald-600 tracking-tight font-bold">AKTİF</span>
                </div>
              </div>
              <div className="px-4 py-1.5 flex flex-col">
                <span className="text-[8px] text-muted-foreground/60 tracking-tighter uppercase leading-none font-bold">Veri Akışı</span>
                <span className="text-[10px] text-foreground tracking-tight uppercase font-bold">GERÇEK ZAMANLI</span>
              </div>
            </div>
          }
        />

        <DashboardClient
          key={JSON.stringify(layout)}
          initialLayout={layout}
          widgets={widgets}
          widgetLabels={widgetLabels}
        />
      </div>
      <div className="md:hidden flex flex-col space-y-6 pt-2 pb-10">
        <MobileDashboard />
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (session?.user?.role === "COURIER") {
    redirect("/kurye");
  }

  return (
    <DashboardProvider>
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardContentData />
      </Suspense>
    </DashboardProvider>
  );
}
