"use client";

import { useState, useMemo } from "react";
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
    ShoppingBag,
    UserPlus,
    CheckCircle,
    Phone,
    CreditCard,
    Landmark,
    History,
    AlertCircle
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
import { cn, formatPhone } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function POSCompact({ products, customers, categories }: { products: any[]; customers: any[]; categories: any[] }) {
    const [productSearch, setProductSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [cart, setCart] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);

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
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) {
                toast({ title: "Stok Yetersiz", variant: "destructive" });
                return;
            }
            setCart(cart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const total = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const tax = total * 0.20;
    const subtotal = total - tax;

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
                paymentMethod
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

    const activeCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    return (
        <div className="flex flex-col h-full bg-[#0F172A] text-white font-sans overflow-hidden">
            {/* Search Bar for Products */}
            <div className="p-6 pb-4">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Ürün veya seri no ara..."
                        className="pl-14 h-16 bg-slate-800/50 border-slate-700/50 rounded-2xl text-base font-bold text-white focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                    />
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
                                : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400"
                        )}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        <span className="text-xs font-bold">HEPSİ</span>
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
                                        : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-bold truncate max-w-[150px]">{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Product List Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar-dark pb-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl hover:bg-white/[0.03] hover:border-blue-500/20 transition-all group active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                                <Package className="h-9 w-9 text-slate-500 opacity-20" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-base font-bold text-white leading-tight">{product.name}</h4>
                                <p className="text-xs text-blue-500 mt-1.5 font-bold">{product.category.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-lg font-bold text-white">₺{product.sellPrice.toLocaleString('tr-TR')}</span>
                            </div>
                            <button
                                onClick={() => addToCart(product)}
                                className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Summary Section - Fixed at bottom */}
            <div className="p-10 bg-slate-900 border-t border-slate-700/50 backdrop-blur-3xl space-y-8">
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-500 tracking-[0.2em]">Operasyonel Müşteri Seçimi</Label>
                        {customerSearch.length > 2 && !customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                            <button
                                onClick={async () => {
                                    setIsProcessing(true);
                                    const res = await createCustomer({ name: customerSearch });
                                    if (res.success) {
                                        toast({ title: "Müşteri Eklendi", description: `${customerSearch} başarıyla kaydedildi.` });
                                        setSelectedCustomerId(res.customer.id);
                                        setCustomerSearch(customerSearch);
                                    }
                                    setIsProcessing(false);
                                }}
                                className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors pulse-animation"
                            >
                                <UserPlus className="h-4 w-4" />
                                Hızlı Müşteri Ekle
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Müşteri adı veya telefon ile ara..."
                            value={activeCustomer ? activeCustomer.name : customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                if (selectedCustomerId) setSelectedCustomerId(undefined);
                            }}
                            className="pl-14 h-16 bg-slate-800/50 border-slate-700/50 rounded-2xl text-base font-bold text-white focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />

                        {(customerSearch.length > 0 && !selectedCustomerId) && (
                            <div className="absolute bottom-full left-0 w-full mb-4 bg-slate-900 border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-3xl">
                                <div className="max-h-80 overflow-y-auto p-4 custom-scrollbar-dark">
                                    {/* Quick Add Option - Always at top if name is new */}
                                    {!customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                        <button
                                            onClick={async () => {
                                                setIsProcessing(true);
                                                const res = await createCustomer({ name: customerSearch });
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
                                                    <span className="text-xs font-bold text-blue-400">SİSTEME KAYDET</span>
                                                    <span className="text-sm font-bold text-white mt-1">{customerSearch}</span>
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
                                        <span className="text-xs font-bold text-slate-500">HIZLI SATIŞ (İSİMSİZ)</span>
                                        <CheckCircle className={cn("h-5 w-5 text-emerald-500", !selectedCustomerId ? "opacity-100" : "opacity-0")} />
                                    </button>

                                    <div className="my-3 border-t border-white/5" />

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
                                                    <span className="text-sm font-bold text-white">{customer.name}</span>
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <Phone className="h-3 w-3 text-blue-500" />
                                                            <span className="text-xs text-blue-500 font-bold">{formatPhone(customer.phone)}</span>
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
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span>Ara Toplam</span>
                        <span className="text-white">₺{subtotal.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span>KDV (%20)</span>
                        <span className="text-white">₺{tax.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-white/5">
                        <span className="text-xl font-bold text-white">Tahsilat Tutarı</span>
                        <div className="flex flex-col items-end">
                            <span className="text-4xl font-bold text-blue-500 animate-pulse-slow">₺{total.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

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
                                    : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:bg-slate-800"
                            )}
                        >
                            <method.icon className={cn("h-4 w-4", paymentMethod === method.id ? "text-white" : "text-slate-500")} />
                            <span className="text-[8px] font-bold">{method.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 pt-2">
                    <Button
                        disabled={cart.length === 0 || isProcessing}
                        onClick={handleCheckout}
                        className={cn(
                            "flex-1 h-20 font-bold text-base tracking-[0.1em] rounded-[1.5rem] shadow-2xl active:scale-[0.98] transition-all gap-4",
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
                        className="h-20 w-20 rounded-[1.5rem] bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400 transition-all p-0 flex items-center justify-center"
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
        </div>
    );
}
