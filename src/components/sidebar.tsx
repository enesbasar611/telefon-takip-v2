"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AISearchModal } from "@/components/basarai/ai-search-modal";
import { AIUpdateModal } from "@/components/basarai/ai-update-modal";
import { AIAnalyzeModal } from "@/components/basarai/ai-analyze-modal";
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
  ListTree,
  Plus,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BorderBeam } from "@/components/ui/border-beam";
import { isModuleEnabled, getIndustryConfig } from "@/lib/industry-utils";
import { cn } from "@/lib/utils";
import { Shop } from "@prisma/client";

const getMenuItems = (shop: any, userRole?: string) => {
  const config = getIndustryConfig(shop?.industry);
  const labels = config.labels;

  return [
    {
      icon: LayoutDashboard,
      label: "Anasayfa",
      href: "/dashboard",
    },
    {
      icon: Calendar,
      label: "Randevu Merkezi",
      href: "/ajanda",
      module: "APPOINTMENT"
    },
    {
      icon: Wrench,
      label: labels.serviceTicket || "Servis Yönetimi",
      href: "/servis",
      module: "SERVICE",
      subItems: [
        { label: `Yeni ${labels.customerAsset} Girişi`, href: "/servis/yeni" },
        { label: `${labels.serviceTicket} Merkezi`, href: "/servis" },
        { label: `${labels.serviceTicket} Listesi`, href: "/servis/liste" },
      ]
    },
    {
      icon: Package,
      label: labels.inventory || "Envanter",
      href: "/stok",
      module: "STOCK",
      subItems: [
        { label: "Stok Listesi", href: "/stok" },
        { label: "Hareket Analizi", href: "/stok/hareketler" },
        { label: "Kategoriler", href: "/stok/kategoriler" },
        { label: "AI Önerileri", href: "/stok/stok-ai" },
        { label: "İade / Hasarlı", href: "/stok/iade" },
      ]
    },
    {
      icon: ShoppingCart,
      label: "POS & Kasa",
      href: "/satis",
      module: "SALE",
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
      module: "CRM",
      subItems: [
        { label: "Müşteri Portföyü", href: "/musteriler" },
        { label: "Yeni Tanımlama", href: "/musteriler/yeni" },
      ]
    },
    { icon: CreditCard, label: "Veresiye", href: "/veresiye", module: "DEBT" },
    { icon: Smartphone, label: (labels.customerAsset || "Cihaz") + " Merkezi", href: "/cihaz-listesi", module: "SERVICE" },
    { icon: Truck, label: "Tedarikçiler", href: "/tedarikciler", module: "SUPPLIER" },
    { icon: BarChart3, label: "İstatistikler", href: "/raporlar", module: "FINANCE" },
    { icon: UserCog, label: "Ekip", href: "/personel", module: "STAFF" },
    { icon: Bell, label: "Bildirimler", href: "/bildirimler", module: "NOTIFICATION" },
    {
      icon: Settings,
      label: "Ayarlar",
      href: "/ayarlar",
      subItems: [
        { label: "Sistem Ayarları", href: "/ayarlar" },
        ...(userRole === "SUPER_ADMIN" ? [
          { label: "Sektör Yönetimi", href: "/ayarlar/sektorler" },
          { label: "Tüm Dükkanlar (Admin)", href: "/admin/shops" },
        ] : []),
      ]
    },
  ];
};

