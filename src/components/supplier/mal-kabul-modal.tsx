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
    const [buyPrices, setBuyPrices] = useState<Record<string, number>>({});
    const [currencies, setCurrencies] = useState<Record<string, "TRY" | "USD">>({});
    const [loading, setLoading] = useState(false);
    const [usdRate, setUsdRate] = useState<number>(33.0);

    useEffect(() => {
        fetch("https://api.exchangerate-api.com/v4/latest/USD")
            .then(res => res.json())
            .then(data => setUsdRate(data.rates.TRY))
            .catch(() => setUsdRate(33.0));
    }, []);

    useEffect(() => {
        if (order?.items) {
            const initialQtys: Record<string, number> = {};
            const initialPrices: Record<string, number> = {};
            const initialCurrencies: Record<string, "TRY" | "USD"> = {};

            order.items.forEach((item: any) => {
                initialQtys[item.id] = item.quantity;
                const usdPrice = item.product?.buyPriceUsd || item.buyPriceUsd;
                if (usdPrice && Number(usdPrice) > 0) {
                    initialPrices[item.id] = Number(usdPrice);
                    initialCurrencies[item.id] = "USD";
                } else {
                    initialPrices[item.id] = Number(item.buyPrice) || Number(item.product?.buyPrice) || 0;
                    initialCurrencies[item.id] = "TRY";
                }
            });
            setReceivedQtys(initialQtys);
            setBuyPrices(initialPrices);
            setCurrencies(initialCurrencies);
        }
    }, [order]);

    const handleQtyChange = (itemId: string, val: string) => {
        const num = parseInt(val) || 0;
        setReceivedQtys(prev => ({ ...prev, [itemId]: num }));
    };

    const handlePriceChange = (itemId: string, val: string) => {
        const num = parseFloat(val) || 0;
        setBuyPrices(prev => ({ ...prev, [itemId]: num }));
    };

    const handleComplete = async () => {
        setLoading(true);
        const updates = order.items.map((item: any) => {
            const receivedQuantity = receivedQtys[item.id] || 0;
            const priceInput = buyPrices[item.id];
            const hasNewPrice = priceInput !== undefined && !isNaN(priceInput) && priceInput > 0;
            const isUsd = currencies[item.id] === 'USD';

            const finalPriceTry = !hasNewPrice
                ? Number(item.buyPrice || item.product?.buyPrice || 0)
                : (isUsd ? (priceInput * usdRate) : priceInput);

            return {
                itemId: item.id,
                receivedQuantity,
                buyPrice: finalPriceTry,
                buyPriceUsd: (hasNewPrice && isUsd) ? priceInput : null
            };
        });

        const res = await receivePurchaseOrderAction(order.id, updates);
        if (res.success) {
            toast.success("Mal kabul başarıyla tamamlandı. Stoklar güncellendi.");

            const hasMissingStatus = updates.some((u: any) => {
                const originalItem = order.items.find((i: any) => i.id === u.itemId);
                return originalItem && u.receivedQuantity < originalItem.quantity;
            });

            if (hasMissingStatus) {
                setTimeout(() => {
                    toast.warning("Eksik ürünler tespit edildi ve otomatik olarak 'Eksik Listesi'ne aktarıldı.", {
                        style: { backgroundColor: '#f59e0b', color: '#fff', border: 'none' },
                        duration: 5000
                    });
                }, 1000);
            }

            onClose();
        } else {
            toast.error(res.error || "Bir hata oluştu.");
        }
        setLoading(false);
    };

    const currentTotal = (order?.items || []).reduce((acc: number, item: any) => {
        const qty = receivedQtys[item.id] || 0;
        const priceInput = buyPrices[item.id];
        const isUsd = currencies[item.id] === 'USD';
        const hasNewPrice = priceInput !== undefined && !isNaN(priceInput) && priceInput > 0;

        const finalPriceTry = hasNewPrice
            ? (isUsd ? (priceInput * usdRate) : priceInput)
            : Number(item.buyPrice || item.product?.buyPrice || 0);

        return acc + (qty * finalPriceTry);
    }, 0);

    if (!order) return null;

    const mismatches = (order.items || []).filter((item: any) => receivedQtys[item.id] !== item.quantity).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border p-0 overflow-hidden rounded-3xl">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <ClipboardCheck className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="font-medium text-2xl  tracking-tight">Mal Kabul Girişi</DialogTitle>
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
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest">Tedarikçi</p>
                                <p className="text-sm  truncate text-foreground">{order.supplier?.name || "Bilinmeyen Tedarikçi"}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-none p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Wallet className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest">Güncel Değer</p>
                                <p className="text-sm  truncate">₺{currentTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-none p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Truck className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest">Sevkiyat Detayları</p>
                                <p className="text-sm  truncate">{order.shippingInfo || "BELİRTİLMEMİŞ"}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Verification Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm  text-foreground uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                Ürün Doğrulama Listesi
                            </h3>
                            {mismatches > 0 && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]  uppercase rounded-lg">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {mismatches} Uyuşmazlık Mevcut
                                </Badge>
                            )}
                        </div>

                        <Card className="bg-white/[0.02] border-border/50 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-border/50">
                                    <tr>
                                        <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase">Ürün Adı</th>
                                        <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase text-center w-28">Stok Durumu</th>
                                        <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase text-center">Sipariş</th>
                                        <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase text-center w-28">Gelen</th>
                                        <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase text-center w-32">Alış Fiyatı ($)</th>
                                        <th className="px-4 py-4 text-[10px]  text-muted-foreground uppercase text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {order.items?.map((item: any) => {
                                        const received = receivedQtys[item.id] || 0;
                                        const status = received === item.quantity ? "MATCH" : received < item.quantity ? "MISSING" : "EXCESS";

                                        return (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-4 py-4 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm  text-foreground">{item.name}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">ID: {item.productId || "Manuel Giriş"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-sm  text-muted-foreground">{item.product?.stock || 0}</span>
                                                        <span className="text-slate-600">→</span>
                                                        <span className="text-sm  text-emerald-400">{(item.product?.stock || 0) + received}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-sm  text-foreground">{item.quantity} Adet</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Input
                                                        type="number"
                                                        value={received}
                                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                        className="h-10 rounded-xl bg-white/5 border-border text-center  text-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 w-32 align-top">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 flex items-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCurrencies(prev => ({ ...prev, [item.id]: prev[item.id] === 'USD' ? 'TRY' : 'USD' }))}
                                                                className="h-full px-2 text-xs  text-blue-400 bg-blue-500/10 border-r border-border rounded-l-xl hover:bg-blue-500/20 transition-colors"
                                                            >
                                                                {currencies[item.id] === 'USD' ? '$' : '₺'}
                                                            </button>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={buyPrices[item.id] !== undefined ? buyPrices[item.id] : ""}
                                                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                            className="w-full h-10 bg-white/5 border-border text-xs  rounded-xl pl-8 text-right pr-2"
                                                        />
                                                    </div>
                                                    {currencies[item.id] === 'USD' && buyPrices[item.id] > 0 && (
                                                        <div className="text-[10px]  text-muted-foreground mt-1 text-right">
                                                            ≈ {((buyPrices[item.id] || 0) * usdRate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
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

                <div className="p-8 border-t border-border/50 bg-white/[0.01] flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px]  text-muted-foreground uppercase tracking-widest">Genel Toplam</p>
                        <p className="text-3xl  text-blue-500 tracking-tighter">₺{currentTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={onClose} variant="ghost" className="h-12 px-6 rounded-2xl  text-xs">İptal</Button>
                        <Button
                            onClick={() => {
                                if (window.confirm("Mal kabul işlemini tamamlamak ve stokları güncellemek istediğinize emin misiniz?")) {
                                    handleComplete();
                                }
                            }}
                            disabled={loading}
                            className="h-12 px-8 rounded-2xl  text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 uppercase tracking-widest gap-2"
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
    return <div className={cn("bg-card border border-border/50", className)}>{children}</div>;
}





