import { Sidebar } from "@/components/sidebar";
import { IndustryBackground } from "@/components/industry-background";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { UIProvider } from "@/lib/context/ui-context";
import { SupplierOrderProvider } from "@/lib/context/supplier-order-context";
import { ShortageProvider } from "@/lib/context/shortage-context";
import { DashboardDataProvider } from "@/lib/context/dashboard-data-context";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { QueryProvider } from "@/components/providers/query-provider";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { getStaffShell } from "@/lib/actions/staff-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { GlobalSearch } from "@/components/global-search";
import { redirect } from "next/navigation";
import { getShopId, getSession } from "@/lib/auth";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import {
    defaultAppearanceSettings,
    getRadiusForButtonStyle,
    getSafeBrandColor,
    getSafeFontFamily,
    getSafeFontImport,
    getSafeFontWeight,
    hexToHsl,
    settingsArrayToRecord,
} from "@/lib/appearance-settings";

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
    let shopId: string | null = null;
    try {
        shopId = await getShopId();
    } catch (error) {
        // If it's a super admin, we allow them to continue even without a shopId (e.g. just stopped impersonating)
        if (isSuperAdmin) {
            shopId = null;
        } else {
            console.error("DashboardLayout Auth Error: Redirecting to login because no shopId found.");
            redirect("/login");
        }
    }

    let staff: any[] = [];
    let initialRates: any = null;
    let shop: any = null;
    let settings: any[] = [];

    try {
        // Keep the dashboard shell light; page-specific stats load through React Query.
        if (shopId) {
            const [staffRes, ratesRes, shopRes, settingsRes] = await Promise.all([
                getStaffShell(shopId).catch(() => []),
                getExchangeRates(shopId).catch(() => null),
                getShop().catch(() => null),
                getSettings().catch(() => []),
            ]);
            staff = staffRes;
            initialRates = ratesRes;
            shop = shopRes;
            settings = settingsRes;
        } else if (isSuperAdmin) {
            // Default empty state for shop-less super admin (e.g. at /admin/shops)
            staff = [];
            initialRates = { usd: 34, eur: 37, ga: 3000, lastUpdate: new Date() };
            shop = { name: "Yönetim Paneli", industry: "GENERAL" };
            settings = [];
        }
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
    const appearance = settingsArrayToRecord(settings);
    const brandColor = getSafeBrandColor(appearance.brandColor || primaryColor);
    const primaryHsl = hexToHsl(brandColor);
    const appFont = getSafeFontFamily(appearance.fontFamily);
    const appFontImport = getSafeFontImport(appFont);
    const appFontWeight = getSafeFontWeight(appearance.fontWeight);
    const radius = getRadiusForButtonStyle(appearance.buttonStyle || defaultAppearanceSettings.buttonStyle);

    return (
        <QueryProvider>
            <ProgressBarProvider>
                <UIProvider>
                    <DashboardDataProvider initialRates={initialRates} initialStats={null} shopId={shopId || ""}>
                        <SupplierOrderProvider>
                            <ShortageProvider>
                                <link
                                    rel="stylesheet"
                                    href={`https://fonts.googleapis.com/css2?family=${appFontImport.gfont}&display=swap`}
                                />
                                <style>{`:root { --brand-color: ${brandColor}; --brand-color-muted: ${brandColor}1a; --primary: ${primaryHsl}; --ring: ${primaryHsl}; --app-font: '${appFont}', system-ui, -apple-system, sans-serif; --app-font-weight: ${appFontWeight}; --radius: ${radius}; } body, h1, h2, h3, h4, h5, h6, button, label, span, p, div, input, textarea, select { font-family: var(--app-font); font-weight: var(--app-font-weight) !important; }`}</style>
                                <GlobalSearch />
                                {isSuperAdmin && (session.user as any).shopId && !shop?.name?.toLowerCase().includes("başar") && (
                                    <ImpersonationBanner shopName={shop?.name || "Bilinmeyen Dükkan"} />
                                )}
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
                                            <div className="max-w-[1700px] mx-auto w-full min-h-full lg:rounded-[6rem] lg:border border-white/30 dark:border-border/70 lg:bg-white/60 dark:lg:bg-background/95 lg:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.22)] p-4 pb-32 lg:p-14 lg:px-16 transition-all duration-700 relative z-10">
                                                {children}
                                            </div>
                                        </main>
                                    </DashboardContent>
                                    <BottomNav />
                                </div>
                            </ShortageProvider>
                        </SupplierOrderProvider>
                    </DashboardDataProvider>
                </UIProvider>
            </ProgressBarProvider>
        </QueryProvider>
    );
}



