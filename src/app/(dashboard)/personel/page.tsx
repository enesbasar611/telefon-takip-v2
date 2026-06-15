import { StaffManagementClient } from "@/components/staff/staff-management-client";
import { getSession, getShopId } from "@/lib/auth";
import { getSettings } from "@/lib/actions/setting-actions";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";

export const dynamic = 'force-dynamic';

export default async function PersonelPage() {
  const session = await getSession();
  const shopId = await getShopId(false);
  const userRole = session?.user?.role;

  const [settings, dashboardData] = await Promise.all([
    getSettings(),
    getDashboardInit(shopId ?? undefined)
  ]);

  const defaultCurrency = (settings as any[])?.find((s: any) => s.key === "defaultCurrency")?.value || "TRY";
  const usdRate = dashboardData.rates.usd;

  return (
    <StaffManagementClient
      userRole={userRole}
      defaultCurrency={defaultCurrency}
      usdRate={usdRate}
    />
  );
}
