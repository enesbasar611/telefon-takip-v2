"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Save, Wallet } from "lucide-react";
import { createSupplierTransactionAction } from "@/lib/actions/purchase-actions";
import { getSupplierProfileDataAction } from "@/lib/actions/purchase-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { CreateAccountModal } from "@/components/finance/create-account-modal";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface SupplierPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId?: string;
    supplierName?: string;
    unpaidOrders?: any[];
    suppliers?: any[];
    allPurchaseOrders?: any[];
    initialOrderId?: string;
    onSuccess?: (updatedSupplier?: any) => void;
}

const supplierPaymentSchema = z.object({
    supplierId: z.string().min(1, "Tedarikçi seçiniz"),
    amount: z.coerce.number().min(1, "Tutar 0'dan büyük olmalıdır"),
    type: z.enum(["INCOME", "EXPENSE"]),
    description: z.string().min(2, "Açıklama giriniz"),
    purchaseOrderId: z.string().optional(),
    accountId: z.string().optional(),
    paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).optional(),
}).refine((data) => {
    // Ödeme yaparken (EXPENSE) kasa/banka seçimi zorunlu
    if (data.type === "EXPENSE" && !data.accountId) return false;
    return true;
}, {
    message: "Ödeme yaparken bir kasa/hesap seçmelisiniz",
    path: ["accountId"],
});

type SupplierPaymentFormValues = z.infer<typeof supplierPaymentSchema>;

