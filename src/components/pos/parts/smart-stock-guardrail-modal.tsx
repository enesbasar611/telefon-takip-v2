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
            <DialogContent className="w-[95vw] sm:max-w-[580px] md:max-w-[620px] p-0 overflow-hidden bg-card border border-border/80 rounded-3xl shadow-2xl">
                {/* Header warning strip */}
                <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 p-5 sm:p-6 flex items-start gap-3.5 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Akıllı Göz • Hızlı Stok Girişi
                            </span>
                            <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-auto border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold rounded-md">
                                0 Stok (Tükendi)
                            </Badge>
                        </div>
                        <DialogTitle className="text-base sm:text-lg font-black text-foreground leading-snug break-words">
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

                <div className="p-5 sm:p-6 space-y-4">
                    {/* Option 1: Quick Stock Input (Recommended) */}
                    <div className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/[0.03] space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PackagePlus className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs sm:text-sm font-black text-foreground uppercase tracking-tight">
                                    Hızlı Stok Ekle
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                Anında Güncelle
                            </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Yeni mal kabulü yapıldıysa veya rafta ürün varsa eklemek istediğiniz adedi seçin:
                        </p>

                        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                            <Input
                                type="number"
                                min={1}
                                value={quickQty}
                                onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-11 w-20 text-center font-black text-base bg-background border-border rounded-xl shrink-0"
                            />
                            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                {[1, 2, 3, 5, 10, 20].map((qty) => (
                                    <button
                                        key={qty}
                                        type="button"
                                        onClick={() => setQuickQty(qty)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                            quickQty === qty
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        +{qty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1.5">
                            <Button
                                onClick={() => handleQuickStockEntry(true)}
                                disabled={isPending}
                                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm gap-2 shadow-md shadow-indigo-600/20 whitespace-nowrap"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4 shrink-0" />}
                                <span>+{quickQty} Adet & Sepete Ekle</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleQuickStockEntry(false)}
                                disabled={isPending}
                                className="w-full h-11 rounded-xl border-indigo-500/40 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm gap-2 whitespace-nowrap"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4 shrink-0" />}
                                <span>Sadece Stoğa Ekle</span>
                            </Button>
                        </div>
                    </div>

                    {/* Secondary Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-0.5">
                        <Button
                            variant="outline"
                            onClick={handleForceAdd}
                            disabled={isPending}
                            className="h-12 rounded-xl text-xs font-bold border-border/80 hover:bg-muted/80 justify-start px-3.5 gap-2.5 text-foreground transition-all"
                        >
                            <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="flex flex-col items-start text-left min-w-0">
                                <span className="leading-tight text-xs font-bold truncate w-full">Rafta Var, Satışa Ekle</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Fiziki mevcut kabul et</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleAddToShortage}
                            disabled={isPending}
                            className="h-12 rounded-xl text-xs font-bold border-border/80 hover:bg-muted/80 justify-start px-3.5 gap-2.5 text-foreground transition-all"
                        >
                            <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="flex flex-col items-start text-left min-w-0">
                                <span className="leading-tight text-xs font-bold truncate w-full">Kurye/Tedarike Yaz</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Eksik havuzuna bildir</span>
                            </div>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
