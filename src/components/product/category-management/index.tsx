"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Folder, Package, Trash2, Edit2 } from "lucide-react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

import {
    createCategory,
    updateCategory,
    deleteCategory,
    clearCategoryProducts,
    reorderCategories,
    getAllCategories
} from "@/lib/actions/category-actions";
import {
    addInventoryStock,
    deleteProduct,
    updateProduct,
    createProduct,
    getAllProductsForCategoriesUI,
    fixInflatedPrices
} from "@/lib/actions/product-actions";

import { AICategoryCreator } from "@/components/product/ai-category-creator";
import { Category, Product, CategoryNode, PriceCurrency } from "./types";
import { TreeItem, RootDropZone } from "./tree-item";
import { ProductTable } from "./product-table";
import { CategoryAddModal, CategoryEditModal, CategoryDeleteModal } from "./category-modals";

export function CategoryManagementContainer() {
    const { data: queryCategories } = useQuery({
        queryKey: ["all-categories"],
        queryFn: async () => await getAllCategories(),
    });

    const { data: queryProducts } = useQuery({
        queryKey: ["all-products-for-categories"],
        queryFn: async () => await getAllProductsForCategoriesUI(),
    });

    const { rates: exchangeRates, defaultCurrency } = useDashboardData();

    const [categories, setCategories] = useState<Category[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [editingProducts, setEditingProducts] = useState<Record<string, { name: string, buyPrice: number, sellPrice: number }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newProductData, setNewProductData] = useState({ name: "", buyPrice: 0, sellPrice: 0, stock: 0 });
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [stockMode, setStockMode] = useState<"plus" | "minus">("plus");
    const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>(() => {
        if (typeof window === "undefined") return "TRY";
        const saved = localStorage.getItem("category_price_currency");
        return (saved as PriceCurrency) || (defaultCurrency as PriceCurrency) || "TRY";
    });

    useEffect(() => {
        const saved = localStorage.getItem("category_price_currency");
        if (!saved && defaultCurrency) {
            setPriceCurrency(defaultCurrency as PriceCurrency);
        }
    }, [defaultCurrency]);

    const [selectedCatId, setSelectedCatId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('category_selected_id');
        return null;
    });

    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('category_expanded_state');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [formData, setFormData] = useState({ name: "", parentId: "null" });
    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [stockToAdd, setStockToAdd] = useState(0);
    const [stockNotes, setStockNotes] = useState("");
    const [deleteCountdown, setDeleteCountdown] = useState(0);
    const [deleteMode, setDeleteMode] = useState<"full" | "products">("full");
    const [isPending, startTransition] = useTransition();

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => { if (queryCategories) setCategories(queryCategories); }, [queryCategories]);
    useEffect(() => { if (queryProducts) setAllProducts(queryProducts); }, [queryProducts]);

    useEffect(() => {
        if (selectedCatId) localStorage.setItem('category_selected_id', selectedCatId);
        else localStorage.removeItem('category_selected_id');
    }, [selectedCatId]);

    useEffect(() => { localStorage.setItem('category_expanded_state', JSON.stringify(expandedNodes)); }, [expandedNodes]);
    useEffect(() => { localStorage.setItem("category_price_currency", priceCurrency); }, [priceCurrency]);

    useEffect(() => {
        let timer: any;
        if (isDeleteModalOpen && deleteCountdown > 0) {
            timer = setInterval(() => setDeleteCountdown(prev => Math.max(0, prev - 1)), 1000);
        }
        return () => clearInterval(timer);
    }, [isDeleteModalOpen, deleteCountdown]);

    const categoryNodesMap = useMemo(() => {
        const map = new Map<string, CategoryNode>();
        categories.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
        const sortedCats = [...categories].sort((a, b) => {
            if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
            return a.name.localeCompare(b.name);
        });
        sortedCats.forEach(cat => {
            if (cat.parentId && map.has(cat.parentId)) map.get(cat.parentId)!.children.push(map.get(cat.id)!);
        });
        return map;
    }, [categories]);

    const [isFixing, setIsFixing] = useState(false);

    const tree = useMemo(() => {
        const roots: CategoryNode[] = [];
        categoryNodesMap.forEach(node => {
            if (!node.parentId || !categoryNodesMap.has(node.parentId)) roots.push(node);
        });
        return roots;
    }, [categoryNodesMap]);

    const selectedNode = selectedCatId ? categoryNodesMap.get(selectedCatId) : null;

    const getCategoryFamilyIds = (catId: string): string[] => {
        const node = categoryNodesMap.get(catId);
        if (!node) return [];
        let ids = [catId];
        node.children.forEach(child => { ids = [...ids, ...getCategoryFamilyIds(child.id)]; });
        return Array.from(new Set(ids));
    };

    const getCumulativeStats = (catId: string) => {
        const familyIds = getCategoryFamilyIds(catId);
        let totalStock = 0;
        allProducts.forEach(p => { if (familyIds.includes(p.categoryId)) totalStock += p.stock; });
        return { totalStock };
    };

    const getCurrencySymbol = () => {
        if (priceCurrency === "USD") return "$";
        if (priceCurrency === "EUR") return "€";
        return "₺";
    };

    const getCurrencyRate = () => {
        if (priceCurrency === "USD") return exchangeRates?.usd || 34;
        if (priceCurrency === "EUR") return exchangeRates?.eur || 37;
        return 1;
    };

    const toTryPrice = (value: number) => {
        const safeValue = Number(value) || 0;
        if (priceCurrency === "TRY") return safeValue;

        const rate = getCurrencyRate();
        const converted = Math.ceil(safeValue * rate);

        // Güvenlik Kontrolü: Eğer kur 100'den büyükse muhtemelen bir hata vardır (Dolar/Euro için)
        // Ancak Altın (GA) için kur 3000+ olabilir. Bu yüzden para birimine göre kontrol yapıyoruz.
        if (priceCurrency === "USD" && rate > 200) {
            console.error("Hatalı dolar kuru tespit edildi:", rate);
            return safeValue * 35; // Sabit güvenli kur patlamayı önlemek için
        }

        return converted;
    };

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        const activeIdStr = active.id as string;
        const overIdStr = over.id as string;
        if (activeIdStr === overIdStr) return;

        const activeCategory = categories.find(c => c.id === activeIdStr);
        const overCategory = categories.find(c => c.id === overIdStr);
        if (!activeCategory) return;

        if (overIdStr !== "null") {
            const familyIdsOfSource = getCategoryFamilyIds(activeIdStr);
            if (familyIdsOfSource.includes(overIdStr)) {
                toast.error("Bir kategori kendi alt dalına taşınamaz!");
                return;
            }
        }

        startTransition(async () => {
            if (activeCategory.parentId === (overIdStr === 'null' ? null : overCategory?.parentId)) {
                const siblings = categories.filter(c => c.parentId === activeCategory.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
                const oldIndex = siblings.findIndex(s => s.id === activeIdStr);
                const newIndex = siblings.findIndex(s => s.id === overIdStr);
                if (oldIndex !== -1 && newIndex !== -1) {
                    const newSiblings = arrayMove(siblings, oldIndex, newIndex);
                    const updates = newSiblings.map((s, idx) => ({ id: s.id, order: idx, parentId: s.parentId }));
                    setCategories(prev => prev.map(c => {
                        const upd = updates.find(u => u.id === c.id);
                        return upd ? { ...c, order: upd.order } : c;
                    }));
                    const res = await reorderCategories(updates);
                    if (res.success) toast.success("Sıralama güncellendi.");
                    else toast.error(res.message);
                    return;
                }
            }
            const res = await updateCategory({ id: activeIdStr, parentId: overIdStr === "null" ? "null" : overIdStr });
            if (res.success) {
                setCategories(prev => prev.map(c => c.id === activeIdStr ? { ...c, parentId: overIdStr === "null" ? null : overIdStr } : c));
                toast.success("Hiyerarşi güncellendi.");
                if (overIdStr !== "null") setExpandedNodes(prev => ({ ...prev, [overIdStr]: true }));
            } else toast.error(res.message);
        });
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Kategori adı zorunludur!");
        startTransition(async () => {
            const res = await createCategory({ name: formData.name, parentId: formData.parentId === "null" ? undefined : formData.parentId });
            if (res.success && res.category) {
                setCategories([...categories, res.category as Category]);
                toast.success("Kategori eklendi!");
                setIsAddModalOpen(false);
                setSelectedCatId(res.category.id);
            } else toast.error(res.message);
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !editCatId) return toast.error("Kategori adı zorunludur!");
        startTransition(async () => {
            const res = await updateCategory({ id: editCatId, name: formData.name, parentId: formData.parentId === "null" ? undefined : formData.parentId });
            if (res.success && res.category) {
                setCategories(prev => prev.map(c => (c.id === editCatId ? (res.category as Category) : c)));
                toast.success("Kategori güncellendi!");
                setIsEditModalOpen(false);
            } else toast.error(res.message);
        });
    };

    const handleAddStock = async () => {
        if (!selectedCatId || stockToAdd <= 0 || selectedProductIds.length === 0) return;
        const multiplier = stockMode === "plus" ? 1 : -1;
        const finalQuantity = stockToAdd * multiplier;
        setSavingId("bulk-stock");
        startTransition(async () => {
            let successCount = 0;
            for (const productId of selectedProductIds) {
                const res = await addInventoryStock(productId, finalQuantity, stockNotes || `Kategori hızlı stok ${stockMode === "plus" ? "girişi" : "çıkışı"}`);
                if (res.success) {
                    setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Math.max(0, p.stock + finalQuantity) } : p));
                    successCount++;
                }
            }
            toast.success(`${successCount} ürünün stoku güncellendi.`);
            setStockToAdd(0); setStockNotes(""); setSelectedProductIds([]); setSavingId(null);
        });
    };

    const handleDeleteCategory = async () => {
        if (!selectedCatId) return;
        startTransition(async () => {
            const res = deleteMode === "products" ? await clearCategoryProducts(selectedCatId) : await deleteCategory(selectedCatId);
            if (res.success) {
                if (deleteMode === "full") {
                    setCategories(prev => prev.filter(c => c.id !== selectedCatId));
                    setSelectedCatId(null);
                }
                toast.success(res.message || "İşlem başarılı");
                setIsDeleteModalOpen(false);
            } else toast.error(res.message);
        });
    };

    const handleDeleteProduct = async (productId: string, force: boolean = false) => {
        startTransition(async () => {
            const res = await deleteProduct(productId, force);
            if (res.success) {
                setAllProducts(prev => prev.filter(p => p.id !== productId));
                toast.success("Ürün silindi");
            } else if (res.requiresConfirmation) {
                toast.warning(res.error, { action: { label: "Hepsini Sil", onClick: () => handleDeleteProduct(productId, true) } });
            } else toast.error(res.error);
        });
    };

    const handleSaveProduct = async (productId: string) => {
        const data = editingProducts[productId];
        if (!data) return;
        const buyPriceTry = toTryPrice(data.buyPrice);
        const sellPriceTry = toTryPrice(data.sellPrice);
        setSavingId(productId);
        startTransition(async () => {
            const res = await updateProduct(productId, {
                name: data.name,
                buyPrice: buyPriceTry,
                buyPriceUsd: priceCurrency === "TRY" ? null : data.buyPrice,
                sellPrice: sellPriceTry,
                sellPriceUsd: priceCurrency === "TRY" ? null : data.sellPrice,
                attributes: { priceCurrency }
            });
            if (res.success) {
                setAllProducts(prev => prev.map(p => p.id === productId ? {
                    ...p, name: data.name, buyPrice: buyPriceTry, buyPriceUsd: priceCurrency === "TRY" ? null : data.buyPrice,
                    sellPrice: sellPriceTry, sellPriceUsd: priceCurrency === "TRY" ? null : data.sellPrice,
                    attributes: { ...p.attributes, priceCurrency }
                } : p));
                toast.success("Ürün güncellendi");
                setEditingProducts(prev => { const n = { ...prev }; delete n[productId]; return n; });
            } else toast.error(res.error);
            setSavingId(null);
        });
    };

    const handleQuickAddProduct = async () => {
        if (!selectedCatId || !newProductData.name) return;
        setIsCreatingProduct(true);
        startTransition(async () => {
            const res = await createProduct({
                name: newProductData.name, categoryId: selectedCatId,
                buyPrice: toTryPrice(newProductData.buyPrice), buyPriceUsd: priceCurrency === "TRY" ? null : newProductData.buyPrice,
                sellPrice: toTryPrice(newProductData.sellPrice), sellPriceUsd: priceCurrency === "TRY" ? null : newProductData.sellPrice,
                stock: newProductData.stock, criticalStock: 1, attributes: { priceCurrency }
            });
            if (res.success && res.product) {
                setAllProducts(prev => [res.product as Product, ...prev]);
                toast.success("Ürün eklendi");
                setNewProductData({ name: "", buyPrice: 0, sellPrice: 0, stock: 0 });
                setShowQuickAdd(false);
            } else toast.error(res.message);
            setIsCreatingProduct(false);
        });
    };

    const renderTree = (nodes: CategoryNode[], level = 0) => {
        return (
            <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1 w-full relative">
                    {nodes.map(node => (
                        <div key={node.id} className="w-full">
                            <TreeItem
                                node={node} level={level} isSelected={selectedCatId === node.id}
                                isExpanded={!!expandedNodes[node.id]} hasChildren={node.children.length > 0}
                                stats={getCumulativeStats(node.id)} onSelect={setSelectedCatId}
                                onToggle={(id, e) => { e.stopPropagation(); setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] })); }}
                                activeId={activeId}
                            />
                            {expandedNodes[node.id] && node.children.length > 0 && renderTree(node.children, level + 1)}
                        </div>
                    ))}
                </div>
            </SortableContext>
        );
    };

    const selectedStats = useMemo(() => selectedCatId ? getCumulativeStats(selectedCatId) : { totalStock: 0 }, [selectedCatId, allProducts]);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row min-h-[800px] lg:h-[calc(100vh-140px)] w-full overflow-hidden bg-white/40 dark:bg-background/40 rounded-3xl border border-zinc-200 dark:border-border/50 backdrop-blur-sm shadow-xl">
                <div className="w-full lg:w-[320px] bg-zinc-50/50 dark:bg-[#0D0D0F] border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-border/50 p-4 lg:p-8 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col gap-1 mb-6 lg:mb-10 text-left">
                        <h2 className="font-bold text-xl lg:text-2xl text-indigo-600 dark:text-white tracking-tighter uppercase italic">Kategori Ağacı</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none font-medium">Envanter Hiyerarşisi</p>
                    </div>
                    <div className="flex-1 space-y-2 pb-10">
                        <div className="flex items-center gap-2 mb-6">
                            <AICategoryCreator
                                categories={categories} allProducts={allProducts}
                                onCategoriesUpdated={setCategories} onProductsUpdated={setAllProducts}
                            />
                            <Button
                                size="icon" variant="outline" className="h-10 w-10 flex-shrink-0 bg-white dark:bg-white/5 border-zinc-200 dark:border-border rounded-xl"
                                onClick={() => { setModalTitle("Yeni Kategori Ekle"); setFormData({ name: "", parentId: "null" }); setIsAddModalOpen(true); }}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <RootDropZone />
                        <div className="space-y-1">{renderTree(tree)}</div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-black/20 overflow-hidden">
                    {selectedNode ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 lg:p-8 border-b border-zinc-200 dark:border-border/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 dark:bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h2 className="font-bold text-xl lg:text-3xl text-foreground dark:text-white tracking-tight flex items-center gap-3">
                                        {selectedNode.name}
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 text-indigo-500" onClick={() => { setEditCatId(selectedNode.id); setFormData({ name: selectedNode.name, parentId: selectedNode.parentId || "null" }); setIsEditModalOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-500" onClick={() => { setDeleteCountdown(3); setIsDeleteModalOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </h2>
                                    <div className="flex items-center gap-4 text-[11px]  text-muted-foreground uppercase tracking-widest font-bold">
                                        <span className="flex items-center gap-1.5"><Package className="h-3 w-3" /> {selectedStats.totalStock} TOPLAM ÜRÜN</span>
                                    </div>
                                </div>
                                <div className="flex items-center p-1.5 rounded-2xl bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-border/50 shadow-inner gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                            if (!confirm("100.000 TL üzerindeki tüm fiyatlar 1000'e bölünecektir. Emin misiniz?")) return;
                                            setIsFixing(true);
                                            const res = await fixInflatedPrices();
                                            if (res.success) {
                                                toast.success(res.message);
                                                window.location.reload();
                                            } else toast.error(res.error);
                                            setIsFixing(false);
                                        }}
                                        disabled={isFixing}
                                        className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                                    >
                                        {isFixing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fiyatları Onar"}
                                    </Button>
                                    <div className="flex bg-zinc-200 dark:bg-border/50 rounded-xl p-0.5">
                                        {(["TRY", "USD"] as PriceCurrency[]).map((cur) => (
                                            <button key={cur} onClick={() => setPriceCurrency(cur)} className={cn("px-4 py-2 rounded-xl text-[10px] transition-all font-bold", priceCurrency === cur ? "bg-white dark:bg-indigo-500 text-indigo-600 dark:text-black shadow-sm" : "text-muted-foreground hover:text-foreground")}>{cur}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar">
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    <div className="xl:col-span-2 space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-foreground/80 dark:text-white/60 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" /> Ürün Listesi
                                                </h3>
                                                <Button variant="ghost" size="sm" onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:bg-indigo-500/10">
                                                    {showQuickAdd ? "Kapat" : "+ Hızlı Ürün Ekle"}
                                                </Button>
                                            </div>
                                            {showQuickAdd && (
                                                <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-bold uppercase tracking-widest pl-1">Ürün Adı</Label>
                                                            <Input value={newProductData.name} onChange={e => setNewProductData({ ...newProductData, name: e.target.value })} className="h-10 bg-white dark:bg-black/40" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-bold uppercase tracking-widest pl-1">Alış ({priceCurrency})</Label>
                                                            <Input type="number" value={newProductData.buyPrice} onChange={e => setNewProductData({ ...newProductData, buyPrice: Number(e.target.value) })} className="h-10 bg-white dark:bg-black/40" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-bold uppercase tracking-widest pl-1">Satış ({priceCurrency})</Label>
                                                            <Input type="number" value={newProductData.sellPrice} onChange={e => setNewProductData({ ...newProductData, sellPrice: Number(e.target.value) })} className="h-10 bg-white dark:bg-black/40" />
                                                        </div>
                                                    </div>
                                                    <Button onClick={handleQuickAddProduct} disabled={isCreatingProduct} className="w-full bg-indigo-600 text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl shadow-lg shadow-indigo-600/20">
                                                        {isCreatingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ürünü Kaydet"}
                                                    </Button>
                                                </div>
                                            )}
                                            <ProductTable
                                                products={allProducts.filter(p => p.categoryId === selectedCatId)}
                                                editingProducts={editingProducts} setEditingProducts={setEditingProducts}
                                                savingId={savingId} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct}
                                                getCurrencySymbol={getCurrencySymbol} priceCurrency={priceCurrency}
                                                getCurrencyRate={getCurrencyRate}
                                                selectedProductIds={selectedProductIds} setSelectedProductIds={setSelectedProductIds}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-border/50">
                                            <h3 className="font-medium text-white text-sm flex items-center gap-2 mb-4"><Package className="h-3.5 w-3.5 text-indigo-400" /> Toplu Stok İşlemi</h3>
                                            <div className="flex p-1.5 rounded-2xl bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-border/50 mb-6">
                                                <button onClick={() => setStockMode("plus")} className={cn("flex-1 h-10 rounded-xl text-[10px] font-bold", stockMode === "plus" ? "bg-white dark:bg-emerald-500 text-emerald-600 dark:text-black" : "text-muted-foreground")}>Ekle (+)</button>
                                                <button onClick={() => setStockMode("minus")} className={cn("flex-1 h-10 rounded-xl text-[10px] font-bold", stockMode === "minus" ? "bg-white dark:bg-red-500 text-red-600 dark:text-white" : "text-muted-foreground")}>Çıkar (-)</button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] text-muted-foreground uppercase pl-1">ADET MİKTARI</Label>
                                                    <Input type="number" value={stockToAdd} onChange={e => setStockToAdd(Number(e.target.value))} className="h-12 text-lg font-bold" />
                                                </div>
                                                <Button className={cn("w-full h-12 text-xs font-bold rounded-2xl shadow-xl", stockMode === "plus" ? "bg-indigo-600" : "bg-red-600")} disabled={isPending || stockToAdd <= 0 || selectedProductIds.length === 0} onClick={handleAddStock}>
                                                    {savingId === "bulk-stock" ? <Loader2 className="h-5 w-5 animate-spin" /> : `İŞLEMİ ONAYLA (${selectedProductIds.length})`}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-border/50 flex items-center justify-center mb-8"><Folder className="h-10 w-10 text-indigo-500" /></div>
                            <h2 className="font-bold text-2xl mb-3">Ağaçtan bir kategori seçin</h2>
                            <p className="text-muted-foreground text-sm max-w-sm">Detayları ve alt varyant erişimlerini görmek için sol taraftan bir seçim yapın.</p>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay>{activeId ? <div className="bg-[#1A1A1F] border border-indigo-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-3"><Folder className="h-4 w-4 text-indigo-400" /><p className="text-white text-[13px]">{categories.find(c => c.id === activeId)?.name}</p></div> : null}</DragOverlay>

            <CategoryAddModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSubmit={handleAddSubmit} formData={formData} setFormData={setFormData} categories={categories} title={modalTitle} isPending={isPending} />
            <CategoryEditModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} onSubmit={handleEditSubmit} formData={formData} setFormData={setFormData} categories={categories} editCatId={editCatId} isPending={isPending} />
            <CategoryDeleteModal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} onDelete={handleDeleteCategory} categoryName={selectedNode?.name || ""} totalStock={selectedStats.totalStock} deleteMode={deleteMode} setDeleteMode={setDeleteMode} deleteCountdown={deleteCountdown} />
        </DndContext>
    );
}
