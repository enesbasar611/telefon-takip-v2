import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen bg-[#0a0a0b]">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Navbar />
              <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-[1600px] mx-auto w-full">
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Toaster position="top-right" expand={false} richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
