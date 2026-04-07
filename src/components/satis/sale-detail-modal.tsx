"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    User,
    Calendar,
    CreditCard,
    Banknote,
    Landmark,
    CheckCircle2,
    Activity,
    Receipt,
    ArrowRight,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SaleDetailModalProps {
    sale: any | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SaleDetailModal({ sale, isOpen, onClose }: SaleDetailModalProps) {
    if (!sale) return null;

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case "CASH": return <Banknote className="h-4 w-4" />;
            case "CARD": return <CreditCard className="h-4 w-4" />;
            case "TRANSFER": return <Landmark className="h-4 w-4" />;
            default: return <Receipt className="h-4 w-4" />;
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[2.5rem] bg-card shadow-2xl">
                <DialogHeader className="p-10 bg-primary/5 border-b border-border/40 relative">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Receipt className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="font-medium text-2xl  tracking-tight">{sale.saleNumber}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="rounded-full px-3 py-0.5 border-primary/20 text-[10px]  uppercase text-primary tracking-widest">
                                    TAMAMLANDI
                                </Badge>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[11px]  text-muted-foreground opacity-60 uppercase">SATIŞ KAYDI</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <CheckCircle2 className="h-32 w-32 text-primary" />
                    </div>
                </DialogHeader>

                <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-5 rounded-3xl border border-border/20">
                            <div className="flex items-center gap-2 mb-2 opacity-50">
                                <User className="h-3.5 w-3.5" />
                                <span className="text-[10px]  uppercase tracking-widest">MÜŞTERİ</span>
                            </div>
                            <p className="text-sm ">{sale.customer?.name || "Hızlı Satış"}</p>
                            <p className="text-[11px]  text-muted-foreground opacity-70 mt-0.5">{sale.customer?.phone || "-"}</p>
                        </div>
                        <div className="bg-muted/30 p-5 rounded-3xl border border-border/20">
                            <div className="flex items-center gap-2 mb-2 opacity-50">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="text-[10px]  uppercase tracking-widest">TARİH & SAAT</span>
                            </div>
                            <p className="text-sm ">{format(new Date(sale.createdAt), "dd MMMM yyyy", { locale: tr })}</p>
                            <p className="text-[11px]  text-muted-foreground opacity-70 mt-0.5">{format(new Date(sale.createdAt), "HH:mm")}</p>
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-medium text-[11px]  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-3.5 w-3.5" /> SATILAN ÜRÜNLER
                            </h3>
                            <Badge variant="secondary" className="rounded-lg text-[9px] ">{sale.items.length} KALEM</Badge>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {sale.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/40 hover:border-primary/20 transition-all hover:bg-muted/5 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/20 group-hover:bg-primary/5 transition-all">
                                            <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all" />
                                        </div>
                                        <div>
                                            <p className="text-xs  tracking-tight">{item.product.name}</p>
                                            <p className="text-[10px]  text-muted-foreground opacity-60">
                                                ₺{Number(item.unitPrice).toLocaleString('tr-TR')} x {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs  text-foreground tracking-tight">₺{Number(item.totalPrice).toLocaleString('tr-TR')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial & Inventory Movements */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-medium text-[11px]  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5" /> FİNANSAL & STOK HAREKETLERİ
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {/* Financial Record */}
                            {sale.transaction && (
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px]  text-emerald-700 uppercase tracking-widest">KASA GİRİŞİ (SATIŞ)</span>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-sm  text-emerald-600">₺{Number(sale.transaction.amount).toLocaleString('tr-TR')}</p>
                                            <span className="text-[10px]  text-muted-foreground opacity-60 line-clamp-1">{sale.transaction.description}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Inventory Movements */}
                            {sale.inventoryMovements?.map((move: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-sm shadow-orange-500/10">
                                        <TrendingDown className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[10px]  text-orange-700 uppercase tracking-widest">STOK ÇIKIŞI</span>
                                        <p className="text-sm  text-orange-600">-{move.quantity} Adet</p>
                                        <span className="text-[10px]  text-muted-foreground opacity-60 truncate">{move.product?.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals & Payment */}
                    <div className="bg-background text-white rounded-[2.25rem] p-8 space-y-6 relative overflow-hidden shadow-2xl shadow-slate-950/20">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none opacity-50" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none opacity-50" />

                        <div className="flex justify-between items-center pb-6 border-b border-border/50 relative z-10">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px]  text-white/30 uppercase tracking-widest">ÖDEME YÖNTEMİ</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center border border-border">
                                        {getPaymentIcon(sale.paymentMethod)}
                                    </div>
                                    <span className="text-[13px]  uppercase tracking-tight">{getPaymentLabel(sale.paymentMethod)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px]  text-white/30 uppercase tracking-widest block mb-1.5">ARA TOPLAM</span>
                                <span className="text-sm  text-white/60 tracking-tight">₺{Number(sale.totalAmount).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                {Number(sale.discount) > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px]  text-emerald-400/60 uppercase tracking-widest">İNDİRİM</span>
                                        <span className="text-lg  text-emerald-400">-₺{Number(sale.discount).toLocaleString('tr-TR')}</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-[11px]  text-white/40 uppercase tracking-[0.2em] block mb-2">TOPLAM TUTAR</span>
                                <p className="text-5xl  tracking-tighter text-emerald-400">₺{Number(sale.finalAmount).toLocaleString('tr-TR')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}





