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
        "grid grid-cols-1 lg:grid-cols-12 gap-6 bg-background overflow-hidden",
        isFullscreen ? "h-screen p-8" : "h-[calc(100vh-220px)]"
    )}>
      {/* Product Selection Area (Left Pane) */}
      <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden matte-card rounded-[2rem] bg-card border-none shadow-2xl">
          {/* Header & Search */}
          <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-1">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                    placeholder="Ürün adı veya barkod..."
                    className="pl-12 bg-white/50 border-none h-14 rounded-2xl text-sm font-bold shadow-inner focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-12 w-12 rounded-2xl bg-white/50 border-none hover:bg-primary/10 group"
                >
                    {isFullscreen ? <Minimize2 className="h-5 w-5 text-primary" /> : <Maximize2 className="h-5 w-5 text-primary" />}
                </Button>
            </div>
          </div>

          {/* Categories Tab */}
          <div className="px-8 py-4 border-b border-border/50 bg-white/30 overflow-x-auto">
             <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="bg-transparent gap-2 p-0 h-auto">
                    <TabsTrigger
                        value="ALL"
                        className="rounded-xl h-10 px-6 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-none border border-transparent data-[state=active]:border-primary"
                    >
                        TÜM ÜRÜNLER
                    </TabsTrigger>
                    {categories.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="rounded-xl h-10 px-6 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-none border border-border/50"
                        >
                            {cat.name.toUpperCase()}
                        </TabsTrigger>
                    ))}
                </TabsList>
             </Tabs>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="flex flex-col text-left bg-card border-none rounded-[1.5rem] p-6 hover:shadow-xl hover:translate-y-[-4px] transition-all group disabled:opacity-40 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 animate-pulse group-hover:scale-150 transition-transform" />

                  <div className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    {product.category.name.toUpperCase()}
                  </div>
                  <div className="font-extrabold text-sm text-foreground line-clamp-2 mb-6 group-hover:text-primary transition-colors leading-tight font-manrope">
                    {product.name}
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="font-black text-primary text-xl italic font-manrope">₺{product.sellPrice.toLocaleString('tr-TR')}</div>
                    <div className={cn(
                        "text-[9px] font-black px-3 py-1.5 rounded-xl border transition-colors",
                        product.stock > product.criticalStock
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {product.stock} STOK
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
        <div className="flex flex-col flex-1 overflow-hidden matte-card rounded-[2rem] bg-[#080C14] border-none shadow-2xl">
          {/* Cart Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                    <span className="text-xl font-black text-white font-manrope tracking-tight uppercase">AKTİF <span className="text-blue-500 italic">SEPET</span></span>
                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-0.5">{cart.length} ÜRÜN SEÇİLDİ</p>
                </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-10 rounded-xl text-[10px] font-black text-rose-500 hover:bg-rose-500/10 px-5 border border-rose-500/20">
              BOŞALT
            </Button>
          </div>

          {/* Customer Selection Drawer-style Section */}
          <div className="p-10 border-b border-white/5 bg-white/5">
             <div className="flex items-center justify-between mb-5">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase opacity-70">MÜŞTERİ BİLGİSİ</Label>
                <Button variant="ghost" className="h-6 text-[10px] font-black text-blue-500 p-0 flex items-center gap-1.5 group hover:bg-transparent">
                    <UserPlus className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> YENİ EKLE
                </Button>
             </div>
             <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="bg-white border-none h-16 rounded-3xl text-[13px] font-black text-[#080C14] shadow-2xl focus:ring-blue-500/20 px-6">
                    <SelectValue placeholder="Müşteri Seçin (Hızlı Satış)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="null" className="text-xs font-bold py-3">Hızlı Satış (İsimsiz)</SelectItem>
                    {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs font-bold py-3 flex items-center gap-2">
                           {c.name} <span className="text-[10px] opacity-50 ml-2">({c.phone})</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-0 custom-scrollbar relative">
            <div className="divide-y divide-white/5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-20 text-center">
                    <div className="relative">
                        <ShoppingCart className="h-24 w-24 mb-6 opacity-[0.03] text-white" />
                        <ShoppingCart className="h-12 w-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 text-blue-500" />
                    </div>
                    <p className="font-black text-[11px] tracking-widest uppercase opacity-40">Sepetiniz şu an boş</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-8 flex items-center hover:bg-white/[0.02] transition-colors group border-b border-white/5 last:border-none">
                      <div className="flex-1">
                         <span className="text-[14px] font-black text-white block leading-tight mb-1 font-manrope uppercase tracking-tight">{item.name}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] text-blue-500 font-black italic">
                                ₺{item.sellPrice.toLocaleString('tr-TR')}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-700" />
                            <span className="text-[10px] text-slate-500 font-bold">STOK: {item.stock}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                            <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all"
                            >
                                <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-black text-white w-8 text-center">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                           className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
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
          <div className="p-10 bg-white/5 border-t border-white/5 mt-auto">
            <div className="grid grid-cols-4 gap-4 mb-10">
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
                            "h-20 flex flex-col gap-2 rounded-[1.5rem] border-none transition-all p-0 group",
                            paymentMethod === method.id
                                ? "bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] scale-105"
                                : "bg-white text-slate-400 hover:bg-slate-50"
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                    >
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                            paymentMethod === method.id ? "bg-white/20" : "bg-slate-100"
                        )}>
                            <method.icon className={cn("h-5 w-5", paymentMethod === method.id ? "text-white" : "text-slate-400")} />
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase">{method.label}</span>
                    </Button>
                ))}
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-4">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">ÖDENECEK TOPLAM</span>
                    <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-black text-white italic font-manrope tracking-tighter shadow-blue-500/10 drop-shadow-lg">₺{total.toLocaleString('tr-TR')}</span>
                    </div>
                </div>
                <Button
                    className="h-24 w-full text-sm font-black gap-6 rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_35px_rgba(37,99,235,0.3)] hover:shadow-[0_0_45px_rgba(37,99,235,0.45)] uppercase border border-blue-400/20"
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
                        SATIŞI TAMAMLA VE FİŞ YAZDIR
                        <CheckCircle className="h-6 w-6" />
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
