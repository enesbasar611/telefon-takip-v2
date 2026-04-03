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
  Banknote,
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
  { icon: Bell, label: "Bildirim Merkezi", href: "/bildirimler" },
  { icon: Settings, label: "Sistem Ayarları", href: "/ayarlar" },
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
    <div className={cn("flex h-screen w-72 flex-col bg-background border-r border-border/40 shadow-none z-20 overflow-hidden font-sans", className)}>
      <div className="flex h-24 items-center px-8 border-b border-border/10 flex-shrink-0">
        <button onClick={() => handleNavigation("/")} className="flex items-center gap-3 group transition-transform hover:scale-105 outline-none">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
              {session?.user?.shopName ? (
                <>
                  {session.user.shopName.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="text-primary">{session.user.shopName.split(' ').slice(-1)}</span>
                </>
              ) : (
                <>Başar <span className="text-primary">Teknik</span></>
              )}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground mt-1">Yönetim Paneli V2.0</span>
          </div>
        </button>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1.5">
          {menuItems.filter(item => {
            if (session?.user?.role === "ADMIN") return true;

            if (item.label === "Servis Yönetimi" && session?.user?.canService === false) return false;
            if (item.label === "Envanter" && session?.user?.canStock === false) return false;
            if (item.label === "POS & Kasa" && session?.user?.canSell === false) return false;
            if (item.label === "Veresiye" && session?.user?.canSell === false) return false;
            if (item.label === "Müşteri CRM" && session?.user?.canSell === false && session?.user?.canService === false) return false;
            if (item.label === "İstatistikler" && session?.user?.canFinance === false) return false;
            if (item.label === "Ekip" && session?.user?.role !== "ADMIN") return false;
            if (item.label === "Sistem Ayarları" && session?.user?.role !== "ADMIN") return false;

            return true;
          }).map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.label);
            const isActive = localActivePath === item.href || (item.href !== "/" && localActivePath?.startsWith(item.href));

            return (
              <div key={item.label} className="relative">
                {isActive && (
                  <div className="absolute left-[-32px] top-1/2 -translate-y-1/2 h-8 w-1.5 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(var(--primary),0.3)]" />
                )}
                {hasSubItems ? (
                  <button
                    onClick={() => {
                      toggleMenu(item.label);
                    }}
                    className={cn(
                      "flex items-center gap-4 w-full rounded-xl px-4 py-3 text-[15px] font-medium transition-all group outline-none",
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
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex items-center gap-4 w-full rounded-xl px-4 py-3 text-[15px] font-medium transition-all group outline-none",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-1 ml-6 mt-1 mb-2 border-l border-border/40 pl-4 py-1">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => handleNavigation(sub.href)}
                        className={cn(
                          "px-4 py-2.5 text-left text-[13.5px] font-medium rounded-lg transition-all outline-none",
                          localActivePath === sub.href
                            ? "text-primary bg-primary/10 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
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

      {/* BAŞAR AI COMMAND CENTER */}
      <div className="px-6 pb-6 mt-4">
        <div
          className="relative overflow-hidden rounded-2xl border border-border/40 group"
          onMouseEnter={() => setIsAiHovered(true)}
          onMouseLeave={() => setIsAiHovered(false)}
        >
          <BorderBeam isActive={isAiHovered} duration={15} />

          <div className="relative z-10 bg-card rounded-2xl overflow-hidden">
            <div className="bg-[#18181A] px-4 py-3 border-b border-[#222222] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">BAŞAR AI</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#222222]">
              <button
                onClick={() => setAiAnalyzeOpen(true)}
                className="flex flex-col items-center justify-center py-3 gap-1.5 hover:bg-violet-500/10 transition-colors group cursor-pointer relative z-20 outline-none">
                <Activity className="h-4 w-4 text-slate-400 group-hover:text-violet-400" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Analiz</span>
              </button>
              <button
                onClick={() => setAiUpdateOpen(true)}
                className="flex flex-col items-center justify-center py-3 gap-1.5 hover:bg-violet-500/10 transition-colors group cursor-pointer relative z-20 outline-none">
                <RefreshCcw className="h-4 w-4 text-slate-400 group-hover:text-violet-400" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Güncelle</span>
              </button>
              <button
                onClick={() => setAiSearchOpen(true)}
                className="flex flex-col items-center justify-center py-3 gap-1.5 hover:bg-violet-500/10 transition-colors group cursor-pointer relative z-20 outline-none">
                <Search className="h-4 w-4 text-slate-400 group-hover:text-violet-400" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Ara</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AISearchModal open={aiSearchOpen} onOpenChange={setAiSearchOpen} />
      <AIUpdateModal open={aiUpdateOpen} onOpenChange={setAiUpdateOpen} />
      <AIAnalyzeModal open={aiAnalyzeOpen} onOpenChange={setAiAnalyzeOpen} />

      <div className="p-8 border-t border-border/40 bg-muted/20">
        <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 shadow-none">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary border border-primary/20">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] font-bold text-foreground truncate">{user?.name || "Yönetici"}</span>
            <span className="text-[11px] font-medium text-muted-foreground">{user?.role === 'ADMIN' ? 'Sistem Yöneticisi' : user?.role === 'TECHNICIAN' ? 'Teknisyen' : 'Personel'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
