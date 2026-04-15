"use client";

import { LayoutDashboard, Wrench, Users, User, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { icon: LayoutDashboard, label: "Ana Sayfa", href: "/dashboard" },
    { icon: Wrench, label: "Servisler", href: "/servis" },
    { icon: Users, label: "Müşteriler", href: "/musteriler" },
    { icon: User, label: "Profil", href: "/profil" },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
      <div className="relative h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-around px-4">
        {items.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-12 h-12 transition-all relative select-none touch-none",
                isActive ? "text-primary scale-110" : "text-muted-foreground/60 active:scale-95"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
              <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}

        {/* Central Plus Button Spacer */}
        <div className="w-12" />

        {items.slice(2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-12 h-12 transition-all relative select-none touch-none",
                isActive ? "text-primary scale-110" : "text-muted-foreground/60 active:scale-95"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
              <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}

        {/* Central Floating Action Button */}
        <Link
          href="/servis/yeni"
          className="absolute -top-6 left-1/2 -translate-x-1/2 transition-transform active:scale-90 select-none touch-none"
        >
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center border-8 border-white dark:border-zinc-950 text-white shadow-xl shadow-primary/40 group">
            <Plus className="h-8 w-8 stroke-[3px] group-active:rotate-90 transition-transform duration-300" />
          </div>
        </Link>
      </div>
    </div>
  );
}



