"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
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
  Loader2
} from "lucide-react";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { ReceiptModal } from "./receipt-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatPhone } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function POSInterface({ products: initialProducts, customers, categories, initialSale }: {
  products: any[];
  customers: any[];
  categories: any[];
  initialSale?: any;
}) {
  const [products, setProducts] = useState(initialProducts);

  // Show receipt if arrived via sale confirmation URL
  useEffect(() => {
    if (initialSale) {
      setLastSale(initialSale);
      setShowReceipt(true);
    }
  }, [initialSale]);

  // Sync prop changes in the background (e.g. after router.refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  // Yeni Müşteri Ekleme State'leri
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Auto-select customer from URL param (e.g. /satis?customerId=xxx)
  useEffect(() => {
    const cid = searchParams.get("customerId");
    if (cid && customers.find((c) => c.id === cid)) {
      setSelectedCustomerId(cid);
    }
  }, [searchParams, customers]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || newCustomer.name.length < 2) {
      toast({ title: "Eksik Bilgi", description: "Lütfen müşteri adı ve soyadı girin.", variant: "destructive" });
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const res = await createCustomer({ name: newCustomer.name, phone: newCustomer.phone });
      if (res.success && res.customer) {
        toast({ title: "Başarılı", description: "Yeni müşteri sisteme kaydedildi ve seçildi." });
        customers.push(res.customer); // UI update without reload dependency
        setSelectedCustomerId(res.customer.id);
        setIsNewCustomerOpen(false);
        setNewCustomer({ name: "", phone: "" });
        router.refresh(); // Fetch new server data
      } else {
        toast({ title: "Hata", description: res.error || "Müşteri oluşturulamadı.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Sistem hatası oluştu.", variant: "destructive" });
    } finally {
      setIsCreatingCustomer(false);
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")) {
      return;
    }
    setIsProcessing(true);

    startTransition(async () => {
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
          // 1. Optimistic Stock Update: Update local product state immediately
          const updatedProducts = products.map((p: any) => {
            const soldItem = cart.find(item => item.id === p.id);
            if (soldItem) {
              return { ...p, stock: p.stock - soldItem.quantity };
            }
            return p;
          });
          setProducts(updatedProducts);

          // 2. Receipt and Success State
          setLastSale(result.data);
          setShowReceipt(true);

          // 3. UI Cleanup
          setCart([]);
          setSearchTerm("");
          setSelectedCustomerId(undefined);
          toast({ title: "Satış Başarılı", description: "İşlem kaydedildi ve fiş hazırlandı." });

          // 4. Notifications
          window.dispatchEvent(new CustomEvent("notification-update"));

          // 5. Navigate to persistent URL: This causes a refresh while keeping the modal safe via server-side props
          router.push(`/satis?saleId=${result.data.id}`);
        } else {
          toast({ title: "Hata", description: result.error, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Sistem Hatası", variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const closeReceiptAndReload = () => {
    setShowReceipt(false);
    setLastSale(null);
    router.replace("/satis"); // URL'i temizle
  };

  return (
    <div ref={containerRef} className={cn(
      "grid grid-cols-1 lg:grid-cols-12 gap-6 bg-background h-full overflow-hidden p-6 relative transition-all duration-700",
      isFullscreen && "fixed inset-0 z-50 p-8",
      showReceipt && "bg-emerald-950/20"
    )}>
      {/* Success Pulse Background */}
      {showReceipt && (
        <div className="absolute inset-0 z-0 pointer-events-none animate-success-pulse bg-emerald-500/5 transition-all" />
      )}
      {/* Product Selection Area (Left Pane) */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden bg-card border border-border/40 rounded-[2.5rem] shadow-sm">
          {/* Header & Search - Inspired by Image 3/Donezo */}
          <div className="p-8 border-b border-border/40 flex items-center justify-between gap-8 bg-muted/5">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-foreground">Hızlı <span className="text-primary">Satış</span></h2>
                <p className="text-[11px] text-muted-foreground font-semibold leading-none mt-1">POS Terminal v2.0</p>
              </div>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Ürün adı veya barkod..."
                  className="pl-12 bg-muted/30 border-transparent h-12 rounded-2xl text-xs font-bold focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all border-border/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-12 w-12 rounded-2xl border-border/40 hover:bg-muted/50 hover:border-primary/20 transition-all group"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5 text-muted-foreground group-hover:text-primary" /> : <Maximize2 className="h-5 w-5 text-muted-foreground group-hover:text-primary" />}
              </Button>
            </div>
          </div>

          {/* Categories Tab */}
          <div className="px-8 py-4 border-b border-border/40 bg-card overflow-x-auto relative z-20">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="bg-transparent gap-3 p-0 h-auto">
                <TabsTrigger
                  value="ALL"
                  className="rounded-full h-10 px-8 font-bold text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-sm border border-border/40 data-[state=active]:border-primary"
                >
                  TÜM ÜRÜNLER
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full h-10 px-8 font-bold text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-sm border border-border/40 data-[state=active]:border-primary"
                  >
                    {cat.name.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-muted/5 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="flex flex-col text-left bg-card border border-border/40 rounded-[2rem] p-6 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/5 group disabled:opacity-40 relative overflow-hidden aspect-[1/1.2]"
                >
                  <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse group-hover:scale-125 transition-transform border-4 border-white shadow-lg" />

                  <div className="text-[10px] font-bold text-primary mb-2 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Tag className="h-3 w-3" />
                    {product.category.name}
                  </div>

                  <div className="mt-auto flex flex-col gap-1">
                    <div className="font-bold text-foreground text-4xl">₺{product.sellPrice.toLocaleString('tr-TR')}</div>
                    <div className="font-bold text-muted-foreground text-[14px] line-clamp-2 leading-tight">
                      {product.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart and Customer Selection (Right Pane) */}
      <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden bg-card border border-border/40 rounded-[2.5rem] shadow-sm">
          {/* Cart Header */}
          <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">Aktif <span className="text-primary">Sepet</span></span>
                <p className="text-[10px] text-muted-foreground font-bold">{cart.length} Ürün Seçildi</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-10 rounded-full text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 px-6 border border-rose-500/40">
              BOŞALT
            </Button>
          </div>

          <div className="p-8 border-b border-border/40 bg-muted/5">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[11px] font-bold text-muted-foreground tracking-[0.2em]">MÜŞTERİ BİLGİSİ</Label>
              <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-8 px-4 rounded-full text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 flex items-center gap-2 group hover:bg-primary hover:text-white transition-all">
                    <UserPlus className="h-3 w-3" /> YENİ EKLE
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-[#0a0a0a] border border-white/10 text-white shadow-2xl p-0 overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/10 flex flex-col gap-1.5 bg-white/[0.02]">
                    <DialogTitle className="text-lg font-bold">Hızlı Müşteri Kaydı</DialogTitle>
                    <DialogDescription className="text-xs text-slate-400 font-medium">
                      Aktif sepete atamak için sisteme anında müşteri tanımlayın.
                    </DialogDescription>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="c-name" className="text-xs font-semibold text-slate-400">Ad Soyad / Firma Adı <span className="text-rose-500">*</span></Label>
                      <Input
                        id="c-name"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        className="bg-white/[0.03] border-white/10 rounded-xl h-11 text-sm focus-visible:ring-1 focus-visible:ring-blue-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-phone" className="text-xs font-semibold text-slate-400">Telefon Numarası (Opsiyonel)</Label>
                      <Input
                        id="c-phone"
                        placeholder="Örn: 0555 123 4567"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        className="bg-white/[0.03] border-white/10 rounded-xl h-11 text-sm focus-visible:ring-1 focus-visible:ring-blue-500/50"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                    <Button type="button" variant="ghost" className="h-10 px-5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white" onClick={() => setIsNewCustomerOpen(false)}>
                      İptal
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomer}
                      className="h-10 px-6 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    >
                      {isCreatingCustomer ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Müşteriyi Kaydet ve Seç
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="bg-background border border-border/60 h-14 rounded-2xl text-[14px] font-medium text-foreground shadow-sm focus:ring-2 focus:ring-primary/10 px-6">
                <SelectValue placeholder="Müşteri Seçiniz (Hızlı Satış)" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border/60 text-foreground rounded-[1.5rem] shadow-2xl p-2 max-h-80">
                <SelectItem value="null" className="text-[13px] font-medium py-3 rounded-xl hover:bg-muted transition-colors">Varsayılan (İsimsiz)</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[13px] font-bold py-4 rounded-xl hover:bg-primary/5 transition-all border-b border-border/10 last:border-none cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold leading-none text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-blue-500 font-bold leading-none mt-1">
                        {formatPhone(c.phone)}
                      </span>
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
                    <ShoppingCart className="h-16 w-16 mb-4 opacity-[0.03] text-foreground" />
                    <ShoppingCart className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 text-primary" />
                  </div>
                  <p className="font-bold text-[9px] opacity-40">Sepetiniz şu an boş</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group border-b border-border/40 last:border-none gap-6">
                    <div className="flex-1 min-w-0">
                      <span className="text-[15px] font-bold text-foreground block leading-tight mb-1 truncate">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-primary font-bold">
                          ₺{item.sellPrice.toLocaleString('tr-TR')}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] text-muted-foreground font-bold">MEVCUT: {item.stock}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/40">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white transition-all active:scale-95"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-[14px] font-bold text-foreground w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/40 active:scale-95 group-hover:shadow-lg group-hover:shadow-rose-500/10"
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
          <div className="p-8 bg-muted/5 border-t border-border/40 mt-auto">
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
                    "h-16 flex flex-col gap-2 rounded-2xl border transition-all p-0 group",
                    paymentMethod === method.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105"
                      : "bg-background text-muted-foreground border-border/40 hover:bg-muted"
                  )}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <method.icon className={cn("h-4 w-4", paymentMethod === method.id ? "text-white" : "text-muted-foreground")} />
                  <span className="text-[9px] font-bold">{method.label}</span>
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold text-muted-foreground tracking-[0.2em] opacity-70">ÖDENECEK TOPLAM</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground drop-shadow-sm">₺{total.toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <Button
                className={cn(
                  "h-20 w-full text-[14px] font-bold gap-4 rounded-[1.5rem] transition-all shadow-2xl border active:scale-[0.98]",
                  paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-rose-500/10"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/20 border-primary/20"
                )}
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
                    {paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")
                      ? "MÜŞTERİ SEÇMENİZ GEREKİYOR (VERESİYE)"
                      : "SATIŞI TAMAMLA VE FİŞ YAZDIR"}
                    {paymentMethod === "DEBT" && (!selectedCustomerId || selectedCustomerId === "null")
                      ? <AlertCircle className="h-5 w-5" />
                      : <CheckCircle className="h-5 w-5" />}
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
          onClose={closeReceiptAndReload}
          sale={lastSale}
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
    </div>
  );
}
