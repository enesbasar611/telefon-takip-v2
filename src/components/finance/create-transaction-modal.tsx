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
  AlertCircle,
  Sparkles,
  Building2,
} from "lucide-react";
import { createManualTransaction, updateManualTransaction, getAccounts, getTransactions } from "@/lib/actions/finance-actions";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";
import { getSettings } from "@/lib/actions/setting-actions";
import { getSuppliersSimple } from "@/lib/actions/supplier-actions";
import { CreateAccountModal } from "./create-account-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, subDays, isToday, isAfter, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { PriceInput } from "@/components/ui/price-input";
import { KasaBalanceText } from "./kasa-balance-text";
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
  supplierId: z.string().optional(),
  supplierAction: z.enum(["PAYMENT", "ADD_DEBT"]).optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface CreateTransactionModalProps {
  trigger?: React.ReactNode;
  initialAccounts?: any[];
  initialData?: any;
  initialType?: "INCOME" | "EXPENSE";
  initialCategory?: string;
  initialSupplierId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTransactionModal({
  trigger,
  initialAccounts,
  initialData,
  initialType,
  initialCategory,
  initialSupplierId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CreateTransactionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !initialData) {
      reset();
      setAttachments([]);
      setRemovedAttachmentIds([]);
    }
    setOpen(newOpen);
  };

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
      accountId: initialData?.financeAccountId || initialData?.accountId || "",
      category: initialCategory || initialData?.category || "GENEL",
      currency: initialData?.currency || "TRY",
      manualCategory: "",
      supplierId: initialSupplierId || initialData?.supplierId || "",
      supplierAction: (initialData?.supplierAction as "PAYMENT" | "ADD_DEBT") || "PAYMENT",
      date: (() => {
        if (!initialData?.createdAt) return format(new Date(), "yyyy-MM-dd'T'HH:mm");
        const date = new Date(initialData.createdAt);
        return !isNaN(date.getTime()) ? format(date, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm");
      })(),
    }
  });

  useEffect(() => {
    if (initialType) setValue("type", initialType);
    if (initialCategory) setValue("category", initialCategory);
    if (initialSupplierId) setValue("supplierId", initialSupplierId);
  }, [initialType, initialCategory, initialSupplierId, setValue]);

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
    queryFn: async () => await getAccounts(),
    enabled: open,
    initialData: initialAccounts,
    placeholderData: keepPreviousData,
  });

  const paymentMethod = watch("paymentMethod");

  const filteredAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];
    if (paymentMethod === "CASH") return accounts.filter(a => a.type === "CASH");
    if (paymentMethod === "CARD") return accounts.filter(a => a.type === "POS" || a.type === "CREDIT_CARD");
    if (paymentMethod === "TRANSFER") return accounts.filter(a => a.type === "BANK");
    return accounts;
  }, [accounts, paymentMethod]);

  useEffect(() => {
    if (!open || filteredAccounts.length === 0) return;
    const currentAccountId = watch("accountId");
    const isCurrentValid = currentAccountId ? filteredAccounts.some(a => a.id === currentAccountId) : false;
    if (!isCurrentValid) {
      setValue("accountId", filteredAccounts[0].id, { shouldValidate: true });
    }
  }, [open, filteredAccounts, setValue, watch]);

  const { data: recentTransactions = [] } = useQuery<any[]>({
    queryKey: ["transactions", { pageSize: 4 }],
    queryFn: async () => await getTransactions({ pageSize: 4 }),
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

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["suppliers-simple"],
    queryFn: async () => await getSuppliersSimple(),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const selectedSupplierId = watch("supplierId");
  const selectedSupplierAction = watch("supplierAction") || "PAYMENT";
  const selectedSupplier = useMemo(() => {
    return (suppliers || []).find((s: any) => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

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
        supplierId: (data.category === "TEDARİKÇİ" || data.supplierId) ? (data.supplierId || undefined) : undefined,
        supplierAction: data.supplierAction,
        attachments,
      });
    },
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const successMsg = initialData
        ? "İşlem güncellendi."
        : transactionType === "EXPENSE"
          ? "Gider başarıyla girildi."
          : "Gelir başarıyla girildi.";
      toast.success(successMsg);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-session"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-history"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-history-report"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-init"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-revenue-analysis"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stat-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["cash-balance-monthly-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["account-analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["pos-initial-data"] }),
        queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
        queryClient.invalidateQueries({ queryKey: ["suppliers-simple"] }),
        queryClient.invalidateQueries({ queryKey: ["supplier"] }),
        queryClient.invalidateQueries({ queryKey: ["supplier-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["supplier-detail"] }),
      ]);
      if (initialData) {
        setOpen(false);
        setRemovedAttachmentIds([]);
      } else {
        // Modal açık tutulur, ardı ardına işlem girilebilmesi sağlanır
        setValue("amount", "");
        setValue("description", "");
        setValue("manualCategory", "");
        setAttachments([]);
        setRemovedAttachmentIds([]);
      }
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
      return (convertedAmounts.TRY || amountValue) > (selectedAccount.availableBalance || 0);
    }

    // For Cash/Bank, check against current balance
    return false; // Cash/Bank/POS accounts allow expenses exceeding balance (tracked as deficit)
  }, [transactionType, selectedAccount, amountValue]);

  const balanceImpactPreview = useMemo(() => {
    if (!selectedAccount || selectedAccount.type === "CREDIT_CARD") return null;
    const currentBal = Number(selectedAccount.balance || 0);
    const tryDelta = convertedAmounts.TRY || 0;
    if (tryDelta <= 0) return null;

    if (transactionType === "EXPENSE") {
      const nextBal = currentBal - tryDelta;
      if (nextBal >= -0.004) return null;
      return {
        mode: "DEFICIT" as const,
        currentBal,
        nextBal,
      };
    }

    if (currentBal < -0.004) {
      const nextBal = currentBal + tryDelta;
      return {
        mode: "PAYDOWN" as const,
        currentBal,
        nextBal,
      };
    }

    return null;
  }, [selectedAccount, transactionType, convertedAmounts.TRY]);

  // Smart Eye Keyword Dictionary for Proactive Category Recommendations
  const SMART_CATEGORY_MAP: { keywords: string[]; category: string; label: string }[] = useMemo(() => [
    { keywords: ["tedarikçi", "toptan", "toptancı", "byrox", "syrox", "deji", "dramex", "parça alımı"], category: "TEDARİKÇİ", label: "Tedarikçi / Toptancı" },
    { keywords: ["kira", "dükkan kirası", "depo kirası", "aidat"], category: "KİRA", label: "Kira / Gider" },
    { keywords: ["elektrik", "fatura", "su", "internet", "doğalgaz", "turkcell", "vodafone", "telekom", "enerjisa"], category: "FATURA", label: "Fatura Ödemesi" },
    { keywords: ["maaş", "avans", "personel", "prim", "yevmiye"], category: "MAAŞ", label: "Maaş Ödemesi" },
    { keywords: ["stok", "malzeme", "ürün alımı"], category: "STOK", label: "Stok Alımı" },
    { keywords: ["yemek", "öğle yemeği", "restoran", "lokanta", "çay", "kahve", "ikram", "pasta"], category: "YEMEK", label: "Yemek Gideri" },
  ], []);

  const smartCategorySuggestion = useMemo(() => {
    const desc = watch("description");
    const currentCat = watch("category");
    if (transactionType !== "EXPENSE" || !desc?.trim()) return null;
    if (currentCat && currentCat !== "GENEL" && currentCat !== "DİĞER") return null;

    const lowerDesc = desc.toLowerCase();
    for (const item of SMART_CATEGORY_MAP) {
      if (item.keywords.some(kw => lowerDesc.includes(kw))) {
        return item;
      }
    }
    return null;
  }, [transactionType, watch("description"), watch("category"), SMART_CATEGORY_MAP]);

  // High Cash Drain Guardrail: Warn if expense exceeds 50% of the active physical cash balance
  const cashDrainWarning = useMemo(() => {
    if (transactionType !== "EXPENSE" || !selectedAccount || selectedAccount.type !== "CASH" || !amountValue) return null;
    const balance = Number(selectedAccount.balance || 0);
    if (balance <= 0) return null;
    const ratio = amountValue / balance;
    if (ratio >= 0.5 && amountValue <= balance) {
      return {
        ratio: Math.round(ratio * 100),
        balance,
      };
    }
    return null;
  }, [transactionType, selectedAccount, amountValue]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (isInsufficient) {
      toast.error("Kart limiti yetersiz! Bu işlem yapılamaz.");
      return;
    }
    if ((data.category === "TEDARİKÇİ" || data.supplierId) && !data.supplierId) {
      toast.error("Lütfen bir tedarikçi seçiniz.");
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent className="max-w-[1040px] w-[95vw] sm:w-full border border-border/70 p-0 overflow-hidden bg-background text-foreground rounded-3xl shadow-2xl flex flex-col lg:flex-row h-[92dvh] lg:h-auto max-h-[92dvh] lg:max-h-[880px]">
        {/* Header Gradient Stripe */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-rose-500 z-50 opacity-80" />

        {/* Left Side: Form */}
        <div className="flex-1 lg:flex-[1.45] p-6 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar bg-background">
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
                <Select onValueChange={(val) => setValue("category", val)} value={categoryValue || "GENEL"}>
                  <SelectTrigger className="h-14 rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs shadow-none hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all font-medium text-foreground">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[1.2rem] border-zinc-200 dark:border-zinc-700 bg-background/95 backdrop-blur-xl p-2 shadow-2xl">
                    <SelectItem value="GENEL" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Genel İşlem</SelectItem>
                    <SelectItem value="TEDARİKÇİ" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">🏢 Tedarikçi / Toptancı</SelectItem>
                    <SelectItem value="STOK" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Stok Alımı</SelectItem>
                    <SelectItem value="KİRA" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Kira / Gider</SelectItem>
                    <SelectItem value="MAAŞ" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Maaş Ödemesi</SelectItem>
                    <SelectItem value="FATURA" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Fatura Ödemesi</SelectItem>
                    <SelectItem value="YEMEK" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Yemek Gideri</SelectItem>
                    <SelectItem value="DİĞER" className="text-xs rounded-xl py-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-foreground font-medium cursor-pointer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                {categoryValue !== "TEDARİKÇİ" && !selectedSupplierId && (
                  <button
                    type="button"
                    onClick={() => setValue("category", "TEDARİKÇİ")}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 mt-1.5 ml-1 transition-colors"
                  >
                    <Building2 className="w-3 h-3" /> Tedarikçi Borcu / Ödemesi Bağla
                  </button>
                )}
                {categoryValue === "DİĞER" && (
                  <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                    <Input
                      {...register("manualCategory")}
                      placeholder="İşlem türünü yazınız... (Örn: Kırtasiye Gideri)"
                      className="h-12 rounded-[1rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs px-4"
                    />
                  </div>
                )}

                {/* Smart Eye Category Recommendation */}
                {smartCategorySuggestion && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 animate-in fade-in slide-in-from-top-1 text-xs mt-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
                      <span className="text-[11px] font-bold text-foreground truncate">
                        Akıllı Göz: Yazdığınız açıklama <strong>"{smartCategorySuggestion.label}"</strong> ile uyuşuyor.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("category", smartCategorySuggestion.category);
                        toast.success(`Kategori "${smartCategorySuggestion.label}" olarak güncellendi.`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] tracking-wide shrink-0 transition-all active:scale-95 shadow-sm ml-2"
                    >
                      Kategoriye Uygula
                    </button>
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

            {/* Supplier / Tedarikçi Borç & Ödeme Entegrasyon Paneli */}
            {(categoryValue === "TEDARİKÇİ" || !!selectedSupplierId) && (
              <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> TEDARİKÇİ VE CARİ HESAP YÖNETİMİ
                  </Label>
                  <div className="flex items-center gap-2">
                    {selectedSupplier && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline">
                        {selectedSupplier.phone ? `İletişim: ${selectedSupplier.phone}` : "Kayıtlı Tedarikçi"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setValue("supplierId", "");
                        if (categoryValue === "TEDARİKÇİ") setValue("category", "GENEL");
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-400 uppercase tracking-widest font-semibold flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Kaldır
                    </button>
                  </div>
                </div>

                {/* Tedarikçi Seç Dropdown */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Tedarikçi Seçimi</Label>
                  <Select
                    value={selectedSupplierId || undefined}
                    onValueChange={(val) => {
                      setValue("supplierId", val, { shouldValidate: true });
                      const supp = (suppliers || []).find((s: any) => s.id === val);
                      if (supp) {
                        const currentDesc = watch("description");
                        const currentAction = watch("supplierAction") || "PAYMENT";
                        const actionText = currentAction === "PAYMENT" ? "Tedarikçi Ödemesi" : "Ekstra Borç Girişi";
                        if (!currentDesc || currentDesc.trim() === "" || currentDesc.includes("Tedarikçi") || currentDesc.includes("Borç")) {
                          setValue("description", `${supp.name} ${actionText}`);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-background border-zinc-200 dark:border-zinc-700 text-xs shadow-none">
                      <SelectValue placeholder="İşlem yapılacak tedarikçiyi seçiniz..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-700 bg-background/95 backdrop-blur-xl p-2 max-h-60">
                      {suppliers.length === 0 ? (
                        <SelectItem value="none" disabled className="text-xs py-3 text-muted-foreground text-center">
                          Kayıtlı tedarikçi bulunamadı
                        </SelectItem>
                      ) : (
                        suppliers.map((s: any) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs rounded-xl py-2.5 cursor-pointer">
                            <div className="flex items-center justify-between w-full min-w-[280px] gap-4">
                              <span className="font-semibold text-foreground truncate">{s.name}</span>
                              <span className={cn(
                                "font-bold text-[11px] shrink-0",
                                Number(s.balance || 0) > 0 ? "text-rose-500" : "text-emerald-500"
                              )}>
                                Kalan Borç: ₺{Number(s.balance || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* İşlem Yönü / Aksiyon Seçimi (GİDER için Ödeme vs Ekstra Borç) */}
                {transactionType === "EXPENSE" ? (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Tedarikçi İşlem Amacı</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setValue("supplierAction", "PAYMENT");
                          if (selectedSupplier) {
                            setValue("description", `${selectedSupplier.name} Tedarikçi Ödemesi`);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          selectedSupplierAction === "PAYMENT"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm ring-1 ring-emerald-500/30"
                            : "bg-background/40 border-border/40 text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span>Tedarikçiye Ödeme Yap (Borç Düşer)</span>
                        </div>
                        <p className="text-[10px] font-normal opacity-80 mt-1 leading-tight">
                          Kasadan para çıkar, tedarikçiye ait açık sipariş ve borçları sırayla (FIFO) kapatır.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setValue("supplierAction", "ADD_DEBT");
                          if (selectedSupplier) {
                            setValue("description", `${selectedSupplier.name} Ekstra Borç Girişi`);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          selectedSupplierAction === "ADD_DEBT"
                            ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold shadow-sm ring-1 ring-rose-500/30"
                            : "bg-background/40 border-border/40 text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>Ekstra Borç Ekle (Borç Artar)</span>
                        </div>
                        <p className="text-[10px] font-normal opacity-80 mt-1 leading-tight">
                          Tedarikçiye borç girişi yapar, cari bakiye artar ve sonraki ödemeler bu borcu kapatır.
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="font-semibold block">Tedarikçiden İade / Nakit Tahsilat</span>
                    <span className="text-[10px] opacity-80">Kasaya nakit girer ve tedarikçiye olan borçtan düşülür.</span>
                  </div>
                )}

                {/* Canlı Bakiye Simülasyonu */}
                {selectedSupplier && (
                  <div className="p-3.5 rounded-xl bg-background/90 border border-border/60 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-muted/40">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-medium">Mevcut Borç</span>
                        <span className="text-xs sm:text-sm font-bold text-rose-500">
                          ₺{Number(selectedSupplier.balance || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-muted/40">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-medium">İşlem Tutarı (TL)</span>
                        <span className={cn(
                          "text-xs sm:text-sm font-bold",
                          selectedSupplierAction === "PAYMENT" ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {selectedSupplierAction === "PAYMENT" ? "-" : "+"}₺{convertedAmounts.TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-[9px] uppercase tracking-wider text-primary font-semibold block">Son Bakiye</span>
                        <span className="text-xs sm:text-sm font-black text-foreground">
                          ₺{(() => {
                            const currentBal = Number(selectedSupplier.balance || 0);
                            const delta = convertedAmounts.TRY || 0;
                            const nextBal = selectedSupplierAction === "PAYMENT"
                              ? Math.max(0, currentBal - delta)
                              : currentBal + delta;
                            return nextBal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground text-center font-medium leading-tight">
                      {selectedSupplierAction === "PAYMENT"
                        ? `İşlem tamamlandığında ${selectedSupplier.name} borcu ₺${convertedAmounts.TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} azalacaktır.`
                        : `İşlem tamamlandığında ${selectedSupplier.name} borcu ₺${convertedAmounts.TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} artacaktır.`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

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
                <Select onValueChange={(val) => setValue("accountId", val, { shouldValidate: true })} value={watch("accountId") || undefined}>
                  <SelectTrigger className="h-14 rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs shadow-none">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover p-2 min-w-[320px]">
                    {filteredAccounts.length === 0 ? (
                      <SelectItem value="none" disabled className="text-xs py-3 text-center text-muted-foreground">
                        Kasa bulunamadı. Lütfen yeni kasa ekleyin.
                      </SelectItem>
                    ) : filteredAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id} className="text-xs rounded-xl py-3 pr-8 text-foreground font-medium cursor-pointer">
                        <div className="flex items-center justify-between w-full min-w-[260px] gap-4 pointer-events-none">
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
                            Number(acc.balance) >= 0 ? "text-emerald-500" : "text-foreground"
                          )}>
                            <KasaBalanceText
                              balance={acc.balance}
                              currency={acc.currency || "TRY"}
                              accountType={acc.type}
                              minimumFractionDigits={0}
                              maximumFractionDigits={2}
                              mainClassName={acc.type === "CREDIT_CARD" && Number(acc.balance) < 0 ? "text-rose-500" : undefined}
                            />
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
                    <p className="text-[10px] text-rose-500 font-medium">Bu kartın kullanılabilir limiti yetersiz! İşlem yapılamaz.</p>
                  </div>
                )}

                {balanceImpactPreview?.mode === "DEFICIT" && (
                  <div className="flex items-start gap-2.5 mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                      Bu gider kasa bakiyesini aşıyor. İşlem sonrası kasa{" "}
                      <KasaBalanceText balance={balanceImpactPreview.nextBal} className="font-bold text-foreground" />{" "}
                      olarak görünecek ve sonraki satış/gelirler öncelikle bu gider açığından düşülecektir.
                    </p>
                  </div>
                )}

                {balanceImpactPreview?.mode === "PAYDOWN" && (
                  <div className="flex items-start gap-2.5 mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 animate-in fade-in slide-in-from-top-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                      Bu gelir mevcut{" "}
                      <span className="text-rose-500 font-bold">
                        (-₺{Math.abs(balanceImpactPreview.currentBal).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>{" "}
                      gider açığından düşülecek. İşlem sonrası kasa:{" "}
                      <KasaBalanceText balance={balanceImpactPreview.nextBal} className="font-bold text-foreground" />
                    </p>
                  </div>
                )}

                {/* Smart Eye Cash Drain Guardrail */}
                {cashDrainWarning && !isInsufficient && (
                  <div className="flex items-start gap-2.5 mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-wider">Nakit Kasa Güvenlik Bildirimi</p>
                      <p className="text-[10px] opacity-90 leading-relaxed mt-0.5">
                        Bu harcama eldeki nakit kasanın %{cashDrainWarning.ratio}'sini ({formatMoney(cashDrainWarning.balance, "TRY")} bakiyeden) kullanacaktır. Nakit akışı güvenliği için banka havalesi veya şirket kartı hesabını tercih edebilirsiniz.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> İŞLEM TARİHİ VE SAATİ
                </Label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setValue("date", format(new Date(), "yyyy-MM-dd'T'HH:mm"), { shouldValidate: true })}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    Şimdi (Bugün)
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("date", format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"), { shouldValidate: true })}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all shadow-sm active:scale-95"
                  >
                    Dün
                  </button>
                </div>
              </div>
              <Input
                type="datetime-local"
                {...register("date")}
                className="h-14 rounded-[1.2rem] bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-xs px-5 shadow-none focus-visible:ring-primary/20 transition-all font-semibold"
              />
              {(() => {
                const dateVal = watch("date");
                if (!dateVal) return null;
                const parsed = new Date(dateVal);
                if (isNaN(parsed.getTime())) return null;

                const isDateToday = isToday(parsed);
                const isDateFuture = isAfter(startOfDay(parsed), startOfDay(new Date()));

                if (isDateFuture) {
                  return (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs animate-in fade-in">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-medium leading-tight">
                        İleri tarihli işlem: Bu kayıt doğrudan <strong>Randevu / Ajanda Planlaması</strong>'na aktarılacaktır.
                      </span>
                    </div>
                  );
                }

                if (isDateToday) {
                  return (
                    <div className="flex items-center gap-2 px-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-medium">
                        Canlı Kayıt: İşlem bugünün tarihi ve canlı saati ({format(parsed, "HH:mm")}) ile kaydedilecektir.
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">
                      Geçmiş Gün Kaydı: İşlem <strong>{format(parsed, "d MMMM yyyy HH:mm", { locale: tr })}</strong> tarihine işlenecektir.
                    </span>
                  </div>
                );
              })()}
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

            <div className="sticky -bottom-6 md:-bottom-8 lg:-bottom-10 -mx-6 md:-mx-8 lg:-mx-10 mt-6 flex gap-3 border-t border-border/70 bg-background/95 px-6 md:px-8 lg:px-10 pb-6 md:pb-8 lg:pb-10 pt-4 backdrop-blur-xl z-10">
              <Button type="button" variant="cancel" onClick={() => setOpen(false)} disabled={isPending} className="h-14 flex-1 rounded-2xl text-xs font-semibold uppercase tracking-widest">İptal</Button>
              <Button type="submit" disabled={isPending || isInsufficient} className={cn(
                "h-14 flex-[1.6] rounded-2xl text-xs font-semibold uppercase tracking-widest text-white gap-2 shadow-xl",
                transactionType === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20",
                isInsufficient && "opacity-50 cursor-not-allowed grayscale"
              )}>
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {initialData ? 'Güncelle' : transactionType === "INCOME" ? 'Gelir Kaydet' : 'Gider Kaydet'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Side: Sidebar */}
        <div className="hidden lg:flex flex-[0.6] bg-zinc-50/50 dark:bg-zinc-900/30 border-l border-zinc-200 dark:border-zinc-800 p-8 md:p-10 flex-col h-full overflow-hidden">
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
                          <KasaBalanceText
                            balance={acc.balance}
                            currency={acc.currency || "TRY"}
                            accountType={acc.type}
                          />
                        </p>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[9px] uppercase flex items-center gap-1.5",
                          acc.balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {acc.balance >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {acc.balance >= 0 ? "+ %4.2 BUGÜN" : acc.type !== "CREDIT_CARD" ? "GİDER AÇIĞI" : "- %1.5 BUGÜN"}
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
                        {(() => {
                          if (!tx.createdAt) return "--:--";
                          const date = new Date(tx.createdAt);
                          return !isNaN(date.getTime()) ? format(date, "HH:mm") : "--:--";
                        })()} • {tx.financeAccount?.name || "Bilinmiyor"}
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
