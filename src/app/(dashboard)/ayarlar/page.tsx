import { SettingsInterface } from "@/components/settings/settings-interface";
import { getSession } from "@/lib/auth";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { getAllReceiptSettings } from "@/lib/actions/receipt-settings";

function SettingsSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>
      <div className="flex gap-6 mt-8">
        <div className="w-[220px] space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default async function AyarlarPage() {
  const session = await getSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  // Pre-fetch data for faster load and better SEO/Hydration
  const [settings, receiptSettings, shop] = await Promise.all([
    getSettings(),
    getAllReceiptSettings(),
    getShop()
  ]);

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsInterface
        isSuperAdmin={isSuperAdmin}
        initialSettings={settings}
        receiptSettings={receiptSettings}
        shop={shop}
      />
    </Suspense>
  );
}
