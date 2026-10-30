"use client";

import { useEffect, useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    DollarSign,
    Loader2,
    Package,
    Receipt,
    RefreshCw,
    Trash2,
    User,
    Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteSale, getSaleDeletePreview, type SaleDeletePreview } from "@/lib/actions/sale-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DeleteSaleConfirmModalProps {
    saleId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeleteSaleConfirmModal({
    saleId,
    open,
    onOpenChange,
    onSuccess,
}: DeleteSaleConfirmModalProps) {
    const [preview, setPreview] = useState<SaleDeletePreview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Seçenekler
    const [revertStock, setRevertStock] = useState(true);
    const [adjustFinanceBalance, setAdjustFinanceBalance] = useState(true);
    const [deleteTransaction, setDeleteTransaction] = useState(true);

    useEffect(() => {
        if (!open || !saleId) {
            setPreview(null);
            return;
        }

        setIsLoading(true);
        // Varsayılanları sıfırla
        setRevertStock(true);
        setAdjustFinanceBalance(true);
        setDeleteTransaction(true);

        getSaleDeletePreview(saleId)
            .then((res) => {
                if (res.success && res.data) {
                    setPreview(res.data);
                    // Eğer veresiye ise kasa bakiyesi düşüşünü pasif yap (çünkü kasaya para girmemişti)
                    if (res.data.paymentMethod === "DEBT" || !res.data.transaction?.financeAccountId) {
                        setAdjustFinanceBalance(false);
                    }
                } else {
                    toast.error(res.error || "Satış detayları alınamadı.");
                    onOpenChange(false);
                }
            })
            .catch((err) => {
                console.error("Preview load error:", err);
                toast.error("Satış detayları yüklenirken hata oluştu.");
                onOpenChange(false);
            })
            .finally(() => setIsLoading(false));
    }, [open, saleId, onOpenChange]);

    const handleConfirmDelete = async () => {
        if (!saleId) return;
        setIsDeleting(true);

        try {
            const res = await deleteSale(saleId, {
                revertStock,
                adjustFinanceBalance,
                deleteTransaction,
            });

            if (res.success) {
                toast.success("Satış başarıyla silindi ve işlemler güncellendi.");
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(res.error || "Satış silinemedi.");
            }
        } catch (error) {
            console.error("Delete sale error:", error);
            toast.error("İşlem sırasında beklenmedik bir hata oluştu.");
        } finally {
            setIsDeleting(false);
        }
    };

    const currencySymbol = preview?.currency === "USD" ? "$" : preview?.currency === "EUR" ? "€" : "₺";
    const totalItemsCount = preview?.items.reduce((s, i) => s + i.quantity, 0) || 0;
    const isDebtSale = preview?.paymentMethod === "DEBT" || !!preview?.debt;

    const formattedAmount = (amount?: number) => {
        const val = amount || 0;
        return `${currencySymbol}${val.toLocaleString("tr-TR", {
            minimumFractionDigits: preview?.currency === "USD" || preview?.currency === "EUR" ? 2 : 2,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-card border-border/60 shadow-2xl">
                <DialogHeader className="p-5 pb-3 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                <span>Satış Kaydını Sil</span>
                                {preview && (
                                    <Badge variant="outline" className="text-xs font-mono bg-rose-500/5 text-rose-600 border-rose-500/20">
                                        #{preview.saleNumber}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Bu işlem kaydı silecek ve seçiminize göre stok, kasa bakiyesi ve hareketleri güncelleyecektir.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">Satış bilgileri yükleniyor...</span>
                    </div>
                ) : preview ? (
                    <div className="p-5 space-y-4 text-xs">
                        {/* Satış Özet Bilgi Kartı */}
                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">MÜŞTERİ</span>
                                <span className="font-semibold text-foreground truncate block mt-0.5">{preview.customerName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">TUTAR</span>
                                <span className="font-bold text-sm text-foreground block mt-0.5">{formattedAmount(preview.finalAmount)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">ÖDEME</span>
                                <span className="font-semibold text-foreground block mt-0.5">
                                    {preview.paymentMethod === "CASH" ? "Nakit" :
                                     preview.paymentMethod === "CARD" ? "Banka/Kredi Kartı" :
                                     preview.paymentMethod === "DEBT" ? "Veresiye (Borç)" :
                                     preview.paymentMethod === "TRANSFER" ? "Havale/EFT" : preview.paymentMethod}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">TARİH</span>
                                <span className="font-medium text-muted-foreground block mt-0.5">
                                    {format(new Date(preview.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                                </span>
                            </div>
                        </div>

                        {/* Ürün Kalemleri Listesi */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5 text-primary" />
                                    <span>Satıştaki Ürünler ({preview.items.length} Kalem, {totalItemsCount} Adet)</span>
                                </span>
                            </div>
                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-border/30 rounded-xl p-1.5 bg-muted/10">
                                {preview.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/30 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] shrink-0">
                                                {item.quantity}x
                                            </span>
                                            <span className="font-semibold text-foreground truncate">{item.productName}</span>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <span className="font-bold text-foreground block">{formattedAmount(item.totalPrice)}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                (Mevcut Stok: {item.currentStock} {revertStock ? `→ ${item.currentStock + item.quantity}` : ""})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* İnteraktif Silme Seçenekleri */}
                        <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                                SİLME İŞLEMİ AYARLARI
                            </span>

                            {/* Seçenek 1: Stok İadesi */}
                            <label className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                revertStock ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/20 border-border/40"
                            )}>
                                <Checkbox
                                    checked={revertStock}
                                    onCheckedChange={(c) => setRevertStock(!!c)}
                                    className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                />
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <Package className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="font-bold text-xs text-foreground">Ürünleri Stoğa Geri Ekle</span>
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-none font-bold">
                                            Önerilen
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Satılan {totalItemsCount} adet ürünün stoğu otomatik olarak depoya geri eklenecektir.
                                    </p>
                                </div>
                            </label>

                            {/* Seçenek 2: Kasa Bakiyesi Düzeltme */}
                            {!isDebtSale && preview.transaction?.financeAccountId && (
                                <label className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                    adjustFinanceBalance ? "bg-blue-500/5 border-blue-500/30" : "bg-muted/20 border-border/40"
                                )}>
                                    <Checkbox
                                        checked={adjustFinanceBalance}
                                        onCheckedChange={(c) => setAdjustFinanceBalance(!!c)}
                                        className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <div className="space-y-0.5 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            <span className="font-bold text-xs text-foreground">Kasa / Hesap Bakiyesinden Düş</span>
                                            <span className="text-[10px] text-muted-foreground">({preview.transaction.financeAccountName})</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Satış tutarı olan {formattedAmount(preview.finalAmount)}, kasa hesabından geri düşülecektir.
                                        </p>
                                    </div>
                                </label>
                            )}

                            {/* Seçenek 3: Kasa Hareketi Silme */}
                            <label className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                deleteTransaction ? "bg-amber-500/5 border-amber-500/30" : "bg-muted/20 border-border/40"
                            )}>
                                <Checkbox
                                    checked={deleteTransaction}
                                    onCheckedChange={(c) => setDeleteTransaction(!!c)}
                                    className="mt-0.5 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                />
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <Receipt className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                        <span className="font-bold text-xs text-foreground">Kasa Hareket Kaydını (İşlemi) Sil</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Kasa raporundaki bu satışa ait finansal işlem kaydı tamamen silinecektir.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* CANLI DEĞİŞİM ÖZETİ KARTI */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-500/10 via-background to-amber-500/5 border border-rose-500/20 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                SEÇİMLERİNİZE GÖRE GERÇEKLEŞECEK DEĞİŞİKLİKLER:
                            </span>

                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Depo / Stok Durumu:</span>
                                    <span className={cn("font-bold", revertStock ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                                        {revertStock ? `+${totalItemsCount} adet stoğa geri eklenecek` : "Stok değişmeyecek"}
                                    </span>
                                </div>

                                {!isDebtSale && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Kasa Bakiyesi ({preview.transaction?.financeAccountName || "Kasa"}):</span>
                                        <span className={cn("font-bold", adjustFinanceBalance ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                                            {adjustFinanceBalance ? `-${formattedAmount(preview.finalAmount)} azalacak` : "Bakiye değişmeyecek"}
                                        </span>
                                    </div>
                                )}

                                {isDebtSale && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Müşteri Veresiye Borcu:</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {formattedAmount(preview.debt?.remainingAmount || preview.finalAmount)} borç silinecek
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Kasa Raporu Listesi:</span>
                                    <span className={cn("font-bold", deleteTransaction ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                        {deleteTransaction ? "İşlem kaydı silinecek" : "İşlem kaydı saklanacak"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="p-4 border-t border-border/40 bg-muted/10 gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="h-10 rounded-xl text-xs font-semibold"
                    >
                        Vazgeç
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirmDelete}
                        disabled={isLoading || isDeleting || !preview}
                        className="h-10 rounded-xl text-xs font-bold gap-2 px-5 shadow-lg shadow-rose-500/20"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Siliniyor...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                <span>Satışı Kalıcı Olarak Sil</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

