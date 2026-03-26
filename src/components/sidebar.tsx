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
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Komuta Merkezi",
    href: "/dashboard",
  },
  {
    icon: Wrench,
    label: "Servis Merkezi",
    href: "/servis",
    subItems: [
      { label: "Aktif Kayıtlar", href: "/servis/liste" },
      { label: "Yeni Cihaz Girişi", href: "/servis/yeni" },
      { label: "Teslimatlar", href: "/servis/teslimatlar" },
      { label: "Garanti Takibi", href: "/servis/iade" },
    ]
  },
  {
    icon: Package,
    label: "Envanter",
    href: "/stok",
    subItems: [
      { label: "Stok Listesi", href: "/stok" },
      { label: "Hareket Analizi", href: "/stok/hareketler" },
      { label: "Kritik Seviyeler", href: "/stok/kritik" },
      { label: "Kategoriler", href: "/stok/kategoriler" },
    ]
  },
  {
    icon: ShoppingCart,
    label: "POS & Kasa",
    href: "/satis",
    subItems: [
      { label: "Hızlı Satış", href: "/satis" },
      { label: "Satış Arşivi", href: "/satis/gecmis" },
      { label: "Tahsilat İşlemleri", href: "/satis/tahsilatlar" },
      { label: "Kasa Raporu", href: "/satis/kasa" },
    ]
  },
  {
    icon: Users,
    label: "Müşteri CRM",
    href: "/musteriler",
    subItems: [
      { label: "Müşteri Portföyü", href: "/musteriler" },
      { label: "Yeni Tanımlama", href: "/musteriler/yeni" },
      { label: "Analiz & Notlar", href: "/musteriler/notlar" },
    ]
  },
  { icon: CreditCard, label: "Veresiye", href: "/veresiye" },
  { icon: Smartphone, label: "Cihaz Merkezi", href: "/cihaz-listesi" },
  { icon: Truck, label: "Tedarikçiler", href: "/tedarikciler" },
  { icon: Banknote, label: "Finansal Akış", href: "/finans" },
  { icon: BarChart3, label: "İstatistikler", href: "/raporlar" },
  { icon: UserCog, label: "Ekip", href: "/personel" },
  { icon: Bell, label: "Bildirim Merkezi", href: "/bildirimler" },
  { icon: Settings, label: "Sistem Ayarları", href: "/ayarlar" },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    const activeMenu = menuItems.find(item =>
      item.subItems?.some(sub => sub.href === pathname) || (item.href !== "/dashboard" && pathname.startsWith(item.href))
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
    <div className={cn("flex h-screen w-64 flex-col bg-card border-r border-border shadow-none z-20 overflow-hidden", className)}>
      <div className="flex h-20 items-center px-6 border-b border-border bg-muted/20 flex-shrink-0">
        <Link href="/" className="flex flex-col group">
          <div className="flex items-center gap-2 font-extrabold text-xl text-foreground">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all ">
                <Zap className="h-5 w-5 text-primary fill-primary/20" />
            </div>
            <span className="">BAŞAR <span className="text-primary">TEKNİK</span></span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground mt-1 ml-11">
            Yönetim Paneli V2.0
          </span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1.5">
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
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all group border border-transparent",
                      isActive && !isOpen
                        ? "bg-primary/5 text-primary border-primary/10 "
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5", isActive && !isOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-1 ml-6 mt-1 mb-2 border-l border-border pl-4">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={cn(
                          "px-4 py-2 text-xs font-medium rounded-lg transition-all  ",
                          pathname === sub.href
                            ? "text-primary bg-primary/5 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
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

      <div className="p-4 border-t border-border bg-muted/10">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-extrabold text-sm text-primary border border-primary/20">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">John Doe</span>
            <span className="text-[10px] font-medium text-muted-foreground">Baş Teknisyen</span>
          </div>
          <div className="ml-auto h-2 w-2 rounded-full bg-secondary animate-pulse" />
        </div>
      </div>
    </div>
  );
}
