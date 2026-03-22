"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Genel Bakış",
    href: "/",
    subItems: [
      { label: "Genel Bakış", href: "/" },
      { label: "Günlük Özet", href: "/dashboard/ozet" },
      { label: "Kritik Uyarılar", href: "/dashboard/uyarilar" },
    ]
  },
  {
    icon: Wrench,
    label: "Servis Yönetimi",
    href: "/servis",
    subItems: [
      { label: "Servis Listesi", href: "/servis" },
      { label: "Yeni Kayıt", href: "/servis/yeni" },
      { label: "Teslimatlar", href: "/servis/teslimatlar" },
      { label: "Garanti/İade", href: "/servis/iade" },
    ]
  },
  {
    icon: Package,
    label: "Stok ve Ürünler",
    href: "/stok",
    subItems: [
      { label: "Ürün Listesi", href: "/stok" },
      { label: "Stok Hareketleri", href: "/stok/hareketler" },
      { label: "Kritik Stoklar", href: "/stok/kritik" },
      { label: "Kategoriler", href: "/stok/kategoriler" },
    ]
  },
  {
    icon: ShoppingCart,
    label: "Satış ve Kasa",
    href: "/satis",
    subItems: [
      { label: "Hızlı Satış (POS)", href: "/satis" },
      { label: "Satış Geçmişi", href: "/satis/gecmis" },
      { label: "Tahsilatlar", href: "/satis/tahsilatlar" },
      { label: "Kasa Hareketleri", href: "/satis/kasa" },
    ]
  },
  {
    icon: Users,
    label: "Müşteriler",
    href: "/musteriler",
    subItems: [
      { label: "Müşteri Listesi", href: "/musteriler" },
      { label: "Yeni Müşteri", href: "/musteriler/yeni" },
      { label: "Etiketler & Notlar", href: "/musteriler/notlar" },
    ]
  },
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
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    // Auto-open menu if current path is a subitem
    const activeMenu = menuItems.find(item =>
      item.subItems?.some(sub => sub.href === pathname) || (item.href !== "/" && pathname.startsWith(item.href))
    );
    if (activeMenu && !openMenus.includes(activeMenu.label)) {
      setOpenMenus(prev => [...prev, activeMenu.label]);
    }
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card shadow-lg z-20 overflow-hidden">
      <div className="flex h-16 items-center border-b px-6 bg-primary/5 flex-shrink-0">
        <Link href="/" className="flex flex-col">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Smartphone className="h-6 w-6 text-primary" />
            <span>BAŞAR TEKNİK</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] -mt-1 ml-8">
            Powered by Webfone
          </span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.label);
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <div key={item.label} className="flex flex-col gap-1">
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group",
                      isActive && !isOpen
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-1 ml-9 mt-1 border-l pl-2">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          pathname === sub.href
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4 bg-primary/5 flex-shrink-0">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
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
