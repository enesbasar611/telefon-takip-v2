import { redirect } from "next/navigation";
import { getSession, getShopId } from "@/lib/auth";
import { Role } from "@prisma/client";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { StaffDashboardClient } from "@/components/dashboard/staff-dashboard-client";
import { getEmployeeDashboardData } from "@/lib/actions/staff-finance-actions";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";
import { getShop, getSettings } from "@/lib/actions/setting-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.shopId) redirect("/login");

  const isAdmin = session.user.role === Role.ADMIN || session.user.role === Role.SHOP_MANAGER || session.user.role === Role.SUPER_ADMIN;

  if (isAdmin) {
    const queryClient = new QueryClient();
    const shopId = await getShopId(false);

    // Fetch essential data for hydration and initial render
    const [initialStats, shop, categories, suppliers, staffData, settings] = await Promise.all([
      getDashboardInit(shopId ?? undefined),
      getShop(),
      getCategories(),
      getSuppliers(),
      getEmployeeDashboardData(session.user.id),
      getSettings()
    ]);

    // Hydrate query client for streaming widgets
    queryClient.setQueryData(["dashboard-init", shopId || ""], initialStats);

    const defaultCurrency = (settings as any[])?.find((s: any) => s.key === "defaultCurrency")?.value || "TRY";

    return (
      <DashboardProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <div className="p-4 sm:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <AdminDashboard
              stats={initialStats.stats}
              rates={initialStats.rates}
              user={session.user}
              shop={shop}
              categories={categories}
              suppliers={suppliers}
              staffData={staffData}
              userName={session.user.name || "Yönetici"}
              shopId={shopId ?? undefined}
              defaultCurrency={defaultCurrency}
            />
          </div>
        </HydrationBoundary>
      </DashboardProvider>
    );
  }

  // Staff/Technician/Courier view
  const [staffData, settings, dashboardData] = await Promise.all([
    getEmployeeDashboardData(session.user.id),
    getSettings(),
    getDashboardInit(session.user.shopId)
  ]);

  const defaultCurrency = (settings as any[])?.find((s: any) => s.key === "defaultCurrency")?.value || "TRY";
  const usdRate = dashboardData.rates.usd;

  return (
    <div className="p-4 sm:p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
            Dashboard
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
            Kişisel Performans & Verimlilik Merkezi
          </p>
        </div>
      </div>

      <StaffDashboardClient
        data={staffData}
        defaultCurrency={defaultCurrency}
        usdRate={usdRate}
      />
    </div>
  );
}
