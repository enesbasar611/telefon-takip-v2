"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Smartphone,
  Truck,
  Banknote,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { icon: LayoutDashboard, label: "Genel Bakış", href: "/" },
  { icon: Wrench, label: "Servis Yönetimi", href: "/servis" },
  { icon: Package, label: "Stok ve Ürünler", href: "/stok" },
  { icon: ShoppingCart, label: "Satış ve Kasa", href: "/satis" },
  { icon: Users, label: "Müşteriler", href: "/musteriler" },
  { icon: CreditCard, label: "Veresiye", href: "/veresiye" },
  { icon: Smartphone, label: "İkinci El", href: "/ikinci-el" },
  { icon: Truck, label: "Tedarikçiler", href: "/tedarikciler" },
  { icon: Banknote, label: "Finans", href: "/finans" },
  { icon: BarChart3, label: "Raporlar", href: "/raporlar" },
  { icon: UserCog, label: "Personel", href: "/personel" },
  { icon: Bell, label: "Bildirimler", href: "/bildirimler" },
  { icon: Settings, label: "Ayarlar", href: "/ayarlar" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Smartphone className="h-6 w-6 text-primary" />
          <span>Takip V2</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">John Doe</span>
            <span className="text-xs text-muted-foreground">Yönetici</span>
          </div>
        </div>
      </div>
    </div>
  );
}
