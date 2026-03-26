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
        <div className="flex flex-col flex-1 overflow-hidden matte-card rounded-[2rem] bg-card border-none shadow-2xl">
          {/* Cart Header */}
          <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <span className="text-lg font-extrabold text-foreground font-manrope">AKTİF SEPET</span>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{cart.length} ÜRÜN SEÇİLDİ</p>
                </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-10 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-500/10 px-4">
              BOŞALT
            </Button>
          </div>

          {/* Customer Selection Drawer-style Section */}
          <div className="p-8 border-b border-border/50 bg-slate-50/50">
             <div className="flex items-center justify-between mb-4">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">MÜŞTERİ BİLGİSİ</Label>
                <Button variant="ghost" className="h-6 text-[9px] font-black text-primary p-0">
                    <UserPlus className="h-3 w-3 mr-1" /> YENİ EKLE
                </Button>
             </div>
             <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="bg-white border-none h-14 rounded-2xl text-sm font-extrabold shadow-sm focus:ring-primary/20">
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
          <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            <div className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                    <ShoppingCart className="h-12 w-12 mb-4 opacity-10" />
                    <p className="font-bold text-xs italic">Sepetiniz şu an boş.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-6 flex items-center hover:bg-slate-50 transition-colors group">
                      <div className="flex-1">
                         <span className="text-[13px] font-extrabold text-foreground block leading-tight mb-1 font-manrope">{item.name}</span>
                         <span className="text-[10px] text-slate-400 font-bold italic">
                            ₺{item.sellPrice.toLocaleString('tr-TR')} / BİRİM
                         </span>
                      </div>
                      <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-black text-foreground w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                           className="h-8 w-8 rounded-xl text-rose-200 hover:text-rose-500 hover:bg-rose-50 transition-colors ml-2"
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
          <div className="p-8 bg-muted/20 border-t border-border/50 mt-auto">
            <div className="grid grid-cols-4 gap-3 mb-8">
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
                            "h-16 flex flex-col gap-1 rounded-2xl border-2 transition-all p-0",
                            paymentMethod === method.id
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white border-transparent text-slate-400 hover:border-slate-200"
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                    >
                        <method.icon className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase">{method.label}</span>
                    </Button>
                ))}
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ÖDENECEK TOPLAM</span>
                    <span className="text-4xl font-black text-foreground italic font-manrope">₺{total.toLocaleString('tr-TR')}</span>
                </div>
                <Button
                    className="h-20 w-full text-base font-black gap-4 rounded-3xl bg-primary hover:bg-primary/90 text-white transition-all shadow-xl shadow-primary/20 uppercase"
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
