"use client";

import { useState, useMemo, useRef, useEffect, useTransition, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  ScanLine,
  LayoutGrid,
  List,
  Filter,
  User,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { getSettings } from "@/lib/actions/setting-actions";
import { ScannerModal } from "@/components/scanner/scanner-modal";
import { useScanner } from "@/hooks/use-scanner";
import { useDashboardData, useTenant } from "@/lib/context/dashboard-data-context";
import { ProductCard } from "./parts/product-card";
import { CartItem } from "./parts/cart-item";
import { CustomerSelector } from "./parts/customer-selector";
import { CustomerModal } from "./parts/customer-modal";
import { CheckoutSummary } from "./parts/checkout-summary";
import { QuickCreateProductModal } from "@/components/product/quick-create-product-modal";
import { SmartStockGuardrailModal } from "./parts/smart-stock-guardrail-modal";
import { getCategoryTheme } from "@/lib/category-colors";

export function POSInterface({ initialSaleId }: {
  initialSaleId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: posData, isLoading: isPosLoading } = useQuery({
    queryKey: ["pos-initial-data"],
    queryFn: () => getPOSInitialData(),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
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

  // Frictionless Instant Product Creator State
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickProductName, setQuickProductName] = useState("");

  // Smart Eye Stock Guardrail State
  const [guardrailOpen, setGuardrailOpen] = useState(false);
  const [guardrailProduct, setGuardrailProduct] = useState<any>(null);

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

  // Görünüm Modu (Grid / List)
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_view_mode");
      if (saved === "GRID" || saved === "LIST") setViewMode(saved);
    }
  }, []);
  const handleViewModeChange = (mode: "GRID" | "LIST") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_view_mode", mode);
    }
  };

  // Stok Filtresi (Tümü / Stokta / Kritik)
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "CRITICAL">("ALL");

  // Ekrana Göre Sayfalama (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "ALL">(16);

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

  // Mobil Sekmeli Görünüm (Ürünler vs Sepet) & Müşteri Modalı
  const [mobileTab, setMobileTab] = useState<"PRODUCTS" | "CART">("PRODUCTS");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

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
    }, 250);
    return () => clearTimeout(timer);
  }, [displaySearchTerm]);

  // Category product counters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.length };
    products.forEach((p) => {
      const cid = p.categoryId || "OTHER";
      counts[cid] = (counts[cid] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const searchNormalized = normalizeSearchText(debouncedSearchTerm);
    const isSearching = searchNormalized.length > 0;

    return products.filter((p) => {
      const isService = p.category?.name?.toLowerCase() === "hizmet";
      const stock = Number(p.stock || 0);

      // Stok Filtresi
      if (stockFilter === "IN_STOCK" && !isService && stock <= 0) return false;
      if (stockFilter === "CRITICAL" && !isService && (stock <= 0 || stock > 5)) return false;

      const matchesSearch = !isSearching ||
        normalizeSearchText(p.name).includes(searchNormalized) ||
        (p.barcode && normalizeSearchText(p.barcode).includes(searchNormalized)) ||
        (p.sku && normalizeSearchText(p.sku).includes(searchNormalized)) ||
        (p.category?.name && normalizeSearchText(p.category.name).includes(searchNormalized));

      const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;

      if (isSearching) {
        return matchesSearch;
      }

      return matchesCategory;
    });
  }, [products, debouncedSearchTerm, selectedCategory, stockFilter]);

  // Reset page when search or category/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategory, stockFilter]);

  const totalPages = Math.max(1, pageSize === "ALL" ? 1 : Math.ceil(filteredProducts.length / (pageSize as number)));

  const paginatedProducts = useMemo(() => {
    if (pageSize === "ALL") return filteredProducts;
    const size = pageSize as number;
    const start = (currentPage - 1) * size;
    return filteredProducts.slice(start, start + size);
  }, [filteredProducts, currentPage, pageSize]);

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
      toast({ title: "Hata", variant: "destructive", description: "Hızlı kayıt yapılamadı." });
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
    return saleCurrency === "USD" ? "$" : "₺";
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

  // Hızlı Seçim Ufak Yeşil Popup Yığını (Toast Stack)
  const [selectionToasts, setSelectionToasts] = useState<Array<{
    id: string;
    name: string;
    price: string;
  }>>([]);

  const addSelectionToast = useCallback((product: any) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const priceVal = getCartDisplayPrice(product);
    const priceStr = formatCurrency(priceVal);
    const symbol = getCartCurrencySymbol();
    const newToast = {
      id,
      name: product.name,
      price: `${symbol}${priceStr}`
    };

    setSelectionToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setSelectionToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1800);
  }, [getCartDisplayPrice, getCartCurrencySymbol]);

  const addToCart = useCallback((product: any, forceAllowZero = false) => {
    if (!product) return;

    const isService = product.category?.name?.toLowerCase() === "hizmet";
    const currentStock = Number(product.stock || 0);

    // Smart Eye Stock Guardrail
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

    addSelectionToast(product);
  }, [getCartDisplayPrice, saleCurrency, usdRate, addSelectionToast]);

  const addBarcodeMatchToCart = (value: string) => {
    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) return null;

    const product = products.find((p: any) =>
      p.barcode?.toUpperCase() === normalizedValue ||
      p.sku?.toUpperCase() === normalizedValue
    );

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

  useEffect(() => {
    syncCartToMobile(cart);
  }, [cart, syncCartToMobile]);

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

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = item.sellPrice !== undefined ? item.sellPrice : item.unitPrice;
      return acc + (p || 0) * item.quantity;
    }, 0);
  }, [cart]);

  const displaySubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = item.unitPrice !== undefined ? item.unitPrice : item.sellPrice;
      return acc + (p || 0) * item.quantity;
    }, 0);
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
  }, [eligibleAccounts, paymentMethod, selectedAccountId]);

  const displayTotal = useMemo(() => {
    const discount = saleCurrency === "USD" ? (loyaltyDiscountAmount / usdRate) : loyaltyDiscountAmount;
    return Math.max(0, displaySubtotal - discount);
  }, [displaySubtotal, loyaltyDiscountAmount, saleCurrency, usdRate]);

  const { formattedTotal, formattedSubtotal, formattedTax, formattedEquivalentTotal } = useMemo(() => {
    const symbol = getCartCurrencySymbol();
    const isUSD = saleCurrency === "USD";
    const locale = isUSD ? 'en-US' : 'tr-TR';

    const fmt = (val: number) => symbol + val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const taxValue = displayTotal * 0.166666;
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
          items: cart.map(item => {
            let price = item.unitPrice;
            if (saleCurrency === "USD") {
              price = item.sellPriceUsd !== undefined && Number(item.sellPriceUsd) > 0
                ? Number(item.sellPriceUsd)
                : (item.unitPrice ? (item.unitPrice > 1000 && item.sellPrice ? item.sellPrice / usdRate : item.unitPrice) : (item.sellPrice ? item.sellPrice / usdRate : 0));
            } else {
              price = item.sellPrice !== undefined && Number(item.sellPrice) > 0
                ? Number(item.sellPrice)
                : (item.unitPrice || 0);
            }
            return {
              productId: item.id,
              quantity: item.quantity,
              unitPrice: Number(Number(price || 0).toFixed(2))
            };
          }),
          totalAmount: Number(displayTotal.toFixed(2)),
          currency: saleCurrency,
          paymentMethod,
          accountId: paymentMethod === "DEBT" ? undefined : selectedAccountId,
          discountAmount: saleCurrency === "USD"
            ? Number((loyaltyDiscountAmount / usdRate).toFixed(2))
            : Number(loyaltyDiscountAmount.toFixed(2)),
          usedPoints,
          description: saleDescription || undefined
        });

        const saleData = (result as any)?.data || (result as any)?.sale;
        if (result.success && saleData) {
          toast({ title: "Satış Başarılı", description: "İşlem kaydedildi ve stoklar güncellendi." });
          setLastSale(saleData);
          setShowReceipt(true);
          setCart([]);
          setSelectedCustomerId(undefined);
          setCustomerSearch("");
          setSaleDescription("");
          setMobileTab("PRODUCTS");
          queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-revenue-analysis"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-service-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
          queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["sales-history"] });
          queryClient.invalidateQueries({ queryKey: ["sales-history-report"] });
          queryClient.invalidateQueries({ queryKey: ["daily-session"] });
        } else {
          toast({ title: "Hata", description: result.error || "Satış kaydedilemedi", variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Hata", description: e.message || "Bir hata oluştu", variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const closeReceiptAndReload = () => {
    setShowReceipt(false);
    setLastSale(null);
  };

  const content = (
    <div ref={containerRef} className={cn(
      "flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-2.5 h-full lg:h-[calc(100vh-4.75rem)] overflow-hidden p-0 relative transition-all duration-300",
      isFullscreen && "fixed inset-0 z-[40] p-2.5 sm:p-4 bg-background/95 backdrop-blur-xl",
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
      <div className={cn(
        "lg:col-span-8 flex flex-col h-full min-h-0 bg-card/85 dark:bg-[#0c121d]/85 border border-border/40 rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl",
        mobileTab === "CART" && "hidden lg:flex"
      )}>
        {/* Mobile Top Segmented Tab Switcher */}
        <div className="flex lg:hidden items-center p-1 bg-muted/20 border-b border-border/30 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("PRODUCTS")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              mobileTab === "PRODUCTS"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Ürünler ({filteredProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("CART")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all relative",
              mobileTab === "CART"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Sepet ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
            {cart.length > 0 && (
              <span className="ml-1 text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                {getCartCurrencySymbol()}{displayTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>

        {/* Top Controls & Search Bar */}
        <div className="p-2 sm:p-2.5 border-b border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-muted/10 shrink-0">
          {/* Title, Currency & Customer Trigger */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-xs shrink-0">
                <ShoppingCart className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h2 className="font-extrabold text-sm sm:text-base text-foreground leading-none tracking-tight">Hızlı Satış</h2>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">POS Terminali</span>
              </div>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center rounded-xl border border-border/40 bg-muted/30 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleSaleCurrency("TRY")}
                className={cn(
                  "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black transition-all",
                  saleCurrency === "TRY" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                ₺ TL
              </button>
              <button
                type="button"
                onClick={() => toggleSaleCurrency("USD")}
                className={cn(
                  "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black transition-all",
                  saleCurrency === "USD" ? "bg-blue-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                $ USD
              </button>
            </div>

            {/* Customer Quick Trigger Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCustomerModalOpen(true)}
              className={cn(
                "h-8 rounded-xl px-2.5 text-xs font-bold gap-1.5 shrink-0 border transition-all",
                selectedCustomer
                  ? "bg-primary/10 border-primary/30 text-primary shadow-xs"
                  : "bg-card/70 border-border/40 text-muted-foreground hover:text-foreground"
              )}
              title="Müşteri Seç veya Değiştir"
            >
              {selectedCustomer ? <UserCheck className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="truncate max-w-[85px] sm:max-w-[120px]">{selectedCustomer ? selectedCustomer.name : "Müşteri Seç"}</span>
            </Button>
          </div>

          {/* Search Box */}
          <div className="flex-1 w-full sm:max-w-xs md:max-w-sm">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Ürün adı, barkod okut veya ara..."
                className="pl-8 pr-14 bg-background/80 border-border/40 h-8.5 rounded-xl text-xs focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
                value={displaySearchTerm}
                onChange={(e) => setDisplaySearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && addBarcodeMatchToCart(displaySearchTerm)) {
                    e.preventDefault();
                  }
                }}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {displaySearchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6.5 w-6.5 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => setDisplaySearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6.5 w-6.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  onClick={() => setIsScannerModalOpen(true)}
                  title="Barkod Okuyucu Aç"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Actions: Stock Filter, View Mode, Fast Product, Fullscreen */}
          <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end flex-wrap">
            {/* Stock Filter Pills */}
            <div className="flex items-center rounded-xl border border-border/40 bg-muted/30 p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setStockFilter("ALL")}
                className={cn(
                  "px-2 py-0.5 rounded-lg font-bold uppercase transition-all",
                  stockFilter === "ALL" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("IN_STOCK")}
                className={cn(
                  "px-2 py-0.5 rounded-lg font-bold uppercase transition-all",
                  stockFilter === "IN_STOCK" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Stokta
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("CRITICAL")}
                className={cn(
                  "px-2 py-0.5 rounded-lg font-bold uppercase transition-all",
                  stockFilter === "CRITICAL" ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Kritik
              </button>
            </div>

            {/* View Mode (Grid vs List) */}
            <div className="flex items-center rounded-xl border border-border/40 bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => handleViewModeChange("GRID")}
                className={cn(
                  "p-1 rounded-lg transition-all",
                  viewMode === "GRID" ? "bg-card text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"
                )}
                title="Izgara Görünümü"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("LIST")}
                className={cn(
                  "p-1 rounded-lg transition-all",
                  viewMode === "LIST" ? "bg-card text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"
                )}
                title="Kompakt Liste Görünümü"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Product Button */}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setQuickProductName(displaySearchTerm || "");
                setQuickProductOpen(true);
              }}
              className="h-7.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 text-xs font-bold gap-1 shrink-0 transition-all shadow-xs"
              title="Yeni ürün oluştur"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">Ürün</span>
            </Button>

            {/* Fullscreen Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="h-7.5 w-7.5 rounded-xl border-border/40 hover:bg-muted/50 transition-all shrink-0"
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Category Rail (Compact, Scrollable) */}
        <div className="px-2.5 sm:px-3 py-1.5 border-b border-border/30 bg-muted/15 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "px-3 py-1 rounded-xl text-[10px] uppercase font-bold tracking-wider shrink-0 transition-all border",
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card/70 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            TÜMÜ ({products.length})
          </button>
          {categories.map((cat: any) => {
            const catTheme = getCategoryTheme(cat.name || cat.id);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] uppercase font-bold tracking-wider shrink-0 transition-all border",
                  isSelected
                    ? catTheme.pillActive
                    : catTheme.pillInactive
                )}
              >
                {cat.name} {categoryCounts[cat.id] ? `(${categoryCounts[cat.id]})` : ""}
              </button>
            );
          })}
        </div>

        {/* Product Items Area */}
        <div className={cn(
          "flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 custom-scrollbar bg-muted/5 relative",
          cart.length > 0 && "pb-24 lg:pb-3"
        )}>
          {isPosLoading && products.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin opacity-50" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-inner">
                <Package className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-foreground tracking-tight">
                {displaySearchTerm ? `"${displaySearchTerm}" ile eşleşen ürün bulunamadı` : "Bu kategoride ürün bulunamadı"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Sayfadan ayrılmadan bu ürünü anında sisteme kaydedebilir ve sepete aktarabilirsiniz.
              </p>
              <Button
                onClick={() => {
                  setQuickProductName(displaySearchTerm || "");
                  setQuickProductOpen(true);
                }}
                className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-md shadow-primary/20 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>{displaySearchTerm ? `"${displaySearchTerm}" Oluştur` : "Hızlı Ürün Oluştur"}</span>
              </Button>
            </div>
          ) : viewMode === "GRID" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  getEquivalentDisplay={getEquivalentDisplay}
                  getCartCurrencySymbol={getCartCurrencySymbol}
                  displayPrice={getCartDisplayPrice(product)}
                  isCompact={false}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  getEquivalentDisplay={getEquivalentDisplay}
                  getCartCurrencySymbol={getCartCurrencySymbol}
                  displayPrice={getCartDisplayPrice(product)}
                  isCompact={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="h-10 px-3 border-t border-border/40 bg-card/80 backdrop-blur-md flex items-center justify-between shrink-0 text-xs text-muted-foreground select-none">
          <div className="flex items-center gap-2">
            <span className="font-bold tabular-nums text-foreground text-[11px]">
              {filteredProducts.length === 0 ? "0 ürün" : `${(currentPage - 1) * (pageSize === "ALL" ? filteredProducts.length : (pageSize as number)) + 1} - ${Math.min(currentPage * (pageSize === "ALL" ? filteredProducts.length : (pageSize as number)), filteredProducts.length)} / ${filteredProducts.length} Ürün`}
            </span>
            <div className="hidden sm:flex items-center gap-1 text-[10px] ml-2">
              <span className="opacity-70">Sayfa Başı:</span>
              {[12, 16, 24, "ALL"].map((size) => (
                <button
                  key={String(size)}
                  onClick={() => { setPageSize(size as any); setCurrentPage(1); }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold transition-all",
                    pageSize === size ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {size === "ALL" ? "Tümü" : size}
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-6.5 px-2 text-[10px] font-bold rounded-lg"
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                <span className="hidden sm:inline">Önceki</span>
              </Button>
              <span className="text-[11px] font-bold text-foreground tabular-nums px-1.5">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-6.5 px-2 text-[10px] font-bold rounded-lg"
              >
                <span className="hidden sm:inline">Sonraki</span>
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cart and Customer Selection (Right Pane) */}
      <div className={cn(
        "lg:col-span-4 flex flex-col h-full min-h-0 bg-card/85 dark:bg-[#0c121d]/85 border border-border/40 rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl",
        mobileTab === "PRODUCTS" && "hidden lg:flex"
      )}>
        {/* Mobile Top Segmented Tab Switcher */}
        <div className="flex lg:hidden items-center p-1 bg-muted/20 border-b border-border/30 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("PRODUCTS")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              mobileTab === "PRODUCTS"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Ürünler ({filteredProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("CART")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all relative",
              mobileTab === "CART"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Sepet ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
            {cart.length > 0 && (
              <span className="ml-1 text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                {getCartCurrencySymbol()}{displayTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>

        {/* Cart Header */}
        <div className="h-11 px-3 sm:px-4 border-b border-border/40 flex items-center justify-between bg-muted/15 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile Back Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMobileTab("PRODUCTS")}
              className="lg:hidden h-7.5 px-2 text-xs font-bold gap-1 text-primary hover:bg-primary/10 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Ürünler</span>
            </Button>

            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xs">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-foreground">Sepet</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} Adet
              </span>
            </div>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCart([])}
              className="h-7 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 px-2.5 border border-rose-500/30 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Temizle</span>
            </Button>
          )}
        </div>

        {/* Customer Account & Description */}
        <div className="p-2 sm:p-2.5 border-b border-border/30 bg-muted/5 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-background/80 border border-border/40 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                selectedCustomer ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted text-muted-foreground"
              )}>
                {selectedCustomer ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block leading-none">
                  MÜŞTERİ HESABI
                </span>
                <span className="text-xs font-bold text-foreground truncate block mt-0.5">
                  {selectedCustomer ? selectedCustomer.name : "Perakende (İsimsiz Satış)"}
                </span>
                {selectedCustomer?.phone && (
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    {formatPhone(selectedCustomer.phone)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {selectedCustomer && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => setSelectedCustomerId(undefined)}
                  title="Perakende Yap"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-bold rounded-lg px-2.5 border-border/50 hover:bg-muted"
                onClick={() => setIsCustomerModalOpen(true)}
              >
                {selectedCustomer ? "Değiştir" : "Müşteri Seç"}
              </Button>
            </div>
          </div>

          <Textarea 
            placeholder="Satış notu veya açıklama (İsteğe bağlı)..." 
            value={saleDescription} 
            onChange={(e) => setSaleDescription(e.target.value)} 
            className="text-xs min-h-[36px] max-h-[48px] bg-background/80 border-border/40 resize-none rounded-lg py-1 px-2.5 shadow-inner"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 custom-scrollbar relative">
          <div className="space-y-1.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 py-12 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center mb-2">
                  <ShoppingCart className="h-6 w-6 opacity-30 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-foreground/80">Sepetiniz Boş</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ürünlere tıklayarak veya barkod okutarak sepete ekleyin.</p>
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
                  isCompact={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Checkout Summary */}
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

      {/* Customer Selection Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(id, name) => {
          setSelectedCustomerId(id);
          if (name) setCustomerSearch(name);
        }}
        onQuickCreateCustomer={handleQuickCreateCustomer}
        isCreatingCustomer={isCreatingCustomer}
      />

      {/* Mobile Floating Cart Summary Button */}
      {cart.length > 0 && mobileTab === "PRODUCTS" && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => setMobileTab("CART")}
            className="w-full flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Sepete Git & Ödeme Yap</div>
                <div className="text-[10px] opacity-80 font-medium">{cart.length} çeşit ürün</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tabular-nums">
                {getCartCurrencySymbol()}{displayTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

    </div>
  );

  if (!mounted) return null;

  return (
    <>
      {isFullscreen && typeof document !== "undefined"
        ? createPortal(content, document.body)
        : content}

      {/* Ürün Seçildi Yeşil Popup Yığını */}
      {typeof document !== "undefined" && selectionToasts.length > 0 &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[99999] flex flex-col-reverse items-end gap-1.5 pointer-events-none select-none max-sm:bottom-20 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:right-auto max-sm:items-center">
            {selectionToasts.map((toast) => (
              <div
                key={toast.id}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-600/95 dark:bg-emerald-700/95 text-white shadow-2xl shadow-emerald-950/40 border border-emerald-400/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200 min-w-[210px] max-w-[280px] sm:max-w-[340px]"
              >
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] font-black uppercase tracking-tight truncate leading-tight">
                    {toast.name}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-100/90 leading-none mt-0.5">
                    Ürün sepete eklendi
                  </span>
                </div>
                <span className="text-[11px] font-black tabular-nums bg-black/20 text-emerald-100 px-2 py-0.5 rounded-lg shrink-0">
                  {toast.price}
                </span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
