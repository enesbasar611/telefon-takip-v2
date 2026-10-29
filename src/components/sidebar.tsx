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
  ChevronRight,
  Zap,
  Sparkles,
  Search,
  RefreshCcw,
  Activity,
  ListTree,
  Plus,
  ShieldAlert,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  LayoutGrid,
  Boxes,
  ClipboardList,
  Building2,
  ArrowLeftRight,
  FolderTree,
  RotateCcw,
  History,
  Receipt,
  Contact,
  UserPlus,
  Sliders,
  ScrollText,
  Layers,
  Store,
  Send,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BorderBeam } from "border-beam";
import { isModuleEnabled, getIndustryConfig } from "@/lib/industry-utils";
import { cn } from "@/lib/utils";
import { Shop } from "@prisma/client";

const getMenuItems = (shop: any, userRole?: string, isImpersonating?: boolean) => {
  const config = getIndustryConfig(shop?.industry);
  const labels = config.labels;

  const effectiveRole = isImpersonating ? "SHOP_MANAGER" : userRole;

  return [
    {
      icon: LayoutDashboard,
      label: "Anasayfa",
      href: "/dashboard",
    },
    ...(effectiveRole === "COURIER" || effectiveRole === "ADMIN" || effectiveRole === "SUPER_ADMIN" || effectiveRole === "SHOP_MANAGER" ? [{
      icon: Truck,
      label: "Kurye Görevleri",
      href: "/kurye",
    }] : []),
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
        { label: `Yeni ${labels.customerAsset} Girişi`, href: "/servis/yeni", icon: PlusCircle },
        { label: `${labels.serviceTicket} Merkezi`, href: "/servis", icon: LayoutGrid },
      ]
    },
    {
      icon: Package,
      label: labels.inventory || "Envanter",
      href: "/stok",
      module: "STOCK",
      subItems: [
        { label: "Stok Listesi", href: "/stok", icon: Boxes },
        { label: "Tedarikçi Siparişleri", href: "/stok/siparisler", icon: ClipboardList },
        { label: "Tedarikçi Yönetimi", href: "/tedarikciler", icon: Building2 },
        { label: "Hareket Analizi", href: "/stok/hareketler", icon: ArrowLeftRight },
        { label: "Kategoriler", href: "/stok/kategoriler", icon: FolderTree },
        { label: "AI Önerileri", href: "/stok/stok-ai", icon: Sparkles },
        { label: "İade / Hasarlı", href: "/stok/iade", icon: RotateCcw },
      ]
    },
    {
      icon: ShoppingCart,
      label: "POS & Kasa",
      href: "/satis",
      module: "SALE",
      subItems: [
        { label: "Hızlı Satış", href: "/satis", icon: Zap },
        { label: "Satış Arşivi", href: "/satis/gecmis", icon: History },
        { label: "Kasa Raporu", href: "/satis/kasa", icon: Receipt },
      ]
    },
    {
      icon: Users,
      label: "Müşteri CRM",
      href: "/musteriler",
      module: "CRM",
      subItems: [
        { label: "Müşteri Portföyü", href: "/musteriler", icon: Contact },
        { label: "Yeni Tanımlama", href: "/musteriler/yeni", icon: UserPlus },
      ]
    },
    { icon: CreditCard, label: "Veresiye", href: "/veresiye", module: "DEBT" },
    {
      icon: FileText,
      label: "e-Fatura",
      href: "/efatura",
      module: "EFATURA",
    },
    { icon: Smartphone, label: (labels.customerAsset || "Cihaz") + " Merkezi", href: "/cihaz-listesi", module: "SERVICE" },
    { icon: BarChart3, label: "İstatistikler", href: "/raporlar", module: "FINANCE" },
    { icon: UserCog, label: "Ekip", href: "/personel", module: "STAFF" },
    { icon: Bell, label: "Bildirimler", href: "/bildirimler", module: "NOTIFICATION" },
    {
      icon: Settings,
      label: "Ayarlar",
      href: "/ayarlar",
      subItems: [
        { label: "Sistem Ayarları", href: "/ayarlar", icon: Sliders },
        { label: "İşlem Logları", href: "/ayarlar/loglar", icon: ScrollText },
        ...(effectiveRole === "SUPER_ADMIN" ? [
          { label: "Sektör Yönetimi", href: "/ayarlar/sektorler", icon: Layers },
          { label: "Tüm Dükkanlar (Admin)", href: "/admin/shops", icon: Store },
          { label: "EDM Yönetimi", href: "/admin/edm", icon: Send },
          { label: "Duyuru Yönetimi", href: "/admin/duyurular", icon: Megaphone },
        ] : []),
      ]
    },
  ];
};

