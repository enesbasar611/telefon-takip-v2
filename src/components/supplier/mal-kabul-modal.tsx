"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    Package,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Truck,
    Calendar,
    User,
    Info,
    Wallet
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { receivePurchaseOrderAction } from "@/lib/actions/purchase-actions";

interface MalKabulModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
}

export function MalKabulModal({ isOpen, onClose, order }: MalKabulModalProps) {
    const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (order?.items) {
            const initial: Record<string, number> = {};
            order.items.forEach((item: any) => {
                initial[item.id] = item.quantity; // Default to full quantity
            });
            setReceivedQtys(initial);
        }
    }, [order]);

    const handleQtyChange = (itemId: string, val: string) => {
        const num = parseInt(val) || 0;
        setReceivedQtys(prev => ({ ...prev, [itemId]: num }));
    };

    const handleComplete = async () => {
        setLoading(true);
        const updates = Object.entries(receivedQtys).map(([itemId, receivedQuantity]) => ({
            itemId,
            receivedQuantity
        }));

        const res = await receivePurchaseOrderAction(order.id, updates);
        if (res.success) {
            toast.success("Mal kabul başarıyla tamamlandı. Stoklar güncellendi.");
            onClose();
        } else {
            toast.error(res.error || "Bir hata oluştu.");
        }
        setLoading(false);
    };

    if (!order) return null;

    const mismatches = order.items.filter((item: any) => receivedQtys[item.id] !== item.quantity).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-white/10 p-0 overflow-hidden rounded-3xl">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <ClipboardCheck className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Mal Kabul Girişi</DialogTitle>
                                <DialogDescription className="text-xs font-medium text-muted-foreground pt-0.5"> Gelen sevkiyatları doğrulayın ve stok bakiyelerini güncelleyin. </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Top Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white/5 border-none p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tedarikçi</p>
                                <p className="text-sm font-black truncate">{order.supplier?.name}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-none p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Wallet className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sipariş Değeri</p>
                                <p className="text-sm font-black truncate">₺{Number(order.totalAmount).toLocaleString("tr-TR")}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-none p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Truck className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sevkiyat Detayları</p>
                                <p className="text-sm font-black truncate">{order.shippingInfo || "BELİRTİLMEMİŞ"}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Verification Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                Ürün Doğrulama Listesi
                            </h3>
                            {mismatches > 0 && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-black uppercase rounded-lg">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {mismatches} Uyuşmazlık Mevcut
                                </Badge>
                            )}
                        </div>

                        <Card className="bg-white/[0.02] border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase">Ürün Adı</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-center">Sipariş Adedi</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-center w-32">Gelen Adet</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {order.items?.map((item: any) => {
                                        const received = receivedQtys[item.id] || 0;
                                        const status = received === item.quantity ? "MATCH" : received < item.quantity ? "MISSING" : "EXCESS";

                                        return (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{item.name}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[200px]">ID: {item.productId || "Manuel Giriş"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-black text-foreground">{item.quantity} Adet</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Input
                                                        type="number"
                                                        value={received}
                                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                        className="h-10 rounded-xl bg-white/5 border-white/10 text-center font-black text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end">
                                                        {status === "MATCH" ? (
                                                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                            </div>
                                                        ) : status === "MISSING" ? (
                                                            <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                                                                <XCircle className="h-4 w-4 text-rose-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    <div className="bg-blue-600/5 border border-blue-600/10 rounded-2xl p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-400 shrink-0" />
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            "Kontrol Et ve Stoğa Aktar" butonuna bastığınızda, gelen adetler envantere eklenecek varsa ve uyuşmazlıklar tedarikçi ekstresine "Eksik Ürün" olarak yansıtılacaktır.
                        </p>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Genel Toplam</p>
                        <p className="text-3xl font-black text-blue-500 tracking-tighter">₺{Number(order.totalAmount).toLocaleString("tr-TR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={onClose} variant="ghost" className="h-12 px-6 rounded-2xl font-bold text-xs">İptal</Button>
                        <Button
                            onClick={handleComplete}
                            disabled={loading}
                            className="h-12 px-8 rounded-2xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 uppercase tracking-widest gap-2"
                        >
                            {loading ? "İşleniyor..." : (
                                <>
                                    <Package className="h-4 w-4" />
                                    Kontrol Et ve Stoğa Aktar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn("bg-card border border-white/5", className)}>{children}</div>;
}