export function Sidebar({ className, user, shop, onNavigate }: {
  className?: string;
  user?: { name: string; role: string };
  shop?: any;
  onNavigate?: () => void
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [aiUpdateOpen, setAiUpdateOpen] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const [isAiHovered, setIsAiHovered] = useState(false);
  const [localActivePath, setLocalActivePath] = useState(pathname);
  const [currentShop, setCurrentShop] = useState<any>(shop);
  const [whatsappStatus, setWhatsappStatus] = useState<string>("CONNECTED");

  useEffect(() => {
    if (shop) {
      setCurrentShop(shop);
    } else {
      const fetchShop = async () => {
        const { getShop } = await import("@/lib/actions/setting-actions");
        const res = await getShop();
        if (res) setCurrentShop(res);
      };
      fetchShop();
    }
  }, [shop]);
  useEffect(() => {
    // - [x] Create `ReturnTicket` model expansions and enums
    // - [x] Implement `return-actions.ts` (list, create, approve, reject)
    // - [x] Update `createDebt` in `debt-actions.ts` to handle stock deduction
    // - [x] Integrate product search into `AddDebtModal`
    // - [x] Add "İade/Hasarlı" to sidebar
    // - [/] Create `/stok/iade` page and `ReturnsClient` component
    // - [ ] Manual verification and testing
    // - [ ] Polish UI/UX for returns lists
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

  const menuItems = getMenuItems(currentShop, user?.role || session?.user?.role);

  useEffect(() => {
    setLocalActivePath(pathname);
    const activeMenu = menuItems.find(item =>
      item.subItems?.some(sub => sub.href === pathname) || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
    if (activeMenu && !openMenus.includes(activeMenu.label)) {
      setOpenMenus(prev => [...prev, activeMenu.label]);
    }
  }, [pathname, currentShop]); // Re-run when currentShop changes

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleNavigation = (href: string) => {
    setLocalActivePath(href);
    router.push(href);
    onNavigate?.();
  };

  // Logo always stable - only industry label changes below
  const industryConfig = getIndustryConfig(currentShop?.industry);

  return (
    <div className={cn("flex h-screen w-64 flex-col bg-background border-r border-border/50 z-20 overflow-hidden", className)}>
      <div className="flex h-28 items-center px-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-br from-primary/10 via-background to-transparent relative overflow-hidden group">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />

        <Link href="/" className="flex items-center gap-4 group outline-none relative z-10 w-full">
          <motion.div
            className="h-12 w-12 shrink-0 rounded-2xl bg-black dark:bg-[#0A0A0A] border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden p-2.5"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-30" />
            <motion.img
              src="/logo.svg"
              className="h-full w-full object-contain relative z-10"
              alt="Logo"
              animate={{
                filter: [
                  "drop-shadow(0 0 4px rgba(124, 58, 237, 0.3))",
                  "drop-shadow(0 0 10px rgba(124, 58, 237, 0.6))",
                  "drop-shadow(0 0 4px rgba(124, 58, 237, 0.3))"
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          <div className="flex flex-col flex-1 min-w-0 items-start text-left">
            <h1 className="text-[17px] font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase truncate group-hover:text-primary transition-colors duration-300">
              {currentShop?.name || "BAŞAR TEKNİK"}
            </h1>
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1.5 leading-none truncate block">
              {industryConfig?.name || "ERP SİSTEMİ"}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {/* Section Label */}
          <p className="text-[12px]  text-muted-foreground/60 uppercase tracking-widest px-3 mb-3">Menü</p>

          {menuItems.filter(item => {
            if (item.label === "Ayarlar" &&
              session?.user?.role !== "SUPER_ADMIN" &&
              session?.user?.role !== "ADMIN" &&
              session?.user?.role !== "SHOP_MANAGER") return false;

            // Granular module check
            if ((item as any).module && !isModuleEnabled(currentShop, (item as any).module)) return false;

            return true;
          }).map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            // Optimization: If only one sub-item and it points to the same href as parent, treat as a direct link
            const isRedundantDropdown = hasSubItems && item.subItems.length === 1 && item.subItems[0].href === item.href;

            const isOpen = openMenus.includes(item.label);
            const isActive = localActivePath === item.href || (item.href !== "/" && localActivePath?.startsWith(item.href));

            // Distinguish Admin items visually or separate them
            const isAdminItem = item.label === "Ayarlar" && item.subItems?.some(s => s.href === "/admin/shops");

            return (
              <div key={item.label}>
                {isAdminItem && (
                  <p className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em] px-3 mt-6 mb-2">Admin Araçları</p>
                )}
                {hasSubItems && !isRedundantDropdown ? (
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
                  <Link
                    href={item.href}
                    onClick={() => onNavigate?.()}
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
                  </Link>
                )}

                {hasSubItems && isOpen && (
                  <div className="flex flex-col gap-0.5 ml-4 mt-0.5 mb-1 border-l border-border/40 pl-3 py-0.5">
                    {item.subItems!.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => onNavigate?.()}
                        className={cn(
                          "px-3 py-2.5 text-left text-[13.5px]  rounded-lg transition-all duration-150 outline-none leading-none block",
                          localActivePath === sub.href
                            ? "text-primary bg-primary/8 font-medium "
                            : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/40",
                          sub.href === "/admin/shops" && "text-amber-500 font-bold"
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
        <Link
          href="/profil"
          onClick={() => onNavigate?.()}
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
            <span className="text-[14px] text-foreground truncate leading-tight group-hover:text-primary transition-colors">
              {session?.user?.name || "..."}
            </span>
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[11px] font-bold text-primary leading-tight truncate">
                {session?.user?.role === 'SUPER_ADMIN' ? (
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Süper Admin
                  </span>
                ) :
                  session?.user?.role === 'ADMIN' || session?.user?.role === 'SHOP_MANAGER' ? 'Yönetici' :
                    session?.user?.role === 'TECHNICIAN' ? 'Teknisyen' :
                      session?.user?.role === 'CASHIER' ? 'Kasiyer' :
                        session?.user?.role === 'STAFF' ? 'Personel' :
                          'Yükleniyor...'}
              </span>
              {session?.user?.role === 'SUPER_ADMIN' && session?.user?.shopId && (
                <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-tighter w-fit animate-pulse">
                  Yönetim Modu
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}



