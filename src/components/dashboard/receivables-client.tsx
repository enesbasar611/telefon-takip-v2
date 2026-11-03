"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    ChevronRight,
    Wallet,
    Calendar,
    Search,
    X as CloseIcon,
    MessageCircle,
    Receipt,
    Star,
    Plus,
    FileText,
    ArrowUpRight,
    HandCoins,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { DebtReceiptModal } from "@/components/finance/debt-receipt-modal";
import { AddDebtModal } from "@/components/finance/add-debt-modal";
import { CustomerVeresiyeModal } from "./modals/customer-veresiye-modal";
import { VeresiyeDetailModal } from "./modals/veresiye-detail-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getCustomerStatement } from "@/lib/actions/debt-actions";
import { buildUnifiedWhatsAppStatement } from "@/lib/debt-statement-calculator";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

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
        id?: string;
        name: string;
        phone?: string;
    };
    customerId: string;
    sale?: {
        saleNumber?: string;
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
    const queryClient = useQueryClient();
    const { rates, defaultCurrency } = useDashboardData();

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    // Modal states
    const [addDebtOpen, setAddDebtOpen] = useState(false);
    const [addDebtTarget, setAddDebtTarget] = useState<{ name: string; phone: string } | null>(null);

    const [allVeresiyeModalOpen, setAllVeresiyeModalOpen] = useState(false);

    const [detailCustomer, setDetailCustomer] = useState<any | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptCustomer, setReceiptCustomer] = useState<any | null>(null);

    // WhatsApp Modal States
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappPhone, setWhatsappPhone] = useState("");
    const [whatsappCustomerName, setWhatsappCustomerName] = useState("");
    const [whatsappMessage, setWhatsappMessage] = useState("");
    const [whatsappStatementData, setWhatsappStatementData] = useState<any>(null);

    // Pinned / Favorite Dealers
    const [pinnedCustomerIds, setPinnedCustomerIds] = useState<string[]>([]);

    const openWhatsAppModal = async (name: string, phone: string, totalTRY: number, totalUSD: number, customerId?: string) => {
        setWhatsappCustomerName(name);
        setWhatsappPhone(phone.replace(/[^0-9]/g, ''));

        const rawUsdRate = (rates as any)?.usd || (rates as any)?.USD;
        const parsedUsdRate = typeof rawUsdRate === "string" ? parseFloat(rawUsdRate.replace(",", ".")) : Number(rawUsdRate);
        const usdRate = Number.isFinite(parsedUsdRate) && parsedUsdRate > 0 ? parsedUsdRate : 34.5;

        if (customerId) {
            try {
                const res = await getCustomerStatement(customerId);
                if (res?.success) {
                    const stmt = {
                        customerName: name,
                        debts: res.debts || [],
                        transactions: res.transactions || [],
                        usdRate,
                        defaultCurrency: defaultCurrency || "TRY",
                        balanceTRY: Number((res as any).customer?.balance || 0),
                        balanceUSD: Number((res as any).customer?.balanceUsd || 0),
                        shopName: shopName || "Başar Teknik"
                    };
                    const msg = buildUnifiedWhatsAppStatement({
                        ...stmt,
                        includePaid: false,
                        includePayments: true
                    });
                    setWhatsappStatementData(stmt);
                    setWhatsappMessage(msg);
                    setWhatsappModalOpen(true);
                    return;
                }
            } catch (err) {
                console.error("Statement fetch error:", err);
            }
        }

        const fallbackStmt = {
            customerName: name,
            debts: [
                ...(totalTRY > 0 ? [{ amount: totalTRY, remainingAmount: totalTRY, currency: "TRY", notes: "Açık Bakiye" }] : []),
                ...(totalUSD > 0 ? [{ amount: totalUSD, remainingAmount: totalUSD, currency: "USD", notes: "Açık Bakiye" }] : []),
            ],
            transactions: [],
            usdRate,
            defaultCurrency: defaultCurrency || "TRY",
            balanceTRY: 0,
            balanceUSD: 0,
            shopName: shopName || "Başar Teknik"
        };
        const msg = buildUnifiedWhatsAppStatement({
            ...fallbackStmt,
            includePaid: false,
            includePayments: true
        });
        setWhatsappStatementData(fallbackStmt);
        setWhatsappMessage(msg);
        setWhatsappModalOpen(true);
    };

    const handleOpenAddDebt = (customer?: { name: string; phone?: string }) => {
        if (customer) {
            setAddDebtTarget({ name: customer.name, phone: customer.phone || "" });
        } else {
            setAddDebtTarget(null);
        }
        setAddDebtOpen(true);
    };

    const handleOpenCustomerDetail = (customer: any) => {
        setDetailCustomer(customer);
        setIsCustomerModalOpen(true);
    };

    const handleOpenReceiptForCustomer = (customer: any) => {
        setReceiptCustomer(customer);
        setReceiptOpen(true);
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
        const aggregates: Record<string, {
            id: string;
            name: string;
            phone?: string;
            totalTRY: number;
            totalUSD: number;
            count: number;
            lastActivity: number;
            debts: Debt[];
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
                    lastActivity: new Date(d.createdAt).getTime(),
                    debts: [],
                };
            }
            if (d.currency === "USD") {
                aggregates[cId].totalUSD += Number(d.remainingAmount);
            } else {
                aggregates[cId].totalTRY += Number(d.remainingAmount);
            }
            aggregates[cId].count += 1;
            aggregates[cId].debts.push(d);
        });

        return Object.values(aggregates).sort((a, b) => b.lastActivity - a.lastActivity);
    }, [unpaidDebts]);

    // Load & initialize pinned dealers from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("veresiye_pinned_dealers");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setPinnedCustomerIds(parsed);
                    return;
                }
            }
            // If no saved pins, automatically pre-pin the top 2 dealers
            if (allAggregates.length > 0) {
                const defaultPinned = allAggregates.slice(0, 2).map(c => c.id);
                setPinnedCustomerIds(defaultPinned);
                localStorage.setItem("veresiye_pinned_dealers", JSON.stringify(defaultPinned));
            }
        } catch (e) {
            console.error("Error reading pinned dealers:", e);
        }
    }, [allAggregates]);

    const togglePinCustomer = (customerId: string, customerName: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setPinnedCustomerIds(prev => {
            const isPinned = prev.includes(customerId);
            const next = isPinned ? prev.filter(id => id !== customerId) : [...prev, customerId];
            try {
                localStorage.setItem("veresiye_pinned_dealers", JSON.stringify(next));
            } catch {}
            if (isPinned) {
                toast.info(`${customerName} sık kullanılanlardan çıkarıldı`);
            } else {
                toast.success(`${customerName} sık kullanılan bayilere eklendi`);
            }
            return next;
        });
    };

    const pinnedAggregates = useMemo(() => {
        return allAggregates.filter(c => pinnedCustomerIds.includes(c.id));
    }, [allAggregates, pinnedCustomerIds]);

    const filteredCustomerAggregates = useMemo(() => {
        if (!searchTerm) return allAggregates;
        const lower = searchTerm.toLocaleLowerCase('tr-TR');
        return allAggregates.filter(c =>
            c.name.toLocaleLowerCase('tr-TR').includes(lower) ||
            (c.phone && c.phone.includes(lower))
        );
    }, [allAggregates, searchTerm]);

    return (
        <>
            <Card ref={cardRef} className="h-full flex flex-col border border-border/40 bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl dark:border-white/[0.08] shadow-sm rounded-2xl overflow-hidden font-sans group/card transition-all duration-300 hover:shadow-md animate-in fade-in">
                {/* Header Profile Section */}
                <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 px-5 py-3.5 bg-muted/10">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600 dark:text-amber-400">
                            <HandCoins className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <CardTitle className="font-semibold text-sm tracking-tight uppercase text-foreground flex items-center gap-2">
                                <span>Veresiyeler</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 normal-case">
                                    {allAggregates.length} Bayi
                                </span>
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">
                                    Veresiye & Alacak Takibi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Yeni Veresiye Ekle Butonu */}
                        <button
                            onClick={() => handleOpenAddDebt()}
                            className="h-7 px-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-all shadow-xs text-[11px] font-bold"
                            title="Yeni Veresiye / Alacak Ekle"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Yeni</span>
                        </button>

                        {/* Search Butonu */}
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={cn(
                                "h-7 w-7 rounded-lg flex items-center justify-center transition-all shadow-xs",
                                showSearch ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            title="Bayi / Müşteri Ara"
                        >
                            {showSearch ? <CloseIcon className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                        </button>

                        {/* Tüm Veresiye Detayları Modalı Açma Butonu */}
                        <button
                            onClick={() => setAllVeresiyeModalOpen(true)}
                            className="h-7 px-2 rounded-lg bg-muted/60 flex items-center gap-1 hover:bg-amber-500 hover:text-white text-muted-foreground transition-all shadow-xs text-[11px] font-bold"
                            title="Tüm Veresiyeler & Detay Modalı"
                        >
                            <span className="hidden sm:inline">Tümü</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3.5 flex flex-col custom-scrollbar">
                    {/* Arama Alanı */}
                    {showSearch && (
                        <div className="mb-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Bayi veya müşteri adıyla ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-xs focus-visible:ring-primary/20"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* SIK KULLANILAN BAYİLER ÖZEL ÇERÇEVESİ */}
                    <div className="mb-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.03] p-3 shadow-xs space-y-2 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                    Sık Kullanılan Bayiler
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-muted-foreground/70 font-semibold">
                                    {pinnedAggregates.length} Bayi Sabit
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all"
                                        >
                                            <Plus className="h-2.5 w-2.5" />
                                            <span>Bayi Sabitle</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[220px] max-h-60 overflow-y-auto p-1.5 rounded-xl z-50">
                                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-2 py-1 font-bold">
                                            Sabitlenecek Bayiyi Seçin
                                        </DropdownMenuLabel>
                                        {allAggregates.map(cust => (
                                            <DropdownMenuItem
                                                key={cust.id}
                                                onClick={() => togglePinCustomer(cust.id, cust.name)}
                                                className="text-xs flex items-center justify-between p-2 rounded-lg cursor-pointer"
                                            >
                                                <span className="font-semibold truncate">{cust.name}</span>
                                                {pinnedCustomerIds.includes(cust.id) ? (
                                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0 ml-1" />
                                                ) : (
                                                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {pinnedAggregates.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {pinnedAggregates.map(pinned => (
                                    <div
                                        key={pinned.id}
                                        onClick={() => handleOpenAddDebt(pinned)}
                                        className="p-2.5 rounded-xl bg-background/80 hover:bg-background border border-amber-500/20 hover:border-amber-500/40 shadow-xs transition-all flex items-center justify-between gap-2 group/pin cursor-pointer"
                                        title={`${pinned.name} için doğrudan alacak ekle (Tıkla)`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                                "h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs",
                                                getAvatarColor(pinned.name)
                                            )}>
                                                {pinned.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="text-xs font-bold text-foreground truncate group-hover/pin:text-amber-500 transition-colors">
                                                    {pinned.name}
                                                </h5>
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                                    {pinned.totalTRY > 0 && (
                                                        <span className="text-foreground">
                                                            ₺{pinned.totalTRY.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                    {pinned.totalUSD > 0 && (
                                                        <span className="text-blue-500 font-bold">
                                                            ${pinned.totalUSD.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenAddDebt(pinned);
                                                }}
                                                className="h-6 px-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-[9px] font-bold flex items-center gap-0.5"
                                                title="Alacak Ekle"
                                            >
                                                <Plus className="h-2.5 w-2.5" />
                                                <span>Alacak</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenCustomerDetail(pinned);
                                                }}
                                                className="h-6 px-1.5 rounded-md bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[9px] font-bold flex items-center gap-0.5"
                                                title="Tüm Detayları Modalda Aç"
                                            >
                                                <FileText className="h-2.5 w-2.5 text-blue-500" />
                                                <span>Detay</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => togglePinCustomer(pinned.id, pinned.name, e)}
                                                className="p-1 rounded-md text-amber-500 hover:text-rose-500 transition-colors"
                                                title="Sabitlemeyi kaldır"
                                            >
                                                <Star className="h-3 w-3 fill-amber-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-muted-foreground/70 italic py-1">
                                ⭐ Aşağıdaki listeden bayilerin yanındaki yıldıza tıklayarak buraya sabitleyebilirsiniz.
                            </p>
                        )}
                    </div>

                    {/* TÜM BAYİLER VE MÜŞTERİLER LİSTESİ */}
                    <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                        {filteredCustomerAggregates.length > 0 ? (
                            <>
                                {filteredCustomerAggregates.map((agg) => {
                                    const isPinned = pinnedCustomerIds.includes(agg.id);

                                    return (
                                        <div
                                            key={agg.id}
                                            onClick={() => handleOpenAddDebt(agg)}
                                            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/30 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] transition-all border border-border/40 hover:border-amber-500/30 group text-left cursor-pointer"
                                            title={`${agg.name} üzerine tıklayarak doğrudan alacak ekleyin`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Pin Toggle Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => togglePinCustomer(agg.id, agg.name, e)}
                                                    className="p-1 rounded-md hover:bg-muted/50 transition-colors shrink-0"
                                                    title={isPinned ? "Sık kullanılanlardan çıkar" : "Sık kullanılanlara sabitle"}
                                                >
                                                    <Star className={cn(
                                                        "h-3.5 w-3.5 transition-colors",
                                                        isPinned ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30 hover:text-amber-500"
                                                    )} />
                                                </button>

                                                {/* Avatar */}
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs",
                                                    getAvatarColor(agg.name)
                                                )}>
                                                    {agg.name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Dealer Info */}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-semibold tracking-tight text-foreground truncate group-hover:text-amber-500 transition-colors">
                                                        {agg.name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                        {agg.count} İşlem Bekliyor
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Balances & Action Buttons */}
                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                <div className="flex flex-col items-end mr-1">
                                                    {agg.totalTRY > 0 && (
                                                        <RevealFinancial amount={agg.totalTRY} className="text-xs sm:text-sm font-bold tabular-nums tracking-tight leading-tight text-foreground" />
                                                    )}
                                                    {agg.totalUSD > 0 && (
                                                        <RevealFinancial amount={agg.totalUSD} prefix="$" className="text-[10px] font-semibold text-blue-500 tracking-tight tabular-nums leading-tight" />
                                                    )}
                                                </div>

                                                {/* Hızlı Alacak Ekle Butonu */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenAddDebt(agg);
                                                    }}
                                                    className="h-7 px-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 shrink-0"
                                                    title={`${agg.name} için alacak ekle`}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Alacak</span>
                                                </button>

                                                {/* Detay Butonu (MODAL AÇAR - Kartı uzatmaz) */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCustomerDetail(agg);
                                                    }}
                                                    className="h-7 px-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-all text-[10px] font-bold flex items-center gap-1 shrink-0"
                                                    title="Veresiye Detaylarını Modalda Aç"
                                                >
                                                    <FileText className="h-3 w-3 text-blue-500" />
                                                    <span>Detay</span>
                                                </button>

                                                {/* WhatsApp Butonu */}
                                                {agg.phone && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openWhatsAppModal(agg.name, agg.phone!, agg.totalTRY, agg.totalUSD, agg.id);
                                                        }}
                                                        className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shrink-0"
                                                        title="WhatsApp Ekstre Gönder"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={() => setAllVeresiyeModalOpen(true)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 mt-1 rounded-xl bg-muted/20 hover:bg-muted/40 text-[10px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors border border-border/30"
                                >
                                    <span>TÜM VERESİYELERİ VE HAREKETLERİ GÖR</span>
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Users className="h-7 w-7 mb-1.5 opacity-40" />
                                <p className="text-[10px] font-semibold uppercase tracking-wider">
                                    {searchTerm ? "Aramaya uygun bayi bulunamadı" : "Kayıtlı veresiye alacağı bulunmuyor"}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 1. MÜŞTERİ / BAYİ ÖZEL VERESİYE DETAY MODALI (Detaya basınca açılan zengin modal) */}
            <CustomerVeresiyeModal
                customer={detailCustomer}
                isOpen={isCustomerModalOpen}
                onClose={() => {
                    setIsCustomerModalOpen(false);
                    setDetailCustomer(null);
                }}
                onAddDebt={(cust) => handleOpenAddDebt(cust)}
                onOpenReceipt={() => {
                    if (detailCustomer) handleOpenReceiptForCustomer(detailCustomer);
                }}
                onOpenWhatsApp={() => {
                    if (detailCustomer && detailCustomer.phone) {
                        openWhatsAppModal(detailCustomer.name, detailCustomer.phone, detailCustomer.totalTRY, detailCustomer.totalUSD, detailCustomer.id);
                    }
                }}
            />

            {/* 2. TÜM DÜKKAN GENEL VERESİYE DETAY MODALI */}
            <VeresiyeDetailModal
                isOpen={allVeresiyeModalOpen}
                onClose={() => setAllVeresiyeModalOpen(false)}
            />

            {/* 3. ALACAK / BORÇ EKLEME MODALI */}
            <AddDebtModal
                open={addDebtOpen}
                onOpenChange={(open) => {
                    setAddDebtOpen(open);
                    if (!open) setAddDebtTarget(null);
                }}
                rates={rates}
                initialData={addDebtTarget}
                onSuccess={() => {
                    setAddDebtOpen(false);
                    setAddDebtTarget(null);
                    queryClient.invalidateQueries({ queryKey: ["dashboard-receivables"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard-veresiye-detail"] });
                    queryClient.invalidateQueries({ queryKey: ["debts"] });
                }}
            />

            {/* 4. FİŞ & EKSTRE MODALI */}
            {receiptCustomer && (
                <DebtReceiptModal
                    open={receiptOpen}
                    onClose={() => {
                        setReceiptOpen(false);
                        setReceiptCustomer(null);
                    }}
                    customer={{ id: receiptCustomer.id, name: receiptCustomer.name, phone: receiptCustomer.phone }}
                    debts={receiptCustomer.debts || []}
                    shopName={shopName}
                    shopPhone={shopPhone}
                />
            )}

            {/* 5. WHATSAPP HATIRLATMA MODALI */}
            <WhatsAppConfirmModal
                isOpen={whatsappModalOpen}
                onClose={() => {
                    setWhatsappModalOpen(false);
                    setWhatsappStatementData(null);
                }}
                phone={whatsappPhone}
                customerName={whatsappCustomerName}
                initialMessage={whatsappMessage}
                onTogglePaidItems={whatsappStatementData ? (includePaid) => {
                    return buildUnifiedWhatsAppStatement({
                        ...whatsappStatementData,
                        includePaid,
                        includePayments: true
                    });
                } : undefined}
            />
        </>
    );
}
