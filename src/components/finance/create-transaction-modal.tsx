"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Loader2,
  Landmark,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  FileText,
  Upload,
  X,
  TrendingDown,
  TrendingUp,
  History,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { createManualTransaction, updateManualTransaction, getAccounts, getTransactions } from "@/lib/actions/finance-actions";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";
import { getSettings } from "@/lib/actions/setting-actions";
import { CreateAccountModal } from "./create-account-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PriceInput } from "@/components/ui/price-input";
import {
  convertTransactionAmount,
  getCurrencySymbol,
  resolveInitialTransactionCurrency,
  type TransactionCurrency,
} from "@/lib/finance/transaction-currency";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().min(1, "Tutar gereklidir"),
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
  accountId: z.string().min(1, "Hesap seçimi gereklidir"),
  category: z.string().min(1, "İşlem türü gereklidir"),
  currency: z.enum(["TRY", "USD", "EUR"]),
  manualCategory: z.string().optional(),
  date: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface CreateTransactionModalProps {
  trigger?: React.ReactNode;
  initialAccounts?: any[];
  initialData?: any;
  initialType?: "INCOME" | "EXPENSE";
  initialCategory?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTransactionModal({
  trigger,
  initialAccounts,
  initialData,
  initialType,
  initialCategory,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CreateTransactionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<{ id?: string; url: string; filename: string; fileType: string; fileSize: number }[]>(
    initialData?.attachments || []
  );
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialType || initialData?.type || "INCOME",
      amount: initialData?.amount?.toString() || "",
      description: initialData?.description || "",
      paymentMethod: initialData?.paymentMethod || "CASH",
      accountId: initialData?.accountId || "",
      category: initialCategory || initialData?.category || "GENEL",
      currency: initialData?.currency || "TRY",
      manualCategory: "",
      date: initialData?.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (initialType) setValue("type", initialType);
    if (initialCategory) setValue("category", initialCategory);
  }, [initialType, initialCategory, setValue]);

  const transactionType = watch("type");
  const categoryValue = watch("category");
  const selectedCurrency = watch("currency") as TransactionCurrency;
  const amountValue = Number(watch("amount")) || 0;

  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const defaultCurrency = useMemo(() => {
    return settings.find((setting: any) => setting.key === "defaultCurrency")?.value || "TRY";
  }, [settings]);

  const { data: rates } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: getCurrentExchangeRates,
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const { data: accounts = initialAccounts || [] } = useQuery<any[]>({
    queryKey: ["finance-accounts"],
    queryFn: getAccounts,
    enabled: open,
    initialData: initialAccounts,
    placeholderData: keepPreviousData,
  });

  const { data: recentTransactions = [] } = useQuery<any[]>({
    queryKey: ["transactions", { pageSize: 4 }],
    queryFn: () => getTransactions({ pageSize: 4 }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const summary = useMemo(() => {
    const income = recentTransactions.filter((t: any) => t.type === "INCOME").reduce((acc: number, t: any) => acc + Number(t.amount), 0);
    const expense = recentTransactions.filter((t: any) => t.type === "EXPENSE").reduce((acc: number, t: any) => acc + Number(t.amount), 0);
    return { income, expense };
  }, [recentTransactions]);

  const convertedAmounts = useMemo(() => {
    return convertTransactionAmount(amountValue, selectedCurrency || "TRY", {
      usd: rates?.usd,
      eur: rates?.eur,
    });
  }, [amountValue, selectedCurrency, rates?.usd, rates?.eur]);

  useEffect(() => {
    if (!open || initialData?.currency) return;
    const savedCurrency = typeof window !== "undefined"
      ? window.localStorage.getItem("transaction_currency")
      : null;
    setValue("currency", resolveInitialTransactionCurrency(savedCurrency, defaultCurrency));
  }, [open, initialData?.currency, defaultCurrency, setValue]);

  useEffect(() => {
    if (!open || typeof window === "undefined" || !selectedCurrency) return;
    window.localStorage.setItem("transaction_currency", selectedCurrency);
  }, [open, selectedCurrency]);

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const transactionMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      if (initialData) {
        return updateManualTransaction(initialData.id, {
          ...data,
          amount: Number(data.amount),
          newAttachments: attachments.filter(a => !a.id),
          removedAttachmentIds,
        });
      }

      return createManualTransaction({
        ...data,
        category: data.category === "DİĞER" ? toTitleCase(data.manualCategory || "DİĞER") : data.category,
        amount: Number(data.amount),
        attachments,
      });
    },
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(initialData ? "İşlem güncellendi." : "İşlem başarıyla kaydedildi.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-session"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-init"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-revenue-analysis"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stat-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["account-analytics"] }),
      ]);
      setOpen(false);
      if (!initialData) {
        reset();
        setAttachments([]);
      }
      setRemovedAttachmentIds([]);
    },
    onError: () => {
      toast.error("İşlem kaydedilemedi.");
    },
  });
  const isPending = transactionMutation.isPending;

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-income') {
      setValue('type', 'INCOME');
      setOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      router.replace(`${pathname}${params.size > 0 ? '?' + params.toString() : ''}`);
    } else if (action === 'add-expense') {
      setValue('type', 'EXPENSE');
      setOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      router.replace(`${pathname}${params.size > 0 ? '?' + params.toString() : ''}`);
    }
  }, [searchParams, pathname, router, setValue]);

  useEffect(() => {
    if (open && accounts.length > 0 && !watch("accountId")) {
      setValue("accountId", accounts[0].id);
    }
  }, [accounts, open, setValue, watch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/finance/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAttachments(prev => [...prev, ...data.attachments]);
        toast.success(`${files.length} dosya yüklendi.`);
      } else {
        toast.error("Dosya yüklenemedi.");
      }
    } catch (error) {
      toast.error("Dosya yükleme hatası.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (url: string, id?: string) => {
    setAttachments(prev => prev.filter(a => a.url !== url));
    if (id) {
      setRemovedAttachmentIds(prev => [...prev, id]);
    }
  };

  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === watch("accountId"));
  }, [accounts, watch("accountId")]);

  const isInsufficient = useMemo(() => {
    if (transactionType !== "EXPENSE" || !selectedAccount || !amountValue) return false;

    // For Credit Card, check against available balance (limit - balance)
    if (selectedAccount.type === "CREDIT_CARD") {
      return amountValue > (selectedAccount.availableBalance || 0);
    }

    // For Cash/Bank, check against current balance
    return amountValue > selectedAccount.balance;
  }, [transactionType, selectedAccount, amountValue]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (isInsufficient) {
      toast.error("Yetersiz bakiye! Bu kasa eksiye düşeceği için işlem yapılamaz.");
      return;
    }
    transactionMutation.mutate(data);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK': return <Landmark className="h-4 w-4" />;
      case 'POS': return <ArrowRightLeft className="h-4 w-4" />;
      case 'CREDIT_CARD': return <CreditCard className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const currencyOptions: { value: TransactionCurrency; label: string; helper: string }[] = [
    { value: "TRY", label: "TL", helper: "Turk lirasi" },
    { value: "USD", label: "USD", helper: "Dolar" },
    { value: "EUR", label: "EUR", helper: "Euro" },
  ];

  const formatMoney = (value: number, currency: TransactionCurrency) => {
    return `${getCurrencySymbol(currency)}${Number(value || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: currency === "TRY" ? 2 : 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getAccountLabel = (type: string) => {
    if (type === "BANK") return "Banka";
    if (type === "POS") return "POS / Kart";
    if (type === "CREDIT_CARD") return "Kredi karti";
    return "Nakit kasa";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="rounded-xl shadow-lg shadow-blue-500/20 gap-2 h-10 px-5 text-xs bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" />
              <span>YENİ İŞLEM EKLE</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[1040px] border border-border/70 p-0 overflow-hidden bg-background text-foreground rounded-3xl shadow-2xl flex flex-col lg:flex-row h-[92vh] lg:h-auto max-h-[880px]">
        {/* Header Gradient Stripe */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-rose-500 z-50 opacity-80" />

        {/* Left Side: Form */}
        <div className="flex-[1.45] p-6 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar bg-background">
          <DialogHeader className="mb-8 text-left">
            <div className="flex items-center gap-5">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-300",
                transactionType === "INCOME"
                  ? "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10"
                  : "bg-rose-500/10 border-rose-500/20 shadow-rose-500/10"
              )}>
                {transactionType === "INCOME"
                  ? <ArrowDownLeft className="h-8 w-8 text-emerald-500" />
                  : <ArrowUpRight className="h-8 w-8 text-rose-500" />
                }
              </div>
              <div>
                <DialogTitle className="font-semibold text-2xl md:text-3xl tracking-tight text-foreground">
                  {initialData ? "İşlem Düzenle" : "Kasa Giriş/Çıkış İşlemi"}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-[0.2em] opacity-60">Atölye finansal hareketlerini hassasiyetle kaydedin.</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            {/* Type Toggles */}
            <div className="flex gap-4 p-1.5 bg-muted/40 rounded-[1.8rem] border border-border/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setValue("type", "INCOME")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 h-14 rounded-[1.4rem] text-xs transition-all duration-300",
                  transactionType === "INCOME"
                    ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-500"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                GELİR (GİRİŞ)
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "EXPENSE")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 h-14 rounded-[1.4rem] text-xs transition-all duration-300",
                  transactionType === "EXPENSE"
                    ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-rose-500/5 hover:text-rose-500"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                GİDER (ÇIKIŞ)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <PlusCircle className="h-3 w-3" /> İŞLEM TÜRÜ
                </Label>
                <Select onValueChange={(val) => setValue("category", val)} defaultValue={watch("category") || "GENEL"}>
                  <SelectTrigger className="h-14 rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs shadow-none hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all font-medium text-foreground">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[1.2rem] border-zinc-200 dark:border-zinc-700 bg-background/95 backdrop-blur-xl p-2 shadow-2xl">
                    <SelectItem value="GENEL" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Genel İşlem</SelectItem>
                    <SelectItem value="KİRA" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Kira / Gider</SelectItem>
                    <SelectItem value="MAAŞ" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Maaş Ödemesi</SelectItem>
                    <SelectItem value="FATURA" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Fatura Ödemesi</SelectItem>
                    <SelectItem value="STOK" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Stok Alımı</SelectItem>
                    <SelectItem value="DİĞER" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                {categoryValue === "DİĞER" && (
                  <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                    <Input
                      {...register("manualCategory")}
                      placeholder="İşlem türünü yazınız... (Örn: Kırtasiye Gideri)"
                      className="h-12 rounded-[1rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs px-4"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="amount" className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Landmark className="h-3 w-3" /> TUTAR
                </Label>
                <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1">
                    {currencyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue("currency", option.value, { shouldValidate: true })}
                        className={cn(
                          "h-10 rounded-lg text-[11px] font-semibold transition-all",
                          selectedCurrency === option.value
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <PriceInput
                      id="amount"
                      prefix={getCurrencySymbol(selectedCurrency || "TRY")}
                      value={watch("amount")}
                      onChange={(v) => setValue("amount", String(v), { shouldValidate: true })}
                      placeholder="0,00"
                      className="h-14 rounded-xl bg-background border-border text-xl font-semibold tracking-tight shadow-none"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currencyOptions
                      .filter((option) => option.value !== selectedCurrency)
                      .map((option) => (
                        <div key={option.value} className="rounded-xl border border-border/70 bg-muted/25 px-3 py-2">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{option.label} karşılığı</p>
                          <p className="text-sm font-semibold text-foreground">{formatMoney(convertedAmounts[option.value], option.value)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> ÖDEME YÖNTEMİ
                </Label>
                <Select onValueChange={(val) => setValue("paymentMethod", val as any)} defaultValue={watch("paymentMethod") || "CASH"}>
                  <SelectTrigger className="h-14 rounded-[1.2rem] bg-card border-border text-xs shadow-none">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[1.2rem] border-zinc-200 dark:border-zinc-700 bg-background/95 backdrop-blur-xl p-2">
                    <SelectItem value="CASH" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer uppercase">NAKİT</SelectItem>
                    <SelectItem value="CARD" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer uppercase">KREDİ KARTI</SelectItem>
                    <SelectItem value="TRANSFER" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer uppercase">HAVALE / EFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="h-3 w-3" /> KASA SEÇİMİ
                  </Label>
                  <CreateAccountModal trigger={
                    <button type="button" className="text-[10px] uppercase tracking-widest text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                      [+] HIZLI EKLE
                    </button>
                  } />
                </div>
                <Select onValueChange={(val) => setValue("accountId", val, { shouldValidate: true })} value={watch("accountId")}>
                  <SelectTrigger className="h-14 rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs shadow-none">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover p-2 min-w-[320px]">
                    {accounts.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        Kasa bulunamadi. Hizli ekle ile yeni kasa olusturun.
                      </div>
                    ) : accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id} className="text-xs rounded-xl py-3 pr-8 text-foreground font-medium cursor-pointer">
                        <div className="flex items-center justify-between w-full min-w-[260px] gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
                              {getAccountIcon(acc.type)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">{acc.name}</span>
                              <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">{getAccountLabel(acc.type)}</span>
                            </span>
                          </div>
                          <span className={cn(
                            "shrink-0 font-semibold text-[11px]",
                            Number(acc.balance) >= 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            ₺{Number(acc.balance).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accountId && <p className="text-[10px] text-rose-500 ml-2">{errors.accountId.message}</p>}

                {isInsufficient && (
                  <div className="flex items-center gap-2 mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-500 font-medium">Bu kasada yeterli bakiye yok! Kasa eksiye düşeceği için işlem yapılamaz.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> TARİH VE SAAT
              </Label>
              <Input
                type="date"
                {...register("date")}
                className="h-14 rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs px-6 shadow-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                <FileText className="h-3 w-3" /> AÇIKLAMA / NOT
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="İşlem detaylarını buraya yazın..."
                className="min-h-[100px] rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs p-5 shadow-none focus-visible:ring-primary/20 transition-all font-medium"
              />
              {errors.description && <p className="text-[10px] text-rose-500 ml-2 italic">{errors.description.message}</p>}
            </div>

            <div className="space-y-3">
              <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                <Upload className="h-3 w-3" /> BELGE / FİŞ YÜKLE
              </Label>
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/40 rounded-[1.5rem] p-10 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group"
              >
                {uploading ? (
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground uppercase">Dosyayı sürükleyin veya <span className="text-primary hover:underline">göz atın</span></p>
                <p className="text-[9px] text-muted-foreground/50 mt-2">PNG, JPG, PDF (MAX. 10MB)</p>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/40 flex-shrink-0">
                          {file.fileType.includes("image") ? (
                            <img src={file.url} alt="" className="h-full w-full object-cover rounded-xl" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-foreground truncate uppercase">{file.filename}</p>
                          <p className="text-[9px] text-muted-foreground/50">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(file.url, file.id);
                        }}
                        className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 -mx-2 flex gap-3 border-t border-border/70 bg-background/90 px-2 pb-2 pt-4 backdrop-blur-xl">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending} className="h-12 flex-1 rounded-xl text-[11px] font-semibold uppercase tracking-widest">Iptal</Button>
              <Button type="submit" disabled={isPending || isInsufficient} className={cn(
                "h-12 flex-[1.6] rounded-xl text-[11px] font-semibold uppercase tracking-widest text-white gap-2 shadow-lg",
                transactionType === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20",
                isInsufficient && "opacity-50 cursor-not-allowed grayscale"
              )}>
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {initialData ? 'Guncelle' : transactionType === "INCOME" ? 'Gelir Kaydet' : 'Gider Kaydet'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Side: Sidebar */}
        <div className="flex-[0.6] bg-zinc-50/50 dark:bg-zinc-900/30 border-l border-zinc-200 dark:border-zinc-800 p-8 md:p-10 flex flex-col h-full overflow-hidden">
          <div className="space-y-10 h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Wallet className="h-3 w-3" /> GÜNCEL KASA VARLIKLARI
                </Label>
              </div>

              <div className="space-y-4">
                {accounts.length > 0 ? accounts.map((acc) => (
                  <div key={acc.id} className="p-5 rounded-[1.5rem] bg-background/50 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-110" />
                    <div className="relative z-10">
                      <p className="text-[10px] text-muted-foreground uppercase mb-2 group-hover:text-primary transition-colors">{acc.name}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-xl text-foreground tracking-tighter">
                          ₺{Number(acc.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[9px] uppercase flex items-center gap-1.5",
                          acc.balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {acc.balance >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {acc.balance >= 0 ? "+ %4.2 BUGÜN" : "- %1.5 BUGÜN"}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground text-xs italic">
                    Hesap bulunamadı
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <History className="h-3 w-3" /> SON HAREKETLER
                </Label>
                <button type="button" className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {recentTransactions.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex items-center gap-4 group">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm group-hover:scale-105",
                      tx.type === "INCOME"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                    )}>
                      {tx.type === "INCOME" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground truncate uppercase tracking-tighter">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 transition-colors group-hover:text-muted-foreground uppercase">
                        {tx.createdAt ? format(new Date(tx.createdAt), "HH:mm") : "--:--"} • {tx.financeAccount?.name || "Bilinmiyor"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs tracking-tighter",
                        tx.type === "INCOME" ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {tx.type === "INCOME" ? "+" : "-"}₺{Number(tx.amount).toLocaleString('tr-TR')}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">{tx.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/20 relative overflow-hidden group">
              <TrendingUp className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/10 group-hover:rotate-12 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <History className="h-4 w-4 text-indigo-500" />
                  </div>
                  <h4 className="font-medium text-xs text-foreground tracking-widest">FİNANSAL ÖZET</h4>
                </div>
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed uppercase tracking-tighter">
                  BU AY TOPLAM GELİRİNİZ GİDERLERİNİZDEN <span className="text-emerald-500 font-extrabold tracking-normal">₺{(summary.income - summary.expense).toLocaleString('tr-TR')}</span> DAHA FAZLA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
