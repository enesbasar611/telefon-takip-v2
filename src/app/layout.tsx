import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UIProvider } from "@/lib/context/ui-context";
import { SupplierOrderProvider } from "@/lib/context/supplier-order-context";
import { ShortageProvider } from "@/lib/context/shortage-context";
import { getStaff } from "@/lib/actions/staff-actions";
import { GlobalSearch } from "@/components/global-search";

export const metadata: Metadata = {
  title: "Takip V2 - Mobil Servis & ERP",
  description: "Profesyonel SaaS Mobil Servis ve ERP Sistemi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let staff: any[] = [];
  try {
    staff = await getStaff();
  } catch (err) {
    console.error("Layout: Could not load staff, DB may be down.");
  }
  const adminUser = staff.find((u: any) => u.role === 'ADMIN') || staff[0] || null;
  return (
    <html lang="tr" suppressHydrationWarning className="antialiased font-sans">
      <body className="bg-background text-foreground antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
                <Toaster position="bottom-right" expand={false} duration={2500} />
              </ShortageProvider>
            </SupplierOrderProvider>
          </UIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
