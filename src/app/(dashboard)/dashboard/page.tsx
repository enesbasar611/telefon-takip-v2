import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
export const dynamic = "force-dynamic";

import { getShop, getSettings } from "@/lib/actions/setting-actions";
import { getIndustryConfig, isModuleEnabled, getIndustryLabel } from "@/lib/industry-utils";
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
import { StatWidgetWrapper } from "@/components/dashboard/stat-widget-wrapper";
import { getShopId } from "@/lib/auth";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { DashboardOnboardingClient } from "@/components/setup/dashboard-onboarding-client";
import { getCategories } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { getSalesReport, getServiceMetrics } from "@/lib/actions/report-actions";
import { getProfitMatrix } from "@/lib/actions/analytics-actions";
import { getRecentTransactions } from "@/lib/actions/dashboard-actions";
import { serializePrisma } from "@/lib/utils";

import { RevenueAnalysisStream } from "@/components/dashboard/streamed/revenue-analysis-stream";
import { ServiceStatusStream } from "@/components/dashboard/streamed/service-status-stream";
import { SmartInsightsStream } from "@/components/dashboard/streamed/smart-insights-stream";
import { ReceivablesStream } from "@/components/dashboard/streamed/receivables-stream";
import { LiveActivityStream } from "@/components/dashboard/streamed/live-activity-stream";
import { RecentTransactionsStream } from "@/components/dashboard/streamed/recent-transactions-stream";
import { ServiceQueueStream } from "@/components/dashboard/streamed/service-queue-stream";
import { TopProductsStream } from "@/components/dashboard/streamed/top-products-stream";

import { getDashboardInit, getDashboardStats, getTopProducts } from "@/lib/actions/dashboard-actions";
import { getDebts } from "@/lib/actions/debt-actions";
import {
  getSystemDashboardLayout,
  isCollapsedDashboardLayout,
  normalizeDashboardLayout,
} from "@/lib/dashboard-layout";

