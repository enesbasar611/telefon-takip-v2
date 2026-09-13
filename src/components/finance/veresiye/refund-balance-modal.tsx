"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { refundCustomerBalance } from "@/lib/actions/debt-actions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface RefundBalanceModalProps {
    open: boolean;
    onClose: () => void;
    customer: any | null;
}

export function RefundBalanceModal({ open, onClose, customer }: RefundBalanceModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [currency, setCurrency] = useState<"TRY" | "USD">("TRY");
    const [loading, setLoading] = useState(false);

    // Bakiye kontrolü
    const maxTRY = customer?.balance || 0;
    const maxUSD = customer?.balanceUsd || 0;

    // Sadece bir para biriminde bakiye varsa, onu varsayılan yap
    if (open && currency === "TRY" && maxTRY <= 0 && maxUSD > 0) {
        setCurrency("USD");
    }

    const handleRefund = async () => {
        if (!customer) return;
        const val = Number(amount);
        if (isNaN(val) || val <= 0) {
            toast.error("Geçerli bir tutar giriniz.");
            return;
        }

        const maxAvailable = currency === "USD" ? maxUSD : maxTRY;
        if (val > maxAvailable) {
            toast.error(`En fazla ${currency === 'USD' ? '$' : '₺'}${formatCurrency(maxAvailable)} iade edilebilir.`);
            return;
        }

        setLoading(true);
        const result = await refundCustomerBalance({
            customerId: customer.customerId || customer.id,
            amount: val,
            currency,
            notes: "Müşteri Emanet (Bakiye) İadesi"
        });

        setLoading(false);
        if (result?.success) {
            toast.success("Emanet iadesi başarıyla yapıldı.");
            setAmount("");
            onClose();
        } else {
            toast.error(result?.error || "İade işlemi başarısız oldu.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Emanet İadesi</DialogTitle>
                    <DialogDescription>
                        Müşterinin içeride kalan bakiyesini (emanet) kasadan nakit olarak iade ediyorsunuz.
                    </DialogDescription>
                </DialogHeader>

                {customer && (
                    <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                            <div className={`flex-1 p-3 rounded-lg border ${currency === 'TRY' ? 'border-primary bg-primary/5' : 'opacity-60 cursor-pointer'}`}
                                onClick={() => maxTRY > 0 && setCurrency("TRY")}>
                                <div className="text-xs font-bold text-muted-foreground mb-1">TL BAKİYE</div>
                                <div className="font-black">₺{formatCurrency(maxTRY)}</div>
                            </div>
                            <div className={`flex-1 p-3 rounded-lg border ${currency === 'USD' ? 'border-primary bg-primary/5' : 'opacity-60 cursor-pointer'}`}
                                onClick={() => maxUSD > 0 && setCurrency("USD")}>
                                <div className="text-xs font-bold text-muted-foreground mb-1">USD BAKİYE</div>
                                <div className="font-black">${formatCurrency(maxUSD)}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>İade Edilecek Tutar ({currency})</Label>
                            <Input
                                type="number"
                                placeholder={`Maks: ${currency === 'USD' ? maxUSD : maxTRY}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min={0}
                                step="0.01"
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button onClick={handleRefund} disabled={loading || !amount || Number(amount) <= 0}>
                        {loading ? "İşleniyor..." : "İadeyi Tamamla"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
