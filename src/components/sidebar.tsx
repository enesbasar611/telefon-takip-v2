"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
      { label: "Servis Yönetimi", href: "/servis/liste" },
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
  {
    icon: Settings,
    label: "Sistem Ayarları",
    href: "/ayarlar",
    subItems: [
      { label: "Sistem Yapılandırması", href: "/ayarlar" },
      { label: "Kullanıcı Yetkileri", href: "/ayarlar/yetkiler" },
    ]
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
    <div className={cn("flex h-screen w-72 flex-col bg-background border-r border-border/40 shadow-none z-20 overflow-hidden font-sans", className)}>
      <div className="flex h-24 items-center px-8 border-b border-border/10 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground leading-none">Başar <span className="text-primary">Teknik</span></span>
            <span className="text-[11px] font-medium text-muted-foreground mt-1">Yönetim Paneli V2.0</span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.label);
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <div key={item.label} className="relative">
                {isActive && (
                  <div className="absolute left-[-32px] top-1/2 -translate-y-1/2 h-8 w-1.5 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(var(--primary),0.3)]" />
                )}
                {hasSubItems ? (
                  <button
                    onClick={() => {
                      toggleMenu(item.label);
                      if (item.href) router.push(item.href);
                    }}
                    className={cn(
                      "flex items-center gap-4 w-full rounded-xl px-4 py-3 text-[15px] font-medium transition-all group",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-50" /> : <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition-all group",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-1 ml-6 mt-1 mb-2 border-l border-border/40 pl-4 py-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={cn(
                          "px-4 py-2.5 text-[13.5px] font-medium rounded-lg transition-all",
                          pathname === sub.href
                            ? "text-primary bg-primary/10 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
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

      <div className="p-8 border-t border-border/40 bg-muted/20">
        <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 shadow-none">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary border border-primary/20">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] font-bold text-foreground truncate">John Doe</span>
            <span className="text-[11px] font-medium text-muted-foreground">Admin / Tekisyen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
