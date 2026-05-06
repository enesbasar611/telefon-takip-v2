import { Suspense } from "react";
import { getDebts, getThisMonthCollected } from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { getSettings } from "@/lib/actions/setting-actions";
import { VeresiyeClient } from "@/components/finance/veresiye-client";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function VeresiyeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <div className="rounded-3xl border border-border/40 overflow-hidden bg-card/50">
        <Skeleton className="h-12 w-full rounded-none" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-border/20">
            <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function VeresiyeData() {
  const [debts, thisMonthCollected, accounts, rates, settings, shop] = await Promise.all([
    getDebts(),
    getThisMonthCollected(),
    getAccounts(),
    import("@/lib/auth").then(m => m.getShopId()).then(id => import("@/lib/actions/currency-actions").then(m => m.getExchangeRates(id))),
    getSettings(),
    import("@/lib/actions/setting-actions").then(m => m.getShop())
  ]);

  return <VeresiyeClient debts={debts} thisMonthCollected={thisMonthCollected} accounts={accounts} rates={rates} settings={settings} shop={shop} />;
}

export default function VeresiyePage() {
  return (
    <Suspense fallback={<VeresiyeSkeleton />}>
      <VeresiyeData />
    </Suspense>
  );
}
