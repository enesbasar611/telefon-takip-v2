"use client";

import { PlusCircle, User, Eye, EyeOff, LogOut } from "lucide-react";
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
import { Landmark } from "lucide-react";

export function Navbar({ shop }: { shop?: any }) {
  const { isFinancialVisible, toggleFinancialVisibility } = useUI();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8 sticky top-0 z-10 shadow-none">
      <div className="flex items-center gap-4 lg:w-1/3">
        <MobileSidebar />
        <div className="hidden lg:block w-full">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 pr-6 border-r border-border">
          <CreateServiceModal
            shop={shop}
            trigger={
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-sm font-semibold text-foreground bg-muted/40 border border-border rounded-xl px-4 hover:bg-primary/10 hover:text-primary hover:border-primary/20 shadow-none transition-all group">
                <PlusCircle className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="">Yeni Servis</span>
              </Button>
            }
          />
          <CreateTransactionModal
            trigger={
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-sm font-semibold text-foreground bg-muted/40 border border-border rounded-xl px-4 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20 shadow-none transition-all group">
                <Landmark className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className=" whitespace-nowrap">Gelir / Gider</span>
              </Button>
            }
          />
          <POSDrawer />
        </div>

        <div className="flex items-center gap-4">
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
              <DropdownMenuItem asChild className="p-3 text-sm rounded-xl cursor-pointer focus:bg-muted flex gap-3 items-center group">
                <Link href="/profil" className="w-full h-full flex items-center gap-3">
                  <User className="h-4 w-4 text-primary" /> Profil Detayları
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-3 text-sm  rounded-xl cursor-pointer focus:bg-muted flex gap-3 items-center group">
                <Link href="/ayarlar" className="w-full h-full flex items-center gap-3">
                  <Settings2 className="h-4 w-4 text-primary" /> Sistem Ayarları
                </Link>
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

// Fixed missing import for Settings2
import { Settings2 } from "lucide-react";



