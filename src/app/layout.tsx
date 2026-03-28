import type { Metadata } from "next";
import { GeistMono } from 'geist/font/mono';
import { Outfit } from 'next/font/google';
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UIProvider } from "@/lib/context/ui-context";

const fontOutfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

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
    <html lang="tr" suppressHydrationWarning className={`${fontOutfit.variable} ${GeistMono.variable}`}>
      <body className="bg-background text-foreground antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UIProvider>
            <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
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
