"use client";

import { KasaBalanceText } from "@/components/finance/kasa-balance-text";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, BadgeCheck, RotateCcw, Globe, X, Camera, FileText, Loader2, Upload, CheckCircle2, Search, Info, ShieldCheck, AlertCircle, Wallet, Banknote, Sparkles, ScanLine, UserPlus, UserCheck, Check,
} from "lucide-react";
import { createDeviceEntry } from "@/lib/actions/device-hub-actions";
import { getAccounts, createAccount } from "@/lib/actions/finance-actions";
import { getCustomersPaginated, createCustomerMuted } from "@/lib/actions/customer-actions";
import { Badge } from "@/components/ui/badge";
import { analyzeDeviceImageWithAI } from "@/lib/actions/gemini-actions";
import { toast } from "sonner";
import { APPLE_COLORS, getColorHex } from "@/lib/device-utils";
import { cleanFormData } from "@/lib/formatters";
import { BorderBeam } from "border-beam";
import { SmartImeiInput } from "@/components/imei/SmartImeiInput";
import {
  normalizeImeiDigits,
  resolveCanonicalBrandOption,
  type BtkClassification,
  type ImeiLookupResult,
} from "@/lib/imei-utils";

type Condition = "NEW" | "USED" | "INTERNATIONAL";

/* ─── Utility helpers ─── */
function formatCurrencyInput(val: string): string {
  const numeric = val.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("tr-TR").format(parseInt(numeric));
}

function parseCurrencyInput(val: string): string {
  return val.replace(/\D/g, "");
}

function normalizeRam(val?: string): string {
  if (!val) return "";
  const cleaned = val.toUpperCase().replace(/\s+/g, "");
  const numMatch = cleaned.match(/(\d+)(GB|G)?/);
  if (numMatch) {
    const num = numMatch[1];
    return `${num} GB`;
  }
  return val;
}

function normalizeStorage(val?: string): string {
  if (!val) return "";
  const cleaned = val.toUpperCase().replace(/\s+/g, "");
  if (cleaned.includes("1TB")) return "1 TB";
  if (cleaned.includes("2TB")) return "2 TB";
  const numMatch = cleaned.match(/(\d+)(GB|G|ROM)?/);
  if (numMatch) {
    const num = numMatch[1];
    return `${num} GB`;
  }
  return val;
}

async function compressImage(file: File, maxDimension = 1800, quality = 0.85): Promise<{ base64: string; mimeType: string; file: File }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ base64: e.target?.result as string, mimeType: file.type || "image/jpeg", file });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = "image/jpeg";
        const base64 = canvas.toDataURL(mimeType, quality);
        
        canvas.toBlob((blob) => {
          const finalFile = blob ? new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: mimeType }) : file;
          resolve({ base64, mimeType, file: finalFile });
        }, mimeType, quality);
      };
      img.onerror = () => {
        // Fallback if image tag cannot decode (never block user)
        resolve({ base64: e.target?.result as string, mimeType: file.type || "image/jpeg", file });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

const POPULAR_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Redmi", "Poco", "Huawei", "Honor",
  "Oppo", "Realme", "Vivo", "Google", "OnePlus", "Infinix", "Tecno",
];

const WARRANTY_MONTHS_OPTIONS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

/* ─── Zod schema ─── */
const deviceSchema = z.object({
  brand: z.string().min(1, "Marka gereklidir"),
  model: z.string().min(1, "Model gereklidir"),
  imei: z.string().length(15, "IMEI 15 haneli olmalıdır"),
  serialNumber: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  ram: z.string().optional().or(z.literal("")),
  storage: z.string().optional().or(z.literal("")),
  warrantyEndDate: z.string().optional().or(z.literal("")),
  warrantyMonths: z.string().optional().or(z.literal("")),
  sim1ExpirationDate: z.string().optional().or(z.literal("")),
  sim1NotUsed: z.boolean().default(false),
  sim2ExpirationDate: z.string().optional().or(z.literal("")),
  sim2NotUsed: z.boolean().default(false),
  batteryHealth: z.string().optional().or(z.literal("")),
  cosmeticScore: z.string().optional().or(z.literal("")),
  replacedParts: z.string().optional().or(z.literal("")),
  condition: z.enum(["NEW", "USED", "INTERNATIONAL"]),
  financeAccountId: z.string().min(1, "Ödeme hesabı seçilmelidir"),
  buyPrice: z
    .string()
    .min(1, "Alış fiyatı gereklidir")
    .transform((v) => parseCurrencyInput(v))
    .refine((v) => parseFloat(v) > 0, "Alış fiyatı 0'dan büyük olmalıdır"),
  sellPrice: z
    .string()
    .min(1, "Satış fiyatı gereklidir")
    .transform((v) => parseCurrencyInput(v))
    .refine((v) => parseFloat(v) > 0, "Satış fiyatı 0'dan büyük olmalıdır"),
  // Seller Info
  sellerName: z.string().optional().or(z.literal("")),
  sellerTC: z.string().optional().or(z.literal("")),
  sellerPhone: z.string().optional().or(z.literal("")),
  sellerIdPhotoUrl: z.string().optional().or(z.literal("")),
}).refine((data) => parseFloat(data.sellPrice) >= parseFloat(data.buyPrice), {
  message: "Satış fiyatı alış fiyatından düşük olamaz",
  path: ["sellPrice"],
});

interface DeviceFormValues {
  brand: string;
  model: string;
  imei: string;
  serialNumber?: string;
  color?: string;
  ram?: string;
  storage?: string;
  warrantyEndDate?: string;
  warrantyMonths?: string;
  sim1ExpirationDate?: string;
  sim1NotUsed: boolean;
  sim2ExpirationDate?: string;
  sim2NotUsed: boolean;
  batteryHealth?: string;
  cosmeticScore?: string;
  replacedParts?: string;
  condition: Condition;
  financeAccountId: string;
  buyPrice: string;
  sellPrice: string;
  sellerName?: string;
  sellerTC?: string;
  sellerPhone?: string;
  sellerIdFrontUrl?: string;
  sellerIdBackUrl?: string;
}

