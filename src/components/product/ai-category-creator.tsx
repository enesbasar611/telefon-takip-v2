"use client";

import { Label } from "@/components/ui/label";
import { useState, useTransition, useEffect, useRef } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { parseCategoryTreeWithAI, AICategoryNode } from "@/lib/actions/gemini-actions";
import { bulkCreateAIInventory } from "@/lib/actions/product-actions";
import {
    Sparkles, Loader2, FolderPlus, CheckCircle2,
    AlertTriangle, RotateCcw, ArrowRight, Folder, Package, ChevronRight,
    Plus, Trash2, Upload, FileText, X, FolderInput,
    History, Camera, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/context/ui-context";
import { useQuery } from "@tanstack/react-query";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";
import { useRouter } from "next/navigation";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
    order?: number;
}

interface Product {
    id: string;
    name: string;
    categoryId: string;
    stock: number;
    buyPrice: number;
    buyPriceUsd?: number | null;
    sellPrice: number;
    sellPriceUsd?: number | null;
}

interface AICategoryCreatorProps {
    categories: any[];
    allProducts?: any[];
    onCategoriesUpdated?: (newCategories: any[]) => void;
    onProductsUpdated?: (newProducts: any[]) => void;
    triggerButton?: React.ReactNode;
    triggerText?: string;
    className?: string;
}

type NodeRow = AICategoryNode & {
    _id: string;
    _catStatus: "pending" | "saving" | "saved" | "skipped" | "error";
    _catId?: string;
    _prodStatuses: ("pending" | "saving" | "saved" | "error")[];
};

interface SavedDraft {
    rows: NodeRow[];
    activeCurrency: "TRY" | "USD";
    description: string;
    receiptName?: string;
    updatedAt: string;
}

const DRAFT_STORAGE_KEY = "basar_ai_stock_draft_v2";

const EXAMPLES = [
    "Şarj Aletleri > Type-C > 27W — 12 adet şarj başlığı, alış 10 dolar satış 500 TL, raf A-1",
    "Ekranlar > Samsung > Galaxy S24 Ultra Orijinal Ekran, 2 adet, alış 4500 satış 7500",
    "Aksesuarlar > Kılıf > iPhone 11'den 15 Pro Max'e kadar Şeffaf Kılıf, her birinden 10 adet, alış 1.5 dolar satış 150 TL",
    "Teknik Servis > Bataryalar > iPhone 11-14 serisi Deji Batarya, her modelden 5 adet, alış 15 dolar satış 750 TL",
    "Kırılmaz Cam > Hayalet Cam > iPhone 13 Pro, 20 adet, alış 20 TL satış 100 TL"
];

