"use client";

import { useState } from "react";
import {
    BarChart3,
    RefreshCcw,
    AlertTriangle,
    Search,
    History,
    TrendingDown,
    TrendingUp,
    Package,
    Activity
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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CriticalStockDialog } from "./critical-stock-dialog";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";

interface StockMovementsClientProps {
    movements: any[];
    criticalProducts: any[];
    stats: {
        totalMovements: number;
        criticalCount: number;
    };
}

export function StockMovementsClient({
    movements,
    criticalProducts,
    stats,
}: StockMovementsClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCriticalDialogOpen, setIsCriticalDialogOpen] = useState(false);

    const filteredMovements = movements.filter((m) =>
        (m.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(filteredMovements, "createdAt", "desc");

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "SALE":
                return <TrendingDown className="h-4 w-4 text-rose-500" />;
            case "PURCHASE":
                return <TrendingUp className="h-4 w-4 text-emerald-500" />;
            case "ADJUSTMENT":
                return <RefreshCcw className="h-4 w-4 text-amber-500" />;
            default:
                return <Activity className="h-4 w-4 text-blue-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "SALE": return "Satış";
            case "PURCHASE": return "Alım / Giriş";
            case "ADJUSTMENT": return "Düzenleme";
            case "SERVICE": return "Servis Kullanımı";
            case "RETURN": return "İade";
            default: return type;
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Cards Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-[3rem] border-white/5 bg-white/[0.02] shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
                    <CardContent className="p-10 flex items-center justify-between">
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">SİSTEM HAREKETLERİ</p>
                            <div className="text-6xl font-black text-white tracking-tighter leading-none">
                                {stats.totalMovements}
                            </div>
                            <p className="text-[10px] text-blue-400 font-bold bg-blue-400/10 px-4 py-1.5 rounded-full w-fit border border-blue-400/20">Son 100 Kayıt İnceleniyor</p>
                        </div>
                        <div className="h-24 w-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.2)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <History className="h-10 w-10 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="rounded-[3rem] border-rose-500/10 bg-rose-500/[0.03] shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden group hover:border-rose-500/30 transition-all duration-500 cursor-pointer relative"
                    onClick={() => setIsCriticalDialogOpen(true)}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-10 flex items-center justify-between relative z-10">
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-rose-500/60 uppercase tracking-[0.2em]">Kritik Stok Uyarıları</p>
                            <div className="text-6xl font-black text-rose-500 tracking-tighter leading-none shadow-rose-500/20 drop-shadow-2xl">
                                {stats.criticalCount}
                            </div>
                            <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-4 py-1.5 rounded-full w-fit border border-rose-500/20 animate-pulse uppercase tracking-wider">Müdahale Bekliyor</p>
                        </div>
                        <div className="h-24 w-24 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_60px_rgba(244,63,94,0.4)] group-hover:-rotate-12 group-hover:scale-110 transition-all duration-500">
                            <AlertTriangle className="h-10 w-10 text-rose-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Table */}
            <Card className="rounded-[4rem] border-white/5 bg-white/[0.01] shadow-2xl overflow-hidden flex flex-col min-h-[600px] border border-white/5 group/main">
                <CardHeader className="p-12 pb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-[-10%] h-80 w-80 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-[1.25rem] bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                            </div>
                            <Badge className="bg-blue-600/10 text-blue-500 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">Envanter Analizi</Badge>
                        </div>
                        <CardTitle className="text-4xl font-black text-white tracking-tight">Stok Hareketleri</CardTitle>
                        <p className="text-sm font-medium text-slate-500 mt-3 max-w-md leading-relaxed">Dükkandaki tüm ürün giriş ve çıkışları, ayarlamalar ve satışlar gerçek zamanlı olarak listelenir.</p>
                    </div>

                    <div className="relative w-full max-w-sm group/search">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-500" />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/search:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Ürün, işlem veya not ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-14 bg-white/[0.03] border-white/10 rounded-2xl h-14 text-sm focus-visible:ring-blue-500/30 focus-visible:bg-white/[0.05] transition-all relative z-10"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0 relative z-10">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="px-12 py-8 h-[90px]">
                                    <SortableHeader label="Zamanlama" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="px-6 py-8 h-[90px]">
                                    <SortableHeader label="Ürün & Referans" field="product.name" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="px-6 py-8 h-[90px]">
                                    <SortableHeader label="İşlem Tipi" field="type" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="px-6 py-8 h-[90px]">
                                    <SortableHeader label="Miktar" field="quantity" sortField={sortField} sortOrder={sortOrder} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="px-12 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] text-right">Açıklama</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-80 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-20">
                                            <Package className="h-20 w-20" />
                                            <p className="text-lg font-black tracking-widest uppercase">Hareket Kaydı Bulunamadı</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((m) => (
                                    <TableRow key={m.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all duration-300 group/row">
                                        <TableCell className="px-12 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-200 group-hover/row:text-white transition-colors">
                                                    {format(new Date(m.createdAt), "dd MMM yyyy", { locale: tr })}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-black mt-1.5 uppercase tracking-wider">
                                                    {format(new Date(m.createdAt), "HH:mm:ss")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-8">
                                            <div className="flex flex-col max-w-[200px]">
                                                <span className="text-sm font-extrabold text-white group-hover/row:text-blue-400 transition-colors truncate">
                                                    {m.product?.name || "Silinmiş Ürün"}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-bold mt-1.5 tracking-tighter uppercase opacity-60 group-hover/row:opacity-100 transition-all leading-none">
                                                    {m.product?.sku || "SKU TANIMSIZ"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 transition-transform group-hover/row:scale-110">
                                                    {getTypeIcon(m.type)}
                                                </div>
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    {getTypeLabel(m.type)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-8">
                                            <div className={cn("inline-flex items-center justify-center h-10 w-14 rounded-2xl font-black text-lg tracking-tighter shadow-sm",
                                                m.quantity > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            )}>
                                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-12 py-8 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-xs font-semibold text-slate-300 line-clamp-1 italic opacity-80 group-hover/row:opacity-100 transition-all">
                                                    {m.notes || "İşlem notu bulunmuyor"}
                                                </span>
                                                <div className="flex gap-2">
                                                    {m.sale && (
                                                        <Badge className="bg-blue-600/10 text-blue-500 border border-blue-600/20 font-black text-[9px] px-2 py-0.5 rounded-lg shadow-lg shadow-blue-600/5">
                                                            SAT- {m.sale.saleNumber}
                                                        </Badge>
                                                    )}
                                                    {m.serviceTicket && (
                                                        <Badge className="bg-purple-600/10 text-purple-500 border border-purple-600/20 font-black text-[9px] px-2 py-0.5 rounded-lg shadow-lg shadow-purple-600/5">
                                                            SRV- {m.serviceTicket.ticketNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                <div className="p-8 border-t border-white/5 mt-auto flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.01]">
                    <span>TOPLAM {filteredMovements.length} HAREKET</span>
                    <span className="text-slate-600 uppercase">Tüm zamanlar verisi yükleniyor...</span>
                </div>
            </Card>

            <CriticalStockDialog
                open={isCriticalDialogOpen}
                onOpenChange={setIsCriticalDialogOpen}
                products={criticalProducts}
            />
        </div>
    );
}

// Utility to merge class names
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
