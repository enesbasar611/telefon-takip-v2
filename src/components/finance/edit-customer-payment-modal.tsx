"use client";

import { useState, useTransition, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateCustomerPayment } from "@/lib/actions/debt-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getExchangeRates } from "@/lib/actions/currency-actions";

interface EditCustomerPaymentModalProps {
    transaction: any;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditCustomerPaymentModal({
    transaction,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: EditCustomerPaymentModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const queryClient = useQueryClient();

    const { data: rates } = useQuery({
        queryKey: ["exchange-rates"],
        queryFn: () => getExchangeRates(null),
    });
    const usdRate = rates?.usd || 32.5;

    useEffect(() => {
        if (transaction && open) {
            setAmount(transaction.amount.toString());
            setNotes(transaction.description || "");
        }
    }, [transaction, open]);

    const handleUpdate = () => {
        if (!transaction) return;

        startTransition(async () => {
            // Fix signature: updateCustomerPayment(transactionId, newAmount, description, usdRate)
            const res = await updateCustomerPayment(
                transaction.id,
                Number(amount),
                notes,
                usdRate
            );

            if (res.success) {
                toast.success("Tahsilat güncellendi");
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
                queryClient.invalidateQueries({ queryKey: ["debts"] });
            } else {
                toast.error(res.error || "Güncelleme başarısız");
            }
        });
    };

    return (
        <>
            {trigger && (
                <div onClick={() => setOpen(true)} className="cursor-pointer">
                    {trigger}
                </div>
            )}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="w-full max-w-[400px] h-auto rounded-[2rem] p-6 bg-card border border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tahsilatı Düzenle</AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] text-muted-foreground uppercase font-bold">
                            Tahsilat miktarını ve açıklamasını buradan güncelleyebilirsiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                TAHSİLAT TUTARI ({transaction?.currency === 'USD' ? 'USD' : 'TL'})
                            </Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={cn(
                                    "h-12 bg-muted/30 border-border/50 font-mono text-lg transition-all focus:ring-2 focus:ring-blue-500/20",
                                    transaction?.currency === 'USD' ? "text-blue-500" : "text-emerald-600 font-bold"
                                )}
                            />
                            <p className="text-[10px] text-amber-500 italic">Dikkat: Tutar değişikliği borç bakiyesini otomatik olarak ayarlayacaktır.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">AÇIKLAMA</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="h-12 bg-muted/30 border-border/50 text-foreground"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/50 mt-2">
                        <AlertDialogCancel asChild>
                            <Button variant="ghost" className="rounded-xl h-12 uppercase tracking-widest text-[10px] font-bold">İptal</Button>
                        </AlertDialogCancel>
                        <Button
                            onClick={handleUpdate}
                            disabled={isPending}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-8 uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-emerald-500/20"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "GÜNCELLE"}
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
