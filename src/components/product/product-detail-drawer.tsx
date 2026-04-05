"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    History,
    Info,
    Package,
    Tag,
    Barcode,
    MapPin,
    Truck,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Minus,
    AlertCircle,
    Loader2
} from "lucide-react";
import { getProductMovements, addInventoryStock } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export function ProductDetailDrawer({
    product,
    isOpen,
    onClose
}: {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [addAmount, setAddAmount] = useState<string>("1");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && product?.id) {
            loadMovements();
        }
    }, [isOpen, product]);

    const loadMovements = async () => {
        setLoading(true);
        const data = await getProductMovements(product.id);
        setMovements(data);
        setLoading(false);
    };

    const handleAddStock = async () => {
        const amount = parseInt(addAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Geçerli bir miktar giriniz.");
            return;
        }

        setIsUpdating(true);
        const result = await addInventoryStock(product.id, amount);
        if (result.success) {
            toast.success(`${amount} adet stok başarıyla eklendi.`);
            setAddAmount("1");
            loadMovements();
            // Note: In a real app, we might need a way to refresh the parent product data too, 
            // but revalidatePath handling might take care of it on next open or if using server components correctly.
        } else {
            toast.error("Stok eklenirken bir hata oluştu.");
        }
        setIsUpdating(false);
    };

    if (!product) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md bg-slate-950 border-l border-white/5 p-0 sm:p-0">
                <div className="h-full flex flex-col">
                    <SheetHeader className="p-6 pb-2">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <SheetTitle className="text-xl  text-white leading-tight">
                                    {product.name}
                                </SheetTitle>
                                <SheetDescription className="text-[10px]  text-slate-500 mt-1 uppercase flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {product.category?.name || "Kategori Belirtilmedi"}
                                </SheetDescription>
                            </div>
                            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
                                <Package className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden px-6 pb-6">
                        <Tabs defaultValue="info" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-white/5 p-1 rounded-xl mb-6">
                                <TabsTrigger value="info" className="text-[11px]  gap-2 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                                    <Info className="h-3.5 w-3.5" /> BİLGİLER
                                </TabsTrigger>
                                <TabsTrigger value="history" className="text-[11px]  gap-2 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                                    <History className="h-3.5 w-3.5" /> HAREKETLER
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="flex-1 m-0">
                                <div className="space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                                            <p className="text-[9px]  text-slate-600 mb-1 uppercase">Stok Durumu</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-2xl  ${product.stock <= product.criticalStock ? 'text-rose-500' : 'text-white'}`}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-[10px] text-slate-500  uppercase">ADET</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                                            <p className="text-[9px]  text-slate-600 mb-1 uppercase">Satış Fiyatı</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl  text-emerald-500">
                                                    ₺{Number(product.sellPrice).toLocaleString("tr-TR")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail List */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Barcode className="h-4 w-4 text-slate-500" />
                                                <span className="text-[11px]  text-slate-400">BARKOD / SKU</span>
                                            </div>
                                            <span className="text-[11px]  text-white uppercase">{product.barcode || product.sku || "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="h-4 w-4 text-blue-400" />
                                                <span className="text-[11px]  text-slate-400">RAF / KONUM</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]  border-blue-500/20 bg-blue-500/5 text-blue-400 uppercase">
                                                {product.location || "BELİRTİLMEDİ"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Truck className="h-4 w-4 text-orange-400" />
                                                <span className="text-[11px]  text-slate-400">TEDARİKÇİ</span>
                                            </div>
                                            <span className="text-[11px]  text-white uppercase">S. GÖKSU</span>
                                        </div>
                                    </div>

                                    {/* Financial Info Box */}
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px]  text-slate-500 uppercase tracking-wider">Birim Maliyet</span>
                                            <RevealFinancial amount={product.buyPrice} className="text-sm  text-white" />
                                        </div>
                                        <div className="h-px bg-white/5" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px]  text-slate-500 uppercase tracking-wider">Toplam Envanter Değeri</span>
                                            <RevealFinancial amount={product.buyPrice * product.stock} className="text-sm  text-white" />
                                        </div>
                                    </div>

                                    {/* Quick Add Stock */}
                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Plus className="h-3.5 w-3.5 text-blue-500" />
                                            </div>
                                            <span className="text-[11px]  text-blue-400 uppercase tracking-widest">Hızlı Stok Ekle</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={addAmount}
                                                onChange={(e) => setAddAmount(e.target.value)}
                                                className="bg-slate-950 border-white/5 h-10 text-xs  rounded-xl focus-visible:ring-blue-500"
                                            />
                                            <Button
                                                onClick={handleAddStock}
                                                disabled={isUpdating}
                                                className="bg-blue-600 hover:bg-blue-500 text-white  text-[10px] h-10 px-4 rounded-xl flex-shrink-0"
                                            >
                                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "KAYDET"}
                                            </Button>
                                        </div>
                                        <p className="text-[9px] font-medium text-slate-600 px-1 italic">
                                            Eklenen stok doğrudan mevcut bakiyeye yansır ve 'Stok Girişi' olarak loglanır.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                                <ScrollArea className="h-full pr-4">
                                    {loading ? (
                                        <p className="text-center text-[10px]  text-slate-500 py-10">Hareketler yükleniyor...</p>
                                    ) : movements.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                            <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-[10px] ">Herhangi bir hareket bulunamadı.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {movements.map((move: any) => (
                                                <div key={move.id} className="relative pl-6 border-l border-white/5 py-1">
                                                    <div className={`absolute left-[-5px] top-3 h-2 w-2 rounded-full border-2 bg-slate-950 ${move.quantity > 0 ? "border-emerald-500" : "border-rose-500"
                                                        }`} />
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div>
                                                            <p className="text-[11px]  text-white leading-tight">
                                                                {move.type === "SALE" ? "Satış Yapıldı" :
                                                                    move.type === "SERVICE_USE" ? "Servis Malzemesi" :
                                                                        move.type === "PURCHASE" ? "Stok Girişi" : "Stok Güncelleme"}
                                                            </p>
                                                            <p className="text-[9px] text-slate-500  mt-0.5">
                                                                {format(new Date(move.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                                                            </p>
                                                            {move.notes && (
                                                                <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">
                                                                    "{move.notes}"
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {(move.sale?.saleNumber || move.serviceTicket?.ticketNumber) && (
                                                                    <Badge variant="outline" className="text-[8px]  border-slate-800 text-slate-500 uppercase px-1.5 py-0">
                                                                        #{move.sale?.saleNumber || move.serviceTicket?.ticketNumber}
                                                                    </Badge>
                                                                )}
                                                                {move.type === "SERVICE_USE" && move.serviceTicket?.customer?.name && (
                                                                    <Badge variant="outline" className="text-[8px]  border-blue-500/10 bg-blue-500/5 text-blue-400 uppercase px-1.5 py-0 flex items-center gap-1">
                                                                        <Info className="h-2 w-2" /> {move.serviceTicket.customer.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-1  shadow-sm px-2 py-0.5 rounded-lg text-xs ${move.quantity > 0 ? "text-emerald-500 bg-emerald-500/5" : "text-rose-500 bg-rose-500/5"
                                                            }`}>
                                                            {move.quantity > 0 ? <Plus className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                                                            {Math.abs(move.quantity)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}



