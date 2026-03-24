"use client";

import { useState } from "react";
import { Search, PlusCircle, ShoppingCart, User, Bell, Command, Settings2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function Navbar() {
  const [showFinance, setShowFinance] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0e1116]/80 backdrop-blur-xl px-8 sticky top-0 z-10 shadow-2xl">
      <div className="flex w-1/3 items-center gap-6">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform group-focus-within:translate-x-1">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-amber-500" />
          </div>
          <Input
            type="search"
            placeholder="Müşteri, cihaz veya IMEI ara..."
            className="w-full bg-white/[0.03] border-white/5 pl-10 h-10 rounded-xl text-xs font-bold text-white placeholder:text-gray-700 focus:ring-1 focus:ring-amber-500/30 focus:bg-white/[0.05] transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
             <div className="h-5 w-5 rounded border border-white/10 flex items-center justify-center bg-white/[0.02] text-[10px] text-gray-700 font-black">
                ⌘K
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 pr-6 border-r border-white/5">
            <CreateServiceModal
            trigger={
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-xs font-black text-white bg-white/[0.03] border border-white/5 rounded-xl px-4 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20 shadow-xl transition-all group">
                <PlusCircle className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-widest">YENİ SERVİS</span>
                </Button>
            }
            />
            <POSDrawer />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFinance(!showFinance)}
            className="h-10 w-10 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 hover:text-amber-500 transition-all"
          >
            {showFinance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </Button>

          <ShortageList />
          <ModeToggle />

          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 hover:text-amber-500 hover:bg-amber-500/5 transition-all">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-amber-sm" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-white/[0.03] border border-white/5 hover:border-amber-500/20 shadow-2xl overflow-hidden group">
                <div className="h-full w-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white p-2 min-w-[200px] shadow-2xl">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 p-3">Kullanıcı Hesabı</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="p-3 text-xs font-bold rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center group">
                 <User className="h-4 w-4 text-amber-500" /> Profil Detayları
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-3 text-xs font-bold rounded-lg cursor-pointer focus:bg-white/5 flex gap-3 items-center group">
                <Link href="/ayarlar" className="w-full h-full flex items-center gap-3">
                    <Settings2 className="h-4 w-4 text-amber-500" /> Sistem Ayarları
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="p-3 text-xs font-bold rounded-lg cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 flex gap-3 items-center">
                 Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
