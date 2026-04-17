import { Sidebar } from "@/components/sidebar";
import { IndustryBackground } from "@/components/industry-background";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { UIProvider } from "@/lib/context/ui-context";
import { SupplierOrderProvider } from "@/lib/context/supplier-order-context";
import { ShortageProvider } from "@/lib/context/shortage-context";
import { DashboardDataProvider } from "@/lib/context/dashboard-data-context";
import { AuraProvider } from "@/lib/context/aura-context";
import { AuraSystem } from "@/components/ui/aura-system";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { QueryProvider } from "@/components/providers/query-provider";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { getStaff } from "@/lib/actions/staff-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { GlobalSearch } from "@/components/global-search";
import { redirect } from "next/navigation";
import { getShopId, getSession } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Check approval status first (server-side, always fresh from DB via JWT callback)
    const session = await getSession();
    if (!session?.user) {
        redirect("/login");
    }

    const isApproved = (session.user as any).isApproved;
    const role = (session.user as any).role;
    const isSuperAdmin = role === "SUPER_ADMIN";

    if (!isApproved && !isSuperAdmin) {
        redirect("/verify");
    }

    // Ensure the user has a shop before rendering dashboard shell
    let shopId;
    try {
        shopId = await getShopId();
    } catch (error) {
        redirect("/login");
    }

    let staff: any[] = [];
    let initialRates: any = null;
    let initialStats: any = null;
    let shop: any = null;

    try {
        // Parallel fetch for data needed throughout the dashboard
        const [staffRes, ratesRes, statsRes, shopRes] = await Promise.all([
            getStaff(shopId).catch(() => []),
            getExchangeRates(shopId).catch(() => null),
            getDashboardStats(shopId).catch(() => null),
            getShop().catch(() => null),
        ]);
        staff = staffRes;
        initialRates = ratesRes;
        initialStats = statsRes;
        shop = shopRes;
    } catch (err) {
        console.error("DashboardLayout: Could not load initial data.", err);
    }

    if (shop?.isFirstLogin) {
        redirect("/onboarding");
    }

    const adminUser = staff.find((u: any) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') || staff[0] || null;
    const primaryColor = (shop?.themeConfig as any)?.industryTemplate?.primaryColor
        || (shop?.themeConfig as any)?.primaryColor
        || "#6366f1";

    return (
        <QueryProvider>
            <ProgressBarProvider>
                <UIProvider>
                    <AuraProvider>
                        <DashboardDataProvider initialRates={initialRates} initialStats={initialStats}>
                            <SupplierOrderProvider>
                                <ShortageProvider>
                                    <style>{`:root { --brand-color: ${primaryColor}; --brand-color-muted: ${primaryColor}1a; }`}</style>
                                    <AuraSystem />
                                    <GlobalSearch />
                                    {shop?.industry && <IndustryBackground industry={shop.industry} />}
                                    <div className="flex h-screen bg-background/20 text-foreground font-sans overflow-hidden relative z-0">
                                        <Sidebar
                                            className="hidden lg:flex"
                                            user={adminUser ? { name: adminUser.name, role: adminUser.role } : undefined}
                                            shop={shop}
                                        />
                                        <DashboardContent>
                                            <Navbar shop={shop} />
                                            <main className="flex-1 lg:p-10 p-0 overflow-y-auto overflow-x-hidden custom-scrollbar relative w-full">
                                                <div className="max-w-[1700px] mx-auto w-full min-h-full lg:rounded-[6rem] lg:border border-white/30 dark:border-white/10 lg:bg-white/60 dark:lg:bg-black/60 lg:backdrop-blur-[60px] lg:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] p-4 pb-32 lg:p-14 lg:px-16 transition-all duration-700 relative z-10">
                                                    {children}
                                                </div>
                                            </main>
                                        </DashboardContent>
                                        <BottomNav />
                                    </div>
                                </ShortageProvider>
                            </SupplierOrderProvider>
                        </DashboardDataProvider>
                    </AuraProvider>
                </UIProvider>
            </ProgressBarProvider>
        </QueryProvider>
    );
}



