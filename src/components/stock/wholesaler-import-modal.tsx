"use client";

import { useState, useTransition, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileSpreadsheet,
    UploadCloud,
    ClipboardPaste,
    CheckCircle2,
    DollarSign,
    Sparkles,
    Trash2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Plus,
    Split,
    Search,
    X,
    PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import {
    parseWholesalerRawText,
    type ParsedWholesalerItem,
    KNOWN_COLORS,
    STANDARD_CATEGORIES
} from "@/lib/stock/wholesaler-parser";
import {
    importWholesalerBatchAction,
    checkWholesalerStockMatchesAction,
    type StockMatchInfo
} from "@/lib/actions/stock-import-actions";
import { cn } from "@/lib/utils";

interface WholesalerImportModalProps {
    suppliers?: { id: string; name: string }[];
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function WholesalerImportModal({
    suppliers = [],
    onSuccess,
    trigger,
}: WholesalerImportModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [rawText, setRawText] = useState("");
    const [defaultMarkup, setDefaultMarkup] = useState<number>(5.00); // Varsayılan +$5
    const [parsedItems, setParsedItems] = useState<ParsedWholesalerItem[]>([]);
    
    // Mağaza stoğundaki mevcut/benzer ürün eşleşmeleri
    const [stockMatches, setStockMatches] = useState<Record<string, StockMatchInfo>>({});
    const [isCheckingMatches, setIsCheckingMatches] = useState(false);

    // Tedarikçi ve ödeme yönetimi
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("NONE");
    const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("PAID");

    // Toplu fiyat artırma aracı
    const [customMarkupUsd, setCustomMarkupUsd] = useState<string>("5.00");

    // Kategori filtreleme, stok eşleşme filtreleme ve tablo içi arama
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
    const [stockMatchFilter, setStockMatchFilter] = useState<"ALL" | "EXISTING" | "NEW">("ALL");
    const [tableSearch, setTableSearch] = useState<string>("");

    // Renk bölme (Split) modal durumu
    const [splittingItem, setSplittingItem] = useState<ParsedWholesalerItem | null>(null);
    const [splitDistribution, setSplitDistribution] = useState<{ color: string; qty: number }[]>([
        { color: "Siyah", qty: 1 },
        { color: "Beyaz", qty: 1 },
    ]);

    const [isPending, startTransition] = useTransition();

    // Stok eşleşmelerini sorgula
    const queryStockMatches = async (items: ParsedWholesalerItem[]) => {
        setIsCheckingMatches(true);
        try {
            const names = items.map(it => it.name);
            const matches = await checkWholesalerStockMatchesAction(names);
            setStockMatches(matches);
        } catch (err) {
            console.error("Match error:", err);
        } finally {
            setIsCheckingMatches(false);
        }
    };

    // Adım 1'den Adım 2'ye geçiş (Ayrıştırma)
    const handleParse = async (textToParse?: string) => {
        const content = textToParse || rawText;
        if (!content || !content.trim()) {
            toast.error("Lütfen ayrıştırılacak bir dosya yükleyin veya metin yapıştırın.");
            return;
        }

        const result = parseWholesalerRawText(content, defaultMarkup || 5.00);
        if (result.items.length === 0) {
            toast.warning("Metinde ürün veya fiyat satırı bulunamadı. Lütfen CSV veya toptancı listesini kontrol edin.");
            return;
        }

        // Tüm ürünler varsayılan olarak seçili gelir
        const itemsWithSelection = result.items.map(it => ({ ...it, selected: true }));
        setParsedItems(itemsWithSelection);
        setStep(2);

        // Mağaza stoğundaki benzer/aynı ürünleri kontrol et
        queryStockMatches(itemsWithSelection);

        toast.success(`${result.items.length} kalem ürün başarıyla ayrıştırıldı (${result.totalQuantity} adet).`);
    };

    // Dosya Yükleme (CSV, TXT, Excel)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setRawText(text);
                handleParse(text);
            };
            reader.readAsText(file, "utf-8");
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            try {
                const XLSX = await import("xlsx");
                const reader = new FileReader();
                reader.onload = (event) => {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ";" });
                    setRawText(csvContent);
                    handleParse(csvContent);
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error("Excel parse error:", err);
                toast.error("Excel dosyası okunurken hata oluştu.");
            }
        } else if (fileName.endsWith(".pdf")) {
            toast.info("PDF tablolarını doğrudan kopyalayıp 'Metin Yapıştır' sekmesine yapıştırabilirsiniz.");
        } else {
            toast.error("Desteklenmeyen dosya formatı. Lütfen .csv, .xlsx veya .txt dosyası yükleyin.");
        }
    };

    // Listedeki mevcut kategorileri ve adetlerini grupla
    const uniqueCategoriesInList = useMemo(() => {
        const counts = new Map<string, number>();
        parsedItems.forEach(item => {
            counts.set(item.category, (counts.get(item.category) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([cat, count]) => ({ cat, count }));
    }, [parsedItems]);

    // Stoğumuzda mevcut olan ve yeni ürünlerin ayrımı
    const existingItems = useMemo(() => {
        return parsedItems.filter(item => Boolean(stockMatches[item.name.trim().toLowerCase()]));
    }, [parsedItems, stockMatches]);

    const newItems = useMemo(() => {
        return parsedItems.filter(item => !stockMatches[item.name.trim().toLowerCase()]);
    }, [parsedItems, stockMatches]);

    const existingSelectedCount = existingItems.filter(it => it.selected !== false).length;
    const newSelectedCount = newItems.filter(it => it.selected !== false).length;

    // Filtrelenmiş ürün listesi (Görünüm filtresi)
    const filteredItems = useMemo(() => {
        return parsedItems.filter(item => {
            if (selectedCategoryFilter !== "ALL" && item.category !== selectedCategoryFilter) {
                return false;
            }
            if (stockMatchFilter === "EXISTING" && !stockMatches[item.name.trim().toLowerCase()]) {
                return false;
            }
            if (stockMatchFilter === "NEW" && Boolean(stockMatches[item.name.trim().toLowerCase()])) {
                return false;
            }
            if (tableSearch.trim()) {
                const q = tableSearch.toLowerCase();
                const matchesName = item.name.toLowerCase().includes(q);
                const matchesCategory = item.category.toLowerCase().includes(q);
                const matchesColor = (item.color || "").toLowerCase().includes(q);
                const matchesBrand = (item.brand || "").toLowerCase().includes(q);
                const matchesSku = (item.sku || "").toLowerCase().includes(q);
                if (!matchesName && !matchesCategory && !matchesColor && !matchesBrand && !matchesSku) {
                    return false;
                }
            }
            return true;
        });
    }, [parsedItems, selectedCategoryFilter, stockMatchFilter, stockMatches, tableSearch]);

    // Seçili ve Aktif Ürünlerin Hesaplanması (Sadece tikli ürünler KPI ve aktarıma dahil edilir)
    const selectedItems = useMemo(() => parsedItems.filter(it => it.selected !== false), [parsedItems]);
    const isAllFilteredSelected = filteredItems.length > 0 && filteredItems.every(it => it.selected !== false);
    const filteredSelectedCount = filteredItems.filter(it => it.selected !== false).length;

    const totalItemsCount = selectedItems.length;
    const totalQuantity = selectedItems.reduce((acc, it) => acc + it.quantity, 0);
    const totalBuyUsd = Number(selectedItems.reduce((acc, it) => acc + (it.buyPriceUsd * it.quantity), 0).toFixed(2));
    const totalSellUsd = Number(selectedItems.reduce((acc, it) => acc + (it.sellPriceUsd * it.quantity), 0).toFixed(2));
    const totalProfitUsd = Number((totalSellUsd - totalBuyUsd).toFixed(2));
    const overallProfitMargin = totalBuyUsd > 0 ? Math.round((totalProfitUsd / totalBuyUsd) * 100) : 0;

    // Toplu Satış Fiyatı Artırma (Dolar veya Yüzde)
    const applyBulkMarkup = (amountUsd: number, scope: "ALL" | "SELECTED" = "ALL") => {
        if (isNaN(amountUsd)) {
            toast.error("Lütfen geçerli bir tutar giriniz.");
            return;
        }

        let count = 0;
        setParsedItems(prev => prev.map(item => {
            const isTarget = scope === "SELECTED" ? (item.selected !== false) : true;
            if (!isTarget) return item;

            count++;
            return {
                ...item,
                sellPriceUsd: Number((item.buyPriceUsd + amountUsd).toFixed(2))
            };
        }));

        const scopeLabel = scope === "SELECTED" ? "seçili" : "tüm";
        toast.success(`${count} adet ${scopeLabel} ürünün satış fiyatına +$${amountUsd.toFixed(2)} eklendi (Seçimler korundu).`);
    };

    const applyBulkMarginPercent = (percent: number, scope: "ALL" | "SELECTED" = "ALL") => {
        if (isNaN(percent)) {
            toast.error("Lütfen geçerli bir kâr oranı giriniz.");
            return;
        }

        let count = 0;
        setParsedItems(prev => prev.map(item => {
            const isTarget = scope === "SELECTED" ? (item.selected !== false) : true;
            if (!isTarget) return item;

            count++;
            return {
                ...item,
                sellPriceUsd: Number((item.buyPriceUsd * (1 + percent / 100)).toFixed(2))
            };
        }));

        const scopeLabel = scope === "SELECTED" ? "seçili" : "tüm";
        toast.success(`${count} adet ${scopeLabel} ürüne %${percent} kâr marjı uygulandı (Seçimler korundu).`);
    };

    // Tek bir ürünün ismini güncelleme
    const handleUpdateName = (id: string, newName: string) => {
        setParsedItems(prev => prev.map(item => 
            item.id === id ? { ...item, name: newName } : item
        ));
    };

    // Tek bir ürünün satış fiyatını güncelleme
    const handleUpdateSellPrice = (id: string, newSellPrice: number) => {
        setParsedItems(prev => prev.map(item => 
            item.id === id ? { ...item, sellPriceUsd: Math.max(0, newSellPrice) } : item
        ));
    };

    // Tek bir ürünün adetini güncelleme
    const handleUpdateQuantity = (id: string, newQty: number) => {
        setParsedItems(prev => prev.map(item => 
            item.id === id ? { ...item, quantity: Math.max(1, newQty) } : item
        ));
    };

    // Tek bir ürünün seçim (tik) durumunu değiştirme
    const handleToggleItemSelection = (id: string, selected: boolean) => {
        setParsedItems(prev => prev.map(item => 
            item.id === id ? { ...item, selected } : item
        ));
    };

    // Filtrelenen / Görünümdeki ürünlerin tümünü seçme veya seçimi kaldırma
    const handleToggleFilteredSelectAll = (selectAll: boolean) => {
        const filteredIds = new Set(filteredItems.map(it => it.id));
        setParsedItems(prev => prev.map(item => {
            if (filteredIds.has(item.id)) {
                return { ...item, selected: selectAll };
            }
            return item;
        }));
    };

    // Kategoriye Göre Toplu Seçim / Seçim Kapatma (Örn: Kapakların tüm tikini tek tıkla kapatıp içinden seçmek için)
    const handleBulkSelectCategory = (categoryName: string, selectState: boolean) => {
        let count = 0;
        setParsedItems(prev => prev.map(item => {
            if (categoryName === "ALL" || item.category === categoryName) {
                count++;
                return { ...item, selected: selectState };
            }
            return item;
        }));

        if (categoryName === "ALL") {
            toast.info(selectState ? `Tüm ${count} ürün seçildi.` : `Tüm ürünlerin seçimi kaldırıldı.`);
        } else {
            toast.info(
                selectState
                    ? `"${categoryName}" kategorisindeki ${count} modelin tümü seçildi.`
                    : `"${categoryName}" kategorisindeki tüm tikler kapatıldı (${count} model). Artık dilediklerinizi tek tek açabilirsiniz.`
            );
        }
    };

    // Stoğumda Zaten Olanları Seçme / Ekleme (Tikleri Kapat)
    const handleDeselectExistingStock = () => {
        let deselectedCount = 0;
        setParsedItems(prev => prev.map(item => {
            const isMatch = Boolean(stockMatches[item.name.trim().toLowerCase()]);
            if (isMatch && item.selected !== false) {
                deselectedCount++;
                return { ...item, selected: false };
            }
            return item;
        }));
        toast.info(`Stoğunuzda zaten mevcut olan ${deselectedCount} ürünün seçimi kaldırıldı. Sadece yeni ürünler aktarılacak.`);
    };

    // Stoğumda Zaten Olanları da Seç (Stoğu Artır)
    const handleSelectExistingStock = () => {
        let selectedCount = 0;
        setParsedItems(prev => prev.map(item => {
            const isMatch = Boolean(stockMatches[item.name.trim().toLowerCase()]);
            if (isMatch && !item.selected) {
                selectedCount++;
                return { ...item, selected: true };
            }
            return item;
        }));
        toast.success(`Stoğunuzda zaten mevcut ${selectedCount} ürün seçildi (Stoğu artırılacak).`);
    };

    // Sadece Yeni Ürünleri Seç (Yeniler açık, stoktakiler kapalı)
    const handleSelectOnlyNew = () => {
        setParsedItems(prev => prev.map(item => {
            const isMatch = Boolean(stockMatches[item.name.trim().toLowerCase()]);
            return { ...item, selected: !isMatch };
        }));
        toast.success(`Yalnızca mağazanız için yeni açılacak ürünler (${newItems.length} kalem) seçildi.`);
    };

    // Tek bir ürünün stok kodunu (SKU) güncelleme
    const handleUpdateSku = (id: string, newSku: string) => {
        setParsedItems(prev => prev.map(item => 
            item.id === id ? { ...item, sku: newSku.toUpperCase().trim() } : item
        ));
    };

    // Ekranın Çıtalı (WF) / Çıtasız durumunu hızlı değiştirme
    const handleToggleFrame = (id: string) => {
        setParsedItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const willHaveFrame = !item.hasFrame;
            return {
                ...item,
                hasFrame: willHaveFrame,
                category: willHaveFrame ? "LCD / Ekran (Çıtalı)" : "LCD / Ekran",
            };
        }));
    };

    // Ürünün rengini hızlı değiştirme
    const handleUpdateColor = (id: string, color: string) => {
        setParsedItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            
            let newName = item.name;
            const hasColorInName = KNOWN_COLORS.some(c => newName.toLowerCase().includes(c.toLowerCase()));
            if (!hasColorInName && color) {
                newName = `${newName} ${color}`;
            }
            return {
                ...item,
                name: newName,
                color,
            };
        }));
    };

    // Kategori değiştirme
    const handleUpdateCategory = (id: string, newCategory: string) => {
        setParsedItems(prev => prev.map(it => 
            it.id === id ? { ...it, category: newCategory } : it
        ));
    };

    // Ürünü listeden silme
    const handleDeleteItem = (id: string) => {
        setParsedItems(prev => prev.filter(it => it.id !== id));
    };

    // Renk Bölme (Split Modal) Başlat
    const openSplitModal = (item: ParsedWholesalerItem) => {
        setSplittingItem(item);
        const qty = item.quantity;
        const half1 = Math.ceil(qty / 2);
        const half2 = Math.floor(qty / 2);

        setSplitDistribution([
            { color: "Siyah", qty: half1 > 0 ? half1 : 1 },
            { color: "Beyaz", qty: half2 > 0 ? half2 : 1 },
        ]);
    };

    // Renk Bölme İşlemini Onayla
    const confirmColorSplit = () => {
        if (!splittingItem) return;

        const totalSplitQty = splitDistribution.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        if (totalSplitQty <= 0) {
            toast.error("Lütfen en az 1 adet renk seçiniz.");
            return;
        }

        const newRows: ParsedWholesalerItem[] = splitDistribution
            .filter(d => d.qty > 0)
            .map((d, index) => {
                const colorCode = (d.color || "RNK").substring(0, 3).toUpperCase();
                const splitSku = splittingItem.sku ? `${splittingItem.sku}-${colorCode}` : undefined;
                return {
                    id: `split-${splittingItem.id}-${index}-${Math.random().toString(36).substr(2, 4)}`,
                    sku: splitSku,
                    name: `${splittingItem.name} ${d.color}`.replace(/\s+/g, " ").trim(),
                    category: splittingItem.category,
                    brand: splittingItem.brand,
                    quantity: d.qty,
                    buyPriceUsd: splittingItem.buyPriceUsd,
                    sellPriceUsd: splittingItem.sellPriceUsd,
                    color: d.color,
                    hasFrame: splittingItem.hasFrame,
                    isColorSplit: true,
                    parentItemId: splittingItem.id,
                    selected: true,
                };
            });

        setParsedItems(prev => {
            const index = prev.findIndex(it => it.id === splittingItem.id);
            if (index === -1) return prev;
            const next = [...prev];
            next.splice(index, 1, ...newRows);
            return next;
        });

        // Yeni ürünlerin stok durumunu kontrol et
        queryStockMatches(newRows);

        toast.success(`"${splittingItem.name}" ${newRows.length} farklı renge ayrıldı.`);
        setSplittingItem(null);
    };

    // Stoğa Aktarımı Tamamla (Save to DB)
    const handleFinalImport = () => {
        if (selectedItems.length === 0) {
            toast.error("Lütfen stoğa aktarılacak en az bir ürünün yanındaki tiki işaretleyin.");
            return;
        }

        startTransition(async () => {
            const res = await importWholesalerBatchAction({
                items: selectedItems.map(it => ({
                    name: it.name,
                    category: it.category,
                    brand: it.brand,
                    quantity: it.quantity,
                    buyPriceUsd: it.buyPriceUsd,
                    sellPriceUsd: it.sellPriceUsd,
                    color: it.color,
                    sku: it.sku,
                })),
                supplierId: selectedSupplierId === "NONE" ? null : selectedSupplierId,
                paymentStatus: selectedSupplierId === "NONE" ? "NONE" : paymentStatus,
                notes: `Toptancı Toplu Giriş (${totalQuantity} Adet)`,
            });

            if (res.success) {
                toast.success(
                    `Başarılı! ${res.createdCount} yeni ürün açıldı, ${res.updatedCount} ürünün stoğu artırıldı (${res.totalQuantity} adet, $${res.totalAmountUsd}).`,
                    { duration: 5000 }
                );
                if (res.supplierUpdated) {
                    if (paymentStatus === "UNPAID") {
                        toast.info("Tedarikçi cari hesabına açık hesap (veresiye) borcu eklendi.");
                    } else {
                        toast.info("Tedarikçi alımı peşin olarak kaydedildi (cari bakiye değişmedi).");
                    }
                }
                setOpen(false);
                setStep(1);
                setRawText("");
                setParsedItems([]);
                onSuccess?.();
            } else {
                toast.error(res.error || "Aktarım sırasında bir hata oluştu.");
            }
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="h-10 rounded-xl px-4 font-semibold gap-2 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Toptancı Listesi İçe Aktar (CSV/PDF)</span>
                        </Button>
                    )}
                </DialogTrigger>

                <DialogContent className={cn(
                    "rounded-3xl border-border bg-card p-0 overflow-hidden shadow-2xl transition-all duration-300",
                    step === 1 ? "max-w-2xl" : "max-w-6xl h-[94vh] flex flex-col"
                )}>
                    {/* Header */}
                    <div className="p-6 border-b border-border/50 bg-muted/10 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold">
                                        {step === 1 ? "Toptancı Parça Listesi İçe Aktar" : "Stok Önizleme, Renk Ayrıştırma & Fiyatlandırma"}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                        {step === 1 
                                            ? "CSV, Excel veya WhatsApp/Metin formatındaki toptancı listesini yükleyin." 
                                            : "İsimleri düzenleyin, istemediklerinizi tiki kaldırarak eleyin, satış fiyatlarını toplu belirleyin."}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="rounded-xl px-3 py-1 font-mono text-xs">
                                Adım {step} / 2
                            </Badge>
                        </div>
                    </div>

                    {/* ADIM 1: DOSYA VEYA METİN GİRİŞİ */}
                    {step === 1 && (
                        <div className="p-6 space-y-6">
                            <Tabs defaultValue="paste" className="w-full">
                                <TabsList className="grid grid-cols-2 rounded-2xl p-1 bg-muted/40 h-12 mb-4">
                                    <TabsTrigger value="paste" className="rounded-xl text-xs font-bold gap-2">
                                        <ClipboardPaste className="h-4 w-4" />
                                        <span>Metin Yapıştır (Hızlı)</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="upload" className="rounded-xl text-xs font-bold gap-2">
                                        <UploadCloud className="h-4 w-4" />
                                        <span>Dosya Yükle (.csv, .xlsx, .txt)</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* Sekme 1: Metin Yapıştırma */}
                                <TabsContent value="paste" className="space-y-4 mt-0">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-foreground">
                                                Toptancı Listesi Metni (CSV / Noktalı Virgül / Tablo)
                                            </Label>
                                            <span className="text-[11px] text-muted-foreground">
                                                WhatsApp veya e-postadan kopyalayıp yapıştırabilirsiniz
                                            </span>
                                        </div>
                                        <textarea
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                            placeholder={`Örnek Format:
Kategori;Marka;Model / Ürün Tanımı;Adet;Birim Fiyat ($);Toplam Tutar ($)
Kapak;Apple (iPhone);iPhone 11 Arka Kapak;2;$2,00;$4,00
Kapak;Apple (iPhone);iPhone 13 Arka Kapak;4;$2,50;$10,00
LCD / Ekran;Apple (iPhone);DE Iph 11 Pro Hard Oled Ekran;1;$26,00;$26,00`}
                                            className="w-full h-56 p-4 rounded-2xl border border-border/60 bg-muted/10 font-mono text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none"
                                        />
                                    </div>
                                </TabsContent>

                                {/* Sekme 2: Dosya Yükleme */}
                                <TabsContent value="upload" className="space-y-4 mt-0">
                                    <label className="border-2 border-dashed border-border/80 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/20 transition-all">
                                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                                            <UploadCloud className="h-8 w-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-foreground">Dosyayı sürükleyip bırakın veya tıklayın</p>
                                            <p className="text-xs text-muted-foreground mt-1">.CSV, .XLSX, .XLS veya .TXT formatları desteklenir</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls,.txt,.pdf"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                </TabsContent>
                            </Tabs>

                            {/* Varsayılan Satış Kârı Belirleme */}
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span>Varsayılan Satış Fiyatı Artışı</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        İçe aktarılan her ürünün alış fiyatına otomatik eklenecek kâr tutarı (Önizleme ekranında değiştirebilirsiniz)
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-32">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={defaultMarkup}
                                            onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 0)}
                                            className="pl-8 h-10 rounded-xl text-sm font-bold text-emerald-600"
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground">USD / Ürün</span>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button variant="outline" className="rounded-xl h-11 px-5" onClick={() => setOpen(false)}>
                                    Vazgeç
                                </Button>
                                <Button
                                    className="rounded-xl h-11 px-6 font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    onClick={() => handleParse()}
                                    disabled={!rawText.trim()}
                                >
                                    <span>Listeyi Ayrıştır ve Önizle</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* ADIM 2: ÖNİZLEME, RENK AYRIŞTIRMA VE FİYATLANDIRMA */}
                    {step === 2 && (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {/* Üst İstatistik ve Hızlı Fiyat Şeridi */}
                            <div className="p-5 border-b border-border/50 bg-muted/10 space-y-4 shrink-0">
                                {/* KPI Kartları */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Seçili Kalem</span>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Toplam {parsedItems.length}</span>
                                        </div>
                                        <p className="text-xl font-black text-foreground mt-0.5">{totalItemsCount} Model</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Toplam Giriş Adedi</span>
                                        <p className="text-xl font-black text-foreground mt-0.5">{totalQuantity} Adet</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Toplam Alış Tutarı</span>
                                        <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">${totalBuyUsd.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Tahmini Satış & Kâr</span>
                                        <div className="flex items-baseline gap-1.5 mt-0.5">
                                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                                ${totalSellUsd.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </p>
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                                +{overallProfitMargin}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stokta Var / Yeni Ürün Rozetleri ve Hızlı Seçim Çubuğu */}
                                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Stokta Zaten Var Rozeti */}
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                                            existingItems.length > 0 
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                                : "bg-muted/40 border-border/50 text-muted-foreground"
                                        )}>
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>
                                                {existingItems.length} Kalem Stoğunuzda Mevcut
                                            </span>
                                            <span className="text-[11px] font-semibold opacity-80">
                                                ({existingSelectedCount} model seçili)
                                            </span>
                                            
                                            {existingItems.length > 0 && (
                                                existingSelectedCount > 0 ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-6 px-2 text-[11px] font-bold rounded-lg border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 bg-amber-500/15 ml-1"
                                                        onClick={handleDeselectExistingStock}
                                                        title="Stoğunuzda zaten bulunan ürünlerin tikini kaldırır, sadece yeni ürünleri aktarmanızı sağlar"
                                                    >
                                                        🚫 Stoktakileri Ekleme (Seçimi Kaldır)
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-6 px-2 text-[11px] font-bold rounded-lg border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 bg-amber-500/15 ml-1"
                                                        onClick={handleSelectExistingStock}
                                                        title="Stoğunuzda mevcut ürünlerin tikini tekrar işaretler"
                                                    >
                                                        ✓ Stoktakileri de Ekle
                                                    </Button>
                                                )
                                            )}
                                        </div>

                                        {/* Yeni Ürün Rozeti */}
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                                            newItems.length > 0 
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                                : "bg-muted/40 border-border/50 text-muted-foreground"
                                        )}>
                                            <Sparkles className="h-4 w-4 shrink-0" />
                                            <span>
                                                {newItems.length} Kalem Yeni Ürün
                                            </span>
                                            <span className="text-[11px] font-semibold opacity-80">
                                                ({newSelectedCount} model seçili)
                                            </span>

                                            {existingItems.length > 0 && existingSelectedCount > 0 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 px-2 text-[11px] font-bold rounded-lg border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 bg-emerald-500/15 ml-1"
                                                    onClick={handleSelectOnlyNew}
                                                    title="Yalnızca yeni ürünleri seçili bırakır, stokta olanların tikini kapatır"
                                                >
                                                    ✨ Sadece Yenileri Seç
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stok Durumuna Göre Görünüm Filtresi */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground font-semibold text-[11px] mr-1">Göster:</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={stockMatchFilter === "ALL" ? "secondary" : "ghost"}
                                            className={cn("h-6 px-2 text-[11px] rounded-lg", stockMatchFilter === "ALL" && "font-bold")}
                                            onClick={() => setStockMatchFilter("ALL")}
                                        >
                                            Hepsi ({parsedItems.length})
                                        </Button>
                                        {existingItems.length > 0 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={stockMatchFilter === "EXISTING" ? "secondary" : "ghost"}
                                                className={cn(
                                                    "h-6 px-2 text-[11px] rounded-lg text-amber-600 dark:text-amber-400",
                                                    stockMatchFilter === "EXISTING" && "font-bold bg-amber-500/15"
                                                )}
                                                onClick={() => setStockMatchFilter("EXISTING")}
                                            >
                                                ⚠️ Sadece Stoktakiler ({existingItems.length})
                                            </Button>
                                        )}
                                        {newItems.length > 0 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={stockMatchFilter === "NEW" ? "secondary" : "ghost"}
                                                className={cn(
                                                    "h-6 px-2 text-[11px] rounded-lg text-emerald-600 dark:text-emerald-400",
                                                    stockMatchFilter === "NEW" && "font-bold bg-emerald-500/15"
                                                )}
                                                onClick={() => setStockMatchFilter("NEW")}
                                            >
                                                ✨ Sadece Yeniler ({newItems.length})
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Toplu Fiyatlandırma ve Tedarikçi Çubuğu */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    {/* Toplu Fiyatlandırma Aracı */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <span>Satış Fiyatı Artır:</span>
                                        </span>

                                        {/* Manuel / El ile Fiyat Artırma Girişi */}
                                        <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-xl px-2.5 py-1 shadow-xs">
                                            <span className="text-xs font-bold text-emerald-600">+$</span>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={customMarkupUsd}
                                                onChange={(e) => setCustomMarkupUsd(e.target.value)}
                                                placeholder="5.00"
                                                className="w-16 h-7 p-0 border-0 text-xs font-bold focus-visible:ring-0 text-foreground bg-transparent"
                                            />
                                            <Button
                                                size="sm"
                                                className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                                                onClick={() => applyBulkMarkup(parseFloat(customMarkupUsd) || 0, "ALL")}
                                                title="Tüm ürünlerin satış fiyatına bu tutarı ekler (Seçimler ve değişiklikler korunur)"
                                            >
                                                Tümüne Ekle
                                            </Button>
                                            {selectedItems.length < parsedItems.length && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold border-primary/40 text-primary hover:bg-primary/10"
                                                    onClick={() => applyBulkMarkup(parseFloat(customMarkupUsd) || 0, "SELECTED")}
                                                    title="Yalnızca tiki açık seçili ürünlerin satış fiyatına bu tutarı ekler"
                                                >
                                                    Seçilenlere Ekle ({selectedItems.length})
                                                </Button>
                                            )}
                                        </div>

                                        {/* Hızlı Kısayol Butonları */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                                onClick={() => {
                                                    setCustomMarkupUsd("3.00");
                                                    applyBulkMarkup(3, "ALL");
                                                }}
                                            >
                                                +$3
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 rounded-xl text-xs font-bold border-emerald-500/40 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                onClick={() => {
                                                    setCustomMarkupUsd("5.00");
                                                    applyBulkMarkup(5, "ALL");
                                                }}
                                            >
                                                +$5 (Önerilen)
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                                onClick={() => {
                                                    setCustomMarkupUsd("10.00");
                                                    applyBulkMarkup(10, "ALL");
                                                }}
                                            >
                                                +$10
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 rounded-xl text-xs font-bold border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                                                onClick={() => applyBulkMarginPercent(35, "ALL")}
                                            >
                                                %35 Kâr
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Tedarikçi Seçimi (İsteğe Bağlı) */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                                <SelectTrigger className="w-[180px] h-8 rounded-xl text-xs border-border/60">
                                                    <SelectValue placeholder="Tedarikçi (İsteğe Bağlı)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NONE">Tedarikçi Seçilmedi</SelectItem>
                                                    {suppliers.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {selectedSupplierId !== "NONE" && (
                                                <Select value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)}>
                                                    <SelectTrigger className="w-[190px] h-8 rounded-xl text-xs border-border/60 font-semibold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PAID">✅ Peşin Ödendi (Borç Yok)</SelectItem>
                                                        <SelectItem value="UNPAID">⏳ Açık Hesap / Veresiye (Borç Ekle)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ürün Listesi Tablosu */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                                {/* Akıllı Kategori Filtreleri ve Hızlı Arama */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={selectedCategoryFilter === "ALL" ? "default" : "outline"}
                                            className={cn(
                                                "h-7 rounded-xl text-xs font-semibold px-3",
                                                selectedCategoryFilter === "ALL" && "font-bold shadow-sm"
                                            )}
                                            onClick={() => setSelectedCategoryFilter("ALL")}
                                        >
                                            Tümü ({parsedItems.length})
                                        </Button>
                                        {uniqueCategoriesInList.map(({ cat, count }) => {
                                            const isAccessory = ["Şarj Başlığı", "Set Şarj", "Type-C Kablo", "Lightning Kablo", "Kablo", "Kılıf", "Ekran Koruyucu", "Kulaklık", "Powerbank", "Araç Aksesuarı", "Aksesuar"].includes(cat);
                                            const isFrame = cat.includes("Çıtalı");
                                            return (
                                                <Button
                                                    key={cat}
                                                    type="button"
                                                    size="sm"
                                                    variant={selectedCategoryFilter === cat ? "default" : "outline"}
                                                    className={cn(
                                                        "h-7 rounded-xl text-xs font-semibold px-2.5",
                                                        selectedCategoryFilter === cat 
                                                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                                            : isFrame
                                                                ? "border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                                                                : isAccessory ? "border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10" : ""
                                                    )}
                                                    onClick={() => setSelectedCategoryFilter(cat)}
                                                >
                                                    {isFrame && "🖼️ "}
                                                    {cat} ({count})
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <div className="relative w-56">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Model veya renk ara..."
                                            value={tableSearch}
                                            onChange={(e) => setTableSearch(e.target.value)}
                                            className="h-8 pl-8 pr-7 text-xs rounded-xl bg-card border-border/60"
                                        />
                                        {tableSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setTableSearch("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Kategori Toplu Tik / Seçim Şeridi */}
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-muted/30 border border-border/60 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground">
                                            {selectedCategoryFilter === "ALL" ? "Tüm Kategoriler:" : `${selectedCategoryFilter}:`}
                                        </span>
                                        <span className="text-muted-foreground font-medium">
                                            {filteredItems.length} model ({filteredSelectedCount} model seçili)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 rounded-xl text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                            onClick={() => handleBulkSelectCategory(selectedCategoryFilter, true)}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span>
                                                {selectedCategoryFilter === "ALL" 
                                                    ? "Tümünün Tikini Aç" 
                                                    : `${selectedCategoryFilter} Tümünü Seç`}
                                            </span>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 rounded-xl text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                                            onClick={() => handleBulkSelectCategory(selectedCategoryFilter, false)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            <span>
                                                {selectedCategoryFilter === "ALL" 
                                                    ? "Tümünün Tikini Kaldır (Kapat)" 
                                                    : `${selectedCategoryFilter} Tikini Kapat (${filteredSelectedCount})`}
                                            </span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="border border-border/60 rounded-2xl overflow-hidden shadow-sm bg-card">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider">
                                                <th className="py-3 px-3 w-10 text-center">
                                                    <Checkbox
                                                        checked={isAllFilteredSelected}
                                                        onCheckedChange={(checked) => handleToggleFilteredSelectAll(!!checked)}
                                                        title="Görünümdeki Tümünü Seç / Kaldır"
                                                    />
                                                </th>
                                                <th className="py-3 px-3 w-10 text-center">#</th>
                                                <th className="py-3 px-3 w-36">Kategori</th>
                                                <th className="py-3 px-4 min-w-[240px]">Ürün Tanımı / Model (Düzenlenebilir)</th>
                                                <th className="py-3 px-3 w-32">Renk / Varyant</th>
                                                <th className="py-3 px-3 w-20 text-center">Adet</th>
                                                <th className="py-3 px-3 w-24 text-right">Alış ($)</th>
                                                <th className="py-3 px-3 w-28 text-right">Satış ($)</th>
                                                <th className="py-3 px-3 w-20 text-center">Kâr</th>
                                                <th className="py-3 px-3 w-20 text-center">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {filteredItems.map((item, idx) => {
                                                const profit = item.sellPriceUsd - item.buyPriceUsd;
                                                const canSplit = item.quantity >= 2;
                                                const isSelected = item.selected !== false;
                                                const match = stockMatches[item.name.trim().toLowerCase()];

                                                return (
                                                    <tr key={item.id} className={cn(
                                                        "hover:bg-muted/10 transition-colors group",
                                                        !isSelected && "opacity-40 bg-muted/5"
                                                    )}>
                                                        {/* Tik / Checkbox */}
                                                        <td className="py-3 px-3 text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => handleToggleItemSelection(item.id, !!checked)}
                                                            />
                                                        </td>

                                                        <td className="py-3 px-3 text-center text-muted-foreground font-mono">
                                                            {idx + 1}
                                                        </td>

                                                        {/* Kategori Seçici */}
                                                        <td className="py-3 px-3 font-semibold text-foreground">
                                                            <Select 
                                                                value={item.category} 
                                                                onValueChange={(val) => handleUpdateCategory(item.id, val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-[11px] font-bold rounded-lg border-border/60 w-36 bg-background">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-64">
                                                                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">Yedek Parça</div>
                                                                    {STANDARD_CATEGORIES.filter(c => !["Şarj Başlığı", "Set Şarj", "Type-C Kablo", "Lightning Kablo", "Kablo", "Kılıf", "Ekran Koruyucu", "Kulaklık", "Powerbank", "Araç Aksesuarı", "Aksesuar"].includes(c)).map(cat => (
                                                                        <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                                                    ))}
                                                                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-t border-border mt-1">Aksesuar</div>
                                                                    {STANDARD_CATEGORIES.filter(c => ["Şarj Başlığı", "Set Şarj", "Type-C Kablo", "Lightning Kablo", "Kablo", "Kılıf", "Ekran Koruyucu", "Kulaklık", "Powerbank", "Araç Aksesuarı", "Aksesuar"].includes(c)).map(cat => (
                                                                        <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>

                                                        {/* Ürün İsmi (Düzenlenebilir Input) & Stok Durumu Rozeti & Çıtalı Ekran Ayrımı */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Input
                                                                    value={item.name}
                                                                    onChange={(e) => handleUpdateName(item.id, e.target.value)}
                                                                    className="h-8 font-bold text-xs bg-background border-border/60 focus:border-primary"
                                                                    placeholder="Ürün adını girin..."
                                                                />
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {/* Otomatik Üretilen Stok Kodu (SKU) */}
                                                                    {item.sku && (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-xs"
                                                                            title="Otomatik üretilen stok kodu (SKU)"
                                                                        >
                                                                            <span className="text-[9px] font-semibold text-muted-foreground font-sans">SKU:</span>
                                                                            <span>{item.sku}</span>
                                                                        </span>
                                                                    )}

                                                                    {item.brand && (
                                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                                            {item.brand}
                                                                        </span>
                                                                    )}

                                                                    {/* Çıtalı (WF) / Çıtasız Ekran Rozeti ve Hızlı Değiştirici */}
                                                                    {(item.category.includes("Ekran") || item.category.includes("LCD") || item.hasFrame) && (
                                                                        item.hasFrame || item.category.includes("Çıtalı") ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleFrame(item.id)}
                                                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                                                                                title="Çıtalı ekran (WF). Çıtasız ekrana dönüştürmek için tıklayın."
                                                                            >
                                                                                <span>🖼️ Çıtalı (WF)</span>
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleFrame(item.id)}
                                                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/60 hover:bg-muted/80 transition-colors cursor-pointer"
                                                                                title="Çıtasız ekran. Çıtalı (WF) ekrana dönüştürmek için tıklayın."
                                                                            >
                                                                                <span>Çıtasız</span>
                                                                            </button>
                                                                        )
                                                                    )}

                                                                    {/* Benzer/Aynı Ürün Stok Durumu */}
                                                                    {match ? (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                                                                            title={`Bu ürün mağaza stoğunuzda zaten mevcut (${match.stock} adet). Aktarıldığında stoğu +${item.quantity} adet artırılacak.`}
                                                                        >
                                                                            <AlertTriangle className="h-3 w-3 shrink-0" />
                                                                            <span>Stokta Var ({match.stock} Adet)</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                                                            <Sparkles className="h-3 w-3 shrink-0" />
                                                                            <span>Yeni Ürün</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Renk Seçici */}
                                                        <td className="py-3 px-3">
                                                            <Select 
                                                                value={item.color || "none"} 
                                                                onValueChange={(val) => handleUpdateColor(item.id, val === "none" ? "" : val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-[11px] rounded-lg border-border/60 w-28">
                                                                    <SelectValue placeholder="Renk Seç" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Belirtilmedi</SelectItem>
                                                                    {KNOWN_COLORS.map(c => (
                                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>

                                                        {/* Adet */}
                                                        <td className="py-3 px-3 text-center">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                className="h-7 w-16 text-center mx-auto rounded-lg text-xs font-bold"
                                                            />
                                                        </td>

                                                        {/* Alış ($) */}
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                                            ${item.buyPriceUsd.toFixed(2)}
                                                        </td>

                                                        {/* Satış ($) */}
                                                        <td className="py-3 px-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <span className="text-muted-foreground font-mono">$</span>
                                                                <Input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0"
                                                                    value={item.sellPriceUsd}
                                                                    onChange={(e) => handleUpdateSellPrice(item.id, parseFloat(e.target.value) || 0)}
                                                                    className="h-7 w-20 text-right rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Kâr */}
                                                        <td className="py-3 px-3 text-center">
                                                            <span className={cn(
                                                                "text-[11px] font-bold px-1.5 py-0.5 rounded",
                                                                profit > 0 ? "text-emerald-600 bg-emerald-500/10" : profit < 0 ? "text-rose-600 bg-rose-500/10" : "text-muted-foreground bg-muted"
                                                            )}>
                                                                {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                                                            </span>
                                                        </td>

                                                        {/* İşlem Butonları */}
                                                        <td className="py-3 px-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {canSplit && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10"
                                                                        title="Renklerine Göre Ayrı Ürünlere Böl"
                                                                        onClick={() => openSplitModal(item)}
                                                                    >
                                                                        <Split className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                                                                    title="Listeden Çıkar"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Modal Alt Çubuk (Footer) */}
                            <div className="p-4 border-t border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl h-11 px-4 text-xs font-semibold gap-1.5"
                                    onClick={() => setStep(1)}
                                    disabled={isPending}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Listeyi Değiştir</span>
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="cancel"
                                        className="rounded-xl h-11 px-4 text-xs"
                                        onClick={() => setOpen(false)}
                                        disabled={isPending}
                                    >
                                        İptal
                                    </Button>

                                    <Button
                                        type="button"
                                        className="rounded-xl h-11 px-6 font-bold text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                                        onClick={handleFinalImport}
                                        disabled={isPending || selectedItems.length === 0}
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Stoğa Aktarılıyor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <PackageCheck className="h-4 w-4" />
                                                <span>{selectedItems.length} Kalem ({totalQuantity} Adet) Seçili Parçayı Stoğa Aktar</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* RENK AYIRMA (COLOR SPLIT) DİYALOĞU */}
            {splittingItem && (
                <Dialog open={!!splittingItem} onOpenChange={(o) => !o && setSplittingItem(null)}>
                    <DialogContent className="max-w-md rounded-3xl p-6 bg-card border-border shadow-2xl">
                        <DialogHeader>
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Split className="h-5 w-5" />
                                <DialogTitle className="text-base font-bold">Renklere Göre Ayrı Ürün Olarak Böl</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground pt-1">
                                <strong className="text-foreground">{splittingItem.name}</strong> ({splittingItem.quantity} Adet)
                                <br />Bu ürünü stoğunuzda ayrı ayrı takip edebilmek için renklerine göre paylaştırın:
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-3">
                            {splitDistribution.map((dist, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Select 
                                        value={dist.color} 
                                        onValueChange={(val) => {
                                            const next = [...splitDistribution];
                                            next[idx].color = val;
                                            setSplitDistribution(next);
                                        }}
                                    >
                                        <SelectTrigger className="flex-1 h-10 rounded-xl text-xs font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {KNOWN_COLORS.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={dist.qty}
                                            onChange={(e) => {
                                                const next = [...splitDistribution];
                                                next[idx].qty = parseInt(e.target.value) || 0;
                                                setSplitDistribution(next);
                                            }}
                                            className="h-10 text-center rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Adet</span>

                                    {splitDistribution.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-rose-600 rounded-xl hover:bg-rose-500/10"
                                            onClick={() => {
                                                setSplitDistribution(splitDistribution.filter((_, i) => i !== idx));
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full rounded-xl text-xs font-semibold gap-1.5 border-dashed"
                                onClick={() => {
                                    setSplitDistribution([
                                        ...splitDistribution,
                                        { color: "Mavi", qty: 1 }
                                    ]);
                                }}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Başka Bir Renk Ekle</span>
                            </Button>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button variant="cancel" size="sm" className="rounded-xl" onClick={() => setSplittingItem(null)}>
                                Vazgeç
                            </Button>
                            <Button size="sm" className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white" onClick={confirmColorSplit}>
                                Renkleri Böl ve Tabloya Ekle
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
