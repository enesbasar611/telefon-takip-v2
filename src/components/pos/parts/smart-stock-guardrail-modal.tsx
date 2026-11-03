"use client";

import React, { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    AlertTriangle,
    PackagePlus,
    CheckCircle2,
    Truck,
    ArrowRight,
    Loader2,
    ShieldAlert,
    Barcode,
    Eye,
    ShoppingCart
} from "lucide-react";
import { updateProduct } from "@/lib/actions/product-actions";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";

interface SmartStockGuardrailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any;
    onStockAddedAndAddToCart: (product: any, addedStock: number) => void;
    onOnlyAddStock?: (product: any, addedStock: number) => void;
    onAllowZeroStockSale: (product: any) => void;
}

export function SmartStockGuardrailModal({
    open,
    onOpenChange,
    product,
    onStockAddedAndAddToCart,
    onOnlyAddStock,
    onAllowZeroStockSale,
}: SmartStockGuardrailModalProps) {
    const [quickQty, setQuickQty] = useState<number>(1);
    const [isPending, startTransition] = useTransition();

    if (!product) return null;

    const handleQuickStockEntry = (addToCartAfter: boolean = true) => {
        if (quickQty <= 0) {
            toast.error("Lütfen geçerli bir stok adedi girin.");
            return;
        }

        startTransition(async () => {
            try {
                const currentStock = Number(product.stock || 0);
                const newStock = currentStock + quickQty;
                const res = await updateProduct(product.id, { stock: newStock });

                if (res?.success) {
                    if (addToCartAfter) {
                        toast.success(`${quickQty} adet stok başarıyla eklendi ve sepete aktarıldı.`);
                        onStockAddedAndAddToCart(
                            { ...product, stock: newStock },
                            quickQty
                        );
                    } else {
                        toast.success(`${product.name} için +${quickQty} adet stok başarıyla eklendi.`);
                        if (onOnlyAddStock) {
                            onOnlyAddStock({ ...product, stock: newStock }, quickQty);
                        }
                    }
                    onOpenChange(false);
                } else {
                    toast.error(res?.error || "Stok güncellenemedi.");
                }
            } catch (err: any) {
                toast.error("Stok artırılırken hata oluştu.");
            }
        });
    };

    const handleAddToShortage = () => {
        startTransition(async () => {
            try {
                const res = await addShortageItem({
                    name: product.name,
                    productId: product.id,
                    quantity: 1,
                    notes: "ACİL • POS Satış Anında Sıfır Stok Tespiti (Akıllı Asistan)",
                });

                if (res?.success) {
                    toast.success("Ürün kurye ve tedarik havuzuna eklendi.");
                    onOpenChange(false);
                } else {
                    toast.error(res?.error || "Eksik havuzuna eklenemedi.");
                }
            } catch (err) {
                toast.error("İşlem sırasında hata oluştu.");
            }
        });
    };

    const handleForceAdd = () => {
        onAllowZeroStockSale(product);
        toast.info(`${product.name} rafta fiziki mevcut kabul edilerek sepete eklendi.`);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[480px] p-0 overflow-hidden bg-card border-border/70 rounded-3xl shadow-2xl">
                {/* Header warning strip */}
                <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                        <Eye className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Akıllı Göz • Hızlı Stok Girişi
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold">
                                0 Stok (Tükendi)
                            </Badge>
                        </div>
                        <DialogTitle className="text-base font-black text-foreground truncate">
                            {product.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            {product.category?.name && (
                                <span className="font-semibold text-foreground/80">{product.category.name}</span>
                            )}
                            {product.barcode && (
                                <>
                                    <span>•</span>
                                    <span className="font-mono text-[11px] text-muted-foreground">{product.barcode}</span>
                                </>
                            )}
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Option 1: Quick Stock Input (Recommended) */}
                    <div className="p-4 rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/[0.03] space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PackagePlus className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-black text-foreground uppercase tracking-tight">
                                    Hızlı Stok Ekle
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                Anında Güncelle
                            </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Yeni mal kabulü yapıldıysa veya rafta ürün varsa eklemek istediğiniz adedi seçin:
                        </p>

                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                value={quickQty}
                                onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-10 w-20 text-center font-bold text-sm bg-background border-border rounded-xl shrink-0"
                            />
                            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                {[1, 2, 3, 5, 10, 20].map((qty) => (
                                    <button
                                        key={qty}
                                        type="button"
                                        onClick={() => setQuickQty(qty)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            quickQty === qty
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                        }`}
                                    >
                                        +{qty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <Button
                                onClick={() => handleQuickStockEntry(true)}
                                disabled={isPending}
                                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-600/20"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                                <span>+{quickQty} & Sepete Ekle</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleQuickStockEntry(false)}
                                disabled={isPending}
                                className="w-full h-10 rounded-xl border-indigo-500/40 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs gap-1.5"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
                                <span>Sadece Stoğa Ekle</span>
                            </Button>
                        </div>
                    </div>

                    {/* Secondary Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <Button
                            variant="outline"
                            onClick={handleForceAdd}
                            disabled={isPending}
                            className="h-11 rounded-xl text-xs font-bold border-border/80 hover:bg-muted justify-start px-3 gap-2 text-foreground"
                        >
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                            <div className="flex flex-col items-start text-left">
                                <span className="leading-none text-[11px]">Rafta Var, Satışa Ekle</span>
                                <span className="text-[9px] text-muted-foreground font-normal">Fiziki mevcut kabul et</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleAddToShortage}
                            disabled={isPending}
                            className="h-11 rounded-xl text-xs font-bold border-border/80 hover:bg-muted justify-start px-3 gap-2 text-foreground"
                        >
                            <Truck className="w-3.5 h-3.5 text-blue-500" />
                            <div className="flex flex-col items-start text-left">
                                <span className="leading-none text-[11px]">Kurye/Tedarike Yaz</span>
                                <span className="text-[9px] text-muted-foreground font-normal">Eksik havuzuna bildir</span>
                            </div>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
