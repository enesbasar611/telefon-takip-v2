"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Wrench,
    ShoppingCart,
    Printer,
    Search,
    ArrowUpRight,
    Filter,
    Package,
    Calendar,
    Tag,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { ServiceReceiptModal } from "@/components/service/service-receipt-modal";
import Link from "next/link";

interface CustomerHistoryListProps {
    customer: any;
    rates?: any;
    defaultCurrency?: string;
    className?: string;
}

const statusLabels: Record<string, string> = {
    PENDING: "Beklemede",
    APPROVED: "Onaylandı",
    REPAIRING: "Tamirde",
    WAITING_PART: "Parça Bekliyor",
    READY: "Hazır",
    DELIVERED: "Teslim Edildi",
    CANCELLED: "İptal Edildi",
};

export function CustomerHistoryList({
    customer,
    rates,
    defaultCurrency = "TRY",
    className
}: CustomerHistoryListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "SALE" | "SERVICE">("ALL");
    const [selectedSale, setSelectedSale] = useState<any | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    // Merge tickets and sales into unified chronological stream
    const allTransactions = useMemo(() => {
        const tickets = (customer?.tickets || []).map((t: any) => ({
            ...t,
            transactionType: "SERVICE" as const,
            sortDate: new Date(t.createdAt).getTime(),
        }));

        const sales = (customer?.sales || []).map((s: any) => ({
            ...s,
            transactionType: "SALE" as const,
            sortDate: new Date(s.createdAt).getTime(),
        }));

        return [...tickets, ...sales].sort((a, b) => b.sortDate - a.sortDate);
    }, [customer]);

    const counts = useMemo(() => {
        const salesCount = (customer?.sales || []).length;
        const ticketsCount = (customer?.tickets || []).length;
        return {
            all: salesCount + ticketsCount,
            sales: salesCount,
            tickets: ticketsCount,
        };
    }, [customer]);

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter((item) => {
            // Type filter
            if (typeFilter === "SALE" && item.transactionType !== "SALE") return false;
            if (typeFilter === "SERVICE" && item.transactionType !== "SERVICE") return false;

            // Search filter
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase().trim();

            const refNumber = (item.ticketNumber || item.saleNumber || "").toLowerCase();
            const brand = (item.deviceBrand || "").toLowerCase();
            const model = (item.deviceModel || "").toLowerCase();
            const problem = (item.problemDesc || "").toLowerCase();
            const notes = (item.notes || "").toLowerCase();

            // Match product names in sale
            let productMatch = false;
            if (item.items && Array.isArray(item.items)) {
                productMatch = item.items.some((i: any) =>
                    (i.product?.name || i.name || "").toLowerCase().includes(q)
                );
            }

            // Match parts in service
            let partMatch = false;
            if (item.usedParts && Array.isArray(item.usedParts)) {
                partMatch = item.usedParts.some((p: any) =>
                    (p.product?.name || p.name || "").toLowerCase().includes(q)
                );
            }

            return (
                refNumber.includes(q) ||
                brand.includes(q) ||
                model.includes(q) ||
                problem.includes(q) ||
                notes.includes(q) ||
                productMatch ||
                partMatch
            );
        });
    }, [allTransactions, typeFilter, searchTerm]);

    const handlePrintSaleReceipt = (item: any) => {
        const enrichedSale = {
            ...item,
            customer: item.customer || {
                name: customer?.name || "Müşteri",
                phone: customer?.phone || "",
                email: customer?.email || ""
            }
        };
        setSelectedSale(enrichedSale);
    };

    const handlePrintServiceReceipt = (item: any) => {
        const enrichedTicket = {
            ...item,
            customer: item.customer || {
                name: customer?.name || "Müşteri",
                phone: customer?.phone || "",
                email: customer?.email || ""
            }
        };
        setSelectedTicket(enrichedTicket);
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Toolbar: Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50 self-start">
                    <button
                        type="button"
                        onClick={() => setTypeFilter("ALL")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                            typeFilter === "ALL"
                                ? "bg-background text-foreground shadow-xs border border-border/50"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Tümü
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-bold">
                            {counts.all}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTypeFilter("SALE")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                            typeFilter === "SALE"
                                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs border border-border/50"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Satışlar
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-bold">
                            {counts.sales}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTypeFilter("SERVICE")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                            typeFilter === "SERVICE"
                                ? "bg-background text-blue-600 dark:text-blue-400 shadow-xs border border-border/50"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Wrench className="w-3.5 h-3.5" />
                        Tamir / Servis
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-bold">
                            {counts.tickets}
                        </Badge>
                    </button>
                </div>

                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="İşlem no, cihaz, ürün ara..."
                        className="pl-9 h-9 text-xs rounded-xl bg-background border-border/60"
                    />
                </div>
            </div>

            {/* List */}
            {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 space-y-2">
                    <Package className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm font-bold text-foreground">Kayıtlı İşlem Bulunamadı</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        {searchTerm ? "Arama kriterlerinize uyan işlem kaydı yok." : "Bu müşteriye ait henüz bir satış veya servis işlemi kaydedilmemiş."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filteredTransactions.map((item: any, idx: number) => {
                        const isService = item.transactionType === "SERVICE";

                        // Title construction
                        const saleItemNames = !isService && item.items?.length > 0
                            ? item.items.map((i: any) => `${i.product?.name || i.name || "Ürün"}${i.quantity > 1 ? ` (${i.quantity}x)` : ""}`).join(", ")
                            : null;

                        const title = isService
                            ? `${item.deviceBrand || ""} ${item.deviceModel || ""}`.trim() || "Cihaz Onarımı"
                            : saleItemNames || item.saleNumber || "Satış İşlemi";

                        const amount = isService
                            ? Number(item.actualCost ?? item.estimatedCost ?? 0)
                            : Number(item.finalAmount ?? item.totalAmount ?? 0);

                        const formattedDate = format(new Date(item.createdAt), "d MMMM yyyy, HH:mm", { locale: tr });
                        const refCode = item.ticketNumber || item.saleNumber || "";

                        return (
                            <div
                                key={`${item.id || idx}`}
                                className="bg-card px-4 py-3 rounded-2xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-start sm:items-center gap-3 min-w-0">
                                    <div
                                        className={cn(
                                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs",
                                            isService
                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        )}
                                    >
                                        {isService ? <Wrench className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                                                {title}
                                            </h4>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] px-2 py-0 h-4 font-bold rounded-md shrink-0 border",
                                                    isService
                                                        ? "border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/5"
                                                        : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5"
                                                )}
                                            >
                                                {isService ? "Servis / Tamir" : "Hızlı Satış"}
                                            </Badge>
                                        </div>

                                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                            <span className="font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3 opacity-60" />
                                                {formattedDate}
                                            </span>
                                            <span className="opacity-30">•</span>
                                            <span className="font-black text-foreground/80 font-mono">
                                                #{refCode}
                                            </span>
                                            {isService && item.imei && (
                                                <>
                                                    <span className="opacity-30">•</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">IMEI: {item.imei}</span>
                                                </>
                                            )}
                                            {isService && item.problemDesc && (
                                                <>
                                                    <span className="opacity-30">•</span>
                                                    <span className="truncate max-w-[180px] italic">{item.problemDesc}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                    <div className="flex flex-col items-start sm:items-end">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] border px-2 py-0.5 rounded-md font-bold",
                                                    isService
                                                        ? item.status === "DELIVERED"
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                            : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                )}
                                            >
                                                {isService ? (statusLabels[item.status] || item.status) : "Tamamlandı"}
                                            </Badge>
                                        </div>
                                        <span className="text-sm sm:text-base font-black tabular-nums text-foreground mt-0.5">
                                            ₺{formatCurrency(amount)}
                                        </span>
                                    </div>

                                    {/* Actions: Direct Print Receipt */}
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                if (isService) {
                                                    handlePrintServiceReceipt(item);
                                                } else {
                                                    handlePrintSaleReceipt(item);
                                                }
                                            }}
                                            className="h-9 px-3 rounded-xl text-xs font-black gap-1.5 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs active:scale-95 transition-all"
                                            title="Geriye dönük fiş çıktısı al, PDF indir veya WhatsApp ile gönder"
                                        >
                                            <Printer className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                                            <span>Fiş Çıkar</span>
                                        </Button>

                                        {isService ? (
                                            <Link href={`/servis?search=${item.ticketNumber}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground"
                                                    title="Servis Kaydını Aç"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link href={`/satis/arşiv?search=${item.saleNumber}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground"
                                                    title="Satış Kaydını Aç"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals for Printing Receipts */}
            {selectedSale && (
                <ReceiptModal
                    isOpen={!!selectedSale}
                    onClose={() => setSelectedSale(null)}
                    sale={selectedSale}
                    rates={rates}
                    initialDefaultCurrency={defaultCurrency}
                />
            )}

            {selectedTicket && (
                <ServiceReceiptModal
                    isOpen={!!selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    ticket={selectedTicket}
                />
            )}
        </div>
    );
}

