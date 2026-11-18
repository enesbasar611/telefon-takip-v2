"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Building,
    Building2,
    CreditCard,
    FileSpreadsheet,
    FileText,
    Filter,
    Fuel,
    HandCoins,
    History,
    Home,
    Landmark,
    Package,
    Paperclip,
    Pencil,
    Receipt,
    RotateCcw,
    Scale,
    Search,
    ShoppingCart,
    Sparkles,
    Trash2,
    TrendingDown,
    TrendingUp,
    Truck,
    User,
    Users,
    UtensilsCrossed,
    Wallet,
    Wrench,
    Zap,
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { KasaBalanceText } from "./kasa-balance-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteTransaction, deleteTransactions } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { EditTransactionWrapper } from "./edit-transaction-wrapper";
import { DeleteSaleConfirmModal } from "@/components/satis/delete-sale-confirm-modal";
import { useQueryClient } from "@tanstack/react-query";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const paymentLabels: Record<string, string> = {
    CASH: "NAKİT",
    CARD: "KART",
    TRANSFER: "HAVALE",
    DEBT: "VERESİYE",
};

const typeLabels: Record<string, string> = {
    INCOME: "Tahsilat",
    EXPENSE: "Ödeme",
};

interface TransactionMeta {
    icon: React.ComponentType<{ className?: string }>;
    categoryLabel: string;
    badgeClass: string;
    iconBgClass: string;
    iconColorClass: string;
}

function getPaymentMeta(method?: string) {
    switch (method) {
        case "CASH":
            return {
                label: "NAKİT",
                icon: Banknote,
                badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
            };
        case "CARD":
            return {
                label: "KART",
                icon: CreditCard,
                badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
            };
        case "TRANSFER":
            return {
                label: "HAVALE",
                icon: Landmark,
                badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
            };
        case "DEBT":
            return {
                label: "VERESİYE",
                icon: Receipt,
                badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
            };
        default:
            return {
                label: method || "DİĞER",
                icon: Wallet,
                badgeClass: "bg-muted/30 border-border/40 text-muted-foreground",
            };
    }
}

