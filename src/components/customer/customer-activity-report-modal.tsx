"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Printer,
    FileText,
    FileSpreadsheet,
    MessageCircle,
    X,
    Search,
    Calendar,
    ChevronDown,
    ChevronUp,
    Package,
    Wrench,
    ShoppingCart,
    Wallet,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Phone,
    Mail,
    User,
    ShieldCheck,
    TrendingUp,
    Building2,
    Download,
    DollarSign,
    Sparkles,
    Smartphone,
    Layers
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
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { sendWhatsAppClientSide } from "@/lib/utils/notifications";

interface CustomerActivityReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: any;
    shop?: any;
    rates?: any;
    defaultCurrency?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Beklemede", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    APPROVED: { label: "Onaylandı", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    REPAIRING: { label: "Tamirde", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    WAITING_PART: { label: "Parça Bekliyor", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    READY: { label: "Hazır", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    DELIVERED: { label: "Teslim Edildi", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    CANCELLED: { label: "İptal Edildi", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

const paymentLabels: Record<string, string> = {
    CASH: "Nakit",
    CARD: "Kredi Kartı",
    TRANSFER: "Havale / EFT",
    DEBT: "Veresiye",
    MIXED: "Parçalı"
};

export function CustomerActivityReportModal({
    isOpen,
    onClose,
    customer,
    shop,
    rates,
    defaultCurrency = "TRY"
}: CustomerActivityReportModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"ALL" | "SALES" | "SERVICES" | "PRODUCTS" | "PAYMENTS">("ALL");
    const [dateRange, setDateRange] = useState<"ALL" | "THIS_MONTH" | "LAST_90" | "THIS_YEAR">("ALL");
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const usdRate = Number(rates?.usd || rates?.USD || 34.5);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // 1. Satışlar Listesi ve Tutar Toplamı
    const rawSales = useMemo(() => {
        return (customer?.sales || []).map((s: any) => {
            const date = new Date(s.createdAt);
            const items = (s.items || []).map((it: any) => ({
                id: it.id,
                name: it.product?.name || "Ürün",
                category: it.product?.category?.name || "Genel",
                quantity: Number(it.quantity || 1),
                unitPrice: Number(it.unitPrice || 0),
                totalPrice: Number(it.totalPrice || (it.unitPrice * it.quantity) || 0),
                warrantyMonths: it.product?.warrantyMonths || 0
            }));

            const rawDesc = s.description || s.transaction?.description || s.debt?.notes || "";
            const cleanDesc = rawDesc
                ? rawDesc.replace(/\s*\([₺$€][\d.,\s]+İndirim\)/gi, "").replace(/\s*\(VERESİYE\)/gi, "").trim()
                : "";

            return {
                id: s.id,
                type: "SALE" as const,
                documentNo: s.saleNumber,
                date,
                dateStr: format(date, "dd.MM.yyyy", { locale: tr }),
                timeStr: format(date, "HH:mm", { locale: tr }),
                amount: Number(s.finalAmount ?? s.totalAmount ?? 0),
                rawAmount: Number(s.totalAmount ?? 0),
                discount: Number(s.discount ?? 0),
                paymentMethod: s.paymentMethod || "CASH",
                paymentMethodLabel: paymentLabels[s.paymentMethod] || s.paymentMethod || "Nakit",
                description: cleanDesc,
                items,
                itemCount: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
                itemNamesStr: items.map((i: any) => `${i.name}${i.quantity > 1 ? ` (${i.quantity}x)` : ""}`).join(", ")
            };
        });
    }, [customer]);

    // 2. Servis / Tamir Kayıtları
    const rawTickets = useMemo(() => {
        return (customer?.tickets || []).map((t: any) => {
            const date = new Date(t.createdAt);
            const parts = (t.usedParts || []).map((p: any) => ({
                id: p.id,
                name: p.product?.name || "Yedek Parça",
                category: p.product?.category?.name || "Parça",
                quantity: Number(p.quantity || 1),
                unitPrice: Number(p.unitPrice || 0),
                costPrice: Number(p.costPrice || 0),
                totalPrice: Number(p.unitPrice * p.quantity || 0),
                warrantyDays: p.warrantyDays,
                warrantyMonths: p.warrantyMonths
            }));

            const statusInfo = statusLabels[t.status] || { label: t.status || "Beklemede", color: "bg-muted text-foreground" };
            const cost = Number(t.actualCost ?? t.estimatedCost ?? 0);

            return {
                id: t.id,
                type: "SERVICE" as const,
                documentNo: t.ticketNumber,
                date,
                dateStr: format(date, "dd.MM.yyyy", { locale: tr }),
                timeStr: format(date, "HH:mm", { locale: tr }),
                deviceBrand: t.deviceBrand || "",
                deviceModel: t.deviceModel || "",
                deviceFull: `${t.deviceBrand || ""} ${t.deviceModel || ""}`.trim() || "Cihaz Onarımı",
                imei: t.imei || "",
                problemDesc: t.problemDesc || "Arıza belirtilmemiş",
                notes: t.notes || "",
                status: t.status,
                statusLabel: statusInfo.label,
                statusColor: statusInfo.color,
                technicianName: t.technician?.name || "Atanmadı",
                amount: cost,
                parts,
                partCount: parts.reduce((sum: number, p: any) => sum + p.quantity, 0),
                deliveredAt: t.deliveredAt ? new Date(t.deliveredAt) : null,
                deliveredAtStr: t.deliveredAt ? format(new Date(t.deliveredAt), "dd.MM.yyyy", { locale: tr }) : null
            };
        });
    }, [customer]);

    // 3. Verilen / Satılan Tüm Ürünlerin & Parçaların Konsolide Özeti
    const consolidatedProducts = useMemo(() => {
        const productMap = new Map<string, {
            name: string;
            category: string;
            totalQty: number;
            totalAmount: number;
            salesCount: number;
            serviceCount: number;
            lastDate: Date;
        }>();

        // Satışlardan gelen ürünler
        rawSales.forEach((s: any) => {
            s.items.forEach((it: any) => {
                const key = it.name.trim().toLowerCase();
                const existing = productMap.get(key);
                if (existing) {
                    existing.totalQty += it.quantity;
                    existing.totalAmount += it.totalPrice;
                    existing.salesCount += it.quantity;
                    if (s.date > existing.lastDate) existing.lastDate = s.date;
                } else {
                    productMap.set(key, {
                        name: it.name,
                        category: it.category || "Satış Ürünü",
                        totalQty: it.quantity,
                        totalAmount: it.totalPrice,
                        salesCount: it.quantity,
                        serviceCount: 0,
                        lastDate: s.date
                    });
                }
            });
        });

        // Servislerden takılan parçalar
        rawTickets.forEach((t: any) => {
            t.parts.forEach((p: any) => {
                const key = p.name.trim().toLowerCase();
                const existing = productMap.get(key);
                if (existing) {
                    existing.totalQty += p.quantity;
                    existing.totalAmount += p.totalPrice;
                    existing.serviceCount += p.quantity;
                    if (t.date > existing.lastDate) existing.lastDate = t.date;
                } else {
                    productMap.set(key, {
                        name: p.name,
                        category: p.category || "Yedek Parça",
                        totalQty: p.quantity,
                        totalAmount: p.totalPrice,
                        salesCount: 0,
                        serviceCount: p.quantity,
                        lastDate: t.date
                    });
                }
            });
        });

        return Array.from(productMap.values()).sort((a, b) => b.totalQty - a.totalQty);
    }, [rawSales, rawTickets]);

    // 4. Cari Tahsilat & Ödemeler
    const rawPayments = useMemo(() => {
        return (customer?.transactions || []).map((tx: any) => {
            const date = new Date(tx.createdAt);
            return {
                id: tx.id,
                type: "PAYMENT" as const,
                documentNo: tx.sale?.saleNumber || (tx.id.substring(0, 8)),
                date,
                dateStr: format(date, "dd.MM.yyyy", { locale: tr }),
                timeStr: format(date, "HH:mm", { locale: tr }),
                amount: Number(tx.amount || 0),
                currency: tx.currency || "TRY",
                paymentMethod: tx.paymentMethod || "CASH",
                paymentMethodLabel: paymentLabels[tx.paymentMethod] || tx.paymentMethod || "Nakit",
                description: tx.description || "Tahsilat",
                accountName: tx.financeAccount?.name || "Kasa",
                userName: tx.user?.name || "Sistem"
            };
        });
    }, [customer]);

    // 5. Birleşik Kronolojik Zaman Çizelgesi
    const combinedTimeline = useMemo(() => {
        const list: any[] = [
            ...rawSales,
            ...rawTickets,
            ...rawPayments
        ];
        return list.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [rawSales, rawTickets, rawPayments]);

    // 6. Finansal Genel Toplamlar
    const metrics = useMemo(() => {
        const totalSalesVolume = rawSales.reduce((acc: number, s: any) => acc + s.amount, 0);
        const totalServiceVolume = rawTickets.reduce((acc: number, t: any) => acc + t.amount, 0);
        const totalVolumeTRY = totalSalesVolume + totalServiceVolume;
        const totalVolumeUSD = usdRate > 0 ? totalVolumeTRY / usdRate : 0;

        const openDebts = (customer?.debts || []).filter((d: any) => !d.isPaid && Number(d.remainingAmount || 0) > 0.01);
        const totalDebtTRY = openDebts.reduce((acc: number, d: any) => {
            const rem = Number(d.remainingAmount || 0);
            return acc + (d.currency === "USD" ? rem * usdRate : rem);
        }, 0);
        const totalDebtUSD = usdRate > 0 ? totalDebtTRY / usdRate : 0;

        const totalPaymentsTRY = rawPayments.reduce((acc: number, p: any) => {
            return acc + (p.currency === "USD" ? p.amount * usdRate : p.amount);
        }, 0);

        const totalProductsDelivered = consolidatedProducts.reduce((sum: number, p: any) => sum + p.totalQty, 0);

        return {
            totalSalesVolume,
            totalSalesCount: rawSales.length,
            totalServiceVolume,
            totalServiceCount: rawTickets.length,
            totalVolumeTRY,
            totalVolumeUSD,
            totalDebtTRY,
            totalDebtUSD,
            totalPaymentsTRY,
            totalProductsDelivered,
            distinctProductsCount: consolidatedProducts.length
        };
    }, [rawSales, rawTickets, rawPayments, consolidatedProducts, customer?.debts, usdRate]);

    // 7. Filtreleme Mantığı
    const filteredMovements = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        const now = new Date();

        return combinedTimeline.filter((item) => {
            // Tab Filtresi
            if (activeTab === "SALES" && item.type !== "SALE") return false;
            if (activeTab === "SERVICES" && item.type !== "SERVICE") return false;
            if (activeTab === "PAYMENTS" && item.type !== "PAYMENT") return false;

            // Tarih Filtresi
            if (dateRange === "THIS_MONTH") {
                const isThisMonth = item.date.getMonth() === now.getMonth() && item.date.getFullYear() === now.getFullYear();
                if (!isThisMonth) return false;
            } else if (dateRange === "LAST_90") {
                const diffDays = (now.getTime() - item.date.getTime()) / (1000 * 3600 * 24);
                if (diffDays > 90) return false;
            } else if (dateRange === "THIS_YEAR") {
                if (item.date.getFullYear() !== now.getFullYear()) return false;
            }

            // Metin Araması
            if (query) {
                const docMatch = (item.documentNo || "").toLowerCase().includes(query);
                const descMatch = (item.description || item.problemDesc || item.notes || "").toLowerCase().includes(query);
                const deviceMatch = (item.deviceFull || item.imei || "").toLowerCase().includes(query);
                const itemsMatch = item.items?.some((i: any) => i.name.toLowerCase().includes(query));
                const partsMatch = item.parts?.some((p: any) => p.name.toLowerCase().includes(query));
                return docMatch || descMatch || deviceMatch || itemsMatch || partsMatch;
            }

            return true;
        });
    }, [combinedTimeline, activeTab, dateRange, searchTerm]);

    // CSV / Excel İndirme
    const handleExportCSV = () => {
        if (!combinedTimeline.length) {
            toast.error("İndirilecek işlem kaydı bulunamadı.");
            return;
        }

        const headers = ["Tarih", "İşlem Türü", "Belge / Fiş No", "Cihaz / Ürün Bilgisi", "Miktar / Parça", "Açıklama / Durum", "Ödeme Yöntemi", "Tutar (TL)"];
        const rows = combinedTimeline.map((item) => {
            const dateStr = item.dateStr || "";
            const typeStr = item.type === "SALE" ? "Satış" : item.type === "SERVICE" ? "Teknik Servis" : "Tahsilat";
            const docNo = `"${item.documentNo || ""}"`;
            const info = item.type === "SALE"
                ? `"${(item.itemNamesStr || "").replace(/"/g, '""')}"`
                : item.type === "SERVICE"
                    ? `"${item.deviceFull || ""} (IMEI: ${item.imei || "-"})"`
                    : `"${item.description || "Tahsilat"}"`;
            const qty = item.type === "SALE" ? `${item.itemCount} Adet` : item.type === "SERVICE" ? `${item.partCount} Parça` : "-";
            const detail = item.type === "SERVICE" ? `"${item.statusLabel} - ${item.problemDesc}"` : `"${(item.description || "").replace(/"/g, '""')}"`;
            const payment = item.paymentMethodLabel || "-";
            const amount = item.amount.toFixed(2);

            return [dateStr, typeStr, docNo, info, qty, detail, payment, amount].join(";");
        });

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = (customer?.name || "Musteri").replace(/[^a-zA-Z0-9_-]/g, "_");
        link.setAttribute("href", url);
        link.setAttribute("download", `${safeName}_Faaliyet_Ekstresi_${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Müşteri faaliyet ekstresi CSV olarak indirildi.");
    };

    // A4 Yazdırma
    const handlePrintA4 = () => {
        window.print();
    };

    // WhatsApp Paylaşımı
    const handleSendWhatsApp = () => {
        if (!customer?.phone) {
            toast.error("Müşteriye ait telefon numarası bulunamadı.");
            return;
        }

        const safeShopName = shop?.name || "Başar Teknik";
        const message = `Sayın *${customer.name}*,\n\n*${safeShopName}* bünyesinde adınıza kayıtlı işlem ve hesap özetiniz aşağıdadır:\n\n` +
            `📊 *HESAP & FAALİYET ÖZETİ:*\n` +
            `• Toplam İşlem Hacmi: ₺${formatCurrency(metrics.totalVolumeTRY)}\n` +
            `• Toplam Satış: ${metrics.totalSalesCount} Adet (₺${formatCurrency(metrics.totalSalesVolume)})\n` +
            `• Toplam Servis / Tamir: ${metrics.totalServiceCount} Cihaz (₺${formatCurrency(metrics.totalServiceVolume)})\n` +
            `• Toplam Teslim Edilen Ürün/Parça: ${metrics.totalProductsDelivered} Adet\n` +
            `• Güncel Açık Borç Bakiyesi: ₺${formatCurrency(metrics.totalDebtTRY)}\n\n` +
            (rawSales.length > 0 ? `🛒 *SON SATIŞ:* #${rawSales[0].documentNo} (${rawSales[0].dateStr}) - ₺${formatCurrency(rawSales[0].amount)}\n` : "") +
            (rawTickets.length > 0 ? `🔧 *SON SERVİS:* #${rawTickets[0].documentNo} (${rawTickets[0].deviceFull}) - ${rawTickets[0].statusLabel}\n\n` : "\n") +
            `Detaylı bilgi ve sorularınız için bizimle iletişime geçebilirsiniz.\nİyi günler dileriz! 📱`;

        sendWhatsAppClientSide(customer.phone, message);
        toast.success(`Özet mesaj ${customer.phone} numarasına WhatsApp ile yönlendirildi.`);
    };

    if (!customer) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden border-none rounded-3xl bg-card shadow-2xl">
                    {/* Header */}
                    <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-xl font-black tracking-tight">
                                            Müşteri Faaliyet & Hesap Ekstresi
                                        </DialogTitle>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                                            {customer.name}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                                        {customer.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-primary" /> {customer.phone}
                                            </span>
                                        )}
                                        {customer.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-primary" /> {customer.email}
                                            </span>
                                        )}
                                        <span className="opacity-40">•</span>
                                        <span>Rapor Tarihi: {format(new Date(), "dd MMMM yyyy", { locale: tr })}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Üst Hızlı Eylemler */}
                            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrintA4}
                                    className="h-9 px-3 rounded-xl border-border bg-background hover:bg-muted text-foreground text-xs font-bold gap-1.5 shadow-xs"
                                    title="A4 Resmi Ekstre Çıktısı Al / PDF Olarak Kaydet"
                                >
                                    <Printer className="w-3.5 h-3.5 text-primary" />
                                    <span>Yazdır (A4)</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportCSV}
                                    className="h-9 px-3 rounded-xl border-border bg-background hover:bg-muted text-foreground text-xs font-bold gap-1.5 shadow-xs"
                                    title="Tüm Faaliyetleri Excel / CSV Olarak İndir"
                                >
                                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="hidden sm:inline">Excel</span>
                                </Button>

                                {customer.phone && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSendWhatsApp}
                                        className="h-9 px-3 rounded-xl border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold gap-1.5 shadow-xs"
                                        title="Müşteriye WhatsApp Özet Bildirimi Gönder"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-500/20" />
                                        <span className="hidden sm:inline">WhatsApp</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* KPI Özet Şeridi */}
                    <div className="p-6 py-4 bg-muted/10 border-b border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Toplam Ciro / Hacim */}
                        <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs">
                            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">
                                <span>Toplam İşlem Hacmi</span>
                                <Wallet className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="text-lg font-black text-foreground">
                                ₺{formatCurrency(metrics.totalVolumeTRY)}
                            </div>
                            <div className="text-[10px] text-muted-foreground/70 font-medium">
                                ~${metrics.totalVolumeUSD.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} USD
                            </div>
                        </div>

                        {/* Satışlar */}
                        <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                                <span>Satış Cirosu</span>
                                <ShoppingCart className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                ₺{formatCurrency(metrics.totalSalesVolume)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium">
                                {metrics.totalSalesCount} adet başarılı satış
                            </div>
                        </div>

                        {/* Teknik Servis */}
                        <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-xs">
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                                <span>Servis & Tamir</span>
                                <Wrench className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                                ₺{formatCurrency(metrics.totalServiceVolume)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium">
                                {metrics.totalServiceCount} adet cihaz onarımı
                            </div>
                        </div>

                        {/* Açık Borç */}
                        <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-xs">
                            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                                <span>Güncel Borç</span>
                                <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                                ₺{formatCurrency(metrics.totalDebtTRY)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium">
                                {metrics.totalDebtTRY > 0 ? "Açık veresiye bakiyesi" : "Borcu bulunmuyor"}
                            </div>
                        </div>
                    </div>

                    {/* Toolbar & Filtreler */}
                    <div className="p-6 py-3 border-b border-border/40 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        {/* Tab Butonları */}
                        <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 overflow-x-auto no-scrollbar">
                            <button
                                type="button"
                                onClick={() => setActiveTab("ALL")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                                    activeTab === "ALL"
                                        ? "bg-background text-foreground shadow-xs border border-border/50"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Tüm Faaliyetler ({combinedTimeline.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("SALES")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                                    activeTab === "SALES"
                                        ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs border border-border/50"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Satışlar ({rawSales.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("SERVICES")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                                    activeTab === "SERVICES"
                                        ? "bg-background text-blue-600 dark:text-blue-400 shadow-xs border border-border/50"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Wrench className="w-3.5 h-3.5" />
                                Tamirler ({rawTickets.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("PRODUCTS")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                                    activeTab === "PRODUCTS"
                                        ? "bg-background text-primary shadow-xs border border-border/50"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Package className="w-3.5 h-3.5" />
                                Verilen Ürünler ({consolidatedProducts.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("PAYMENTS")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                                    activeTab === "PAYMENTS"
                                        ? "bg-background text-amber-600 dark:text-amber-400 shadow-xs border border-border/50"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Wallet className="w-3.5 h-3.5" />
                                Tahsilatlar ({rawPayments.length})
                            </button>
                        </div>

                        {/* Sağ Filtreler: Arama ve Tarih */}
                        <div className="flex items-center gap-2">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="h-9 px-3 rounded-xl text-xs bg-muted/40 border border-border/60 text-foreground outline-none font-bold"
                            >
                                <option value="ALL">Tüm Zamanlar</option>
                                <option value="THIS_MONTH">Bu Ay</option>
                                <option value="LAST_90">Son 90 Gün</option>
                                <option value="THIS_YEAR">Bu Yıl</option>
                            </select>

                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Ürün, cihaz, fiş ara..."
                                    className="pl-8 h-9 text-xs rounded-xl bg-background border-border/60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* İçerik Alanı */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3">
                        {/* 1. Ürünler Özeti Görünümü (PRODUCTS sekmesi aktifse) */}
                        {activeTab === "PRODUCTS" ? (
                            consolidatedProducts.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground text-xs italic">
                                    Müşteriye henüz bir ürün veya yedek parça verilmemiş.
                                </div>
                            ) : (
                                <div className="border border-border/60 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/30 border-b border-border/60 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                            <tr>
                                                <th className="p-3 pl-4">Ürün / Yedek Parça</th>
                                                <th className="p-3">Kategori</th>
                                                <th className="p-3 text-center">Toplam Adet</th>
                                                <th className="p-3 text-center">Satış / Servis Dağılımı</th>
                                                <th className="p-3">Son İşlem Tarihi</th>
                                                <th className="p-3 pr-4 text-right">Toplam Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {consolidatedProducts.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                    <td className="p-3 pl-4 font-bold text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                                                            <span>{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{p.category}</td>
                                                    <td className="p-3 text-center font-black text-primary">
                                                        {p.totalQty} Adet
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                            {p.salesCount > 0 && <span className="text-emerald-500">{p.salesCount} Satış</span>}
                                                            {p.salesCount > 0 && p.serviceCount > 0 && " • "}
                                                            {p.serviceCount > 0 && <span className="text-blue-500">{p.serviceCount} Servis</span>}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground font-mono text-[11px]">
                                                        {format(p.lastDate, "dd.MM.yyyy", { locale: tr })}
                                                    </td>
                                                    <td className="p-3 pr-4 text-right font-black text-foreground">
                                                        ₺{formatCurrency(p.totalAmount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : filteredMovements.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground text-xs italic">
                                Belirtilen kriterlere uygun işlem bulunamadı.
                            </div>
                        ) : (
                            filteredMovements.map((item: any, idx: number) => {
                                const isSale = item.type === "SALE";
                                const isService = item.type === "SERVICE";
                                const isPayment = item.type === "PAYMENT";
                                const isExpanded = !!expandedRows[item.id];

                                return (
                                    <div
                                        key={item.id || idx}
                                        className={cn(
                                            "border rounded-2xl transition-all overflow-hidden",
                                            isSale && "border-emerald-500/20 bg-emerald-500/[0.02]",
                                            isService && "border-blue-500/20 bg-blue-500/[0.02]",
                                            isPayment && "border-amber-500/20 bg-amber-500/[0.02]"
                                        )}
                                    >
                                        {/* Satır Başlığı */}
                                        <div
                                            onClick={() => toggleRow(item.id)}
                                            className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs",
                                                        isSale && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                                        isService && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                                        isPayment && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                    )}
                                                >
                                                    {isSale ? <ShoppingCart className="h-4 w-4" /> : isService ? <Wrench className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm text-foreground truncate">
                                                            {isSale ? item.itemNamesStr || "Satış İşlemi" : isService ? item.deviceFull : item.description}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] px-2 py-0 h-4 font-bold rounded-md shrink-0 border",
                                                                isSale && "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
                                                                isService && item.statusColor,
                                                                isPayment && "border-amber-500/30 text-amber-600 bg-amber-500/5"
                                                            )}
                                                        >
                                                            {isSale ? "Hızlı Satış" : isService ? item.statusLabel : "Tahsilat"}
                                                        </Badge>
                                                    </div>

                                                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono font-bold text-foreground/80">#{item.documentNo}</span>
                                                        <span className="opacity-30">•</span>
                                                        <span>{item.dateStr} {item.timeStr}</span>
                                                        {isSale && item.paymentMethodLabel && (
                                                            <>
                                                                <span className="opacity-30">•</span>
                                                                <span>Ödeme: {item.paymentMethodLabel}</span>
                                                            </>
                                                        )}
                                                        {isService && item.imei && (
                                                            <>
                                                                <span className="opacity-30">•</span>
                                                                <span className="font-mono text-[10px]">IMEI: {item.imei}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-right">
                                                    <div className={cn("text-sm font-black", isSale ? "text-emerald-600 dark:text-emerald-400" : isService ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400")}>
                                                        {isPayment ? "+ " : ""}₺{formatCurrency(item.amount)}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground font-medium">
                                                        ~${(item.amount / usdRate).toFixed(2)} USD
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/20"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Açılan Detay Paneli */}
                                        {isExpanded && (
                                            <div className="p-4 pt-2 border-t border-border/40 bg-muted/5 space-y-3 text-xs">
                                                {/* Satış Detayları */}
                                                {isSale && (
                                                    <div className="space-y-2">
                                                        {item.description && (
                                                            <div className="p-2.5 rounded-xl bg-background border border-border/50 text-foreground">
                                                                <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">Satış Notu:</span>
                                                                {item.description}
                                                            </div>
                                                        )}
                                                        <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-muted/20 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground">
                                                                    <tr>
                                                                        <th className="p-2 pl-3">Ürün</th>
                                                                        <th className="p-2 text-center">Adet</th>
                                                                        <th className="p-2 text-right">Birim Fiyat</th>
                                                                        <th className="p-2 pr-3 text-right">Toplam</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border/30">
                                                                    {item.items?.map((it: any, iIdx: number) => (
                                                                        <tr key={iIdx}>
                                                                            <td className="p-2 pl-3 font-medium text-foreground">{it.name}</td>
                                                                            <td className="p-2 text-center text-primary font-bold">{it.quantity}</td>
                                                                            <td className="p-2 text-right text-muted-foreground">₺{formatCurrency(it.unitPrice)}</td>
                                                                            <td className="p-2 pr-3 text-right font-bold text-foreground">₺{formatCurrency(it.totalPrice)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Servis Detayları */}
                                                {isService && (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <div className="p-2.5 rounded-xl bg-background border border-border/50">
                                                                <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">Şikayet / Arıza:</span>
                                                                <span className="text-foreground">{item.problemDesc}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-background border border-border/50">
                                                                <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">Teknisyen / Durum:</span>
                                                                <span className="text-foreground">{item.technicianName} • {item.statusLabel}</span>
                                                            </div>
                                                        </div>

                                                        {item.parts?.length > 0 && (
                                                            <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                                                                <div className="p-2 px-3 bg-muted/20 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground">
                                                                    Kullanılan Parçalar ({item.parts.length} Kalem)
                                                                </div>
                                                                <table className="w-full text-left">
                                                                    <tbody className="divide-y divide-border/30">
                                                                        {item.parts.map((p: any, pIdx: number) => (
                                                                            <tr key={pIdx}>
                                                                                <td className="p-2 pl-3 font-medium text-foreground">{p.name}</td>
                                                                                <td className="p-2 text-center text-primary font-bold">{p.quantity} Adet</td>
                                                                                <td className="p-2 pr-3 text-right font-bold text-foreground">₺{formatCurrency(p.totalPrice)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Ödeme Detayları */}
                                                {isPayment && (
                                                    <div className="p-2.5 rounded-xl bg-background border border-border/50 flex justify-between items-center text-xs">
                                                        <span>Kasa / Hesap: <strong>{item.accountName}</strong></span>
                                                        <span>İşlemi Yapan: <strong>{item.userName}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 py-4 bg-muted/10 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                            <span>Listelenen: <strong>{filteredMovements.length}</strong> kayıt</span>
                            <span className="mx-2">•</span>
                            <span>Toplam Teslim Edilen Ürün/Parça: <strong>{metrics.totalProductsDelivered} adet</strong></span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="rounded-xl font-bold"
                        >
                            Kapat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ========================================================
                A4 RESMİ YAZDIRMA ALANI (@media print)
            ======================================================== */}
            <div id="customer-print-report" className="fixed inset-0 z-[99999] bg-white text-black hidden print:block overflow-visible">
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
                            body > *:not(#customer-print-report) {
                                display: none !important;
                            }
                            #customer-print-report {
                                display: block !important;
                                position: static !important;
                                width: 100% !important;
                                background: white !important;
                            }
                            .report-table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 12px 0;
                            }
                            .report-table th, .report-table td {
                                border: 1px solid #333 !important;
                                padding: 5px 7px !important;
                                font-size: 9px !important;
                                color: black !important;
                                vertical-align: top;
                            }
                            .report-table th {
                                background-color: #f2f2f2 !important;
                                font-weight: bold !important;
                                text-align: left;
                            }
                            .page-break {
                                page-break-after: auto;
                            }
                        }
                    `,
                    }}
                />

                <div className="p-4 w-full max-w-[210mm] mx-auto text-black">
                    {/* Antetli Başlık */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                        <div>
                            <h1 className="font-black text-2xl uppercase tracking-wider mb-1">
                                {shop?.name || "BAŞAR TEKNİK"}
                            </h1>
                            <p className="text-[10px] text-neutral-700 leading-tight">
                                {shop?.address || "Merkez Şube"}
                            </p>
                            <p className="text-[10px] text-neutral-700 leading-tight">
                                Tel: {shop?.phone || "—"} • E-Posta: {shop?.email || "—"}
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="font-black text-lg uppercase tracking-tight text-neutral-900">
                                MÜŞTERİ FAALİYET & HESAP EKSTRESİ
                            </h2>
                            <p className="text-[9.5px] text-neutral-600 font-mono mt-0.5">
                                Belge Tarihi: {format(new Date(), "dd.MM.yyyy HH:mm", { locale: tr })}
                            </p>
                        </div>
                    </div>

                    {/* Müşteri ve Yönetici Özeti Bilgi Kartı */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 border border-black/40 bg-neutral-50 rounded-sm">
                        <div>
                            <span className="text-[8.5px] font-black uppercase text-neutral-500 block mb-1">
                                MÜŞTERİ BİLGİLERİ
                            </span>
                            <p className="text-sm font-black text-black uppercase">{customer.name}</p>
                            <p className="text-[10px] text-neutral-800">Telefon: {customer.phone || "—"}</p>
                            <p className="text-[10px] text-neutral-800">E-Posta: {customer.email || "—"}</p>
                            <p className="text-[10px] text-neutral-800">Müşteri Tipi: {customer.type === "KURUMSAL" ? "Kurumsal" : "Bireysel"}</p>
                        </div>

                        <div className="border-l border-black/20 pl-4">
                            <span className="text-[8.5px] font-black uppercase text-neutral-500 block mb-1">
                                FAALİYET & CARİ ÖZETİ
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                                <div>
                                    <span className="text-neutral-600 block">Toplam Satış ({metrics.totalSalesCount} Adet):</span>
                                    <span className="font-bold">₺{formatCurrency(metrics.totalSalesVolume)}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-600 block">Toplam Servis ({metrics.totalServiceCount} Cihaz):</span>
                                    <span className="font-bold">₺{formatCurrency(metrics.totalServiceVolume)}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-600 block">Toplam Tahsil Edilen:</span>
                                    <span className="font-bold text-emerald-700">₺{formatCurrency(metrics.totalPaymentsTRY)}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-600 block">Güncel Borç Bakiyesi:</span>
                                    <span className="font-black text-rose-700">₺{formatCurrency(metrics.totalDebtTRY)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BÖLÜM 1: Satışlar ve Teslim Edilen Ürünler Dökümü */}
                    <div className="mb-4">
                        <h3 className="font-black text-xs uppercase border-b border-black pb-1 mb-2 tracking-wide flex items-center justify-between">
                            <span>1. SATIŞ VE TESLİM EDİLEN ÜRÜNLER GEÇMİŞİ</span>
                            <span className="text-[9px] font-normal text-neutral-600">{rawSales.length} Kayıt</span>
                        </h3>
                        {rawSales.length === 0 ? (
                            <p className="text-[9.5px] italic text-neutral-500 py-2">Kayıtlı satış işlemi bulunmuyor.</p>
                        ) : (
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "65px" }}>TARİH</th>
                                        <th style={{ width: "75px" }}>FİŞ NO</th>
                                        <th>SATILAN ÜRÜN(LER) & KALEMLER</th>
                                        <th>SATIŞ AÇIKLAMASI</th>
                                        <th style={{ width: "55px" }}>ÖDEME</th>
                                        <th style={{ width: "65px", textAlign: "right" }}>TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawSales.map((s: any, sIdx: number) => (
                                        <tr key={sIdx}>
                                            <td className="font-mono">{s.dateStr}</td>
                                            <td className="font-bold font-mono">#{s.documentNo}</td>
                                            <td>
                                                {s.items.map((it: any, iIdx: number) => (
                                                    <div key={iIdx} className="leading-tight">
                                                        • <strong>{it.name}</strong> ({it.quantity} Adet x ₺{formatCurrency(it.unitPrice)})
                                                    </div>
                                                ))}
                                            </td>
                                            <td>{s.description || "—"}</td>
                                            <td>{s.paymentMethodLabel}</td>
                                            <td style={{ textAlign: "right" }} className="font-bold">
                                                ₺{formatCurrency(s.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* BÖLÜM 2: Teknik Servis ve Cihaz Tamir Geçmişi */}
                    <div className="mb-4">
                        <h3 className="font-black text-xs uppercase border-b border-black pb-1 mb-2 tracking-wide flex items-center justify-between">
                            <span>2. TEKNİK SERVİS VE CİHAZ ONARIM GEÇMİŞİ</span>
                            <span className="text-[9px] font-normal text-neutral-600">{rawTickets.length} Cihaz</span>
                        </h3>
                        {rawTickets.length === 0 ? (
                            <p className="text-[9.5px] italic text-neutral-500 py-2">Kayıtlı servis işlemi bulunmuyor.</p>
                        ) : (
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "65px" }}>TARİH</th>
                                        <th style={{ width: "75px" }}>SERVİS NO</th>
                                        <th>CİHAZ / MODEL / IMEI</th>
                                        <th>ŞİKAYET & KULLANILAN PARÇALAR</th>
                                        <th style={{ width: "70px" }}>DURUM</th>
                                        <th style={{ width: "65px", textAlign: "right" }}>TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawTickets.map((t: any, tIdx: number) => (
                                        <tr key={tIdx}>
                                            <td className="font-mono">{t.dateStr}</td>
                                            <td className="font-bold font-mono">#{t.documentNo}</td>
                                            <td>
                                                <div className="font-bold">{t.deviceFull}</div>
                                                {t.imei && <div className="text-[8px] text-neutral-600">IMEI: {t.imei}</div>}
                                            </td>
                                            <td>
                                                <div><strong>Arıza:</strong> {t.problemDesc}</div>
                                                {t.parts?.length > 0 && (
                                                    <div className="mt-0.5 text-[8.5px]">
                                                        <strong>Parçalar:</strong> {t.parts.map((p: any) => `${p.name} (${p.quantity} Adet)`).join(", ")}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="font-bold uppercase text-[8.5px]">{t.statusLabel}</td>
                                            <td style={{ textAlign: "right" }} className="font-bold">
                                                ₺{formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* BÖLÜM 3: Teslim Edilen Ürün ve Yedek Parçaların Özeti */}
                    <div className="mb-6">
                        <h3 className="font-black text-xs uppercase border-b border-black pb-1 mb-2 tracking-wide flex items-center justify-between">
                            <span>3. BUGÜNE KADAR VERİLEN / KULLANILAN ÜRÜNLER LİSTESİ</span>
                            <span className="text-[9px] font-normal text-neutral-600">{metrics.totalProductsDelivered} Adet Ürün</span>
                        </h3>
                        {consolidatedProducts.length === 0 ? (
                            <p className="text-[9.5px] italic text-neutral-500 py-2">Kayıtlı ürün bulunmuyor.</p>
                        ) : (
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>ÜRÜN / PARÇA TANIMI</th>
                                        <th style={{ width: "80px" }}>KATEGORİ</th>
                                        <th style={{ width: "55px", textAlign: "center" }}>ADET</th>
                                        <th style={{ width: "70px" }}>SON İŞLEM</th>
                                        <th style={{ width: "70px", textAlign: "right" }}>TOPLAM TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consolidatedProducts.slice(0, 15).map((p: any, pIdx: number) => (
                                        <tr key={pIdx}>
                                            <td className="font-bold">{p.name}</td>
                                            <td>{p.category}</td>
                                            <td style={{ textAlign: "center" }} className="font-black">{p.totalQty}</td>
                                            <td className="font-mono text-[8.5px]">{format(p.lastDate, "dd.MM.yyyy")}</td>
                                            <td style={{ textAlign: "right" }} className="font-bold">₺{formatCurrency(p.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Alt Bilgi & İmza Alanı */}
                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black/40 text-[9.5px] text-neutral-700">
                        <div>
                            <p className="font-bold mb-1">MÜŞTERİ KABUL VE İMZA</p>
                            <p className="text-[8.5px] text-neutral-500 mb-6">Yukarıda dökümü yapılan hizmet ve ürünleri eksiksiz teslim aldım.</p>
                            <div className="border-b border-black/30 w-44 h-8" />
                        </div>
                        <div className="text-right">
                            <p className="font-bold mb-1">İŞLETME YETKİLİ KAŞE / İMZA</p>
                            <p className="text-[8.5px] text-neutral-500 mb-6">{shop?.name || "Başar Teknik"} Teknik & Satış Yönetimi</p>
                            <div className="border-b border-black/30 w-44 h-8 ml-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
