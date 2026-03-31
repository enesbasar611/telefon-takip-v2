"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { Folder, FolderOpen, Plus, ChevronRight, ChevronDown, Trash2, Edit2, Info, Loader2, Package, AlertTriangle, GripVertical } from "lucide-react";
import { AICategoryCreator } from "@/components/product/ai-category-creator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createCategory, updateCategory, deleteCategory, clearCategoryProducts } from "@/lib/actions/category-actions";
import { addInventoryStock, deleteProduct } from "@/lib/actions/product-actions";
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface Product {
    id: string;
    name: string;
    categoryId: string;
    stock: number;
    buyPrice: number;
    sellPrice: number;
}

interface CategoryNode extends Category {
    children: CategoryNode[];
}

interface CategoryItemProps {
    node: CategoryNode;
    level: number;
    isSelected: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    stats: { totalStock: number };
    onSelect: (id: string) => void;
    onToggle: (id: string, e: React.MouseEvent) => void;
    activeId: string | null;
}

function TreeItem({ node, level, isSelected, isExpanded, hasChildren, stats, onSelect, onToggle, activeId }: CategoryItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: node.id,
    });
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: node.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    return (
        <div ref={setDropRef} className="w-full">
            <div
                ref={setNodeRef}
                onClick={() => onSelect(node.id)}
                className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg border border-transparent select-none transition-all",
                    isSelected ? "bg-indigo-500/10 border-indigo-500/20 text-white font-semibold" : "hover:bg-white/[0.03] text-slate-300 hover:text-white",
                    isOver && activeId !== node.id && "bg-emerald-500/30 border-emerald-500/50 scale-[1.02] ring-2 ring-emerald-500/20",
                    isDragging && "opacity-20 grayscale"
                )}
                style={{ ...style, marginLeft: `${level * 16}px` }}
            >
                <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded">
                        <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                    </div>

                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) onToggle(node.id, e);
                        }}
                        className={`w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 ${hasChildren ? "cursor-pointer" : "opacity-0"}`}
                    >
                        {hasChildren && (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />)}
                    </span>
                    {hasChildren && isExpanded ? (
                        <FolderOpen className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-blue-400"}`} />
                    ) : (
                        <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                    )}
                    <span className={`text-[13px] truncate ${isSelected ? "font-semibold" : "font-medium"}`}>{node.name}</span>
                </div>

                <div className="flex items-center gap-2 text-right shrink-0">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isSelected ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border-white/5 text-slate-500"}`}>
                        {stats.totalStock} Adet
                    </div>
                </div>
            </div>
        </div>
    );
}

function RootDropZone() {
    const { setNodeRef, isOver } = useDroppable({
        id: 'null',
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-full h-14 border border-dashed rounded-2xl flex items-center justify-center transition-all duration-300",
                isOver
                    ? "bg-emerald-500/20 border-emerald-500/50 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
            )}
        >
            <span className={cn(
                "text-[11px] font-black uppercase tracking-[0.2em] transition-colors",
                isOver ? "text-emerald-400" : "text-white/20"
            )}>
                Ana Dizine Taşı
            </span>
        </div>
    );
}

