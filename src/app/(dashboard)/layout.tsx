import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { UIProvider } from "@/lib/context/ui-context";
import { SupplierOrderProvider } from "@/lib/context/supplier-order-context";
import { ShortageProvider } from "@/lib/context/shortage-context";
import { getStaff } from "@/lib/actions/staff-actions";
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
    try {
        staff = await getStaff();
    } catch (err) {
        console.error("DashboardLayout: Could not load staff.");
    }

    const adminUser = staff.find((u: any) => u.role === 'ADMIN') || staff[0] || null;

    return (
        <UIProvider>
            <SupplierOrderProvider>
                <ShortageProvider>
                    <GlobalSearch />
                    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
                        <Sidebar className="hidden lg:flex" user={adminUser ? { name: adminUser.name, role: adminUser.role } : undefined} />
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <Navbar />
                            <main className="flex-1 p-4 lg:p-8 overflow-auto custom-scrollbar">
                                <div className="max-w-[1600px] mx-auto w-full pb-20 lg:pb-0">
                                    {children}
                                </div>
                            </main>
                        </div>
                        <BottomNav />
                    </div>
                </ShortageProvider>
            </SupplierOrderProvider>
        </UIProvider>
    );
}
