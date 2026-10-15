"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Wrench,
  ShoppingBag,
  Users,
  User,
  PlusCircle,
  Clock,
  CheckCircle2,
  ScanLine,
  Receipt,
  PackagePlus,
  RotateCcw,
  UserPlus,
  BookOpen,
  ArrowDownLeft,
  Settings,
  Landmark,
  Wallet,
  Sliders,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { POSDrawer } from "@/components/navbar/pos-drawer";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { CreateCustomerModal } from "@/components/customer/create-customer-modal";

interface ShortcutItem {
  icon: any;
  label: string;
  desc: string;
  href: string;
  modal?: "income" | "expense" | "pos" | "service" | "customer";
}

interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
  shortcuts: ShortcutItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Ana Sayfa",
    href: "/dashboard",
    shortcuts: [
      { icon: ShoppingBag, label: "Hızlı Satış", desc: "Anında POS satış penceresi", href: "/satis", modal: "pos" },
      { icon: TrendingUp, label: "Gelir Ekle", desc: "Kasaya nakit veya banka girişi", href: "/satis/kasa?action=add-income", modal: "income" },
      { icon: TrendingDown, label: "Gider Ekle", desc: "Masraf, harcama veya fatura", href: "/satis/kasa?action=add-expense", modal: "expense" },
      { icon: Wrench, label: "Yeni Servis", desc: "Hızlı servis kabul kaydı", href: "/servis/yeni", modal: "service" },
    ],
  },
  {
    icon: Wrench,
    label: "Servis",
    href: "/servis",
    shortcuts: [
      { icon: PlusCircle, label: "Yeni Servis Kaydı", desc: "Hızlı servis kabul formu", href: "/servis/yeni", modal: "service" },
      { icon: Clock, label: "Devam Edenler", desc: "Onarım kuyruğundaki cihazlar", href: "/servis?tab=active" },
      { icon: CheckCircle2, label: "Teslime Hazır", desc: "Onarımı bitmiş cihazlar", href: "/servis?tab=ready" },
      { icon: Search, label: "Cihaz & Fiş Sorgula", desc: "Barkod veya numara ile sorgula", href: "/sorgula" },
    ],
  },
  {
    icon: ShoppingBag,
    label: "Satış",
    href: "/satis",
    shortcuts: [
      { icon: ShoppingBag, label: "POS Satış Ekranı", desc: "Hızlı satış penceresi", href: "/satis", modal: "pos" },
      { icon: Receipt, label: "Satış Geçmişi", desc: "Günün fişleri ve iptaller", href: "/satis/gecmis" },
      { icon: PackagePlus, label: "Yeni Ürün Ekle", desc: "Envantere yeni ürün ekle", href: "/stok?action=new" },
      { icon: RotateCcw, label: "Ürün İadeleri", desc: "Müşteri ve tedarikçi iadesi", href: "/stok/iade" },
    ],
  },
  {
    icon: Users,
    label: "Müşteriler",
    href: "/musteriler",
    shortcuts: [
      { icon: UserPlus, label: "Yeni Müşteri Ekle", desc: "Hızlı müşteri kartı aç", href: "/musteriler/yeni", modal: "customer" },
      { icon: BookOpen, label: "Veresiye Defteri", desc: "Açık hesap ve borç takibi", href: "/veresiye" },
      { icon: ArrowDownLeft, label: "Borç ve Tahsilatlar", desc: "Müşteri hesap tahsilatı", href: "/veresiye" },
    ],
  },
  {
    icon: User,
    label: "Profil",
    href: "/profil",
    shortcuts: [
      { icon: User, label: "Kullanıcı Profili", desc: "Hesap ve şifre ayarları", href: "/profil" },
      { icon: Settings, label: "Dükkan Ayarları", desc: "Genel sistem ayarları", href: "/ayarlar" },
      { icon: Landmark, label: "Kasa & Hesaplar", desc: "Banka ve nakit durumu", href: "/satis/kasa" },
    ],
  },
];

