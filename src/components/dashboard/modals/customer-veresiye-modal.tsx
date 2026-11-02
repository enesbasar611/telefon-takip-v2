"use client";

import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Users,
    Phone,
    Plus,
    Receipt,
    MessageCircle,
    ArrowUpRight,
    Search,
    CheckCircle2,
    Wallet,
    DollarSign,
    Calendar,
    Clock,
    AlertCircle,
    Loader2,
    CreditCard,
    Banknote,
    Building2,
    X,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { collectGlobalCustomerPayment } from "@/lib/actions/debt-actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CustomerVeresiyeModalProps {
    customer: {
        id: string;
        name: string;
        phone?: string;
        totalTRY: number;
        totalUSD: number;
        count: number;
        debts: any[];
    } | null;
    isOpen: boolean;
    onClose: () => void;
    onAddDebt: (customer: { name: string; phone?: string }) => void;
    onOpenReceipt: () => void;
    onOpenWhatsApp: () => void;
}

export function CustomerVeresiyeModal({
    customer,
    isOpen,
    onClose,
    onAddDebt,
    onOpenReceipt,
    onOpenWhatsApp,
}: CustomerVeresiyeModalProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentCurrency, setPaymentCurrency] = useState<"TRY" | "USD">("TRY");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Initial payment form setup
    const handleStartPayment = (specificDebt?: any) => {
        if (specificDebt) {
            setSelectedDebtId(specificDebt.id);
            setPaymentAmount(Number(specificDebt.remainingAmount).toString());
            setPaymentCurrency(specificDebt.currency === "USD" ? "USD" : "TRY");
            setPaymentNotes(`${specificDebt.notes || "Borç"} kapatma tahsilatı`);
        } else {
            setSelectedDebtId(null);
            const defaultCurr = (customer?.totalTRY || 0) > 0 ? "TRY" : "USD";
            setPaymentCurrency(defaultCurr);
            setPaymentAmount(
                defaultCurr === "TRY"
                    ? (customer?.totalTRY || 0).toString()
                    : (customer?.totalUSD || 0).toString()
            );
            setPaymentNotes("Cari hesap veresiye tahsilatı");
        }
        setShowPaymentForm(true);
    };

    const handleConfirmPayment = async () => {
        if (!customer) return;
        const numAmount = Number(paymentAmount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Lütfen geçerli bir ödeme tutarı giriniz.");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const res = await collectGlobalCustomerPayment({
                customerId: customer.id,
                paymentAmount: numAmount,
                paymentCurrency,
                paymentMethod,
                notes: paymentNotes || undefined,
                debtIds: selectedDebtId ? [selectedDebtId] : undefined,
            });

            if (res.success) {
                toast.success("Tahsilat başarıyla kaydedildi.", {
                    description: `${customer.name} için ${numAmount} ${paymentCurrency} tahsil edildi.`
                });
                setShowPaymentForm(false);
                setSelectedDebtId(null);
                queryClient.invalidateQueries({ queryKey: ["dashboard-receivables"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard-veresiye-detail"] });
                queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
                onClose();
            } else {
                toast.error(res.error || "Tahsilat kaydedilemedi.");
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const debts = customer?.debts || [];

    const filteredDebts = useMemo(() => {
        if (!searchQuery.trim()) return debts;
        const q = searchQuery.toLowerCase().trim();
        return debts.filter((d: any) =>
            d.notes?.toLowerCase().includes(q) ||
            d.sale?.saleNumber?.toLowerCase().includes(q) ||
            d.sale?.items?.some((i: any) => i.product?.name?.toLowerCase().includes(q))
        );
    }, [debts, searchQuery]);

    if (!customer) return null;

    const AVATAR_COLORS = [
        "bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
        "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500",
    ];
    const avatarColor = AVATAR_COLORS[customer.name.charCodeAt(0) % AVATAR_COLORS.length];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-border/40 p-0 overflow-hidden bg-background/95 dark:bg-zinc-950/98 backdrop-blur-3xl rounded-[2rem] shadow-2xl transition-all sm:max-w-2xl max-h-[90vh] flex flex-col z-50">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600" />

                {/* Header Profile Section */}
                <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shrink-0 shadow-md",
                                avatarColor
                            )}>
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="font-extrabold text-lg sm:text-xl tracking-tight uppercase text-foreground truncate">
                                        {customer.name}
                                    </DialogTitle>
                                    <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-500 bg-amber-500/5 shrink-0">
                                        {customer.count} Açık Kayıt
                                    </Badge>
                                </div>
                                <DialogDescription className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                    {customer.phone ? (
                                        <span className="flex items-center gap-1 text-foreground/80">
                                            <Phone className="h-3 w-3 text-emerald-500" />
                                            {customer.phone}
                                        </span>
                                    ) : (
                                        <span>Telefon kaydı bulunmuyor</span>
                                    )}
                                    <span>•</span>
                                    <span className="text-amber-500 font-semibold">Bayi Cari Hesabı</span>
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Top Direct Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    onAddDebt({ name: customer.name, phone: customer.phone });
                                }}
                                className="rounded-xl h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Alacak Ekle</span>
                            </Button>

                            <Link href={`/musteriler/${customer.id}`} onClick={onClose}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl h-9 text-xs font-bold gap-1.5 border-border/60 hover:bg-muted/50"
                                    title="Müşteri Profiline Git"
                                >
                                    <span>Profil</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4">
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                                <Wallet className="h-3 w-3 text-amber-500" />
                                Toplam Borç (TL)
                            </span>
                            <span className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-tight mt-0.5">
                                ₺{customer.totalTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-blue-500" />
                                Toplam Borç (USD)
                            </span>
                            <span className="text-lg font-black text-blue-500 tracking-tight mt-0.5">
                                ${customer.totalUSD.toFixed(2)}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                Açık Kalem Sayısı
                            </span>
                            <span className="text-lg font-black text-foreground tracking-tight mt-0.5">
                                {debts.length} İşlem
                            </span>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-3">
                        <Button
                            size="sm"
                            onClick={() => handleStartPayment()}
                            variant={showPaymentForm ? "secondary" : "default"}
                            className="rounded-xl h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                        >
                            <Banknote className="h-3.5 w-3.5" />
                            <span>Tahsilat Al</span>
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenReceipt()}
                            className="rounded-xl h-8 text-xs font-semibold gap-1.5 border-border/60 hover:bg-muted/50"
                        >
                            <Receipt className="h-3.5 w-3.5 text-blue-500" />
                            <span>Fiş & Ekstre</span>
                        </Button>

                        {customer.phone && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenWhatsApp()}
                                className="rounded-xl h-8 text-xs font-semibold gap-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>WhatsApp Ekstre</span>
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Inline Fast Payment Drawer */}
                {showPaymentForm && (
                    <div className="p-4 bg-emerald-500/[0.04] border-b border-emerald-500/20 animate-in slide-in-from-top-3 duration-200 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                    {selectedDebtId ? "Seçili Borcu Tahsil Et" : "Genel Tahsilat Yap"}
                                </span>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowPaymentForm(false)}
                                className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                    Tahsilat Tutarı
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="h-9 font-bold text-sm bg-background border-border/60 rounded-xl"
                                        autoFocus
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                        {paymentCurrency === "USD" ? "$" : "₺"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                    Para Birimi
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 h-9">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentCurrency("TRY")}
                                        className={cn(
                                            "rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1",
                                            paymentCurrency === "TRY"
                                                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        ₺ TL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentCurrency("USD")}
                                        className={cn(
                                            "rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1",
                                            paymentCurrency === "USD"
                                                ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        $ USD
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                    Ödeme Yöntemi
                                </label>
                                <div className="grid grid-cols-3 gap-1 h-9">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("CASH")}
                                        className={cn(
                                            "rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center",
                                            paymentMethod === "CASH"
                                                ? "bg-emerald-600 text-white border-emerald-700"
                                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Nakit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("CARD")}
                                        className={cn(
                                            "rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center",
                                            paymentMethod === "CARD"
                                                ? "bg-blue-600 text-white border-blue-700"
                                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Kart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("TRANSFER")}
                                        className={cn(
                                            "rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center",
                                            paymentMethod === "TRANSFER"
                                                ? "bg-purple-600 text-white border-purple-700"
                                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Havale
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-border/20">
                            <Input
                                placeholder="Tahsilat açıklaması (opsiyonel)..."
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="h-8 text-xs bg-background/80 border-border/50 rounded-lg flex-1"
                            />
                            <Button
                                size="sm"
                                disabled={isSubmittingPayment}
                                onClick={handleConfirmPayment}
                                className="h-8 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shrink-0"
                            >
                                {isSubmittingPayment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                <span>Kaydet</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Search in open debts */}
                <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-border/30 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Borç kaydı veya ürün adı ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8 bg-muted/20 border-border/40 rounded-xl text-xs"
                        />
                    </div>
                </div>

                {/* Debt Items Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 custom-scrollbar">
                    {filteredDebts.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                            <p className="text-xs font-bold text-foreground">
                                {searchQuery ? "Aramaya uygun borç kaydı bulunamadı" : "Açık borç kaydı bulunmuyor"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {searchQuery ? "Farklı bir arama yapmayı deneyin." : "Müşterinin tüm borçları ödenmiş."}
                            </p>
                        </div>
                    ) : (
                        filteredDebts.map((debt: any) => {
                            const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date();
                            const isPartial = Number(debt.remainingAmount) < Number(debt.amount) - 0.01;
                            const currencyPrefix = debt.currency === "USD" ? "$" : "₺";

                            return (
                                <div
                                    key={debt.id}
                                    className="p-3.5 rounded-2xl bg-muted/15 hover:bg-muted/30 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] border border-border/40 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-xs text-foreground truncate">
                                                {debt.notes ||
                                                    (debt.sale?.items?.length
                                                        ? debt.sale.items.map((i: any) => `${i.product?.name || "Ürün"} (x${i.quantity})`).join(", ")
                                                        : "Açık Veresiye Kaydı")}
                                            </span>
                                            {debt.sale?.saleNumber && (
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono font-bold">
                                                    #{debt.sale.saleNumber}
                                                </Badge>
                                            )}
                                            {isOverdue && (
                                                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 font-bold bg-rose-500/10 text-rose-500 border-rose-500/20">
                                                    Vadesi Geçti
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(debt.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })}
                                            </span>
                                            {debt.dueDate && (
                                                <span className={cn(
                                                    "flex items-center gap-1 font-medium",
                                                    isOverdue ? "text-rose-500" : "text-amber-500"
                                                )}>
                                                    <Clock className="h-3 w-3" />
                                                    Vade: {format(new Date(debt.dueDate), "d MMM yyyy", { locale: tr })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount and Quick Collect */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                                        <div className="text-left sm:text-right">
                                            <div className={cn(
                                                "font-black text-sm tracking-tight",
                                                debt.currency === "USD" ? "text-blue-500" : "text-foreground"
                                            )}>
                                                {currencyPrefix}{Number(debt.remainingAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            {isPartial && (
                                                <span className="text-[10px] text-muted-foreground/70 italic block">
                                                    (Toplam: {currencyPrefix}{Number(debt.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleStartPayment(debt)}
                                            className="h-8 px-2.5 rounded-xl text-[11px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all gap-1"
                                        >
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>Tahsil Et</span>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