function getTransactionMeta(t: any): TransactionMeta {
    const desc = (t.description || "").toLowerCase();
    const cat = (t.category || "").toLowerCase();
    const isIncome = t.type === "INCOME";
    const hasSupplier = !!t.supplierId || !!t.supplier;
    const hasSale = !!t.saleId || !!t.sale;
    const hasCustomer = !!t.customerId || !!t.customer;
    const hasReturn = !!t.returnId || !!t.returnTicketId || desc.includes("iade") || cat.includes("iade");

    // 1. İade (Geri Ödeme / İade Çıkışı)
    if (hasReturn) {
        return {
            icon: RotateCcw,
            categoryLabel: "İade",
            badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
            iconBgClass: "bg-rose-500/10 dark:bg-rose-500/20",
            iconColorClass: "text-rose-600 dark:text-rose-400",
        };
    }

    // 2. Yemek / İkram / Restoran / Kafe
    if (
        cat.includes("yemek") ||
        /(yemek|restoran|lokanta|öğle yemeği|ogle yemegi|akşam yemeği|aksam yemegi|çay|cay|kahve|simit|pide|döner|doner|kebap|tatlı|tatli|pasta|ikram|kahvaltı|kahvalti|lahmacun|dürüm|durum|çorba|corba|tost|büfe|bufe|köfte|kofte)/i.test(desc)
    ) {
        return {
            icon: UtensilsCrossed,
            categoryLabel: "Yemek / İkram",
            badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
            iconBgClass: "bg-amber-500/10 dark:bg-amber-500/20",
            iconColorClass: "text-amber-600 dark:text-amber-400",
        };
    }

    // 3. Satış / POS / Kasa Satışı
    if (hasSale || cat.includes("satış") || cat.includes("satis") || /(satış|satis|pos satış|perakende)/i.test(desc)) {
        return {
            icon: ShoppingCart,
            categoryLabel: "Satış",
            badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
            iconBgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
            iconColorClass: "text-emerald-600 dark:text-emerald-400",
        };
    }

    // 4. Teknik Servis / Cihaz Tamiri
    if (
        cat.includes("servis") ||
        /(servis|tamir|onarım|onarim|ekran değişimi|ekran degisimi|batarya|kasa değişimi|soket|anakart|yazılım|yazilim|format)/i.test(desc)
    ) {
        return {
            icon: Wrench,
            categoryLabel: "Teknik Servis",
            badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
            iconBgClass: "bg-sky-500/10 dark:bg-sky-500/20",
            iconColorClass: "text-sky-600 dark:text-sky-400",
        };
    }

    // 5. Tahsilat / Veresiye / Borç Kapama
    if (
        cat.includes("tahsilat") ||
        cat.includes("veresiye") ||
        /(tahsilat|veresiye|borç ödeme|borc odeme|hesap kapatma|cari tahsilat|borç kapama)/i.test(desc) ||
        (isIncome && hasCustomer && !hasSale)
    ) {
        return {
            icon: HandCoins,
            categoryLabel: "Tahsilat",
            badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25",
            iconBgClass: "bg-teal-500/10 dark:bg-teal-500/20",
            iconColorClass: "text-teal-600 dark:text-teal-400",
        };
    }

    // 6. Kira / Dükkan / Depo / Aidat
    if (cat.includes("kira") || cat.includes("aidat") || /(dükkan kirası|dukkan kirasi|kira|depo kirası|aidat|stopaj)/i.test(desc)) {
        return {
            icon: Home,
            categoryLabel: "Kira / Gider",
            badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
            iconBgClass: "bg-purple-500/10 dark:bg-purple-500/20",
            iconColorClass: "text-purple-600 dark:text-purple-400",
        };
    }

    // 7. Maaş / Personel / Avans / Prim
    if (cat.includes("maaş") || cat.includes("maas") || cat.includes("personel") || /(maaş|maas|avans|personel|prim|yevmiye|haftalık|haftalik|aylık|aylik|sgk|sigorta)/i.test(desc)) {
        return {
            icon: Users,
            categoryLabel: "Maaş / Personel",
            badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
            iconBgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
            iconColorClass: "text-indigo-600 dark:text-indigo-400",
        };
    }

    // 8. Fatura / Elektrik / Su / Doğalgaz / İnternet
    if (cat.includes("fatura") || /(fatura|elektrik|su faturası|su faturasi|internet|doğalgaz|dogalgaz|enerjisa|vodafone|turkcell|telekom|superonline|gediz)/i.test(desc)) {
        return {
            icon: Zap,
            categoryLabel: "Fatura",
            badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/25",
            iconBgClass: "bg-yellow-500/10 dark:bg-yellow-500/20",
            iconColorClass: "text-yellow-600 dark:text-yellow-400",
        };
    }

    // 9. Stok / Parça / Malzeme Alımı
    if (cat.includes("stok") || cat.includes("malzeme") || /(stok|malzeme|ürün alımı|urun alimi|parça alımı|parca alimi|toptan mal|yedek parça)/i.test(desc)) {
        return {
            icon: Package,
            categoryLabel: "Stok Alımı",
            badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
            iconBgClass: "bg-cyan-500/10 dark:bg-cyan-500/20",
            iconColorClass: "text-cyan-600 dark:text-cyan-400",
        };
    }

    // 10. Toptancı / Tedarikçi Ödemesi
    if (hasSupplier || cat.includes("toptancı") || cat.includes("toptanci") || cat.includes("tedarikçi") || cat.includes("tedarikci") || /(toptancı|toptanci|tedarikçi|tedarikci|cari ödeme|cari odeme)/i.test(desc)) {
        return {
            icon: Truck,
            categoryLabel: "Tedarikçi Ödemesi",
            badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
            iconBgClass: "bg-blue-500/10 dark:bg-blue-500/20",
            iconColorClass: "text-blue-600 dark:text-blue-400",
        };
    }

    // 11. Kargo / Ulaşım / Akaryakıt
    if (/(kargo|kurye|yurtiçi|yurtici|aras|mng|sürat|surat|yakıt|yakit|benzin|mazot|otopark|ulaşım|ulasim|bilet|taksi)/i.test(desc)) {
        return {
            icon: Fuel,
            categoryLabel: "Kargo / Ulaşım",
            badgeClass: "bg-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-600/25",
            iconBgClass: "bg-amber-600/10 dark:bg-amber-600/20",
            iconColorClass: "text-amber-600 dark:text-amber-400",
        };
    }

    // 12. Kırtasiye / Sarf Malzeme
    if (/(kırtasiye|kirtasiye|kağıt|kagit|toner|kartuş|kartus|fiş rulosu|fis rulosu|koli|bant|poşet|poset|ambalaj)/i.test(desc)) {
        return {
            icon: Paperclip,
            categoryLabel: "Kırtasiye",
            badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
            iconBgClass: "bg-slate-500/10 dark:bg-slate-500/20",
            iconColorClass: "text-slate-600 dark:text-slate-400",
        };
    }

    // 13. Temizlik / Bakım
    if (/(temizlik|deterjan|peçete|pecete|çöp|cop|tamirat|tadilat)/i.test(desc)) {
        return {
            icon: Sparkles,
            categoryLabel: "Temizlik",
            badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25",
            iconBgClass: "bg-teal-500/10 dark:bg-teal-500/20",
            iconColorClass: "text-teal-600 dark:text-teal-400",
        };
    }

    // 14. Kasa Devir / Açılış / Transfer
    if (cat.includes("açılış") || cat.includes("acilis") || cat.includes("devir") || /(açılış|acilis|devir|virman|transfer)/i.test(desc)) {
        return {
            icon: Landmark,
            categoryLabel: "Kasa Devir",
            badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
            iconBgClass: "bg-blue-500/10 dark:bg-blue-500/20",
            iconColorClass: "text-blue-600 dark:text-blue-400",
        };
    }

    // 15. Genel Fallback
    if (isIncome) {
        return {
            icon: TrendingUp,
            categoryLabel: t.category && t.category !== "GENEL" && t.category !== "DİĞER" ? t.category : "Genel Gelir",
            badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
            iconBgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
            iconColorClass: "text-emerald-600 dark:text-emerald-400",
        };
    }

    return {
        icon: TrendingDown,
        categoryLabel: t.category && t.category !== "GENEL" && t.category !== "DİĞER" ? t.category : "Genel Gider",
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
        iconBgClass: "bg-rose-500/10 dark:bg-rose-500/20",
        iconColorClass: "text-rose-600 dark:text-rose-400",
    };
}

