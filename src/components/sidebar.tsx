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
    label: "Panel",
    href: "/",
    subItems: [
      { label: "Canlı Kontrol", href: "/" },
      { label: "Günlük Özet", href: "/dashboard/ozet" },
      { label: "Kritik Uyarılar", href: "/dashboard/uyarilar" },
    ]
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
  { icon: Smartphone, label: "2. El Takas", href: "/ikinci-el" },
  { icon: Truck, label: "Tedarikçiler", href: "/tedarikciler" },
  { icon: Banknote, label: "Finansal Akış", href: "/finans" },
  { icon: BarChart3, label: "İstatistikler", href: "/raporlar" },
  { icon: UserCog, label: "Ekip", href: "/personel" },
  { icon: Bell, label: "Bildirim Merkezi", href: "/bildirimler" },
  { icon: Settings, label: "Sistem Ayarları", href: "/ayarlar" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
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
    <div className="flex h-screen w-64 flex-col bg-[#0a0a0b] border-r border-white/5 shadow-2xl z-20 overflow-hidden">
      <div className="flex h-20 items-center px-6 border-b border-white/5 bg-white/[0.01] flex-shrink-0">
        <Link href="/" className="flex flex-col group">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-white">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all shadow-cyan-sm">
                <Zap className="h-5 w-5 text-cyan-500" />
            </div>
            <span>BAŞAR <span className="text-cyan-500">TEKNİK</span></span>
          </div>
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1 ml-10">
            Command Center V2.0
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
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all group whisper-border border-transparent",
                      isActive && !isOpen
                        ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/20 shadow-cyan-sm"
                        : "text-gray-500 hover:bg-white/[0.03] hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && !isOpen ? "text-cyan-400" : "text-gray-600 group-hover:text-white")} />
                    <span className="flex-1 text-left uppercase tracking-widest">{item.label}</span>
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whisper-border",
                      isActive
                        ? "bg-cyan-500 text-black shadow-cyan-strong border-cyan-400"
                        : "text-gray-500 hover:bg-white/[0.03] hover:text-white border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-black" : "text-gray-600")} />
                    <span className="flex-1 uppercase tracking-widest">{item.label}</span>
                  </Link>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-1 ml-6 mt-1 mb-2 border-l border-white/5 pl-4">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={cn(
                          "px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-tighter",
                          pathname === sub.href
                            ? "text-cyan-400 bg-cyan-400/5"
                            : "text-gray-600 hover:text-white hover:bg-white/5"
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

      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 rounded-2xl whisper-border border-white/5 bg-white/[0.02] p-3 shadow-xl">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center font-black text-sm text-cyan-500 border border-cyan-500/20">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-black text-white truncate uppercase tracking-tighter">John Doe</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Baş Teknisyen</span>
          </div>
          <div className="ml-auto h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-cyan-sm" />
        </div>
      </div>
    </div>
  );
}
