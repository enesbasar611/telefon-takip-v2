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
import { createCategory, updateCategory, deleteCategory, clearCategoryProducts, reorderCategories } from "@/lib/actions/category-actions";
import { addInventoryStock, deleteProduct, updateProduct, createProduct } from "@/lib/actions/product-actions";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    closestCenter,
    defaultDropAnimationSideEffects,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    isMobile?: boolean;
}

function TreeItem({ node, level, isSelected, isExpanded, hasChildren, stats, onSelect, onToggle, activeId }: CategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isSorting,
        over
    } = useSortable({
        id: node.id,
        data: {
            type: 'category',
            parentId: node.parentId
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        marginLeft: `${level * 20}px`,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    const isOver = over?.id === node.id;

    return (
        <div ref={setNodeRef} style={style} className="w-full mb-1 group/item">
            <div
                onClick={() => onSelect(node.id)}
                className={cn(
                    "flex items-center justify-between py-2.5 px-4 rounded-xl border border-transparent select-none transition-all cursor-pointer",
                    isSelected
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "hover:bg-white/[0.04] text-muted-foreground hover:text-white border-white/[0.02]",
                    isOver && !isDragging && "border-emerald-500/50 bg-emerald-500/10 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.15)]",
                    isDragging && "border-indigo-500/50 bg-indigo-500/20"
                )}
            >
                <div className="flex items-center gap-3">
                    {/* Enhanced Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={e => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground/80" />
                    </div>

                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) onToggle(node.id, e);
                        }}
                        className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-lg transition-all",
                            hasChildren ? "cursor-pointer hover:bg-white/10" : "opacity-0 invisible"
                        )}
                    >
                        <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground/80 transition-transform duration-200",
                            isExpanded && "rotate-90 text-indigo-400"
                        )} />
                    </div>

                    <div className="relative">
                        {hasChildren && isExpanded ? (
                            <FolderOpen className={cn("h-5 w-5 shrink-0 transition-colors", isSelected ? "text-indigo-400" : "text-blue-400")} />
                        ) : (
                            <Folder className={cn("h-5 w-5 shrink-0 transition-colors", isSelected ? "text-indigo-400" : "text-muted-foreground/80")} />
                        )}
                        {hasChildren && !isExpanded && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-black animate-pulse" />
                        )}
                    </div>

                    <span className={cn(
                        "text-[13.5px] truncate tracking-tight transition-all",
                        isSelected ? "" : "font-medium"
                    )}>
                        {node.name}
                    </span>
                </div>

                <div className="flex items-center gap-3 opacity-60 group-hover/item:opacity-100 transition-opacity">
                    <div className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px]  tracking-wider border transition-all",
                        isSelected
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/[0.02] border-border text-muted-foreground/80"
                    )}>
                        {stats.totalStock}
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
                    : "bg-white/[0.02] border-border hover:border-white/20"
            )}
        >
            <span className={cn(
                "text-[11px]  uppercase tracking-[0.2em] transition-colors",
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
    const [editingProducts, setEditingProducts] = useState<Record<string, { name: string, buyPrice: number, sellPrice: number }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newProductData, setNewProductData] = useState({ name: "", buyPrice: 0, sellPrice: 0, stock: 0 });
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [stockMode, setStockMode] = useState<"plus" | "minus">("plus");

    // Persist selected category and expanded state to local storage
    const [selectedCatId, setSelectedCatId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('category_selected_id');
        }
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

    // Save state to local storage when it changes
    useEffect(() => {
        if (selectedCatId) {
            localStorage.setItem('category_selected_id', selectedCatId);
        } else {
            localStorage.removeItem('category_selected_id');
        }
    }, [selectedCatId]);

    useEffect(() => {
        localStorage.setItem('category_expanded_state', JSON.stringify(expandedNodes));
    }, [expandedNodes]);

    // Sync state when props change (after server action revalidation)
    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
        setAllProducts(products);
    }, [products]);

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
        // Sort siblings by order or name
        const sortedCats = [...categories].sort((a, b) => {
            if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
            return a.name.localeCompare(b.name);
        });

        sortedCats.forEach(cat => {
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

    const allCategoryIds = useMemo(() => categories.map(c => c.id), [categories]);

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

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeCategory = categories.find(c => c.id === activeId);
        const overCategory = categories.find(c => c.id === overId);

        if (!activeCategory) return;

        // Parent change logic: if dropped on root or a non-sibling specifically targetable as parent
        // or reorder within same parent
        const isDroppedOnRoot = overId === 'null';
        const targetParentId = isDroppedOnRoot ? null : (overCategory?.parentId || null);

        // Circular move check
        if (overId !== "null") {
            const familyIdsOfSource = getCategoryFamilyIds(activeId);
            if (familyIdsOfSource.includes(overId)) {
                toast.error("Bir kategori kendi alt dalına taşınamaz!");
                return;
            }
        }

        startTransition(async () => {
            // Case 1: Reordering within the same parent
            if (activeCategory.parentId === (overId === 'null' ? null : overCategory?.parentId)) {
                const siblings = categories.filter(c => c.parentId === activeCategory.parentId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                const oldIndex = siblings.findIndex(s => s.id === activeId);
                const newIndex = siblings.findIndex(s => s.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newSiblings = arrayMove(siblings, oldIndex, newIndex);
                    // Generate new orders
                    const updates = newSiblings.map((s, idx) => ({
                        id: s.id,
                        order: idx,
                        parentId: s.parentId
                    }));

                    // Local update
                    setCategories(prev => prev.map(c => {
                        const upd = updates.find(u => u.id === c.id);
                        return upd ? { ...c, order: upd.order } : c;
                    }));

                    // Server update
                    const res = await reorderCategories(updates);
                    if (res.success) {
                        toast.success("Sıralama güncellendi.");
                    } else {
                        toast.error(res.message);
                    }
                    return;
                }
            }

            // Case 2: Moving to a new parent (dropped explicitly on an item, if we want that behavior)
            // Or if dropped on Root zone
            const res = await updateCategory({
                id: activeId,
                parentId: overId === "null" ? "null" : overId // DROPPED ON ID means make it CHILD of that ID
            });

            if (res.success) {
                setCategories(prev => prev.map(c =>
                    c.id === activeId ? { ...c, parentId: overId === "null" ? null : overId } : c
                ));
                toast.success("Hiyerarşi güncellendi.");
                if (overId !== "null") {
                    setExpandedNodes(prev => ({ ...prev, [overId]: true }));
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
        if (selectedProductIds.length === 0) {
            toast.error("Lütfen stok eklenecek ürünleri seçin.");
            return;
        }

        const multiplier = stockMode === "plus" ? 1 : -1;
        const finalQuantity = stockToAdd * multiplier;

        setSavingId("bulk-stock"); // Internal flag for bulk loading
        startTransition(async () => {
            let successCount = 0;
            let failCount = 0;

            for (const productId of selectedProductIds) {
                const res = await addInventoryStock(
                    productId,
                    finalQuantity,
                    stockNotes || `Kategori üzerinden hızlı stok ${stockMode === "plus" ? "girişi" : "çıkışı"}`
                );

                if (res.success) {
                    setAllProducts(prev => prev.map(p =>
                        p.id === productId ? { ...p, stock: Math.max(0, p.stock + finalQuantity) } : p
                    ));
                    successCount++;
                } else {
                    failCount++;
                }
            }

            if (failCount === 0) {
                toast.success(`${successCount} ürünün stoku güncellendi.`);
                setStockToAdd(0);
                setStockNotes("");
                setSelectedProductIds([]); // Clear selection after success
            } else {
                toast.warning(`${successCount} başarılı, ${failCount} ürün güncellenemedi.`);
            }
            setSavingId(null);
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

    const handleDeleteSingleProduct = async (productId: string, force: boolean = false) => {
        startTransition(async () => {
            const res = await deleteProduct(productId, force);
            if (res.success) {
                setAllProducts(prev => prev.filter(p => p.id !== productId));
                toast.success("Ürün sistemden tamamen silindi");
            } else if (res.requiresConfirmation) {
                toast.warning(res.error, {
                    duration: 8000,
                    action: {
                        label: "Hepsini Sil",
                        onClick: () => handleDeleteSingleProduct(productId, true)
                    }
                });
            } else {
                toast.error(res.error || "Ürün silinemedi");
            }
        });
    };

    const handleQuickProductUpdate = async (productId: string) => {
        const data = editingProducts[productId];
        if (!data) return;

        setSavingId(productId);
        startTransition(async () => {
            const res = await updateProduct(productId, {
                name: data.name,
                buyPrice: data.buyPrice,
                sellPrice: data.sellPrice
            });

            if (res.success) {
                setAllProducts(prev => prev.map(p =>
                    p.id === productId ? { ...p, name: data.name, buyPrice: data.buyPrice, sellPrice: data.sellPrice } : p
                ));
                toast.success("Ürün anlık güncellendi");
                // Remove from editing state to show it's saved
                setEditingProducts(prev => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
            } else {
                toast.error(res.error || "Güncelleme başarısız");
            }
            setSavingId(null);
        });
    };

    const handleQuickProductAdd = async () => {
        if (!selectedCatId || !newProductData.name) {
            toast.error("Lütfen ürün adını giriniz.");
            return;
        }

        setIsCreatingProduct(true);
        startTransition(async () => {
            const res = await createProduct({
                name: newProductData.name,
                categoryId: selectedCatId,
                buyPrice: newProductData.buyPrice,
                sellPrice: newProductData.sellPrice,
                stock: newProductData.stock, // Use value from UI
                criticalStock: 5, // Default critical stock
            });

            if (res.success && res.product) {
                const newProd = res.product as Product;
                setAllProducts(prev => [newProd, ...prev]);
                setSelectedProductIds(prev => [...prev, newProd.id]); // Auto-select after create
                toast.success("Yeni ürün başarıyla eklendi");
                setNewProductData({ name: "", buyPrice: 0, sellPrice: 0, stock: 0 });
                setShowQuickAdd(false);
            } else {
                toast.error(res.message || "Ürün eklenirken bir hata oluştu");
            }
            setIsCreatingProduct(false);
        });
    };

    const renderTree = (nodes: CategoryNode[], level = 0) => {
        const nodeIds = nodes.map(n => n.id);

        return (
            <SortableContext items={nodeIds} strategy={verticalListSortingStrategy}>
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
            </SortableContext>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-background/40 rounded-3xl border border-border/50 backdrop-blur-sm">
                {/* Sidebar Tree */}
                <div className="w-[320px] h-full bg-[#0D0D0F] border-r border-border/50 p-8 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col gap-1 mb-10 text-left">
                        <h2 className="font-medium text-2xl  text-white tracking-tighter uppercase italic">Kategori Ağacı</h2>
                        <p className="text-[11px] text-muted-foreground/80  uppercase tracking-widest leading-none">Envanter Hiyerarşisi</p>
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
                                className="h-10 w-10 flex-shrink-0 bg-white/5 border-border text-white hover:bg-white/10 rounded-xl"
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
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border/50 rounded-2xl bg-white/[0.01]">
                                    <Folder className="h-8 w-8 text-slate-700 mb-3" />
                                    <p className="text-sm text-muted-foreground/80 font-medium">Henüz kategori bulunmuyor.</p>
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
                <div className="flex-1 h-full overflow-y-auto bg-background/50">
                    {selectedNode ? (
                        <div className="p-8 max-w-5xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <FolderOpen className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="font-medium text-2xl  text-white tracking-tight">{selectedNode.name}</h1>
                                        <p className="text-sm text-muted-foreground/80 font-medium mt-0.5">Toplu Özet • {selectedNode.children?.length ?? 0} Bağlı Düğüm</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        size="sm"
                                        className="bg-indigo-500 hover:bg-indigo-600 text-[11px]  h-9 px-5 rounded-xl shadow-lg shadow-indigo-500/20 uppercase tracking-wider gap-2 flex items-center"
                                        onClick={() => {
                                            setModalTitle(`${selectedNode.name} Altına Varyant Ekle`);
                                            setFormData({ name: "", parentId: selectedNode.id });
                                            setIsAddModalOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Alt Varyant Ekle
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-[11px]  h-9 px-5 rounded-xl shadow-lg shadow-emerald-500/20 uppercase tracking-wider gap-2 flex items-center text-black"
                                        onClick={() => setShowQuickAdd(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ürün Ekle
                                    </Button>
                                    <div className="w-[1px] h-9 bg-white/10 mx-1" />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/[0.03] border-border/50 hover:bg-white/10"
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
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-border/50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Package className="h-12 w-12 text-indigo-400" />
                                    </div>
                                    <p className="text-xs  text-muted-foreground/80 uppercase tracking-widest mb-1">KÜMÜLATİF STOK</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl  text-white">{selectedStats?.totalStock}</span>
                                        <span className="text-sm text-muted-foreground font-medium">Adet</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-2">Alt kategorilerdeki ({selectedStats?.familyIds.length}) ürünler dahildir.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-border/50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Info className="h-12 w-12 text-indigo-400" />
                                    </div>
                                    <p className="text-xs  text-muted-foreground/80 uppercase tracking-widest mb-1">DİREKT ALT VARYANTLAR</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl  text-white">{selectedNode.children?.length ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Section: Quick Actions & Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Products Table Area */}
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-border/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-medium  text-white flex items-center gap-2">
                                                <Package className="h-4 w-4 text-indigo-400" />
                                                Bu Kategorideki Ürünler
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg text-[10px]  text-muted-foreground/80 hover:text-white hover:bg-white/5 uppercase tracking-widest px-3"
                                                    onClick={() => {
                                                        const currentCatProducts = allProducts.filter(p => p.categoryId === selectedNode.id);
                                                        const allSelected = currentCatProducts.every(p => selectedProductIds.includes(p.id));
                                                        if (allSelected) {
                                                            setSelectedProductIds(prev => prev.filter(id => !currentCatProducts.some(cp => cp.id === id)));
                                                        } else {
                                                            setSelectedProductIds(prev => Array.from(new Set([...prev, ...currentCatProducts.map(p => p.id)])));
                                                        }
                                                    }}
                                                >
                                                    {allProducts.filter(p => p.categoryId === selectedNode.id).every(p => selectedProductIds.includes(p.id)) ? "SEÇİMİ KALDIR" : "TÜMÜNÜ SEÇ"}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* QUICK ADD CARD */}
                                            {showQuickAdd && (
                                                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in slide-in-from-top-4 duration-300 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="font-medium text-[9px]  text-emerald-500 uppercase tracking-widest pl-1">Yeni Ürün Adı</Label>
                                                                <Input
                                                                    autoFocus
                                                                    value={newProductData.name}
                                                                    onChange={e => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                                                                    placeholder="Örn: iPhone 15 Pro Kılıf"
                                                                    className="bg-black/40 border-emerald-500/20 h-10 text-[13px] font-semibold text-white focus:border-emerald-500/50"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1 pt-6">
                                                                <Button
                                                                    className="h-10 px-4 rounded-xl bg-emerald-500 text-black  text-[10px] hover:bg-emerald-400 gap-2"
                                                                    onClick={handleQuickProductAdd}
                                                                    disabled={isCreatingProduct || !newProductData.name}
                                                                >
                                                                    {isCreatingProduct ? <Loader2 className="h-3 w-3 animate-spin" /> : "KAYDET"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-10 px-4 rounded-xl bg-white/5 text-muted-foreground/80 hover:text-white"
                                                                    onClick={() => setShowQuickAdd(false)}
                                                                >
                                                                    <div className=" text-[10px]">İPTAL</div>
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="font-medium text-[9px]  text-muted-foreground uppercase tracking-widest pl-1">Alış Fiyatı (₺)</Label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80  ml-1">₺</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={newProductData.buyPrice}
                                                                        onChange={e => setNewProductData(prev => ({ ...prev, buyPrice: Number(e.target.value) }))}
                                                                        className="bg-black/20 border-border/50 h-10 pl-9 text-[13px]  text-foreground"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="font-medium text-[9px]  text-muted-foreground uppercase tracking-widest pl-1">Satış Fiyatı (₺)</Label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400  ml-1">₺</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={newProductData.sellPrice}
                                                                        onChange={e => setNewProductData(prev => ({ ...prev, sellPrice: Number(e.target.value) }))}
                                                                        className="bg-black/20 border-border/50 h-10 pl-9 text-[13px]  text-emerald-400"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="font-medium text-[9px]  text-muted-foreground uppercase tracking-widest pl-1">Başlangıç Stoku</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={newProductData.stock}
                                                                    onChange={e => setNewProductData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                                                                    className="bg-black/20 border-border/50 h-10 text-[13px]  text-white text-center"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {allProducts.filter(p => p.categoryId === selectedNode.id).map(product => {
                                                const isSelected = selectedProductIds.includes(product.id);
                                                const hasChanges = editingProducts[product.id] !== undefined;
                                                const editData = editingProducts[product.id] || {
                                                    name: product.name,
                                                    buyPrice: product.buyPrice,
                                                    sellPrice: product.sellPrice
                                                };

                                                const toggleSelection = (e?: React.MouseEvent) => {
                                                    if (e) e.stopPropagation();
                                                    setSelectedProductIds(prev =>
                                                        isSelected ? prev.filter(id => id !== product.id) : [...prev, product.id]
                                                    );
                                                };

                                                return (
                                                    <div
                                                        key={product.id}
                                                        onMouseDown={(e) => {
                                                            // Prevent text selection handles on multiple clicks
                                                            if (e.detail > 1) e.preventDefault();
                                                        }}
                                                        onClick={(e) => {
                                                            // Selection only triggers if clicking outside inputs or on the specific selection area
                                                            const target = e.target as HTMLElement;
                                                            if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && !target.closest('.no-select-trigger')) {
                                                                toggleSelection();
                                                            }
                                                        }}
                                                        className={cn(
                                                            "p-1.5 rounded-[22px] border transition-all group relative select-none touch-none",
                                                            isSelected
                                                                ? "bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                                                : "bg-white/[0.02] border-border/50 hover:border-border hover:bg-white/[0.04]"
                                                        )}
                                                    >
                                                        <div className="p-4 flex flex-col gap-4">
                                                            {/* Ürün Adı Edit */}
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 space-y-1.5">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        {/* Dedicated Checkbox Target */}
                                                                        <div
                                                                            onClick={toggleSelection}
                                                                            className={cn(
                                                                                "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0",
                                                                                isSelected
                                                                                    ? "bg-indigo-500 border-indigo-400 scale-110"
                                                                                    : "border-white/20 bg-black/40 hover:border-white/40"
                                                                            )}
                                                                        >
                                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-300" />}
                                                                        </div>
                                                                        <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Ürün Adı</Label>
                                                                    </div>
                                                                    <Input
                                                                        value={editData.name}
                                                                        onClick={e => e.stopPropagation()}
                                                                        onChange={e => setEditingProducts(prev => ({
                                                                            ...prev,
                                                                            [product.id]: { ...editData, name: e.target.value }
                                                                        }))}
                                                                        className="bg-black/20 border-border/50 h-10 text-[13px]  text-white focus:bg-black/60 focus:border-indigo-500/30 transition-all"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-1.5 pt-7">
                                                                    <Button
                                                                        variant="ghost"
                                                                        className={cn(
                                                                            "h-10 px-4 rounded-xl transition-all shadow-lg shadow-black/20",
                                                                            hasChanges
                                                                                ? "bg-emerald-500 text-black hover:bg-emerald-400 "
                                                                                : "bg-white/5 text-muted-foreground/80 hover:text-white"
                                                                        )}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleQuickProductUpdate(product.id);
                                                                        }}
                                                                        disabled={savingId === product.id}
                                                                    >
                                                                        {savingId === product.id ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <div className="text-[10px]">KAYDET</div>}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-10 w-10 rounded-xl bg-white/5 text-muted-foreground/80 hover:bg-red-500/30 hover:text-red-400 transition-all"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSingleProduct(product.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Fiyatlar Edit */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Alış Fiyatı (₺)</Label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80  ml-1">₺</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={editData.buyPrice}
                                                                            onChange={e => setEditingProducts(prev => ({
                                                                                ...prev,
                                                                                [product.id]: { ...editData, buyPrice: Number(e.target.value) }
                                                                            }))}
                                                                            className="bg-black/20 border-border/50 h-10 pl-9 text-[13px]  text-foreground"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</Label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400  ml-1">₺</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={editData.sellPrice}
                                                                            onChange={e => setEditingProducts(prev => ({
                                                                                ...prev,
                                                                                [product.id]: { ...editData, sellPrice: Number(e.target.value) }
                                                                            }))}
                                                                            className="bg-indigo-500/5 border-indigo-500/10 h-10 pl-9 text-[13px]  text-indigo-300"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 pt-1">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                                <span className="text-[9px]  text-slate-600 uppercase tracking-[0.2em]">Stok Durumu: {product.stock} ADET</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {allProducts.filter(p => p.categoryId === selectedNode.id).length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border/50 rounded-2xl bg-white/[0.01]">
                                                    <Package className="h-8 w-8 text-slate-700 mb-3" />
                                                    <p className="text-xs text-slate-600 font-medium">Bu kategoride ürün bulunmuyor.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Controls */}
                                <div className="space-y-6">
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-border/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-medium  text-white text-sm flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                    <Package className="h-3.5 w-3.5 text-indigo-400" />
                                                </div>
                                                Toplu Stok Kontrolü
                                            </h3>
                                            <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px]  text-indigo-300">
                                                {selectedProductIds.length} SEÇİLİ
                                            </div>
                                        </div>

                                        <div className="flex p-1 rounded-2xl bg-black/40 border border-border/50 mb-6">
                                            <button
                                                onClick={() => setStockMode("plus")}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-[10px]  transition-all uppercase tracking-widest",
                                                    stockMode === "plus" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-muted-foreground/80 hover:text-foreground"
                                                )}
                                            >
                                                Stok Ekle (+)
                                            </button>
                                            <button
                                                onClick={() => setStockMode("minus")}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-[10px]  transition-all uppercase tracking-widest",
                                                    stockMode === "minus" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-muted-foreground/80 hover:text-foreground"
                                                )}
                                            >
                                                Stok Çıkar (-)
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="font-medium text-[10px] text-muted-foreground/80  uppercase tracking-widest pl-1">ADET MİKTARI</Label>
                                                <Input
                                                    type="number"
                                                    value={stockToAdd}
                                                    onChange={e => setStockToAdd(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="bg-black/40 border-border/50 h-12 text-lg  text-white focus:bg-black/60"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-medium text-[10px] text-muted-foreground/80  uppercase tracking-widest pl-1">İŞLEM NOTU</Label>
                                                <Input
                                                    value={stockNotes}
                                                    onChange={e => setStockNotes(e.target.value)}
                                                    placeholder="Opsiyonel not..."
                                                    className="bg-black/40 border-border/50 h-11 text-xs"
                                                />
                                            </div>
                                            <Button
                                                className={cn(
                                                    "w-full h-12 text-xs  transition-all rounded-2xl shadow-xl uppercase tracking-widest",
                                                    stockMode === "plus" ? "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                                )}
                                                disabled={isPending || stockToAdd <= 0 || selectedProductIds.length === 0}
                                                onClick={handleAddStock}
                                            >
                                                {savingId === "bulk-stock" ? <Loader2 className="h-5 w-5 animate-spin" /> : `İŞLEMİ ONAYLA (${selectedProductIds.length})`}
                                            </Button>
                                            {selectedProductIds.length === 0 && (
                                                <p className="text-[10px] text-slate-600 text-center font-medium italic mt-2 animate-bounce">Lütfen soldan ürün seçiniz</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                            <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-border/50 flex items-center justify-center mb-6">
                                <Folder className="h-10 w-10 text-slate-800" />
                            </div>
                            <h2 className="font-medium text-xl  text-white mb-2">Ağaçtan bir kategori seçin</h2>
                            <p className="text-muted-foreground/80 text-sm max-w-xs text-center">
                                Detayları, özel metrikleri ve alt varyant erişimlerini görmek için sol taraftan bir seçim yapın.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeId ? (
                    <div className="bg-[#1A1A1F] border border-indigo-500/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-3 min-w-[200px] scale-105 rotate-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Folder className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-white text-[13px] ">{categories.find(c => c.id === activeId)?.name}</p>
                            <p className="text-[10px] text-muted-foreground/80  uppercase tracking-widest">Taşınıyor...</p>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

            {/* AD MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="bg-card border-border/50 text-white max-w-md">
                    <form onSubmit={handleAddSubmit}>
                        <DialogHeader>
                            <DialogTitle className="font-medium text-xl ">{modalTitle}</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs">
                                Yeni kategori oluştururken hiyerarşi düzeyini belirleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-medium text-xs text-muted-foreground">KATEGORİ ADI</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Telefon Kılıfları"
                                    className="bg-black/20 border-border/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentId" className="font-medium text-xs text-muted-foreground">ÜST KATEGORİ</Label>
                                <select
                                    id="parentId"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-black/20 border-border/50 text-sm outline-none focus:ring-1 ring-indigo-500"
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
                            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-xs " disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet ve Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-card border-border/50 text-white max-w-md">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle className="font-medium text-xl ">Kategoriyi Düzenle</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs">
                                Kategori adını ve ağaçtaki yerini değiştirebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name" className="font-medium text-xs text-muted-foreground">KATEGORİ ADI</Label>
                                <Input
                                    id="edit_name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/20 border-border/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_parentId" className="font-medium text-xs text-muted-foreground">ÜST KATEGORİ</Label>
                                <select
                                    id="edit_parentId"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-black/20 border-border/50 text-sm outline-none focus:ring-1 ring-indigo-500"
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
                            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-xs " disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE SAFETY MODAL */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-background border-red-500/20 text-white max-w-lg p-0 overflow-hidden">
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="font-medium text-2xl  flex items-center gap-3 text-red-500">
                                <AlertTriangle className="h-8 w-8" />
                                Kritik İşlem Onayı
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
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
                                            : "bg-white/[0.02] border-border/50 hover:border-border"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", deleteMode === "full" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-muted-foreground/80")}>
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <p className={cn(" text-sm", deleteMode === "full" ? "text-white" : "text-muted-foreground")}>Tamamen Sil</p>
                                    <p className="text-[10px] text-muted-foreground/80 mt-1">Kategori ve tüm alt ürünleri yok eder.</p>
                                </button>

                                <button
                                    onClick={() => setDeleteMode("products")}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        deleteMode === "products"
                                            ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20"
                                            : "bg-white/[0.02] border-border/50 hover:border-border"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", deleteMode === "products" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-muted-foreground/80")}>
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <p className={cn(" text-sm", deleteMode === "products" ? "text-white" : "text-muted-foreground")}>Sadece Ürünleri Sil</p>
                                    <p className="text-[10px] text-muted-foreground/80 mt-1">Kategori kalır, içindeki tüm stok temizlenir.</p>
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-red-400 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs text-foreground">
                                            Bu kategoride toplam <span className="text-white ">{selectedStats?.totalStock}</span> adet ürün bulunuyor.
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/80">
                                            Silme işlemi finansal tabloları etkilemez ancak stok takibini sonlandırır.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border-t border-border/50 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-muted-foreground hover:text-white"
                        >
                            İptal Et
                        </Button>
                        <div className="flex items-center gap-3">
                            {deleteCountdown > 0 ? (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm ">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Bekleniyor ({deleteCountdown}s)
                                </div>
                            ) : (
                                <Button
                                    className={cn(
                                        "px-8  transition-all",
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









