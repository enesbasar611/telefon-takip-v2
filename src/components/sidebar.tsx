"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AISearchModal } from "@/components/basarai/ai-search-modal";
import { AIUpdateModal } from "@/components/basarai/ai-update-modal";
import { AIAnalyzeModal } from "@/components/basarai/ai-analyze-modal";
import { useAura } from "@/lib/context/aura-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wrench,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Smartphone,
  Truck,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Sparkles,
  Search,
  RefreshCcw,
  Activity,
  ListTree
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BorderBeam } from "@/components/ui/border-beam";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Anasayfa",
    href: "/dashboard",
  },
  {
    icon: Wrench,
    label: "Servis Yönetimi",
    href: "/servis",
    subItems: [
      { label: "Servis Merkezi", href: "/servis" },
      { label: "Servis Listesi", href: "/servis/liste" },
      { label: "Yeni Cihaz Girişi", href: "/servis/yeni" },
    ]
  },
  {
    icon: Package,
    label: "Envanter",
    href: "/stok",
    subItems: [
      { label: "Stok Listesi", href: "/stok" },
      { label: "Hareket Analizi", href: "/stok/hareketler" },
      { label: "Kategoriler", href: "/stok/kategoriler" },
      { label: "AI Önerileri", href: "/stok/stok-ai" },
    ]
  },
  {
    icon: ShoppingCart,
    label: "POS & Kasa",
    href: "/satis",
    subItems: [
      { label: "Hızlı Satış", href: "/satis" },
      { label: "Satış Arşivi", href: "/satis/gecmis" },
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
    ]
  },
  { icon: CreditCard, label: "Veresiye", href: "/veresiye" },
  { icon: Smartphone, label: "Cihaz Merkezi", href: "/cihaz-listesi" },
  { icon: Truck, label: "Tedarikçiler", href: "/tedarikciler" },
  { icon: BarChart3, label: "İstatistikler", href: "/raporlar" },
  { icon: UserCog, label: "Ekip", href: "/personel" },
  { icon: Bell, label: "Bildirimler", href: "/bildirimler" },
  { icon: Settings, label: "Ayarlar", href: "/ayarlar" },
];

