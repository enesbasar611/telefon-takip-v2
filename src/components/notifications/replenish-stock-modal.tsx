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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { dismissNotificationAction } from "@/lib/actions/notification-actions";
import { toast } from "sonner";
import { Loader2, AlertCircle, ShoppingCart, Truck } from "lucide-react";

interface ReplenishStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    notificationId: string;
}

export function ReplenishStockModal({
    isOpen,
    onClose,
    productId,
    productName,
    notificationId
}: ReplenishStockModalProps) {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>("NONE");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSuppliers();
        }
    }, [isOpen]);

    const loadSuppliers = async () => {
        setIsLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            toast.error("Tedarikçiler yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (selectedSupplier === "NONE") {
                // Add to shortage list
                const res = await addShortageItem({
                    productId,
                    name: productName,
                    quantity: 1,
                    notes: "Bildirim üzerinden eklendi."
                });
                if (res.success) {
                    if (res.isDuplicate) {
                        toast.warning(res.message);
                    } else {
                        toast.success("Ürün eksikler listesine eklendi.");
                    }
                } else {
                    throw new Error(res.error || "Hata oluştu");
                }
            } else {
                // If supplier selected, for now we still add to shortage but tag the supplier
                const res = await addShortageItem({
                    productId,
                    name: productName,
                    quantity: 1,
                    notes: `Sipariş: ${suppliers.find(s => s.id === selectedSupplier)?.name} üzerinden tedarik edilecek.`
                });
                if (res.success) {
                    if (res.isDuplicate) {
                        toast.warning(res.message);
                    } else {
                        toast.success("Sipariş planı oluşturuldu.");
                    }
                } else {
                    throw new Error(res.error || "Hata oluştu");
                }
            }

            // Dismiss notification
            await dismissNotificationAction(notificationId);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "İşlem başarısız.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] bg-slate-900 border-white/5 text-white p-0 overflow-hidden rounded-[2rem]">
                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                            <ShoppingCart className="h-7 w-7 text-blue-500" />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Sipariş Oluştur</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium pt-2">
                            <span className="text-white font-bold">{productName}</span> ürünü için tedarik süreci başlatın.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                                TEDARİKÇİ SEÇİMİ
                            </label>
                            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl font-bold text-sm focus:ring-blue-500 transition-all">
                                    <SelectValue placeholder="Tedarikçi Seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/5 text-white rounded-xl">
                                    <SelectItem value="NONE" className="font-bold py-3">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-orange-400" />
                                            Tedarikçi Yok (Eksik Listesine Ekle)
                                        </div>
                                    </SelectItem>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="font-bold py-3">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-blue-400" />
                                                {s.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl font-bold text-xs hover:bg-white/5 border border-white/5"
                        >
                            İPTAL
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isLoading}
                            className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-xl shadow-blue-600/20 gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "SİPARİŞİ ONAYLA"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
