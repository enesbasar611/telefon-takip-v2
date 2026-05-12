"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, User, FileText, Calendar, History } from "lucide-react";
import { createDebt } from "@/lib/actions/debt-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { resolveCustomerForDebt, getCustomerById } from "@/lib/actions/customer-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";
import { PriceInput } from "@/components/ui/price-input";
import { findCustomerByPhone, findCustomerByName } from "@/lib/actions/customer-lookup-actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

interface AddDebtModalProps {
    children?: React.ReactNode;
    rates?: {
        usd: number;
        eur: number;
        ga: number;
        lastUpdate: Date;
    };
    initialData?: {
        name: string;
        phone: string;
    } | null;
    onSuccess?: () => void;
}

interface DebtDraftItem {
    id: string;
    title: string;
    amount: number;
    currency: "TRY" | "USD";
    convertedAmount: number;
    productId?: string;
    quantity?: number;
}

export function AddDebtModal({ children, rates, initialData, onSuccess }: AddDebtModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [phoneValue, setPhoneValue] = useState("");
    const [nameValue, setNameValue] = useState("");
    const [isLookingUp, setIsLookingUp] = useState(false);

    // Draft Items State
    const [debtItems, setDebtItems] = useState<DebtDraftItem[]>([]);
    const [itemTitle, setItemTitle] = useState("");
    const [itemAmount, setItemAmount] = useState("");
    const [itemQuantity, setItemQuantity] = useState("1");
    const [itemCurrency, setItemCurrency] = useState<"TRY" | "USD">("TRY");
    const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
    const [selectedCustomerInfo, setSelectedCustomerInfo] = useState<any>(null);

    // Product Search State
    const [productSearch, setProductSearch] = useState("");
    const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    const { toast } = useToast();
    const router = useRouter();

    const { defaultCurrency } = useDashboardData();

    // Restore last-used currency preference on mount
    useEffect(() => {
        const saved = localStorage.getItem("preferred_currency");
        if (saved === "USD" || saved === "TRY") {
            setItemCurrency(saved);
        } else if (defaultCurrency) {
            setItemCurrency(defaultCurrency as "TRY" | "USD");
        }
    }, [defaultCurrency]);

    // Persist currency preference whenever it changes
    const handleSetItemCurrency = (currency: "TRY" | "USD") => {
        setItemCurrency(currency);
        localStorage.setItem("preferred_currency", currency);
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        defaultValues: {
            customerName: "",
            customerPhone: "",
            dueDate: "",
        },
    });

    // Lookup by Name
    useEffect(() => {
        if (nameValue.length < 2 || selectedCustomerInfo?.name === nameValue) {
            setCustomerSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            const results = await findCustomerByName(nameValue);
            setCustomerSuggestions(results || []);
        }, 400);

        return () => clearTimeout(timer);
    }, [nameValue, selectedCustomerInfo]);

    // Auto-lookup customer when phone is entered
    useEffect(() => {
        const checkPhone = async () => {
            const sanitized = phoneValue.replace(/\D/g, "");
            if (sanitized.length === 10) {
                setIsLookingUp(true);
                try {
                    const customer = await findCustomerByPhone(sanitized);
                    if (customer) {
                        handleSelectCustomer(customer);
                        toast({
                            title: "Müşteri Bulundu",
                            description: `${customer.name} bilgileri otomatik dolduruldu.`,
                            duration: 3000
                        });
                    }
                } catch (e) {
                    console.error("Lookup error:", e);
                } finally {
                    setIsLookingUp(false);
                }
            }
        };
        const t = setTimeout(checkPhone, 500);
        return () => clearTimeout(t);
    }, [phoneValue, setValue, toast]);

    const handleSelectCustomer = async (customer: any) => {
        setNameValue(customer.name);
        setPhoneValue(customer.phone || "");
        setValue("customerName", customer.name);
        setValue("customerPhone", customer.phone || "");
        setCustomerSuggestions([]);

        const fullInfo = await getCustomerById(customer.id);
        setSelectedCustomerInfo(fullInfo);
    };

    // Product Search Effect
    useEffect(() => {
        if (itemTitle.length < 2 || (selectedProduct && selectedProduct.name === itemTitle)) {
            setProductSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingProducts(true);
            try {
                const results = await getProducts({ search: itemTitle, pageSize: 5 });
                setProductSuggestions(results.products || []);
            } catch (error) {
                console.error("Product search error:", error);
            } finally {
                setIsSearchingProducts(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [itemTitle, selectedProduct]);

    const handleSelectProduct = (product: any) => {
        setItemTitle(product.name);
        setItemAmount(product.sellPrice.toString());
        setSelectedProduct(product);
        setProductSuggestions([]);
    };

    // Initial Data Sync
    useEffect(() => {
        if (open && initialData) {
            setNameValue(initialData.name);
            setPhoneValue(initialData.phone || "");
            setValue("customerName", initialData.name);
            setValue("customerPhone", initialData.phone || "");

            // Try to find full info
            const lookupInitial = async () => {
                const results = await findCustomerByName(initialData.name);
                if (results.length > 0) {
                    const exactMatch = results.find((r: any) => r.name === initialData.name);
                    if (exactMatch) handleSelectCustomer(exactMatch);
                }
            };
            lookupInitial();
        }
    }, [open, initialData, setValue]);

    const addItem = () => {
        if (!itemTitle) {
            toast({ title: "Hata", description: "Lütfen ürün/işlem adı girin.", variant: "destructive" });
            return;
        }
        if (Number(itemAmount) <= 0) {
            toast({ title: "Hata", description: "Lütfen geçerli bir tutar girin.", variant: "destructive" });
            return;
        }

        const quantity = Math.max(1, Math.floor(Number(itemQuantity) || 1));
        const unitAmount = Number(itemAmount);
        const totalAmount = unitAmount * quantity;
        const usdRate = rates?.usd || 32.5;
        const converted = itemCurrency === "USD" ? totalAmount * usdRate : totalAmount;

        const newItem: DebtDraftItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: itemTitle,
            amount: totalAmount,
            currency: itemCurrency,
            convertedAmount: converted,
            productId: selectedProduct?.id,
            quantity
        };

        setDebtItems(prev => [...prev, newItem]);
        setItemTitle("");
        setItemAmount("");
        setItemQuantity("1");
        setSelectedProduct(null);
    };

    const removeItem = (id: string) => {
        setDebtItems(prev => prev.filter(i => i.id !== id));
    };

    const onSubmit = async (data: any) => {
        if (debtItems.length === 0) {
            toast({ title: "Hata", description: "Lütfen en az bir kalem ekleyin.", variant: "destructive" });
            return;
        }
        if (!data.customerName || !data.customerPhone) {
            toast({ title: "Hata", description: "Müşteri adı ve iletişim(telefon) numarası zorunludur.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const customerRes = await resolveCustomerForDebt({
                name: data.customerName,
                phone: data.customerPhone,
            });

            if (!customerRes.success || !customerRes.customerId) {
                toast({ title: "Hata", description: "Müşteri kaydı bulunamadı/oluşturulamadı.", variant: "destructive" });
                return;
            }

            // Create separate debt records for each item as requested
            let anyFailed = false;

            for (const item of debtItems) {
                const res = await createDebt({
                    customerId: customerRes.customerId,
                    amount: item.amount,
                    currency: item.currency,
                    notes: item.title,
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    items: [{
                        title: item.title,
                        amount: item.amount,
                        currency: item.currency,
                        productId: item.productId,
                        quantity: item.quantity
                    }]
                });

                if (!res.success) {
                    anyFailed = true;
                }
            }

            if (!anyFailed) {
                toast({ title: "Başarılı", description: `${debtItems.length} adet alacak kaydı ve ilgili stok hareketleri oluşturuldu.` });
                setOpen(false);
                reset();
                setPhoneValue("");
                setNameValue("");
                setSelectedCustomerInfo(null);
                setDebtItems([]);
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                toast({
                    title: "Hata",
                    description: "Bazı kayıtlar oluşturulamadı. Lütfen listeyi kontrol edin.",
                    variant: "destructive"
                });
                router.refresh();
            }
        });
    };

    const totalTRY = debtItems.filter(i => i.currency === "TRY").reduce((acc, i) => acc + i.amount, 0);
    const totalUSD = debtItems.filter(i => i.currency === "USD").reduce((acc, i) => acc + i.amount, 0);
    const grandTotalTRY = debtItems.reduce((acc, i) => acc + i.convertedAmount, 0);

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setSelectedCustomerInfo(null);
                setNameValue("");
                setPhoneValue("");
                setDebtItems([]);
                setItemQuantity("1");
                reset();
            }
        }}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-12 shadow-xl border border-white/10 transition-all active:scale-95 group">
                        <PlusCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span className="font-inter font-light tracking-wide">Alacak Kaydet</span>
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="fixed w-full max-w-[95vw] md:max-w-[800px] h-[96vh] md:h-auto md:max-h-[90vh] bg-background border-none p-0 overflow-hidden bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 md:rounded-[2.5rem] rounded-t-[2.5rem] rounded-b-none sm:rounded-b-[2.5rem] shadow-2xl flex flex-col transition-all duration-300">
                <div className="absolute inset-0 p-[2px] rounded-[inherit] overflow-hidden pointer-events-none z-0">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#6366f1,#a855f7,#ec4899,#6366f1)] opacity-40 blur-sm"
                    />
                    <div className="absolute inset-0 bg-background rounded-[inherit]" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden relative z-10">
                    <div className="p-5 md:p-8 bg-card/50 border-b border-border/50 relative overflow-hidden">
                        <div className="md:hidden w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
                        <DialogHeader className="relative z-10">
                            <DialogTitle className="font-medium text-xl md:text-2xl">Bakkal Defteri (Veresiye)</DialogTitle>
                            <DialogDescription className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest mt-1">
                                Kalem kalem borç girişi yapın, otomatik kura çevirin.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-5 md:p-8 space-y-8 overflow-y-auto flex-1 scrollbar-hide">
                        {/* Customer Resolution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <Label className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Müşteri / Bayi</Label>
                                <div className="relative group overflow-hidden rounded-xl md:rounded-2xl">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                    <Input
                                        value={nameValue}
                                        onChange={(e) => {
                                            setNameValue(e.target.value);
                                            setValue("customerName", e.target.value);
                                        }}
                                        placeholder="İsim ile ara veya yeni yaz"
                                        className="h-12 bg-card border-border/50 rounded-[inherit] pl-12 text-sm focus-visible:ring-0"
                                    />
                                </div>
                                <AnimatePresence>
                                    {customerSuggestions?.length > 0 && (
                                        <motion.div className="absolute top-full left-0 w-full bg-popover border border-border mt-2 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto p-2">
                                            {customerSuggestions.map((c) => (
                                                <button key={c.id} type="button" onClick={() => handleSelectCustomer(c)} className="w-full text-left p-3 hover:bg-indigo-500 hover:text-white rounded-xl transition-all flex justify-between items-center text-sm">
                                                    <span>{c.name}</span>
                                                    <span className="text-[10px] opacity-60">{c.phone}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <PhoneInput label="TELEFON" value={phoneValue} isLookingUp={isLookingUp} onChange={(val) => { setPhoneValue(val); setValue("customerPhone", val); }} />
                        </div>

                        {/* Existing debts section removed as requested by user */}

                        {/* ADD ITEM SECTION */}
                        <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold uppercase tracking-widest">
                                <PlusCircle className="w-4 h-4" />
                                Yeni Kalem Ekle
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-4 space-y-2 relative">
                                    <Label className="text-[9px] text-muted-foreground uppercase">Ürün / Açıklama</Label>
                                    <div className="relative group overflow-hidden rounded-xl">
                                        <Input
                                            value={itemTitle}
                                            onChange={(e) => {
                                                setItemTitle(e.target.value);
                                                if (selectedProduct && e.target.value !== selectedProduct.name) {
                                                    setSelectedProduct(null);
                                                }
                                            }}
                                            placeholder="Şarj aleti, Kılıf, İşçilik..."
                                            className="h-11 bg-card rounded-xl pr-10"
                                        />
                                        {isSearchingProducts && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {productSuggestions.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 w-full bg-popover border border-border mt-1 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto p-1"
                                            >
                                                {productSuggestions.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handleSelectProduct(p)}
                                                        className="w-full text-left p-2 hover:bg-indigo-500 hover:text-white rounded-lg transition-all flex justify-between items-center text-xs"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{p.name}</span>
                                                            <span className="text-[9px] opacity-60">Stok: {p.stock}</span>
                                                        </div>
                                                        <span className="font-bold">₺{Number(p.sellPrice).toLocaleString('tr-TR')}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[9px] text-muted-foreground uppercase">Adet</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={itemQuantity}
                                        onChange={(e) => setItemQuantity(e.target.value)}
                                        className="h-11 bg-card rounded-xl font-mono"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[9px] text-muted-foreground uppercase">Birim Tutar</Label>
                                    <PriceInput value={itemAmount} onChange={(v) => setItemAmount(String(v))} prefix={itemCurrency === 'TRY' ? '₺' : '$'} className="h-11 bg-card rounded-xl" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[9px] text-muted-foreground uppercase">Birim</Label>
                                    <div className="flex bg-muted p-1 rounded-xl h-11">
                                        <button type="button" onClick={() => handleSetItemCurrency("TRY")} className={cn("flex-1 text-[10px] font-bold rounded-lg", itemCurrency === "TRY" ? "bg-white dark:bg-zinc-800 shadow-sm text-emerald-500" : "text-muted-foreground")}>TL</button>
                                        <button type="button" onClick={() => handleSetItemCurrency("USD")} className={cn("flex-1 text-[10px] font-bold rounded-lg", itemCurrency === "USD" ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-500" : "text-muted-foreground")}>USD</button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <Button type="button" onClick={addItem} className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl">Ekle</Button>
                                </div>
                            </div>
                            {itemCurrency === "USD" && rates && (
                                <div className="text-[10px] text-muted-foreground italic flex justify-between items-center px-2">
                                    <span>Anlık Kur: 1$ = ₺{rates.usd}</span>
                                    <span>Karşılığı: ₺{(Number(itemAmount) * Math.max(1, Math.floor(Number(itemQuantity) || 1)) * rates.usd).toLocaleString('tr-TR')}</span>
                                </div>
                            )}
                        </div>

                        {/* LIST OF ITEMS */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Eklenen Kalemler</Label>
                            {debtItems.length === 0 ? (
                                <div className="h-24 rounded-[2rem] border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground italic bg-muted/20">
                                    Henüz bir kalem eklenmedi...
                                </div>
                            ) : (
                                <div className="space-y-2 overflow-y-auto max-h-[300px] scrollbar-hide">
                                    <AnimatePresence>
                                        {debtItems.map((item) => (
                                            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex justify-between items-center p-4 bg-card rounded-2xl border border-border/50 group hover:border-indigo-500/30 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{item.title}</span>
                                                    <span className="text-[10px] text-muted-foreground">{item.quantity || 1} adet</span>
                                                    {item.currency === "USD" && <span className="text-[10px] text-muted-foreground italic">Kur ile hesaplandı: ₺{item.convertedAmount.toLocaleString('tr-TR')}</span>}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={cn("text-sm font-bold", item.currency === "USD" ? "text-blue-500" : "text-emerald-500")}>
                                                        {item.currency === "TRY" ? '₺' : '$'}{item.amount.toLocaleString('tr-TR')}
                                                    </span>
                                                    <button type="button" onClick={() => removeItem(item.id)} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <PlusCircle className="w-4 h-4 rotate-45" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* SUMMARY */}
                        <div className="p-6 rounded-[2.5rem] bg-card dark:bg-zinc-900 border border-border/50 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><FileText className="w-24 h-24 rotate-12" /></div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Topl. TL</span>
                                    <span className="text-xl font-mono text-foreground">₺{totalTRY.toLocaleString('tr-TR')}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-blue-500 font-bold uppercase tracking-widest">Topl. USD</span>
                                    <span className="text-xl font-mono text-foreground">${totalUSD.toLocaleString('tr-TR')}</span>
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-1 md:text-right">
                                    <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Genel Toplam (TL)</span>
                                    <span className="text-2xl font-black text-emerald-500">₺{grandTotalTRY.toLocaleString('tr-TR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* DUE DATE */}
                        <div className="space-y-2">
                            <Label className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Ödeme Sözü Tarihi (Opsiyonel)</Label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="date" {...register("dueDate")} className="h-12 bg-card border-border/50 rounded-2xl pl-12 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 md:p-8 bg-card/50 border-t border-border/50">
                        <DialogFooter className="flex-row gap-3">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="flex-1 h-14 rounded-2xl text-[11px] font-bold uppercase tracking-widest">İptal</Button>
                            <Button type="submit" disabled={isPending || debtItems.length === 0} className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-3 shadow-xl border border-indigo-500/20 group">
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />}
                                <span className="font-inter font-light uppercase text-xs">Hesaba Geçir</span>
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
