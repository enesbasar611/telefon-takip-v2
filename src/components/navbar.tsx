"use client";

import { PlusCircle, User, Eye, EyeOff, LogOut, Landmark, MonitorSmartphone, Search, Settings2 } from "lucide-react";
import { useAura } from "@/lib/context/aura-context";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
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
import { GlobalSearch } from "@/components/navbar/global-search";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { useUI } from "@/lib/context/ui-context";
import { NotificationDropdown } from "@/components/navbar/notification-dropdown";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";

export function Navbar({ shop }: { shop?: any }) {
  const { isFinancialVisible, toggleFinancialVisibility } = useUI();
  const { MapsWithAura } = useAura();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8 sticky top-0 z-10 shadow-none">
      <div className="flex items-center gap-4 lg:w-1/3">
        {/* Desktop: Thinner Logo - Hidden on large as it exists in Sidebar */}
        <Link href="/" className="hidden items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-light tracking-[0.2em] whitespace-nowrap">BAŞAR <span className="font-bold text-primary">TEKNİK</span></span>
        </Link>

        {/* Mobile: Hamburger & Thinner Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <MobileSidebar />
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <span className="text-[14px] font-light tracking-[0.1em] whitespace-nowrap">BAŞAR <span className="font-semibold text-primary">TEKNİK</span></span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3 lg:w-1/3 justify-end">
        {/* Quick Shortcut: Cihaz Merkezi - Hidden on desktop as requested */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => MapsWithAura("/cihaz-listesi")}
          className="hidden h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
        >
          <MonitorSmartphone className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-1.5 lg:gap-3 p-1 bg-muted/40 rounded-2xl border border-border/40">
          <div className="hidden md:flex items-center gap-1">
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
          </div>
          <POSDrawer />
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFinancialVisibility}
              className="h-10 w-10 rounded-xl bg-muted/40 border border-border text-muted-foreground hover:text-primary transition-all"
            >
              {isFinancialVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>

            <CurrencyDisplay />
            <ShortageList />
            <ModeToggle />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
            className="h-10 w-10 rounded-xl bg-muted/40 border border-border text-muted-foreground hover:text-primary transition-all"
          >
            <Search className="h-5 w-5" />
          </Button>

          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-muted/40 border border-border hover:border-primary/20 shadow-none overflow-hidden group">
                <div className="h-full w-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground p-2 min-w-[200px] shadow-xl rounded-2xl">
              <DropdownMenuLabel className="text-xs  text-muted-foreground p-3">Kullanıcı Hesabı</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => MapsWithAura("/profil")} className="p-3 text-sm rounded-xl cursor-pointer focus:bg-muted flex gap-3 items-center group">
                <User className="h-4 w-4 text-primary" /> Profil Detayları
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => MapsWithAura("/ayarlar")} className="p-3 text-sm rounded-xl cursor-pointer focus:bg-muted flex gap-3 items-center group">
                <Settings2 className="h-4 w-4 text-primary" /> Sistem Ayarları
              </DropdownMenuItem>
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
    </header>
  );
}
