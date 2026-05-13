"use client";

import { Label } from "@/components/ui/label";
import { useState, useTransition, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { parseCategoryTreeWithAI, AICategoryNode } from "@/lib/actions/gemini-actions";
import { createCategory } from "@/lib/actions/category-actions";
import { createProduct, addInventoryStock } from "@/lib/actions/product-actions";
import {
    Sparkles, Loader2, FolderPlus, CheckCircle2,
    AlertTriangle, RotateCcw, ArrowRight, Folder, Package, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/context/ui-context";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
    order: number;
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
    categories: Category[];
    allProducts: Product[];
    onCategoriesUpdated: (newCategories: Category[]) => void;
    onProductsUpdated: (newProducts: Product[]) => void;
}

type NodeRow = AICategoryNode & {
    _id: string;
    _catStatus: "pending" | "saving" | "saved" | "skipped" | "error";
    _catId?: string; // resolved after save
    _prodStatuses: ("pending" | "saving" | "saved" | "error")[];
};

const EXAMPLES = [
    "Şarj Aletleri > Type-C > 27W — 10 adet şarj aleti, alış 100 TL satış 500 TL",
    "Ekranlar > Samsung > Galaxy S24 hayalet cam, 5 adet, alış 55 satış 120",
    "Piller > iPhone Batarya > iPhone 11, 12, 13, 14 her biri 8 adet alış 180 satış 350",
];

const getAIPriceDisplay = (price: number, usdPrice?: number | null) => {
    if (usdPrice && Number(usdPrice) > 0) {
        return `$${Number(usdPrice).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
    }
    return `₺${Number(price || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
};

export function AICategoryCreator({
    categories,
    allProducts,
    onCategoriesUpdated,
    onProductsUpdated
}: AICategoryCreatorProps) {
    const { setAiLoading, setAiInputFocused } = useUI();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"input" | "review">("input");
    const [description, setDescription] = useState("");
    const [rows, setRows] = useState<NodeRow[]>([]);
    const [isAIPending, startAI] = useTransition();
    const [isSavePending, startSave] = useTransition();

    useEffect(() => {
        const loading = isAIPending || isSavePending;
        setAiLoading(loading);
    }, [isAIPending, isSavePending, setAiLoading]);

    const handleAnalyze = () => {
        if (!description.trim()) {
            toast.warning("Açıklama boş olamaz.");
            return;
        }
        startAI(async () => {
            const result = await parseCategoryTreeWithAI(description);
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
            setRows(newRows);
            setStep("review");
            toast.success(`${newRows.length} kategori ve ${newRows.reduce((a, r) => a + r.products.length, 0)} ürün tespit edildi!`);
        });
    };

    const updateRow = (id: string, field: keyof AICategoryNode, value: any) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
    };

    const handleSaveAll = () => {
        startSave(async () => {
            // Accumulate created categories for this session to resolve parentIds
            const createdMap: Record<string, string> = {}; // name → id
            // Seed with existing categories
            categories.forEach(c => { createdMap[c.name.toLowerCase()] = c.id; });

            const updatedCats: Category[] = [...categories];
            const updatedProds: Product[] = [...allProducts];

            for (const row of rows) {
                if (row._catStatus === "saved" || row._catStatus === "skipped") continue;

                setRows(prev => prev.map(r => r._id === row._id ? { ...r, _catStatus: "saving" } : r));

                // Resolve parentId
                const parentId = row.parentName
                    ? createdMap[row.parentName.toLowerCase()] || undefined
                    : undefined;

                // Check if category already exists
                const existingCat = categories.find(c =>
                    c.name.toLowerCase() === row.name.toLowerCase() &&
                    (parentId ? c.parentId === parentId : !c.parentId)
                );

                let catId: string;
                if (existingCat) {
                    catId = existingCat.id;
                    createdMap[row.name.toLowerCase()] = catId;
                    setRows(prev => prev.map(r => r._id === row._id ? { ...r, _catStatus: "skipped", _catId: catId } : r));
                } else {
                    const res = await createCategory({ name: row.name, parentId });
                    if (!res.success || !res.category) {
                        setRows(prev => prev.map(r => r._id === row._id ? { ...r, _catStatus: "error" } : r));
                        continue;
                    }
                    catId = (res.category as Category).id;
                    createdMap[row.name.toLowerCase()] = catId;
                    updatedCats.push(res.category as Category);
                    setRows(prev => prev.map(r => r._id === row._id ? { ...r, _catStatus: "saved", _catId: catId } : r));
                }

                // Save products for this category
                for (let pi = 0; pi < row.products.length; pi++) {
                    const p = row.products[pi];
                    setRows(prev => prev.map(r => {
                        if (r._id !== row._id) return r;
                        const ps = [...r._prodStatuses]; ps[pi] = "saving";
                        return { ...r, _prodStatuses: ps };
                    }));

                    const pRes = await createProduct({
                        name: p.name,
                        categoryId: catId,
                        buyPrice: p.buyPrice,
                        buyPriceUsd: p.buyPriceUsd ?? null,
                        sellPrice: p.sellPrice,
                        sellPriceUsd: p.sellPriceUsd ?? null,
                        stock: p.stock,
                        criticalStock: p.criticalStock,
                        barcode: p.barcode,
                        location: p.location,
                        attributes: {
                            priceCurrency: p.buyPriceUsd || p.sellPriceUsd ? "USD" : "TRY"
                        }
                    });

                    let pStatus: "saved" | "error" = pRes.success ? "saved" : "error";

                    if (pRes.success && pRes.product) {
                        updatedProds.push(pRes.product as Product);
                    }

                    // If duplicate, try adding stock
                    if (!pRes.success && (pRes as any).isDuplicate && (pRes as any).product) {
                        const existingProdId = (pRes as any).product.id;
                        const addRes = await addInventoryStock(existingProdId, p.stock, "AI Çoklu Ekle (Mevcut Ürün)");
                        if (addRes.success) {
                            pStatus = "saved";
                            // Update existing product in state
                            const index = updatedProds.findIndex(up => up.id === existingProdId);
                            if (index !== -1) {
                                updatedProds[index] = { ...updatedProds[index], stock: updatedProds[index].stock + p.stock };
                            }
                        }
                    }

                    setRows(prev => prev.map(r => {
                        if (r._id !== row._id) return r;
                        const ps = [...r._prodStatuses]; ps[pi] = pStatus;
                        return { ...r, _prodStatuses: ps };
                    }));
                }
            }

            onCategoriesUpdated(updatedCats);
            onProductsUpdated(updatedProds);
            toast.success("Tüm işlemler tamamlandı!");
        });
    };

    const totalPendingCats = rows.filter(r => r._catStatus === "pending").length;
    const totalPendingProds = rows.reduce((a, r) => a + r._prodStatuses.filter(ps => ps === "pending").length, 0);
    const totalProds = rows.reduce((a, r) => a + r.products.length, 0);

    return (
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setStep("input"); setRows([]); setDescription(""); } }}>
            <DialogTrigger asChild>
                <Button
                    className="gap-2 h-10 px-5 rounded-xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#333] text-indigo-600 dark:text-violet-400 hover:bg-zinc-50 dark:hover:bg-[#18181A] transition-all text-xs font-bold uppercase tracking-wider shadow-sm gemini-aura-button"
                >
                    <Sparkles className="h-4 w-4" />
                    BAŞAR AI Çoklu Ekle
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[760px] bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border-zinc-200 dark:border-[#333333] text-foreground dark:text-white p-0 shadow-2xl gemini-aura-modal">
                <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 dark:bg-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="font-bold text-2xl text-indigo-600 dark:text-white tracking-tight uppercase italic">AI ile Kategori + Ürün Oluştur</DialogTitle>
                            <p className="text-xs text-zinc-500 dark:text-muted-foreground mt-0.5 font-medium">
                                BAŞAR AI: Tek cümleyle hiyerarşiyi ve ürünleri tanımlayın, yapay zeka otomatik oluştursun.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

                    {step === "input" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-[10px] text-zinc-500 dark:text-muted-foreground/80 uppercase tracking-[0.2em] font-bold pl-1">💡 Örnek Söylemler</p>
                                {EXAMPLES.map((ex, i) => (
                                    <button key={i} type="button" onClick={() => setDescription(ex)}
                                        className="w-full text-left px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-[#18181A] border border-zinc-200 dark:border-[#222222] text-sm text-zinc-700 dark:text-foreground hover:bg-zinc-100 dark:hover:bg-[#222222] hover:border-indigo-500/30 dark:hover:border-[#444] hover:text-indigo-600 dark:hover:text-white transition-all leading-relaxed shadow-sm group">
                                        <span className="text-indigo-600 dark:text-violet-400 font-bold mr-3">{i + 1}.</span>
                                        <span className="font-medium italic group-hover:not-italic transition-all">{ex}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <Label className="font-bold text-[10px]  text-zinc-500 dark:text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-violet-500" /> KOMUT VERİN
                                </Label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={5}
                                    onFocus={() => { setAiInputFocused(true); }}
                                    onBlur={() => { setAiInputFocused(false); }}
                                    placeholder="Örn: Şarj Aletleri > Type-C > 27W — 10 adet şarj aleti, alış 1.5 dolar satış 500 TL..."
                                    className="w-full bg-zinc-50 dark:bg-[#18181A] border border-zinc-200 dark:border-[#333333] rounded-2xl px-5 py-4 text-sm text-foreground dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none leading-relaxed shadow-inner"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze(); }}
                                />
                                <div className="flex flex-col gap-1.5 mt-2 pl-1">
                                    <p className="text-xs text-zinc-500 dark:text-muted-foreground/80 font-medium">
                                        💡 <strong className="text-indigo-600 dark:text-foreground">İpucu:</strong> Kategorileri " {">"} " işareti ile veya virgülle ayırabilirsiniz.
                                    </p>
                                    <p className="text-[10px] text-zinc-400 font-mono tracking-tighter">
                                        [Ctrl+Enter] Hızlı analiz başlatır
                                    </p>
                                </div>
                            </div>

                            <Button onClick={handleAnalyze} disabled={isAIPending || !description.trim()}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold uppercase tracking-[0.1em] gap-3 disabled:opacity-40 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]">
                                {isAIPending
                                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Gemini Analiz Ediyor...</>
                                    : <><Sparkles className="h-5 w-5" /> Analiz Et & Önizle</>}
                            </Button>
                        </div>
                    )}

                    {step === "review" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px]  text-muted-foreground/80 uppercase tracking-widest">
                                    Tespit Edilen Plan — {rows.length} kategori, {totalProds} ürün
                                </p>
                                <Button variant="ghost" onClick={() => { setStep("input"); setRows([]); }}
                                    className="gap-1.5 text-muted-foreground/80 hover:text-white h-8 px-3 text-[11px]  rounded-lg">
                                    <RotateCcw className="h-3.5 w-3.5" /> Yeniden Yaz
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {rows.map((row) => (
                                    <div key={row._id} className={cn(
                                        "rounded-2xl border p-5 space-y-4 transition-all shadow-sm",
                                        row._catStatus === "saved" || row._catStatus === "skipped" ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10" :
                                            row._catStatus === "error" ? "border-red-500/30 bg-red-50/50 dark:bg-red-500/10" :
                                                "border-zinc-200 dark:border-[#333333] bg-zinc-50/50 dark:bg-[#18181A]"
                                    )}>
                                        {/* Category row */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                {row.parentName && (
                                                    <>
                                                        <span className="text-[11px] text-muted-foreground/80 font-medium">{row.parentName}</span>
                                                        <ChevronRight className="h-3 w-3 text-slate-600" />
                                                    </>
                                                )}
                                                <Folder className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                                <Input value={row.name} onChange={e => updateRow(row._id, "name", e.target.value)}
                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                    className="h-9 bg-white dark:bg-[#111111] border-zinc-200 dark:border-[#333333] rounded-xl text-sm font-bold max-w-[220px] disabled:opacity-60 shadow-sm" />
                                            </div>
                                            <div>
                                                {row._catStatus === "pending" && <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-700/50 text-muted-foreground  uppercase">Bekliyor</span>}
                                                {row._catStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                                                {row._catStatus === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                {row._catStatus === "skipped" && <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400  uppercase">Zaten Var</span>}
                                                {row._catStatus === "error" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                                            </div>
                                        </div>

                                        {/* Products */}
                                        {row.products.length > 0 && (
                                            <div className="ml-6 space-y-2">
                                                {row.products.map((p, pi) => (
                                                    <div key={pi} className="flex items-center gap-3 flex-wrap">
                                                        <Package className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                                                        <span className="text-[11px] text-foreground font-medium flex-1 min-w-[120px]">{p.name}</span>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-[11px] text-amber-600 dark:text-amber-300 font-bold">Alış: <b className="text-amber-700 dark:text-amber-200">{getAIPriceDisplay(p.buyPrice, p.buyPriceUsd)}</b></span>
                                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-300 font-bold">Satış: <b className="text-emerald-700 dark:text-emerald-200">{getAIPriceDisplay(p.sellPrice, p.sellPriceUsd)}</b></span>
                                                            <span className="text-[11px] text-indigo-600 dark:text-blue-300 font-bold">{p.stock} adet</span>
                                                            {p.location && <span className="text-[11px] text-zinc-500 dark:text-muted-foreground/80 font-medium">📍 {p.location}</span>}
                                                        </div>
                                                        <div>
                                                            {row._prodStatuses[pi] === "pending" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-muted-foreground  uppercase">—</span>}
                                                            {row._prodStatuses[pi] === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />}
                                                            {row._prodStatuses[pi] === "saved" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                                            {row._prodStatuses[pi] === "error" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSaveAll} disabled={isSavePending || (totalPendingCats === 0 && totalPendingProds === 0)}
                                    className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold uppercase tracking-[0.2em] gap-3 disabled:opacity-40 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all">
                                    {isSavePending
                                        ? <><Loader2 className="h-5 w-5 animate-spin" /> Oluşturuluyor...</>
                                        : <><ArrowRight className="h-5 w-5" /> Tümünü Oluştur</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}