async function DashboardContentData() {
  const queryClient = new QueryClient();

  const [shopId, shop, categories, suppliers, profile, settings] = await Promise.all([
    getShopId(false),
    getShop(),
    getCategories(),
    getSuppliers(),
    getProfile(),
    getSettings(),
  ]);

  const initialStats = await getDashboardInit(shopId);
  queryClient.setQueryData(["dashboard-init", shopId || ""], initialStats);
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["dashboard-revenue-analysis"],
      queryFn: async () => {
        const [salesTrendRaw, profitMatrixRaw] = await Promise.all([
          getSalesReport(),
          getProfitMatrix("THIS_MONTH"),
        ]);
        return {
          salesTrend: serializePrisma(salesTrendRaw),
          profitMatrix: serializePrisma(profitMatrixRaw),
        };
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-recent-transactions", shopId || ""],
      queryFn: async () => {
        if (!shopId) return [];
        return serializePrisma(await getRecentTransactions(shopId));
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-service-metrics"],
      queryFn: async () => serializePrisma(await getServiceMetrics()),
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-smart-insights", shopId || ""],
      queryFn: async () => serializePrisma(await getDashboardStats(shopId || "")),
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-receivables", shopId || ""],
      queryFn: async () => ({
        debts: serializePrisma(await getDebts()),
        shop,
      }),
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-top-products", shopId || "", 4],
      queryFn: async () => {
        if (!shopId) return [];
        return getTopProducts(shopId, 4);
      },
    }),
  ]);

  const industryConf = getIndustryConfig(shop?.industry);
  const serviceLabel = getIndustryLabel(shop, "serviceTicket");
  const assetLabel = getIndustryLabel(shop, "customerAsset");
  const defaultCurrency = (settings as any[])?.find((s: any) => s.key === "defaultCurrency")?.value || "TRY";

  const s = initialStats.stats || {};
  const statItems = [
    { id: "stat_sales", type: "DAILY_SALES", label: "Kasa Bakiyesi", value: s.kasaBalance || "0", subValue: `Günün Satışı: ${s.todaySales || "₺0"}`, iconId: "Wallet", colorClass: "text-primary", bgClass: "bg-primary/10", badge: "Güncel", usdValue: s.kasaBalanceUSD },
    { id: "stat_income", type: "REPAIR_INCOME", label: `${serviceLabel} Gelirleri`, value: s.todayRepairIncome || "0", iconId: "Wrench", colorClass: "text-secondary", bgClass: "bg-secondary/10", trend: "+8%", usdValue: s.todayRepairIncomeUSD },
    { id: "stat_collections", type: "COLLECTIONS", label: "Tahsilatlar", value: s.collectedPayments || "0", iconId: "Banknote", colorClass: "text-amber-500", bgClass: "bg-amber-500/10", usdValue: s.collectedPaymentsUSD },
    { id: "stat_pending", type: "PENDING_SERVICES", label: `Bekleyen ${serviceLabel || 'Servis'}ler`, value: s.pendingServices || "0", iconId: "Clock", colorClass: "text-blue-500", bgClass: "bg-blue-500/10", badge: "Acil" },
    { id: "stat_ready", type: "READY_DEVICES", label: `Hazır ${assetLabel || 'Cihaz'}lar`, value: s.readyDevices || "0", iconId: "CheckCircle2", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { id: "stat_stock", type: "CRITICAL_STOCK", label: "Kritik stok", value: s.criticalStock || "0", outOfStockCount: s.outOfStockCount || "0", iconId: "AlertTriangle", colorClass: "text-rose-500", bgClass: "bg-rose-500/10", badge: "Kritik" },
    { id: "stat_debts", type: "TOTAL_DEBTS", label: "Toplam borçlar", value: s.totalDebts || "0", iconId: "ArrowDownCircle", colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10", usdValue: s.totalDebtsUSD },
    { id: "stat_accounts", type: "CASH_BALANCE", label: "Satış Hacmi", value: s.todaySales || "0", subValue: "Bugünkü ciro", iconId: "ShoppingCart", colorClass: "text-primary", bgClass: "bg-primary/10", usdValue: s.todaySalesUSD },
  ];

  const widgets: any = {
    revenue: <RevenueAnalysisStream />,
    service_status: <ServiceStatusStream title={serviceLabel} />,
    ai_insights: <SmartInsightsStream shopId={shopId || ""} />,
    shortage_status: <ShortageStatusCard />,
    receivables: <ReceivablesStream shopId={shopId || ""} />,
    activity: <LiveActivityStream />,
    transactions: <RecentTransactionsStream shopId={shopId || ""} />,
    service_queue: <ServiceQueueStream title={`${serviceLabel} Kuyruğu`} />,
    inventory: <TopProductsStream shopId={shopId || ""} />
  };

  statItems.forEach(stat => {
    widgets[stat.id] = (
      <StatWidgetWrapper
        stat={stat}
        type={stat.type as any}
        shopId={shopId}
        defaultCurrency={defaultCurrency}
      />
    );
  });

  const widgetLabels: Record<string, string> = {
    receivables: "Alacaklarım",
    shortage_status: "Kurye Durumu",
  };
  statItems.forEach(s => { widgetLabels[s.id] = s.label; });

  const availableWidgetIds = Object.keys(widgets);
  const defaultLayout = getSystemDashboardLayout(availableWidgetIds);
  const savedLayout = profile?.dashboardLayout as any[];
  const layout = Array.isArray(savedLayout) && savedLayout.length > 0 && !isCollapsedDashboardLayout(savedLayout)
    ? normalizeDashboardLayout(savedLayout, availableWidgetIds, defaultLayout)
    : defaultLayout;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardOnboardingClient categories={categories} shop={shop} />
      <div className="hidden md:flex min-h-[1100px] flex-col space-y-6 selection:bg-primary/20 relative z-10 opacity-100 transition-opacity duration-200">
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
              <QuickShortcuts shop={shop} categories={categories} suppliers={suppliers} />
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
          initialData={null}
          widgets={widgets}
          widgetLabels={widgetLabels}
          shopId={shopId || ""}
        />
      </div>
      <div className="md:hidden flex min-h screen flex-col space-y-6 pt-2 pb-10 transition-opacity duration-200">
        <MobileDashboard />
      </div>
    </HydrationBoundary>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (session?.user?.role === "COURIER") {
    redirect("/kurye");
  }

  return (
    <DashboardProvider>
      <DashboardContentData />
    </DashboardProvider>
  );
}
