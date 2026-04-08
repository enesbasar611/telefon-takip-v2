"use client";

import { useState, useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { parseBulkProductsWithAI, AIProductResult } from "@/lib/actions/gemini-actions";
import { createProduct } from "@/lib/actions/product-actions";
import {
    Sparkles, Loader2, Layers, Trash2, CheckCircle2,
    AlertTriangle, RotateCcw, Plus, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface BulkAddProductModalProps {
    categories: Category[];
}

type ProductRow = AIProductResult & {
    _id: string;
    _status: "pending" | "saving" | "saved" | "error";
    _error?: string;
};

function getCategoryName(categories: Category[], id: string | null): string {
    if (!id) return "—";
    const cat = categories.find(c => c.id === id);
    return cat?.name || "Bilinmiyor";
}

export function BulkAddProductModal({ categories }: BulkAddProductModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"input" | "review">("input");
    const [description, setDescription] = useState("");
    const [rows, setRows] = useState<ProductRow[]>([]);
    const [isAIPending, startAITransition] = useTransition();
    const [isSavePending, startSaveTransition] = useTransition();
    const [savedCount, setSavedCount] = useState(0);

    const handleAnalyze = () => {
        if (!description.trim()) { toast.warning("Açıklama boş olamaz."); return; }
        startAITransition(async () => {
            const result = await parseBulkProductsWithAI(description);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const newRows: ProductRow[] = result.data.map((item, i) => ({
                ...item,
                _id: `row-${Date.now()}-${i}`,
                _status: "pending"
            }));
            setRows(newRows);
            setStep("review");
            toast.success(`${newRows.length} ürün tespit edildi!`, { description: "Bilgileri gözden geçirin ve kaydedin." });
        });
    };

    const updateRow = (id: string, field: keyof AIProductResult, value: any) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(r => r._id !== id));
    };

    const handleSaveAll = () => {
        const pendingRows = rows.filter(r => r._status === "pending");
        if (pendingRows.length === 0) { toast.info("Kaydedilecek ürün yok."); return; }

        startSaveTransition(async () => {
            let saved = 0;
            for (const row of pendingRows) {
                setRows(prev => prev.map(r => r._id === row._id ? { ...r, _status: "saving" } : r));
                try {
                    const result = await createProduct({
                        name: row.name,
                        categoryId: row.categoryId || "",
                        buyPrice: row.buyPrice,
                        buyPriceUsd: row.buyPriceUsd ?? null,
                        sellPrice: row.sellPrice,
                        stock: row.stock,
                        criticalStock: row.criticalStock,
                        barcode: row.barcode,
                        location: row.location,
                    });
                    if (result.success) {
                        saved++;
                        setRows(prev => prev.map(r => r._id === row._id ? { ...r, _status: "saved" } : r));
                    } else {
                        setRows(prev => prev.map(r => r._id === row._id ? { ...r, _status: "error", _error: result.message || "Hata" } : r));
                    }
                } catch {
                    setRows(prev => prev.map(r => r._id === row._id ? { ...r, _status: "error", _error: "Sunucu hatası" } : r));
                }
            }
            setSavedCount(s => s + saved);
            toast.success(`${saved}/${pendingRows.length} ürün başarıyla kaydedildi!`);
        });
    };

    const handleReset = () => {
        setStep("input");
        setRows([]);
        setDescription("");
        setSavedCount(0);
    };

    const pendingCount = rows.filter(r => r._status === "pending").length;
    const savedRowCount = rows.filter(r => r._status === "saved").length;
    const errorCount = rows.filter(r => r._status === "error").length;

    const categorySuggestions: Record<string, string> = {
        "telefon": "Samsung S23 Ultra 2 adet, iPhone 15 Pro 128GB 3 adet, alış 35000 satış 42000 TL",
        "ekran": "iPhone 11 asy ekran 5 adet, Samsung A54 orijinal ekran 3 adet, alış 450 satış 950 TL",
        "batarya": "iPhone X deji batarya 10 adet, iPhone 11 yüksek kapasite 5 adet, alış 220 satış 480 TL",
        "şarj": "Apple 20W Type-C hızlı şarj başlığı 20 adet, alış 135 satış 350 TL",
        "kılıf": "iPhone 13-14-15 lansman kılıf karışık renklerden 50 adet, alış 40 satış 150 TL",
        "aksesuar": "Airpod 3. nesil 5 adet, Watch 8 Ultra kordon 10 adet, alış 450 satış 850 TL"
    };

    const getDynamicSuggestions = () => {
        const found = categories.filter(c => !c.parentId).map(c => {
            const key = Object.keys(categorySuggestions).find(k => c.name.toLowerCase().includes(k));
            if (key) return { id: c.id, name: c.name, text: categorySuggestions[key] };
            return null;
        }).filter(Boolean);

        return found.length > 0 ? found : categories.slice(0, 4).map(c => ({
            id: c.id,
            name: c.name,
            text: `${c.name} kategorisine uygun ürünler, 10 adet, alış 100 satış 200 TL`
        }));
    };

    const dynamicSuggestions = getDynamicSuggestions();

    const EXAMPLES = [
        "Type-C 27W şarj aleti 10 adet, alış 85 satış 150 TL, Raf: B-3",
        "iPhone 11'den iPhone 15 Pro Max'e kadar tüm modellerin hayalet camı, 10'ar adet, alış 45 satış 95 TL",
        "Samsung Galaxy S22, S23, S24 batarya 5 adet, alış 220 satış 380",
    ];

    return (
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) handleReset(); }}>
            <DialogTrigger asChild>
                <Button
                    className="gap-2 h-10 px-5 rounded-xl bg-[#111] border border-[#333] text-violet-400 hover:bg-[#18181A] transition-all  text-xs uppercase tracking-wider"
                >
                    <Sparkles className="h-4 w-4" />
                    BAŞAR AI Stok Ekle
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[900px] bg-[#111111] border border-[#333333] text-white p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-7 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="font-medium text-xl  tracking-tight">Toplu AI Stok Ekleme</DialogTitle>
                            <p className="text-[12px] text-muted-foreground mt-1 font-medium">
                                BAŞAR AI: Tek bir açıklama yazın, yapay zeka envanter tablosunu otomatik oluştursun.
                            </p>
                        </div>
                        {step === "review" && (
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-2xl  text-violet-400">{rows.length}</p>
                                    <p className="text-[9px] text-muted-foreground/80 uppercase ">Tespit</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl  text-emerald-400">{savedRowCount}</p>
                                    <p className="text-[9px] text-muted-foreground/80 uppercase ">Kaydedildi</p>
                                </div>
                                {errorCount > 0 && (
                                    <div className="text-center">
                                        <p className="text-2xl  text-red-400">{errorCount}</p>
                                        <p className="text-[9px] text-muted-foreground/80 uppercase ">Hata</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="p-7 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar">

                    {/* STEP 1: INPUT */}
                    {step === "input" && (
                        <div className="space-y-5">
                            {/* Category-based Suggestions */}
                            <div className="space-y-2">
                                <p className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="h-3 w-3 text-violet-400" /> Kategori Bazlı Öneriler
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {dynamicSuggestions.map((s: any) => (
                                        <Button
                                            key={s.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDescription(s.text)}
                                            className="h-8 rounded-full bg-[#18181A] border-[#333] text-[11px]  hover:bg-violet-600/10 hover:border-violet-500/50 hover:text-violet-400 text-muted-foreground transition-all"
                                        >
                                            {s.name} Ekle
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Examples */}
                            <div className="space-y-2">
                                <p className="text-[10px]  text-muted-foreground/80 uppercase tracking-widest">✨ Genel Örnekler</p>
                                <div className="space-y-2">
                                    {EXAMPLES.map((ex, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setDescription(ex)}
                                            className="w-full text-left px-4 py-3 rounded-lg bg-[#18181A] border border-[#222222] text-[12px] text-foreground hover:bg-[#222222] hover:border-[#444] hover:text-white transition-all font-medium leading-relaxed"
                                        >
                                            <span className="text-violet-400  mr-2">{i + 1}.</span>
                                            {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Textarea */}
                            <div className="space-y-2">
                                <Label className="font-medium text-[11px]  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Komut Verin
                                </Label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Örn: iPhone 11'den 17 Pro Max'e kadar hayalet camı, 10'ar adet, alış 1.5 dolar satış 200 TL"
                                    rows={5}
                                    className="w-full bg-[#18181A] border border-[#333333] rounded-lg px-5 py-4 text-[13px] font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none transition-all leading-relaxed"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze(); }}
                                />
                                <div className="flex flex-col gap-1 mt-2">
                                    <p className="text-[11px] text-muted-foreground/80">
                                        💡 <strong className="text-foreground">İpucu:</strong> "alış 1.5 dolar" derseniz sistem kuru otomatik hesaplar.
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-mono">
                                        [Ctrl+Enter] Hızlı analiz başlatır
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={isAIPending || !description.trim()}
                                className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white  text-[14px] uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] disabled:opacity-40 gap-3"
                            >
                                {isAIPending ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> Gemini Analiz Ediyor...</>
                                ) : (
                                    <><Sparkles className="h-5 w-5 animate-pulse" /> Yapay Zeka ile Ayrıştır</>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: REVIEW TABLE */}
                    {step === "review" && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto rounded-lg border border-[#333333] bg-[#18181A]">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-[#333333] bg-[#111111]">
                                            <th className="text-left px-4 py-3 text-[10px]  text-muted-foreground uppercase tracking-widest w-8">#</th>
                                            <th className="text-left px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Ürün Adı</th>
                                            <th className="text-left px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Kategori</th>
                                            <th className="text-right px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Maliyet</th>
                                            <th className="text-right px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Satış ₺</th>
                                            <th className="text-center px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Adet</th>
                                            <th className="text-left px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Raf</th>
                                            <th className="text-center px-4 py-3 text-[10px]  text-muted-foreground/80 uppercase tracking-widest">Durum</th>
                                            <th className="px-4 py-3 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => (
                                            <tr
                                                key={row._id}
                                                className={cn(
                                                    "border-b border-border/50 transition-colors",
                                                    row._status === "saved" && "bg-emerald-500/5",
                                                    row._status === "error" && "bg-red-500/5",
                                                    row._status === "saving" && "opacity-70 animate-pulse"
                                                )}
                                            >
                                                <td className="px-4 py-3 text-slate-600 ">{i + 1}</td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={row.name}
                                                        onChange={e => updateRow(row._id, "name", e.target.value)}
                                                        disabled={row._status === "saved"}
                                                        className="h-8 bg-white/[0.03] border-border rounded-lg text-[12px] font-semibold min-w-[180px] disabled:opacity-60"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground font-medium max-w-[120px] truncate">
                                                    {row.categoryPath.length > 0
                                                        ? getCategoryName(categories, row.categoryPath[row.categoryPath.length - 1])
                                                        : <span className="text-red-400/70">Seçilmedi</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col items-end gap-1 min-w-[90px]">
                                                        {row.buyPriceUsd != null && (
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1.5 text-[10px]  text-emerald-500/50">$</span>
                                                                <Input
                                                                    type="number"
                                                                    value={row.buyPriceUsd}
                                                                    onChange={e => updateRow(row._id, "buyPriceUsd", Number(e.target.value))}
                                                                    disabled={row._status === "saved"}
                                                                    className="h-6 bg-emerald-500/5 border-emerald-500/20 rounded-md text-[11px]  text-emerald-400 w-20 text-right pl-5 disabled:opacity-60"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-2 text-[10px]  text-amber-500/50">₺</span>
                                                            <Input
                                                                type="number"
                                                                value={row.buyPrice}
                                                                onChange={e => updateRow(row._id, "buyPrice", Number(e.target.value))}
                                                                disabled={row._status === "saved"}
                                                                className="h-8 bg-white/[0.03] border-border rounded-lg text-[12px]  text-amber-300 w-24 text-right pl-5 disabled:opacity-60"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        value={row.sellPrice}
                                                        onChange={e => updateRow(row._id, "sellPrice", Number(e.target.value))}
                                                        disabled={row._status === "saved"}
                                                        className="h-8 bg-white/[0.03] border-emerald-500/20 rounded-lg text-[12px]  text-emerald-300 w-24 text-right disabled:opacity-60"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        value={row.stock}
                                                        onChange={e => updateRow(row._id, "stock", Number(e.target.value))}
                                                        disabled={row._status === "saved"}
                                                        className="h-8 bg-white/[0.03] border-border rounded-lg text-[12px]  text-blue-300 w-16 text-center disabled:opacity-60"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={row.location || ""}
                                                        onChange={e => updateRow(row._id, "location", e.target.value || undefined)}
                                                        disabled={row._status === "saved"}
                                                        placeholder="Raf..."
                                                        className="h-8 bg-white/[0.03] border-border rounded-lg text-[12px] font-medium w-24 disabled:opacity-60"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {row._status === "pending" && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-[9px]  text-muted-foreground uppercase">Bekliyor</span>
                                                    )}
                                                    {row._status === "saving" && (
                                                        <Loader2 className="h-4 w-4 animate-spin text-violet-400 mx-auto" />
                                                    )}
                                                    {row._status === "saved" && (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                                    )}
                                                    {row._status === "error" && (
                                                        <span title={row._error} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px]  text-red-400 uppercase cursor-help">
                                                            <AlertTriangle className="h-2.5 w-2.5" /> Hata
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row._status !== "saved" && (
                                                        <button type="button" onClick={() => removeRow(row._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="flex gap-3">
                                    <Button type="button" variant="ghost" onClick={handleReset}
                                        className="gap-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl h-10 px-4 text-[12px] ">
                                        <RotateCcw className="h-4 w-4" /> Yeniden Yaz
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => {
                                        const newRow: ProductRow = {
                                            _id: `row-manual-${Date.now()}`, _status: "pending",
                                            name: "Yeni Ürün", categoryId: null, categoryPath: [],
                                            buyPrice: 0, buyPriceUsd: null, sellPrice: 0, stock: 1, criticalStock: 3, confidence: "low"
                                        };
                                        setRows(prev => [...prev, newRow]);
                                    }}
                                        className="gap-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl h-10 px-4 text-[12px] ">
                                        <Plus className="h-4 w-4" /> Satır Ekle
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleSaveAll}
                                    disabled={isSavePending || pendingCount === 0}
                                    className={cn(
                                        "h-12 px-8 rounded-xl  text-[13px] uppercase tracking-wider transition-all gap-2",
                                        pendingCount > 0
                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                                            : "bg-muted text-muted-foreground/80 cursor-not-allowed"
                                    )}
                                >
                                    {isSavePending ? (
                                        <><Loader2 className="h-5 w-5 animate-spin" /> Kaydediliyor...</>
                                    ) : (
                                        <><ArrowRight className="h-5 w-5" /> {pendingCount} Ürünü Kaydet</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}





