"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Search, Trash2, Plus, Minus, CheckCircle, CreditCard, Banknote, Landmark } from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";

export function POSInterface({ products, customers }: { products: any[]; customers: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

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
        toast({ title: "Satış Başarılı", description: "İşlem kaydedildi." });
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-220px)] overflow-hidden">
      {/* Product Selection Area */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden matte-card border-border/10/50 rounded-xl">
          <div className="p-6 border-b border-border/10/50 bg-slate-900/20">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Ürün adı veya barkod okutun..."
                  className="pl-12 bg-slate-900/60 border-border/10 h-12 rounded-2xl text-xs font-bold text-white placeholder:text-slate-600 focus:ring-blue-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="flex flex-col text-left bg-slate-900/40 border border-border/10/50 rounded-[1.5rem] p-5 hover:border-blue-500/40 hover:bg-blue-600/[0.03] transition-all group disabled:opacity-30 relative overflow-hidden"
                >
                  <div className="text-[9px] font-black text-slate-600 mb-2  ">{product.category.name}</div>
                  <div className="font-black text-xs text-slate-200 line-clamp-2 mb-4 group-hover:text-blue-400 transition-colors leading-tight ">
                    {product.name}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="font-black text-blue-500 text-lg italic ">₺{product.sellPrice.toLocaleString('tr-TR')}</div>
                    <div className={`text-[8px] font-black px-2 py-0.5 rounded-lg border  ${product.stock > 2 ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'}`}>
                      {product.stock} ADET
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart and Checkout Area */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden matte-card border-border/10/50 rounded-xl">
          <div className="p-8 border-b border-border/10/50 bg-slate-900/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-black   text-white">SEPET ({cart.length})</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-8 text-[11px] font-black text-rose-500   hover:bg-rose-500/10">
              TEMİZLE
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            <div className="bg-slate-950/40 flex px-8 py-3 border-b border-border/10/50">
                <span className="flex-1 text-[10px] font-black   text-slate-500">ÜRÜN</span>
                <span className="w-24 text-center text-[10px] font-black   text-slate-500">ADET</span>
                <span className="w-24 text-right text-[10px] font-black   text-slate-500">TUTAR</span>
            </div>

            <div className="divide-y divide-slate-800/30">
                {cart.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-slate-600 font-bold  text-[10px]  italic">
                    Sepet şu an boş...
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-8 flex items-center hover:bg-blue-600/[0.02] transition-colors group">
                      <div className="flex-1">
                         <span className="text-[13px] font-black text-white block leading-tight mb-1">{item.name}</span>
                         <span className="text-[10px] text-slate-500 font-bold   italic">
                            ₺{item.sellPrice.toLocaleString('tr-TR')} / BİRİM
                         </span>
                      </div>
                      <div className="w-32 flex items-center justify-center gap-4">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-full bg-slate-900 border border-border/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-black text-blue-500 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-full bg-slate-900 border border-border/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                      </div>
                      <div className="w-32 text-right flex items-center justify-end gap-4">
                         <span className="text-lg font-black text-white italic ">₺{(item.sellPrice * item.quantity).toLocaleString('tr-TR')}</span>
                         <button
                           className="h-8 w-8 rounded-lg text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
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

          <div className="p-8 bg-slate-900/30 border-t border-border/10/50 mt-auto">
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Button
                  variant="ghost"
                  className={`h-16 flex flex-col gap-1 rounded-2xl border-2 transition-all ${paymentMethod === "CASH" ? "bg-blue-600 border-blue-500 text-white " : "bg-slate-900 border-border/10 text-slate-500 hover:border-slate-700"}`}
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-[10px] font-black  ">NAKİT</span>
                </Button>
                <Button
                  variant="ghost"
                  className={`h-16 flex flex-col gap-1 rounded-2xl border-2 transition-all ${paymentMethod === "CREDIT_CARD" ? "bg-blue-600 border-blue-500 text-white " : "bg-slate-900 border-border/10 text-slate-500 hover:border-slate-700"}`}
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-[10px] font-black  ">KART</span>
                </Button>
                <Button
                  variant="ghost"
                  className={`h-16 flex flex-col gap-1 rounded-2xl border-2 transition-all ${paymentMethod === "BANK_TRANSFER" ? "bg-blue-600 border-blue-500 text-white " : "bg-slate-900 border-border/10 text-slate-500 hover:border-slate-700"}`}
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                >
                  <Landmark className="h-5 w-5" />
                  <span className="text-[10px] font-black  ">HAVALE</span>
                </Button>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-500   mb-1">ÖDENECEK TOPLAM</span>
                    <span className="text-6xl font-black text-white italic  leading-none">₺{total.toLocaleString('tr-TR')}</span>
                </div>
                <Button
                    className="h-20 px-12 text-sm font-black   gap-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white  transition-all italic"
                    disabled={cart.length === 0 || isProcessing}
                    onClick={handleCheckout}
                >
                    {isProcessing ? (
                        "İŞLENİYOR..."
                    ) : (
                        <>
                        SATIŞI TAMAMLA
                        <CheckCircle className="h-6 w-6" />
                        </>
                    )}
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
