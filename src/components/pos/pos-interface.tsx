"use client";

import { useState, useMemo, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Banknote,
  Landmark,
  History,
  Maximize2,
  Minimize2,
  Tag,
  Package,
  UserPlus
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { ReceiptModal } from "./receipt-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function POSInterface({ products, customers, categories }: { products: any[]; customers: any[]; categories: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (p.barcode && p.barcode.includes(searchTerm));
        const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
    } else {
        document.exitFullscreen();
        setIsFullscreen(false);
    }
  };

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

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((item) => {
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
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")) {
        toast({ title: "Hata", description: "Veresiye işlemi için müşteri seçilmelidir.", variant: "destructive" });
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
        toast({ title: "Satış Başarılı", description: "İşlem kaydedildi ve fiş hazırlandı." });
        setCart([]);
        setSearchTerm("");
        setSelectedCustomerId(undefined);
      } else {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Sistem Hatası", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div ref={containerRef} className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-4 bg-background overflow-hidden",
        isFullscreen ? "h-screen p-6" : "h-[calc(100vh-160px)]"
    )}>
      {/* Product Selection Area (Left Pane) */}
      <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden matte-card rounded-3xl bg-card border-none shadow-xl">
          {/* Header & Search */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-6 bg-white/10">
            <div className="flex items-center gap-6 flex-1">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-md shadow-blue-500/5 flex-shrink-0">
                    <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                    placeholder="Ürün adı veya barkod..."
                    className="pl-12 bg-slate-50 border-slate-200 h-12 rounded-xl text-xs font-bold shadow-inner focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    />
                </div>
            </div>

            <div className="flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 hover:bg-white hover:border-blue-500/20 hover:shadow-md transition-all group"
                >
                    {isFullscreen ? <Minimize2 className="h-5 w-5 text-slate-600 group-hover:text-blue-600" /> : <Maximize2 className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />}
                </Button>
            </div>
          </div>

          {/* Categories Tab */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 overflow-x-auto relative z-20">
             <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="bg-transparent gap-2 p-0 h-auto">
                    <TabsTrigger
                        value="ALL"
                        className="rounded-lg h-9 px-6 font-black text-[9px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all shadow-sm border border-slate-200 data-[state=active]:border-blue-600 uppercase tracking-widest"
                    >
                        TÜM ÜRÜNLER
                    </TabsTrigger>
                    {categories.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="rounded-lg h-9 px-6 font-black text-[9px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all shadow-sm border border-slate-200 data-[state=active]:border-blue-600 uppercase tracking-widest"
                        >
                            {cat.name.toUpperCase()}
                        </TabsTrigger>
                    ))}
                </TabsList>
             </Tabs>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-100/50 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="flex flex-col text-left bg-[#080C14] border border-white/5 rounded-2xl p-4 hover:shadow-2xl hover:translate-y-[-4px] transition-all group disabled:opacity-40 relative overflow-hidden aspect-[1/1.3]"
                >
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 animate-pulse group-hover:scale-125 transition-transform border-2 border-emerald-500/20" />

                  <div className="text-[8px] font-black text-blue-500 mb-1 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity tracking-tight">
                    <Tag className="h-2 w-2" />
                    {product.category.name.toUpperCase()}
                  </div>

                  <div className="font-black text-[11px] text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors leading-[1.1] font-manrope uppercase tracking-tighter">
                    {product.name}
                  </div>

                  <div className="mt-auto pt-2 border-t border-white/5 flex flex-col gap-1.5">
                    <div className="font-black text-white text-lg italic font-manrope tracking-tighter">₺{product.sellPrice.toLocaleString('tr-TR')}</div>
                    <div className="flex items-center justify-between">
                        <div className={cn(
                            "text-[8px] font-black px-2 py-1 rounded-lg border transition-all",
                            product.stock > product.criticalStock
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                        {product.stock} MEVCUT
                        </div>
                        {product.stock <= product.criticalStock && (
                            <span className="text-[8px] font-black text-rose-500 animate-bounce uppercase">!</span>
                        )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart and Customer Selection (Right Pane) */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden matte-card rounded-3xl bg-[#080C14] border-none shadow-xl">
          {/* Cart Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <span className="text-base font-black text-white font-manrope tracking-tight uppercase">AKTİF <span className="text-blue-500 italic">SEPET</span></span>
                    <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase">{cart.length} ÜRÜN SEÇİLDİ</p>
                </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-8 rounded-lg text-[9px] font-black text-rose-500 hover:bg-rose-500/10 px-4 border border-rose-500/20">
              BOŞALT
            </Button>
          </div>

          {/* Customer Selection */}
          <div className="p-6 border-b border-white/5 bg-white/5">
             <div className="flex items-center justify-between mb-4">
                <Label className="text-[9px] font-black text-slate-400 tracking-widest uppercase opacity-60">MÜŞTERİ BİLGİSİ</Label>
                <Button variant="ghost" className="h-7 px-3 rounded-lg text-[8px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5 group hover:bg-blue-500 hover:text-white transition-all">
                    <UserPlus className="h-3 w-3" /> YENİ EKLE
                </Button>
             </div>
             <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="bg-white border-none h-12 rounded-2xl text-xs font-black text-[#080C14] shadow-lg focus:ring-2 focus:ring-blue-500/10 px-6">
                    <SelectValue placeholder="Müşteri Seçin (Hızlı Satış)" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none text-[#080C14] rounded-xl shadow-2xl p-1 max-h-60">
                    <SelectItem value="null" className="text-[10px] font-black py-2.5 rounded-lg hover:bg-slate-50 transition-colors">Hızlı Satış (İsimsiz)</SelectItem>
                    {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-[10px] font-black py-2.5 rounded-lg hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-none">
                           <div className="flex flex-col gap-0.5">
                                <span className="uppercase">{c.name}</span>
                                <span className="text-[8px] text-slate-400 italic">#{c.phone}</span>
                           </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-0 custom-scrollbar relative">
            <div className="divide-y divide-white/5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-10 text-center">
                    <div className="relative">
                        <ShoppingCart className="h-16 w-16 mb-4 opacity-[0.03] text-white" />
                        <ShoppingCart className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 text-blue-500" />
                    </div>
                    <p className="font-black text-[9px] tracking-widest uppercase opacity-40">Sepetiniz şu an boş</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group border-b border-white/5 last:border-none gap-4">
                      <div className="flex-1 min-w-0">
                         <span className="text-[12px] font-black text-white block leading-tight mb-1 font-manrope uppercase tracking-tight truncate">{item.name}</span>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-blue-500 font-black italic">
                                ₺{item.sellPrice.toLocaleString('tr-TR')}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">STOK: {item.stock}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shadow-inner">
                            <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                            >
                                <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-black text-white w-7 text-center font-manrope">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                           className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/20 active:scale-95 group-hover:shadow-lg group-hover:shadow-rose-500/10"
                           onClick={() => removeFromCart(item.id)}
                         >
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </div>

          {/* Checkout Section */}
          <div className="p-6 bg-white/5 border-t border-white/5 mt-auto">
            <div className="grid grid-cols-4 gap-2 mb-6">
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
                            "h-14 flex flex-col gap-1 rounded-xl border-none transition-all p-0 group",
                            paymentMethod === method.id
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105"
                                : "bg-white text-slate-400 hover:bg-slate-50"
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                    >
                        <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                            paymentMethod === method.id ? "bg-white/20" : "bg-slate-100"
                        )}>
                            <method.icon className={cn("h-3 w-3", paymentMethod === method.id ? "text-white" : "text-slate-400")} />
                        </div>
                        <span className="text-[8px] font-black tracking-widest uppercase">{method.label}</span>
                    </Button>
                ))}
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase opacity-70">ÖDENECEK TOPLAM</span>
                    <div className="flex items-baseline gap-1">
                         <span className="text-4xl font-black text-white italic font-manrope tracking-tighter drop-shadow-md">₺{total.toLocaleString('tr-TR')}</span>
                    </div>
                </div>
                <Button
                    className="h-16 w-full text-xs font-black gap-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl hover:shadow-2xl uppercase border border-blue-400/20"
                    disabled={cart.length === 0 || isProcessing}
                    onClick={handleCheckout}
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>İŞLENİYOR...</span>
                        </div>
                    ) : (
                        <>
                        SATIŞI TAMAMLA VE FİŞ YAZDIR
                        <CheckCircle className="h-4 w-4" />
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
            onClose={() => setShowReceipt(false)}
            sale={lastSale}
        />
      )}
    </div>
  );
}