export function CategoryManagementClient({
    initialCategories,
    products
}: {
    initialCategories: Category[],
    products: Product[]
}) {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [allProducts, setAllProducts] = useState<Product[]>(products);
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Modal Data
    const [modalTitle, setModalTitle] = useState("");
    const [formData, setFormData] = useState({ name: "", parentId: "null" });
    const [editCatId, setEditCatId] = useState("");
    const [stockToAdd, setStockToAdd] = useState(0);
    const [stockNotes, setStockNotes] = useState("");

    const [isPending, startTransition] = useTransition();
    const [deleteCountdown, setDeleteCountdown] = useState(0);
    const [isForceDeleteEnabled, setIsForceDeleteEnabled] = useState(false);
    const [deleteMode, setDeleteMode] = useState<"full" | "products">("full");

    useEffect(() => {
        let timer: any;
        if (isDeleteModalOpen && deleteCountdown > 0) {
            timer = setInterval(() => {
                setDeleteCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isDeleteModalOpen, deleteCountdown]);

    const categoryNodesMap = useMemo(() => {
        const map = new Map<string, CategoryNode>();
        categories.forEach(cat => {
            map.set(cat.id, { ...cat, children: [] });
        });
        categories.forEach(cat => {
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children.push(map.get(cat.id)!);
            }
        });
        return map;
    }, [categories]);

    const tree = useMemo(() => {
        const roots: CategoryNode[] = [];
        categoryNodesMap.forEach(node => {
            if (!node.parentId || !categoryNodesMap.has(node.parentId)) {
                roots.push(node);
            }
        });
        return roots;
    }, [categoryNodesMap]);

    const selectedNode = selectedCatId ? categoryNodesMap.get(selectedCatId) : null;

    const getCategoryFamilyIds = (catId: string): string[] => {
        const node = categoryNodesMap.get(catId);
        if (!node) return [];
        let ids = [catId];
        node.children.forEach(child => {
            ids = [...ids, ...getCategoryFamilyIds(child.id)];
        });
        return Array.from(new Set(ids));
    };

    const getCumulativeStats = (catId: string) => {
        const familyIds = getCategoryFamilyIds(catId);
        let totalStock = 0;
        let totalCost = 0;

        allProducts.forEach(p => {
            if (familyIds.includes(p.categoryId)) {
                totalStock += p.stock;
                totalCost += (Number(p.buyPrice) || 0) * p.stock;
            }
        });

        return { totalStock, totalCost, familyIds };
    };

    const selectedStats = selectedNode ? getCumulativeStats(selectedNode.id) : null;
    const directChildren = categories.filter(c => c.parentId === selectedCatId);

    const toggleNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const selectNode = (id: string) => {
        setSelectedCatId(id);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const sourceId = active.id as string;
        const targetId = over.id as string;

        if (sourceId === targetId) return;

        // Circular move check
        if (targetId !== "null") {
            const familyIdsOfSource = getCategoryFamilyIds(sourceId);
            if (familyIdsOfSource.includes(targetId)) {
                toast.error("Bir kategori kendi alt dalına taşınamaz!");
                return;
            }
        }

        startTransition(async () => {
            const res = await updateCategory({
                id: sourceId,
                parentId: targetId === "null" ? "null" : targetId
            });

            if (res.success) {
                setCategories(prev => prev.map(c =>
                    c.id === sourceId ? { ...c, parentId: targetId === "null" ? null : targetId } : c
                ));
                toast.success("Hiyerarşi güncellendi.");

                if (targetId !== "null") {
                    setExpandedNodes(prev => ({ ...prev, [targetId]: true }));
                }
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Kategori adı zorunludur!");

        startTransition(async () => {
            const res = await createCategory({
                name: formData.name,
                parentId: formData.parentId === "null" ? undefined : formData.parentId
            });

            if (res.success && res.category) {
                const newCat = res.category as Category;
                setCategories([...categories, newCat]);
                toast.success("Kategori eklendi!");
                setIsAddModalOpen(false);
                if (newCat.parentId) {
                    setExpandedNodes(prev => ({ ...prev, [newCat.parentId!]: true }));
                }
                setSelectedCatId(newCat.id);
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Kategori adı zorunludur!");

        startTransition(async () => {
            const res = await updateCategory({
                id: editCatId,
                name: formData.name,
                parentId: formData.parentId === "null" ? undefined : formData.parentId
            });

            if (res.success && res.category) {
                setCategories(prev => prev.map(c => (c.id === editCatId ? (res.category as Category) : c)));
                toast.success("Kategori güncellendi!");
                setIsEditModalOpen(false);
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleAddStock = async () => {
        if (!selectedCatId || stockToAdd <= 0) return;

        startTransition(async () => {
            // In this app, we add stock to the first product in the category if there are multiple, 
            // or we should have a specific category stock action. 
            // For now, let's find the first product.
            const product = allProducts.find(p => p.categoryId === selectedCatId);
            if (!product) {
                toast.error("Bu kategoride ürün bulunamadı. Önce ürün eklemelisiniz.");
                return;
            }

            const res = await addInventoryStock(
                product.id,
                stockToAdd,
                stockNotes || "Kategori üzerinden hızlı stok eklendi"
            );

            if (res.success) {
                setAllProducts(prev => prev.map(p =>
                    p.id === product.id ? { ...p, stock: p.stock + stockToAdd } : p
                ));
                toast.success("Stok güncellendi");
                setStockToAdd(0);
                setStockNotes("");
            } else {
                toast.error((res as any).error || "Stok eklenemedi");
            }
        });
    };

    const handleDeleteCategory = async () => {
        if (!selectedCatId || (deleteCountdown > 0 && isForceDeleteEnabled)) return;

        startTransition(async () => {
            let res;
            if (deleteMode === "products") {
                res = await clearCategoryProducts(selectedCatId);
            } else {
                res = await deleteCategory(selectedCatId);
            }

            if (res.success) {
                if (deleteMode === "full") {
                    setCategories(prev => prev.filter(c => c.id !== selectedCatId));
                    setSelectedCatId(null);
                }
                toast.success(res.message || "İşlem başarılı");
                setIsDeleteModalOpen(false);
            } else {
                toast.error(res.message || "Bir hata oluştu");
            }
        });
    };

    const handleDeleteSingleProduct = async (productId: string) => {
        startTransition(async () => {
            const res = await deleteProduct(productId);
            if (res.success) {
                setAllProducts(prev => prev.filter(p => p.id !== productId));
                toast.success("Ürün silindi");
            } else {
                toast.error(res.error || "Ürün silinemedi");
            }
        });
    };

    const renderTree = (nodes: CategoryNode[], level = 0) => {
        return (
            <div className="flex flex-col gap-1 w-full relative">
                {nodes.map(node => {
                    const isExpanded = !!expandedNodes[node.id];
                    const isSelected = selectedCatId === node.id;
                    const hasChildren = (node.children?.length ?? 0) > 0;
                    const stats = getCumulativeStats(node.id);

                    return (
                        <div key={node.id} className="w-full">
                            <TreeItem
                                node={node}
                                level={level}
                                isSelected={isSelected}
                                isExpanded={isExpanded}
                                hasChildren={hasChildren}
                                stats={stats}
                                onSelect={selectNode}
                                onToggle={toggleNode}
                                activeId={activeId}
                            />
                            {hasChildren && isExpanded && renderTree(node.children, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-slate-950/40 rounded-3xl border border-white/5 backdrop-blur-sm">
                {/* Sidebar Tree */}
                <div className="w-[320px] h-full bg-[#0D0D0F] border-r border-white/5 p-8 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col gap-1 mb-10 text-left">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Kategori Ağacı</h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-none">Envanter Hiyerarşisi</p>
                    </div>
                    {/* Categories Scroll Area Wrapper */}
                    <div className="flex-1 space-y-2 pb-10">
                        <div className="flex items-center gap-2 mb-6">
                            <AICategoryCreator
                                categories={categories}
                                allProducts={allProducts}
                                onCategoriesUpdated={(newCats) => setCategories(newCats)}
                                onProductsUpdated={(newProds) => setAllProducts(newProds)}
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10 flex-shrink-0 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
                                onClick={() => {
                                    setModalTitle("Yeni Kategori Ekle");
                                    setFormData({ name: "", parentId: "null" });
                                    setIsAddModalOpen(true);
                                }}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>

                        <RootDropZone />

                        <div className="space-y-1">
                            {tree.length > 0 ? renderTree(tree) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                    <Folder className="h-8 w-8 text-slate-700 mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">Henüz kategori bulunmuyor.</p>
                                    <Button
                                        variant="link"
                                        className="text-indigo-400 text-xs mt-2"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        İlk kategoriyi oluştur
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 h-full overflow-y-auto bg-slate-950/50">
                    {selectedNode ? (
                        <div className="p-8 max-w-5xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <FolderOpen className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white tracking-tight">{selectedNode.name}</h1>
                                        <p className="text-sm text-slate-500 font-medium mt-0.5">Toplu Özet • {selectedNode.children?.length ?? 0} Bağlı Düğüm</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/[0.03] border-white/5 hover:bg-white/10"
                                        onClick={() => {
                                            setEditCatId(selectedNode.id);
                                            setFormData({ name: selectedNode.name, parentId: selectedNode.parentId || "null" });
                                            setIsEditModalOpen(true);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4 mr-2 text-indigo-400" />
                                        Düzenle
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                        onClick={() => {
                                            setDeleteCountdown(3);
                                            setIsDeleteModalOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Sil
                                    </Button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Package className="h-12 w-12 text-indigo-400" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">KÜMÜLATİF STOK</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white">{selectedStats?.totalStock}</span>
                                        <span className="text-sm text-slate-400 font-medium">Adet</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-2">Alt kategorilerdeki ({selectedStats?.familyIds.length}) ürünler dahildir.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Info className="h-12 w-12 text-indigo-400" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">DİREKT ALT VARYANTLAR</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white">{selectedNode.children?.length ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Section: Quick Actions & Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Products Table Area */}
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-white flex items-center gap-2">
                                                <Package className="h-4 w-4 text-indigo-400" />
                                                Bu Kategorideki Ürünler
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {allProducts.filter(p => p.categoryId === selectedNode.id).map(product => (
                                                <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">{product.name}</p>
                                                            <p className="text-[10px] text-slate-500">Stok: {product.stock} Adet • {product.sellPrice} TL</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-red-500/10 text-slate-600 hover:text-red-400"
                                                        onClick={() => handleDeleteSingleProduct(product.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {allProducts.filter(p => p.categoryId === selectedNode.id).length === 0 && (
                                                <p className="text-center py-8 text-xs text-slate-600">Bu kategoride direkt ürün bulunmuyor.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Controls */}
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                        <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-indigo-400" />
                                            Hızlı Stok Ekle
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase tracking-wider">MİKTAR</Label>
                                                <Input
                                                    type="number"
                                                    value={stockToAdd}
                                                    onChange={e => setStockToAdd(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="bg-black/20 border-white/5 h-9"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase tracking-wider">NOT</Label>
                                                <Input
                                                    value={stockNotes}
                                                    onChange={e => setStockNotes(e.target.value)}
                                                    placeholder="Opsiyonel not..."
                                                    className="bg-black/20 border-white/5 h-9"
                                                />
                                            </div>
                                            <Button
                                                className="w-full bg-indigo-500 hover:bg-indigo-600 h-9 text-xs font-bold"
                                                disabled={isPending || stockToAdd <= 0}
                                                onClick={handleAddStock}
                                            >
                                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Stoku Kaydet"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                            <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                                <Folder className="h-10 w-10 text-slate-800" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Ağaçtan bir kategori seçin</h2>
                            <p className="text-slate-500 text-sm max-w-xs text-center">
                                Detayları, özel metrikleri ve alt varyant erişimlerini görmek için sol taraftan bir seçim yapın.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-indigo-500/20 border border-indigo-500/40 p-2 rounded shadow-2xl backdrop-blur-sm">
                        <p className="text-white text-xs font-bold">{categories.find(c => c.id === activeId)?.name}</p>
                    </div>
                ) : null}
            </DragOverlay>

            {/* AD MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="bg-slate-900 border-white/5 text-white max-w-md">
                    <form onSubmit={handleAddSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{modalTitle}</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs">
                                Yeni kategori oluştururken hiyerarşi düzeyini belirleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs text-slate-400">KATEGORİ ADI</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Telefon Kılıfları"
                                    className="bg-black/20 border-white/5"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentId" className="text-xs text-slate-400">ÜST KATEGORİ</Label>
                                <select
                                    id="parentId"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-black/20 border-white/5 text-sm outline-none focus:ring-1 ring-indigo-500"
                                >
                                    <option value="null">--- Ana Dizin (Root) ---</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-xs">Vazgeç</Button>
                            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-xs font-bold" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet ve Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-slate-900 border-white/5 text-white max-w-md">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Kategoriyi Düzenle</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs">
                                Kategori adını ve ağaçtaki yerini değiştirebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name" className="text-xs text-slate-400">KATEGORİ ADI</Label>
                                <Input
                                    id="edit_name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/20 border-white/5"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_parentId" className="text-xs text-slate-400">ÜST KATEGORİ</Label>
                                <select
                                    id="edit_parentId"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-black/20 border-white/5 text-sm outline-none focus:ring-1 ring-indigo-500"
                                >
                                    <option value="null">--- Ana Dizin (Root) ---</option>
                                    {categories.filter(c => c.id !== editCatId).map(c => {
                                        // Simple circular dependency prevention: don't allow selecting current category as parent
                                        return <option key={c.id} value={c.id}>{c.name}</option>
                                    })}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-xs">Vazgeç</Button>
                            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-xs font-bold" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE SAFETY MODAL */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-slate-950 border-red-500/20 text-white max-w-lg p-0 overflow-hidden">
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-red-500">
                                <AlertTriangle className="h-8 w-8" />
                                Kritik İşlem Onayı
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-sm leading-relaxed mt-2">
                                <span className="text-white font-semibold">"{selectedNode?.name}"</span> kategorisi ve bağlı tüm alt veriler silinmek üzere. Bu işlem geri alınamaz.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Mode Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDeleteMode("full")}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        deleteMode === "full"
                                            ? "bg-red-500/10 border-red-500/50 ring-2 ring-red-500/20"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", deleteMode === "full" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-500")}>
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <p className={cn("font-bold text-sm", deleteMode === "full" ? "text-white" : "text-slate-400")}>Tamamen Sil</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Kategori ve tüm alt ürünleri yok eder.</p>
                                </button>

                                <button
                                    onClick={() => setDeleteMode("products")}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        deleteMode === "products"
                                            ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", deleteMode === "products" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500")}>
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <p className={cn("font-bold text-sm", deleteMode === "products" ? "text-white" : "text-slate-400")}>Sadece Ürünleri Sil</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Kategori kalır, içindeki tüm stok temizlenir.</p>
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-red-400 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-300">
                                            Bu kategoride toplam <span className="text-white font-bold">{selectedStats?.totalStock}</span> adet ürün bulunuyor.
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            Silme işlemi finansal tabloları etkilemez ancak stok takibini sonlandırır.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            İptal Et
                        </Button>
                        <div className="flex items-center gap-3">
                            {deleteCountdown > 0 ? (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Bekleniyor ({deleteCountdown}s)
                                </div>
                            ) : (
                                <Button
                                    className={cn(
                                        "px-8 font-bold transition-all",
                                        deleteMode === "full" ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20" : "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                                    )}
                                    onClick={handleDeleteCategory}
                                >
                                    {deleteMode === "full" ? "Kategoriyi Tamamen Yok Et" : "Kategori İçeriğini Temizle"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DndContext>
    );
}

