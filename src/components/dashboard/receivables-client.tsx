"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Users, ChevronRight, ArrowLeft, Wallet, Calendar, Search, X as CloseIcon, MessageCircle, Receipt } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { useUI } from "@/lib/context/ui-context";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { DollarSign, Plus } from "lucide-react";
import { DebtReceiptModal } from "@/components/finance/debt-receipt-modal";
import { AddDebtModal } from "@/components/finance/add-debt-modal";

interface Debt {
    id: string;
    amount: number;
    remainingAmount: number;
    currency: string;
    createdAt: string;
    dueDate?: string | null;
    notes?: string | null;
    isPaid?: boolean;
    customer?: {
        name: string;
        phone?: string;
    };
    customerId: string;
    sale?: {
        items?: Array<{
            product?: { name: string };
            quantity: number;
            totalPrice: number;
        }>;
    } | null;
}

interface ReceivablesClientProps {
    debts: Debt[];
    shopName?: string;
    shopPhone?: string;
    cols?: number;
    rows?: number;
}

export function ReceivablesClient({ debts, shopName, shopPhone, cols = 8, rows = 4 }: ReceivablesClientProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [addDebtOpen, setAddDebtOpen] = useState(false);
    const [visibleCustomerLimit, setVisibleCustomerLimit] = useState(5);

    // WhatsApp Modal States
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappPhone, setWhatsappPhone] = useState("");
    const [whatsappCustomerName, setWhatsappCustomerName] = useState("");
    const [whatsappMessage, setWhatsappMessage] = useState("");

    const openWhatsAppModal = (name: string, phone: string, totalTRY: number, totalUSD: number) => {
        setWhatsappCustomerName(name);
        setWhatsappPhone(phone.replace(/[^0-9]/g, ''));

        let msg = `Merhaba ${name},\n\nBekleyen ödemeniz hakkında bilgi vermek istedim:\n\n`;
        if (totalTRY > 0) msg += `💰 Güncel Borç (TL): ₺${totalTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}\n`;
        if (totalUSD > 0) msg += `💵 Güncel Borç (USD): $${totalUSD.toFixed(2)}\n`;
        msg += `\nİyi çalışmalar dileriz.`;

        setWhatsappMessage(msg);
        setWhatsappModalOpen(true);
    };

    const AVATAR_COLORS = [
        "bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
        "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500",
        "bg-indigo-500", "bg-teal-500"
    ];

    const getAvatarColor = (name: string) => {
        const index = name.charCodeAt(0) % AVATAR_COLORS.length;
        return AVATAR_COLORS[index];
    };

    const unpaidDebts = useMemo(() =>
        Array.isArray(debts) ? debts.filter(d => !d.remainingAmount || Number(d.remainingAmount) > 0) : []
        , [debts]);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const calculateLimit = () => {
            const height = el.getBoundingClientRect().height;
            if (!height || height < 520) {
                setVisibleCustomerLimit(5);
                return;
            }
            const itemHeight = 60;
            const availableHeight = height - 120;
            const calculated = Math.floor(availableHeight / itemHeight);
            setVisibleCustomerLimit(Math.max(4, Math.min(10, calculated)));
        };

        calculateLimit();
        const observer = new ResizeObserver(calculateLimit);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const allAggregates = useMemo(() => {
        const aggregates: Record<string, {
            id: string;
            name: string;
            phone?: string;
            totalTRY: number;
            totalUSD: number;
            count: number;
            lastActivity: number;
        }> = {};

        unpaidDebts.forEach(d => {
            const cId = d.customerId;
            if (!aggregates[cId]) {
                aggregates[cId] = {
                    id: cId,
                    name: d.customer?.name || "Bilinmeyen Müşteri",
                    phone: d.customer?.phone,
                    totalTRY: 0,
                    totalUSD: 0,
                    count: 0,
                    lastActivity: new Date(d.createdAt).getTime()
                };
            }
            if (d.currency === "USD") {
                aggregates[cId].totalUSD += Number(d.remainingAmount);
            } else {
                aggregates[cId].totalTRY += Number(d.remainingAmount);
            }
            aggregates[cId].count += 1;
        });

        return Object.values(aggregates).sort((a, b) => b.lastActivity - a.lastActivity);
    }, [unpaidDebts]);

    const customerAggregates = useMemo(() => {
        if (!searchTerm) return allAggregates;
        const lower = searchTerm.toLocaleLowerCase('tr-TR');
        return allAggregates.filter(c => c.name.toLocaleLowerCase('tr-TR').includes(lower));
    }, [allAggregates, searchTerm]);

    const selectedCustomer = useMemo(() =>
        allAggregates.find(c => c.id === selectedCustomerId)
        , [allAggregates, selectedCustomerId]);

    const customerDebts = useMemo(() =>
        unpaidDebts.filter(d => d.customerId === selectedCustomerId)
        , [unpaidDebts, selectedCustomerId]);

    const visibleCustomerAggregates = useMemo(
        () => customerAggregates.slice(0, visibleCustomerLimit),
        [customerAggregates, visibleCustomerLimit]
    );
    const hiddenCustomerCount = Math.max(0, customerAggregates.length - visibleCustomerAggregates.length);

    return (
        <>
            <Card ref={cardRef} className="h-full flex flex-col border border-border/40 bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl dark:border-white/[0.08] shadow-sm rounded-2xl overflow-hidden font-sans group/card transition-all duration-300 hover:shadow-md animate-in fade-in">
                <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 px-5 py-3.5 bg-muted/10">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-600">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <CardTitle className="font-semibold text-sm tracking-tight uppercase text-foreground">
                                {selectedCustomerId ? "Borç Detayları" : "Alacaklarım"}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">
                                    {selectedCustomerId ? "Müşteri Dosyası" : "Tahsilat Bekleyenler"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {/* Fiş butonu - sadece müşteri seçiliyken */}
                        {selectedCustomerId && (
                            <button
                                onClick={() => setReceiptOpen(true)}
                                className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
                                title="Fiş Yazdır / WhatsApp"
                            >
                                <Receipt className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {selectedCustomerId && selectedCustomer?.phone && (
                            <button
                                onClick={() => openWhatsAppModal(selectedCustomer.name, selectedCustomer.phone!, selectedCustomer.totalTRY, selectedCustomer.totalUSD)}
                                className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-xs"
                                title="WhatsApp'tan Hatırlat"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {!selectedCustomerId && (
                            <button
                                onClick={() => setAddDebtOpen(true)}
                                className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-xs"
                                title="Yeni Veresiye Ekle"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {!selectedCustomerId && (
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className={cn(
                                    "h-7 w-7 rounded-lg flex items-center justify-center transition-all shadow-xs",
                                    showSearch ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {showSearch ? <CloseIcon className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                            </button>
                        )}
                        {!selectedCustomerId && (
                            <Link href="/veresiye" className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-orange-500 hover:text-white text-muted-foreground transition-all shadow-xs">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 flex flex-col custom-scrollbar">
                    {showSearch && !selectedCustomerId && (
                        <div className="mb-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Müşteri ismiyle ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-xs focus-visible:ring-primary/20"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    {!selectedCustomerId ? (
                        <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 custom-scrollbar">
                            {customerAggregates.length > 0 ? (
                                <>
                                    {visibleCustomerAggregates.map((agg) => (
                                        <div key={agg.id} className="relative group/item">
                                            <button
                                                onClick={() => setSelectedCustomerId(agg.id)}
                                                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] transition-all border border-border/40 hover:border-border text-left"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs",
                                                        getAvatarColor(agg.name)
                                                    )}>
                                                        {agg.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold tracking-tight text-foreground truncate">{agg.name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{agg.count} İşlem Bekliyor</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <div className="flex flex-col items-end">
                                                        {agg.totalTRY > 0 && <RevealFinancial amount={agg.totalTRY} className="text-xs sm:text-sm font-bold tabular-nums tracking-tight leading-tight text-foreground" />}
                                                        {agg.totalUSD > 0 && <RevealFinancial amount={agg.totalUSD} prefix="$" className="text-[10px] font-semibold text-blue-500 tracking-tight tabular-nums leading-tight" />}
                                                    </div>
                                                    {agg.phone && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openWhatsAppModal(agg.name, agg.phone!, agg.totalTRY, agg.totalUSD);
                                                            }}
                                                            className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shrink-0 cursor-pointer"
                                                            title="WhatsApp Mesaj Gönder"
                                                        >
                                                            <MessageCircle className="h-3.5 w-3.5" />
                                                        </div>
                                                    )}
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover/item:text-foreground transition-colors shrink-0" />
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                    {hiddenCustomerCount > 0 && (
                                        <Link
                                            href="/veresiye"
                                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 text-[10px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
                                        >
                                            <span>{hiddenCustomerCount} KAYIT DAHA VAR</span>
                                            <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <Users className="h-7 w-7 mb-1.5 opacity-40" />
                                    <p className="text-[10px] font-semibold uppercase tracking-wider">Kayıtlı alacak bulunmuyor</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/10 flex flex-col items-center justify-center text-center">
                                    <Wallet className="h-4 w-4 text-primary mb-1 opacity-70" />
                                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Toplam Alacak (TL)</p>
                                    <RevealFinancial amount={selectedCustomer?.totalTRY || 0} className="text-lg font-bold tabular-nums tracking-tight text-foreground" />
                                </div>
                                <div className="bg-blue-500/5 rounded-xl p-3.5 border border-blue-500/10 flex flex-col items-center justify-center text-center">
                                    <DollarSign className="h-4 w-4 text-blue-500 mb-1 opacity-70" />
                                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Toplam Alacak (USD)</p>
                                    <RevealFinancial amount={selectedCustomer?.totalUSD || 0} prefix="$" className="text-lg font-bold tabular-nums tracking-tight text-blue-500" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Açık İşlemler</p>
                                {customerDebts.map((debt) => (
                                    <div key={debt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                            <div className="min-w-0">
                                                <span className="text-xs font-semibold text-foreground">{new Date(debt.createdAt).toLocaleDateString("tr-TR")}</span>
                                                {debt.notes && <p className="text-[10px] text-muted-foreground italic truncate">{debt.notes}</p>}
                                            </div>
                                        </div>
                                        <RevealFinancial
                                            amount={Number(debt.remainingAmount)}
                                            prefix={debt.currency === "USD" ? "$" : "₺"}
                                            className={cn(
                                                "text-xs sm:text-sm font-bold tabular-nums shrink-0 ml-2",
                                                debt.currency === "USD" ? "text-blue-500" : "text-foreground"
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="pt-3 space-y-2">
                                <Button
                                    onClick={() => setReceiptOpen(true)}
                                    size="sm"
                                    className="w-full h-8 text-xs font-semibold tracking-wider uppercase gap-1.5 rounded-lg"
                                >
                                    <Receipt className="h-3.5 w-3.5" />
                                    Fiş Yazdır / WhatsApp
                                </Button>

                                <Button
                                    size="sm"
                                    className="w-full h-8 text-xs font-semibold tracking-wider uppercase rounded-lg"
                                    variant="outline"
                                    onClick={() => setSelectedCustomerId(null)}
                                >
                                    Listeye Geri Dön
                                </Button>
                            </div>
                        </div>
                    )}

                    <WhatsAppConfirmModal
                        isOpen={whatsappModalOpen}
                        onClose={() => setWhatsappModalOpen(false)}
                        phone={whatsappPhone}
                        customerName={whatsappCustomerName}
                        initialMessage={whatsappMessage}
                    />
                </CardContent>
            </Card>

            {/* Fiş Modal */}
            {selectedCustomer && (
                <DebtReceiptModal
                    open={receiptOpen}
                    onClose={() => setReceiptOpen(false)}
                    customer={{ id: selectedCustomer.id, name: selectedCustomer.name, phone: selectedCustomer.phone }}
                    debts={customerDebts}
                    shopName={shopName}
                    shopPhone={shopPhone}
                />
            )}

            <AddDebtModal
                open={addDebtOpen}
                onOpenChange={setAddDebtOpen}
                onSuccess={() => setAddDebtOpen(false)}
            />
        </>
    );
}
