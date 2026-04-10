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
  Calendar,
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
import { isModuleEnabled, getIndustryConfig } from "@/lib/industry-utils";
import { Shop } from "@prisma/client";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Anasayfa",
    href: "/dashboard",
  },
  {
    icon: Calendar,
    label: "Randevu Merkezi",
    href: "/ajanda",
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
  { icon: BarChart3, label: "İstatistikler", href: "/raporlar", module: "FINANCE" },
  { icon: UserCog, label: "Ekip", href: "/personel" },
  { icon: Bell, label: "Bildirimler", href: "/bildirimler" },
  { icon: Settings, label: "Ayarlar", href: "/ayarlar" },
];

export function Sidebar({ className, user, shop, onNavigate }: {
  className?: string;
  user?: { name: string; role: string };
  shop?: any; // Using any due to pending prisma generate
  onNavigate?: () => void
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { MapsWithAura } = useAura();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [aiUpdateOpen, setAiUpdateOpen] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const [isAiHovered, setIsAiHovered] = useState(false);
  const [localActivePath, setLocalActivePath] = useState(pathname);
  const [whatsappStatus, setWhatsappStatus] = useState<string>("CONNECTED");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { getWhatsAppStatusAction } = await import("@/lib/actions/data-management-actions");
        const res = await getWhatsAppStatusAction();
        setWhatsappStatus(res.status);
      } catch (error) {
        console.error("WhatsApp status check failed", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

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

  // Logo always stable - only industry label changes below
  const industryConfig = getIndustryConfig(shop?.industry);
  const firstName = "BAŞAR";
  const secondName = "TEKNİK";

  return (
    <div className={cn("flex h-screen w-64 flex-col bg-background border-r border-border/50 z-20 overflow-hidden", className)}>
      <div className="flex h-28 items-center px-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-br from-primary/10 via-background to-transparent relative overflow-hidden group">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />

        <button onClick={() => handleNavigation("/")} className="flex items-center gap-4 group outline-none relative z-10 w-full overflow-hidden">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-black dark:bg-[#0A0A0A] border border-border flex items-center justify-center shadow-2xl group-hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            <Zap className="h-6 w-6 text-primary fill-primary animate-pulse shadow-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" strokeWidth={1} />
          </div>
          <div className="flex flex-col flex-1 min-w-0 items-start text-left">
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase truncate group-hover:text-primary transition-colors duration-300">
              {firstName}<span className="text-primary not-italic font-extrabold ml-1">{secondName}</span>
            </h1>
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1.5 leading-none truncate">
              {industryConfig?.name || "YÖNETİM PANELİ"}
            </span>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {/* Section Label */}
          <p className="text-[12px]  text-muted-foreground/60 uppercase tracking-widest px-3 mb-3">Menü</p>

          {menuItems.filter(item => {
            if (item.label === "Ayarlar" && session?.user?.role !== "ADMIN") return false;

            // SERVICE module: Servis, Cihaz Merkezi, Randevu
            if (item.label === "Servis Yönetimi" && !isModuleEnabled(shop, "SERVICE")) return false;
            if (item.label === "Cihaz Merkezi" && !isModuleEnabled(shop, "SERVICE")) return false;
            if (item.label === "Randevu Merkezi" && !isModuleEnabled(shop, "SERVICE")) return false;

            // STOCK module
            if (item.label === "Envanter" && !isModuleEnabled(shop, "STOCK")) return false;

            // SALE module
            if (item.label === "POS & Kasa" && !isModuleEnabled(shop, "SALE")) return false;

            // FINANCE module
            if (item.label === "İstatistikler" && !isModuleEnabled(shop, "FINANCE")) return false;

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
                    {item.label === "Ayarlar" && whatsappStatus === "DISCONNECTED" && (
                      <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)] flex-shrink-0" />
                    )}
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
        <button
          onClick={() => handleNavigation("/profil")}
          className="w-full flex items-center gap-3 rounded-xl bg-muted/30 border border-border/40 px-3 py-2.5 outline-none hover:bg-muted/50 transition-colors group cursor-pointer"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs text-primary border border-primary/20 flex-shrink-0 overflow-hidden group-hover:border-primary/40 transition-colors">
            {session?.user?.image ? (
              <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              (session?.user?.name || "A").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col overflow-hidden flex-1 min-w-0 text-left">
            <span className="text-[14px] text-foreground truncate leading-tight group-hover:text-primary transition-colors">{session?.user?.name || "Yönetici"}</span>
            <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {session?.user?.role === 'ADMIN' ? 'Sistem Yöneticisi' : session?.user?.role === 'TECHNICIAN' ? 'Teknisyen' : 'Personel'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}