export function BottomNav({ shop }: { shop?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [isPosDrawerOpen, setIsPosDrawerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Close popup on navigation or Escape key
  useEffect(() => {
    setActiveMenuIndex(null);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenuIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleShortcutClick = useCallback((shortcut: ShortcutItem) => {
    setActiveMenuIndex(null);
    if (shortcut.modal === "income") {
      setTransactionType("INCOME");
      setIsTransactionModalOpen(true);
    } else if (shortcut.modal === "expense") {
      setTransactionType("EXPENSE");
      setIsTransactionModalOpen(true);
    } else if (shortcut.modal === "pos") {
      setIsPosDrawerOpen(true);
    } else if (shortcut.modal === "service") {
      setIsServiceModalOpen(true);
    } else if (shortcut.modal === "customer") {
      setIsCustomerModalOpen(true);
    } else {
      router.push(shortcut.href);
    }
  }, [router]);

  return (
    <>
      {/* Action Modals triggered directly from BottomNav on mobile without page jumping */}
      <CreateTransactionModal
        key={`bottom-nav-tx-${transactionType}`}
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        initialType={transactionType}
      />
      <POSDrawer
        open={isPosDrawerOpen}
        onOpenChange={setIsPosDrawerOpen}
      />
      <CreateServiceModal
        shop={shop}
        open={isServiceModalOpen}
        onOpenChange={setIsServiceModalOpen}
      />
      <CreateCustomerModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
      />

      {/* Dimmed Backdrop when a long-press shortcut menu is active */}
      <AnimatePresence>
        {activeMenuIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={() => setActiveMenuIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Fixed Native Mobile App Dock */}
      <nav
        aria-label="Mobil Alt Navigasyon"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-50",
          "bg-background/90 dark:bg-zinc-950/92 backdrop-blur-2xl",
          "border-t border-border/50 dark:border-white/10",
          "shadow-[0_-8px_30px_rgba(0,0,0,0.12)] select-none"
        )}
      >
        <div className="relative h-16 max-w-lg mx-auto grid grid-cols-5 items-stretch px-1">
          {NAV_ITEMS.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isMenuOpen = activeMenuIndex === index;

            return (
              <DockItem
                key={item.label}
                item={item}
                index={index}
                total={NAV_ITEMS.length}
                isActive={isActive}
                isMenuOpen={isMenuOpen}
                onTap={() => {
                  setActiveMenuIndex(null);
                  router.push(item.href);
                }}
                onLongPress={() => {
                  setActiveMenuIndex(index);
                }}
                onShortcutSelect={handleShortcutClick}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}

interface DockItemProps {
  item: NavItem;
  index: number;
  total: number;
  isActive: boolean;
  isMenuOpen: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onShortcutSelect: (item: ShortcutItem) => void;
}

function DockItem({
  item,
  index,
  total,
  isActive,
  isMenuOpen,
  onTap,
  onLongPress,
  onShortcutSelect,
}: DockItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    longPressedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    clearTimer();

    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(25);
      }
      onLongPress();
    }, 380);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimer();
      startPosRef.current = null;
    }
  };

  const handlePointerUp = () => {
    const wasTracking = !!startPosRef.current;
    clearTimer();
    startPosRef.current = null;
    if (wasTracking && !longPressedRef.current) {
      onTap();
    }
  };

  const handlePointerCancel = () => {
    clearTimer();
    startPosRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    clearTimer();
    onLongPress();
  };

  // Alignment positioning for popover relative to dock tab index
  const getPopoverPositionClass = () => {
    if (index === 0) return "left-2 origin-bottom-left";
    if (index === 1) return "left-4 origin-bottom-left";
    if (index === 2) return "left-1/2 -translate-x-1/2 origin-bottom";
    if (index === total - 2) return "right-4 origin-bottom-right";
    return "right-2 origin-bottom-right";
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Contextual Long-Press Popover */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className={cn(
              "absolute bottom-[calc(100%+12px)] z-50 w-64 rounded-2xl p-2 select-none shadow-2xl backdrop-blur-2xl",
              "bg-white/95 dark:bg-zinc-900/95 border border-border/70 dark:border-white/15",
              "shadow-[0_20px_50px_rgba(0,0,0,0.35)]",
              getPopoverPositionClass()
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-border/40 dark:border-white/5">
              <div className="flex items-center gap-1.5 min-w-0">
                <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground truncate">
                  {item.label} Kısayolları
                </span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0">
                HIZLI
              </span>
            </div>

            {/* Shortcut Actions */}
            <div className="flex flex-col gap-0.5">
              {item.shortcuts.map((sc) => (
                <button
                  key={sc.label}
                  type="button"
                  onClick={() => onShortcutSelect(sc)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/15 active:scale-[0.98] transition-all text-left group"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <sc.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {sc.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground/70 truncate">
                      {sc.desc}
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock Item Button */}
      <button
        type="button"
        aria-label={`${item.label} (Kısayollar için basılı tutun)`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        className={cn(
          "flex flex-col items-center justify-center gap-1 w-full h-full py-1.5 transition-all relative select-none touch-manipulation [-webkit-touch-callout:none]",
          isActive ? "text-primary" : "text-muted-foreground/60 hover:text-foreground active:scale-95",
          isMenuOpen && "scale-105 text-primary"
        )}
      >
        <div className="relative flex items-center justify-center">
          <item.icon
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isActive ? "stroke-[2.5px] scale-110" : "stroke-[1.6px]",
              isMenuOpen && "scale-110"
            )}
          />
          {isActive && (
            <motion.div
              layoutId="mobile-dock-active-glow"
              className="absolute -inset-2 bg-primary/15 rounded-full blur-md -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </div>
        <span
          className={cn(
            "text-[9.5px] tracking-tight leading-none transition-all",
            isActive ? "font-black" : "font-medium"
          )}
        >
          {item.label}
        </span>

        {/* Bottom Active Pill Indicator */}
        {isActive && (
          <motion.div
            layoutId="mobile-dock-active-pill"
            className="absolute bottom-1 h-0.5 w-4 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        )}
      </button>
    </div>
  );
}
