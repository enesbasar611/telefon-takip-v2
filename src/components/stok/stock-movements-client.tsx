"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    BarChart3,
    RefreshCcw,
    AlertTriangle,
    Search,
    History,
    TrendingDown,
    TrendingUp,
    Package,
    Activity,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    ArrowRightLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CriticalStockDialog } from "./critical-stock-dialog";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StockMovementsClientProps {
    movements: any[];
    criticalProducts: any[];
    stats: {
        totalMovements: number;
        criticalCount: number;
    };
    pagination?: {
        page: number;
        totalPages: number;
        search: string;
    };
}

export function StockMovementsClient({
    movements,
    criticalProducts,
    stats,
    pagination = { page: 1, totalPages: 1, search: "" },
}: StockMovementsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(pagination.search || "");
    const [isPending, startTransition] = useTransition();
    const [isCriticalDialogOpen, setIsCriticalDialogOpen] = useState(false);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (value) {
            params.set("search", value);
        } else {
            params.delete("search");
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "STOCK_IN":
                return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
            case "STOCK_OUT":
                return <ArrowUpRight className="h-4 w-4 text-rose-500" />;
            case "ADJUSTMENT":
                return <ArrowRightLeft className="h-4 w-4 text-amber-500" />;
            default:
                return <Package className="h-4 w-4 text-slate-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "STOCK_IN":
                return "GİRİŞ";
            case "STOCK_OUT":
                return "ÇIKIŞ";
            case "ADJUSTMENT":
                return "DÜZELTME";
            default:
                return "DİĞER";
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-12 space-y-12 pb-40">
            {/* High-Fidelity Stats Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-500/10 rounded-[1.5rem] border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                            <Activity className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">Stok Radar</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1 font-black text-[9px] uppercase tracking-[2px]">İSTATİSTİKSEL ANALİZ</Badge>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest opacity-60">Gerçek Zamanlı Takip</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col items-end gap-1 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 group cursor-default hover:bg-white/10 transition-all">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[2px]">TOPLAM KAYIT</span>
                        <span className="text-xl font-black text-white tabular-nums tracking-tighter">{stats.totalMovements} <span className="text-xs text-slate-600 ml-1">Kayıt</span></span>
                    </div>

                    <Button
                        onClick={() => setIsCriticalDialogOpen(true)}
                        className={cn(
                            "h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-3 transition-all active:scale-95 shadow-2xl",
                            stats.criticalCount > 0
                                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20 animate-pulse"
                                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        )}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        KRİTİK STOK ({stats.criticalCount})
                    </Button>
                </div>
            </div>

            {/* Quick Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "HAFTALIK HAREKET", value: stats.totalMovements > 0 ? "STABİL" : "PASİF", icon: RefreshCcw, color: "blue", trend: "+12%" },
                    { label: "GİRİŞ HACMİ", value: "₺24,500", icon: TrendingUp, color: "emerald", trend: "+5.2%" },
                    { label: "KRİTİK ÜRÜN", value: stats.criticalCount.toString(), icon: AlertTriangle, color: "rose", trend: "%32 Azalma" }
                ].map((stat, i) => (
                    <Card key={i} className="border-none bg-white/[0.03] backdrop-blur-3xl shadow-2xl overflow-hidden rounded-[2.5rem] border border-white/5 group hover:bg-white/[0.05] transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 px-8 pt-8">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">{stat.label}</span>
                            <div className={cn("p-3 rounded-2xl bg-white/5", stat.color === 'rose' && stats.criticalCount > 0 ? "animate-bounce" : "")}>
                                <stat.icon className={cn("w-4 h-4", `text-${stat.color}-500`)} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 pt-2">
                            <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
                            <div className={cn("flex items-center gap-1 mt-3 font-black text-[9px] uppercase tracking-widest", `text-${stat.color}-500/60`)}>
                                <span>{stat.trend} BEKLENEN</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Futuristic Table Container */}
            <Card className="border-none bg-transparent shadow-none relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 px-2">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Hareket Akışı</h2>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] opacity-80">Envanter Değişim Logları</span>
                    </div>

                    <div className="relative group w-full md:w-96">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors z-20" />
                        <Input
                            placeholder="Ürün adı veya işlem kodu ara..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-16 h-14 bg-white/[0.03] border-white/10 shadow-2xl rounded-2xl focus-visible:ring-blue-500/20 focus-visible:bg-white/[0.06] transition-all font-bold text-sm text-white relative z-10"
                        />
                        {isPending && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                                <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className={cn(
                        "bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden transition-all duration-500",
                        isPending ? "opacity-30 blur-md grayscale scale-[0.99]" : "opacity-100"
                    )}>
                        <Table>
                            <TableHeader className="bg-white/[0.03] border-b border-white/5">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="py-8 px-10 font-black text-[10px] uppercase tracking-[3px] text-slate-500">Ürün & Bilgi</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[3px] text-slate-500">Tarih / Zaman</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[3px] text-slate-500">İşlem Türü</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[3px] text-slate-500">Miktar</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[3px] text-slate-500 px-10 text-right">Detaylar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="wait">
                                    {movements.length === 0 ? (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <TableCell colSpan={5} className="py-40 text-center">
                                                <div className="flex flex-col items-center gap-6 grayscale opacity-30">
                                                    <Package className="w-16 h-16 text-slate-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-[4px]">Eşleşen Hareket Bulunamadı</span>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ) : (
                                        movements.map((m, idx) => (
                                            <motion.tr
                                                key={m.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="group/row hover:bg-white/[0.03] border-b border-white/[0.02] transition-colors"
                                            >
                                                <TableCell className="py-7 px-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover/row:scale-110 transition-transform shadow-2xl relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/row:opacity-100 transition-all" />
                                                            <Package className="w-6 h-6 text-slate-400 group-hover/row:text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="font-black text-[15px] text-white capitalize group-hover/row:text-blue-400 transition-colors">
                                                                {m.product.name}
                                                            </span>
                                                            <Badge variant="outline" className="w-fit text-[9px] font-black px-2 py-0.5 bg-white/5 border-white/5 text-slate-500 group-hover/row:border-white/10 group-hover/row:text-slate-300">
                                                                #{m.id.substring(0, 8).toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 font-mono font-black text-xs text-slate-400 tabular-nums">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{format(new Date(m.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                                                        <span className="opacity-40 text-[10px]">{format(new Date(m.createdAt), "HH:mm")}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover/row:rotate-12",
                                                            m.type === "STOCK_IN" ? "bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5" :
                                                                m.type === "STOCK_OUT" ? "bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/5" :
                                                                    "bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5"
                                                        )}>
                                                            {getTypeIcon(m.type)}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {getTypeLabel(m.type)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-6">
                                                    <div className={cn(
                                                        "inline-flex items-center justify-center h-11 w-16 rounded-[1.25rem] font-black text-[16px] tracking-tighter shadow-xl transition-all",
                                                        m.quantity > 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" : "bg-rose-500/10 text-rose-500 border border-rose-500/10"
                                                    )}>
                                                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-10 py-6 text-right">
                                                    <div className="flex flex-col items-end gap-3">
                                                        <span className="text-[11px] font-bold text-slate-400 line-clamp-1 italic max-w-xs group-hover/row:text-slate-200 transition-all">
                                                            {m.notes || "Sistem tarafından otomatik oluşturuldu."}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            {m.sale && (
                                                                <Badge className="bg-blue-600/20 text-blue-500 border border-blue-600/20 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-tighter">
                                                                    BELGE: SL-{m.sale.saleNumber}
                                                                </Badge>
                                                            )}
                                                            {m.serviceTicket && (
                                                                <Badge className="bg-indigo-600/20 text-indigo-500 border border-indigo-600/20 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-tighter">
                                                                    FİŞ: SRV-{m.serviceTicket.ticketNumber}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Fancy Pagination Footer */}
                <div className="p-10 border-t border-white/5 mt-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-20 bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Sayfa Başı Kayıt</span>
                            <span className="text-white font-black text-sm">{movements.length} <span className="text-slate-700 mx-1">/</span> {stats.totalMovements}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/5 hidden md:block" />
                        <div className="flex flex-col gap-1 hidden md:flex">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Toplam Sayfa</span>
                            <span className="text-white font-black text-sm">{pagination.totalPages} Seviye</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1 || isPending}
                            className="bg-white/5 hover:bg-white/10 border-white/5 text-white/50 hover:text-white h-12 px-6 rounded-2xl shadow-none transition-all flex items-center gap-2 group/btn"
                        >
                            <ChevronLeft className="h-4 w-4 group-hover/btn:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest pr-1">Önceki</span>
                        </Button>

                        <div className="flex items-center px-6 h-12 rounded-2xl bg-white/5 border border-white/5 text-white/40 tracking-widest text-[11px] font-black">
                            <span className="text-white">{pagination.page}</span>
                            <span className="mx-2 opacity-30">/</span>
                            <span>{pagination.totalPages}</span>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || isPending}
                            className="bg-white/5 hover:bg-white/10 border-white/5 text-white/50 hover:text-white h-12 px-6 rounded-2xl shadow-none transition-all flex items-center gap-2 group/btn"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest pl-1">Sonraki</span>
                            <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>

                {/* Bottom Aura Effect */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm" />
            </Card>

            <CriticalStockDialog
                open={isCriticalDialogOpen}
                onOpenChange={setIsCriticalDialogOpen}
                products={criticalProducts}
            />
        </div>
    );
}
