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
        customerId: selectedCustomerId,
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] overflow-hidden">
      {/* Product Selection Area */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
        <Card className="flex flex-col flex-1 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün adı veya barkod ara..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="flex flex-col text-left border rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
                >
                  <div className="text-xs font-bold text-muted-foreground mb-1">{product.category.name}</div>
                  <div className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="font-bold text-primary">₺{product.sellPrice}</div>
                    <Badge variant={product.stock > 5 ? "outline" : "destructive"} className="text-[10px] px-1.5 h-5">
                      {product.stock} Adet
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart and Checkout Area */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
        <Card className="flex flex-col flex-1 overflow-hidden">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sepet ({cart.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
              Temizle
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[45%]">Ürün</TableHead>
                  <TableHead className="text-center">Adet</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                      Sepet henüz boş.
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="p-0">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">₺{item.sellPrice * item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t p-4 bg-muted/20 flex flex-col gap-4">
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={paymentMethod === "CASH" ? "default" : "outline"}
                  className="flex-1 h-12 flex flex-col gap-1"
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote className="h-4 w-4" />
                  <span className="text-[10px] font-bold">NAKİT</span>
                </Button>
                <Button
                  variant={paymentMethod === "CREDIT_CARD" ? "default" : "outline"}
                  className="flex-1 h-12 flex flex-col gap-1"
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[10px] font-bold">KART</span>
                </Button>
                <Button
                  variant={paymentMethod === "BANK_TRANSFER" ? "default" : "outline"}
                  className="flex-1 h-12 flex flex-col gap-1"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                >
                  <Landmark className="h-4 w-4" />
                  <span className="text-[10px] font-bold">HAVALE</span>
                </Button>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground font-medium">Toplam Tutar:</span>
                <span className="text-2xl font-black text-primary">₺{total.toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg font-black uppercase tracking-widest gap-2 shadow-lg hover:shadow-xl transition-all"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? (
                "İŞLENİYOR..."
              ) : (
                <>
                  <CheckCircle className="h-6 w-6" />
                  SATIŞI TAMAMLA
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