export function AICategoryCreator({
    categories,
    allProducts = [],
    onCategoriesUpdated,
    onProductsUpdated,
    triggerButton,
    triggerText = "BAŞAR AI Çoklu Ekle",
    className
}: AICategoryCreatorProps) {
    const router = useRouter();
    const { setAiInputFocused } = useUI();
    const { data: liveRates } = useQuery({
        queryKey: ["rates"],
        queryFn: () => getCurrentExchangeRates(),
    });
    const currentUsdRate = liveRates?.usd || 35.00;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"input" | "review">("input");
    const [activeInputTab, setActiveInputTab] = useState<"text" | "receipt">("text");
    const [description, setDescription] = useState("");
    const [rows, setRows] = useState<NodeRow[]>([]);
    const [activeCurrency, setActiveCurrency] = useState<"TRY" | "USD">("TRY");
    const [isAIPending, startAI] = useTransition();
    const [isSavePending, startSave] = useTransition();
    const [isDragging, setIsDragging] = useState(false);

    // Fiş / Belge Yükleme Durumu
    const [receiptFile, setReceiptFile] = useState<{
        name: string;
        size: number;
        base64: string;
        mimeType: string;
        previewUrl: string;
    } | null>(null);

    // Kayıtlı Taslak Durumu (Token Harcanmasını ve Sekme Kapanma Kayıplarını Önleme)
    const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);

    // Modal açıldığında veya başlangıçta taslağı yükle
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as SavedDraft;
                if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
                    // Önceki denemede kalan "error" veya "saving" durumlarını temizle, kaydedilmemişleri tekrar aktif et
                    const sanitizedRows = parsed.rows.map(r => ({
                        ...r,
                        _catStatus: (r._catStatus === "saved" ? "saved" : "pending") as any,
                        _prodStatuses: (r.products || []).map((_, pi) => {
                            const s = r._prodStatuses?.[pi];
                            return s === "saved" ? "saved" : "pending";
                        }) as any
                    }));
                    setSavedDraft({
                        ...parsed,
                        rows: sanitizedRows
                    });
                }
            }
        } catch (err) {
            console.error("Taslak okuma hatası:", err);
        }
    }, [open]);

    // Düzenleme sırasında (review adımında) her değişiklikte taslağı otomatik kaydet
    useEffect(() => {
        if (step === "review" && rows.length > 0) {
            try {
                const draft: SavedDraft = {
                    rows,
                    activeCurrency,
                    description,
                    receiptName: receiptFile?.name,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
            } catch (err) {
                // localStorage kota aşımı koruması
            }
        }
    }, [rows, activeCurrency, step, description, receiptFile?.name]);

    // Taslaktan Geri Yükle
    const handleRestoreDraft = () => {
        if (!savedDraft) return;
        // Taslaktan yüklerken kaydedilmemiş olanları temiz bir "pending" durumuna çek
        const restoredRows = (savedDraft.rows || []).map(r => ({
            ...r,
            _catStatus: (r._catStatus === "saved" ? "saved" : "pending") as any,
            _prodStatuses: (r.products || []).map((_, pi) => {
                const s = r._prodStatuses?.[pi];
                return s === "saved" ? "saved" : "pending";
            }) as any
        }));
        setRows(restoredRows);
        setActiveCurrency(savedDraft.activeCurrency || "TRY");
        setDescription(savedDraft.description || "");
        setStep("review");
        toast.success(`Hafızadaki ${restoredRows.length} kategorili taslak yüklendi. Token harcamadan devam ediyorsunuz.`);
    };

    // Taslağı Temizle
    const handleClearDraft = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setSavedDraft(null);
        toast.info("Kaydedilmiş taslak temizlendi.");
    };

    // Görsel boyutlandırma ve optimize etme (1MB Server Action sınırını koruma ve hızlı yükleme)
    const compressImage = (dataUrl: string, maxDimension = 1800, quality = 0.85): Promise<string> => {
        return new Promise((resolve) => {
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
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", quality));
                } else {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    };

    // Dosya okuma (Görsel veya PDF)
    const processFile = (file: File) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i)) {
            toast.error("Lütfen geçerli bir fiş görseli (JPG, PNG, WEBP) veya PDF yükleyin.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            let base64 = reader.result as string;
            let mimeType = file.type || "image/jpeg";

            // Eğer görsel ise 1800px ve 0.85 kalite ile optimize et (boyut 3-8MB'den ~300KB'a iner, OCR kalitesi korunur)
            if (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
                try {
                    base64 = await compressImage(base64, 1800, 0.85);
                    mimeType = "image/jpeg";
                } catch (e) {
                    // Fallback to original if canvas fails
                }
            }

            const estimatedSize = Math.round((base64.length * 3) / 4);

            setReceiptFile({
                name: file.name,
                size: estimatedSize,
                base64,
                mimeType,
                previewUrl: mimeType.startsWith("image/") ? base64 : ""
            });
            setActiveInputTab("receipt");
            toast.success(`"${file.name}" fişi yüklendi ve optimize edildi.`);
        };
        reader.readAsDataURL(file);
    };

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const updateProductField = (rowId: string, productIndex: number, field: string, value: any) => {
        setRows(prev => prev.map(r => {
            if (r._id !== rowId) return r;
            const updatedProducts = [...r.products];
            updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                [field]: value
            };
            const updatedStatuses = [...r._prodStatuses];
            if (updatedStatuses[productIndex] === "error") {
                updatedStatuses[productIndex] = "pending";
            }
            return {
                ...r,
                _catStatus: r._catStatus === "error" ? "pending" : r._catStatus,
                products: updatedProducts,
                _prodStatuses: updatedStatuses
            };
        }));
    };

    const addNewProductToRow = (rowId: string) => {
        setRows(prev => prev.map(r => {
            if (r._id !== rowId) return r;
            
            const template = r.products[0] || {
                buyPrice: 0,
                buyPriceUsd: null,
                sellPrice: 0,
                sellPriceUsd: null,
                stock: 1,
                criticalStock: 3,
                location: ""
            };

            const newProduct = {
                name: "",
                currency: activeCurrency,
                buyPrice: template.buyPrice,
                buyPriceUsd: template.buyPriceUsd,
                sellPrice: template.sellPrice,
                sellPriceUsd: template.sellPriceUsd,
                stock: 1,
                criticalStock: 3,
                location: template.location
            };

            return {
                ...r,
                products: [...r.products, newProduct],
                _prodStatuses: [...r._prodStatuses, "pending" as const]
            };
        }));
    };

    const removeProductFromRow = (rowId: string, productIndex: number) => {
        setRows(prev => prev.map(r => {
            if (r._id !== rowId) return r;
            const updatedProducts = r.products.filter((_, pi) => pi !== productIndex);
            const updatedStatuses = r._prodStatuses.filter((_, pi) => pi !== productIndex);
            return {
                ...r,
                products: updatedProducts,
                _prodStatuses: updatedStatuses
            };
        }));
    };

    // Ürünü Başka Bir Kategoriye Taşıma
    const moveProductToCategory = (sourceRowId: string, productIndex: number, targetRowId: string) => {
        if (sourceRowId === targetRowId) return;

        if (targetRowId === "NEW_CATEGORY") {
            // Yeni kategori oluşturup oraya taşı
            const sourceRow = rows.find(r => r._id === sourceRowId);
            if (!sourceRow) return;
            const product = sourceRow.products[productIndex];
            if (!product) return;

            const newRowId = `r-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
            const newRow: NodeRow = {
                _id: newRowId,
                name: "Yeni Kategori",
                parentName: null,
                products: [product],
                _catStatus: "pending",
                _prodStatuses: ["pending"]
            };

            setRows(prev => [
                newRow,
                ...prev.map(r => r._id === sourceRowId ? {
                    ...r,
                    products: r.products.filter((_, i) => i !== productIndex),
                    _prodStatuses: r._prodStatuses.filter((_, i) => i !== productIndex)
                } : r)
            ]);
            toast.success(`"${product.name}" yeni kategoriye taşındı.`);
            return;
        }

        const sourceRow = rows.find(r => r._id === sourceRowId);
        const targetRow = rows.find(r => r._id === targetRowId);
        if (!sourceRow || !targetRow) return;

        const product = sourceRow.products[productIndex];
        if (!product) return;

        setRows(prev => prev.map(r => {
            if (r._id === sourceRowId) {
                return {
                    ...r,
                    products: r.products.filter((_, i) => i !== productIndex),
                    _prodStatuses: r._prodStatuses.filter((_, i) => i !== productIndex)
                };
            }
            if (r._id === targetRowId) {
                return {
                    ...r,
                    products: [...r.products, product],
                    _prodStatuses: [...r._prodStatuses, "pending" as const]
                };
            }
            return r;
        }));

        toast.success(`"${product.name}" -> "${targetRow.name}" kategorisine taşındı.`);
    };

    // Yeni Kategori Node'u Ekle
    const addNewCategoryNode = () => {
        const newRow: NodeRow = {
            _id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: "Yeni Kategori",
            parentName: null,
            products: [],
            _catStatus: "pending",
            _prodStatuses: []
        };
        setRows(prev => [newRow, ...prev]);
        toast.success("Yeni kategori oluşturuldu. İsmini girip ürün ekleyebilirsiniz.");
    };

    // Kategori Sil
    const removeCategoryRow = (rowId: string) => {
        setRows(prev => prev.filter(r => r._id !== rowId));
        toast.info("Kategori kaldırıldı.");
    };

    // AI Analizi Başlat (Prompt veya Fiş Görseli)
    const handleAnalyze = () => {
        if (!description.trim() && !receiptFile) {
            toast.warning("Lütfen bir açıklama yazın veya tedarikçi fişi yükleyin.");
            return;
        }

        startAI(async () => {
            const result = await parseCategoryTreeWithAI({
                description,
                image: receiptFile ? {
                    base64: receiptFile.base64,
                    mimeType: receiptFile.mimeType
                } : undefined
            });

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            const newRows: NodeRow[] = result.data.map((item, i) => ({
                ...item,
                _id: `r-${Date.now()}-${i}`,
                _catStatus: "pending",
                _prodStatuses: item.products.map(() => "pending" as const),
            }));

            // Kullanıcı promptta dolar yazdıysa veya ürünlerden herhangi biri dolar olarak tespit edildiyse USD modunu aktif et
            const lowerDesc = description.toLowerCase();
            const hasDollarInPrompt = lowerDesc.includes("dolar") || lowerDesc.includes("usd") || description.includes("$");
            const hasDollarInProducts = newRows.some(r => r.products.some(p => p.currency === "USD" || (p.buyPriceUsd && p.buyPriceUsd > 0 && p.buyPriceUsd !== p.buyPrice)));
            
            if (hasDollarInPrompt || hasDollarInProducts) {
                setActiveCurrency("USD");
            } else {
                setActiveCurrency("TRY");
            }

            setRows(newRows);
            setStep("review");
            toast.success(`${newRows.length} kategori ve ${newRows.reduce((a, r) => a + r.products.length, 0)} ürün tespit edildi!`);
        });
    };

    const updateRow = (id: string, field: keyof AICategoryNode, value: any) => {
        setRows(prev => prev.map(r => r._id === id ? {
            ...r,
            [field]: value,
            _catStatus: r._catStatus === "error" ? "pending" : r._catStatus
        } : r));
    };

    // Tümünü Kaydet
    const handleSaveAll = () => {
        startSave(async () => {
            setRows(prev => prev.map(r => ({
                ...r,
                _catStatus: r._catStatus !== "saved" ? "saving" : r._catStatus,
                _prodStatuses: r._prodStatuses.map(ps => ps !== "saved" ? "saving" : ps)
            })));

            const res = await bulkCreateAIInventory(rows);

            if (!res.success) {
                toast.error(res.error || "Kayıt sırasında hata oluştu.");
                setRows(prev => prev.map(r => ({
                    ...r,
                    _catStatus: r._catStatus === "saving" ? "error" : r._catStatus,
                    _prodStatuses: r._prodStatuses.map(ps => ps === "saving" ? "error" : ps)
                })));
                return;
            }

            // Başarıyla kaydedildi
            const newCategories = res.categories as Category[];
            const newProducts = res.products as Product[];

            setRows(prev => prev.map(r => ({
                ...r,
                _catStatus: "saved",
                _prodStatuses: r.products.map(() => "saved" as const)
            })));

            // State callback'leri varsa güncelle (Kategoriler sayfası için)
            if (onCategoriesUpdated && onProductsUpdated) {
                const finalCats = [...categories];
                newCategories.forEach(nc => {
                    const idx = finalCats.findIndex(c => c.id === nc.id);
                    if (idx === -1) finalCats.push(nc);
                    else finalCats[idx] = nc;
                });

                const finalProds = [...allProducts];
                newProducts.forEach(np => {
                    const idx = finalProds.findIndex(p => p.id === np.id);
                    if (idx === -1) finalProds.push(np);
                    else finalProds[idx] = np;
                });

                onCategoriesUpdated(finalCats);
                onProductsUpdated(finalProds);
            } else {
                // Stok sayfası gibi bağımsız sayfalarda router yenile
                router.refresh();
            }

            // Taslağı temizle (İşlem tamamlandı, token korunarak kaydedildi)
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setSavedDraft(null);

            toast.success(`${newCategories.length} kategori ve ${newProducts.length} ürün başarıyla envantere eklendi!`);
            
            setTimeout(() => {
                setOpen(false);
                setStep("input");
                setRows([]);
                setDescription("");
                setReceiptFile(null);
            }, 1000);
        });
    };

    const totalPendingCats = rows.filter(r => r._catStatus !== "saved" && r._catStatus !== "skipped").length;
    const totalPendingProds = rows.reduce((a, r) => a + r._prodStatuses.filter(ps => ps !== "saved").length, 0);
    const totalProds = rows.reduce((a, r) => a + r.products.length, 0);

    return (
        <Dialog open={open} onOpenChange={v => {
            setOpen(v);
            if (!v && step !== "review") {
                setStep("input");
            }
        }}>
            <DialogTrigger asChild>
                {triggerButton ? (
                    triggerButton
                ) : (
                    <Button
                        className={cn(
                            "gap-2 h-10 px-5 rounded-xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#333] text-indigo-600 dark:text-violet-400 hover:bg-zinc-50 dark:hover:bg-[#18181A] transition-all text-xs font-bold uppercase tracking-wider shadow-sm gemini-aura-button",
                            className
                        )}
                    >
                        <Sparkles className="h-4 w-4" />
                        {triggerText}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[1150px] w-[96vw] max-h-[92vh] flex flex-col bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl border-zinc-200 dark:border-[#333333] text-foreground dark:text-white p-0 shadow-2xl gemini-aura-modal overflow-hidden">
                <DialogHeader className="p-6 pb-3 border-b border-zinc-100 dark:border-zinc-800/50 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="font-extrabold text-xl sm:text-2xl text-foreground dark:text-white tracking-tight flex items-center gap-2">
                                    <span>BAŞAR AI Çoklu Stok & Fiş Analizi</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-violet-400 border border-indigo-500/20">
                                        PRO 2.5
                                    </span>
                                </DialogTitle>
                                <p className="text-xs text-zinc-500 dark:text-muted-foreground mt-0.5 font-medium">
                                    Serbest komut yazın veya tedarikçi fişi yükleyin; hiyerarşi, seriler ve fiyatlar saniyeler içinde önizlensin.
                                </p>
                            </div>
                        </div>

                        {step === "review" && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                                    1 USD ≈ ₺{Number(currentUsdRate).toFixed(2)}
                                </span>
                                {/* TL / DOLAR Seçici */}
                                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCurrency("TRY")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                            activeCurrency === "TRY"
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "text-zinc-500 hover:text-foreground hover:bg-white dark:hover:bg-zinc-900"
                                        )}
                                        title="Fiyatları TL cinsinden düzenle, Dolar karşılığını göster"
                                    >
                                        <span className="font-mono text-sm leading-none">₺</span>
                                        <span>TL</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveCurrency("USD")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                            activeCurrency === "USD"
                                                ? "bg-amber-500 text-white shadow-sm"
                                                : "text-zinc-500 hover:text-foreground hover:bg-white dark:hover:bg-zinc-900"
                                        )}
                                        title="Fiyatları Dolar cinsinden düzenle, TL karşılığını göster"
                                    >
                                        <span className="font-mono text-sm leading-none">$</span>
                                        <span>DOLAR</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

                    {step === "input" && (
                        <div className="space-y-6">

                            {/* 📁 Kaydedilmiş Taslak Bildirimi (Sekme kapanması veya sayfa yenilenmesinde token koruması) */}
                            {savedDraft && savedDraft.rows && savedDraft.rows.length > 0 && (
                                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3.5">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                                            <History className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider">
                                                    Son Analiz Edilen Stok Taslağınız Saklanıyor
                                                </h4>
                                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-violet-400 font-extrabold border border-indigo-500/20">
                                                    {savedDraft.rows.length} Kategori · {savedDraft.rows.reduce((a, r) => a + r.products.length, 0)} Ürün
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                                                Düzenlemekte olduğunuz stoklar hafızada korundu. Token harcamadan kaldığınız yerden devam edebilirsiniz.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            type="button"
                                            onClick={handleRestoreDraft}
                                            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-500/20"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Taslaktan Devam Et
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleClearDraft}
                                            className="h-9 px-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 text-xs font-medium"
                                        >
                                            Temizle
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Giriş Yöntemi Sekmeleri */}
                            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveInputTab("text")}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                        activeInputTab === "text"
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    )}
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Metin / Komut ile Ekle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveInputTab("receipt")}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                        activeInputTab === "receipt"
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    )}
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    Tedarikçi Fişi / Fatura Yükle
                                    {receiptFile && (
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
                                </button>
                            </div>

                            {/* TAB 1: Metin Komutları & Örnekler */}
                            {activeInputTab === "text" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-zinc-500 dark:text-muted-foreground/80 uppercase tracking-[0.2em] font-bold pl-1">
                                            💡 Hızlı Örnekler (Tıklayarak Deneyin)
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {EXAMPLES.map((ex, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setDescription(ex)}
                                                    className="w-full text-left px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#18181A] border border-zinc-200 dark:border-[#222222] text-xs text-zinc-700 dark:text-foreground hover:bg-zinc-100 dark:hover:bg-[#222222] hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-white transition-all shadow-xs group"
                                                >
                                                    <span className="text-indigo-600 dark:text-violet-400 font-bold mr-2">{i + 1}.</span>
                                                    <span className="font-medium line-clamp-1">{ex}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="font-bold text-[10px] text-zinc-500 dark:text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                                            <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-violet-500" />
                                            KOMUTUNUZU YAZIN (Seriler & Dolar Fiyatlar Dahil)
                                        </Label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            rows={4}
                                            onFocus={() => setAiInputFocused(true)}
                                            onBlur={() => setAiInputFocused(false)}
                                            placeholder="Örn: Ekranlar > Apple > iPhone 11'den 15 Pro Max'e kadar Ekranlar, her modelden 5 adet, alış 15 dolar satış 850 TL, raf B-2..."
                                            className="w-full bg-zinc-50 dark:bg-[#18181A] border border-zinc-200 dark:border-[#333333] rounded-2xl px-5 py-4 text-sm text-foreground dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none leading-relaxed shadow-inner"
                                            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze(); }}
                                        />
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 pl-1">
                                            <p className="font-medium">
                                                💡 <strong className="text-indigo-600 dark:text-foreground">İpucu:</strong> &quot;iPhone 11&apos;den 15 Pro Max&apos;e kadar&quot; dediğinizde aradaki 11, 12, 13, 14, 15 tüm modeller otomatik tek tek açılır.
                                            </p>
                                            <span className="text-[10px] text-zinc-400 font-mono tracking-tighter">
                                                [Ctrl+Enter] Analiz Başlat
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Tedarikçi Fişi / Fatura Yükleme */}
                            {activeInputTab === "receipt" && (
                                <div className="space-y-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                                        className="hidden"
                                        onChange={handleReceiptUpload}
                                    />

                                    {!receiptFile ? (
                                        <div
                                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                                                isDragging
                                                    ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
                                                    : "border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18181A]/50 hover:border-indigo-500/50 hover:bg-zinc-100/50 dark:hover:bg-[#18181A]"
                                            )}
                                        >
                                            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-violet-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                                <Upload className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground dark:text-white">
                                                    Tedarikçi Fişini veya Faturasını Buraya Sürükleyin ya da Seçin
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                    Telefon kamerasıyla çekilmiş fotoğraf, ekran görüntüsü veya PDF faturası (Maks 15MB)
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 rounded-xl border-zinc-300 dark:border-zinc-700 font-bold text-xs"
                                            >
                                                <ImageIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
                                                Cihazdan Dosya / Fotoğraf Seç
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181A] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                {receiptFile.previewUrl ? (
                                                    <img
                                                        src={receiptFile.previewUrl}
                                                        alt="Fiş Önizleme"
                                                        className="h-16 w-16 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
                                                        <FileText className="h-8 w-8" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-foreground dark:text-white truncate max-w-[260px] sm:max-w-md">
                                                            {receiptFile.name}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                                                            {(receiptFile.size / 1024).toFixed(0)} KB
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        Fiş başarıyla yüklendi. Yapay zeka ürün adlarını, modelleri ve alış fiyatlarını otomatik kategorilere ayıracaktır.
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setReceiptFile(null)}
                                                className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                title="Fişi Kaldır"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Fişe Ek Talimat / Not Alanı */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-1">
                                            Fiş İçin Ek Talimat / Not (İsteğe Bağlı)
                                        </Label>
                                        <Input
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Örn: Ekranlar Apple ve Samsung olarak ayrılsın, fiyatlar dolar bazında girilsin..."
                                            className="h-10 text-xs rounded-xl bg-zinc-50 dark:bg-[#18181A] border-zinc-200 dark:border-zinc-800"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Aksiyon Butonu */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={isAIPending || (!description.trim() && !receiptFile)}
                                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {isAIPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {receiptFile ? "Fiş Taranıyor & Analiz Ediliyor..." : "Yapay Zeka Hiyerarşiyi Ayrıştırıyor..."}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            {receiptFile ? "Fişi Analiz Et & Önizle" : "Analiz Et & Önizleme Oluştur"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* REVIEW ADIMI (ÖNİZLEME & DÜZENLEME TABLOSU) */}
                    {step === "review" && (
                        <div className="space-y-4">
                            {/* Üst Bilgi Çubuğu */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-100/80 dark:bg-[#18181A] border border-zinc-200 dark:border-[#2a2a2d] shadow-sm">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        Analiz Sonucu — <span className="text-indigo-600 dark:text-violet-400">{rows.length}</span> Kategori, <span className="text-indigo-600 dark:text-violet-400">{totalProds}</span> Ürün
                                    </p>
                                    {receiptFile && (
                                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Fişten Okundu: {receiptFile.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addNewCategoryNode}
                                        className="gap-1.5 h-9 px-3 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 font-bold text-indigo-600 dark:text-violet-400"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Yeni Kategori Ekle
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => { setStep("input"); }}
                                        className="gap-1.5 text-muted-foreground hover:text-foreground h-9 px-3 text-xs rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" /> Geri / Yeni Analiz
                                    </Button>
                                </div>
                            </div>

                            {/* Kategoriler ve Ürünler Listesi */}
                            <div className="space-y-4">
                                {rows.map((row) => (
                                    <div
                                        key={row._id}
                                        className={cn(
                                            "rounded-2xl border p-5 space-y-4 transition-all shadow-sm",
                                            row._catStatus === "saved" || row._catStatus === "skipped"
                                                ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10"
                                                : row._catStatus === "error"
                                                    ? "border-red-500/30 bg-red-50/50 dark:bg-red-500/10"
                                                    : "border-zinc-200 dark:border-[#333333] bg-zinc-50/50 dark:bg-[#18181A]"
                                        )}
                                    >
                                        {/* Kategori Başlık Satırı */}
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                                                {row.parentName && (
                                                    <>
                                                        <Input
                                                            value={row.parentName}
                                                            onChange={e => updateRow(row._id, "parentName", e.target.value)}
                                                            placeholder="Üst Kategori"
                                                            disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                            className="h-8 max-w-[140px] text-xs font-semibold bg-white dark:bg-black/40 border-zinc-200 dark:border-zinc-800 rounded-lg"
                                                        />
                                                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                                    </>
                                                )}
                                                <Folder className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                                <Input
                                                    value={row.name}
                                                    onChange={e => updateRow(row._id, "name", e.target.value)}
                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                    placeholder="Kategori Adı"
                                                    className="h-9 bg-white dark:bg-[#111111] border-zinc-200 dark:border-[#333333] rounded-xl text-sm font-bold max-w-[220px] disabled:opacity-60 shadow-sm"
                                                />
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50">
                                                    {row.products.length} Ürün
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {row._catStatus === "pending" && <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-700/50 text-muted-foreground uppercase font-bold">Bekliyor</span>}
                                                {row._catStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                                                {row._catStatus === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                {row._catStatus === "skipped" && <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase font-bold">Zaten Var</span>}
                                                {row._catStatus === "error" && <AlertTriangle className="h-4 w-4 text-red-400" />}

                                                {row._catStatus !== "saved" && row._catStatus !== "skipped" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeCategoryRow(row._id)}
                                                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                        title="Kategoriyi ve İçindekileri Kaldır"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ürünler Tablosu */}
                                        <div className="ml-2 sm:ml-4 space-y-2">
                                            {row.products.map((p, pi) => (
                                                <div
                                                    key={pi}
                                                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-zinc-200/70 dark:border-zinc-800/50 w-full flex-wrap lg:flex-nowrap shadow-2xs"
                                                >
                                                    <Package className="h-4 w-4 text-zinc-400 shrink-0" />
                                                    
                                                    {/* Ürün Adı */}
                                                    <div className="flex-1 min-w-[170px]">
                                                        <Input 
                                                            value={p.name} 
                                                            onChange={e => updateProductField(row._id, pi, "name", e.target.value)}
                                                            disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                            placeholder="Ürün adı"
                                                            className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-semibold"
                                                        />
                                                    </div>

                                                    {/* Stok Adeti */}
                                                    <div className="w-24 shrink-0 flex items-center gap-1">
                                                        <Input 
                                                            type="number"
                                                            value={p.stock} 
                                                            onChange={e => updateProductField(row._id, pi, "stock", Math.max(0, Number(e.target.value) || 0))}
                                                            disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                            placeholder="Stok"
                                                            className="h-8 w-14 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-center"
                                                        />
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase shrink-0">Adet</span>
                                                    </div>

                                                    {/* Alış Fiyatı (Seçili kurda düzenlenir, karşı kur altında salt okunur gösterilir) */}
                                                    <div className="w-32 shrink-0 flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1">
                                                            <span className={cn(
                                                                "text-xs font-black shrink-0",
                                                                activeCurrency === "USD" ? "text-amber-500" : "text-amber-600"
                                                            )}>
                                                                {activeCurrency === "USD" ? "$" : "₺"}
                                                            </span>
                                                            <Input 
                                                                type="number"
                                                                step="any"
                                                                value={(activeCurrency === "USD" ? p.buyPriceUsd : p.buyPrice) ?? ""} 
                                                                onChange={e => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    if (activeCurrency === "USD") {
                                                                        updateProductField(row._id, pi, "buyPriceUsd", val);
                                                                        updateProductField(row._id, pi, "buyPrice", Math.round(val * currentUsdRate * 100) / 100);
                                                                    } else {
                                                                        updateProductField(row._id, pi, "buyPrice", val);
                                                                        updateProductField(row._id, pi, "buyPriceUsd", currentUsdRate > 0 ? Math.round((val / currentUsdRate) * 100) / 100 : null);
                                                                    }
                                                                }}
                                                                disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                                placeholder={activeCurrency === "USD" ? "Alış ($)" : "Alış (₺)"}
                                                                className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-center text-amber-600 dark:text-amber-300"
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium font-mono text-center truncate select-none">
                                                            {activeCurrency === "USD"
                                                                ? `≈ ₺${(Number(p.buyPrice) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : `≈ $${(Number(p.buyPriceUsd) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Satış Fiyatı (Seçili kurda düzenlenir, karşı kur altında salt okunur gösterilir) */}
                                                    <div className="w-32 shrink-0 flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1">
                                                            <span className={cn(
                                                                "text-xs font-black shrink-0",
                                                                activeCurrency === "USD" ? "text-amber-500" : "text-emerald-500"
                                                            )}>
                                                                {activeCurrency === "USD" ? "$" : "₺"}
                                                            </span>
                                                            <Input 
                                                                type="number"
                                                                step="any"
                                                                value={(activeCurrency === "USD" ? p.sellPriceUsd : p.sellPrice) ?? ""} 
                                                                onChange={e => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    if (activeCurrency === "USD") {
                                                                        updateProductField(row._id, pi, "sellPriceUsd", val);
                                                                        updateProductField(row._id, pi, "sellPrice", Math.round(val * currentUsdRate * 100) / 100);
                                                                    } else {
                                                                        updateProductField(row._id, pi, "sellPrice", val);
                                                                        updateProductField(row._id, pi, "sellPriceUsd", currentUsdRate > 0 ? Math.round((val / currentUsdRate) * 100) / 100 : null);
                                                                    }
                                                                }}
                                                                disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                                placeholder={activeCurrency === "USD" ? "Satış ($)" : "Satış (₺)"}
                                                                className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-center text-emerald-600 dark:text-emerald-300"
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium font-mono text-center truncate select-none">
                                                            {activeCurrency === "USD"
                                                                ? `≈ ₺${(Number(p.sellPrice) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : `≈ $${(Number(p.sellPriceUsd) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Raf Konumu */}
                                                    <div className="w-24 shrink-0">
                                                        <Input 
                                                            value={p.location || ""} 
                                                            onChange={e => updateProductField(row._id, pi, "location", e.target.value)}
                                                            disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                            placeholder="Raf/Konum"
                                                            className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-medium text-center"
                                                        />
                                                    </div>

                                                    {/* 🔄 Kategoriye Taşı / Değiştir Dropdown'ı */}
                                                    <div className="w-36 shrink-0">
                                                        <select
                                                            value={row._id}
                                                            onChange={e => moveProductToCategory(row._id, pi, e.target.value)}
                                                            disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                            className="h-8 w-full text-[11px] font-bold rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 text-indigo-600 dark:text-indigo-400 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            title="Bu ürünü başka bir kategoriye taşıyın"
                                                        >
                                                            <option value={row._id} disabled>
                                                                📁 {row.name} (Mevcut)
                                                            </option>
                                                            {rows.filter(r => r._id !== row._id).map(target => (
                                                                <option key={target._id} value={target._id}>
                                                                    ➔ {target.name} ({target.products.length})
                                                                </option>
                                                            ))}
                                                            <option value="NEW_CATEGORY">
                                                                + Yeni Kategoriye Taşı
                                                            </option>
                                                        </select>
                                                    </div>

                                                    {/* Durum İkonu & Silme Butonu */}
                                                    <div className="shrink-0 flex items-center gap-1">
                                                        {row._prodStatuses[pi] === "pending" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-muted-foreground uppercase">—</span>}
                                                        {row._prodStatuses[pi] === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />}
                                                        {row._prodStatuses[pi] === "saved" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                                        {row._prodStatuses[pi] === "error" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                                                        
                                                        {row._catStatus !== "saved" && row._catStatus !== "skipped" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeProductFromRow(row._id, pi)}
                                                                className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg shrink-0"
                                                                title="Ürünü Sil"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Yeni Ürün Ekle Butonu */}
                                            {row._catStatus !== "saved" && row._catStatus !== "skipped" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addNewProductToRow(row._id)}
                                                    className="h-8 text-xs font-bold text-indigo-600 dark:text-violet-400 hover:text-indigo-700 dark:hover:text-violet-300 hover:bg-indigo-500/10 dark:hover:bg-violet-500/10 rounded-xl gap-1 px-3 mt-1"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Bu Kategoriye Ürün Ekle
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}
                </div>

                {/* Alt Sabit Kaydet Aksiyonu (Review adımında ekranın altına sabitlenir) */}
                {step === "review" && (
                    <div className="p-4 px-6 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-[#151518]/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-lg">
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            Toplam <strong className="text-foreground dark:text-white font-bold">{rows.length}</strong> Kategori ve <strong className="text-foreground dark:text-white font-bold">{totalProds}</strong> Ürün envantere eklenecektir.
                        </div>

                        <Button
                            onClick={handleSaveAll}
                            disabled={isSavePending || totalProds === 0 || rows.every(r => r._catStatus === "saved")}
                            className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider gap-2.5 disabled:opacity-40 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                        >
                            {isSavePending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Envantere Ekleniyor...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-4 w-4" />
                                    Hepsini Envantere Ekle ({totalProds} Ürün)
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