const currencySymbol = (currency?: string) => {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    return "₺";
};

const formatMoney = (value: unknown, currency?: string) => {
    const amount = Number(value || 0);
    return `${currencySymbol(currency)}${amount.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const sanitizeFilename = (value: string) => {
    const trMap: Record<string, string> = {
        "ı": "i",
        "İ": "I",
        "ğ": "g",
        "Ğ": "G",
        "ü": "u",
        "Ü": "U",
        "ş": "s",
        "Ş": "S",
        "ö": "o",
        "Ö": "O",
        "ç": "c",
        "Ç": "C",
    };

    return value
        .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (char) => trMap[char] || char)
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
};

const downloadBlob = (content: BlobPart, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export function TransactionHistory({
    transactions,
    search,
    onSearchChange,
}: {
    transactions: any[];
    search: string;
    onSearchChange: (value: string) => void;
}) {
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
    const [accountFilter, setAccountFilter] = useState<string>("ALL");
    const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH">("ALL");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const queryClient = useQueryClient();
    const { rates } = useDashboardData();
    const usdRate = rates?.usd || 35.0;
    const eurRate = rates?.eur || 38.0;

    const handleTriggerDelete = (t: any) => {
        const sId = t.saleId || t.sale?.id;
        if (sId) {
            setDeleteSaleId(sId);
        } else {
            setDeleteId(t.id);
        }
    };

    const availableAccounts = useMemo(() => {
        const map = new Map<string, string>();
        transactions.forEach((t) => {
            const acc = t.financeAccount || t.account;
            if (acc?.id && acc?.name) {
                map.set(acc.id, acc.name);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [transactions]);

    const isFilterActive = paymentFilter !== "ALL" || typeFilter !== "ALL" || accountFilter !== "ALL" || dateFilter !== "ALL" || search.trim().length > 0;

    const resetFilters = () => {
        setPaymentFilter("ALL");
        setTypeFilter("ALL");
        setAccountFilter("ALL");
        setDateFilter("ALL");
        onSearchChange("");
    };

    const filtered = useMemo(() => {
        return transactions.filter((t) => {
            if (t.paymentMethod === "DEBT") return false;

            const needle = search.toLowerCase().trim();
            const matchSearch =
                !needle ||
                t.description?.toLowerCase().includes(needle) ||
                t.user?.name?.toLowerCase().includes(needle) ||
                t.financeAccount?.name?.toLowerCase().includes(needle) ||
                t.account?.name?.toLowerCase().includes(needle) ||
                t.customer?.name?.toLowerCase().includes(needle) ||
                t.supplier?.name?.toLowerCase().includes(needle) ||
                t.category?.toLowerCase().includes(needle);

            const matchPayment = paymentFilter === "ALL" || t.paymentMethod === paymentFilter;
            const matchType = typeFilter === "ALL" || t.type === typeFilter;
            const matchAccount = accountFilter === "ALL" ||
                t.financeAccountId === accountFilter ||
                t.accountId === accountFilter ||
                t.financeAccount?.id === accountFilter ||
                t.account?.id === accountFilter;

            let matchDate = true;
            if (dateFilter !== "ALL") {
                const d = new Date(t.createdAt);
                if (!isNaN(d.getTime())) {
                    if (dateFilter === "TODAY") matchDate = isToday(d);
                    else if (dateFilter === "YESTERDAY") matchDate = isYesterday(d);
                    else if (dateFilter === "THIS_WEEK") matchDate = isThisWeek(d, { weekStartsOn: 1 });
                    else if (dateFilter === "THIS_MONTH") matchDate = isThisMonth(d);
                } else {
                    matchDate = false;
                }
            }

            return matchSearch && matchPayment && matchType && matchAccount && matchDate;
        });
    }, [transactions, search, paymentFilter, typeFilter, accountFilter, dateFilter]);

    const totals = useMemo(() => {
        let totalIncomeTRY = 0;
        let totalExpenseTRY = 0;
        let incomeCount = 0;
        let expenseCount = 0;

        filtered.forEach((t) => {
            const rawAmount = Number(t.amount || 0);
            const currency = t.currency || "TRY";
            const amountTRY = currency === "USD"
                ? rawAmount * usdRate
                : currency === "EUR"
                ? rawAmount * eurRate
                : rawAmount;

            if (t.type === "INCOME") {
                totalIncomeTRY += amountTRY;
                incomeCount++;
            } else if (t.type === "EXPENSE") {
                totalExpenseTRY += amountTRY;
                expenseCount++;
            }
        });

        const netTRY = totalIncomeTRY - totalExpenseTRY;

        return {
            totalIncomeTRY,
            totalExpenseTRY,
            netTRY,
            incomeCount,
            expenseCount,
            totalCount: filtered.length,
        };
    }, [filtered, usdRate, eurRate]);

    const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(filtered, "createdAt", "desc");

    const exportRows = sortedData.map((t) => {
        const date = new Date(t.createdAt);
        const validDate = !isNaN(date.getTime());
        return {
            tarih: validDate ? format(date, "dd.MM.yyyy HH:mm", { locale: tr }) : "-",
            hesap: t.financeAccount?.name || "Genel Kasa",
            odemeYontemi: paymentLabels[t.paymentMethod] || t.paymentMethod || "-",
            tip: typeLabels[t.type] || t.type || "-",
            aciklama: t.description || "-",
            kategori: t.category || "-",
            musteri: t.customer?.name || "",
            tedarikci: t.supplier?.name || "",
            sorumlu: t.user?.name || "Sistem",
            paraBirimi: t.currency || "TRY",
            tutar: Number(t.amount || 0),
            bakiye: t.runningBalance === null || t.runningBalance === undefined ? null : Number(t.runningBalance),
        };
    });

    const exportFilename = (extension: "csv" | "pdf") => {
        const date = format(new Date(), "yyyy-MM-dd");
        const filterPart = paymentFilter === "ALL" ? "tum-hareketler" : paymentLabels[paymentFilter] || paymentFilter;
        return `finansal-hareketler-${sanitizeFilename(filterPart)}-${date}.${extension}`;
    };

    const fixTurkish = (text: string | null | undefined) => {
        if (!text) return "";
        return String(text)
            .replace(/ı/g, 'i').replace(/İ/g, 'I')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
            .replace(/ü/g, 'u').replace(/Ü/g, 'U')
            .replace(/ö/g, 'o').replace(/Ö/g, 'O')
            .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    const handleExportCsv = () => {
        if (exportRows.length === 0) {
            toast.error("Dışa aktarılacak finansal hareket bulunamadı.");
            return;
        }

        const headers = ["Tarih", "Hesap", "Odeme Yontemi", "Tip", "Aciklama", "Kategori", "Musteri", "Tedarikci", "Sorumlu", "Para Birimi", "Tutar", "Bakiye"];
        const escapeCell = (value: unknown) => `"${fixTurkish(String(value ?? "")).replace(/"/g, '""')}"`;
        const rows = exportRows.map((row) => [
            row.tarih,
            row.hesap,
            row.odemeYontemi,
            row.tip,
            row.aciklama,
            row.kategori,
            row.musteri,
            row.tedarikci,
            row.sorumlu,
            row.paraBirimi,
            row.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            row.bakiye === null ? "" : row.bakiye.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ].map(escapeCell).join(";"));

        const csv = `\uFEFF${[headers.map(escapeCell).join(";"), ...rows].join("\n")}`;
        downloadBlob(csv, exportFilename("csv"), "text/csv;charset=utf-8");
        toast.success("CSV dosyası indirildi.");
    };

    const handleExportPdf = async () => {
        if (exportRows.length === 0) {
            toast.error("Dışa aktarılacak finansal hareket bulunamadı.");
            return;
        }

        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);
            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }) as any;

            doc.setFontSize(14);
            doc.text("Finansal Hareketler", 14, 14);
            doc.setFontSize(9);
            doc.text(`${exportRows.length} hareket | Filtre: ${fixTurkish(paymentFilter === "ALL" ? "Tumu" : paymentLabels[paymentFilter] || paymentFilter)}`, 14, 21);
            doc.text(`Olusturma: ${format(new Date(), "dd.MM.yyyy HH:mm")}`, 14, 27);

            autoTable(doc, {
                startY: 33,
                head: [["Tarih", "Hesap", "Odeme", "Tip", "Aciklama", "Sorumlu", "Tutar", "Bakiye"]],
                body: exportRows.map((row) => [
                    fixTurkish(row.tarih),
                    fixTurkish(row.hesap),
                    fixTurkish(row.odemeYontemi),
                    fixTurkish(row.tip),
                    fixTurkish(row.aciklama),
                    fixTurkish(row.sorumlu),
                    formatMoney(row.tutar, row.paraBirimi),
                    row.bakiye === null ? "-" : formatMoney(row.bakiye, row.paraBirimi),
                ]),
                styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                columnStyles: {
                    4: { cellWidth: 'auto' }, // Açıklama wraps naturally
                    6: { halign: "right" },
                    7: { halign: "right" },
                },
                margin: { top: 30, right: 10, bottom: 10, left: 10 },
            });

            doc.save(exportFilename("pdf"));
            toast.success("PDF dosyası indirildi.");
        } catch (error) {
            console.error("Finance PDF export error:", error);
            toast.error("PDF oluşturulurken hata oluştu.");
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? sortedData.map((t) => t.id) : []);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((item) => item !== id));
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const res = await deleteTransaction(deleteId);
        setIsDeleting(false);
        if (res.success) {
            toast.success("İşlem başarıyla silindi");
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
        } else {
            toast.error(res.error || "İşlem silinemedi");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        const res = await deleteTransactions(selectedIds);
        setIsDeleting(false);
        if (res.success) {
            toast.success(`${selectedIds.length} işlem başarıyla silindi`);
            setSelectedIds([]);
            setIsBulkDeleteOpen(false);
        } else {
            toast.error(res.error || "İşlemler silinemedi");
        }
    };

    return (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem]">
            <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                            <History className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="font-semibold text-base tracking-tight">Finansal Hareketler</CardTitle>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase opacity-60">Hesap bazlı nakit akışı ve işlem geçmişi</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsBulkDeleteOpen(true)}
                                className="h-9 rounded-xl gap-2 shadow-lg shadow-rose-500/10 uppercase tracking-widest text-xs px-3"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> {selectedIds.length} Seçili Sil
                            </Button>
                        )}

                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExportCsv}
                                className="h-9 rounded-xl gap-1.5 text-xs font-semibold px-3"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> CSV
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExportPdf}
                                className="h-9 rounded-xl gap-1.5 text-xs font-semibold px-3"
                            >
                                <FileText className="h-3.5 w-3.5 text-rose-500" /> PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filtreleme Çubuğu */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                        {/* Arama Kutusu */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="İşlem, müşteri, tedarikçi, hesap veya kullanıcı ara..."
                                className="pl-9 h-9 w-full rounded-xl text-xs border-zinc-200 dark:border-zinc-800 bg-muted/20 focus-visible:ring-blue-500/20"
                            />
                        </div>

                        {/* İşlem Türü Filtresi (Tümü / Gelir / Gider) */}
                        <div className="flex items-center gap-1 p-1 bg-muted/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                            <Button
                                variant={typeFilter === "ALL" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setTypeFilter("ALL")}
                                className={cn(
                                    "h-7 text-[10px] rounded-lg px-2.5 transition-all uppercase tracking-tight",
                                    typeFilter === "ALL" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground/70 hover:text-foreground"
                                )}
                            >
                                Tümü
                            </Button>
                            <Button
                                variant={typeFilter === "INCOME" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setTypeFilter("INCOME")}
                                className={cn(
                                    "h-7 text-[10px] rounded-lg px-2.5 transition-all uppercase tracking-tight gap-1.5",
                                    typeFilter === "INCOME" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm" : "text-emerald-600/70 hover:text-emerald-600"
                                )}
                            >
                                <TrendingUp className="h-3 w-3 text-emerald-500" /> Gelir (+)
                            </Button>
                            <Button
                                variant={typeFilter === "EXPENSE" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setTypeFilter("EXPENSE")}
                                className={cn(
                                    "h-7 text-[10px] rounded-lg px-2.5 transition-all uppercase tracking-tight gap-1.5",
                                    typeFilter === "EXPENSE" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold shadow-sm" : "text-rose-600/70 hover:text-rose-600"
                                )}
                            >
                                <TrendingDown className="h-3 w-3 text-rose-500" /> Gider (-)
                            </Button>
                        </div>

                        {/* Ödeme Yöntemi Filtresi */}
                        <div className="flex items-center gap-1 p-1 bg-muted/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                            {["ALL", "CASH", "CARD", "TRANSFER"].map((method) => {
                                const pMeta = getPaymentMeta(method);
                                const Icon = method === "ALL" ? Wallet : pMeta.icon;
                                return (
                                    <Button
                                        key={method}
                                        variant={paymentFilter === method ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setPaymentFilter(method)}
                                        className={cn(
                                            "h-7 text-[10px] rounded-lg px-2.5 transition-all uppercase tracking-tight gap-1.5",
                                            paymentFilter === method ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground/70 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {method === "ALL" ? "Tüm Kanallar" : paymentLabels[method]}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detay Filtreleri: Hesap Seçimi, Tarih Seçimi ve Sıfırla */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="w-[180px]">
                            <Select value={accountFilter} onValueChange={setAccountFilter}>
                                <SelectTrigger className="h-8 rounded-xl text-xs border-zinc-200 dark:border-zinc-800 bg-muted/20">
                                    <SelectValue placeholder="Tüm Hesaplar" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="ALL">Tüm Hesaplar / Kasalar</SelectItem>
                                    {availableAccounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-[160px]">
                            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                                <SelectTrigger className="h-8 rounded-xl text-xs border-zinc-200 dark:border-zinc-800 bg-muted/20">
                                    <SelectValue placeholder="Tarih Filtresi" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="ALL">Tüm Zamanlar</SelectItem>
                                    <SelectItem value="TODAY">Bugün</SelectItem>
                                    <SelectItem value="YESTERDAY">Dün</SelectItem>
                                    <SelectItem value="THIS_WEEK">Bu Hafta</SelectItem>
                                    <SelectItem value="THIS_MONTH">Bu Ay</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isFilterActive && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-8 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5"
                            >
                                <RotateCcw className="h-3 w-3" /> Filtreleri Temizle
                            </Button>
                        )}
                    </div>
                </div>

                {/* Finansal Özet Şeridi (Tutar Toplamları) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Toplam Gelir</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <div className="mt-1">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                +{formatMoney(totals.totalIncomeTRY, "TRY")}
                            </div>
                            <span className="text-[10px] text-muted-foreground/70">{totals.incomeCount} giriş / tahsilat</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Toplam Gider</span>
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <div className="mt-1">
                            <div className="text-base font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                                -{formatMoney(totals.totalExpenseTRY, "TRY")}
                            </div>
                            <span className="text-[10px] text-muted-foreground/70">{totals.expenseCount} çıkış / ödeme</span>
                        </div>
                    </div>

                    <div className={cn(
                        "p-3 rounded-2xl border flex flex-col justify-between",
                        totals.netTRY >= 0
                            ? "bg-blue-500/5 border-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400"
                    )}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Net Nakit Akışı</span>
                            <Scale className="h-3.5 w-3.5" />
                        </div>
                        <div className="mt-1">
                            <div className="text-base font-bold tracking-tight">
                                {totals.netTRY >= 0 ? "+" : ""}{formatMoney(totals.netTRY, "TRY")}
                            </div>
                            <span className="text-[10px] text-muted-foreground/70">
                                {totals.netTRY >= 0 ? "Pozitif net akış" : "Negatif net akış"}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-muted/30 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">İşlem Hacmi</span>
                            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="mt-1">
                            <div className="text-base font-bold text-foreground tracking-tight">
                                {totals.totalCount} <span className="text-xs font-normal text-muted-foreground">kayıt</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground/70">
                                {isFilterActive ? "Filtrelenmiş hareket" : "Tüm hareketler"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <CardContent className="p-0">
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="font-medium bg-muted/10">
                            <TableRow className="border-border/40 hover:bg-transparent h-10">
                                <TableHead className="w-[42px] pl-4">
                                    <Checkbox
                                        checked={selectedIds.length === sortedData.length && sortedData.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        className="rounded-md border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableHead>
                                <TableHead className="w-[120px]">
                                    <SortableHeader label="Tarih" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[140px]">
                                    <SortableHeader label="Hesap / Kanal" field="accountId" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Açıklama" field="description" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[100px] font-medium text-[10px] text-muted-foreground uppercase opacity-60">Sorumlu</TableHead>
                                <TableHead className="w-[150px] font-medium pr-4 text-right">
                                    <SortableHeader label="Tutar" field="amount" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                </TableHead>
                                <TableHead className="w-[150px] font-medium pr-4 text-right">
                                    <SortableHeader label="Bakiye" field="runningBalance" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} align="right" />
                                </TableHead>
                                <TableHead className="w-[84px] pr-4 text-right font-medium text-[10px] text-muted-foreground uppercase opacity-60">
                                    İşlemler
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-36 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                                        {isFilterActive ? "Filtre kriterine uyan işlem bulunamadı." : "Henüz finansal hareket yok."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((t) => {
                                    const meta = getTransactionMeta(t);
                                    const paymentMeta = getPaymentMeta(t.paymentMethod);
                                    const date = new Date(t.createdAt);
                                    const isValidDate = !isNaN(date.getTime());

                                    return (
                                        <TableRow key={t.id} className="border-border/10 hover:bg-muted/10 transition-colors h-14">
                                            <TableCell className="pl-4 py-2">
                                                <Checkbox
                                                    checked={selectedIds.includes(t.id)}
                                                    onCheckedChange={(checked) => handleSelectRow(t.id, !!checked)}
                                                    className="rounded-md border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-medium leading-tight">
                                                        {isValidDate ? format(date, "dd MMM yyyy", { locale: tr }) : "-"}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground opacity-60">
                                                        {isValidDate ? format(date, "HH:mm") : "-"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-tight truncate max-w-[130px]">
                                                        {t.financeAccount?.name || "Genel Kasa"}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "w-fit text-[8px] font-bold py-0.5 px-1.5 rounded-md border flex items-center gap-1 uppercase tracking-tight shadow-none",
                                                            paymentMeta.badgeClass
                                                        )}
                                                    >
                                                        <paymentMeta.icon className="h-2.5 w-2.5 shrink-0" />
                                                        {paymentMeta.label}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className={cn(
                                                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform hover:scale-105",
                                                            meta.iconBgClass,
                                                            meta.iconColorClass
                                                        )}
                                                        title={meta.categoryLabel}
                                                    >
                                                        <meta.icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 max-w-[340px] min-w-0">
                                                        <span className="text-xs font-semibold text-foreground truncate" title={t.description || "Açıklama belirtilmemiş"}>
                                                            {t.description || "Açıklama belirtilmemiş"}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-[8px] font-bold py-0 px-1.5 rounded-md border flex items-center gap-1 uppercase tracking-wider",
                                                                    meta.badgeClass
                                                                )}
                                                            >
                                                                <meta.icon className="h-2.5 w-2.5 shrink-0" />
                                                                {meta.categoryLabel}
                                                            </Badge>
                                                            {(t.sale || t.saleId) && (
                                                                <Link
                                                                    href={`/satis/gecmis?search=${encodeURIComponent(t.sale?.saleNumber || t.saleId)}`}
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                                                                    title="Satış Kaydına Git"
                                                                >
                                                                    <ShoppingCart className="h-2.5 w-2.5 shrink-0" />
                                                                    <span>#{t.sale?.saleNumber || t.saleId}</span>
                                                                    <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                                                                </Link>
                                                            )}
                                                            {t.customer && (
                                                                <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium truncate max-w-[140px]">
                                                                    <User className="h-3 w-3 shrink-0" /> {t.customer.name}
                                                                </span>
                                                            )}
                                                            {t.supplier && (
                                                                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium truncate max-w-[140px]">
                                                                    <Building2 className="h-3 w-3 shrink-0" /> {t.supplier.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-md bg-muted border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground shadow-sm shrink-0">
                                                        {t.user?.name?.charAt(0) || "S"}
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-tight truncate max-w-[70px]">{t.user?.name || "Sistem"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-right pr-4">
                                                <div className="flex flex-col items-end">
                                                    <div className={cn("flex items-center gap-1 text-sm tracking-tight font-bold", t.type === "INCOME" ? "text-emerald-500" : "text-rose-500")}>
                                                        {t.type === "INCOME" ? "+" : "-"}
                                                        {formatMoney(t.amount, t.currency)}
                                                        {t.type === "INCOME" ? (
                                                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground/60 font-medium">
                                                        {t.currency === "TRY" ? (
                                                            <span>
                                                                ~${(Number(t.amount) / usdRate).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • ~€{(Number(t.amount) / eurRate).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span>~₺{Math.round(Number(t.amount) * (t.currency === "USD" ? usdRate : eurRate)).toLocaleString("tr-TR")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-right pr-4">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    {(() => {
                                                        const hasBalance = t.runningBalance !== null && t.runningBalance !== undefined;
                                                        if (!hasBalance) return <span className="text-[10px] text-muted-foreground/40 italic">-</span>;
                                                        const isIncome = t.type === "INCOME";
                                                        return (
                                                            <div className={cn(
                                                                "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border",
                                                                isIncome
                                                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                                                                    : "text-rose-600 dark:text-rose-400 bg-rose-500/8 border-rose-500/20"
                                                            )}>
                                                                {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                                <KasaBalanceText
                                                                    balance={t.runningBalance}
                                                                    currency={t.currency || "TRY"}
                                                                    accountType={t.financeAccount?.type}
                                                                    mainClassName="text-inherit"
                                                                />
                                                            </div>
                                                        );
                                                    })()}
                                                    {t.currency !== "TRY" && t.runningBalance !== null && t.runningBalance !== undefined && (
                                                        <span className="text-[9px] text-muted-foreground/60 font-medium">
                                                            ~<KasaBalanceText
                                                                balance={Math.round(Number(t.runningBalance) * (t.currency === "USD" ? usdRate : eurRate))}
                                                                currency="TRY"
                                                                accountType={t.financeAccount?.type}
                                                                minimumFractionDigits={0}
                                                                maximumFractionDigits={0}
                                                            />
                                                        </span>
                                                    )}
                                                    <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider whitespace-nowrap">
                                                        {t.financeAccount?.name || "Kasa"} bakiye
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(t.sale || t.saleId) && (
                                                        <Link
                                                            href={`/satis/gecmis?search=${encodeURIComponent(t.sale?.saleNumber || t.saleId)}`}
                                                            title="Satış Kaydını Aç"
                                                            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors flex items-center justify-center"
                                                        >
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    )}
                                                    <EditTransactionWrapper
                                                        transaction={t}
                                                        trigger={
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="İşlemi Düzenle"
                                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        }
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="İşlemi Sil"
                                                        onClick={() => handleTriggerDelete(t)}
                                                        className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col divide-y divide-border/20 md:hidden min-h-[400px]">
                    {sortedData.length === 0 ? (
                        <div className="py-20 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                            İşlem bulunamadı
                        </div>
                    ) : (
                        sortedData.map((t) => {
                            const meta = getTransactionMeta(t);
                            const paymentMeta = getPaymentMeta(t.paymentMethod);
                            const date = new Date(t.createdAt);
                            const isValidDate = !isNaN(date.getTime());

                            return (
                                <div key={t.id} className="p-4 flex flex-col gap-3 active:bg-muted/30 transition-colors relative">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                                className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                                                    meta.iconBgClass,
                                                    meta.iconColorClass
                                                )}
                                                title={meta.categoryLabel}
                                            >
                                                <meta.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                    {isValidDate ? format(date, "dd MMM yyyy, HH:mm", { locale: tr }) : "-"}
                                                </span>
                                                <span className="text-[11px] text-blue-500 font-bold uppercase truncate">
                                                    {t.financeAccount?.name || "Genel Kasa"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn("flex flex-col items-end gap-0.5 font-bold tracking-tight shrink-0", t.type === "INCOME" ? "text-emerald-500" : "text-rose-500")}>
                                            <div className="flex items-center gap-1 text-base font-extrabold">
                                                {t.type === "INCOME" ? "+" : "-"}
                                                {formatMoney(t.amount, t.currency)}
                                                {t.type === "INCOME" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <span className="text-[9px] text-muted-foreground/60 font-medium">
                                                {t.currency === "TRY"
                                                    ? `~₺${Number(t.amount).toLocaleString("tr-TR")}`
                                                    : `~₺${Math.round(Number(t.amount) * (t.currency === "USD" ? usdRate : eurRate)).toLocaleString("tr-TR")}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 pl-1">
                                        <p className="text-xs text-foreground font-semibold leading-tight">
                                            {t.description || "Açıklama belirtilmemiş"}
                                        </p>
                                        {(t.customer || t.supplier) && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {t.customer && (
                                                    <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                                                        <User className="h-3 w-3" /> {t.customer.name}
                                                    </span>
                                                )}
                                                {t.supplier && (
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                                                        <Building2 className="h-3 w-3" /> {t.supplier.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                            <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold border flex items-center gap-1", meta.badgeClass)}>
                                                <meta.icon className="h-3 w-3" />
                                                {meta.categoryLabel}
                                            </Badge>
                                            {(t.sale || t.saleId) && (
                                                <Link
                                                    href={`/satis/gecmis?search=${encodeURIComponent(t.sale?.saleNumber || t.saleId)}`}
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                                                    title="Satış Kaydına Git"
                                                >
                                                    <ShoppingCart className="h-2.5 w-2.5 shrink-0" />
                                                    <span>#{t.sale?.saleNumber || t.saleId}</span>
                                                    <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                                                </Link>
                                            )}
                                            <Badge variant="outline" className={cn("text-[9px] py-0.5 px-2 rounded-lg font-bold border flex items-center gap-1 uppercase", paymentMeta.badgeClass)}>
                                                <paymentMeta.icon className="h-3 w-3" />
                                                {paymentMeta.label}
                                            </Badge>
                                            {t.runningBalance !== null && t.runningBalance !== undefined && (
                                                <span className="text-[9px] text-muted-foreground font-medium ml-auto">
                                                    Kasa: {formatMoney(t.runningBalance, t.currency || "TRY")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/10 gap-2">
                                        <span className="text-[9px] text-muted-foreground uppercase font-medium">{t.user?.name || "Sistem"}</span>
                                        <div className="flex items-center gap-2">
                                            {(t.sale || t.saleId) && (
                                                <Link
                                                    href={`/satis/gecmis?search=${encodeURIComponent(t.sale?.saleNumber || t.saleId)}`}
                                                    className="h-8 px-2.5 rounded-lg border border-border/40 text-[10px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 flex items-center"
                                                >
                                                    <ShoppingCart className="h-3 w-3" /> Satış
                                                </Link>
                                            )}
                                            <EditTransactionWrapper
                                                transaction={t}
                                                trigger={
                                                    <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg border border-border/40 text-[10px] text-muted-foreground gap-2">
                                                        <Pencil className="h-3 w-3" /> Düzenle
                                                    </Button>
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTriggerDelete(t)}
                                                className="h-8 px-3 rounded-lg border border-border/40 text-[10px] text-rose-500 gap-2 hover:bg-rose-500/10 hover:border-rose-500/20"
                                            >
                                                <Trash2 className="h-3 w-3" /> Sil
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>

            <div className="px-4 md:px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-muted/5">
                <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase opacity-60">
                    {filtered.length} / {transactions.length} işlem listeleniyor
                </p>
                <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                    <div className="absolute top-0 left-0 h-full bg-blue-500/40 w-full animate-pulse" />
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2rem] border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-rose-500">
                            <AlertCircle className="h-5 w-5" /> İşlemi Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu finansal hareketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ilgili hesap bakiyesi otomatik olarak güncellenecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12">İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogContent className="rounded-[2rem] border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-rose-500">
                            <AlertCircle className="h-5 w-5" /> {selectedIds.length} İşlemi Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Seçili olan {selectedIds.length} finansal hareketi toplu olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilgili hesap bakiyeleri otomatik olarak güncellenecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12">İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="rounded-xl uppercase tracking-widest text-[10px] font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Toplu Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteSaleConfirmModal
                saleId={deleteSaleId}
                open={!!deleteSaleId}
                onOpenChange={(open) => !open && setDeleteSaleId(null)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
                    queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
                    queryClient.invalidateQueries({ queryKey: ["sales-history"] });
                }}
            />
        </Card>
    );
}