export function SupplierPaymentModal({
    isOpen,
    onClose,
    supplierId: initialSupplierId,
    supplierName: initialSupplierName,
    unpaidOrders: initialUnpaidOrders = [],
    suppliers = [],
    allPurchaseOrders = [],
    initialOrderId,
    onSuccess
}: SupplierPaymentModalProps) {
    const [isPending, startTransition] = useTransition();
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            getAccounts().then(setAccounts);
        }
    }, [isOpen]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors },
        reset,
    } = useForm<SupplierPaymentFormValues>({
        resolver: zodResolver(supplierPaymentSchema),
        defaultValues: {
            supplierId: initialSupplierId || "",
            type: "EXPENSE",
            description: "",
            purchaseOrderId: initialOrderId || undefined,
            paymentMethod: "CASH"
        }
    });

    const selectedType = watch("type");
    const selectedOrderId = watch("purchaseOrderId");
    const selectedSupplierId = watch("supplierId");

    // Efektif unpaidOrders (eğer sidebar'dan açıldıysa ve supplier seçildiyse)
    const effectiveUnpaidOrders = initialSupplierId
        ? initialUnpaidOrders
        : allPurchaseOrders.filter((o: any) => o.supplierId === selectedSupplierId && o.paymentStatus !== "PAID");

    // Auto-fill amount when a purchase order is selected
    useEffect(() => {
        if (selectedOrderId && selectedOrderId !== "manual") {
            const order = effectiveUnpaidOrders.find((o: any) => o.id === selectedOrderId);
            if (order) {
                const amount = Math.round(Number(order.remainingAmount || order.totalAmount));
                setValue("amount", amount);
                setValue("description", `${order.orderNo} nolu sipariş ödemesi`);
                setValue("type", "EXPENSE");
            }
        }
    }, [selectedOrderId, effectiveUnpaidOrders, setValue]);

    // Pre-select initialOrderId if passed
    useEffect(() => {
        if (isOpen && initialOrderId) {
            setValue("purchaseOrderId", initialOrderId);
        } else if (isOpen && initialUnpaidOrders.length === 1 && !selectedOrderId) {
            // Tek bir ödenmemiş sipariş varsa otomatik seç
            setValue("purchaseOrderId", initialUnpaidOrders[0].id);
        }
    }, [isOpen, initialOrderId, initialUnpaidOrders, setValue, selectedOrderId]);

    const onSubmit = async (data: SupplierPaymentFormValues) => {
        startTransition(async () => {
            const result = await createSupplierTransactionAction({
                supplierId: data.supplierId,
                amount: Math.round(data.amount),
                type: data.type,
                description: data.description,
                purchaseOrderId: data.purchaseOrderId === "manual" ? undefined : data.purchaseOrderId,
                accountId: data.accountId,
                paymentMethod: data.paymentMethod,
            });

            if (result.success) {
                toast.success("Cari işlem başarıyla kaydedildi.");

                // Fetch updated supplier data
                if (onSuccess) {
                    const updatedSupplier = await getSupplierProfileDataAction(data.supplierId);
                    onSuccess(updatedSupplier);
                }

                onClose();
                reset({
                    supplierId: initialSupplierId || "",
                    type: "EXPENSE",
                    description: "",
                });
            } else {
                toast.error(result.error || "Bir hata oluştu.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-w-full w-full h-full sm:h-auto overflow-y-auto bg-card border-border/50 p-6 sm:rounded-3xl rounded-none">
                <DialogHeader className="mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <CreditCard className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <DialogTitle className="font-medium text-xl  text-foreground">Cari İşlem / Ödeme</DialogTitle>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">
                                {initialSupplierName || "Tedarikçi"} hesabına işlem giriyorsunuz.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {!initialSupplierId && (
                        <div className="space-y-2">
                            <Label className="font-medium text-[10px]  tracking-wider text-muted-foreground/80 uppercase">TEDARİKÇİ SEÇİN</Label>
                            <Controller
                                control={control}
                                name="supplierId"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-accent/5 border-border/50 h-12 rounded-xl text-sm  text-foreground focus:ring-emerald-500">
                                            <SelectValue placeholder="Tedarikçi Seçin" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border rounded-xl">
                                            {suppliers.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id} className="text-xs ">
                                                    {s.name} (Borç: ₺{Math.round(Number(s.balance)).toLocaleString("tr-TR")})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.supplierId && <p className="text-[10px] text-red-400">{errors.supplierId.message}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <button
                            type="button"
                            onClick={() => setValue("type", "EXPENSE")}
                            className={cn(
                                "flex items-center justify-center gap-2 h-11 rounded-xl text-xs  transition-all border",
                                selectedType === "EXPENSE"
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                    : "bg-accent/5 border-border/50 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                            )}
                        >
                            Borç Öde (Ödeme)
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("type", "INCOME")}
                            className={cn(
                                "flex items-center justify-center gap-2 h-11 rounded-xl text-xs  transition-all border",
                                selectedType === "INCOME"
                                    ? "bg-rose-500/10 border-rose-500/50 text-rose-400"
                                    : "bg-accent/5 border-border/50 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                            )}
                        >
                            Borç Ekle (Alım)
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-medium text-[10px]  tracking-wider text-muted-foreground/80 uppercase">ÖDEME İLE İLİŞKİLİ SİPARİŞ</Label>
                        <Controller
                            control={control}
                            name="purchaseOrderId"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-accent/5 border-border/50 h-12 rounded-xl text-sm  text-foreground focus:ring-emerald-500">
                                        <SelectValue placeholder="Manuel İşlem (Sipariş Seçilmedi)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border rounded-xl">
                                        <SelectItem value="manual" className="text-xs  text-muted-foreground">Manuel İşlem / Genel Ödeme</SelectItem>
                                        {effectiveUnpaidOrders.map((order: any) => (
                                            <SelectItem key={order.id} value={order.id} className="text-xs ">
                                                {order.orderNo} - ₺{Math.round(Number(order.remainingAmount || order.totalAmount)).toLocaleString("tr-TR")} ({format(new Date(order.createdAt), "dd MMM", { locale: tr })})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {selectedType === "EXPENSE" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">ÖDEME YÖNTEMİ</Label>
                                <Controller
                                    control={control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value || "CASH"}>
                                            <SelectTrigger className="bg-accent/5 border-border/50 h-12 rounded-xl text-sm text-foreground focus:ring-emerald-500">
                                                <SelectValue placeholder="Seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl">
                                                <SelectItem value="CASH" className="text-xs">NAKİT</SelectItem>
                                                <SelectItem value="CARD" className="text-xs">KREDİ KARTI</SelectItem>
                                                <SelectItem value="TRANSFER" className="text-xs">HAVALE/EFT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium text-[10px] tracking-wider text-muted-foreground/80 uppercase">KASA / HESAP</Label>
                                    <CreateAccountModal trigger={
                                        <button type="button" className="text-[10px] uppercase tracking-widest text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                            [+] HIZLI EKLE
                                        </button>
                                    } />
                                </div>
                                <Controller
                                    control={control}
                                    name="accountId"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="bg-accent/5 border-border/50 h-12 rounded-xl text-sm text-foreground focus:ring-emerald-500">
                                                <SelectValue placeholder="Kasa Seçin" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl min-w-[240px]">
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="text-xs p-3">
                                                        <div className="flex items-center justify-between w-full min-w-[200px]">
                                                            <span>{acc.name}</span>
                                                            <span className={cn("font-medium text-[10px]", acc.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                ₺{Number(acc.balance).toLocaleString("tr-TR")}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="font-medium text-[10px]  tracking-wider text-muted-foreground/80 uppercase">TUTAR (₺)</Label>
                        <PriceInput
                            id="amount"
                            value={watch("amount")}
                            onChange={(v) => setValue("amount", v, { shouldValidate: true })}
                            placeholder="0,00"
                            className="bg-accent/5 border-border/50 h-12 rounded-xl text-lg  text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-emerald-500"
                        />
                        {errors.amount && <p className="text-[10px] text-red-400">{errors.amount.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-medium text-[10px]  tracking-wider text-muted-foreground/80 uppercase">AÇIKLAMA</Label>
                        <Input
                            id="description"
                            {...register("description")}
                            placeholder="Örn: 102 nolu fatura ödemesi, elden nakit vb."
                            className="bg-accent/5 border-border/50 h-12 rounded-xl text-sm  text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-emerald-500"
                        />
                        {errors.description && <p className="text-[10px] text-red-400">{errors.description.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="text-muted-foreground hover:text-foreground  h-11 px-6 rounded-xl hover:bg-accent/10">
                            İptal
                        </Button>
                        <Button type="submit" disabled={isPending} className={cn(
                            "text-white  h-11 px-8 rounded-xl shadow-lg gap-2 transition-all",
                            selectedType === "EXPENSE" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
                        )}>
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {selectedType === "EXPENSE" ? "Ödemeyi Kaydet" : "Borcu Kaydet"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}





