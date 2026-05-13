"use client";

import { useState, useMemo, useRef, useEffect, useTransition, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
  Loader2
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
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

export function POSInterface({ products: initialProducts, customers, categories, initialSale }: {
  products: any[];
  customers: any[];
  categories: any[];
  initialSale?: any;
}) {
  const [scannerRoomId, setScannerRoomId] = useState<string>("");
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const { rates: exchangeRates } = useDashboardData();

  // Show receipt if arrived via sale confirmation URL
  useEffect(() => {
    if (initialSale) {
      setLastSale(initialSale);
      setShowReceipt(true);
    }
  }, [initialSale]);

  // Sync prop changes in the background (e.g. after router.refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);

  const [pointValueTl, setPointValueTl] = useState<number>(5);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

  // Load points config
  useEffect(() => {
    async function fetchPointsSettings() {
      try {
        const settings = await getSettings();
        const config = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
        setPointValueTl(Number(config.loyalty_point_value_tl) || 5);
        setLoyaltyEnabled(config.loyalty_enabled !== "false");
      } catch (err) {
      }
    }
    fetchPointsSettings();
  }, []);

  // Yeni Müşteri Ekleme State'leri
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Auto-fullscreen from shortcut parameter
    if (searchParams.get("fullscreen") === "true") {
      const triggerFs = () => {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(() => { });
        }
      };
      triggerFs();
      // Browsers often block auto-fullscreen, so we try once on the first document click too
      document.addEventListener("click", triggerFs, { once: true });
    }

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [searchParams]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const handleCreateCustomer = async () => {
    const rawPhone = newCustomer.phone.replace(/\D/g, "");
    if (!newCustomer.name || newCustomer.name.length < 2) {
      toast({ title: "Eksik Bilgi", description: "Lütfen müşteri adı ve soyadı girin.", variant: "destructive" });
      return;
    }
    if (rawPhone.length !== 10 || !rawPhone.startsWith("5")) {
      toast({ title: "Hatalı Numara", description: "Geçerli bir telefon numarası girin (5xx xxx xxxx).", variant: "destructive" });
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const res = await createCustomer({ name: newCustomer.name, phone: newCustomer.phone });
      if (res.success && res.customer) {
        toast({ title: "Başarılı", description: "Yeni müşteri sisteme kaydedildi ve seçildi." });
        customers.push(res.customer); // UI update without reload dependency
        setSelectedCustomerId(res.customer.id);
        setIsNewCustomerOpen(false);
        setNewCustomer({ name: "", phone: "" });
        router.refresh(); // Fetch new server data
      } else {
        toast({ title: "Hata", description: res.error || "Müşteri oluşturulamadı.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Sistem hatası oluştu.", variant: "destructive" });
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

  const addToCart = useCallback((product: any) => {
    if (!product) return;

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
  }, [toast]); // Removed products dependency as it's not used inside the state updater

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
    setSearchTerm("");
    toast({ title: "Başarılı", description: `${product.name} sepete eklendi.` });
    return product;
  };

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const originalProduct = products.find((p) => p.id === id);
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
          sellPrice: Math.ceil(newPrice * rate),
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
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const totalPoints = selectedCustomer?.loyaltyPoints || 0;

  const loyaltyDiscountAmount = useMemo(() => {
    if (!applyLoyaltyDiscount || totalPoints <= 0 || !loyaltyEnabled) return 0;
    const maxPointsDiscount = totalPoints * pointValueTl;
    return Math.min(maxPointsDiscount, subtotal);
  }, [applyLoyaltyDiscount, totalPoints, subtotal, pointValueTl, loyaltyEnabled]);

  const usedPoints = Math.ceil(loyaltyDiscountAmount / pointValueTl);

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
          // 1. Optimistic Stock Update: Update local product state immediately
          const updatedProducts = products.map((p: any) => {
            const soldItem = cart.find(item => item.id === p.id);
            if (soldItem) {
              return { ...p, stock: p.stock - soldItem.quantity };
            }
            return p;
          });
          setProducts(updatedProducts);

          // 2. Receipt and Success State
          setLastSale(result.data);
          setShowReceipt(true);

          // 3. UI Cleanup
          setCart([]);
          setSearchTerm("");
          setSelectedCustomerId(undefined);
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
    router.refresh();
  };

  return (
    <div ref={containerRef} className={cn(
      "flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 bg-background h-full overflow-hidden p-2 sm:p-4 lg:p-6 relative transition-all duration-700",
      isFullscreen && "fixed inset-0 z-50 p-4 lg:p-8",
      showReceipt && "bg-emerald-950/20"
    )}>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && addBarcodeMatchToCart(searchTerm)) {
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
                {categories.map((cat) => (
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => {
                const productCurrency = getCartItemCurrency(product);
                const displayPrice = getCartDisplayPrice(product);
                const priceStr = formatCurrency(displayPrice);
                // Standardized font size for price to avoid truncation
                const priceSizeClass = "text-lg sm:text-xl font-black";

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="flex flex-col text-left bg-card border border-border/40 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 group disabled:opacity-40 relative overflow-hidden aspect-[1/1.1] sm:aspect-[1/1.2]"
                  >
                    {/* Top Row: Category & Stock */}
                    <div className="flex items-start justify-between gap-2 mb-auto z-10">
                      <div className="text-[8px] sm:text-[10px] text-primary flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity min-w-0 flex-1">
                        <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        <span className="truncate">
                          {product.category?.parent?.name ? `${product.category.parent.name} > ${product.category.name}` : product.category?.name}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center justify-center h-5 sm:h-6 px-1.5 sm:px-2 rounded-full bg-emerald-500/10 text-[8px] sm:text-[10px] font-bold text-emerald-600 border border-emerald-500/20 shadow-sm transition-transform group-hover:scale-105">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1" />
                        {product.stock}
                      </div>
                    </div>

                    {/* Bottom Row: Price & Title */}
                    <div className="flex flex-col gap-1 sm:gap-2 z-10 w-full mt-4">
                      <div className={cn("text-foreground tabular-nums w-full leading-tight whitespace-nowrap overflow-visible", priceSizeClass)}>
                        {getCartCurrencySymbol(product)}{priceStr}
                      </div>
                      {productCurrency !== "TRY" && (
                        <div className="text-[10px] font-semibold text-muted-foreground">
                          ₺{formatCurrency(product.sellPrice)}
                        </div>
                      )}
                      <div className="text-muted-foreground text-[10px] sm:text-[12px] line-clamp-2 leading-tight font-medium overflow-hidden text-ellipsis h-[2.4em] sm:h-[2.6em]">
                        {product.name}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                  </button>
                );
              })}
            </div>
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
                <span className="text-xl  text-foreground">Aktif <span className="text-primary">Sepet</span></span>
                <p className="text-[10px] text-muted-foreground ">{cart.length} Ürün Seçildi</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-10 rounded-full text-[10px]  text-rose-500 hover:bg-rose-500/10 px-6 border border-rose-500/40">
              BOŞALT
            </Button>
          </div>

          <div className="p-8 border-b border-border/40 bg-muted/5">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-medium text-[11px]  text-muted-foreground tracking-[0.2em]">MÜŞTERİ BİLGİSİ</Label>
              <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-8 px-4 rounded-full text-[10px]  text-primary bg-primary/10 border border-primary/20 flex items-center gap-2 group hover:bg-primary hover:text-white transition-all">
                    <UserPlus className="h-3 w-3" /> YENİ EKLE
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border border-border/50 text-foreground shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
                  <div className="px-8 py-8 border-b border-border/40 flex flex-col gap-2 bg-muted/20">
                    <DialogTitle className="font-black text-xl uppercase tracking-tight">Hızlı Müşteri Kaydı</DialogTitle>
                    <DialogDescription className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                      Aktif sepete atamak için sisteme anında müşteri tanımlayın.
                    </DialogDescription>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="c-name" className="font-medium text-xs font-semibold text-muted-foreground">Ad Soyad / Firma Adı <span className="text-rose-500">*</span></Label>
                      <Input
                        id="c-name"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        className="bg-white/[0.03] border-border rounded-xl h-11 text-sm focus-visible:ring-1 focus-visible:ring-blue-500/50"
                      />
                    </div>
                    <PhoneInput
                      label="Telefon Numarası (Opsiyonel)"
                      id="c-phone"
                      value={newCustomer.phone}
                      onChange={(val: string) => setNewCustomer({ ...newCustomer, phone: val })}
                      className="bg-white/[0.03] border-border h-11"
                    />
                  </div>
                  <div className="px-6 py-4 bg-white/[0.02] border-t border-border flex justify-end gap-3">
                    <Button type="button" variant="ghost" className="h-10 px-5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-white" onClick={() => setIsNewCustomerOpen(false)}>
                      İptal
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomer}
                      className="h-10 px-6 rounded-lg text-xs  bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    >
                      {isCreatingCustomer ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Müşteriyi Kaydet ve Seç
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="bg-background border border-border/60 h-14 rounded-2xl text-[14px] font-medium text-foreground shadow-sm focus:ring-2 focus:ring-primary/10 px-6">
                <SelectValue placeholder="Müşteri Seçiniz (Hızlı Satış)" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border/60 text-foreground rounded-[1.5rem] shadow-2xl p-2 max-h-80">
                <SelectItem value="null" className="text-[13px] font-medium py-3 rounded-xl hover:bg-muted transition-colors">Varsayılan (İsimsiz)</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[13px]  py-4 rounded-xl hover:bg-primary/5 transition-all border-b border-border/10 last:border-none cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className=" leading-none text-foreground/90">{c.name}</span>
                      <span className="text-[10px] text-blue-500  leading-none mt-1">
                        {formatPhone(c.phone)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <p className=" text-[9px] opacity-40">Sepetiniz şu an boş</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group border-b border-border/40 last:border-none gap-6">
                    <div className="flex-1 min-w-0">
                      <span className="text-[15px]  text-foreground block leading-tight mb-1 truncate">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center rounded-xl border border-primary/35 bg-primary/10 px-2 py-1.5 shadow-sm transition-all group-hover:border-primary/60 group-hover:bg-primary/15">
                          <span className="text-[12px] text-primary font-black absolute left-3">{getCartCurrencySymbol(item)}</span>
                          <input
                            type="number"
                            value={getCartDisplayPrice(item)}
                            onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-none text-[14px] text-primary font-black focus:ring-0 w-24 pl-5 py-0 h-auto"
                            title="Sepet fiyatı değiştirilebilir"
                          />
                        </div>
                        {getCartItemCurrency(item) !== "TRY" && (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            ₺{formatCurrency(item.sellPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/40">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white transition-all active:scale-95"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-[14px]  text-foreground w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/40 active:scale-95 group-hover:shadow-lg group-hover:shadow-rose-500/10"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Section */}
          <div className="p-6 bg-muted/5 border-t border-border/40">
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { id: "CASH", label: "NAKİT", icon: Banknote },
                { id: "CREDIT_CARD", label: "KART", icon: CreditCard },
                { id: "BANK_TRANSFER", label: "HAVALE", icon: Landmark },
                { id: "DEBT", label: "VERESİYE", icon: History }
              ].map((method) => (
                <Button
                  key={method.id}
                  variant="ghost"
                  className={cn(
                    "h-16 flex flex-col gap-1.5 rounded-2xl border transition-all p-0 group",
                    paymentMethod === method.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105"
                      : "bg-muted/10 text-muted-foreground border-border/20 hover:bg-muted hover:border-border/50"
                  )}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <method.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", paymentMethod === method.id ? "text-primary-foreground" : "text-muted-foreground/60")} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                </Button>
              ))}
            </div>

            {loyaltyEnabled && totalPoints > 0 && (
              <div className="mb-5 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-primary flex items-center gap-2">
                      CÜZDAN BAKİYESİ KULLAN
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      Müşterinin {totalPoints} Puanı ({formatCurrency(totalPoints * pointValueTl)} TL değeri) var.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {applyLoyaltyDiscount && (
                    <span className="text-[10px] font-bold text-emerald-500">- ₺{formatCurrency(loyaltyDiscountAmount)}</span>
                  )}
                  <Checkbox
                    checked={applyLoyaltyDiscount}
                    onCheckedChange={(checked) => setApplyLoyaltyDiscount(!!checked)}
                    className="h-6 w-6 rounded-lg border-primary/50 data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] sm:text-[11px] text-muted-foreground tracking-[0.2em] opacity-70">ÖDENECEK TOPLAM</span>
                <div className="flex flex-col items-end">
                  {loyaltyDiscountAmount > 0 && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground line-through opacity-50">₺{formatCurrency(subtotal)}</span>
                  )}
                  <span className="text-2xl sm:text-4xl text-foreground drop-shadow-sm font-bold">₺{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <Button
                className={cn(
                  "h-14 sm:h-16 w-full text-[13px] sm:text-[14px] font-bold gap-3 sm:gap-4 rounded-2xl sm:rounded-[1.5rem] transition-all shadow-2xl border active:scale-[0.98] whitespace-normal text-center leading-tight",
                  paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-rose-500/10"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/20 border-primary/20"
                )}
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>İŞLENİYOR...</span>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">
                      {paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")
                        ? "MÜŞTERİ SEÇMENİZ GEREKİYOR (VERESİYE)"
                        : "SATIŞI TAMAMLA & FİŞ YAZDIR"}
                    </span>
                    {paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")
                      ? <AlertCircle className="h-5 w-5 shrink-0" />
                      : <CheckCircle className="h-5 w-5 shrink-0" />}
                  </>
                )}
              </Button>
            </div>
          </div>
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
}