export function Sidebar({ className, user, shop, onNavigate }: {
  className?: string;
  user?: { name: string; role: string };
  shop?: any;
  onNavigate?: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [flyoutMenu, setFlyoutMenu] = useState<string | null>(null);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [aiUpdateOpen, setAiUpdateOpen] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const [isAiHovered, setIsAiHovered] = useState(false);
  const [localActivePath, setLocalActivePath] = useState(pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isMobile = className?.includes("w-full");

  const userRole = session?.user?.role || user?.role;
  const isImpersonating = (session?.user as any)?.isImpersonating || false;
  const menuItems = getMenuItems(shop, userRole, isImpersonating);

  // Restore collapsed state from localStorage on desktop mount
  useEffect(() => {
    if (!isMobile) {
      const savedCollapsed = localStorage.getItem("basar_sidebar_collapsed");
      if (savedCollapsed === "true") {
        setIsCollapsed(true);
      }
    }
  }, [isMobile]);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("basar_sidebar_collapsed", String(next));
      setFlyoutMenu(null);
      return next;
    });
  };

  useEffect(() => {
    setLocalActivePath(pathname);
    const activeMenu = menuItems.find(item =>
      item.subItems?.some(sub => sub.href === pathname) || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
    if (activeMenu && !openMenus.includes(activeMenu.label)) {
      // Auto-open only active menu
      setOpenMenus([activeMenu.label]);
    }
  }, [pathname, shop]);

  // Single-accordion behavior: opening one menu closes all other menus
  const toggleMenu = (label: string) => {
    setOpenMenus(prev => (prev.includes(label) ? [] : [label]));
  };

  const industryConfig = getIndustryConfig(shop?.industry);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-background/95 backdrop-blur-xl border-r border-border/50 z-20 transition-all duration-300 ease-in-out select-none",
        isMobile ? "w-full" : (isCollapsed ? "w-[72px]" : "w-64"),
        className
      )}
    >
      {/* Sidebar Header */}
      <div className={cn(
        "flex items-center border-b border-border/50 flex-shrink-0 relative overflow-hidden transition-all duration-300",
        isCollapsed && !isMobile ? "h-18 px-3 justify-center" : "h-18 px-4 justify-between"
      )}>
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-8 -left-8 w-24 h-24 bg-primary/10 blur-[40px] rounded-full" />

        <Link
          href="/"
          prefetch={false}
          className={cn(
            "flex items-center gap-3 outline-none group min-w-0",
            isCollapsed && !isMobile ? "justify-center" : "flex-1"
          )}
          title={shop?.name || "BAŞAR TEKNİK"}
        >
          {/* Logo Card */}
          <div className="h-10 w-10 shrink-0 rounded-xl bg-card dark:bg-[#0c121d] border border-border/60 shadow-xs flex items-center justify-center p-2 group-hover:scale-105 group-hover:border-primary/40 transition-all duration-200">
            <img
              src="/logo.svg"
              className="h-full w-full object-contain"
              alt="Logo"
            />
          </div>

          {/* Shop Name & Subtitle */}
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col min-w-0 text-left">
              <h1 className="text-[13.5px] font-bold tracking-tight text-foreground leading-tight uppercase group-hover:text-primary transition-colors truncate">
                {shop?.name || "BAŞAR TEKNİK"}
              </h1>
              <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-[0.16em] mt-0.5 truncate">
                {industryConfig?.name || "ERP SİSTEMİ"}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse / Expand Toggle Button */}
        {!isMobile && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 outline-none",
              isCollapsed && "hidden"
            )}
            title="Menüyü Daralt"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links Area */}
      <ScrollArea className="flex-1 px-2.5 py-3 custom-scrollbar">
        <nav className="flex flex-col gap-1">
          {/* Section Header */}
          {(!isCollapsed || isMobile) && (
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.18em] px-3 mb-1.5 mt-0.5">
              Menü
            </p>
          )}

          {menuItems.filter(item => {
            const u = session?.user as any;
            if (!u) return false;

            if (item.label === "Ayarlar" &&
              u.role !== "SUPER_ADMIN" &&
              u.role !== "ADMIN" &&
              u.role !== "MANAGER" &&
              u.role !== "SHOP_MANAGER") return false;

            // Granular User Permission Checks
            if (item.href.startsWith("/satis") && !u.canSell && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/veresiye") && !u.canFinance && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/servis") && !u.canService && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/cihaz-listesi") && !u.canService && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/stok") && !u.canStock && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/tedarikciler") && !u.canStock && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/raporlar") && !u.canFinance && u.role !== "ADMIN") return false;
            if (item.href.startsWith("/efatura")) {
              if (!u.canFinance && u.role !== "ADMIN") return false;
              if (!shop?.isEInvoiceEnabled) return false;
            }
            if (item.href.startsWith("/personel") && u.role !== "ADMIN" && u.role !== "MANAGER" && u.role !== "SHOP_MANAGER" && u.role !== "SUPER_ADMIN") return false;

            // Granular module check based on shop config
            if ((item as any).module && !isModuleEnabled(shop, (item as any).module)) return false;

            return true;
          }).map((item) => {
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const isRedundantDropdown = hasSubItems && item.subItems?.length === 1 && item.subItems[0].href === item.href;

            const isOpen = openMenus.includes(item.label);
            const isExactActive = localActivePath === item.href;
            const hasActiveChild = Boolean(hasSubItems && item.subItems?.some(s => s.href === localActivePath));
            const isActive = isExactActive || (item.href !== "/" && item.href !== "/dashboard" && localActivePath?.startsWith(item.href));

            const isAdminItem = item.label === "Ayarlar" && item.subItems?.some(s => s.href === "/admin/shops");

            return (
              <div key={item.label} className="w-full">
                {isAdminItem && (!isCollapsed || isMobile) && (
                  <p className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.18em] px-3 mt-4 mb-1.5">
                    Admin Araçları
                  </p>
                )}

                {hasSubItems && !isRedundantDropdown ? (
                  isCollapsed && !isMobile ? (
                    /* ── Slim Icon Rail Dock Mode: Hover & Click Flyout Popover ── */
                    <Popover
                      open={flyoutMenu === item.label}
                      onOpenChange={(open) => setFlyoutMenu(open ? item.label : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onMouseEnter={() => setFlyoutMenu(item.label)}
                          onClick={() => setFlyoutMenu(prev => prev === item.label ? null : item.label)}
                          title={item.label}
                          className={cn(
                            "flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-150 outline-none group cursor-pointer relative",
                            (isActive || hasActiveChild || flyoutMenu === item.label)
                              ? "text-primary font-semibold bg-primary/10 shadow-xs"
                              : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              (isActive || hasActiveChild || flyoutMenu === item.label)
                                ? "text-primary"
                                : "text-muted-foreground/70 group-hover:text-foreground"
                            )}
                            strokeWidth={1.75}
                          />
                          {hasActiveChild && (
                            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      </PopoverTrigger>

                      <PopoverContent
                        side="right"
                        align="start"
                        sideOffset={12}
                        onMouseEnter={() => setFlyoutMenu(item.label)}
                        onMouseLeave={() => setFlyoutMenu(null)}
                        className="z-50 min-w-[220px] max-w-[280px] p-2 bg-card/95 dark:bg-[#0c121d]/95 backdrop-blur-2xl border border-border/70 rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 data-[side=right]:slide-in-from-left-2 duration-150"
                      >
                        <div className="px-2.5 py-1.5 border-b border-border/40 mb-1 flex items-center gap-2">
                          <item.icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {item.subItems!.map((sub) => {
                            const SubIcon = sub.icon || ChevronRight;
                            const isSubActive = localActivePath === sub.href;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                prefetch={false}
                                onClick={() => {
                                  setLocalActivePath(sub.href);
                                  setFlyoutMenu(null);
                                  onNavigate?.();
                                }}
                                className={cn(
                                  "px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-2.5 leading-tight",
                                  isSubActive
                                    ? "text-primary bg-primary/10 font-semibold dark:bg-primary/15"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                  sub.href === "/admin/shops" && "text-amber-500 font-bold"
                                )}
                              >
                                <SubIcon
                                  className={cn("h-3.5 w-3.5 shrink-0", isSubActive ? "text-primary" : "text-muted-foreground/60")}
                                  strokeWidth={1.75}
                                />
                                <span className="truncate flex-1">{sub.label}</span>
                                {isSubActive && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                              </Link>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    /* ── Expanded Mode: Single-Accordion Sliding Motion ── */
                    <>
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          "flex items-center justify-between w-full rounded-xl px-3 py-2 text-[13.5px] transition-all duration-150 outline-none group cursor-pointer relative",
                          (isActive || hasActiveChild)
                            ? (isOpen ? "text-foreground font-semibold bg-muted/40" : "text-primary font-semibold bg-primary/10")
                            : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              (isActive || hasActiveChild)
                                ? "text-primary"
                                : "text-muted-foreground/70 group-hover:text-foreground"
                            )}
                            strokeWidth={1.75}
                          />
                          <span className="truncate leading-tight">{item.label}</span>
                        </div>

                        <motion.div
                          animate={{ rotate: isOpen ? 90 : 0 }}
                          transition={{ type: "spring", stiffness: 450, damping: 28 }}
                          className="shrink-0 text-muted-foreground/40 group-hover:text-foreground ml-2"
                        >
                          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </motion.div>
                      </button>

                      {/* Smooth Motion Accordion Submenu with Sub-Item Icons */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key={`submenu-${item.label}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                              transition: {
                                height: { type: "spring", stiffness: 450, damping: 35 },
                                opacity: { duration: 0.2, ease: "easeOut" }
                              }
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                              transition: {
                                height: { type: "spring", stiffness: 500, damping: 40 },
                                opacity: { duration: 0.15, ease: "easeIn" }
                              }
                            }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-0.5 ml-4.5 my-1 border-l border-border/40 pl-3 py-0.5">
                              {item.subItems!.map((sub, idx) => {
                                const SubIcon = sub.icon || ChevronRight;
                                const isSubActive = localActivePath === sub.href;
                                return (
                                  <motion.div
                                    key={sub.label}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.18, delay: idx * 0.02 }}
                                  >
                                    <Link
                                      href={sub.href}
                                      prefetch={false}
                                      onClick={() => { setLocalActivePath(sub.href); onNavigate?.(); }}
                                      className={cn(
                                        "group/sub relative px-2.5 py-1.5 text-left text-[13px] rounded-lg transition-colors outline-none flex items-center gap-2.5 leading-tight",
                                        isSubActive
                                          ? "text-primary bg-primary/10 font-semibold dark:bg-primary/15"
                                          : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40",
                                        sub.href === "/admin/shops" && "text-amber-500 font-bold"
                                      )}
                                    >
                                      <SubIcon
                                        className={cn(
                                          "h-3.5 w-3.5 shrink-0 transition-colors",
                                          isSubActive ? "text-primary" : "text-muted-foreground/60 group-hover/sub:text-foreground"
                                        )}
                                        strokeWidth={1.75}
                                      />
                                      <span className="truncate flex-1">{sub.label}</span>
                                      {isSubActive && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse ml-2" />
                                      )}
                                    </Link>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )
                ) : (
                  /* ── Direct Link Items without Submenus ── */
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={() => { setLocalActivePath(item.href); onNavigate?.(); }}
                    title={isCollapsed && !isMobile ? item.label : undefined}
                    className={cn(
                      "flex items-center w-full rounded-xl transition-all duration-150 outline-none group cursor-pointer relative",
                      isCollapsed && !isMobile
                        ? "justify-center h-10 w-10 mx-auto px-0"
                        : "justify-between px-3 py-2 text-[13.5px]",
                      isActive
                        ? "text-primary bg-primary/10 font-semibold dark:bg-primary/15"
                        : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
                        )}
                        strokeWidth={1.75}
                      />
                      {(!isCollapsed || isMobile) && (
                        <span className="truncate leading-tight">{item.label}</span>
                      )}
                    </div>

                    {(!isCollapsed || isMobile) && isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}

                    {isCollapsed && !isMobile && isActive && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Başar AI Command Center */}
      <div className={cn("pb-3", isCollapsed && !isMobile ? "px-2" : "px-3")}>
        {(!isCollapsed || isMobile) ? (
          <BorderBeam size="md" colorVariant="colorful" strength={0.8} className="w-full rounded-2xl">
            <div
              className="w-full bg-card/90 dark:bg-card/70 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden shadow-xs"
              onMouseEnter={() => setIsAiHovered(true)}
              onMouseLeave={() => setIsAiHovered(false)}
            >
              <div className="px-3.5 py-2 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400 animate-pulse" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Başar AI</span>
                </div>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="grid grid-cols-3">
                <button
                  type="button"
                  onClick={() => setAiAnalyzeOpen(true)}
                  className="flex flex-col items-center justify-center py-2.5 gap-1 hover:bg-violet-500/10 transition-colors group cursor-pointer outline-none"
                  title="Envanter & Finans Analizi"
                >
                  <Activity className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                  <span className="text-[9.5px] font-medium text-muted-foreground/70 group-hover:text-foreground uppercase tracking-wide transition-colors">Analiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiUpdateOpen(true)}
                  className="flex flex-col items-center justify-center py-2.5 gap-1 hover:bg-violet-500/10 transition-colors group cursor-pointer outline-none border-x border-border/50"
                  title="Doğal Dil ile Toplu Güncelleme"
                >
                  <RefreshCcw className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                  <span className="text-[9.5px] font-medium text-muted-foreground/70 group-hover:text-foreground uppercase tracking-wide transition-colors">Güncelle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiSearchOpen(true)}
                  className="flex flex-col items-center justify-center py-2.5 gap-1 hover:bg-violet-500/10 transition-colors group cursor-pointer outline-none"
                  title="Doğal Dilde Akıllı Arama"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                  <span className="text-[9.5px] font-medium text-muted-foreground/70 group-hover:text-foreground uppercase tracking-wide transition-colors">Ara</span>
                </button>
              </div>
            </div>
          </BorderBeam>
        ) : (
          /* Collapsed AI Orb Trigger */
          <BorderBeam size="sm" colorVariant="colorful" strength={0.8} className="rounded-xl mx-auto block w-10 h-10">
            <button
              type="button"
              onClick={() => setAiSearchOpen(true)}
              className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-violet-500/10 transition-colors"
              title="Başar AI Akıllı Arama"
            >
              <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
            </button>
          </BorderBeam>
        )}
      </div>

      <AISearchModal open={aiSearchOpen} onOpenChange={setAiSearchOpen} />
      <AIUpdateModal open={aiUpdateOpen} onOpenChange={setAiUpdateOpen} />
      <AIAnalyzeModal open={aiAnalyzeOpen} onOpenChange={setAiAnalyzeOpen} />

      {/* User Profile Section */}
      <div className={cn(
        "border-t border-border/50 transition-all duration-300",
        isCollapsed && !isMobile ? "p-2" : "px-3 py-3"
      )}>
        {(!isCollapsed || isMobile) ? (
          <Link
            href="/profil"
            onClick={() => onNavigate?.()}
            className="w-full flex items-center gap-3 rounded-xl bg-muted/30 border border-border/40 px-3 py-2 outline-none hover:bg-muted/50 hover:border-border/70 transition-colors group cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20 flex-shrink-0 overflow-hidden group-hover:border-primary/40 transition-colors">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                (session?.user?.name || "A").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col overflow-hidden flex-1 min-w-0 text-left">
              <span className="text-[13px] font-medium text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                {session?.user?.name || "..."}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold text-primary leading-tight truncate">
                  {session?.user?.role === 'SUPER_ADMIN' ? (
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5" /> Süper Admin
                    </span>
                  ) :
                    session?.user?.role === 'ADMIN' || session?.user?.role === 'SHOP_MANAGER' ? 'Yönetici' :
                      session?.user?.role === 'TECHNICIAN' ? 'Teknisyen' :
                        session?.user?.role === 'CASHIER' ? 'Kasiyer' :
                          session?.user?.role === 'STAFF' ? 'Personel' :
                            session?.user?.role === 'COURIER' ? 'Kurye' :
                              'Yükleniyor...'}
                </span>
                {session?.user?.role === 'SUPER_ADMIN' && session?.user?.shopId && (
                  <span className="text-[8.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.2 rounded uppercase tracking-tighter">
                    Yönetim
                  </span>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <Link
            href="/profil"
            onClick={() => onNavigate?.()}
            className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl hover:bg-muted/50 transition-colors"
            title={session?.user?.name || "Profil"}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20 overflow-hidden">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                (session?.user?.name || "A").charAt(0).toUpperCase()
              )}
            </div>
          </Link>
        )}

        {/* Expand Button at Bottom when Collapsed */}
        {isCollapsed && !isMobile && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mt-2 flex items-center justify-center h-8 w-8 mx-auto rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Menüyü Genişlet"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
