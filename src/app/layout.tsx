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
import { NextAuthProvider } from "@/components/providers/session-provider";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";

export const metadata: Metadata = {
  title: "Takip V2 - Mobil Servis & ERP",
  description: "Profesyonel SaaS Mobil Servis ve ERP Sistemi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className="antialiased">
      <body className="bg-background text-foreground antialiased flex min-h-screen flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <ProgressBarProvider>
              {children}
            </ProgressBarProvider>
          </NextAuthProvider>
          <Toaster position="bottom-right" expand={false} duration={2500} />
        </ThemeProvider>
      </body>
    </html>
  );
}



