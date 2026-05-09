"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Package,
    ShoppingCart,
    Wallet,
    ArrowUpCircle,
    TrendingUp,
    CreditCard,
    Banknote,
    Smartphone,
    ChevronRight,
    Info,
    CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

interface ApproveShortageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: (mode: "STOCK" | "SALE" | "DEBT", paymentMethod?: "CASH" | "CARD" | "TRANSFER" | "DEBT", customPrice?: number, currency?: "TL" | "USD") => void;
    itemName: string;
    quantity: number;
    requesterName: string;
    isCustomer: boolean;
    productId?: string;
}

export function ApproveShortageModal({
    open,
    onOpenChange,
    onApprove,
    itemName,
    quantity,
    requesterName,
    isCustomer,
    productId
}: ApproveShortageModalProps) {
    const [step, setStep] = useState<"CHOICE" | "PRICE" | "PAYMENT">("CHOICE");
    const [selectedMode, setSelectedMode] = useState<"STOCK" | "SALE" | "DEBT" | null>(null);
    const [price, setPrice] = useState<number>(0);
    const [currency, setCurrency] = useState<"TL" | "USD">("TL");
    const { rates } = useDashboardData();
    const currentUsdRate = rates?.usd || 34;

    const handleChoice = (mode: "STOCK" | "SALE" | "DEBT") => {
        if (mode === "STOCK") {
            onApprove("STOCK");
            onOpenChange(false);
        } else {
            setSelectedMode(mode);
            setStep("PRICE");
        }
    };

    const handlePriceConfirm = () => {
        if (selectedMode === "DEBT") {
            onApprove("DEBT", "DEBT", price, currency);
            onOpenChange(false);
        } else {
            setStep("PAYMENT");
        }
    };

    const reset = () => {
        setStep("CHOICE");
        setSelectedMode(null);
        setPrice(0);
        setCurrency("TL");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) reset(); }}>
            <DialogContent className="sm:max-w-[450px] bg-background border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <ArrowUpCircle className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Teslimat Onayı</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                                {itemName} • {quantity} ADET
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 pb-8 space-y-6">
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed text-blue-400">
                            Bu ürün kurye tarafından teslim alındı. {step === "PRICE" ? "Lütfen birim fiyatı giriniz." : "Stoğa nasıl eklemek istersiniz?"}
                            {isCustomer && !selectedMode && <span className="block mt-1 font-black opacity-80 underline">{requesterName} için doğrudan işlem yapabilirsiniz.</span>}
                        </p>
                    </div>

                    {step === "CHOICE" ? (
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => handleChoice("STOCK")}
                                className="group flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-black transition-colors">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">Sadece Stoğa Ekle</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60">Ürünü dükkan stoğuna kaydeder.</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>

                            {isCustomer && (
                                <>
                                    <button
                                        onClick={() => handleChoice("SALE")}
                                        className="group flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                                                <ShoppingCart className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-tight">Bayiye Satış Olarak İşle</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground opacity-60">Stoğa ekler ve bayiye nakit/pos satışı yapar.</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>

                                    <button
                                        onClick={() => handleChoice("DEBT")}
                                        className="group flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                                <Wallet className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-tight">Bayiye Veresiye Yaz</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground opacity-60">Stoğa ekler ve bayinin borcuna işler.</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>
                                </>
                            )}
                        </div>
                    ) : step === "PRICE" ? (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Birim Fiyat ({currency})</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <PriceInput
                                            value={price}
                                            onChange={setPrice}
                                            prefix={currency === "TL" ? "₺" : "$"}
                                            className="h-12 text-lg font-black"
                                        />
                                    </div>
                                    <div className="flex bg-zinc-100 dark:bg-white/5 rounded-2xl p-1 border border-zinc-200 dark:border-white/10">
                                        <button
                                            onClick={() => setCurrency("TL")}
                                            className={cn(
                                                "px-4 rounded-xl text-[10px] font-black transition-all",
                                                currency === "TL" ? "bg-blue-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            TL
                                        </button>
                                        <button
                                            onClick={() => setCurrency("USD")}
                                            className={cn(
                                                "px-4 rounded-xl text-[10px] font-black transition-all",
                                                currency === "USD" ? "bg-blue-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            USD
                                        </button>
                                    </div>
                                </div>
                                {currency === "USD" && (
                                    <p className="text-[10px] font-bold text-muted-foreground text-right">
                                        Yaklaşık {(price * currentUsdRate).toLocaleString('tr-TR')} ₺
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("CHOICE")}
                                    className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    onClick={handlePriceConfirm}
                                    className="flex-[2] h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                >
                                    Devam Et
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Ödeme Yöntemi Seçin</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: "CASH", label: "NAKİT", icon: Banknote, color: "emerald" },
                                        { id: "CARD", label: "KREDİ KARTI / POS", icon: CreditCard, color: "blue" },
                                        { id: "TRANSFER", label: "HAVALE / EFT", icon: Smartphone, color: "indigo" },
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => {
                                                onApprove("SALE", method.id as any, price, currency);
                                                onOpenChange(false);
                                            }}
                                            className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all",
                                                    method.color === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
                                                        method.color === "blue" ? "bg-blue-500/10 text-blue-500" : "bg-indigo-500/10 text-indigo-500"
                                                )}>
                                                    <method.icon className="h-5 w-5" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tighter">{method.label}</span>
                                            </div>
                                            <CheckCircle className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setStep("PRICE")}
                                className="w-full h-11 text-[10px] font-black uppercase tracking-widest"
                            >
                                Geri Dön
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
