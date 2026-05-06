"use client";

import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { PlusCircle, User, Eye, EyeOff, LogOut, Landmark, MonitorSmartphone, Search, Settings2, Moon, Sun, LayoutDashboard } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import Link from "next/link";
import { ShortageList } from "@/components/navbar/shortage-list";
import { POSDrawer } from "@/components/navbar/pos-drawer";
import { CurrencyDisplay } from "@/components/navbar/currency-display";
import { CurrencyTicker } from "@/components/navbar/currency-ticker";
import { GlobalSearch } from "@/components/navbar/global-search";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { useUI } from "@/lib/context/ui-context";
import { NotificationDropdown } from "@/components/navbar/notification-dropdown";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";

export function Navbar({ shop }: { shop?: any }) {
  const { isFinancialVisible, toggleFinancialVisibility, isLayoutEditing, toggleLayoutEditing } = useUI();
  const { setTheme } = useTheme();
  const router = useRouter();

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8 sticky top-0 z-20 shadow-none gap-4">
        <div className="flex items-center gap-4 shrink-0">
          {/* Mobile: Hamburger & Branding */}
          <div className="flex items-center gap-3">
            <MobileSidebar />
            <Link href="/" className="md:hidden hover:opacity-80 transition-opacity">
              <span className="text-[14px] font-bold tracking-tight text-primary uppercase">{shop?.name || "BAŞAR TEKNİK"}</span>
            </Link>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 lg:gap-3 justify-end shrink-0">
          {/* Quick Shortcut: Cihaz Merkezi - Strictly Mobile Only */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="md:hidden h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shrink-0"
          >
            <Link href="/cihaz-listesi">
              <MonitorSmartphone className="h-5 w-5" />
            </Link>
          </Button>

          {/* Action Containers - Only visible on Desktop */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/40">
            <CreateServiceModal
              shop={shop}
              trigger={
                <Button variant="ghost" size="sm" className="flex gap-2 text-sm font-semibold text-foreground bg-muted/40 border border-border rounded-xl px-4 hover:bg-primary/10 hover:text-primary hover:border-primary/20 shadow-none transition-all group">
                  <PlusCircle className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="">Yeni Servis</span>
                </Button>
              }
            />
            <CreateTransactionModal
              trigger={
                <Button variant="ghost" size="sm" className="flex gap-2 text-sm font-semibold text-foreground bg-muted/40 border border-border rounded-xl px-4 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20 shadow-none transition-all group">
                  <Landmark className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className=" whitespace-nowrap">Gelir / Gider</span>
                </Button>
              }
            />
            <POSDrawer />
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-3">
              <div className="hidden xl:flex">
                <CurrencyDisplay />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFinancialVisibility}
                className="h-10 w-10 rounded-xl bg-muted/40 border border-border text-muted-foreground hover:text-primary transition-all"
              >
                {isFinancialVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>



              <ShortageList />
              <ModeToggle />
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              {/* Search Button - Icon only, moved here */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
                className="h-10 w-10 rounded-xl bg-muted/20 md:bg-muted/40 border border-border/40 text-muted-foreground hover:text-primary transition-all shrink-0"
              >
                <Search className="h-5 w-5" />
              </Button>

              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-muted/20 md:bg-muted/40 border border-border/40 hover:border-primary/20 shadow-none overflow-hidden group shrink-0">
                    <div className="h-full w-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <User className="h-5 w-5" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground p-2 min-w-[200px] shadow-xl rounded-2xl">
                  <DropdownMenuLabel className="text-xs  text-muted-foreground p-3">Kullanıcı Hesabı</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="p-3 text-sm rounded-xl cursor-pointer focus:bg-muted flex gap-3 items-center group">
                    <Link href="/profil" className="flex items-center gap-3 w-full">
                      <User className="h-4 w-4 text-primary" /> Profil Detayları
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="p-3 text-sm rounded-xl cursor-pointer focus:bg-muted flex gap-3 items-center group">
                    <Link href="/ayarlar" className="flex items-center gap-3 w-full">
                      <Settings2 className="h-4 w-4 text-primary" /> Sistem Ayarları
                    </Link>
                  </DropdownMenuItem>

                  {/* Theme Selection - Mobil Öncelikli ama genel eklendi */}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-3 py-2 font-black tracking-widest">Tema Seçimi</DropdownMenuLabel>
                  <div className="grid grid-cols-3 gap-1 p-1">
                    <button onClick={() => setTheme("light")} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors border border-transparent active:border-primary/20">
                      <Sun className="h-4 w-4 text-orange-500" />
                      <span className="text-[10px] font-bold">Açık</span>
                    </button>
                    <button onClick={() => setTheme("dark")} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors border border-transparent active:border-primary/20">
                      <Moon className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-bold">Koyu</span>
                    </button>
                    <button onClick={() => setTheme("system")} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors border border-transparent active:border-primary/20">
                      <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-bold">Sistem</span>
                    </button>
                  </div>

                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="p-3 text-sm  rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex gap-3 items-center"
                  >
                    <LogOut className="h-4 w-4" /> Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-background/60 backdrop-blur-md border-b border-border/50 overflow-x-auto no-scrollbar scroll-smooth">
        <CurrencyDisplay mobile />
      </div>
    </>
  );
}
