"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Search,
    Package,
    Smartphone,
    ShoppingBag,
    ShoppingCart,
    Camera,
    Plus,
    Wrench,
    Loader2,
    ArrowLeft,
    Pencil,
    Sparkles,
    Trash2,
    X,
    PlusCircle,
    Check,
    Coins
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { createProduct } from "@/lib/actions/product-actions";
import { ReceiptModal } from "./receipt-modal";
import { cn, normalizeSearchText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings } from "@/lib/actions/setting-actions";
import { useScanner } from "@/hooks/use-scanner";
import { useSession } from "next-auth/react";
import { ScannerModal } from "../scanner/scanner-modal";
import { CartItem } from "./parts/cart-item";
import { CustomerSelector } from "./parts/customer-selector";
import { CheckoutSummary } from "./parts/checkout-summary";
import { getAccounts } from "@/lib/actions/finance-actions";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SmartStockGuardrailModal } from "./parts/smart-stock-guardrail-modal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export function POSCompact({ products: initialProducts, customers, categories }: { products: any[]; customers: any[]; categories: any[] }) {
    const { rates: exchangeRates, defaultCurrency = "TRY" } = useDashboardData();
    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: () => getSettings(),
    });

    const usdRate = useMemo(() => {
        const rawRate = exchangeRates?.usd || exchangeRates?.USD || settingsData?.find((s: any) => s.key === "exchange_rate_usd")?.value || 34.5;
        const numRate = typeof rawRate === "string" ? parseFloat(rawRate.replace(",", ".")) : Number(rawRate);
        return isNaN(numRate) || numRate <= 0 ? 34.5 : numRate;
    }, [exchangeRates, settingsData]);

    const eurRate = useMemo(() => {
        return exchangeRates?.eur || exchangeRates?.EUR || 37.0;
    }, [exchangeRates]);

    // Active sale currency (Defaults to system default currency, but user can freely toggle to TRY or USD)
    const [saleCurrency, setSaleCurrency] = useState<"TRY" | "USD">(
        defaultCurrency === "USD" ? "USD" : "TRY"
    );

    // Keep synced with system default on initial load
    useEffect(() => {
        if (defaultCurrency === "USD" || defaultCurrency === "TRY") {
            setSaleCurrency(defaultCurrency);
        }
    }, [defaultCurrency]);

    const currencySymbol = saleCurrency === "USD" ? "$" : "₺";
    const getCartCurrencySymbol = useCallback(() => currencySymbol, [currencySymbol]);

    // Helper: Calculate unit price of a product in target currency
    const getProductDisplayPrice = useCallback((product: any, curr: "TRY" | "USD" = saleCurrency): number => {
        if (!product) return 0;
        if (curr === "USD") {
            if (product.sellPriceUsd !== null && product.sellPriceUsd !== undefined && Number(product.sellPriceUsd) > 0) {
                return Number(Number(product.sellPriceUsd).toFixed(2));
            }
            const tl = Number(product.sellPrice || 0);
            return Number((tl / usdRate).toFixed(2));
        } else {
            // TRY mode
            if (product.sellPrice !== null && product.sellPrice !== undefined && Number(product.sellPrice) > 0) {
                return Number(Number(product.sellPrice).toFixed(2));
            }
            if (product.sellPriceUsd !== null && product.sellPriceUsd !== undefined && Number(product.sellPriceUsd) > 0) {
                return Number((Number(product.sellPriceUsd) * usdRate).toFixed(2));
            }
            return 0;
        }
    }, [saleCurrency, usdRate]);

    // Helper: Secondary equivalent text
    const getProductEquivalentDisplay = useCallback((product: any, curr: "TRY" | "USD" = saleCurrency): string => {
        if (!product) return "";
        if (curr === "USD") {
            const tl = (product.sellPriceUsd !== null && product.sellPriceUsd !== undefined && Number(product.sellPriceUsd) > 0)
                ? Number(product.sellPriceUsd) * usdRate
                : Number(product.sellPrice || 0);
            return `(₺${Math.round(tl).toLocaleString("tr-TR")})`;
        } else {
            const usd = (product.sellPriceUsd !== null && product.sellPriceUsd !== undefined && Number(product.sellPriceUsd) > 0)
                ? Number(product.sellPriceUsd)
                : (Number(product.sellPrice || 0) / usdRate);
            return `($${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        }
    }, [saleCurrency, usdRate]);

    const [productSearch, setProductSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [view, setView] = useState<'products' | 'cart'>('products');
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [cart, setCart] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [localProducts, setLocalProducts] = useState(initialProducts);
    const [guardrailOpen, setGuardrailOpen] = useState(false);
    const [guardrailProduct, setGuardrailProduct] = useState<any | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        setLocalProducts(initialProducts);
    }, [initialProducts]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);
    const lastAddRef = useRef<{ id: string; time: number } | null>(null);

    // Custom Product Modal State ("ürün yazılsın")
    const [customProductOpen, setCustomProductOpen] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customPrice, setCustomPrice] = useState("");
    const [customQuantity, setCustomQuantity] = useState("1");
    const [isCreatingCustom, setIsCreatingCustom] = useState(false);

    // Price Edit Modal State ("seçildikten sonra fiyat değiştirilebilsin")
    const [priceEditModal, setPriceEditModal] = useState<{ open: boolean; product: any | null; price: string }>({
        open: false,
        product: null,
        price: ""
    });

    const { data: accountsData = [] } = useQuery({
        queryKey: ["finance-accounts"],
        queryFn: () => getAccounts(),
        staleTime: 60 * 1000,
    });
    const accounts = useMemo(() => accountsData || [], [accountsData]);

    useEffect(() => {
        if (accounts.length > 0) {
            let eligibleAccs = accounts;
            if (paymentMethod === "CASH") eligibleAccs = accounts.filter((a: any) => a.type === "CASH");
            else if (paymentMethod === "CREDIT_CARD") eligibleAccs = accounts.filter((a: any) => a.type === "POS" || a.type === "CREDIT_CARD");
            else if (paymentMethod === "BANK_TRANSFER" || paymentMethod === "TRANSFER") eligibleAccs = accounts.filter((a: any) => a.type === "BANK");

            if (eligibleAccs.length === 0) eligibleAccs = accounts;

            const savedId = typeof window !== "undefined" ? localStorage.getItem(`pos_last_account_${paymentMethod}`) : null;
            if (savedId && eligibleAccs.some((a: any) => a.id === savedId)) {
                setSelectedAccountId(savedId);
            } else if (!selectedAccountId || !eligibleAccs.some((a: any) => a.id === selectedAccountId)) {
                setSelectedAccountId(eligibleAccs[0]?.id || "");
            }
        }
    }, [accounts, paymentMethod, selectedAccountId]);

    const pointValueTl = useMemo(() => {
        const loyaltyVal = settingsData?.find((s: any) => s.key === "loyalty_point_value_tl")?.value;
        return Number(loyaltyVal) || 5;
    }, [settingsData]);

    const loyaltyEnabled = useMemo(() => {
        const enabled = settingsData?.find((s: any) => s.key === "loyalty_enabled")?.value;
        return enabled !== "false";
    }, [settingsData]);

    const { data: session } = useSession();
    const router = useRouter();
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
    const { toast } = useToast();

    const {
        initializeScannerRoom,
        sendSuccessFeedback,
        sendErrorFeedback,
        syncCartToMobile
    } = useScanner((barcode, deviceId) => {
        const success = addBarcodeMatchToCart(barcode);
        if (success) {
            const product = initialProducts.find(p => p.barcode?.toUpperCase() === barcode.trim().toUpperCase());
            if (product) sendSuccessFeedback(product.name, deviceId);
        } else {
            sendErrorFeedback("Ürün bulunamadı!", deviceId);
        }
    }, { allowGlobal: true });

    useEffect(() => {
        setLocalProducts(initialProducts);
    }, [initialProducts]);

    useEffect(() => {
        syncCartToMobile(cart);
    }, [cart, syncCartToMobile]);

    useEffect(() => {
        const shopId = session?.user?.shopId || session?.user?.id;
        if (shopId) {
            initializeScannerRoom(shopId);
        }
    }, [session, initializeScannerRoom]);

    useEffect(() => {
        const savedCart = localStorage.getItem("pos_active_compact_cart");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Cart recovery error:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("pos_active_compact_cart", JSON.stringify(cart));
            syncCartToMobile(cart);
        }
    }, [cart, isLoaded, syncCartToMobile]);

    const filteredProducts = useMemo(() => {
        const searchNormalized = normalizeSearchText(productSearch);
        const isSearching = searchNormalized.length > 0;

        return localProducts.filter((p) => {
            const matchesSearch = !isSearching ||
                normalizeSearchText(p.name).includes(searchNormalized) ||
                (p.barcode && normalizeSearchText(p.barcode).includes(searchNormalized)) ||
                (p.sku && normalizeSearchText(p.sku).includes(searchNormalized)) ||
                (p.category?.name && normalizeSearchText(p.category.name).includes(searchNormalized));
            const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [localProducts, productSearch, selectedCategory]);

    // Hızlı Seçim Ufak Yeşil Popup Yığını (Toast Stack)
    const [selectionToasts, setSelectionToasts] = useState<Array<{
        id: string;
        name: string;
        price: string;
    }>>([]);

    const addSelectionToast = useCallback((name: string, priceFormatted: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setSelectionToasts((prev) => [...prev, { id, name, price: priceFormatted }]);
        setTimeout(() => {
            setSelectionToasts((prev) => prev.filter((t) => t.id !== id));
        }, 1800);
    }, []);

    // Add to cart with price in active sale currency and Akıllı Göz guardrail
    const addToCart = (product: any, overridePrice?: number, forceAllowZero = false) => {
        if (!product) return;

        const isService = product.category?.name?.toLowerCase().includes("hizmet");
        const currentRealStock = Number(product.stock || 0);
        const inCartItem = cart.find(item => item.id === product.id);
        const inCartQty = inCartItem?.quantity || 0;

        // Akıllı Göz Stok Koruması: Stok tükenmişse veya sepetteki adet mevcut stoğu aşacaksa modalı aç
        if (!forceAllowZero && !isService && !product.isCustom) {
            if (currentRealStock <= 0 || inCartQty >= currentRealStock) {
                setGuardrailProduct(product);
                setGuardrailOpen(true);
                return;
            }
        }

        const now = Date.now();
        const lastAdd = lastAddRef.current;
        if (lastAdd && lastAdd.id === product.id && now - lastAdd.time < 400 && overridePrice === undefined) {
            return;
        }
        lastAddRef.current = { id: product.id, time: now };

        // Determine price in the currently active sale currency
        const unitPrice = overridePrice !== undefined
            ? overridePrice
            : getProductDisplayPrice(product, saleCurrency);

        setCart((currentCart) => {
            const existing = currentCart.find((item) => item.id === product.id);

            if (existing && overridePrice === undefined) {
                return currentCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1, forceAllowZero: forceAllowZero || item.forceAllowZero } : item
                );
            }

            const cartItem = {
                ...product,
                quantity: 1,
                unitPrice: Number(unitPrice.toFixed(2)),
                sellPrice: saleCurrency === "TRY" ? unitPrice : Number((unitPrice * usdRate).toFixed(2)),
                sellPriceUsd: saleCurrency === "USD" ? unitPrice : Number((unitPrice / usdRate).toFixed(2)),
                forceAllowZero,
            };

            return [...currentCart, cartItem];
        });

        // Ufak yeşil seçim popup'ını tetikle
        addSelectionToast(product.name, `${currencySymbol}${unitPrice.toFixed(2)}`);
    };

    // Toggle active sale currency between TRY and USD with auto conversion
    const toggleSaleCurrency = (newCurrency: "TRY" | "USD") => {
        if (newCurrency === saleCurrency) return;
        setCart((prevCart) =>
            prevCart.map((item) => {
                let newUnitPrice = item.unitPrice;
                if (newCurrency === "USD") {
                    newUnitPrice = Number((item.unitPrice / usdRate).toFixed(2));
                } else {
                    newUnitPrice = Number((item.unitPrice * usdRate).toFixed(2));
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

    // Open custom product entry modal ("ürün yazılsın")
    const handleOpenCustomProduct = (nameHint?: string) => {
        setCustomName(nameHint || productSearch || "");
        setCustomPrice("");
        setCustomQuantity("1");
        setCustomProductOpen(true);
    };

    // Save custom product and add to cart
    const handleSaveCustomProduct = async () => {
        if (!customName.trim()) {
            toast({ title: "Ürün Adı Gerekli", variant: "destructive" });
            return;
        }

        const priceNum = parseFloat(customPrice.replace(",", ".")) || 0;
        const qtyNum = parseInt(customQuantity, 10) || 1;

        setIsCreatingCustom(true);
        try {
            let product = localProducts.find(
                (p) => normalizeSearchText(p.name) === normalizeSearchText(customName)
            );

            const sellPriceTl = saleCurrency === "TRY" ? priceNum : Number((priceNum * usdRate).toFixed(2));
            const sellPriceUsd = saleCurrency === "USD" ? priceNum : Number((priceNum / usdRate).toFixed(2));

            if (!product) {
                const res = await createProduct({
                    name: customName.trim(),
                    sellPrice: sellPriceTl,
                    sellPriceUsd: sellPriceUsd,
                    buyPrice: 0,
                    stock: 999,
                });

                if (res.success && res.product) {
                    product = res.product;
                    setLocalProducts((prev) => [res.product, ...prev]);
                } else {
                    product = {
                        id: `custom-${Date.now()}`,
                        name: customName.trim(),
                        sellPrice: sellPriceTl,
                        sellPriceUsd: sellPriceUsd,
                        stock: 999,
                        isCustom: true,
                    };
                }
            }

            const cartItem = {
                ...product,
                quantity: qtyNum,
                unitPrice: priceNum,
                sellPrice: sellPriceTl,
                sellPriceUsd: sellPriceUsd,
            };

            setCart((prev) => [...prev, cartItem]);
            setCustomProductOpen(false);
            setProductSearch("");
            toast({
                title: "Özel Ürün Eklendi",
                description: `${customName.trim()} (${currencySymbol}${priceNum.toFixed(2)}) sepete eklendi.`
            });
        } catch (error) {
            console.error("Custom product error:", error);
            toast({ title: "Hata", description: "Ürün eklenirken bir hata oluştu.", variant: "destructive" });
        } finally {
            setIsCreatingCustom(false);
        }
    };

    // Open price editor for a catalog item before adding
    const handleOpenPriceEdit = (product: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const currentPrice = getProductDisplayPrice(product, saleCurrency);
        setPriceEditModal({
            open: true,
            product,
            price: currentPrice.toString(),
        });
    };

    // Confirm price edit and add to cart
    const handleConfirmPriceEdit = () => {
        if (!priceEditModal.product) return;
        const newPrice = parseFloat(priceEditModal.price.replace(",", ".")) || 0;
        addToCart(priceEditModal.product, newPrice);
        setPriceEditModal({ open: false, product: null, price: "" });
    };

    const addBarcodeMatchToCart = (value: string) => {
        const normalizedValue = value.trim().toUpperCase();
        if (!normalizedValue) return false;

        const product = initialProducts.find((p: any) =>
            p.barcode?.toUpperCase() === normalizedValue ||
            p.sku?.toUpperCase() === normalizedValue
        );

        if (!product) {
            toast({
                title: "Ürün Bulunamadı",
                description: "Barkod kayıtlı değil. Dilerseniz özel ürün olarak ekleyebilirsiniz.",
                variant: "destructive"
            });
            return false;
        }

        addToCart(product);
        setProductSearch("");
        return true;
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) => prev.map((item) => {
            if (item.id === id) {
                const change = Number(delta);
                const newQty = Math.max(1, item.quantity + change);
                const originalProduct = localProducts.find((p) => p.id === id);

                if (change > 0 && originalProduct && !originalProduct.isCustom && newQty > originalProduct.stock && !item.forceAllowZero) {
                    setGuardrailProduct(originalProduct);
                    setGuardrailOpen(true);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const updatePrice = (id: string, newPrice: number) => {
        setCart((prev) => prev.map((item) => {
            if (item.id === id) {
                return {
                    ...item,
                    unitPrice: newPrice,
                    sellPrice: saleCurrency === "TRY" ? newPrice : Number((newPrice * usdRate).toFixed(2)),
                    sellPriceUsd: saleCurrency === "USD" ? newPrice : Number((newPrice / usdRate).toFixed(2)),
                };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    // Subtotal calculated directly from cart unitPrices in active sale currency
    const displaySubtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (Number(item.unitPrice || 0) * item.quantity), 0);
    }, [cart]);

    const displaySubtotalTl = useMemo(() => {
        if (saleCurrency === "TRY") return displaySubtotal;
        return displaySubtotal * usdRate;
    }, [displaySubtotal, saleCurrency, usdRate]);

    const activeCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    const totalPoints = activeCustomer?.loyaltyPoints || 0;

    const loyaltyDiscountAmount = useMemo(() => {
        if (!applyLoyaltyDiscount || totalPoints <= 0 || !loyaltyEnabled) return 0;
        const maxPointsDiscountTl = totalPoints * pointValueTl;
        return Math.min(maxPointsDiscountTl, displaySubtotalTl);
    }, [applyLoyaltyDiscount, totalPoints, pointValueTl, loyaltyEnabled, displaySubtotalTl]);

    const displayTotal = useMemo(() => {
        const discountInSaleCurrency = saleCurrency === "USD"
            ? (loyaltyDiscountAmount / usdRate)
            : loyaltyDiscountAmount;
        return Math.max(0, displaySubtotal - discountInSaleCurrency);
    }, [displaySubtotal, loyaltyDiscountAmount, saleCurrency, usdRate]);

    const usedPoints = Math.ceil(loyaltyDiscountAmount / pointValueTl);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")) {
            toast({ title: "Müşteri Seçilmedi", description: "Veresiye işlemi için önce müşteri seçmelisiniz.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await createSale({
                customerId: selectedCustomerId === "null" ? undefined : selectedCustomerId,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice.toFixed(2))
                })),
                totalAmount: Number(displayTotal.toFixed(2)),
                currency: saleCurrency, // Explicitly send the selected currency (TRY or USD)
                paymentMethod,
                accountId: selectedAccountId || undefined,
                discountAmount: saleCurrency === "USD"
                    ? Number((loyaltyDiscountAmount / usdRate).toFixed(2))
                    : Number(loyaltyDiscountAmount.toFixed(2)),
                usedPoints
            });

            if (result.success) {
                setLastSale(result.data);
                setShowReceipt(true);
                setCart([]);
                setLocalProducts(prev => prev.map(p => {
                    const cartItem = cart.find(item => item.id === p.id);
                    if (cartItem) {
                        return { ...p, stock: p.stock - cartItem.quantity };
                    }
                    return p;
                }));
                queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
                queryClient.invalidateQueries({ queryKey: ["products"] });
                setCustomerSearch("");
                setSelectedCustomerId(undefined);
                toast({ title: "Satış Başarılı" });
            } else {
                toast({ title: "Hata", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Sistem Hatası", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const isDebtBlocked = paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null");

    const closeReceiptAndRefresh = () => {
        setShowReceipt(false);
        setLastSale(null);
        router.refresh();
    };

    const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="flex flex-col h-full bg-background text-foreground font-sans overflow-hidden">
            {/* Top Bar: Tabs & Currency Selector */}
            <div className="px-3 pt-3 pb-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                    {/* View Tabs */}
                    <div className="flex-1 flex rounded-xl border border-border/40 bg-muted/40 p-1 backdrop-blur-md">
                        <button
                            onClick={() => setView('products')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
                                view === 'products' ? "bg-background text-blue-600 shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Package className="h-3.5 w-3.5" />
                            <span>ÜRÜNLER</span>
                        </button>
                        <button
                            onClick={() => setView('cart')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all relative",
                                view === 'cart' ? "bg-background text-blue-600 shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>SEPET</span>
                            {totalItemCount > 0 && (
                                <span className="min-w-[18px] h-4.5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black px-1 shadow-sm">
                                    {totalItemCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Currency Switcher: TRY / USD */}
                    <div className="flex items-center rounded-xl border border-border/50 bg-muted/40 p-1 shrink-0" title="Satış Para Birimini Değiştir">
                        <button
                            type="button"
                            onClick={() => toggleSaleCurrency("TRY")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-black transition-all",
                                saleCurrency === "TRY"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            ₺ TL
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleSaleCurrency("USD")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-black transition-all",
                                saleCurrency === "USD"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            $ USD
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: ÜRÜN SEÇİMİ (Katalog ve Arama) */}
            {view === 'products' ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Search & Actions Bar */}
                    <div className="px-3 pb-2 space-y-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ürün ara, barkod okut veya yaz..."
                                    className="h-10 rounded-xl border border-border/50 bg-muted/30 pl-9 pr-8 text-xs font-medium"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && addBarcodeMatchToCart(productSearch)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                                {productSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setProductSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Camera Scanner */}
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white"
                                onClick={() => setIsScannerModalOpen(true)}
                                title="Kamera ile Barkod Oku"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>

                            {/* Manual Product Button ("ürün yazılsın") */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-10 px-3 shrink-0 rounded-xl border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500 text-xs font-bold gap-1"
                                onClick={() => handleOpenCustomProduct()}
                                title="Listede olmayan ürünü yaz ve ekle"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Özel Ürün</span>
                            </Button>
                        </div>

                        {/* Quick Add Suggestion Strip when typing */}
                        {productSearch.trim().length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleOpenCustomProduct(productSearch.trim())}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/25 hover:bg-blue-600/15 text-blue-400 text-xs font-semibold transition-all group"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Pencil className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    <span className="truncate">"{productSearch}" olarak özel ürün yaz & ekle</span>
                                </div>
                                <span className="text-[10px] text-blue-500 font-bold underline shrink-0 ml-2">Fiyat Belirle →</span>
                            </button>
                        )}

                        {/* Category Pills */}
                        <div className="overflow-x-auto scrollbar-none no-scrollbar pt-1">
                            <div className="flex gap-1.5 min-w-max">
                                <button
                                    onClick={() => setSelectedCategory("ALL")}
                                    className={cn(
                                        "flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-all",
                                        selectedCategory === "ALL"
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <ShoppingBag className="h-3 w-3" />
                                    HEPSİ
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-all",
                                            selectedCategory === cat.id
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <span className="truncate max-w-[120px] uppercase">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product List - FULL HEIGHT SCROLL */}
                    <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2 overscroll-contain">
                        {filteredProducts.length === 0 ? (
                            <div className="py-12 text-center space-y-3">
                                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                                <p className="text-xs text-muted-foreground">Eşleşen ürün bulunamadı.</p>
                                <Button
                                    size="sm"
                                    onClick={() => handleOpenCustomProduct(productSearch)}
                                    className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>"{productSearch || "Özel Ürün"}" Olarak Ekle</span>
                                </Button>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const displayPrice = getProductDisplayPrice(product, saleCurrency);
                                const equivalentText = getProductEquivalentDisplay(product, saleCurrency);
                                const isService = product.category?.name?.toLowerCase().includes("hizmet");
                                const inCartItem = cart.find((item) => item.id === product.id);
                                const inCartQty = inCartItem?.quantity || 0;
                                const effectiveStock = isService ? (product.stock || 0) : Math.max(0, (product.stock || 0) - inCartQty);
                                const isOutOfStock = !isService && effectiveStock <= 0;

                                return (
                                    <div
                                        key={product.id}
                                        className={cn(
                                            "group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-blue-500/30 transition-all",
                                            isOutOfStock && "opacity-75 bg-muted/20 border-rose-500/20"
                                        )}
                                    >
                                        {/* Product Details */}
                                        <div
                                            className="flex min-w-0 items-center gap-2.5 flex-1 cursor-pointer"
                                            onClick={() => addToCart(product)}
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
                                                {isService ? (
                                                    <Wrench className="h-4 w-4" />
                                                ) : (
                                                    <Package className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <h4 className="truncate text-xs font-bold uppercase text-foreground">{product.name}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] text-muted-foreground uppercase font-medium">
                                                        {product.category?.name || "GENEL"}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground">•</span>
                                                    <span className={cn(
                                                        "text-[9px] font-bold",
                                                        isOutOfStock ? "text-rose-500 font-black animate-pulse" : (effectiveStock <= 5 ? "text-amber-500" : "text-emerald-500")
                                                    )}>
                                                        {isOutOfStock ? "Tükendi" : `${effectiveStock} Adet`}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground/70 font-mono ml-1">
                                                        {equivalentText}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Price Tag with Edit Icon - Click to customize price */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleOpenPriceEdit(product, e)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                                                title="Fiyatı değiştirerek sepete ekle"
                                            >
                                                <span className="text-xs font-bold tabular-nums">
                                                    {currencySymbol}{displayPrice.toLocaleString(saleCurrency === "USD" ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <Pencil className="h-2.5 w-2.5 opacity-60" />
                                            </button>

                                            {/* Quick Add Button */}
                                            <Button
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 rounded-lg text-white shadow-sm transition-all",
                                                    isOutOfStock
                                                        ? "bg-amber-600/90 hover:bg-amber-500"
                                                        : "bg-blue-600 hover:bg-blue-500"
                                                )}
                                                onClick={() => addToCart(product)}
                                                title={isOutOfStock ? "Stok Bitti (Akıllı Göz Stok Uyarısını Aç)" : "Sepete Ekle"}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Floating Cart Bar */}
                    {cart.length > 0 && (
                        <div className="p-3 bg-card/95 border-t border-border/50 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg shrink-0">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                    {totalItemCount} Ürün Sepette
                                </span>
                                <span className="text-base font-extrabold text-blue-500 tabular-nums">
                                    {currencySymbol}{displayTotal.toLocaleString(saleCurrency === "USD" ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Button
                                onClick={() => setView('cart')}
                                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 shadow-md shadow-blue-500/20"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                <span>Sepet & Ödemeye Geç →</span>
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                /* TAB 2: SEPET VE ÖDEME (Tahsilat Akışı) */
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 py-2 space-y-4 overscroll-contain">
                    {/* Top Navigation Strip */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('products')}
                            className="h-8 px-2 text-xs font-semibold text-blue-500 hover:text-blue-400 gap-1.5"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Ürün Eklemeye Dön</span>
                        </Button>
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCart([])}
                                className="h-8 px-2 text-[11px] text-rose-500 hover:text-rose-400 font-bold"
                            >
                                Sepeti Temizle
                            </Button>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">
                                Sepetteki Kalemler ({cart.length})
                            </span>
                            <span className="text-[11px] font-bold text-foreground font-mono">
                                Toplam: {currencySymbol}{displayTotal.toLocaleString(saleCurrency === "USD" ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/20" />
                                <p className="text-xs font-bold text-muted-foreground">Sepetiniz Boş</p>
                                <Button
                                    size="sm"
                                    onClick={() => setView('products')}
                                    className="h-8 px-3 text-xs rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    Ürün Seçmeye Başla
                                </Button>
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
                                    getEquivalentDisplay={(itm: any) => getProductEquivalentDisplay(itm, saleCurrency)}
                                    displayPrice={item.unitPrice}
                                    isCompact={true}
                                />
                            ))
                        )}
                    </div>

                    {/* Customer Selection & Checkout Form */}
                    {cart.length > 0 && (
                        <div className="space-y-4 pt-2 border-t border-border/40">
                            {/* Customer Selector */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase px-1">
                                    Müşteri Seçimi (İsteğe Bağlı)
                                </span>
                                <CustomerSelector
                                    customers={customers}
                                    selectedCustomerId={selectedCustomerId}
                                    setSelectedCustomerId={setSelectedCustomerId}
                                    customerSearch={customerSearch}
                                    setCustomerSearch={setCustomerSearch}
                                    onNewCustomer={async (name) => {
                                        setIsProcessing(true);
                                        const res = await createCustomer({ name, phone: "" });
                                        if (res.success) {
                                            toast({ title: "Müşteri Eklendi" });
                                            setSelectedCustomerId(res.customer.id);
                                            setCustomerSearch(name);
                                        }
                                        setIsProcessing(false);
                                    }}
                                    isProcessing={isProcessing}
                                    isCompact={true}
                                />
                            </div>

                            {/* Payment Method & Checkout Summary */}
                            <CheckoutSummary
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                                loyaltyEnabled={loyaltyEnabled}
                                totalPoints={usedPoints}
                                pointValueTl={pointValueTl}
                                applyLoyaltyDiscount={applyLoyaltyDiscount}
                                setApplyLoyaltyDiscount={setApplyLoyaltyDiscount}
                                loyaltyDiscountAmount={loyaltyDiscountAmount}
                                isProcessing={isProcessing}
                                onCheckout={handleCheckout}
                                isDebtBlocked={isDebtBlocked}
                                isCompact={true}
                                defaultCurrency={saleCurrency}
                                rates={exchangeRates}
                                formattedTotal={currencySymbol + displayTotal.toLocaleString(saleCurrency === "USD" ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                formattedSubtotal={currencySymbol + (displayTotal * 0.833).toLocaleString(saleCurrency === "USD" ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                formattedTax={currencySymbol + (displayTotal * 0.167).toLocaleString(saleCurrency === "USD" ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                formattedEquivalentTotal={saleCurrency === 'TRY'
                                    ? `$${(displayTotal / usdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `₺${(displayTotal * usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                showDetails={showDetails}
                                setShowDetails={setShowDetails}
                                accounts={accounts}
                                selectedAccountId={selectedAccountId}
                                setSelectedAccountId={setSelectedAccountId}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Custom Product Creator Modal ("ürün yazılsın") */}
            <Dialog open={customProductOpen} onOpenChange={setCustomProductOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl p-5">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-blue-500" />
                            <span>Özel / Manuel Ürün Yaz</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground">Ürün / Hizmet Adı</Label>
                            <Input
                                placeholder="Örn: Ekran Koruma, Şarj Kablosu, Format..."
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="h-10 text-xs sm:text-sm rounded-xl"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Birim Fiyat ({currencySymbol})
                                </Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    className="h-10 text-xs sm:text-sm rounded-xl font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground">Adet</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={customQuantity}
                                    onChange={(e) => setCustomQuantity(e.target.value)}
                                    className="h-10 text-xs sm:text-sm rounded-xl font-mono"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomProductOpen(false)}
                            className="rounded-xl text-xs h-9"
                        >
                            İptal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveCustomProduct}
                            disabled={isCreatingCustom || !customName.trim()}
                            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 font-bold"
                        >
                            {isCreatingCustom ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                            Sepete Ekle ({currencySymbol})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Price Edit Modal ("seçildikten sonra fiyat değiştirilebilsin") */}
            <Dialog open={priceEditModal.open} onOpenChange={(open) => setPriceEditModal((prev) => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-[380px] rounded-2xl p-5">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-500" />
                            <span>Birim Fiyatı Belirle</span>
                        </DialogTitle>
                    </DialogHeader>
                    {priceEditModal.product && (
                        <div className="space-y-3 py-2">
                            <p className="text-xs text-muted-foreground font-medium">
                                <span className="font-bold text-foreground uppercase">{priceEditModal.product.name}</span> için satış fiyatını belirleyin:
                            </p>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Birim Satış Fiyatı ({currencySymbol})
                                </Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={priceEditModal.price}
                                    onChange={(e) => setPriceEditModal((prev) => ({ ...prev, price: e.target.value }))}
                                    className="h-11 text-base font-bold font-mono rounded-xl focus:ring-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleConfirmPriceEdit();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPriceEditModal({ open: false, product: null, price: "" })}
                            className="rounded-xl text-xs h-9"
                        >
                            İptal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmPriceEdit}
                            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 font-bold"
                        >
                            <Check className="h-4 w-4 mr-1.5" />
                            Fiyatı Uygula & Sepete Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            {lastSale && (
                <ReceiptModal
                    isOpen={showReceipt}
                    onClose={closeReceiptAndRefresh}
                    sale={lastSale}
                    rates={exchangeRates as any}
                    initialDefaultCurrency={saleCurrency}
                />
            )}

            {/* Camera Barcode Scanner Modal */}
            <ScannerModal
                open={isScannerModalOpen}
                onOpenChange={setIsScannerModalOpen}
                shopIdOrUserId={session?.user?.shopId || session?.user?.id || "global"}
            />

            {/* Smart Eye Stock Guardrail (Akıllı Göz Stok Koruması) */}
            <SmartStockGuardrailModal
                open={guardrailOpen}
                onOpenChange={setGuardrailOpen}
                product={guardrailProduct}
                onStockAddedAndAddToCart={(updatedProduct) => {
                    setLocalProducts((prev) =>
                        prev.map((p) => p.id === updatedProduct.id ? { ...p, stock: updatedProduct.stock } : p)
                    );
                    queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] });
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                    addToCart(updatedProduct, undefined, true);
                }}
                onAllowZeroStockSale={(prod) => {
                    addToCart(prod, undefined, true);
                }}
            />

            {/* Ürün Seçildi Yeşil Popup Yığını */}
            {selectionToasts.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse items-center gap-1.5 pointer-events-none select-none">
                    {selectionToasts.map((toast) => (
                        <div
                            key={toast.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-600/95 dark:bg-emerald-700/95 text-white shadow-xl shadow-emerald-950/25 border border-emerald-400/30 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200 min-w-[200px] max-w-[280px]"
                        >
                            <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Check className="h-3 w-3 text-white stroke-[3]" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-tight truncate leading-tight">
                                    {toast.name}
                                </span>
                                <span className="text-[8.5px] font-bold text-emerald-100/90 leading-none mt-0.5">
                                    Ürün seçildi
                                </span>
                            </div>
                            <span className="text-[10px] font-black tabular-nums bg-black/20 text-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">
                                {toast.price}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
