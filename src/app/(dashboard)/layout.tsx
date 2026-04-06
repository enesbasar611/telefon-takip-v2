import { Sidebar } from "@/components/sidebar";
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
import { GlobalSearch } from "@/components/global-search";
import { redirect } from "next/navigation";
import { getShopId } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
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

    try {
        // Parallel fetch for data needed throughout the dashboard
        const [staffRes, ratesRes, statsRes] = await Promise.all([
            getStaff().catch(() => []),
            getExchangeRates().catch(() => null),
            getDashboardStats().catch(() => null),
        ]);
        staff = staffRes;
        initialRates = ratesRes;
        initialStats = statsRes;
    } catch (err) {
        console.error("DashboardLayout: Could not load initial data.", err);
    }

    const adminUser = staff.find((u: any) => u.role === 'ADMIN') || staff[0] || null;

    return (
        <QueryProvider>
            <ProgressBarProvider>
                <UIProvider>
                    <AuraProvider>
                        <DashboardDataProvider initialRates={initialRates} initialStats={initialStats}>
                            <SupplierOrderProvider>
                                <ShortageProvider>
                                    <AuraSystem />
                                    <GlobalSearch />
                                    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
                                        <Sidebar className="hidden lg:flex" user={adminUser ? { name: adminUser.name, role: adminUser.role } : undefined} />
                                        <DashboardContent>
                                            <Navbar />
                                            <main className="flex-1 p-6 lg:p-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                                <div className="max-w-[1600px] mx-auto w-full min-w-0 pb-20 lg:pb-0">
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



