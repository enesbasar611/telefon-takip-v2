"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Search,
    Plus,
    Minus,
    Banknote,
    Printer,
    ChevronRight,
    Package,
    Wrench,
    Smartphone,
    User,
    Trash2,
    ShoppingBag,
    UserPlus,
    CheckCircle,
    Phone,
    CreditCard,
    Landmark,
    History,
    AlertCircle,
    Camera,
    ShoppingCart
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
import { cn, formatPhone, formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getSettings } from "@/lib/actions/setting-actions";
// Cart Persistence Effect
import { useScanner } from "@/hooks/use-scanner";
import { useSession } from "next-auth/react";
import { ScannerModal } from "../scanner/scanner-modal";
import { useRouter } from "next/navigation";

export function POSCompact({ products, customers, categories }: { products: any[]; customers: any[]; categories: any[] }) {
    const [productSearch, setProductSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [view, setView] = useState<'products' | 'cart'>('products');
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [cart, setCart] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const lastAddRef = useRef<{ id: string; time: number } | null>(null);

    const [pointValueTl, setPointValueTl] = useState<number>(5);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

    const { data: session } = useSession();
    const router = useRouter();
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

    const {
        initializeScannerRoom,
        sendSuccessFeedback,
        sendErrorFeedback,
        syncCartToMobile
    } = useScanner((barcode, deviceId) => {
        const success = addBarcodeMatchToCart(barcode);
        if (success) {
            const product = products.find(p => p.barcode?.toUpperCase() === barcode.trim().toUpperCase());
            if (product) sendSuccessFeedback(product.name, deviceId);
        } else {
            sendErrorFeedback("Ürün bulunamadı!", deviceId);
        }
    });

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
        const savedCart = localStorage.getItem("pos_active_cart");
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
            localStorage.setItem("pos_active_cart", JSON.stringify(cart));
            syncCartToMobile(cart);
        }
    }, [cart, isLoaded, syncCartToMobile]);

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

    const { toast } = useToast();

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                (p.barcode && p.barcode.includes(productSearch)) ||
                (p.category?.name && p.category.name.toLowerCase().includes(productSearch.toLowerCase()));
            const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, productSearch, selectedCategory]);

    const addToCart = (product: any) => {
        if (!product) return;

        // Debounce rapid additions of the same product (prevent "1 adds 3" bug)
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

        const product = products.find((p: any) =>
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
                // Ensure delta is valid
                const change = Number(delta);
                const newQty = Math.max(1, item.quantity + change);
                const originalProduct = products.find((p) => p.id === id);

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

    // Listen for mobile-initiated cart actions (Bridge to Mobile Scanner)
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
    }, [cart, products]); // Re-bind when data changes

    const totalItemsAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const tax = totalItemsAmount * 0.20;
    const subtotal = totalItemsAmount - tax;

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

        // Debt validation
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
                // Reset states for next sale
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

    return (
        <div className="flex flex-col h-full bg-background text-foreground font-sans overflow-hidden">
            {/* Search Bar for Products */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-4 relative group">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Ürün adı veya barkod okut..."
                            className="pl-14 h-16 bg-muted/30 border-border/40 rounded-2xl text-base text-foreground focus:bg-muted focus:ring-4 focus:ring-blue-500/10 transition-all"
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
                        variant="outline"
                        className="h-16 w-16 rounded-2xl bg-muted/50 border-border/80/50 hover:bg-blue-600/10 hover:border-blue-500/50 transition-all"
                        onClick={() => {
                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                            if (isMobile) {
                                setIsScannerModalOpen(true);
                            } else {
                                router.push("/ayarlar/moduller");
                            }
                        }}
                    >
                        <Camera className="h-6 w-6 text-blue-500" />
                    </Button>
                </div>
            </div>

            {/* Category Pills */}
            <div className="px-6 pb-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 min-w-max">
                    <button
                        onClick={() => setSelectedCategory("ALL")}
                        className={cn(
                            "flex items-center gap-2.5 h-11 px-6 rounded-full border transition-all",
                            selectedCategory === "ALL"
                                ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/30 text-white"
                                : "bg-muted/40 border-border/80/40 hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        <span className="text-xs ">HEPSİ</span>
                    </button>
                    {categories.map((cat) => {
                        const Icon = cat.name.toLowerCase().includes('aksesuar') ? Smartphone : (cat.name.toLowerCase().includes('parça') ? Package : Wrench);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2.5 h-11 px-6 rounded-full border transition-all",
                                    selectedCategory === cat.id
                                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/30 text-white"
                                        : "bg-muted/40 border-border/80/40 hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs  truncate max-w-[150px]">{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tabs for switching between Products and Cart */}
            <div className="px-6 mb-4">
                <div className="flex p-1 bg-muted/50 rounded-xl border border-border/40">
                    <button
                        onClick={() => setView('products')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                            view === 'products' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Package className="h-4 w-4" />
                        ÜRÜNLER
                    </button>
                    <button
                        onClick={() => setView('cart')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all relative",
                            view === 'cart' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        SEPET
                        {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">{cart.length}</span>}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar pb-6">
                {view === 'products' ? (
                    filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-2xl hover:bg-muted/40 hover:border-blue-500/20 transition-all group active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-card border border-border/60 flex items-center justify-center overflow-hidden">
                                    <Package className="h-7 w-7 text-muted-foreground/40 opacity-50" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="font-bold text-sm text-foreground leading-tight">{product.name}</h4>
                                    <p className="text-[10px] text-blue-500 mt-1 font-bold">{product.category.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-sm font-bold text-foreground">₺{product.sellPrice.toLocaleString('tr-TR')}</span>
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="h-9 w-9 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 p-10 text-center">
                            <ShoppingCart className="h-12 w-12 mb-4 opacity-10" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Sepetiniz Boş</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SEPETTEKİ ÜRÜNLER</h3>
                                <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-7 px-3 text-[9px] text-rose-500 hover:bg-rose-500/10">BOŞALT</Button>
                            </div>
                            {cart.map((item) => (
                                <div key={item.id} className="bg-card border border-border/60 p-4 rounded-2xl space-y-3 shadow-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate uppercase">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="relative flex items-center">
                                                    <span className="text-xs text-blue-600 font-bold absolute left-0">₺</span>
                                                    <input
                                                        type="number"
                                                        value={item.sellPrice}
                                                        onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                                        className="bg-transparent border-none text-xs text-blue-600 font-bold focus:ring-0 w-20 pl-3 py-0 h-auto"
                                                    />
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-border" />
                                                <span className="text-[10px] text-muted-foreground">ADET</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                        <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/40">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-md transition-colors"><Minus className="h-3 w-3" /></button>
                                            <span className="w-10 text-center font-bold text-xs">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-md transition-colors"><Plus className="h-3 w-3" /></button>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[12px] font-bold text-foreground">₺{(item.sellPrice * item.quantity).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Cart Summary Section - Fixed at bottom */}
            <div className="p-10 bg-card border-t border-border/80/50 backdrop-blur-3xl space-y-8">
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-xs  text-muted-foreground/80 tracking-[0.2em]">Operasyonel Müşteri Seçimi</Label>
                        {customerSearch.length > 2 && !customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                            <button
                                onClick={async () => {
                                    setIsProcessing(true);
                                    const res = await createCustomer({
                                        name: customerSearch,
                                        phone: "",
                                        email: "",
                                        type: "BIREYSEL",
                                        isVip: false
                                    });
                                    if (res.success) {
                                        toast({ title: "Müşteri Eklendi", description: `${customerSearch} başarıyla kaydedildi.` });
                                        setSelectedCustomerId(res.customer.id);
                                        setCustomerSearch(customerSearch);
                                    }
                                    setIsProcessing(false);
                                }}
                                className="text-xs  text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors pulse-animation"
                            >
                                <UserPlus className="h-4 w-4" />
                                Hızlı Müşteri Ekle
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Müşteri adı veya telefon ile ara..."
                            value={activeCustomer ? activeCustomer.name : customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                if (selectedCustomerId) setSelectedCustomerId(undefined);
                            }}
                            className="pl-14 h-16 bg-muted/50 border-border/80/50 rounded-2xl text-base  text-white focus:bg-muted focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />

                        {(customerSearch.length > 0 && !selectedCustomerId) && (
                            <div className="absolute bottom-full left-0 w-full mb-4 bg-card border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-3xl">
                                <div className="max-h-80 overflow-y-auto p-4 custom-scrollbar-dark">
                                    {/* Quick Add Option - Always at top if name is new */}
                                    {!customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                        <button
                                            onClick={async () => {
                                                setIsProcessing(true);
                                                const res = await createCustomer({
                                                    name: customerSearch,
                                                    phone: "",
                                                    email: "",
                                                    type: "BIREYSEL",
                                                    isVip: false
                                                });
                                                if (res.success) {
                                                    toast({ title: "Müşteri Eklendi", description: `${customerSearch} başarıyla kaydedildi.` });
                                                    setSelectedCustomerId(res.customer.id);
                                                    setCustomerSearch(customerSearch);
                                                }
                                                setIsProcessing(false);
                                            }}
                                            className="w-full text-left px-5 py-5 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 transition-all flex items-center justify-between group mb-3"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                                    <Plus className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs  text-blue-400">SİSTEME KAYDET</span>
                                                    <span className="text-sm  text-white mt-1">{customerSearch}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setSelectedCustomerId(undefined);
                                            setCustomerSearch("");
                                        }}
                                        className="w-full text-left px-5 py-4 rounded-2xl hover:bg-white/[0.03] transition-colors flex items-center justify-between group mb-2"
                                    >
                                        <span className="text-xs  text-muted-foreground/80">HIZLI SATIŞ (İSİMSİZ)</span>
                                        <CheckCircle className={cn("h-5 w-5 text-emerald-500", !selectedCustomerId ? "opacity-100" : "opacity-0")} />
                                    </button>

                                    <div className="my-3 border-t border-border/50" />

                                    {customers
                                        .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
                                        .map(customer => (
                                            <button
                                                key={customer.id}
                                                onClick={() => {
                                                    setSelectedCustomerId(customer.id);
                                                    setCustomerSearch(customer.name);
                                                }}
                                                className="w-full text-left px-5 py-4 rounded-2xl hover:bg-white/[0.03] transition-colors flex items-center justify-between group mb-1"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm  text-white">{customer.name}</span>
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <Phone className="h-3 w-3 text-blue-500" />
                                                            <span className="text-xs text-blue-500 ">{formatPhone(customer.phone)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <CheckCircle className={cn("h-5 w-5 text-blue-500", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center text-sm  text-muted-foreground/80">
                        <span>Ara Toplam</span>
                        <span className="text-white">₺{subtotal.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm  text-muted-foreground/80">
                        <span>KDV (%20)</span>
                        <span className="text-white">₺{tax.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-border/50">
                        <span className="text-xl  text-white">Tahsilat Tutarı</span>
                        <div className="flex flex-col items-end">
                            {loyaltyDiscountAmount > 0 && (
                                <span className="text-sm text-muted-foreground line-through opacity-50 mb-1">₺{totalItemsAmount.toLocaleString('tr-TR')}</span>
                            )}
                            <span className="text-4xl  text-blue-500 animate-pulse-slow">₺{total.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

                {loyaltyEnabled && totalPoints > 0 && (
                    <div className="mb-2 p-4 rounded-2xl bg-blue-600/5 border border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-blue-500 flex items-center gap-2">
                                    CÜZDAN BAKİYESİ KULLAN
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-0.5">
                                    {totalPoints} Puan ({formatCurrency(totalPoints * pointValueTl)} TL)
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
                                className="h-6 w-6 rounded-lg border-blue-500/50 data-[state=checked]:bg-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Ödeme Yöntemi Seçimi */}
                <div className="grid grid-cols-4 gap-2 pb-2">
                    {[
                        { id: "CASH", label: "NAKİT", icon: Banknote },
                        { id: "CREDIT_CARD", label: "KART", icon: CreditCard },
                        { id: "BANK_TRANSFER", label: "HAVALE", icon: Landmark },
                        { id: "DEBT", label: "VERESİYE", icon: History }
                    ].map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all",
                                paymentMethod === method.id
                                    ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 text-white"
                                    : "bg-muted/40 border-border/80/40 text-muted-foreground/80 hover:bg-muted"
                            )}
                        >
                            <method.icon className={cn("h-4 w-4", paymentMethod === method.id ? "text-white" : "text-muted-foreground/80")} />
                            <span className="text-[8px] ">{method.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 pt-2">
                    <Button
                        disabled={cart.length === 0 || isProcessing}
                        onClick={handleCheckout}
                        className={cn(
                            "flex-1 h-20  text-base tracking-[0.1em] rounded-[1.5rem] shadow-2xl active:scale-[0.98] transition-all gap-4",
                            isDebtBlocked
                                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                        )}
                    >
                        {isDebtBlocked ? <AlertCircle className="h-6 w-6" /> : <Banknote className="h-7 w-7" />}
                        {isDebtBlocked ? "Müşteri Seçiniz" : "Tahsil Et & Yazdır"}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-20 w-20 rounded-[1.5rem] bg-muted/40 border-border/80/40 hover:bg-muted text-muted-foreground transition-all p-0 flex items-center justify-center"
                    >
                        <Printer className="h-8 w-8" />
                    </Button>
                </div>
            </div>

            {lastSale && (
                <ReceiptModal
                    isOpen={showReceipt}
                    onClose={() => setShowReceipt(false)}
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





