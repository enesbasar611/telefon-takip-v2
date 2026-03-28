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
    CheckCircle
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
import { cn } from "@/lib/utils";
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
                (p.barcode && p.barcode.includes(productSearch));
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

    const activeCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    return (
        <div className="flex flex-col h-full bg-[#0F172A] text-white font-sans overflow-hidden">
            {/* Search Bar for Products */}
            <div className="p-6 pb-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Ürün veya seri no ara..."
                        className="pl-12 h-14 bg-slate-800/50 border-slate-700/50 rounded-2xl text-sm font-medium text-white focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Pills */}
            <div className="px-6 pb-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setSelectedCategory("ALL")}
                        className={cn(
                            "flex items-center gap-2 h-9 px-5 rounded-full border transition-all",
                            selectedCategory === "ALL"
                                ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 text-white"
                                : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400"
                        )}
                    >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black tracking-widest uppercase">HEPSİ</span>
                    </button>
                    {categories.map((cat) => {
                        const Icon = cat.name.toLowerCase().includes('aksesuar') ? Smartphone : (cat.name.toLowerCase().includes('parça') ? Package : Wrench);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 h-9 px-5 rounded-full border transition-all",
                                    selectedCategory === cat.id
                                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 text-white"
                                        : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-black tracking-widest uppercase truncate max-w-[120px]">{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Product List Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar-dark">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl hover:bg-slate-800/50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                                <Package className="h-8 w-8 text-slate-500 opacity-20" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-sm font-bold text-white leading-tight">{product.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-tight">{product.category.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-sm font-black text-blue-400">₺{product.sellPrice.toLocaleString('tr-TR')}</span>
                            </div>
                            <button
                                onClick={() => addToCart(product)}
                                className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Summary Section - Fixed at bottom */}
            <div className="p-8 bg-slate-900/80 border-t border-slate-700/50 backdrop-blur-xl space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">MÜŞTERİ SEÇ</Label>
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
                                className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                                <UserPlus className="h-3 w-3" />
                                Müşteri Ekle
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Müşteri adı veya telefon ile ara..."
                            value={activeCustomer ? activeCustomer.name : customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                if (selectedCustomerId) setSelectedCustomerId(undefined);
                            }}
                            className="pl-12 h-14 bg-slate-800/50 border-slate-700/50 rounded-2xl text-sm font-medium text-white focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold uppercase"
                        />

                        {(customerSearch.length > 0 && !selectedCustomerId) && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar-dark">
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
                                            className="w-full text-left px-4 py-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 transition-all flex items-center justify-between group mb-2"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-blue-400 uppercase tracking-tight">YENİ MÜŞTERİ EKLE</span>
                                                    <span className="text-[11px] font-bold text-white mt-0.5">{customerSearch}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-blue-500" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setSelectedCustomerId(undefined);
                                            setCustomerSearch("");
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between group"
                                    >
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HIZLI SATIŞ (İSİMSİZ)</span>
                                        <CheckCircle className={cn("h-4 w-4 text-blue-500", !selectedCustomerId ? "opacity-100" : "opacity-0")} />
                                    </button>

                                    <div className="my-2 border-t border-slate-700/50" />

                                    {customers
                                        .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
                                        .map(customer => (
                                            <button
                                                key={customer.id}
                                                onClick={() => {
                                                    setSelectedCustomerId(customer.id);
                                                    setCustomerSearch(customer.name);
                                                }}
                                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between group"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white uppercase">{customer.name}</span>
                                                    {customer.phone && <span className="text-[9px] text-slate-500 font-bold mt-1 tracking-wider">{customer.phone}</span>}
                                                </div>
                                                <CheckCircle className={cn("h-4 w-4 text-blue-500", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                        <span>Ara Toplam</span>
                        <span className="text-white font-bold">₺{subtotal.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                        <span>KDV (%20)</span>
                        <span className="text-white font-bold">₺{tax.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-lg font-black text-white uppercase tracking-tight">Toplam</span>
                        <span className="text-4xl font-black text-blue-500 italic tracking-tighter">₺{total.toLocaleString('tr-TR')}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        disabled={cart.length === 0 || isProcessing}
                        onClick={handleCheckout}
                        className="flex-1 h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all gap-3"
                    >
                        <Banknote className="h-5 w-5" />
                        Ödeme Yap
                    </Button>
                    <Button
                        variant="outline"
                        className="h-16 w-16 rounded-2xl bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 text-slate-400 transition-all p-0"
                    >
                        <Printer className="h-6 w-6" />
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
