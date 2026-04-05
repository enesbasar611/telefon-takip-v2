"use client";

import { LayoutDashboard, Wrench, Smartphone, Search, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { icon: LayoutDashboard, label: "Ana Sayfa", href: "/dashboard" },
    { icon: Search, label: "Arama", href: "#search" }, // Special trigger or separate route
    { icon: Wrench, label: "Servis", href: "/servis/liste" },
    { icon: Smartphone, label: "Cihazlar", href: "/cihaz-listesi" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-around px-2 z-50">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full transition-all",
              isActive ? "text-blue-500" : "text-slate-500"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[8px] ">{item.label}</span>
            {isActive && <div className="h-1 w-1 rounded-full bg-blue-500" />}
          </Link>
        );
      })}

      <Link href="/servis/yeni" className="absolute -top-6 left-1/2 -translate-x-1/2">
        <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center border-4 border-[#020617] text-white">
          <PlusCircle className="h-6 w-6" />
        </div>
      </Link>
    </div>
  );
}



