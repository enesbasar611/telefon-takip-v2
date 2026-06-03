"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Loader2
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings } from "@/lib/actions/setting-actions";
import { useScanner } from "@/hooks/use-scanner";
import { useSession } from "next-auth/react";
import { ScannerModal } from "../scanner/scanner-modal";
import { CartItem } from "./parts/cart-item";
import { CustomerSelector } from "./parts/customer-selector";
import { CheckoutSummary } from "./parts/checkout-summary";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { useQuery } from "@tanstack/react-query";

export function POSCompact({ products: initialProducts, customers, categories }: { products: any[]; customers: any[]; categories: any[] }) {
    const [productSearch, setProductSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [view, setView] = useState<'products' | 'cart'>('products');
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [cart, setCart] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
    const [localProducts, setLocalProducts] = useState(initialProducts);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);
    const lastAddRef = useRef<{ id: string; time: number } | null>(null);

    const { rates: exchangeRates } = useDashboardData();
    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: () => getSettings(),
    });

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

    // Helper Functions
    function getCartItemCurrency(item: any): "TRY" | "USD" | "EUR" {
        const storedCurrency = item?.attributes?.priceCurrency;
        if (storedCurrency === "USD" || storedCurrency === "EUR") return storedCurrency;
        return item?.sellPriceUsd ? "USD" : "TRY";
    }

    const getCartCurrencySymbol = useCallback((item: any) => {
        const itemCurrency = getCartItemCurrency(item);
        if (itemCurrency === "USD") return "$";
        if (itemCurrency === "EUR") return "€";
        return "₺";
    }, []);

    const getEquivalentDisplay = useCallback((product: any) => {
        const itemCurrency = getCartItemCurrency(product);
        const usdRate = Number(exchangeRates?.USD || settingsData?.find((s: any) => s.key === "exchange_rate_usd")?.value || 34.5);

        if (itemCurrency === "USD") {
            const priceUsd = Number(product.sellPriceUsd || product.sellPrice || 0);
            const tlEquiv = Math.round(priceUsd * usdRate);
            return `(₺${tlEquiv.toLocaleString("tr-TR")})`;
        } else {
            const priceTl = Number(product.sellPrice || 0);
            const usdEquiv = Math.round(priceTl / usdRate);
            return `($${usdEquiv})`;
        }
    }, [exchangeRates, settingsData]);

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
    });

    // Update local products when props change
    useEffect(() => {
        setLocalProducts(initialProducts);
    }, [initialProducts]);

    // Sync cart to mobile whenever it changes
    useEffect(() => {
        syncCartToMobile(cart);
    }, [cart, syncCartToMobile]);

    useEffect(() => {
        if (session?.user?.id || session?.user?.shopId) {
            initializeScannerRoom(session.user.shopId || session.user.id);
        }
    }, [session, initializeScannerRoom]);

    // Load cart from localStorage
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

    // Save cart to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("pos_active_compact_cart", JSON.stringify(cart));
            syncCartToMobile(cart);
        }
    }, [cart, isLoaded, syncCartToMobile]);

    const filteredProducts = useMemo(() => {
        return localProducts.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                (p.barcode && p.barcode.includes(productSearch)) ||
                (p.category?.name && p.category.name.toLowerCase().includes(productSearch.toLowerCase()));
            const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [localProducts, productSearch, selectedCategory]);

    const addToCart = (product: any) => {
        if (!product) return;

        // Debounce rapid additions of the same product
        const now = Date.now();
        const lastAdd = lastAddRef.current;
        if (lastAdd && lastAdd.id === product.id && now - lastAdd.time < 500) {
            return;
        }
        lastAddRef.current = { id: product.id, time: now };

        setCart((currentCart) => {
            const existing = currentCart.find((item) => item.id === product.id);

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
                description: "Barkod sistemde kayıtlı değil.",
                variant: "destructive"
            });
            return false;
        }

        addToCart(product);
        setProductSearch("");
        toast({ title: "Başarılı", description: `${product.name} sepete eklendi.` });
        return true;
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) => prev.map((item) => {
            if (item.id === id) {
                const change = Number(delta);
                const newQty = Math.max(1, item.quantity + change);
                const originalProduct = localProducts.find((p) => p.id === id);

                if (change > 0 && originalProduct && newQty > originalProduct.stock) {
                    toast({ title: "Stok Yetersiz", variant: "destructive" });
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
                return { ...item, sellPrice: newPrice };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    // Listen for mobile-initiated cart actions
    useEffect(() => {
        const handleRemove = (e: any) => removeFromCart(e.detail.productId);
        const handleUpdateQty = (e: any) => updateQuantity(e.detail.productId, e.detail.delta);
        const handleAdd = (e: any) => addToCart(e.detail.product);
        const handleUpdatePrice = (e: any) => updatePrice(e.detail.productId, e.detail.newPrice);

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
    }, [cart, initialProducts]);

    const totalItemsAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const tax = totalItemsAmount * 0.20;

    const activeCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    const totalPoints = activeCustomer?.loyaltyPoints || 0;

    const loyaltyDiscountAmount = useMemo(() => {
        if (!applyLoyaltyDiscount || totalPoints <= 0 || !loyaltyEnabled) return 0;
        const maxPointsDiscount = totalPoints * pointValueTl;
        return Math.min(maxPointsDiscount, totalItemsAmount);
    }, [applyLoyaltyDiscount, totalPoints, totalItemsAmount, pointValueTl, loyaltyEnabled]);

    const usedPoints = Math.ceil(loyaltyDiscountAmount / pointValueTl);
    const total = totalItemsAmount - loyaltyDiscountAmount;

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
                    unitPrice: item.sellPrice
                })),
                totalAmount: total,
                paymentMethod,
                discountAmount: loyaltyDiscountAmount,
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

    return (
        <div className="flex flex-col h-full bg-background text-foreground font-sans overflow-hidden">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2 relative group">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-all duration-300" />
                        <Input
                            placeholder="Ürün adı, barkod veya kategori..."
                            className="h-11 rounded-xl border border-border/50 bg-muted/30 pl-10 pr-3 text-xs font-medium shadow-sm transition-all focus:bg-background focus:ring-4 focus:ring-blue-500/5"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && addBarcodeMatchToCart(productSearch)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-11 w-11 shrink-0 rounded-xl bg-blue-500/10 text-blue-600 shadow-sm transition-all hover:bg-blue-500 hover:text-white active:scale-95"
                        onClick={() => setIsScannerModalOpen(true)}
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Category Pills */}
            <div className="px-4 pb-3 overflow-x-auto scrollbar-hide no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setSelectedCategory("ALL")}
                        className={cn(
                            "flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black tracking-tight transition-all",
                            selectedCategory === "ALL"
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted hover:border-border"
                        )}
                    >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        HEPSİ
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black tracking-tight transition-all",
                                selectedCategory === cat.id
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted hover:border-border"
                            )}
                        >
                            {cat.name.toLowerCase().includes('aksesuar') ? <Smartphone className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                            <span className="truncate max-w-[140px] uppercase">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* View Tabs */}
            <div className="px-4 mb-3">
                <div className="flex rounded-xl border border-border/40 bg-muted/40 p-1 backdrop-blur-md">
                    <button
                        onClick={() => setView('products')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black transition-all",
                            view === 'products' ? "bg-background text-blue-600 shadow-md ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Package className="h-4 w-4" />
                        KATALOG
                    </button>
                    <button
                        onClick={() => setView('cart')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black transition-all relative",
                            view === 'cart' ? "bg-background text-blue-600 shadow-md ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        SEPET
                        {cart.length > 0 && <span className="absolute -top-1 right-3 min-w-[22px] h-[22px] bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-background">{cart.length}</span>}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 no-scrollbar">
                <AnimatePresence mode="wait">
                    {view === 'products' ? (
                        <motion.div
                            key="products-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="grid grid-cols-1 gap-2 pb-4"
                        >
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5 hover:border-blue-500/30 active:scale-[0.99] transition-all"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 group-hover:border-blue-500/10">
                                            <Package className="h-4 w-4 text-muted-foreground/40" />
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <h4 className="truncate text-xs font-black uppercase text-foreground">{product.name}</h4>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[8px] text-muted-foreground uppercase">
                                                    {product.category?.name || "GENEL"}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", (product.stock || 0) <= 5 ? "bg-rose-500" : "bg-emerald-500")} />
                                                    <span className={cn("text-[9px] font-black", (product.stock || 0) <= 5 ? "text-rose-500" : "text-emerald-500")}>{product.stock || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-sm font-black tabular-nums">₺{product.sellPrice.toLocaleString('tr-TR')}</span>
                                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="cart-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {cart.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <ShoppingCart className="h-16 w-16 mb-4 opacity-5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sepetiniz Boş</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pb-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-[10px] font-black text-muted-foreground uppercase">SEPET DETAYI</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCart([])}
                                            className="h-8 px-3 text-[10px] text-rose-500 font-black"
                                        >
                                            TEMİZLE
                                        </Button>
                                    </div>
                                    {cart.map((item) => (
                                        <CartItem
                                            key={item.id}
                                            item={item}
                                            updateQuantity={updateQuantity}
                                            updatePrice={updatePrice}
                                            removeFromCart={removeFromCart}
                                            getCartCurrencySymbol={getCartCurrencySymbol}
                                            getEquivalentDisplay={getEquivalentDisplay}
                                            isCompact={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto border-t bg-card/50 backdrop-blur-xl px-4 py-4 space-y-4 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.1)]">
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

                <CheckoutSummary
                    subtotal={totalItemsAmount}
                    tax={tax}
                    total={total}
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
                    isDebtBlocked={isDebtBlocked}
                    isCompact={true}
                />
            </div>

            {lastSale && (
                <ReceiptModal
                    isOpen={showReceipt}
                    onClose={closeReceiptAndRefresh}
                    sale={lastSale}
                />
            )}

            <ScannerModal
                open={isScannerModalOpen}
                onOpenChange={setIsScannerModalOpen}
                shopIdOrUserId={session?.user?.shopId || session?.user?.id || ""}
            />
        </div>
    );
}
