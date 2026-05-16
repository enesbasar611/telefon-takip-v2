import { readFileSync } from "fs";
import { join } from "path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const statDetailModal = source("src/components/dashboard/modals/stat-detail-modal.tsx");
const shortageStatusCard = source("src/components/dashboard/widgets/shortage-status-card.tsx");
const dashboardPage = source("src/app/(dashboard)/dashboard/page.tsx");
const createTransactionModal = source("src/components/finance/create-transaction-modal.tsx");
const createAccountModal = source("src/components/finance/create-account-modal.tsx");
const accountDetailModal = source("src/components/finance/account-detail-modal.tsx");

assert(statDetailModal.includes("useQuery"), "Dashboard stat detail modal should use React Query.");
assert(statDetailModal.includes("invalidateQueries"), "Dashboard stat mutations should invalidate cached dashboard/finance queries.");
assert(!statDetailModal.includes("const [loading, setLoading]"), "Dashboard stat detail modal should not keep manual loading state for fetched data.");

assert(shortageStatusCard.includes("useQuery"), "Shortage status dashboard card should use React Query.");
assert(!shortageStatusCard.includes("setInterval(fetchData"), "Shortage status dashboard card should use query refetchInterval.");

assert(dashboardPage.includes("HydrationBoundary"), "Dashboard page should hydrate React Query cache from server data.");
assert(dashboardPage.includes("dehydrate(queryClient)"), "Dashboard page should dehydrate prefetched dashboard queries.");
assert(dashboardPage.includes('setQueryData(["dashboard-init", shopId || ""], dashboardInit)'), "Dashboard page should seed dashboard-init query with shop scoped initial data.");
assert(!dashboardPage.includes("<Suspense fallback={<DashboardPageSkeleton />}>"), "Dashboard page should not stream a full-page skeleton during normal SSR.");
assert(!dashboardPage.includes("<Suspense fallback={<ChartSkeleton />}>"), "Dashboard chart widgets should render with server data instead of chart skeleton fallbacks.");

assert(createTransactionModal.includes("useQuery"), "Finance transaction modal should cache accounts and recent transactions.");
assert(createTransactionModal.includes("useMutation"), "Finance transaction modal should submit via useMutation.");
assert(createTransactionModal.includes("invalidateQueries"), "Finance transaction modal should invalidate dashboard and finance caches.");
assert(!createTransactionModal.includes("loadInitialData"), "Finance transaction modal should not use manual loadInitialData.");

assert(createAccountModal.includes("useQuery"), "Finance account modal should cache account summaries.");
assert(createAccountModal.includes("useMutation"), "Finance account modal should mutate accounts through React Query.");

assert(accountDetailModal.includes("useQuery"), "Finance account detail analytics should use React Query.");

console.log("query-cache-coverage tests passed");
