"use client";

import { useState, useMemo, useRef, useEffect, useTransition, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { UnifiedSaleModal } from "./unified-sale-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn, formatPhone, formatCurrency, normalizeSearchText } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, ScanLine } from "lucide-react";
import { getSettings } from "@/lib/actions/setting-actions";
import { ScannerModal } from "@/components/scanner/scanner-modal";
import { useScanner } from "@/hooks/use-scanner";
import { useDashboardData, useTenant } from "@/lib/context/dashboard-data-context";
import { ProductCard } from "./parts/product-card";
import { CartItem } from "./parts/cart-item";
import { CustomerSelector } from "./parts/customer-selector";
import { CheckoutSummary } from "./parts/checkout-summary";
import { QuickCreateProductModal } from "@/components/product/quick-create-product-modal";
import { SmartStockGuardrailModal } from "./parts/smart-stock-guardrail-modal";

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
  const products = (posData?.products || []) as { id: string; name: string; barcode?: string | null; sku?: string | null; category?: { name?: string; parent?: { name?: string } | null } | null; categoryId?: string | null; buyPrice?: number; sellPrice?: number; buyPriceUsd?: number; sellPriceUsd?: number; priceCurrency?: string; stock?: number | null }[];
  const categories = (posData?.categories || []) as { id: string; name: string }[];
  const accounts = (posData?.accounts || []) as { id: string; name: string; type: "CASH" | "BANK" | "POS" | "CREDIT_CARD"; balance?: number; currency?: string }[];

  const [scannerRoomId, setScannerRoomId] = useState<string>("");
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Frictionless & Smart Eye State
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickProductName, setQuickProductName] = useState("");
  const [guardrailOpen, setGuardrailOpen] = useState(false);
  const [guardrailProduct, setGuardrailProduct] = useState<any>(null);
  const tenantConfig = useTenant();

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
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);
  const [saleDescription, setSaleDescription] = useState("");

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
    const searchNormalized = normalizeSearchText(debouncedSearchTerm);
    const isSearching = searchNormalized.length > 0;

    return products.filter((p) => {
      const isService = p.category?.name?.toLowerCase() === "hizmet";

      // Always filter out items with no stock, unless it's a service
      if (!isService && p.stock != null && p.stock <= 0) return false;

      const matchesSearch = !isSearching ||
        normalizeSearchText(p.name).includes(searchNormalized) ||
        (p.barcode && normalizeSearchText(p.barcode).includes(searchNormalized)) ||
        (p.sku && normalizeSearchText(p.sku).includes(searchNormalized)) ||
        (p.category?.name && normalizeSearchText(p.category.name).includes(searchNormalized));

      const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;

      // Arama yapılıyorsa kategori sınırlamasını kaldır (global arama), aksi halde kategoriye göre filtrele
      if (isSearching) {
        return matchesSearch;
      }

      return matchesCategory;
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

  const { rates: exchangeRates, defaultCurrency = "TRY", shopId } = useDashboardData();

  const usdRate = useMemo(() => {
    const rawRate = exchangeRates?.usd || exchangeRates?.USD;
    const numRate = typeof rawRate === "string" ? parseFloat(rawRate.replace(",", ".")) : Number(rawRate);
    return isNaN(numRate) || numRate <= 0 ? 34.5 : numRate;
  }, [exchangeRates]);

  const eurRate = useMemo(() => {
    const rawRate = exchangeRates?.eur || exchangeRates?.EUR;
    const numRate = typeof rawRate === "string" ? parseFloat(rawRate.replace(",", ".")) : Number(rawRate);
    return isNaN(numRate) || numRate <= 0 ? 37.0 : numRate;
  }, [exchangeRates]);

  // Active sale currency (User can toggle freely between TRY and USD)
  const [saleCurrency, setSaleCurrency] = useState<"TRY" | "USD">(
    defaultCurrency === "USD" ? "USD" : "TRY"
  );

  useEffect(() => {
    if (defaultCurrency === "USD" || defaultCurrency === "TRY") {
      setSaleCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  const toggleSaleCurrency = (newCurrency: "TRY" | "USD") => {
    if (newCurrency === saleCurrency) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        let newUnitPrice = item.unitPrice ?? item.sellPrice;
        if (newCurrency === "USD") {
          newUnitPrice = Number((newUnitPrice / usdRate).toFixed(2));
        } else {
          newUnitPrice = Number((newUnitPrice * usdRate).toFixed(2));
        }
        return {
          ...item,
          unitPrice: newUnitPrice,
          sellPrice: newCurrency === "TRY" ? newUnitPrice : Number((newUnitPrice * usdRate).toFixed(2)),
          sellPriceUsd: newCurrency === "USD" ? newUnitPrice : Number((newUnitPrice / usdRate).toFixed(2)),
        };
      })
    );
    setSaleCurrency(newCurrency);
    toast({
      title: `Para Birimi: ${newCurrency === "USD" ? "Dolar ($)" : "Türk Lirası (₺)"}`,
      description: `Sepet ve ürün fiyatları ${newCurrency} olarak güncellendi.`,
    });
  };

  const getCartCurrencySymbol = useCallback(() => {
    if (saleCurrency === "USD") return "$";
    return "₺";
  }, [saleCurrency]);

  const getCartDisplayPrice = useCallback((item: any) => {
    if (!item) return 0;
    if (saleCurrency === "USD") {
      if (item.sellPriceUsd !== null && item.sellPriceUsd !== undefined && Number(item.sellPriceUsd) > 0) {
        return Number(Number(item.sellPriceUsd).toFixed(2));
      }
      const tl = Number(item.sellPrice || 0);
      return Number((tl / usdRate).toFixed(2));
    } else {
      if (item.sellPrice !== null && item.sellPrice !== undefined && Number(item.sellPrice) > 0) {
        return Number(Number(item.sellPrice).toFixed(2));
      }
      if (item.sellPriceUsd !== null && item.sellPriceUsd !== undefined && Number(item.sellPriceUsd) > 0) {
        return Number((Number(item.sellPriceUsd) * usdRate).toFixed(2));
      }
      return 0;
    }
  }, [saleCurrency, usdRate]);

  const getEquivalentDisplay = useCallback((item: any) => {
    if (!exchangeRates) return "";
    if (saleCurrency === "USD") {
      let priceTl = 0;
      if (item.sellPriceUsd && Number(item.sellPriceUsd) > 0) {
        priceTl = Number(item.sellPriceUsd) * usdRate;
      } else {
        priceTl = item.sellPrice || 0;
      }
      return `₺${Number(priceTl.toFixed(2)).toLocaleString("tr-TR")}`;
    } else {
      const priceUsd = (item.sellPriceUsd && Number(item.sellPriceUsd) > 0)
        ? Number(item.sellPriceUsd)
        : ((item.sellPrice || 0) / usdRate);
      return `$${Number(priceUsd.toFixed(2)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }, [saleCurrency, usdRate, exchangeRates]);

  const addToCart = useCallback((product: any, forceAllowZero = false) => {
    if (!product) return;

    const isService = product.category?.name?.toLowerCase() === "hizmet";
    const currentStock = Number(product.stock || 0);

    // Smart Eye Stock Guardrail: Never block abruptly; guide proactively
    if (!forceAllowZero && !isService && currentStock <= 0) {
      setGuardrailProduct(product);
      setGuardrailOpen(true);
      return;
    }

    const unitPrice = getCartDisplayPrice(product);

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        if (!forceAllowZero && !isService && existing.quantity >= currentStock) {
          setGuardrailProduct(product);
          setGuardrailOpen(true);
          return currentCart;
        }
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const cartItem = {
        ...product,
        quantity: 1,
        unitPrice,
        sellPrice: saleCurrency === "TRY" ? unitPrice : Number((unitPrice * usdRate).toFixed(2)),
        sellPriceUsd: saleCurrency === "USD" ? unitPrice : Number((unitPrice / usdRate).toFixed(2)),
      };
      return [...currentCart, cartItem];
    });
  }, [getCartDisplayPrice, saleCurrency, usdRate]);

  const addBarcodeMatchToCart = (value: string) => {
    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) return null;

    const product = products.find((p: any) =>
      p.barcode?.toUpperCase() === normalizedValue ||
      p.sku?.toUpperCase() === normalizedValue
    );

    // Frictionless Action: If product is not found, offer instant creation inline without page hopping
    if (!product) {
      setQuickProductName(normalizedValue);
      setQuickProductOpen(true);
      toast({
        title: "Ürün Bulunamadı • Hızlı Kayıt",
        description: `${normalizedValue} barkodu için ürün oluşturma ekranı açıldı.`,
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
        const isService = originalProduct?.category?.name?.toLowerCase() === "hizmet";
        const availableStock = Number(originalProduct?.stock || 0);

        if (delta > 0 && !isService && newQty > availableStock) {
          setGuardrailProduct(originalProduct || item);
          setGuardrailOpen(true);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, [products]);

  const updatePrice = useCallback((id: string, newPrice: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        if (defaultCurrency === "USD") {
          const tlPrice = Number((newPrice * usdRate).toFixed(2));
          return {
            ...item,
            sellPriceUsd: newPrice,
            sellPrice: tlPrice,
            unitPrice: tlPrice,
          };
        } else if (defaultCurrency === "EUR") {
          const tlPrice = Number((newPrice * eurRate).toFixed(2));
          return {
            ...item,
            sellPriceEur: newPrice,
            sellPrice: tlPrice,
            unitPrice: tlPrice,
          };
        } else {
          return { ...item, sellPrice: newPrice, unitPrice: newPrice };
        }
      }
      return item;
    }));
  }, [defaultCurrency, usdRate, eurRate]);

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
    },
    { allowGlobal: true }
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
    if (shopId) {
      setScannerRoomId(shopId);
      initializeScannerRoom(shopId);
    }
  }, [initializeScannerRoom, shopId]);

  const displaySubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (getCartDisplayPrice(item) * item.quantity), 0);
  }, [cart, getCartDisplayPrice]);

  const subtotal = useMemo(() => {
    // subtotal is always the TL base for backend and equivalent calculations
    // Calculate dynamically to be reactive to exchange rate changes
    return cart.reduce((sum, item) => {
      const itemTlPrice = item.sellPriceUsd ? (item.sellPriceUsd * usdRate) : (item.sellPrice || 0);
      return sum + (Number(itemTlPrice.toFixed(2)) * item.quantity);
    }, 0);
  }, [cart, usdRate]);

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

  const eligibleAccounts = useMemo(() => {
    if (paymentMethod === "DEBT") return [];
    
    let eligibleAccs = accounts;
    if (paymentMethod === "CASH") eligibleAccs = accounts.filter((a) => a.type === "CASH");
    else if (paymentMethod === "CREDIT_CARD") eligibleAccs = accounts.filter((a) => a.type === "POS" || a.type === "CREDIT_CARD");
    else if (paymentMethod === "BANK_TRANSFER" || paymentMethod === "TRANSFER") eligibleAccs = accounts.filter((a) => a.type === "BANK");

    return eligibleAccs.length > 0 ? eligibleAccs : accounts;
  }, [accounts, paymentMethod]);

  useEffect(() => {
    if (paymentMethod === "DEBT") {
      setSelectedAccountId("");
      return;
    }
    if (eligibleAccounts.length === 0) {
      setSelectedAccountId("");
      return;
    }
    const savedId = typeof window !== "undefined" ? localStorage.getItem(`pos_last_account_${paymentMethod}`) : null;
    if (savedId && eligibleAccounts.some((a) => a.id === savedId)) {
      setSelectedAccountId(savedId);
    } else if (!selectedAccountId || !eligibleAccounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(eligibleAccounts[0].id);
    }
  }, [eligibleAccounts, paymentMethod]);


  const displayTotal = useMemo(() => {
    const discount = saleCurrency === "USD" ? (loyaltyDiscountAmount / usdRate) : loyaltyDiscountAmount;
    return Math.max(0, displaySubtotal - discount);
  }, [displaySubtotal, loyaltyDiscountAmount, saleCurrency, usdRate]);

  // Pre-formatted strings for consistent display across components
  const { formattedTotal, formattedSubtotal, formattedTax, formattedEquivalentTotal } = useMemo(() => {
    const symbol = getCartCurrencySymbol();
    const isUSD = saleCurrency === "USD";
    const locale = isUSD ? 'en-US' : 'tr-TR';

    const fmt = (val: number) => symbol + val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Tax is included in our prices (20%)
    const taxValue = displayTotal * 0.166666; // 20% in 120% total
    const subtotalNoTax = displayTotal - taxValue;

    return {
      formattedTotal: fmt(displayTotal),
      formattedSubtotal: fmt(subtotalNoTax),
      formattedTax: fmt(taxValue),
      formattedEquivalentTotal: `(${getEquivalentDisplay(
        isUSD ? { sellPriceUsd: displayTotal } : { sellPrice: finalTotal }
      )})`
    };
  }, [displayTotal, saleCurrency, getCartCurrencySymbol, getEquivalentDisplay, finalTotal]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")) {
      return;
    }
    if (paymentMethod !== "DEBT" && !selectedAccountId) {
      toast({ title: "Kasa Seçimi Gerekli", description: "Satışı tamamlamak için bir ödeme hesabı seçin.", variant: "destructive" });
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
            unitPrice: Number(((item.sellPrice !== undefined ? item.sellPrice : item.unitPrice) || 0).toFixed(2))
          })),
          totalAmount: Number(displayTotal.toFixed(2)),
          currency: saleCurrency,
          paymentMethod,
          accountId: paymentMethod === "DEBT" ? undefined : selectedAccountId,
          discountAmount: saleCurrency === "USD"
            ? Number((loyaltyDiscountAmount / usdRate).toFixed(2))
            : Number(loyaltyDiscountAmount.toFixed(2)),
          usedPoints,
          description: saleDescription
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
          setSelectedAccountId("");
          setSaleDescription("");
          // 4. Invalidate to seamlessly update server state without reload
          queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-init"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-revenue-analysis"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
          queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });

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
      "flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-6 bg-transparent sm:bg-background h-full overflow-hidden p-0 sm:p-4 lg:p-6 relative transition-all duration-700",
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
      <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden bg-card/60 sm:bg-card border-0 sm:border sm:border-border/40 rounded-2xl sm:rounded-[2.5rem] shadow-none sm:shadow-sm">
          {/* Header & Search - Single Clean Row on Mobile */}
          <div className="p-3 sm:p-8 border-b border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-8 bg-muted/5">
            <div className="flex items-center justify-between sm:justify-start gap-3 flex-shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-4">
                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                  <ShoppingCart className="h-4.5 w-4.5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-bold text-base sm:text-2xl text-foreground leading-none">Hızlı <span className="text-primary">Satış</span></h2>
                  <p className="text-[8px] sm:text-[11px] text-muted-foreground font-semibold leading-none mt-1 uppercase tracking-wider">POS v2.0</p>
                </div>
              </div>

              {/* Action buttons next to title on mobile */}
              <div className="flex sm:hidden items-center rounded-lg border border-border/40 bg-muted/30 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSaleCurrency("TRY")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black transition-all",
                    saleCurrency === "TRY" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground"
                  )}
                >
                  ₺
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaleCurrency("USD")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black transition-all",
                    saleCurrency === "USD" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground"
                  )}
                >
                  $
                </button>
              </div>
              <div className="flex sm:hidden items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setQuickProductName(displaySearchTerm || "");
                    setQuickProductOpen(true);
                  }}
                  className="h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 text-[10px] font-bold gap-1 shrink-0 transition-all"
                  title="Sayfadan ayrılmadan yeni ürün kaydet"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ürün</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 rounded-lg border-border/40 hover:bg-muted/50 transition-all shrink-0"
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full sm:max-w-xl">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Ürün adı veya barkod okut..."
                  className="pl-10 pr-10 sm:pl-12 sm:pr-12 bg-muted/30 border-border/40 h-11 sm:h-12 rounded-xl sm:rounded-2xl text-xs sm:text-xs focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
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
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg sm:rounded-xl transition-colors"
                  onClick={() => setIsScannerModalOpen(true)}
                >
                  <ScanLine className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center rounded-xl border border-border/40 bg-muted/40 p-1 shrink-0">
              <button
                type="button"
                onClick={() => toggleSaleCurrency("TRY")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black transition-all",
                  saleCurrency === "TRY" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                ₺ TL
              </button>
              <button
                type="button"
                onClick={() => toggleSaleCurrency("USD")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black transition-all",
                  saleCurrency === "USD" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                $ USD
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                type="button"
                onClick={() => {
                  setQuickProductName(displaySearchTerm || "");
                  setQuickProductOpen(true);
                }}
                className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 sm:px-4 text-xs font-bold gap-1.5 shrink-0 transition-all"
                title="Sayfadan ayrılmadan yeni ürün kaydet"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Hızlı Ürün</span>
              </Button>
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
              <div className="h-full w-full flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <Package className="h-8 w-8" />
                </div>
                <p className="text-base font-bold text-foreground tracking-tight">
                  {displaySearchTerm ? `"${displaySearchTerm}" ile eşleşen ürün bulunamadı` : "Bu kategoride ürün bulunamadı"}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                  Sayfadan ayrılmadan bu ürünü anında sisteme kaydedebilir ve doğrudan sepete ekleyebilirsiniz.
                </p>
                <Button
                  onClick={() => {
                    setQuickProductName(displaySearchTerm || "");
                    setQuickProductOpen(true);
                  }}
                  className="h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>{displaySearchTerm ? `"${displaySearchTerm}" Ürününü Anında Oluştur` : "Hızlı Ürün Oluştur"}</span>
                </Button>
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
                    displayPrice={getCartDisplayPrice(product)}
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

          <div className="p-8 border-b border-border/40 bg-muted/5 flex flex-col gap-4">
            <CustomerSelector
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              onNewCustomer={handleQuickCreateCustomer}
              isProcessing={isCreatingCustomer}
            />
            <Textarea 
              placeholder="Açıklama / Not (İsteğe Bağlı)" 
              value={saleDescription} 
              onChange={(e) => setSaleDescription(e.target.value)} 
              className="text-xs min-h-[60px] bg-background border-border/40 resize-none rounded-xl"
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
                    displayPrice={getCartDisplayPrice(item)}
                  />
                ))
              )}
            </div>
          </div>

          <CheckoutSummary
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
            defaultCurrency={defaultCurrency}
            rates={exchangeRates}
            formattedTotal={formattedTotal}
            formattedSubtotal={formattedSubtotal}
            formattedTax={formattedTax}
            formattedEquivalentTotal={formattedEquivalentTotal}
            accounts={eligibleAccounts}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
          />
        </div>
      </div>

      {lastSale && (
        <UnifiedSaleModal
          isOpen={showReceipt}
          onClose={closeReceiptAndReload}
          sale={lastSale}
          rates={exchangeRates as any}
          initialDefaultCurrency={defaultCurrency}
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
      <ScannerModal open={isScannerModalOpen} onOpenChange={setIsScannerModalOpen} shopIdOrUserId={shopId || "global"} />

      {/* Frictionless Instant Product Creator */}
      <QuickCreateProductModal
        open={quickProductOpen}
        onOpenChange={setQuickProductOpen}
        categories={categories as any}
        initialName={quickProductName}
        onSuccess={(created) => {
          queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
          if (created) {
            addToCart(created, true);
            setDisplaySearchTerm("");
            toast({
              title: "Ürün Eklendi",
              description: `${created.name} oluşturuldu ve sepete aktarıldı.`,
            });
          }
        }}
      />

      {/* Smart Eye Stock Guardrail */}
      <SmartStockGuardrailModal
        open={guardrailOpen}
        onOpenChange={setGuardrailOpen}
        product={guardrailProduct}
        onStockAddedAndAddToCart={(updatedProduct) => {
          queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
          addToCart(updatedProduct, true);
        }}
        onAllowZeroStockSale={(prod) => {
          addToCart(prod, true);
        }}
      />
    </div>
  );

  if (!mounted) return null;

  if (isFullscreen && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