/* ─── Component ─── */
export function CreateDeviceModal({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [sellerIdFront, setSellerIdFront] = useState<File | null>(null);
  const [sellerIdBack, setSellerIdBack] = useState<File | null>(null);
  const [warrantyMode, setWarrantyMode] = useState<"date" | "months" | "intl">("months");
  const [showQuickAccount, setShowQuickAccount] = useState(false);
  const [quickAccountName, setQuickAccountName] = useState("Merkez Kasa");
  const [quickAccountType, setQuickAccountType] = useState<"CASH" | "BANK">("CASH");
  const [quickAccountBalance, setQuickAccountBalance] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Customer search & sync state
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);
  const [isQuickRegisteringCustomer, setIsQuickRegisteringCustomer] = useState(false);
  const customerSearchContainerRef = useRef<HTMLDivElement>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const aiPhotoInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const sellerIdFrontInputRef = useRef<HTMLInputElement>(null);
  const sellerIdBackInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema) as any,
    defaultValues: {
      condition: "NEW",
      brand: "",
      model: "",
      imei: "",
      serialNumber: "",
      buyPrice: "",
      sellPrice: "",
      cosmeticScore: "10",
      batteryHealth: "100",
      warrantyMonths: "24",
      sim1NotUsed: false,
      sim2NotUsed: false,
      financeAccountId: "",
    },
  });

  const condition = watch("condition");
  const selectedBrand = watch("brand");
  const selectedColor = watch("color");
  const sim1NotUsed = watch("sim1NotUsed");
  const sim2NotUsed = watch("sim2NotUsed");
  const sellerNameValue = watch("sellerName");
  const sellerPhoneValue = watch("sellerPhone");

  // Pre-fill from Quick IMEI Lookup ("Cihaz Alımına Aktar")
  useEffect(() => {
    const shouldOpen = searchParams.get("newDevice") === "1";
    const paramImei = searchParams.get("imei");
    const paramBrand = searchParams.get("brand");
    const paramModel = searchParams.get("model");
    const paramBtk = searchParams.get("btkStatus") as BtkClassification | null;

    if (!shouldOpen && !paramImei) return;

    setOpen(true);
    const cleanImei = normalizeImeiDigits(paramImei);
    if (cleanImei) {
      setValue("imei", cleanImei, { shouldValidate: true });
    }
    if (paramBrand) {
      const canonical = resolveCanonicalBrandOption(paramBrand, POPULAR_BRANDS);
      if (canonical) {
        setValue("brand", canonical, { shouldValidate: true });
      }
    }
    if (paramModel) {
      setValue("model", paramModel, { shouldValidate: true });
    }
    if (paramBtk === "KAYITSIZ") {
      setValue("condition", "INTERNATIONAL", { shouldValidate: true });
      setWarrantyMode("intl");
    }
  }, [searchParams, setValue]);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen && searchParams.get("newDevice")) {
        router.replace("/cihaz-listesi");
      }
    },
    [router, searchParams]
  );

  const handleImeiLookupComplete = useCallback(
    (result: ImeiLookupResult) => {
      if (result.brand) {
        const canonical = resolveCanonicalBrandOption(result.brand, POPULAR_BRANDS);
        if (canonical) {
          setValue("brand", canonical, { shouldValidate: true });
        }
      }
      if (result.model) {
        setValue("model", result.model, { shouldValidate: true });
      }
      if (result.btk?.classification === "KAYITSIZ") {
        setValue("condition", "INTERNATIONAL", { shouldValidate: true });
        setWarrantyMode("intl");
        toast.warning("BTK Kayıtsız Cihaz: Cihaz durumu 'Yurtdışı' olarak işaretlendi.");
      } else if (result.btk?.classification === "KLONLU") {
        toast.error("UYARI: Bu IMEI BTK kayıtlarında KLONLANMIŞ / KARA LİSTE olarak görünüyor!");
      }
    },
    [setValue]
  );

  // Click outside to close customer search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerSearchContainerRef.current && !customerSearchContainerRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced customer search
  useEffect(() => {
    if (!customerSearchText || customerSearchText.trim().length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        const res = await getCustomersPaginated({ search: customerSearchText.trim(), limit: 5 });
        setCustomerSearchResults(res?.data || []);
        setShowCustomerDropdown(true);
      } catch (err) {
        console.error("Error searching customers:", err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearchText]);

  // Select customer from dropdown
  const handleSelectCustomer = (customer: any) => {
    setMatchedCustomer(customer);
    setValue("sellerName", customer.name || "", { shouldValidate: true });
    setValue("sellerPhone", customer.phone || "", { shouldValidate: true });
    setCustomerSearchText("");
    setShowCustomerDropdown(false);
    toast.success(`Kayıtlı müşteri seçildi: ${customer.name}`);
  };

  const handleClearSelectedCustomer = () => {
    setMatchedCustomer(null);
    setValue("sellerName", "");
    setValue("sellerPhone", "");
    setValue("sellerTC", "");
    setCustomerSearchText("");
  };

  // Quick register customer
  const handleQuickRegisterCustomer = async () => {
    const name = watch("sellerName")?.trim();
    const phone = watch("sellerPhone")?.trim();
    if (!name && !phone) {
      toast.error("Lütfen en az bir ad soyad veya telefon numarası giriniz.");
      return;
    }
    setIsQuickRegisteringCustomer(true);
    try {
      const res = await createCustomerMuted({
        name: name || "Müşteri",
        phone: phone || undefined,
      });
      if (res.success && res.customer) {
        setMatchedCustomer(res.customer);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customers-paginated"] });
        if (res.alreadyExisted) {
          toast.info(`Müşteri sistemde zaten mevcut: ${res.customer.name}`);
        } else {
          toast.success(`"${res.customer.name}" müşteriler sayfasına kaydedildi!`);
        }
      } else {
        toast.error(res.error || "Müşteri kaydedilemedi.");
      }
    } catch {
      toast.error("Kayıt sırasında hata oluştu.");
    } finally {
      setIsQuickRegisteringCustomer(false);
    }
  };

  const isNew = condition === "NEW";
  const isIntl = condition === "INTERNATIONAL";

  // BAŞAR AI Cihaz Kutusu / Görsel Analiz Tetikleyicisi
  const handleAiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    const toastId = toast.loading("Görsel taranıyor, BAŞAR AI kutu etiketini ve IMEI bilgilerini okuyor...");

    try {
      const compressed = await compressImage(file);
      const res = await analyzeDeviceImageWithAI({
        base64: compressed.base64,
        mimeType: compressed.mimeType,
      });

      if (!res.success) {
        toast.error(res.error || "Görselden cihaz bilgisi okunamadı. Lütfen etiketin net bir fotoğrafını yükleyin.", { id: toastId });
        return;
      }

      const d = res.data;

      // Otomatik olarak kayıt modalını aç
      setOpen(true);

      // Kutu görselini cihazın fotoğraf galerisine ekle ("ve görseli kaydetsin")
      setPhotoFiles((prev) => [compressed.file, ...prev.filter(f => f.name !== compressed.file.name)]);

      // Marka eşleştirme
      let matchedBrand = d.brand;
      const foundBrand = POPULAR_BRANDS.find(b => b.toLowerCase() === d.brand.toLowerCase());
      if (foundBrand) {
        matchedBrand = foundBrand;
      } else if (d.brand.toLowerCase().includes("redmi") || d.brand.toLowerCase().includes("xiaomi")) {
        matchedBrand = "Xiaomi";
      }

      setValue("brand", matchedBrand, { shouldValidate: true });
      setValue("model", d.model, { shouldValidate: true });
      setValue("imei", d.imei, { shouldValidate: true });

      if (d.serialNumber) {
        setValue("serialNumber", d.serialNumber);
      }

      if (d.color) {
        setValue("color", d.color);
      }

      const normRam = normalizeRam(d.ram);
      if (normRam) {
        setValue("ram", normRam, { shouldValidate: true });
      }

      const normStorage = normalizeStorage(d.storage);
      if (normStorage) {
        setValue("storage", normStorage, { shouldValidate: true });
      }

      if (d.condition) {
        setValue("condition", d.condition);
      }

      if (d.cosmeticScore) {
        setValue("cosmeticScore", d.cosmeticScore);
      }

      if (d.batteryHealth) {
        setValue("batteryHealth", d.batteryHealth);
      }

      if (d.warrantyMonths) {
        setValue("warrantyMonths", d.warrantyMonths);
      }

      // Notlar / Çift SIM / S/N
      let noteParts: string[] = [];
      if (d.imei2) noteParts.push(`Dual SIM / 2. IMEI: ${d.imei2}`);
      if (d.serialNumber) noteParts.push(`Seri No: ${d.serialNumber}`);
      if (d.notes) noteParts.push(d.notes);
      if (noteParts.length > 0) {
        setValue("replacedParts", noteParts.join(" · "));
      }

      // Kullanıcı kuralı: Alış ve satış fiyatı boş bırakılır
      setValue("buyPrice", "");
      setValue("sellPrice", "");

      toast.success("✅ Cihaz bilgileri ve IMEI başarıyla okundu! Lütfen alış ve satış fiyatını girin.", { id: toastId });

      // İmleci doğrudan Alış Fiyatı kutusuna odakla
      setTimeout(() => {
        const input = document.getElementById("buyPriceInput") as HTMLElement;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);

    } catch (err: any) {
      console.error("AI Scan Error:", err);
      toast.error(err.message || "Görsel işlenirken beklenmeyen bir hata oluştu.", { id: toastId });
    } finally {
      setIsAiAnalyzing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const rawFiles = Array.from(e.target.files);
      const processed: File[] = [];
      for (const f of rawFiles) {
        if (f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
          try {
            const comp = await compressImage(f);
            processed.push(comp.file);
          } catch {
            processed.push(f);
          }
        } else {
          processed.push(f);
        }
      }
      setPhotoFiles(prev => [...prev, ...processed]);
    }
  };

  const handleSellerIdFrontChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      try {
        const comp = await compressImage(f);
        setSellerIdFront(comp.file);
        return;
      } catch {}
    }
    setSellerIdFront(f);
  };

  const handleSellerIdBackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      try {
        const comp = await compressImage(f);
        setSellerIdBack(comp.file);
        return;
      } catch {}
    }
    setSellerIdBack(f);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  };

  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);

  const { data: accounts = [], refetch: refetchAccounts, isFetching: isFetchingAccounts } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      try {
        const result = await getAccounts();
        return result || [];
      } catch (e) {
        console.error("Failed to fetch accounts:", e);
        return [];
      }
    },
    enabled: open,
    staleTime: 0, // Always refetch when modal opens
  });

  // createDeviceMutation removed as it was replaced by direct call to avoid serialization issues
  const { mutateAsync: createDevice, isPending: isMutationPending } = useMutation({
    mutationFn: (payload: any) => createDeviceEntry(payload),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["devices"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-init"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
        queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customers-paginated"] });

        toast.success("Cihaz başarıyla envantere eklendi.");
        setOpen(false);
        reset();
        setPhotoFiles([]);
        setInvoiceFile(null);
        setSellerIdFront(null);
        setSellerIdBack(null);
        setWarrantyMode("months");
        setMatchedCustomer(null);
        setCustomerSearchText("");
        setCustomerSearchResults([]);
      } else {
        toast.error(result.error ?? "İşlem başarısız.");
      }
    },
    onError: (err: any) => {
      console.error("Device creation error:", err);
      toast.error(`Hata: ${err?.message || "Bilinmeyen bir hata oluştu."}`);
    }
  });

  const onSubmit = async (data: DeviceFormValues) => {
    setIsUploading(true);
    try {
      let sellerIdFrontUrl = "";
      let sellerIdBackUrl = "";
      let uploadedPhotoUrls: string[] = [];

      if (photoFiles.length > 0) {
        const photoFormData = new FormData();
        photoFiles.forEach(f => photoFormData.append("files", f));
        const pRes = await fetch("/api/finance/upload", { method: "POST", body: photoFormData });
        const pJson = await pRes.json();
        if (pJson.success) {
          uploadedPhotoUrls = pJson.attachments.map((a: any) => a.url);
        }
      }

      if (sellerIdFront) {
        const formData = new FormData();
        formData.append("files", sellerIdFront);
        const res = await fetch("/api/finance/upload", { method: "POST", body: formData });
        const json = await res.json();
        sellerIdFrontUrl = json.attachments[0].url;
      }

      if (sellerIdBack) {
        const formData = new FormData();
        formData.append("files", sellerIdBack);
        const res = await fetch("/api/finance/upload", { method: "POST", body: formData });
        const json = await res.json();
        sellerIdBackUrl = json.attachments[0].url;
      }

      const cleaned = cleanFormData(data, {
        brand: "title",
        model: "title",
        color: "title",
        imei: "upper",
        serialNumber: "upper",
        sellerName: "proper",
        replacedParts: "sentence"
      });

      const payload = JSON.parse(JSON.stringify({
        brand: cleaned.brand,
        model: cleaned.model,
        imei: cleaned.imei,
        serialNumber: cleaned.serialNumber || null,
        color: cleaned.color || null,
        ram: cleaned.ram || null,
        storage: cleaned.storage || null,
        condition: cleaned.condition,
        warrantyEndDate: warrantyMode === "date" && !isNew ? cleaned.warrantyEndDate || null : null,
        warrantyMonths: isNew ? "24" : (warrantyMode === "months" ? cleaned.warrantyMonths || null : null),
        sim1ExpirationDate: cleaned.sim1ExpirationDate || null,
        sim1NotUsed: !!cleaned.sim1NotUsed,
        sim2ExpirationDate: cleaned.sim2ExpirationDate || null,
        sim2NotUsed: !!cleaned.sim2NotUsed,
        batteryHealth: cleaned.batteryHealth ? parseInt(cleaned.batteryHealth) : null,
        cosmeticScore: parseInt(cleaned.cosmeticScore || "10"),
        expertChecklist: cleaned.replacedParts ? { notes: cleaned.replacedParts } : {},
        buyPrice: parseFloat(cleaned.buyPrice),
        sellPrice: parseFloat(cleaned.sellPrice),
        financeAccountId: cleaned.financeAccountId,
        sellerName: cleaned.sellerName || null,
        sellerTC: cleaned.sellerTC || null,
        sellerPhone: cleaned.sellerPhone || null,
        sellerIdPhotoUrl: sellerIdFrontUrl || null,
        photoUrls: uploadedPhotoUrls,
        invoiceUrl: null,
      }));

      await createDevice(payload);
    } catch (err: any) {
      // Error is handled in mutation onError
    } finally {
      setIsUploading(false);
    }
  };

  /* ─── Subcomponent: Condition Card ─── */
  const ConditionCard = ({
    type, icon: Icon, title, desc, color,
  }: { type: Condition; icon: any; title: string; desc: string; color: string }) => {
    const active = condition === type;
    const colorMap: Record<string, string> = {
      emerald: active ? "border-emerald-500 bg-emerald-500/5" : "border-border bg-card hover:border-emerald-500/40",
      amber: active ? "border-amber-500 bg-amber-500/5" : "border-border bg-card hover:border-amber-500/40",
      purple: active ? "border-purple-500 bg-purple-500/5" : "border-border bg-card hover:border-purple-500/40",
    };
    const iconBg: Record<string, string> = {
      emerald: active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/80",
      amber: active ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground/80",
      purple: active ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground/80",
    };
    const colorText: Record<string, string> = {
      emerald: active ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground/80",
      amber: active ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground/80",
      purple: active ? "text-purple-600 dark:text-purple-400 font-bold" : "text-muted-foreground/80",
    };
    const dotBg: Record<string, string> = {
      emerald: "bg-emerald-500", amber: "bg-amber-500", purple: "bg-purple-500",
    };
    return (
      <button
        type="button"
        onClick={() => setValue("condition", type)}
        className={`flex items-start gap-3 p-4 rounded-2xl transition-all border-2 text-left relative overflow-hidden ${colorMap[color]}`}
      >
        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${iconBg[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h4 className={`text-[14px] leading-tight ${colorText[color]}`}>{title}</h4>
          <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5 leading-snug">{desc}</p>
        </div>
        {active && <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${dotBg[color]}`} />}
      </button>
    );
  };

  const inputCls = "bg-background border-border rounded-xl h-11 text-[13px] font-medium text-foreground placeholder:text-muted-foreground/50";
  const labelCls = "text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-0.5";
  const sectionCls = "p-5 rounded-2xl bg-card border border-border/60 space-y-4";

  return (
    <>
      <input
        ref={aiPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleAiImageUpload}
      />

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <BorderBeam size="sm" colorVariant="colorful" strength={0.8} className="rounded-2xl inline-flex">
        <Button
          type="button"
          onClick={() => aiPhotoInputRef.current?.click()}
          disabled={isAiAnalyzing}
          className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2.5 h-10 sm:h-12 px-4 sm:px-6 rounded-2xl transition-all shadow-xl shadow-indigo-500/25 text-xs sm:text-[13px] font-bold tracking-wide group flex items-center border border-indigo-400/30 active:scale-[0.98]"
        >
          {isAiAnalyzing ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform text-white" />
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-300 absolute -top-1.5 -right-2 animate-pulse" />
            </div>
          )}
          <span className="font-extrabold tracking-normal">
            {isAiAnalyzing ? "Kutu Okunuyor..." : "BAŞAR AI ile Cihaz Ekle"}
          </span>
        </Button>
        </BorderBeam>

        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-muted text-foreground gap-1.5 h-10 sm:h-12 px-3 sm:px-5 rounded-2xl transition-all border border-border/80 text-xs sm:text-[13px] font-semibold flex items-center shadow-sm"
            >
              <Plus className="h-4 w-4 text-blue-500" />
              <span>Manuel Ekle</span>
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[820px] max-w-full w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] p-0 bg-background text-foreground border-0 sm:border sm:border-border shadow-2xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-7 pt-4 sm:pt-6 pb-3 sm:pb-4 flex justify-between items-start border-b border-border/60 shrink-0">
              <div>
                <DialogTitle className="font-bold text-lg sm:text-[21px] text-foreground leading-tight flex items-center gap-2 flex-wrap">
                  <span>Yeni Cihaz Kaydı</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="h-3 w-3" /> BAŞAR AI Destekli
                  </span>
                </DialogTitle>
                <p className="text-[11px] sm:text-[12px] text-muted-foreground/80 font-medium mt-0.5">Kategori otomatik atanır · Sıfır / 2. El / Yurtdışı</p>
              </div>
            </div>

            {/* Quick in-modal AI Scan Banner */}
            <div className="mx-4 sm:mx-7 mt-3 sm:mt-5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <Camera className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-indigo-100 flex items-center gap-1.5 flex-wrap">
                    Kutu Etiketi veya Cihaz Fotoğrafı Yükle
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-normal">Hızlı Doldur</span>
                  </p>
                  <p className="text-[10px] text-indigo-300/80">Kutudaki barkodları ve IMEI'yi BAŞAR AI okuyup formu otomatik doldursun</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isAiAnalyzing}
                onClick={() => aiPhotoInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl gap-1.5 shrink-0 px-3.5 h-8 shadow-md shadow-indigo-600/30 transition-all w-full sm:w-auto justify-center"
              >
                {isAiAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                {isAiAnalyzing ? "Okunuyor..." : "Fotoğraf Seç"}
              </Button>
            </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto flex-1 px-4 sm:px-7 py-4 sm:py-5 space-y-4 sm:space-y-5 custom-scrollbar">

            {/* Condition Selection */}
            <div className="space-y-2 sm:space-y-3">
              <Label className={labelCls}>Cihaz Kondisyonu</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <ConditionCard type="NEW" icon={BadgeCheck} title="Sıfır" desc="Distribütör garantili" color="emerald" />
                <ConditionCard type="USED" icon={RotateCcw} title="2. El" desc="Kullanılmış, ekspertizli" color="amber" />
                <ConditionCard type="INTERNATIONAL" icon={Globe} title="Yurdışı" desc="Kısıtlı ithal cihaz" color="purple" />
              </div>
            </div>

            {/* Temel Bilgiler */}
            <div className={sectionCls}>
              <p className={labelCls}>Cihaz Bilgileri</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Brand Dropdown */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Marka</Label>
                  <Select
                    value={watch("brand") || ""}
                    onValueChange={(v) => setValue("brand", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Marka Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {POPULAR_BRANDS.map((b) => (
                        <SelectItem key={b} value={b} className="">{b}</SelectItem>
                      ))}
                      {watch("brand") && !POPULAR_BRANDS.includes(watch("brand")) && watch("brand") !== "Diğer" && (
                        <SelectItem value={watch("brand")} className="">{watch("brand")}</SelectItem>
                      )}
                      <SelectItem value="Diğer" className=" text-muted-foreground">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.brand && <p className="text-[10px] text-rose-500">{errors.brand.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Tam Model Adı</Label>
                  <Input {...register("model")} placeholder="iPhone 15 Pro Max" className={inputCls} />
                  {errors.model && <p className="text-[10px] text-rose-500">{errors.model.message}</p>}
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <SmartImeiInput
                    id="buyback-imei"
                    label="IMEI (15 Hane)"
                    required
                    value={watch("imei") || ""}
                    onChange={(val) => setValue("imei", val, { shouldValidate: true, shouldDirty: true })}
                    onLookupComplete={handleImeiLookupComplete}
                    error={errors.imei?.message}
                    placeholder="14 hane yazınca 15. Luhn basamağı otomatik tamamlanır"
                    variant="buyback"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <Label className={labelCls}>Seri No (S/N) (Opsiyonel)</Label>
                  <Input {...register("serialNumber")} placeholder="SN / EID / Seri Numarası" className={inputCls} />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <Label className={labelCls}>Renk Seçimi</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        {...register("color")}
                        placeholder="Örn: Yeşil, Beyaz, Mavi"
                        className={`${inputCls} pr-10`}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[0-9]/g, '');
                          setValue("color", val);
                        }}
                      />
                      {getColorHex(selectedBrand, selectedColor) && (
                        <div
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all animate-in fade-in zoom-in duration-300"
                          style={{ backgroundColor: getColorHex(selectedBrand, selectedColor) ?? undefined }}
                        />
                      )}
                    </div>
                    {selectedBrand?.toLowerCase() === "apple" && (
                      <div className="flex flex-wrap gap-2.5 p-3 bg-background/50 rounded-2xl border border-border">
                        {APPLE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setValue("color", c.name)}
                            className={`group relative flex flex-col items-center gap-1.5 transition-all outline-none`}
                          >
                            <div
                              className={`h-8 w-8 rounded-full border-2 transition-all shadow-lg ${selectedColor?.toLowerCase() === c.name.toLowerCase() ? "border-blue-500 scale-110 shadow-blue-500/30" : "border-border hover:border-slate-600 scale-100 shadow-black/40"}`}
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className={`text-[8px]  uppercase tracking-tighter transition-colors ${selectedColor?.toLowerCase() === c.name.toLowerCase() ? "text-blue-400" : "text-muted-foreground/80 group-hover:text-foreground"}`}>
                              {c.name.split(" ")[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedColor && <p className="text-[10px]  text-blue-400/80 mt-1 pl-1 capitalize">Seçilen Renk: {selectedColor}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>RAM</Label>
                  <Select
                    value={watch("ram") || ""}
                    onValueChange={(v) => setValue("ram", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Örn: 8 GB" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "24 GB", "32 GB"].map((v) => (
                        <SelectItem key={v} value={v} className="">{v}</SelectItem>
                      ))}
                      {watch("ram") && !["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "24 GB", "32 GB"].includes(watch("ram")!) && (
                        <SelectItem value={watch("ram")!}>{watch("ram")}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Dahili Depolama</Label>
                  <Select
                    value={watch("storage") || ""}
                    onValueChange={(v) => setValue("storage", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Örn: 256 GB" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"].map((v) => (
                        <SelectItem key={v} value={v} className="">{v}</SelectItem>
                      ))}
                      {watch("storage") && !["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"].includes(watch("storage")!) && (
                        <SelectItem value={watch("storage")!}>{watch("storage")}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Garanti / Aktiflik */}
            <div className={sectionCls}>
              <p className={labelCls}>{isIntl ? "IMEI Aktiflik Durumu" : "Garanti Takibi"}</p>

              {!isIntl && (
                <>
                  <div className="flex items-center bg-background rounded-xl p-1 border border-border w-fit gap-1">
                    <button type="button" onClick={() => setWarrantyMode("months")}
                      className={`px-4 py-1.5 text-xs rounded-lg transition-all ${warrantyMode === "months" ? "bg-slate-700 text-white" : "text-muted-foreground/80 hover:text-white"}`}>
                      Ay Seç
                    </button>
                    <button
                      type="button"
                      disabled={isNew}
                      onClick={() => setWarrantyMode("date")}
                      className={`px-4 py-1.5 text-xs rounded-lg transition-all ${isNew ? "opacity-30 cursor-not-allowed" : ""} ${warrantyMode === "date" ? "bg-slate-700 text-white" : "text-muted-foreground/80 hover:text-white"}`}>
                      Tarih Gir
                    </button>
                  </div>

                  {warrantyMode === "months" || isNew ? (
                    <div className="space-y-1.5">
                      <Label className={labelCls}>
                        {isNew ? "Garanti Süresi (24 Ay)" : "Kalan Garanti Süresi"}
                      </Label>
                      <Select
                        value={isNew ? "24" : (watch("warrantyMonths") || "")}
                        onValueChange={(v) => setValue("warrantyMonths", v)}
                        disabled={isNew}
                      >
                        <SelectTrigger className={inputCls}>
                          <SelectValue placeholder={isNew ? "24 Ay (Sabit)" : "Kaç ay kaldı?"} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {WARRANTY_MONTHS_OPTIONS.map((m) => (
                            <SelectItem key={m} value={String(m)} className="">
                              {m} Ay {isNew && m === 24 ? "✓ (Sabit)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isNew && (
                        <p className="text-[10px] text-emerald-400 font-medium pl-0.5 animate-pulse">
                          ✨ Sıfır cihazlarda 24 ay garanti otomatik atanmıştır. Satış yapıldığında takibe başlar.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Garanti Bitiş Tarihi</Label>
                      <Input {...register("warrantyEndDate")} type="date" className={inputCls} />
                    </div>
                  )}
                </>
              )}

              {isIntl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <Label className={labelCls}>Sim 1 Bitiş Tarihi</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sim1NotUsed"
                          checked={sim1NotUsed}
                          onCheckedChange={(checked) => setValue("sim1NotUsed", checked === true)}
                        />
                        <Label htmlFor="sim1NotUsed" className="font-medium text-[10px] text-muted-foreground/80 cursor-pointer">Kullanılmadı</Label>
                      </div>
                    </div>
                    <Input {...register("sim1ExpirationDate")} type="date" className={inputCls} disabled={sim1NotUsed} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <Label className={labelCls}>Sim 2 / E-Sim Bitiş Tarihi</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sim2NotUsed"
                          checked={sim2NotUsed}
                          onCheckedChange={(checked) => setValue("sim2NotUsed", checked === true)}
                        />
                        <Label htmlFor="sim2NotUsed" className="font-medium text-[10px] text-muted-foreground/80 cursor-pointer">Kullanılmadı</Label>
                      </div>
                    </div>
                    <Input
                      {...register("sim2ExpirationDate")}
                      type="date"
                      className={inputCls}
                      disabled={sim2NotUsed}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] text-purple-300 font-medium ">
                    💡 Yurtdışı cihazlarda her SIM için yıllık 120 gün kullanım hakkı verilir. BTK'dan kalan süreleri öğrenip manuel tarih olarak giriniz.
                  </div>
                </div>
              )}
            </div>

            {/* Ekspertiz */}
            <div className={`${sectionCls} transition-opacity ${isNew ? "opacity-40 pointer-events-none" : ""}`}>
              <p className={labelCls}>Ekspertiz &amp; Kondisyon</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Pil Sağlığı</Label>
                  <div className="relative">
                    <Input {...register("batteryHealth")} type="number" min={1} max={100} placeholder="100" className={inputCls} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground/80">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Kozmetik Durum</Label>
                  <Select
                    value={watch("cosmeticScore") || "10"}
                    onValueChange={(v) => setValue("cosmeticScore", v)}
                  >
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent className="bg-card border-border ">
                      <SelectItem value="10">Kusursuz (10/10)</SelectItem>
                      <SelectItem value="9">Çok İyi (9/10)</SelectItem>
                      <SelectItem value="8">İyi – Ufak Çizikler (8/10)</SelectItem>
                      <SelectItem value="7">Orta – Görünür Hasar (7/10)</SelectItem>
                      <SelectItem value="6">Kötü Kozmetik (6/10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <Label className={labelCls}>Değiştirilen / Onarılan Parçalar</Label>
                  <Textarea {...register("replacedParts")} placeholder="Örn: Ön cam, batarya değişimi" className="bg-background border-border rounded-xl min-h-[70px] text-[13px] font-medium placeholder:text-slate-600 resize-none p-3" />
                </div>
              </div>
            </div>

            {/* Seller Info (Müşteri Bilgileri) - With Live Search & Auto-Sync */}
            <div className={`${sectionCls} border-emerald-500/20 bg-emerald-500/5`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Satıcı (Müşteri) Bilgileri - Opsiyonel</p>
                </div>
                {matchedCustomer ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    Kayıtlı Müşteri Eşleşti
                  </Badge>
                ) : (sellerNameValue || sellerPhoneValue) ? (
                  <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold gap-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    Yeni Müşteri Kaydı Açılacak
                  </Badge>
                ) : null}
              </div>

              {/* Registered Customer Quick Search / Autocomplete */}
              <div className="relative" ref={customerSearchContainerRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    value={customerSearchText}
                    onChange={(e) => {
                      setCustomerSearchText(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => {
                      if (customerSearchResults.length > 0) setShowCustomerDropdown(true);
                    }}
                    placeholder="Sistemdeki kayıtlı müşterilerde ara (Ad Soyad veya Telefon)..."
                    className={`${inputCls} pl-9 h-10 text-xs bg-background/80`}
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    </div>
                  )}
                  {customerSearchText && !isSearchingCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchText("");
                        setShowCustomerDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border shadow-2xl rounded-xl p-1.5 max-h-48 overflow-y-auto space-y-1 backdrop-blur-xl">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Eşleşen Müşteriler</p>
                    {customerSearchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-emerald-400 truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.phone || "Telefon Kayıtlı Değil"}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 shrink-0 ml-2">
                          Seç & Doldur
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Selected Customer Bar */}
              {matchedCustomer && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-400 truncate">{matchedCustomer.name}</p>
                      <p className="text-[10px] text-muted-foreground">{matchedCustomer.phone || "Telefon Yok"}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedCustomer}
                    className="h-7 px-2 text-[10px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1"
                  >
                    <X className="w-3 h-3" /> Değiştir
                  </Button>
                </div>
              )}

              {/* Direct Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Ad Soyad</Label>
                  <Input {...register("sellerName")} placeholder="Örn: Enes Başar" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>TC Kimlik No</Label>
                  <Input {...register("sellerTC")} maxLength={11} placeholder="11 Haneli" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Telefon</Label>
                  <Input {...register("sellerPhone")} placeholder="05xx..." className={inputCls} />
                </div>

                {/* Unregistered Customer Info & Quick Action */}
                {!matchedCustomer && (sellerNameValue || sellerPhoneValue) && (
                  <div className="col-span-1 sm:col-span-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-[11px] text-blue-200">
                        Bu satıcı sistemde yeni. Cihaz kaydedildiğinde <strong>müşteri listesine otomatik eklenecektir</strong>.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isQuickRegisteringCustomer}
                      onClick={handleQuickRegisterCustomer}
                      className="h-7 px-3 text-[10px] font-bold rounded-lg border-blue-500/30 text-blue-300 hover:bg-blue-500/20 shrink-0 self-start sm:self-auto gap-1"
                    >
                      {isQuickRegisteringCustomer ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Müşteriyi Şimdi Kaydet
                    </Button>
                  </div>
                )}

                <div className="col-span-1 sm:col-span-3 space-y-2">
                  <Label className={labelCls}>Kimlik Fotoğrafları (Ön & Arka)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <input ref={sellerIdFrontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSellerIdFrontChange} />
                    <input ref={sellerIdBackInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSellerIdBackChange} />

                    <button
                      type="button"
                      onClick={() => sellerIdFrontInputRef.current?.click()}
                      className={`h-12 sm:h-14 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all px-3 ${sellerIdFront ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-background border-border text-muted-foreground/80 hover:text-foreground"}`}
                    >
                      {sellerIdFront ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Camera className="h-4 w-4 shrink-0" />}
                      <span className="text-[10px] font-bold uppercase tracking-tight">{sellerIdFront ? "Ön Yüz Yüklendi ✓" : "Ön Yüz Çek"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sellerIdBackInputRef.current?.click()}
                      className={`h-12 sm:h-14 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all px-3 ${sellerIdBack ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-background border-border text-muted-foreground/80 hover:text-foreground"}`}
                    >
                      {sellerIdBack ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Camera className="h-4 w-4 shrink-0" />}
                      <span className="text-[10px] font-bold uppercase tracking-tight">{sellerIdBack ? "Arka Yüz Yüklendi ✓" : "Arka Yüz Çek"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fiyat & Ödeme Hesabı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-blue-900/10 border border-blue-500/20">
              <div className="col-span-1 sm:col-span-2 space-y-2 pb-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <Label className="font-medium text-[9px] text-blue-400 uppercase tracking-widest pl-0.5">Ödeme Hesabı (Alış Fiyatı Bu Hesaptan Düşülecek)</Label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAccount(!showQuickAccount)}
                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {showQuickAccount ? "Vazgeç" : "Yeni Hesap"}
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => refetchAccounts()}
                    className="text-[8px] text-muted-foreground hover:text-blue-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <RotateCcw className={`h-2.5 w-2.5 ${isFetchingAccounts ? "animate-spin" : ""}`} />
                    Hesapları Yenile
                  </button>
                </div>

                {/* Inline Quick Account Creator */}
                {showQuickAccount && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 w-5 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Wallet className="h-3 w-3 text-emerald-400" />
                      </div>
                      <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Hızlı Hesap Oluştur</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[8px] text-muted-foreground/80 uppercase tracking-widest">Hesap Adı</Label>
                        <Input
                          value={quickAccountName}
                          onChange={(e) => setQuickAccountName(e.target.value)}
                          placeholder="Örn: Merkez Kasa"
                          className="bg-background border-border rounded-xl h-9 text-[12px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] text-muted-foreground/80 uppercase tracking-widest">Hesap Türü</Label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setQuickAccountType("CASH")}
                            className={`flex-1 h-9 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all border ${quickAccountType === "CASH"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <Banknote className="h-3 w-3" /> Nakit
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickAccountType("BANK")}
                            className={`flex-1 h-9 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all border ${quickAccountType === "BANK"
                              ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <Wallet className="h-3 w-3" /> Banka
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] text-muted-foreground/80 uppercase tracking-widest">Açılış Bakiyesi (Opsiyonel)</Label>
                        <Input
                          value={quickAccountBalance}
                          onChange={(e) => setQuickAccountBalance(formatCurrencyInput(e.target.value))}
                          placeholder="0"
                          className="bg-background border-border rounded-xl h-9 text-[12px]"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      disabled={isCreatingAccount || !quickAccountName.trim()}
                      onClick={async () => {
                        setIsCreatingAccount(true);
                        try {
                          const balanceNum = parseInt(parseCurrencyInput(quickAccountBalance)) || 0;
                          const result = await createAccount({
                            name: quickAccountName.trim(),
                            type: quickAccountType,
                            initialBalance: balanceNum,
                          });
                          if (result.success && result.account) {
                            const newId = result.account.id;
                            toast.success(`"${quickAccountName}" hesabı oluşturuldu!`);
                            setPendingAccountId(newId);
                            await refetchAccounts();
                            setQuickAccountName("Merkez Kasa");
                            setQuickAccountBalance("");
                          } else {
                            toast.error(result.error || "Hesap oluşturulamadı.");
                          }
                        } catch {
                          toast.error("Hesap oluşturulurken bir hata oluştu.");
                        } finally {
                          setIsCreatingAccount(false);
                        }
                      }}
                      className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl gap-2 transition-all"
                    >
                      {isCreatingAccount ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Hesap Oluştur & Seç
                    </Button>
                  </div>
                )}

                {/* Account Selector or Empty State */}
                {isFetchingAccounts && accounts.length === 0 ? (
                  <div className="h-11 border border-border rounded-xl bg-background/50 flex items-center px-3 gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    <span className="text-[12px] text-muted-foreground font-medium italic">Hesaplar yükleniyor...</span>
                  </div>
                ) : accounts.length > 0 ? (
                  <Select
                    value={watch("financeAccountId")}
                    onValueChange={(v) => setValue("financeAccountId", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="bg-background border-border h-11 text-[13px]">
                      <SelectValue placeholder={isFetchingAccounts ? "Güncelleniyor..." : "Ödeme Hesabı Seçin"} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {accounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} - <span className="text-blue-400"><KasaBalanceText balance={acc.balance} currency={(acc as any).currency || "TRY"} accountType={(acc as any).type} minimumFractionDigits={0} maximumFractionDigits={2} /></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    <p className="text-[11px] text-amber-400 font-medium text-center">
                      Henüz ödeme hesabı tanımlanmamış. Yukarıdaki <strong>"Yeni Hesap"</strong> butonuna tıklayarak hızlıca bir hesap oluşturun.
                    </p>
                    {!showQuickAccount && (
                      <button
                        type="button"
                        onClick={() => setShowQuickAccount(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Hızlı Hesap Oluştur
                      </button>
                    )}
                  </div>
                )}
                {errors.financeAccountId && <p className="text-[10px] text-rose-500 mt-1">{errors.financeAccountId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-[9px] text-blue-400 uppercase tracking-widest pl-0.5">Alış Fiyatı *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-blue-500 font-bold">₺</span>
                  <Input
                    {...register("buyPrice")}
                    id="buyPriceInput"
                    placeholder="0"
                    className="bg-background border-border rounded-xl h-11 text-[15px] pl-8 text-foreground w-full"
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setValue("buyPrice", formatted, { shouldValidate: true });
                    }}
                  />
                </div>
                {errors.buyPrice && <p className="text-[10px] text-rose-500 mt-1">{errors.buyPrice.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-[9px] text-emerald-400 uppercase tracking-widest pl-0.5">Satış Fiyatı * (≥ Alış)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-emerald-500 font-bold">₺</span>
                  <Input
                    {...register("sellPrice")}
                    placeholder="0"
                    className="bg-background border-border rounded-xl h-11 text-[15px] pl-8 text-emerald-400 w-full"
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setValue("sellPrice", formatted, { shouldValidate: true });
                    }}
                  />
                </div>
                {errors.sellPrice && <p className="text-[10px] text-rose-500 mt-1">{errors.sellPrice.message}</p>}
              </div>
            </div>

            {/* Dosya Yükleme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className={labelCls}>Cihaz Fotoğrafları (maks 5)</Label>
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-full h-20 sm:h-24 border-2 border-dashed border-border/80 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-card/50 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground/80" />
                  <span className="text-[11px] text-muted-foreground/80 font-medium">Fotoğraf Seç</span>
                </button>
                {photoFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photoFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px] text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {f.name.slice(0, 12)}...
                        <button type="button" onClick={() => removePhoto(i)} className="ml-1 text-muted-foreground/80 hover:text-rose-400"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Fatura / PDF Belgesi</Label>
                <input ref={invoiceInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleInvoiceChange} />
                <button type="button" onClick={() => invoiceInputRef.current?.click()}
                  className="w-full h-20 sm:h-24 border-2 border-dashed border-border/80 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-card/50 transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground/80" />
                  <span className="text-[11px] text-muted-foreground/80 font-medium">Fatura Seç</span>
                </button>
                {invoiceFile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-[11px] text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{invoiceFile.name.slice(0, 20)}</span>
                    <button type="button" onClick={() => setInvoiceFile(null)} className="ml-auto text-muted-foreground/80 hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-7 py-3 sm:py-4 border-t border-border bg-card/90 sm:bg-background/80 backdrop-blur-md flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center shrink-0">
            <p className="text-[11px] text-muted-foreground/80 font-medium sm:text-left text-center">
              Otomatik kategori:{" "}
              <span className="text-foreground font-semibold">
                Telefonlar &gt; {condition === "NEW" ? "Sıfır" : condition === "USED" ? "2. El" : "Yurtdışı"}
              </span>
            </p>
            <Button type="submit" disabled={isMutationPending || isUploading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold h-11 w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all gap-2">
              {(isMutationPending || isUploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Kaydı Tamamla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
      </div>
    </>
  );
}





