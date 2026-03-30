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
    Calendar,
    ChevronRight,
    User,
    Package,
    Banknote,
    CreditCard,
    Landmark,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface SalesHistoryClientProps {
    initialSales: any[];
}

export function SalesHistoryClient({ initialSales }: SalesHistoryClientProps) {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get("highlight");
    const [searchTerm, setSearchTerm] = useState("");
    const [sales, setSales] = useState(initialSales);

    const filteredSales = useMemo(() => {
        return sales.filter(sale =>
            sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.items.some((item: any) => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [sales, searchTerm]);

    useEffect(() => {
        if (highlightId) {
            const element = document.getElementById(`sale-${highlightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightId]);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground font-manrope">Satış Arşivi</h1>
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5">Tüm satış kayıtları ve detaylı geçmiş</p>
                    </div>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/40 dark:shadow-black/60 overflow-hidden bg-card/50 backdrop-blur-xl">
                <CardHeader className="p-8 border-b border-border/40 bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Satış no, müşteri veya ürün ara..."
                                className="pl-12 h-12 rounded-2xl bg-background border-border/40 text-xs font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl h-12 px-6 border-border/40 font-bold text-[11px] uppercase tracking-widest gap-2">
                                <Filter className="h-4 w-4" /> FİLTRELE
                            </Button>
                            <Button variant="outline" className="rounded-xl h-12 px-6 border-border/40 font-bold text-[11px] uppercase tracking-widest gap-2">
                                <Calendar className="h-4 w-4" /> BUGÜN
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    <th className="px-8 py-5 text-left">SATIŞ NO</th>
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
                                            "group transition-all hover:bg-muted/30",
                                            highlightId === sale.id && "highlight-blink"
                                        )}
                                    >
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-foreground tracking-tight">{sale.saleNumber}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground">{sale.customer?.name || "Hızlı Satış"}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground opacity-60">{sale.customer?.phone || "-"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                {sale.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                                        <Package className="h-3 w-3 opacity-40" />
                                                        <span className="truncate">{item.product.name}</span>
                                                        <span className="text-primary font-black">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className="rounded-lg h-7 px-3 bg-muted/30 border-border/40 text-[9px] font-black uppercase tracking-widest gap-1.5">
                                                {getPaymentIcon(sale.paymentMethod)}
                                                {getPaymentLabel(sale.paymentMethod)}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-emerald-500 tracking-tight">₺{Number(sale.finalAmount).toLocaleString('tr-TR')}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-[11px] font-bold text-muted-foreground">
                                                {format(new Date(sale.createdAt), "dd MMM yyyy", { locale: tr })}
                                                <br />
                                                <span className="opacity-50">{format(new Date(sale.createdAt), "HH:mm")}</span>
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
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
