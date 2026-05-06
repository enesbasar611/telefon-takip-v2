"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Search,
    ChevronRight,
    User,
    Package,
    Banknote,
    CreditCard,
    Landmark,
    Filter,
    Trash2,
    AlertCircle,
    Loader2,
    Calendar,
    RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { deleteSale, deleteSales } from "@/lib/actions/sale-actions";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
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

import { SaleDetailModal } from "./sale-detail-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isToday, isWithinInterval, startOfWeek, startOfMonth, endOfDay } from "date-fns";

interface SalesHistoryClientProps {
    initialSales: any[];
}

export function SalesHistoryClient({ initialSales }: SalesHistoryClientProps) {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get("highlight");
    const [searchTerm, setSearchTerm] = useState("");
    const [sales, setSales] = useState(initialSales);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [targetId, setTargetId] = useState<string | null>(null);

    // Detail Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<any | null>(null);

    // Filter State
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [dateFilter, setDateFilter] = useState<string>("ALL");

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesSearch =
                sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.items.some((item: any) => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesPayment = paymentFilter === "ALL" || sale.paymentMethod === paymentFilter;

            let matchesDate = true;
            const saleDate = new Date(sale.createdAt);
            if (dateFilter === "TODAY") matchesDate = isToday(saleDate);
            else if (dateFilter === "WEEK") matchesDate = isWithinInterval(saleDate, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfDay(new Date()) });
            else if (dateFilter === "MONTH") matchesDate = isWithinInterval(saleDate, { start: startOfMonth(new Date()), end: endOfDay(new Date()) });

            return matchesSearch && matchesPayment && matchesDate;
        });
    }, [sales, searchTerm, paymentFilter, dateFilter]);

    useEffect(() => {
        if (highlightId) {
            const element = document.getElementById(`sale-${highlightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightId]);

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredSales.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSales.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const [revertStock, setRevertStock] = useState(true);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            if (targetId) {
                const res = await deleteSale(targetId, revertStock);
                if (res.success) {
                    setSales(prev => prev.filter(s => s.id !== targetId));
                    toast.success(revertStock ? "Satış başarıyla silindi ve stoklar iade edildi." : "Satış başarıyla silindi.");
                } else {
                    toast.error(res.error || "Silme işlemi başarısız.");
                }
            } else if (selectedIds.length > 0) {
                const res = await deleteSales(selectedIds, revertStock);
                if (res.success) {
                    setSales(prev => prev.filter(s => !selectedIds.includes(s.id)));
                    setSelectedIds([]);
                    toast.success(revertStock
                        ? `${selectedIds.length} adet satış silindi ve stoklar iade edildi.`
                        : `${selectedIds.length} adet satış silindi.`);
                } else {
                    toast.error("Bazı satışlar silinemedi.");
                }
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Bir hata oluştu.");
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
            setTargetId(null);
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case "CASH": return <Banknote className="h-3.5 w-3.5" />;
            case "CARD": return <CreditCard className="h-3.5 w-3.5" />;
            case "TRANSFER": return <Landmark className="h-3.5 w-3.5" />;
            default: return <History className="h-3.5 w-3.5" />;
        }
    };

    const getPaymentLabel = (method: string) => {
        switch (method) {
            case "CASH": return "NAKİT";
            case "CARD": return "KART";
            case "TRANSFER": return "HAVALE";
            case "DEBT": return "VERESİYE";
            default: return method;
        }
    };

    return (
        <div className="space-y-6">

            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden bg-card/50 backdrop-blur-xl">
                <CardHeader className="p-8 border-b border-border/40 bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Satış no, müşteri veya ürün ara..."
                                className="pl-12 h-12 rounded-2xl bg-background border-border/40 text-xs "
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-xl h-12 px-6 border-border/40  text-[11px] uppercase tracking-widest gap-2">
                                        <Filter className="h-4 w-4" />
                                        {paymentFilter === "ALL" ? "TÜM ÖDEMELER" : getPaymentLabel(paymentFilter)}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2 bg-card/80 backdrop-blur-xl">
                                    <DropdownMenuLabel className="text-[10px]  opacity-50 px-3 uppercase tracking-widest">ÖDEME YÖNTEMİ</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setPaymentFilter("ALL")} className="rounded-xl  text-[11px] h-10 px-3">TÜMÜ</DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/40 my-1 mx-2" />
                                    <DropdownMenuItem onClick={() => setPaymentFilter("CASH")} className="rounded-xl  text-[11px] h-10 px-3">NAKİT</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPaymentFilter("CARD")} className="rounded-xl  text-[11px] h-10 px-3">KART</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPaymentFilter("TRANSFER")} className="rounded-xl  text-[11px] h-10 px-3">HAVALE</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPaymentFilter("DEBT")} className="rounded-xl  text-[11px] h-10 px-3">VERESİYE</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-xl h-12 px-6 border-border/40  text-[11px] uppercase tracking-widest gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {dateFilter === "ALL" ? "TÜM ZAMANLAR" : dateFilter === "TODAY" ? "BUGÜN" : dateFilter === "WEEK" ? "BU HAFTA" : "BU AY"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2 bg-card/80 backdrop-blur-xl">
                                    <DropdownMenuLabel className="text-[10px]  opacity-50 px-3 uppercase tracking-widest">TARİH ARALIĞI</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setDateFilter("ALL")} className="rounded-xl  text-[11px] h-10 px-3">TÜM ZAMANLAR</DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/40 my-1 mx-2" />
                                    <DropdownMenuItem onClick={() => setDateFilter("TODAY")} className="rounded-xl  text-[11px] h-10 px-3">BUGÜN</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDateFilter("WEEK")} className="rounded-xl  text-[11px] h-10 px-3">BU HAFTA</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDateFilter("MONTH")} className="rounded-xl  text-[11px] h-10 px-3">BU AY</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/5 text-[10px]  text-muted-foreground uppercase tracking-widest">
                                    <th className="px-8 py-5 text-left w-12">
                                        <Checkbox
                                            checked={filteredSales.length > 0 && selectedIds.length === filteredSales.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
                                        />
                                    </th>
                                    <th className="px-4 py-5 text-left">SATIŞ NO</th>
                                    <th className="px-8 py-5 text-left">MÜŞTERİ</th>
                                    <th className="px-8 py-5 text-left">ÜRÜNLER</th>
                                    <th className="px-8 py-5 text-left">ÖDEME</th>
                                    <th className="px-8 py-5 text-right">TOPLAM</th>
                                    <th className="px-8 py-5 text-right">TARİH</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filteredSales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        id={`sale-${sale.id}`}
                                        className={cn(
                                            "group transition-all hover:bg-muted/30 cursor-pointer",
                                            highlightId === sale.id && "highlight-blink",
                                            selectedIds.includes(sale.id) && "bg-primary/5 hover:bg-primary/10"
                                        )}
                                        onClick={() => {
                                            setSelectedSale(sale);
                                            setIsDetailOpen(true);
                                        }}
                                    >
                                        <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(sale.id)}
                                                onCheckedChange={() => toggleSelect(sale.id)}
                                                className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
                                            />
                                        </td>
                                        <td className="px-4 py-6">
                                            <span className="text-xs  text-foreground tracking-tight">{sale.saleNumber}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs  text-foreground">{sale.customer?.name || "Hızlı Satış"}</span>
                                                    <span className="text-[10px]  text-muted-foreground opacity-60">{sale.customer?.phone || "-"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                {sale.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 text-[10px]  text-muted-foreground">
                                                        <Package className="h-3 w-3 opacity-40" />
                                                        <span className="truncate">{item.product.name}</span>
                                                        <span className="text-primary ">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className="rounded-lg h-7 px-3 bg-muted/30 border-border/40 text-[9px]  uppercase tracking-widest gap-1.5">
                                                {getPaymentIcon(sale.paymentMethod)}
                                                {getPaymentLabel(sale.paymentMethod)}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm  text-emerald-500 tracking-tight">₺{Number(sale.finalAmount).toLocaleString('tr-TR')}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-[11px]  text-muted-foreground">
                                                {format(new Date(sale.createdAt), "dd MMM yyyy", { locale: tr })}
                                                <br />
                                                <span className="opacity-50">{format(new Date(sale.createdAt), "HH:mm")}</span>
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTargetId(sale.id);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full opacity-60 group-hover:opacity-100 transition-all"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <SaleDetailModal
                sale={selectedSale}
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedSale(null);
                }}
            />

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-2xl ">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            Emin misiniz?
                        </AlertDialogTitle>
                        <AlertDialogDescription className=" text-sm pt-4">
                            {targetId
                                ? "Bu satış kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz."
                                : `${selectedIds.length} adet satış kaydı silinecektir. Devam etmek istiyor musunuz?`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-6 px-4 bg-muted/30 rounded-2xl border border-border/40 my-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <RefreshCcw className="h-4 w-4 text-emerald-500" />
                                    Stokları Geri Al
                                </h4>
                                <p className="text-[11px] text-muted-foreground">Satılan ürünlerin miktarı stoğa geri eklensin mi?</p>
                            </div>
                            <Checkbox
                                checked={revertStock}
                                onCheckedChange={(v) => setRevertStock(!!v)}
                                className="h-6 w-6 rounded-lg data-[state=checked]:bg-emerald-500 border-border/40"
                            />
                        </div>
                    </div>

                    <AlertDialogFooter className="gap-3 mt-6">
                        <AlertDialogCancel className="rounded-xl h-12 px-6  border-border/40 hover:bg-muted/50">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-xl h-12 px-8  bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Siliniyor...
                                </div>
                            ) : (
                                "Evet, Sil"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const History = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
    </svg>
);




