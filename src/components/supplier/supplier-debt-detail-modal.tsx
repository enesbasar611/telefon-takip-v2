"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    CreditCard,
    Wallet,
    ArrowRight,
    Search,
    X,
    Building2,
    Phone,
    Package,
    Calendar,
    ChevronRight,
    DollarSign,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SupplierDebtDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: any[];
    onSelectSupplier: (supplierId: string) => void;
    onPaySupplier?: (supplier: any) => void;
    usdRate?: number;
}

export function SupplierDebtDetailModal({
    isOpen,
    onClose,
    suppliers,
    onSelectSupplier,
    onPaySupplier,
    usdRate = 34.5
}: SupplierDebtDetailModalProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Borcu olan tedarikçileri filtrele ve sırala (en yüksek borçtan en düşüğe)
    const debtSuppliers = useMemo(() => {
        return (suppliers || [])
            .map((s: any) => {
                const balance = Math.max(0, Number(s.balance || 0));
                const totalShopping = Number(s.totalShopping || 0);
                const paid = Math.max(0, totalShopping - balance);
                const lastPurchase = s.purchases?.[0];

                return {
                    ...s,
                    computedBalance: balance,
                    computedTotalShopping: totalShopping,
                    computedPaid: paid,
                    lastPurchaseDate: lastPurchase?.createdAt ? new Date(lastPurchase.createdAt) : null,
                };
            })
            .filter((s: any) => s.computedBalance > 0)
            .sort((a: any, b: any) => b.computedBalance - a.computedBalance);
    }, [suppliers]);

    // Toplam borç tutarları
    const totalDebtTry = useMemo(() => {
        return debtSuppliers.reduce((sum, s) => sum + s.computedBalance, 0);
    }, [debtSuppliers]);

    const totalDebtUsd = useMemo(() => {
        return usdRate > 0 ? totalDebtTry / usdRate : 0;
    }, [totalDebtTry, usdRate]);

    // Arama filtrelemesi
    const filteredList = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        if (!q) return debtSuppliers;
        return debtSuppliers.filter((s: any) =>
            (s.name || "").toLowerCase().includes(q) ||
            (s.contactName || "").toLowerCase().includes(q) ||
            (s.phone || "").toLowerCase().includes(q) ||
            (s.category || "").toLowerCase().includes(q)
        );
    }, [debtSuppliers, searchTerm]);

    const handleGoToSupplier = (supplierId: string) => {
        onClose();
        onSelectSupplier(supplierId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-w-full w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border/60 shadow-2xl rounded-2xl">
                {/* Header */}
                <DialogHeader className="p-5 border-b border-border/50 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-lg font-black tracking-tight text-foreground uppercase">
                                    Tedarikçi Borç Dağılımı
                                </DialogTitle>
                                <Badge className="bg-rose-500/10 text-rose-400 border-none text-[10px] uppercase font-bold px-2 py-0.5">
                                    {debtSuppliers.length} Borçlu Tedarikçi
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                Hangi toptancı ve tedarikçiye ne kadar borcumuz var, alım ve ödeme dökümü
                            </p>
                        </div>
                    </div>

                    {/* Quick Total KPI */}
                    <div className="text-left sm:text-right p-2.5 sm:p-0 rounded-xl bg-rose-500/5 sm:bg-transparent border border-rose-500/20 sm:border-none">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                            Toplam Kalan Borç
                        </span>
                        <div className="flex items-baseline sm:justify-end gap-1.5">
                            <span className="text-xl font-black text-rose-400 font-mono tabular-nums">
                                ₺{Math.round(totalDebtTry).toLocaleString("tr-TR")}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground font-mono tabular-nums">
                                (~${totalDebtUsd.toFixed(2)} USD)
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {/* Search Bar */}
                <div className="p-3 px-4 border-b border-border/40 bg-card/60 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tedarikçi adı veya telefon ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8.5 pl-8 pr-7 text-xs rounded-xl bg-background/50 border-border/50"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                        Borçlu listelenen: <strong className="text-foreground">{filteredList.length}</strong> firma
                    </span>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto max-h-[55vh] p-4 space-y-3 custom-scrollbar">
                    {filteredList.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            {debtSuppliers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">Tebrikler! Açık borcunuz bulunmuyor</span>
                                    <span className="text-xs text-muted-foreground">Tüm tedarikçi bakiyeleri ve siparişler tamamen kapatılmış.</span>
                                </div>
                            ) : (
                                <p className="text-xs">Aramanıza uygun borçlu tedarikçi bulunamadı.</p>
                            )}
                        </div>
                    ) : (
                        filteredList.map((sup: any) => {
                            const supUsd = usdRate > 0 ? sup.computedBalance / usdRate : 0;
                            return (
                                <div
                                    key={sup.id}
                                    className="p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                >
                                    {/* Left: Supplier info */}
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    {sup.name}
                                                </h4>
                                                {sup.category && (
                                                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground border-border/60 px-1.5 py-0">
                                                        {sup.category}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                                                {sup.phone && (
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Phone className="w-3 h-3 text-muted-foreground/70" /> {sup.phone}
                                                    </span>
                                                )}
                                                {sup.lastPurchaseDate && (
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                                                        Son Alım: {format(sup.lastPurchaseDate, "dd.MM.yyyy", { locale: tr })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center: Financial breakdown */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-border/30">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Toplam Alış</span>
                                            <span className="font-mono font-bold text-foreground">
                                                ₺{Math.round(sup.computedTotalShopping).toLocaleString("tr-TR")}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Ödenen</span>
                                            <span className="font-mono font-bold text-emerald-400">
                                                ₺{Math.round(sup.computedPaid).toLocaleString("tr-TR")}
                                            </span>
                                        </div>
                                        <div className="flex flex-col col-span-2 sm:col-span-1">
                                            <span className="text-[10px] font-black uppercase text-rose-400">Kalan Borç</span>
                                            <div className="flex items-baseline md:justify-end gap-1">
                                                <span className="font-mono font-black text-rose-400 text-sm">
                                                    ₺{Math.round(sup.computedBalance).toLocaleString("tr-TR")}
                                                </span>
                                                <span className="text-[10px] font-medium text-muted-foreground font-mono">
                                                    (${supUsd.toFixed(2)})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 shrink-0 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/30">
                                        {onPaySupplier && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold gap-1 px-3"
                                                onClick={() => {
                                                    onClose();
                                                    onPaySupplier(sup);
                                                }}
                                            >
                                                <Wallet className="w-3.5 h-3.5" />
                                                <span>Öde</span>
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            className="h-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1 px-3 shadow-xs"
                                            onClick={() => handleGoToSupplier(sup.id)}
                                        >
                                            <span>Detayına Git</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 px-5 border-t border-border/40 bg-white/[0.01] flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        Tedarikçi kartına veya <strong>&quot;Detayına Git&quot;</strong> butonuna tıklayarak sipariş ve cari hareketlerine ulaşabilirsiniz.
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 rounded-lg text-xs font-bold"
                    >
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

