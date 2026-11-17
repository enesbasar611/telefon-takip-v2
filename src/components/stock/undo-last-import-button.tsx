"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw, AlertTriangle, Package, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    getLastWholesalerBatchAction,
    rollbackLastWholesalerBatchAction
} from "@/lib/actions/stock-import-actions";
import { cn } from "@/lib/utils";

interface UndoLastImportButtonProps {
    className?: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    onSuccess?: () => void;
    alwaysShow?: boolean;
}

export function UndoLastImportButton({
    className,
    variant = "outline",
    size = "sm",
    onSuccess,
    alwaysShow = false,
}: UndoLastImportButtonProps) {
    const queryClient = useQueryClient();
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["last-wholesaler-batch"],
        queryFn: () => getLastWholesalerBatchAction(),
        staleTime: 10 * 1000,
        refetchOnWindowFocus: true,
    });

    if (isLoading) {
        if (!alwaysShow) return null;
        return (
            <Button
                variant={variant}
                size={size}
                disabled
                className={cn("rounded-xl border-border/40 text-muted-foreground/50 opacity-60", className)}
            >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Geri Al</span>
            </Button>
        );
    }

    if (!data?.hasBatch || !data?.batch) {
        if (!alwaysShow) return null;
        return (
            <Button
                variant={variant}
                size={size}
                disabled
                className={cn(
                    "rounded-xl border-border/40 text-muted-foreground/60 font-medium gap-1.5 opacity-50 cursor-not-allowed",
                    className
                )}
                title="Geri alınabilecek son toptancı stok/fiş girişi bulunmuyor"
            >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span>Son Girişi Geri Al</span>
            </Button>
        );
    }

    const batch = data.batch;

    const handleConfirmRollback = async () => {
        setIsRollingBack(true);
        try {
            toast.loading("Son toptancı stok ve fiş girişi geri alınıyor...", { id: "rollback-batch" });
            const res = await rollbackLastWholesalerBatchAction();
            if (res.success) {
                toast.success(res.message || "İşlem başarıyla geri alındı.", { id: "rollback-batch", duration: 6000 });
                setIsOpen(false);
                // Tüm ilgili önbellekleri tazele
                queryClient.invalidateQueries({ queryKey: ["suppliers"] });
                queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                queryClient.invalidateQueries({ queryKey: ["supplier"] });
                queryClient.invalidateQueries({ queryKey: ["products"] });
                queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
                queryClient.invalidateQueries({ queryKey: ["accounts"] });
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
                queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
                queryClient.invalidateQueries({ queryKey: ["critical-products"] });
                queryClient.invalidateQueries({ queryKey: ["last-wholesaler-batch"] });
                onSuccess?.();
            } else {
                toast.error(res.error || "Geri alma başarısız oldu.", { id: "rollback-batch" });
            }
        } catch (err: any) {
            toast.error(err?.message || "Geri alma sırasında hata oluştu.", { id: "rollback-batch" });
        } finally {
            setIsRollingBack(false);
        }
    };

    const formattedDate = batch.createdAt ? new Date(batch.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={cn(
                        "rounded-xl border-amber-500/30 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-bold gap-1.5 transition-all",
                        className
                    )}
                    title="Son toptancı stok/fiş girişini geri al"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Son Girişi Geri Al</span>
                    {batch.totalQuantity > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-md bg-amber-500/20 text-[10px] font-black">
                            {batch.totalQuantity} Adet
                        </span>
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-md rounded-2xl">
                <AlertDialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-base font-black">Son Girişi Geri Almak İstiyor musunuz?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Bu işlem son yapılan toptancı parça/fiş kaydını tüm sistemden geri alır.
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="my-3 p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-muted-foreground font-semibold">Toptancı / Tedarikçi:</span>
                        <span className="font-bold text-foreground">{batch.supplierName || "Bağımsız Giriş"}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-blue-400" />
                            Stok Etkisi:
                        </span>
                        <span className="font-bold text-foreground">
                            {batch.addToStock
                                ? `${batch.totalQuantity} Adet Stok Düşülecek`
                                : "Stoğa Eklenmedi (Stok Değişmez)"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                            Sipariş & Borç Tutarı:
                        </span>
                        <span className="font-bold text-foreground">
                            ₺{Number(batch.totalAmountTry || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            {batch.remainingAmountTry > 0 && ` (₺${batch.remainingAmountTry.toLocaleString("tr-TR")} borç iptal edilir)`}
                        </span>
                    </div>

                    {batch.paidAmountTry > 0 && (
                        <div className="flex items-center justify-between text-emerald-500 font-bold">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Kasaya İade Edilecek:
                            </span>
                            <span>+₺{Number(batch.paidAmountTry).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>

                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={isRollingBack} className="rounded-xl h-10 px-4 text-xs font-semibold">
                        Vazgeç
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirmRollback();
                        }}
                        disabled={isRollingBack}
                        className="rounded-xl h-10 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-lg shadow-amber-600/20"
                    >
                        {isRollingBack ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Geri Alınıyor...</span>
                            </>
                        ) : (
                            <>
                                <RotateCcw className="w-4 h-4" />
                                <span>Evet, Girişi Geri Al</span>
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
