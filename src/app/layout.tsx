import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UIProvider } from "@/lib/context/ui-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Takip V2 - Mobil Servis & ERP",
  description: "Profesyonel SaaS Mobil Servis ve ERP Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={GeistSans.className}>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UIProvider>
            <div className="flex min-h-screen bg-background">
              <Sidebar className="hidden lg:flex" />
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
            <Toaster position="top-right" expand={false} richColors />
          </UIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
