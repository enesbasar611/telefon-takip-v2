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
import { createProduct, addInventoryStock, bulkCreateAIInventory } from "@/lib/actions/product-actions";
import {
    Sparkles, Loader2, FolderPlus, CheckCircle2,
    AlertTriangle, RotateCcw, ArrowRight, Folder, Package, ChevronRight,
    Plus, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/context/ui-context";
import { useQuery } from "@tanstack/react-query";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";

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
    "Şarj Aletleri > Type-C > 27W — 12 adet şarj başlığı, alış 10 dolar satış 500 TL, raf A-1",
    "Ekranlar > Samsung > Galaxy S24 Ultra Orijinal Ekran, 2 adet, alış 4500 satış 7500",
    "Aksesuarlar > Kılıf > iPhone 15 Pro Max Lansman Kılıf (Siyah, Mavi, Kırmızı), her birinden 5 adet, alış 80 satış 250",
    "Teknik Servis > Yedek Parça > iPhone 11-14 Arası Bataryalar, her modelden 10 adet, alış 150 satış 450",
    "Kırılmaz Cam > Hayalet Cam > iPhone 13 Pro, 20 adet, alış 20 TL satış 100 TL"
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
    const { data: liveRates } = useQuery({
        queryKey: ["rates"],
        queryFn: () => getCurrentExchangeRates(),
    });
    const currentUsdRate = liveRates?.usd || 35.00;

    const updateProductField = (rowId: string, productIndex: number, field: string, value: any) => {
        setRows(prev => prev.map(r => {
            if (r._id !== rowId) return r;
            const updatedProducts = [...r.products];
            updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                [field]: value
            };
            return {
                ...r,
                products: updatedProducts
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
            // Set all to saving
            setRows(prev => prev.map(r => ({
                ...r,
                _catStatus: "saving",
                _prodStatuses: r.products.map(() => "saving" as const)
            })));

            const res = await bulkCreateAIInventory(rows);

            if (!res.success) {
                toast.error(res.error || "Toplu kayıt sırasında hata oluştu.");
                setRows(prev => prev.map(r => ({
                    ...r,
                    _catStatus: "error",
                    _prodStatuses: r.products.map(() => "error" as const)
                })));
                return;
            }

            // Successfully created/updated
            const newCategories = res.categories as Category[];
            const newProducts = res.products as Product[];

            // Update local state to reflect saved status
            setRows(prev => prev.map(r => ({
                ...r,
                _catStatus: "saved",
                _prodStatuses: r.products.map(() => "saved" as const)
            })));

            // Merge with existing data
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
            toast.success(`${newCategories.length} kategori ve ${newProducts.length} ürün başarıyla işlendi!`);
            
            setTimeout(() => {
                setOpen(false);
            }, 1000);
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

            <DialogContent className="sm:max-w-[1100px] w-[95vw] bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border-zinc-200 dark:border-[#333333] text-foreground dark:text-white p-0 shadow-2xl gemini-aura-modal">
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
                                        {row.products.length >= 0 && (
                                            <div className="ml-6 space-y-2">
                                                {row.products.map((p, pi) => {
                                                    const isUsd = p.buyPriceUsd !== null && p.buyPriceUsd !== undefined;
                                                    return (
                                                        <div key={pi} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-zinc-100 dark:border-zinc-800/40 w-full flex-wrap md:flex-nowrap">
                                                            <Package className="h-4 w-4 text-zinc-400 shrink-0" />
                                                            
                                                            {/* Product Name Input */}
                                                            <div className="flex-1 min-w-[180px]">
                                                                <Input 
                                                                    value={p.name} 
                                                                    onChange={e => updateProductField(row._id, pi, "name", e.target.value)}
                                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                                    placeholder="Ürün adı"
                                                                    className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-semibold"
                                                                />
                                                            </div>

                                                            {/* Stock Input */}
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

                                                            {/* Buy Price Input */}
                                                            <div className="w-28 shrink-0 flex items-center gap-1">
                                                                <span className="text-xs text-amber-500 font-black">{isUsd ? "$" : "₺"}</span>
                                                                <Input 
                                                                    type="number"
                                                                    value={(isUsd ? p.buyPriceUsd : p.buyPrice) ?? ""} 
                                                                    onChange={e => {
                                                                        const val = Number(e.target.value) || 0;
                                                                        if (isUsd) {
                                                                            updateProductField(row._id, pi, "buyPriceUsd", val);
                                                                            updateProductField(row._id, pi, "buyPrice", Math.ceil(val * currentUsdRate));
                                                                        } else {
                                                                            updateProductField(row._id, pi, "buyPrice", val);
                                                                        }
                                                                    }}
                                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                                    placeholder="Alış"
                                                                    className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-center text-amber-600 dark:text-amber-300"
                                                                />
                                                            </div>

                                                            {/* Sell Price Input */}
                                                            <div className="w-28 shrink-0 flex items-center gap-1">
                                                                <span className="text-xs text-emerald-500 font-black">{isUsd ? "$" : "₺"}</span>
                                                                <Input 
                                                                    type="number"
                                                                    value={(isUsd ? p.sellPriceUsd : p.sellPrice) ?? ""} 
                                                                    onChange={e => {
                                                                        const val = Number(e.target.value) || 0;
                                                                        if (isUsd) {
                                                                            updateProductField(row._id, pi, "sellPriceUsd", val);
                                                                            updateProductField(row._id, pi, "sellPrice", Math.ceil(val * currentUsdRate));
                                                                        } else {
                                                                            updateProductField(row._id, pi, "sellPrice", val);
                                                                        }
                                                                    }}
                                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                                    placeholder="Satış"
                                                                    className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-center text-emerald-600 dark:text-emerald-300"
                                                                />
                                                            </div>

                                                            {/* Location Input */}
                                                            <div className="w-24 shrink-0">
                                                                <Input 
                                                                    value={p.location || ""} 
                                                                    onChange={e => updateProductField(row._id, pi, "location", e.target.value)}
                                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                                    placeholder="Raf/Konum"
                                                                    className="h-8 text-xs rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-medium text-center"
                                                                />
                                                            </div>

                                                            {/* Status Icon & Delete Button */}
                                                            <div className="shrink-0 pl-1 flex items-center gap-1.5">
                                                                {row._prodStatuses[pi] === "pending" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-muted-foreground uppercase">—</span>}
                                                                {row._prodStatuses[pi] === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />}
                                                                {row._prodStatuses[pi] === "saved" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                                                {row._prodStatuses[pi] === "error" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                                                                
                                                                {row._catStatus !== "saved" && row._catStatus !== "skipped" && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeProductFromRow(row._id, pi)}
                                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg shrink-0"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                
                                                {/* Add Product Button */}
                                                {row._catStatus !== "saved" && row._catStatus !== "skipped" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addNewProductToRow(row._id)}
                                                        className="h-8 text-xs font-bold text-indigo-600 dark:text-violet-400 hover:text-indigo-700 dark:hover:text-violet-300 hover:bg-indigo-500/10 dark:hover:bg-violet-500/10 rounded-xl gap-1 px-3 mt-1"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Yeni Ürün Ekle
                                                    </Button>
                                                )}
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