export function Sidebar({ className, user, onNavigate }: { className?: string; user?: { name: string; role: string }, onNavigate?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { MapsWithAura } = useAura();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [aiUpdateOpen, setAiUpdateOpen] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const [isAiHovered, setIsAiHovered] = useState(false);
  const [localActivePath, setLocalActivePath] = useState(pathname);

  useEffect(() => {
    setLocalActivePath(pathname);
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

  const handleNavigation = (href: string) => {
    setLocalActivePath(href);
    MapsWithAura(href);
    onNavigate?.();
  };

  return (
    <div className={cn("flex h-screen w-64 flex-col bg-background border-r border-border/50 z-20 overflow-hidden", className)}>
      {/* Logo / Brand */}
      <div className="flex h-16 items-center px-6 border-b border-border/50 flex-shrink-0">
        <button onClick={() => handleNavigation("/")} className="flex items-center gap-3 group outline-none">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
            <Zap className="h-4 w-4 text-white fill-white" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className=" text-sm text-foreground leading-tight truncate max-w-[160px]">
              Başar <span className="text-primary">Teknik</span>
            </span>
            <span className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5">Yönetim Paneli v2</span>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {/* Section Label */}
          <p className="text-[12px]  text-muted-foreground/60 uppercase tracking-widest px-3 mb-3">Menü</p>

          {menuItems.filter(item => {
            if (session?.user?.role === "ADMIN") return true;
            if (item.label === "Servis Yönetimi" && session?.user?.canService === false) return false;
            if (item.label === "Envanter" && session?.user?.canStock === false) return false;
            if (item.label === "POS & Kasa" && session?.user?.canSell === false) return false;
            if (item.label === "Veresiye" && session?.user?.canSell === false) return false;
            if (item.label === "Müşteri CRM" && session?.user?.canSell === false && session?.user?.canService === false) return false;
            if (item.label === "İstatistikler" && session?.user?.canFinance === false) return false;
            if (item.label === "Ekip" && session?.user?.role !== "ADMIN") return false;
            if (item.label === "Ayarlar" && session?.user?.role !== "ADMIN") return false;
            return true;
          }).map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.label);
            const isActive = localActivePath === item.href || (item.href !== "/" && localActivePath?.startsWith(item.href));

            return (
              <div key={item.label}>
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-xl px-3 py-3 text-[15.5px] font-medium transition-all duration-150 outline-none group",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground")}
                      strokeWidth={1.5}
                    />
                    <span className="flex-1 text-left leading-none">{item.label}</span>
                    {isOpen
                      ? <ChevronDown className="h-3 w-3 opacity-40 flex-shrink-0" strokeWidth={1.5} />
                      : <ChevronRight className="h-3 w-3 opacity-40 flex-shrink-0" strokeWidth={1.5} />
                    }
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-xl px-3 py-3 text-[15.5px] font-medium transition-all duration-150 outline-none group",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground")}
                      strokeWidth={1.5}
                    />
                    <span className="flex-1 text-left leading-none">{item.label}</span>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-0.5 ml-4 mt-0.5 mb-1 border-l border-border/40 pl-3 py-0.5">
                    {item.subItems!.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => handleNavigation(sub.href)}
                        className={cn(
                          "px-3 py-2.5 text-left text-[13.5px]  rounded-lg transition-all duration-150 outline-none leading-none",
                          localActivePath === sub.href
                            ? "text-primary bg-primary/8 font-medium "
                            : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Başar AI Command Center */}
      <div className="px-4 pb-4">
        <div
          className="relative overflow-hidden rounded-2xl border border-border/50 group"
          onMouseEnter={() => setIsAiHovered(true)}
          onMouseLeave={() => setIsAiHovered(false)}
        >
          <BorderBeam isActive={isAiHovered} duration={15} />
          <div className="relative z-10 bg-card rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Başar AI</span>
            </div>
            <div className="grid grid-cols-3">
              <button
                onClick={() => setAiAnalyzeOpen(true)}
                className="flex flex-col items-center justify-center py-3 gap-1.5 hover:bg-violet-500/8 transition-colors group cursor-pointer outline-none"
              >
                <Activity className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[10px]  text-muted-foreground/40 group-hover:text-muted-foreground uppercase tracking-wide transition-colors">Analiz</span>
              </button>
              <button
                onClick={() => setAiUpdateOpen(true)}
                className="flex flex-col items-center justify-center py-3 gap-1.5 hover:bg-violet-500/8 transition-colors group cursor-pointer outline-none border-x border-border/50"
              >
                <RefreshCcw className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[10px]  text-muted-foreground/40 group-hover:text-muted-foreground uppercase tracking-wide transition-colors">Güncelle</span>
              </button>
              <button
                onClick={() => setAiSearchOpen(true)}
                className="flex flex-col items-center justify-center py-3 gap-1.5 hover:bg-violet-500/8 transition-colors group cursor-pointer outline-none"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[10px]  text-muted-foreground/40 group-hover:text-muted-foreground uppercase tracking-wide transition-colors">Ara</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AISearchModal open={aiSearchOpen} onOpenChange={setAiSearchOpen} />
      <AIUpdateModal open={aiUpdateOpen} onOpenChange={setAiUpdateOpen} />
      <AIAnalyzeModal open={aiAnalyzeOpen} onOpenChange={setAiAnalyzeOpen} />

      {/* User Profile */}
      <div className="px-4 pb-4 border-t border-border/50 pt-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/40 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs text-primary border border-primary/20 flex-shrink-0">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-[14px]  text-foreground truncate leading-tight">{user?.name || "Yönetici"}</span>
            <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {user?.role === 'ADMIN' ? 'Sistem Yöneticisi' : user?.role === 'TECHNICIAN' ? 'Teknisyen' : 'Personel'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



