"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Users, ChevronRight, ArrowLeft, Wallet, Calendar, Search, X as CloseIcon, MessageCircle, Receipt } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { useUI } from "@/lib/context/ui-context";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { DollarSign } from "lucide-react";
import { DebtReceiptModal } from "@/components/finance/debt-receipt-modal";

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
}

export function ReceivablesClient({ debts, shopName, shopPhone }: ReceivablesClientProps) {
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);

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

    const allAggregates = useMemo(() => {
        const aggregates: Record<string, { id: string; name: string; phone?: string; totalTRY: number; totalUSD: number; count: number }> = {};

        unpaidDebts.forEach(d => {
            const cId = d.customerId;
            if (!aggregates[cId]) {
                aggregates[cId] = {
                    id: cId,
                    name: d.customer?.name || "Bilinmeyen",
                    phone: d.customer?.phone,
                    totalTRY: 0,
                    totalUSD: 0,
                    count: 0
                };
            }
            if (d.currency === "USD") {
                aggregates[cId].totalUSD += Number(d.remainingAmount);
            } else {
                aggregates[cId].totalTRY += Number(d.remainingAmount);
            }
            aggregates[cId].count += 1;
        });

        return Object.values(aggregates).sort((a, b) => (b.totalTRY + b.totalUSD * 30) - (a.totalTRY + a.totalUSD * 30));
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

    return (
        <>
            <Card className="h-full flex flex-col border border-border/40 bg-card/60 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden font-sans group/card transition-all duration-500 hover:shadow-[0_30px_70px_-12px_rgba(0,0,0,0.2)] hover:bg-card/80">
                <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                            <Wallet className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex flex-col">
                            <CardTitle className="font-black text-xl tracking-tighter uppercase text-orange-950/80 dark:text-orange-200/80">
                                {selectedCustomerId ? "Borç Detayları" : "Alacaklarım"}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <p className="text-[10px] text-orange-900/40 dark:text-orange-300/40 uppercase font-black tracking-widest leading-none">
                                    {selectedCustomerId ? "Müşteri Dosyası" : "Tahsilat Bekleyenler"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Fiş butonu - sadece müşteri seçiliyken */}
                        {selectedCustomerId && (
                            <button
                                onClick={() => setReceiptOpen(true)}
                                className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                                title="Fiş Yazdır / WhatsApp"
                            >
                                <Receipt className="h-5 w-5" />
                            </button>
                        )}
                        {selectedCustomerId && selectedCustomer?.phone && (
                            <button
                                onClick={() => openWhatsAppModal(selectedCustomer.name, selectedCustomer.phone!, selectedCustomer.totalTRY, selectedCustomer.totalUSD)}
                                className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="WhatsApp'tan Hatırlat"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </button>
                        )}
                        {!selectedCustomerId && (
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                                    showSearch ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                                )}
                            >
                                {showSearch ? <CloseIcon className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                            </button>
                        )}
                        {!selectedCustomerId && (
                            <Link href="/veresiye" className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                                <ChevronRight className="h-5 w-5" />
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-8 pt-2 flex flex-col custom-scrollbar">
                    {showSearch && !selectedCustomerId && (
                        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Müşteri ismiyle ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 h-14 bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-primary/20"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    {!selectedCustomerId ? (
                        <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            {customerAggregates.length > 0 ? (
                                customerAggregates.map((agg) => (
                                    <div key={agg.id} className="relative group/item">
                                        <button
                                            onClick={() => setSelectedCustomerId(agg.id)}
                                            className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-muted/20 hover:bg-muted/40 transition-all border border-transparent hover:border-border/60 text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm text-white transition-all duration-300",
                                                    getAvatarColor(agg.name)
                                                )}>
                                                    {agg.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-bold tracking-tight text-foreground/90">{agg.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{agg.count} İşlem Bekliyor</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    {agg.totalTRY > 0 && <RevealFinancial amount={agg.totalTRY} className="text-lg font-black tabular-nums tracking-tighter leading-tight" />}
                                                    {agg.totalUSD > 0 && <RevealFinancial amount={agg.totalUSD} prefix="$" className="text-xs font-black text-blue-600/80 font-mono tracking-tighter tabular-nums leading-tight" />}
                                                </div>
                                                {agg.phone && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openWhatsAppModal(agg.name, agg.phone!, agg.totalTRY, agg.totalUSD);
                                                        }}
                                                        className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shrink-0 cursor-pointer"
                                                        title="WhatsApp Mesaj Gönder"
                                                    >
                                                        <MessageCircle className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover/item:text-primary transition-colors shrink-0" />
                                            </div>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <Users className="h-16 w-16 mb-4 stroke-[1.5]" />
                                    <p className="text-sm font-bold tracking-tight">Kayıtlı alacak bulunmuyor</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10 flex flex-col items-center justify-center text-center shadow-inner">
                                    <Wallet className="h-5 w-5 text-primary mb-2 opacity-60" />
                                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">Toplam Alacak (TL)</p>
                                    <RevealFinancial amount={selectedCustomer?.totalTRY || 0} className="text-2xl font-black tabular-nums tracking-tighter" />
                                </div>
                                <div className="bg-blue-500/5 rounded-[2rem] p-6 border border-blue-500/10 flex flex-col items-center justify-center text-center shadow-inner">
                                    <DollarSign className="h-5 w-5 text-blue-600 mb-2 opacity-60" />
                                    <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mb-1">Toplam Alacak (USD)</p>
                                    <RevealFinancial amount={selectedCustomer?.totalUSD || 0} prefix="$" className="text-2xl font-black tabular-nums font-mono tracking-tighter" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-2">Açık İşlemler</p>
                                {customerDebts.map((debt) => (
                                    <div key={debt.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/30 mb-2">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground/40" />
                                            <div>
                                                <span className="text-xs font-bold text-muted-foreground">{new Date(debt.createdAt).toLocaleDateString("tr-TR")}</span>
                                                {debt.notes && <p className="text-[10px] text-muted-foreground/60 italic mt-0.5">{debt.notes}</p>}
                                            </div>
                                        </div>
                                        <RevealFinancial
                                            amount={Number(debt.remainingAmount)}
                                            prefix={debt.currency === "USD" ? "$" : "₺"}
                                            className={cn(
                                                "text-sm font-black tabular-nums",
                                                debt.currency === "USD" ? "text-blue-600 font-mono" : "text-foreground"
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Fiş Yaz butonu - alttan */}
                            <button
                                onClick={() => setReceiptOpen(true)}
                                className="w-full mt-4 h-12 rounded-[1.5rem] font-bold text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 hover:border-primary transition-all"
                            >
                                <Receipt className="h-4 w-4" />
                                Fiş Yazdır / WhatsApp'a Gönder
                            </button>

                            <Button
                                className="w-full mt-2 h-12 rounded-[1.5rem] font-bold text-sm tracking-tight uppercase"
                                variant="secondary"
                                onClick={() => setSelectedCustomerId(null)}
                            >
                                Listeye Geri Dön
                            </Button>
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

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground)/0.2); border-radius: 10px; }
                `}</style>
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
        </>
    );
}
