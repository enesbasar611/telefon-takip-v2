"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Printer,
    FileText,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingDown,
    TrendingUp,
    Download,
    X,
    Search,
    Calendar,
    ChevronDown,
    ChevronUp,
    Package,
    Building2,
    Phone,
    MapPin,
    CreditCard,
    Filter
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TedarikciCariEkstreModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
    usdRate?: number;
}

interface CariMovement {
    id: string;
    date: Date;
    dateStr: string;
    timeStr: string;
    type: "ALIM" | "ODEME" | "IADE";
    title: string;
    documentNo: string;
    description: string;
    debit: number;   // Borç artıran (Alım/Sipariş)
    credit: number;  // Borç azaltan (Ödeme/İade)
    balanceAfter: number;
    items?: any[];
    rawPaymentId?: string;
    rawOrderId?: string;
}

export function TedarikciCariEkstreModal({
    isOpen,
    onClose,
    supplier,
    usdRate = 34.5
}: TedarikciCariEkstreModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "ALIM" | "ODEME" | "IADE">("ALL");
    const [dateRange, setDateRange] = useState<"ALL" | "THIS_MONTH" | "LAST_90">("ALL");
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Tüm hareketleri (Alımlar, Ödemeler, İadeler) birleştir ve kronolojik yürüyen bakiye hesapla
    const { allMovements, totalDebit, totalCredit, finalBalance } = useMemo(() => {
        if (!supplier) {
            return { allMovements: [], totalDebit: 0, totalCredit: 0, finalBalance: 0 };
        }

        const rawMovements: {
            id: string;
            date: Date;
            type: "ALIM" | "ODEME" | "IADE";
            title: string;
            documentNo: string;
            description: string;
            debit: number;
            credit: number;
            items?: any[];
            rawOrderId?: string;
            rawPaymentId?: string;
        }[] = [];

        // 1. Alımlar / Siparişler (Purchases)
        const purchases = supplier.purchases || [];
        purchases.forEach((p: any) => {
            const orderDate = new Date(p.createdAt);
            const total = Number(p.totalAmount || 0);
            const items = p.items || [];
            const itemsSummary = items.length > 0
                ? `${items.length} Kalem (${items.slice(0, 3).map((it: any) => `${it.quantity || 1}x ${it.name || it.product?.name || "Parça"}`).join(", ")}${items.length > 3 ? "..." : ""})`
                : "Alım / Sipariş Girişi";

            rawMovements.push({
                id: `po-${p.id}`,
                date: orderDate,
                type: "ALIM",
                title: p.type === "INITIAL" ? "Stok Devir Alımı" : "Mal Alımı / Fatura",
                documentNo: p.orderNo ? `#SIP-${p.orderNo}` : `#SIP-${p.id.slice(-6).toUpperCase()}`,
                description: itemsSummary,
                debit: total,
                credit: 0,
                items: items,
                rawOrderId: p.id,
            });

            // Eğer geçmişte SupplierTransaction kaydı oluşturulmamış peşin/kısmi ödeme varsa ekle
            const paidAmount = total - Number(p.remainingAmount || 0);
            const hasLinkedTx = (supplier.SupplierTransaction || supplier.transactions || []).some(
                (tx: any) => tx.purchaseOrderId === p.id
            );
            if (paidAmount > 0 && !hasLinkedTx) {
                rawMovements.push({
                    id: `pay-synth-${p.id}`,
                    date: new Date(orderDate.getTime() + 1000), // sipariş anında yapılan ödeme
                    type: "ODEME",
                    title: "Sipariş Ödemesi",
                    documentNo: p.orderNo ? `#SIP-${p.orderNo}` : `#SIP-${p.id.slice(-6).toUpperCase()}`,
                    description: `${p.orderNo || p.id.slice(-6)} nolu sipariş peşin / kısmi ödemesi`,
                    debit: 0,
                    credit: paidAmount,
                    rawOrderId: p.id,
                });
            }
        });

        // 2. Tedarikçi Ödemeleri & Cari Hareketleri (SupplierTransaction)
        const transactions = supplier.SupplierTransaction || supplier.transactions || [];
        transactions.forEach((tx: any) => {
            const txDate = new Date(tx.date || tx.createdAt);
            const amount = Number(tx.amount || 0);
            if (amount <= 0) return;

            if (tx.type === "EXPENSE") {
                // Biz tedarikçiye ödeme yaptık (borç azalır)
                rawMovements.push({
                    id: `tx-${tx.id}`,
                    date: txDate,
                    type: "ODEME",
                    title: "Borç Ödemesi",
                    documentNo: tx.purchaseOrderId
                        ? `#SIP-${tx.purchaseOrder?.orderNo || tx.purchaseOrderId.slice(-6).toUpperCase()}`
                        : "CARİ ÖDEME",
                    description: tx.description || "Kasa / Banka Borç Ödemesi",
                    debit: 0,
                    credit: amount,
                    rawPaymentId: tx.id,
                });
            } else if (tx.type === "INCOME") {
                // Tedarikçiden alım / borç tahakkuku (eğer sipariş dışıysa)
                if (!tx.purchaseOrderId) {
                    rawMovements.push({
                        id: `tx-${tx.id}`,
                        date: txDate,
                        type: "ALIM",
                        title: "Cari Borç Tahakkuku",
                        documentNo: "CARİ GİRİŞ",
                        description: tx.description || "Tedarikçi Borç Tahakkuku",
                        debit: amount,
                        credit: 0,
                        rawPaymentId: tx.id,
                    });
                }
            }
        });

        // 3. İadeler (Returns)
        const returns = supplier.returns || [];
        returns.forEach((ret: any) => {
            const retDate = new Date(ret.createdAt);
            const retQty = Number(ret.quantity || 1);
            const unitBuy = Number(ret.product?.buyPrice || 0);
            const retTotal = retQty * unitBuy;
            if (retTotal > 0 && ret.returnStatus === "COMPLETED") {
                rawMovements.push({
                    id: `ret-${ret.id}`,
                    date: retDate,
                    type: "IADE",
                    title: "Parça İadesi",
                    documentNo: `#İAD-${ret.ticketNumber || ret.id.slice(-6).toUpperCase()}`,
                    description: `${retQty}x ${ret.product?.name || "İade Ürün"} iadesi`,
                    debit: 0,
                    credit: retTotal,
                });
            }
        });

        // Tarihe göre kronolojik (eskiden yeniye) sırala ve yürüyen bakiye hesapla
        rawMovements.sort((a, b) => a.date.getTime() - b.date.getTime());

        let runningBalance = 0;
        let debitSum = 0;
        let creditSum = 0;

        const movementsWithBalance: CariMovement[] = rawMovements.map((m) => {
            debitSum += m.debit;
            creditSum += m.credit;
            runningBalance = runningBalance + m.debit - m.credit;

            return {
                ...m,
                dateStr: format(m.date, "dd.MM.yyyy", { locale: tr }),
                timeStr: format(m.date, "HH:mm", { locale: tr }),
                balanceAfter: Math.round(runningBalance * 100) / 100,
            };
        });

        return {
            allMovements: movementsWithBalance,
            totalDebit: debitSum,
            totalCredit: creditSum,
            finalBalance: runningBalance,
        };
    }, [supplier]);

    // Filtreleme (arama, tip, tarih)
    const filteredMovements = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        const now = new Date();

        return allMovements.filter((m) => {
            // Tip filtresi
            if (typeFilter !== "ALL" && m.type !== typeFilter) return false;

            // Tarih filtresi
            if (dateRange === "THIS_MONTH") {
                const isThisMonth =
                    m.date.getMonth() === now.getMonth() &&
                    m.date.getFullYear() === now.getFullYear();
                if (!isThisMonth) return false;
            } else if (dateRange === "LAST_90") {
                const diffDays = (now.getTime() - m.date.getTime()) / (1000 * 3600 * 24);
                if (diffDays > 90) return false;
            }

            // Metin araması
            if (query) {
                const matchDoc = m.documentNo.toLowerCase().includes(query);
                const matchDesc = m.description.toLowerCase().includes(query);
                const matchTitle = m.title.toLowerCase().includes(query);
                const matchItems = m.items?.some((it: any) =>
                    (it.name || it.product?.name || "").toLowerCase().includes(query)
                );
                return matchDoc || matchDesc || matchTitle || matchItems;
            }

            return true;
        });
    }, [allMovements, searchTerm, typeFilter, dateRange]);

    // CSV İndirme
    const handleExportCSV = () => {
        if (!allMovements.length) return;

        const headers = ["Tarih", "Saat", "İşlem Tipi", "Belge No", "Açıklama", "Borç (Alım ₺)", "Alacak (Ödeme ₺)", "Bakiye (₺)"];
        const rows = allMovements.map((m) => [
            m.dateStr,
            m.timeStr,
            m.type === "ALIM" ? "Alım / Sipariş" : m.type === "ODEME" ? "Ödeme" : "İade",
            `"${m.documentNo}"`,
            `"${m.description.replace(/"/g, '""')}"`,
            m.debit > 0 ? m.debit.toFixed(2) : "0.00",
            m.credit > 0 ? m.credit.toFixed(2) : "0.00",
            m.balanceAfter.toFixed(2),
        ]);

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = (supplier?.name || "Tedarikci").replace(/[^a-zA-Z0-9_-]/g, "_");
        link.setAttribute("href", url);
        link.setAttribute("download", `${safeName}_Cari_Ekstre_${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    if (!supplier) return null;

    const rate = usdRate > 0 ? usdRate : 34.5;
    const toUsd = (tl: number) => (rate > 0 ? tl / rate : 0);

    return (
        <>
            {/* On-Screen Modal View */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-5xl max-w-full w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-card border-border/60 shadow-2xl rounded-2xl print:hidden">
                    {/* Header */}
                    <DialogHeader className="p-5 border-b border-border/50 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-lg font-black tracking-tight text-foreground uppercase">
                                        Cari Hesap Ekstresi
                                    </DialogTitle>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                                        {supplier.name}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                    Tüm alım, sipariş ve ödeme hareketlerinin kronolojik dökümü
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                size="sm"
                                className="h-8.5 rounded-xl border-border/50 text-xs font-bold gap-1.5 hover:bg-white/5"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Excel (CSV)</span>
                            </Button>
                            <Button
                                onClick={handlePrint}
                                size="sm"
                                className="h-8.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 shadow-sm"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Yazdır / PDF</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Quick Financial Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/20 border-b border-border/40">
                        <div className="p-3 rounded-xl bg-card border border-border/40">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    Toplam Alışveriş
                                </span>
                                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-foreground tabular-nums">
                                    ₺{Math.round(totalDebit).toLocaleString("tr-TR")}
                                </span>
                                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                                    (~${toUsd(totalDebit).toFixed(2)} USD)
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-card border border-border/40">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    Toplam Ödenen
                                </span>
                                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-emerald-500 tabular-nums">
                                    ₺{Math.round(totalCredit).toLocaleString("tr-TR")}
                                </span>
                                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                                    (~${toUsd(totalCredit).toFixed(2)} USD)
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-card border border-border/40">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    Güncel Kalan Borç
                                </span>
                                <Badge
                                    className={cn(
                                        "text-[9px] font-black px-1.5 py-0 border-none",
                                        finalBalance > 0
                                            ? "bg-rose-500/10 text-rose-500"
                                            : "bg-emerald-500/10 text-emerald-500"
                                    )}
                                >
                                    {finalBalance > 0 ? "BORÇLUYUZ" : "KAPALI"}
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span
                                    className={cn(
                                        "text-lg font-black tabular-nums",
                                        finalBalance > 0 ? "text-rose-500" : "text-emerald-500"
                                    )}
                                >
                                    ₺{Math.round(finalBalance).toLocaleString("tr-TR")}
                                </span>
                                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                                    (~${toUsd(finalBalance).toFixed(2)} USD)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-3 px-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 bg-card/60">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Belge no, ürün veya açıklama ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8.5 pl-8 pr-8 text-xs rounded-xl bg-background/50 border-border/50"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Type Filter Buttons */}
                            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40">
                                {(
                                    [
                                        { key: "ALL", label: "Tümü" },
                                        { key: "ALIM", label: "Alımlar" },
                                        { key: "ODEME", label: "Ödemeler" },
                                        { key: "IADE", label: "İadeler" },
                                    ] as const
                                ).map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => setTypeFilter(t.key)}
                                        className={cn(
                                            "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                            typeFilter === t.key
                                                ? "bg-card text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40">
                                {(
                                    [
                                        { key: "ALL", label: "Tüm Tarih" },
                                        { key: "THIS_MONTH", label: "Bu Ay" },
                                        { key: "LAST_90", label: "Son 90 Gün" },
                                    ] as const
                                ).map((d) => (
                                    <button
                                        key={d.key}
                                        onClick={() => setDateRange(d.key)}
                                        className={cn(
                                            "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                            dateRange === d.key
                                                ? "bg-card text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-y-auto max-h-[50vh] p-0 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10 border-b border-border/50 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Tarih</th>
                                    <th className="py-2.5 px-3">İşlem</th>
                                    <th className="py-2.5 px-3">Belge / Fiş No</th>
                                    <th className="py-2.5 px-3">Açıklama & Detay</th>
                                    <th className="py-2.5 px-3 text-right">Borç (Alım)</th>
                                    <th className="py-2.5 px-3 text-right">Alacak (Ödeme)</th>
                                    <th className="py-2.5 px-3 text-right">Kalan Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 text-xs">
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <FileText className="w-8 h-8 opacity-30" />
                                                <span className="font-semibold">Kayıtlı hareket bulunamadı</span>
                                                <span className="text-[11px] opacity-70">
                                                    {searchTerm || typeFilter !== "ALL" || dateRange !== "ALL"
                                                        ? "Filtre kriterlerinize uygun işlem hareketi yok."
                                                        : "Bu tedarikçiye ait henüz bir alışveriş veya ödeme kaydı bulunmuyor."}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Ekstre dökümünde en son işlemler en üstte:
                                    // Yürüyen bakiyeyi net görmek için en yeniden eskiye ters çevirip sunuyoruz
                                    [...filteredMovements].reverse().map((m) => {
                                        const isExpanded = !!expandedRows[m.id];
                                        const hasItems = m.items && m.items.length > 0;

                                        return (
                                            <tr
                                                key={m.id}
                                                className={cn(
                                                    "hover:bg-white/[0.02] transition-colors group",
                                                    isExpanded && "bg-white/[0.03]"
                                                )}
                                            >
                                                <td className="py-3 px-3 tabular-nums">
                                                    <div className="font-bold text-foreground">{m.dateStr}</div>
                                                    <div className="text-[10px] text-muted-foreground">{m.timeStr}</div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <Badge
                                                        className={cn(
                                                            "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                                                            m.type === "ALIM"
                                                                ? "bg-blue-500/10 text-blue-400"
                                                                : m.type === "ODEME"
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : "bg-amber-500/10 text-amber-400"
                                                        )}
                                                    >
                                                        {m.type === "ALIM" ? "Alım" : m.type === "ODEME" ? "Ödeme" : "İade"}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-3 font-mono font-bold text-foreground tabular-nums">
                                                    {m.documentNo}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground/90">{m.title}</span>
                                                        <span className="text-[11px] text-muted-foreground line-clamp-1">
                                                            {m.description}
                                                        </span>
                                                        {hasItems && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleRow(m.id)}
                                                                className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold w-fit"
                                                            >
                                                                {isExpanded ? (
                                                                    <>
                                                                        <ChevronUp className="w-3 h-3" />
                                                                        <span>Ürünleri Gizle</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ChevronDown className="w-3 h-3" />
                                                                        <span>{m.items!.length} Ürünü Göster</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        {isExpanded && hasItems && (
                                                            <div className="mt-2 p-2 rounded-lg bg-black/30 border border-border/40 text-[11px] space-y-1">
                                                                {m.items!.map((it: any, idx: number) => (
                                                                    <div
                                                                        key={it.id || idx}
                                                                        className="flex items-center justify-between py-0.5 border-b border-white/5 last:border-0"
                                                                    >
                                                                        <span className="font-medium text-foreground">
                                                                            {it.quantity || 1}x {it.name || it.product?.name || "Ürün"}
                                                                        </span>
                                                                        <span className="font-mono text-muted-foreground">
                                                                            ₺{Number(it.buyPrice || 0).toLocaleString("tr-TR")}
                                                                            {it.buyPriceUsd ? ` ($${it.buyPriceUsd})` : ""}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono font-bold text-foreground tabular-nums">
                                                    {m.debit > 0 ? (
                                                        <span className="text-blue-400">
                                                            +₺{m.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/40">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono font-bold text-foreground tabular-nums">
                                                    {m.credit > 0 ? (
                                                        <span className="text-emerald-400">
                                                            -₺{m.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/40">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                                                    <span
                                                        className={cn(
                                                            m.balanceAfter > 0 ? "text-rose-400" : "text-emerald-400"
                                                        )}
                                                    >
                                                        ₺{m.balanceAfter.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-3 px-5 border-t border-border/40 bg-white/[0.01] flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                            Toplam <span className="font-bold text-foreground">{filteredMovements.length}</span> hareket listeleniyor
                        </div>
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

            {/* Print Section (A4 Clean Stylesheet) */}
            <div id="print-area-wrapper" className="fixed inset-0 z-[9999] bg-white text-black hidden print:block overflow-visible">
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 12mm 15mm;
                            }
                            body {
                                background: white !important;
                                color: black !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            body > *:not(#print-area-wrapper) {
                                display: none !important;
                            }
                            #print-area-wrapper {
                                display: block !important;
                                position: static !important;
                                width: 100% !important;
                                background: white !important;
                            }
                            .ekstre-table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 15px 0;
                            }
                            .ekstre-table th, .ekstre-table td {
                                border: 1px solid #333 !important;
                                padding: 6px 8px !important;
                                font-size: 9.5px !important;
                                color: black !important;
                            }
                            .ekstre-table th {
                                background-color: #f2f2f2 !important;
                                font-weight: bold !important;
                                text-align: left;
                            }
                        }
                    `,
                    }}
                />

                <div className="p-8 w-full max-w-[210mm] mx-auto text-black" id="print-area">
                    {/* Print Header */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                        <div>
                            <h1 className="font-black text-2xl uppercase tracking-wider mb-1">
                                CARİ HESAP EKSTRESİ
                            </h1>
                            <p className="text-xs text-neutral-600">
                                Rapor Basım Tarihi: {format(new Date(), "dd MMMM yyyy HH:mm", { locale: tr })}
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="font-bold text-lg uppercase tracking-tight">TOPTAN & SERVİS TAKİP</h2>
                            <p className="text-[10px] text-neutral-500">Resmi Cari Hesap Dökümü</p>
                        </div>
                    </div>

                    {/* Parties info */}
                    <div className="grid grid-cols-2 gap-6 mb-6 p-4 border border-black/40 rounded-sm bg-neutral-50">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase text-neutral-500 mb-1">
                                TEDARİKÇİ / BAYİ BİLGİLERİ
                            </h3>
                            <p className="text-sm font-bold text-black uppercase">{supplier.name}</p>
                            <p className="text-xs text-neutral-800">Yetkili: {supplier.contactName || "—"}</p>
                            <p className="text-xs text-neutral-800">Telefon: {supplier.phone || "—"}</p>
                            <p className="text-xs text-neutral-800">Adres: {supplier.address || "—"}</p>
                            {supplier.iban && <p className="text-xs text-neutral-800 font-mono">IBAN: {supplier.iban}</p>}
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-bold uppercase text-neutral-500 mb-1">
                                HESAP BAKİYE ÖZETİ
                            </h3>
                            <div className="space-y-1 text-xs">
                                <p>
                                    Toplam Alışveriş: <strong className="font-mono">₺{Math.round(totalDebit).toLocaleString("tr-TR")}</strong>
                                </p>
                                <p>
                                    Toplam Ödenen: <strong className="font-mono">₺{Math.round(totalCredit).toLocaleString("tr-TR")}</strong>
                                </p>
                                <p className="text-sm border-t border-neutral-400 pt-1 font-bold">
                                    Net Güncel Bakiye:{" "}
                                    <span className="font-mono">
                                        ₺{Math.round(finalBalance).toLocaleString("tr-TR")}
                                    </span>
                                </p>
                                <p className="text-[10px] font-bold uppercase">
                                    {finalBalance > 0
                                        ? "DURUM: TEDARİKÇİYE BORÇLUYUZ"
                                        : finalBalance < 0
                                            ? "DURUM: TEDARİKÇİDEN ALACAKLIYIZ"
                                            : "DURUM: HESAP TAMAMEN KAPALI"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="ekstre-table">
                        <thead>
                            <tr>
                                <th style={{ width: "70px" }}>TARİH</th>
                                <th style={{ width: "55px" }}>TİP</th>
                                <th style={{ width: "100px" }}>EVRAK NO</th>
                                <th>AÇIKLAMA / KALEM DETAYI</th>
                                <th style={{ width: "85px", textAlign: "right" }}>BORÇ (ALIM)</th>
                                <th style={{ width: "85px", textAlign: "right" }}>ALACAK (ÖDEME)</th>
                                <th style={{ width: "85px", textAlign: "right" }}>BAKİYE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-6 text-neutral-500">
                                        Bu tedarikçiye ait herhangi bir hesap hareketi bulunmamaktadır.
                                    </td>
                                </tr>
                            ) : (
                                allMovements.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.dateStr}</td>
                                        <td style={{ fontWeight: "bold" }}>
                                            {m.type === "ALIM" ? "ALIM" : m.type === "ODEME" ? "ÖDEME" : "İADE"}
                                        </td>
                                        <td style={{ fontFamily: "monospace" }}>{m.documentNo}</td>
                                        <td>{m.description}</td>
                                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                                            {m.debit > 0 ? `₺${m.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "—"}
                                        </td>
                                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                                            {m.credit > 0 ? `₺${m.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "—"}
                                        </td>
                                        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: "bold" }}>
                                            ₺{m.balanceAfter.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-16 mt-16 px-4">
                        <div className="text-center">
                            <div className="w-full border-b border-black mb-2"></div>
                            <p className="text-[10px] font-bold uppercase">İŞLETME YETKİLİSİ (İMZA / KAŞE)</p>
                        </div>
                        <div className="text-center">
                            <div className="w-full border-b border-black mb-2"></div>
                            <p className="text-[10px] font-bold uppercase">TEDARİKÇİ YETKİLİSİ (İMZA / KAŞE)</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
