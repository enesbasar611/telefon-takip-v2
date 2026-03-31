"use client";

import { useState, useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { parseCategoryTreeWithAI, AICategoryNode } from "@/lib/actions/gemini-actions";
import { createCategory } from "@/lib/actions/category-actions";
import { createProduct } from "@/lib/actions/product-actions";
import {
    Sparkles, Loader2, FolderPlus, CheckCircle2,
    AlertTriangle, RotateCcw, ArrowRight, Folder, Package, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface AICategoryCreatorProps {
    categories: Category[];
    onCategoriesUpdated: (newCategories: Category[]) => void;
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

export function AICategoryCreator({ categories, onCategoriesUpdated }: AICategoryCreatorProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"input" | "review">("input");
    const [description, setDescription] = useState("");
    const [rows, setRows] = useState<NodeRow[]>([]);
    const [isAIPending, startAI] = useTransition();
    const [isSavePending, startSave] = useTransition();

    const handleAnalyze = () => {
        if (!description.trim()) { toast.warning("Açıklama boş olamaz."); return; }
        startAI(async () => {
            const result = await parseCategoryTreeWithAI(description);
            if (!result.success) { toast.error(result.error); return; }
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
                        sellPrice: p.sellPrice,
                        stock: p.stock,
                        criticalStock: p.criticalStock,
                        barcode: p.barcode,
                        location: p.location,
                    });

                    const pStatus = pRes.success ? "saved" : "error";
                    setRows(prev => prev.map(r => {
                        if (r._id !== row._id) return r;
                        const ps = [...r._prodStatuses]; ps[pi] = pStatus;
                        return { ...r, _prodStatuses: ps };
                    }));
                }
            }

            onCategoriesUpdated(updatedCats);
            toast.success("Tüm işlemler tamamlandı!");
        });
    };

    const totalCats = rows.filter(r => r._catStatus !== "saved" && r._catStatus !== "skipped").length;
    const totalProds = rows.reduce((a, r) => a + r.products.length, 0);

    return (
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setStep("input"); setRows([]); setDescription(""); } }}>
            <DialogTrigger asChild>
                <Button
                    className="gap-2 h-9 px-4 rounded-xl bg-[#111] border border-[#333] text-violet-400 hover:bg-[#18181A] transition-all font-bold text-[11px] uppercase tracking-wider"
                >
                    <Sparkles className="h-4 w-4" />
                    BAŞAR AI Çoklu Ekle
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[760px] bg-[#111111] border border-[#333333] text-white p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg font-bold tracking-tight">AI ile Kategori + Ürün Oluştur</DialogTitle>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                BAŞAR AI: Tek cümleyle hiyerarşiyi ve ürünleri tanımlayın, yapay zeka otomatik oluştursun.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

                    {step === "input" && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">💡 Örnek Söylemler</p>
                                {EXAMPLES.map((ex, i) => (
                                    <button key={i} type="button" onClick={() => setDescription(ex)}
                                        className="w-full text-left px-4 py-3 rounded-lg bg-[#18181A] border border-[#222222] text-[12px] text-slate-300 hover:bg-[#222222] hover:border-[#444] hover:text-white transition-all leading-relaxed">
                                        <span className="text-violet-400 font-bold mr-2">{i + 1}.</span>{ex}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Komut Verin
                                </label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                                    placeholder="Örn: Şarj Aletleri > Type-C > 27W — 10 adet şarj aleti, alış 1.5 dolar satış 500 TL, raf B-3"
                                    className="w-full bg-[#18181A] border border-[#333333] rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze(); }}
                                />
                                <div className="flex flex-col gap-1 mt-2">
                                    <p className="text-[11px] text-slate-500">
                                        💡 <strong className="text-slate-300">İpucu:</strong> Kategorileri " {">"} " işareti ile veya virgülle ayırabilirsiniz.
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-mono">
                                        [Ctrl+Enter] Hızlı analiz başlatır
                                    </p>
                                </div>
                            </div>

                            <Button onClick={handleAnalyze} disabled={isAIPending || !description.trim()}
                                className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-[13px] uppercase tracking-wider gap-2 disabled:opacity-40">
                                {isAIPending
                                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Gemini Analiz Ediyor...</>
                                    : <><Sparkles className="h-5 w-5" /> Analiz Et & Önizle</>}
                            </Button>
                        </div>
                    )}

                    {step === "review" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                    Tespit Edilen Plan — {rows.length} kategori, {totalProds} ürün
                                </p>
                                <Button variant="ghost" onClick={() => { setStep("input"); setRows([]); }}
                                    className="gap-1.5 text-slate-500 hover:text-white h-8 px-3 text-[11px] font-bold rounded-lg">
                                    <RotateCcw className="h-3.5 w-3.5" /> Yeniden Yaz
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {rows.map((row) => (
                                    <div key={row._id} className={cn(
                                        "rounded-xl border p-4 space-y-3 transition-all",
                                        row._catStatus === "saved" || row._catStatus === "skipped" ? "border-emerald-500/30 bg-emerald-500/10" :
                                            row._catStatus === "error" ? "border-red-500/30 bg-red-500/10" :
                                                "border-[#333333] bg-[#18181A]"
                                    )}>
                                        {/* Category row */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                {row.parentName && (
                                                    <>
                                                        <span className="text-[11px] text-slate-500 font-medium">{row.parentName}</span>
                                                        <ChevronRight className="h-3 w-3 text-slate-600" />
                                                    </>
                                                )}
                                                <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
                                                <Input value={row.name} onChange={e => updateRow(row._id, "name", e.target.value)}
                                                    disabled={row._catStatus === "saved" || row._catStatus === "skipped"}
                                                    className="h-8 bg-[#111111] border-[#333333] rounded-md text-[12px] font-semibold max-w-[200px] disabled:opacity-60" />
                                            </div>
                                            <div>
                                                {row._catStatus === "pending" && <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 font-black uppercase">Bekliyor</span>}
                                                {row._catStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                                                {row._catStatus === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                {row._catStatus === "skipped" && <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-black uppercase">Zaten Var</span>}
                                                {row._catStatus === "error" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                                            </div>
                                        </div>

                                        {/* Products */}
                                        {row.products.length > 0 && (
                                            <div className="ml-6 space-y-2">
                                                {row.products.map((p, pi) => (
                                                    <div key={pi} className="flex items-center gap-3 flex-wrap">
                                                        <Package className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                                        <span className="text-[11px] text-slate-300 font-medium flex-1 min-w-[120px]">{p.name}</span>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[11px] text-amber-300">Alış: <b>{p.buyPrice}₺</b></span>
                                                            <span className="text-[11px] text-emerald-300">Satış: <b>{p.sellPrice}₺</b></span>
                                                            <span className="text-[11px] text-blue-300">{p.stock} adet</span>
                                                            {p.location && <span className="text-[11px] text-slate-500">📍 {p.location}</span>}
                                                        </div>
                                                        <div>
                                                            {row._prodStatuses[pi] === "pending" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 font-black uppercase">—</span>}
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
                                <Button onClick={handleSaveAll} disabled={isSavePending || totalCats === 0}
                                    className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[13px] uppercase tracking-wider gap-2 disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
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
