"use client";

import { useState, useMemo, useRef, useEffect, useTransition, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Landmark,
  History,
  Maximize2,
  Minimize2,
  Tag,
  Package,
  UserPlus,
  Loader2,
  ChevronDown,
  Check,
  X
} from "lucide-react";
import { createSale, getSaleById } from "@/lib/actions/sale-actions";
import { getPOSInitialData } from "@/lib/actions/product-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn, formatPhone, formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, ScanLine } from "lucide-react";
import { getSettings } from "@/lib/actions/setting-actions";
import { ScannerModal } from "@/components/scanner/scanner-modal";
import { useScanner } from "@/hooks/use-scanner";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { ProductCard } from "./parts/product-card";
import { CartItem } from "./parts/cart-item";
import { CustomerSelector } from "./parts/customer-selector";
import { CheckoutSummary } from "./parts/checkout-summary";

export function POSInterface({ initialSaleId }: {
  initialSaleId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const queryClient = useQueryClient();

  const { data: posData, isLoading: isPosLoading } = useQuery({
    queryKey: ["pos-initial-data"],
    queryFn: () => getPOSInitialData(),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes cache to avoid DB hits on every view
  });

  const { data: initialSale } = useQuery({
    queryKey: ["sale", initialSaleId],
    queryFn: () => getSaleById(initialSaleId!),
    enabled: !!initialSaleId
  });

  const customers = (posData?.customers || []) as { id: string; name: string; phone: string; loyaltyPoints?: number }[];
  const products = (posData?.products || []) as { id: string; name: string; barcode?: string | null; category?: { name?: string; parent?: { name?: string } | null } | null; categoryId?: string | null; buyPrice?: number; sellPrice?: number; buyPriceUsd?: number; sellPriceUsd?: number; priceCurrency?: string; stock?: number | null }[];
  const categories = (posData?.categories || []) as { id: string; name: string }[];

  const [scannerRoomId, setScannerRoomId] = useState<string>("");
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });

  const { rates: exchangeRates } = useDashboardData();

  // Show receipt if arrived via sale confirmation URL
  useEffect(() => {
    if (initialSale) {
      setLastSale(initialSale);
      setShowReceipt(true);
    }
  }, [initialSale]);

  const [displaySearchTerm, setDisplaySearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);

  const pointValueTl = useMemo(() => {
    const loyaltyVal = settingsData?.find((s: any) => s.key === "loyalty_point_value_tl")?.value;
    return Number(loyaltyVal) || 5;
  }, [settingsData]);

  const loyaltyEnabled = useMemo(() => {
    const enabled = settingsData?.find((s: any) => s.key === "loyalty_enabled")?.value;
    return enabled !== "false";
  }, [settingsData]);

  // Yeni Müşteri Ekleme State'leri
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Müşteri Combobox State
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const customerSearchRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Auto-select customer from URL param (e.g. /satis?customerId=xxx)
  useEffect(() => {
    const cid = searchParams.get("customerId");
    if (cid && customers.find((c) => c.id === cid)) {
      setSelectedCustomerId(cid);
    }
  }, [searchParams, customers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(displaySearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [displaySearchTerm]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(debouncedSearchTerm)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearchTerm, selectedCategory]);

  // ?fullscreen=true paramını yakala ve state'i ayarla
  useEffect(() => {
    if (searchParams.get("fullscreen") === "true") {
      setIsFullscreen(true);
    }
  }, [searchParams]);

  // ESC ile fullscreen'den çıkış
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        // URL'deki fullscreen=true parametresini temizle (isteğe bağlı ama temizlik iyidir)
        router.replace("/satis");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, router]);

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (!next) {
      router.replace("/satis");
    }
  };

  const handleQuickCreateCustomer = async (name: string) => {
    setIsCreatingCustomer(true);
    try {
      const res = await createCustomer({ name, phone: "" });
      if (res.success && res.customer) {
        toast({ title: "Başarılı", description: "Yeni müşteri kaydedildi." });
        queryClient.setQueryData(["pos-initial-data"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            customers: [res.customer, ...old.customers]
          };
        });
        setSelectedCustomerId(res.customer.id);
        setCustomerSearch(name);
        queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
      }
    } catch (e) {
      toast({ title: "Hata", variant: "destructive", description: "Hızlı kayıt yapıalamadı." });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  function getCartItemCurrency(item: any): "TRY" | "USD" | "EUR" {
    const storedCurrency = item?.attributes?.priceCurrency;
    if (storedCurrency === "USD" || storedCurrency === "EUR") return storedCurrency;
    return item?.sellPriceUsd ? "USD" : "TRY";
  }

  function getCartCurrencySymbol(item: any) {
    const itemCurrency = getCartItemCurrency(item);
    if (itemCurrency === "USD") return "$";
    if (itemCurrency === "EUR") return "€";
    return "₺";
  }

  function getCartDisplayPrice(item: any) {
    return getCartItemCurrency(item) === "TRY"
      ? Number(item.sellPrice || 0)
      : Number(item.sellPriceUsd || item.sellPrice || 0);
  }

  const getEquivalentDisplay = useCallback((product: any) => {
    const itemCurrency = getCartItemCurrency(product);
    const usdRate = Number(exchangeRates?.USD || settingsData?.find((s: any) => s.key === "exchange_rate_usd")?.value || 34.5);

    if (itemCurrency === "USD") {
      const priceUsd = Number(product.sellPriceUsd || product.sellPrice || 0);
      const tlEquiv = priceUsd * usdRate;
      return `(₺${tlEquiv.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })})`;
    } else {
      const priceTl = Number(product.sellPrice || 0);
      const usdEquiv = priceTl / usdRate;
      return `($${usdEquiv.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })})`;
    }
  }, [exchangeRates, settingsData]);

  const addToCart = useCallback((product: any) => {
    if (products.length === 0) return;

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      // Stock check for first-time addition
      if (!existing && product.stock <= 0) {
        toast({ title: "Stokta Yok", description: "Bu ürünün stoğu tükenmiş.", variant: "destructive" });
        return currentCart;
      }

      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: "Stok Yetersiz", description: "Daha fazla ekleyemezsiniz.", variant: "destructive" });
          return currentCart;
        }
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }, [toast, products]); // Added products dependency

  const addBarcodeMatchToCart = (value: string) => {
    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) return null;

    const product = products.find((p: any) =>
      p.barcode?.toUpperCase() === normalizedValue ||
      p.sku?.toUpperCase() === normalizedValue
    );

    if (!product) {
      toast({
        title: "Ürün Bulunamadı",
        description: `${normalizedValue} barkodlu ürün sistemde kayıtlı değil.`,
        variant: "destructive"
      });
      return null;
    }

    addToCart(product);
    setDisplaySearchTerm("");
    toast({ title: "Başarılı", description: `${product.name} sepete eklendi.` });
    return product;
  };

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const originalProduct = products.find((p: any) => p.id === id);
        if (delta > 0 && newQty > (originalProduct?.stock || 0)) {
          toast({ title: "Stok Yetersiz", variant: "destructive" });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, [products, toast]);

  const updatePrice = useCallback((id: string, newPrice: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const priceCurrency = getCartItemCurrency(item);
        if (priceCurrency === "TRY") {
          return { ...item, sellPrice: newPrice };
        }
        const rate = priceCurrency === "EUR" ? exchangeRates?.eur || 37 : exchangeRates?.usd || 34;
        return {
          ...item,
          sellPriceUsd: newPrice,
          sellPrice: newPrice * rate,
        };
      }
      return item;
    }));
  }, [exchangeRates]);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const { initializeScannerRoom, sendSuccessFeedback, sendErrorFeedback, syncCartToMobile } = useScanner(
    (barcode: string) => {
      const scannedProduct = addBarcodeMatchToCart(barcode);
      if (scannedProduct) {
        sendSuccessFeedback(scannedProduct.name);
      } else {
        sendErrorFeedback("Ürün bulunamadı");
      }
    }
  );

  // Sync cart to mobile whenever it changes
  useEffect(() => {
    syncCartToMobile(cart);
  }, [cart, syncCartToMobile]);

  // Listen for mobile-initiated cart actions
  useEffect(() => {
    const handleRemove = (e: any) => {
      removeFromCart(e.detail.productId);
    };
    const handleUpdateQty = (e: any) => {
      updateQuantity(e.detail.productId, e.detail.delta);
    };
    const handleAdd = (e: any) => {
      addToCart(e.detail.product);
    };
    const handleUpdatePrice = (e: any) => {
      updatePrice(e.detail.productId, e.detail.newPrice);
    };

    window.addEventListener("scanner_remove_from_cart", handleRemove);
    window.addEventListener("scanner_update_quantity", handleUpdateQty);
    window.addEventListener("scanner_add_to_cart", handleAdd);
    window.addEventListener("scanner_update_price", handleUpdatePrice);

    return () => {
      window.removeEventListener("scanner_remove_from_cart", handleRemove);
      window.removeEventListener("scanner_update_quantity", handleUpdateQty);
      window.removeEventListener("scanner_add_to_cart", handleAdd);
      window.removeEventListener("scanner_update_price", handleUpdatePrice);
    };
  }, [removeFromCart, updateQuantity, addToCart, updatePrice]);

  useEffect(() => {
    let rid = localStorage.getItem("scanner_room_id");
    if (!rid) {
      rid = "scanner-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("scanner_room_id", rid);
    }
    setScannerRoomId(rid);
    initializeScannerRoom(rid);
  }, [initializeScannerRoom]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  }, [cart]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === "null") return null;
    return customers.find((c) => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const totalPoints = selectedCustomer?.loyaltyPoints || 0;

  const loyaltyDiscountAmount = useMemo(() => {
    if (!applyLoyaltyDiscount || totalPoints <= 0 || !loyaltyEnabled) return 0;
    const maxPointsDiscount = totalPoints * pointValueTl;
    return Math.min(maxPointsDiscount, subtotal);
  }, [applyLoyaltyDiscount, totalPoints, subtotal, pointValueTl, loyaltyEnabled]);

  const usedPoints = Math.floor(loyaltyDiscountAmount / pointValueTl);

  const finalTotal = subtotal - loyaltyDiscountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")) {
      return;
    }
    setIsProcessing(true);

    startTransition(async () => {
      try {
        const result = await createSale({
          customerId: selectedCustomerId === "null" ? undefined : selectedCustomerId,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.sellPrice
          })),
          totalAmount: finalTotal, // Use finalTotal instead of subtotal
          paymentMethod,
          discountAmount: loyaltyDiscountAmount,
          usedPoints
        });

        if (result.success) {
          // 1. Optimistic Stock Update: Update query cache immediately
          queryClient.setQueryData(["pos-initial-data"], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              products: old.products.map((p: any) => {
                const soldItem = cart.find(item => item.id === p.id);
                if (soldItem) {
                  return { ...p, stock: p.stock - soldItem.quantity };
                }
                return p;
              })
            };
          });

          // 2. Receipt and Success State
          setLastSale(result.data);
          setShowReceipt(true);

          // 3. UI Cleanup
          setCart([]);
          setDisplaySearchTerm("");
          setSelectedCustomerId(undefined);
          // 4. Invalidate to seamlessly update server state without reload
          queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-init"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-revenue-analysis"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] });

          toast({ title: "Satış Başarılı", description: "İşlem kaydedildi ve fiş hazırlandı." });

          // 5. Notifications
          window.dispatchEvent(new CustomEvent("notification-update"));
        } else {
          toast({ title: "Hata", description: result.error, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Sistem Hatası", variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const closeReceiptAndReload = () => {
    setShowReceipt(false);
    setLastSale(null);
    // No direct router.refresh() needed here, state is cleanly reset.
    // The background query invalidation has already synced everything.
  };

  const content = (
    <div ref={containerRef} className={cn(
      "flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 bg-background h-full overflow-hidden p-2 sm:p-4 lg:p-6 relative transition-all duration-700",
      isFullscreen && "fixed inset-0 z-[40] p-4 lg:p-8 bg-background/95 backdrop-blur-xl",
      showReceipt && "bg-emerald-950/20"
    )} style={{ zIndex: isFullscreen ? 40 : undefined }}>
      {/* Background decoration for fullscreen */}
      {isFullscreen && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10 pointer-events-none" />
      )}
      {/* Success Pulse Background */}
      {showReceipt && (
        <div className="absolute inset-0 z-0 pointer-events-none animate-success-pulse bg-emerald-500/5 transition-all" />
      )}
      {/* Product Selection Area (Left Pane) */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden bg-card border border-border/40 rounded-[2.5rem] shadow-sm">
          {/* Header & Search - Mobile Optimized */}
          <div className="p-4 sm:p-8 border-b border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-8 bg-muted/5">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-medium text-lg sm:text-2xl text-foreground whitespace-nowrap">Hızlı <span className="text-primary">Satış</span></h2>
                <p className="text-[9px] sm:text-[11px] text-muted-foreground font-semibold leading-none mt-1 uppercase tracking-wider">POS Terminal v2.0</p>
              </div>
            </div>

            <div className="flex-1 w-full sm:max-w-xl order-3 sm:order-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Ürün adı veya barkod okut..."
                  className="pl-12 pr-12 bg-muted/30 border-border/40 h-14 sm:h-12 rounded-2xl text-sm sm:text-xs focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                  value={displaySearchTerm}
                  onChange={(e) => setDisplaySearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && addBarcodeMatchToCart(displaySearchTerm)) {
                      e.preventDefault();
                    }
                  }}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  onClick={() => setIsScannerModalOpen(true)}
                >
                  <ScanLine className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 order-2 sm:order-3 self-end sm:self-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border-border/40 hover:bg-muted/50 transition-all"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Categories Tab */}
          <div className="px-8 py-4 border-b border-border/40 bg-card overflow-x-auto relative z-20">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="bg-transparent gap-3 p-0 h-auto">
                <TabsTrigger
                  value="ALL"
                  className="rounded-full h-10 px-8 text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm border border-border/40 data-[state=active]:border-primary"
                >
                  TÜMÜ
                </TabsTrigger>
                {categories.map((cat: any) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full h-10 px-8 text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm border border-border/40 data-[state=active]:border-primary"
                  >
                    {cat.name.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-muted/5 relative">
            {isPosLoading && products.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin opacity-50" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Package className="h-12 w-12 mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Ürün Bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                    getEquivalentDisplay={getEquivalentDisplay}
                    getCartCurrencySymbol={getCartCurrencySymbol}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart and Customer Selection (Right Pane) */}
      <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden bg-card border border-border/40 rounded-[2.5rem] shadow-sm">
          {/* Cart Header */}
          <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl text-foreground">Aktif <span className="text-primary">Sepet</span></span>
                <p className="text-[10px] text-muted-foreground">{cart.length} Ürün Seçildi</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-10 rounded-full text-[10px] text-rose-500 hover:bg-rose-500/10 px-6 border border-rose-500/40">
              BOŞALT
            </Button>
          </div>

          <div className="p-8 border-b border-border/40 bg-muted/5">
            <CustomerSelector
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              onNewCustomer={handleQuickCreateCustomer}
              isProcessing={isCreatingCustomer}
            />
          </div>

          {/* Cart Items */}
          <div className="flex-none overflow-y-auto p-0 custom-scrollbar relative max-h-[48vh]">
            <div className="divide-y divide-white/5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/80 p-10 text-center">
                  <div className="relative">
                    <ShoppingCart className="h-16 w-16 mb-4 opacity-[0.03] text-foreground" />
                    <ShoppingCart className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 text-primary" />
                  </div>
                  <p className="text-[9px] opacity-40">Sepetiniz şu an boş</p>
                </div>
              ) : (
                cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    updatePrice={updatePrice}
                    removeFromCart={removeFromCart}
                    getCartCurrencySymbol={getCartCurrencySymbol}
                    getEquivalentDisplay={getEquivalentDisplay}
                  />
                ))
              )}
            </div>
          </div>

          <CheckoutSummary
            subtotal={subtotal}
            tax={0} // Tax calculation can be added if needed, setting 0 for now
            total={finalTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            loyaltyEnabled={loyaltyEnabled}
            totalPoints={totalPoints}
            pointValueTl={pointValueTl}
            applyLoyaltyDiscount={applyLoyaltyDiscount}
            setApplyLoyaltyDiscount={setApplyLoyaltyDiscount}
            loyaltyDiscountAmount={loyaltyDiscountAmount}
            onCheckout={handleCheckout}
            isProcessing={isProcessing}
            isDebtBlocked={paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")}
            getEquivalentDisplay={(item) => getEquivalentDisplay(item)}
          />
        </div>
      </div>

      {lastSale && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={closeReceiptAndReload}
          sale={lastSale}
        />
      )}

      <style jsx global>{`
        @keyframes success-pulse {
          0% { opacity: 0; background-color: rgba(16, 185, 129, 0); }
          50% { opacity: 1; background-color: rgba(16, 185, 129, 0.15); }
          100% { opacity: 0.8; background-color: rgba(16, 185, 129, 0.05); }
        }
        .animate-success-pulse {
          animation: success-pulse 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      <ScannerModal open={isScannerModalOpen} onOpenChange={setIsScannerModalOpen} shopIdOrUserId={scannerRoomId} />
    </div>
  );

  if (!mounted) return null;

  if (isFullscreen && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
