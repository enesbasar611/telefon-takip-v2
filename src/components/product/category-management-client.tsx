"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { Folder, FolderOpen, Plus, ChevronRight, ChevronDown, Trash2, Edit2, Info, Loader2, Package, AlertTriangle, GripVertical } from "lucide-react";
import { AICategoryCreator } from "@/components/product/ai-category-creator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
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
import { useDashboardData } from "@/lib/context/dashboard-data-context";
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
    buyPriceUsd?: number | null;
    sellPrice: number;
    sellPriceUsd?: number | null;
    attributes?: Record<string, any> | null;
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
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white border-zinc-200/50 dark:border-white/[0.02]",
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
                        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
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
                            hasChildren ? "cursor-pointer hover:bg-zinc-200 dark:hover:bg-white/10" : "opacity-0 invisible"
                        )}
                    >
                        <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground/80 transition-transform duration-200",
                            isExpanded && "rotate-90 text-indigo-500 dark:text-indigo-400"
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
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-300"
                            : "bg-zinc-100 dark:bg-white/[0.02] border-zinc-200 dark:border-border text-muted-foreground/80"
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
                    : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-border hover:border-indigo-500/30"
            )}
        >
            <span className={cn(
                "text-[11px]  uppercase tracking-[0.2em] transition-colors font-medium",
                isOver ? "text-emerald-500" : "text-muted-foreground/40"
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
    type PriceCurrency = "TRY" | "USD" | "EUR";
    const { rates: exchangeRates, defaultCurrency } = useDashboardData();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [allProducts, setAllProducts] = useState<Product[]>(products);
    const [editingProducts, setEditingProducts] = useState<Record<string, { name: string, buyPrice: number, sellPrice: number }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newProductData, setNewProductData] = useState({ name: "", buyPrice: 0, sellPrice: 0, stock: 0 });
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [stockMode, setStockMode] = useState<"plus" | "minus">("plus");
    const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>(() => {
        if (typeof window === "undefined") return defaultCurrency || "TRY";
        const saved = localStorage.getItem("category_price_currency");
        return saved === "USD" || saved === "EUR" || saved === "TRY" ? saved : (defaultCurrency || "TRY");
    });

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

    useEffect(() => {
        localStorage.setItem("category_price_currency", priceCurrency);
    }, [priceCurrency]);

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

    const getCurrencySymbol = (currency: PriceCurrency = priceCurrency) => {
        if (currency === "USD") return "$";
        if (currency === "EUR") return "€";
        return "₺";
    };

    const getCurrencyRate = (currency: PriceCurrency = priceCurrency) => {
        if (currency === "USD") return exchangeRates?.usd || 34;
        if (currency === "EUR") return exchangeRates?.eur || 37;
        return 1;
    };

    const toTryPrice = (value: number, currency: PriceCurrency = priceCurrency) => {
        const safeValue = Number(value) || 0;
        return currency === "TRY" ? safeValue : Math.ceil(safeValue * getCurrencyRate(currency));
    };

    const getProductDisplayPrice = (product: Product, field: "buyPrice" | "sellPrice") => {
        if (priceCurrency === "TRY") return Number(product[field]) || 0;
        const storedCurrency = product.attributes?.priceCurrency;
        const usdValue = field === "buyPrice" ? product.buyPriceUsd : product.sellPriceUsd;
        if (storedCurrency === priceCurrency && usdValue) return Number(usdValue);
        return Number(((Number(product[field]) || 0) / getCurrencyRate(priceCurrency)).toFixed(2));
    };

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
        const currentProduct = allProducts.find(p => p.id === productId);
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
                attributes: {
                    ...(currentProduct?.attributes || {}),
                    priceCurrency
                }
            });

            if (res.success) {
                setAllProducts(prev => prev.map(p =>
                    p.id === productId ? {
                        ...p,
                        name: data.name,
                        buyPrice: buyPriceTry,
                        buyPriceUsd: priceCurrency === "TRY" ? null : data.buyPrice,
                        sellPrice: sellPriceTry,
                        sellPriceUsd: priceCurrency === "TRY" ? null : data.sellPrice,
                        attributes: {
                            ...(p.attributes || {}),
                            priceCurrency
                        }
                    } : p
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
            const buyPriceTry = toTryPrice(newProductData.buyPrice);
            const sellPriceTry = toTryPrice(newProductData.sellPrice);
            const res = await createProduct({
                name: newProductData.name,
                categoryId: selectedCatId,
                buyPrice: buyPriceTry,
                buyPriceUsd: priceCurrency === "TRY" ? null : newProductData.buyPrice,
                sellPrice: sellPriceTry,
                sellPriceUsd: priceCurrency === "TRY" ? null : newProductData.sellPrice,
                stock: newProductData.stock, // Use value from UI
                criticalStock: 5, // Default critical stock
                attributes: {
                    priceCurrency
                }
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
            <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white/40 dark:bg-background/40 rounded-3xl border border-zinc-200 dark:border-border/50 backdrop-blur-sm shadow-xl">
                {/* Sidebar Tree */}
                <div className="w-[320px] h-full bg-zinc-50/50 dark:bg-[#0D0D0F] border-r border-zinc-200 dark:border-border/50 p-8 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col gap-1 mb-10 text-left">
                        <h2 className="font-bold text-2xl text-indigo-600 dark:text-white tracking-tighter uppercase italic">Kategori Ağacı</h2>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest leading-none font-medium">Envanter Hiyerarşisi</p>
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
                                className="h-10 w-10 flex-shrink-0 bg-white dark:bg-white/5 border-zinc-200 dark:border-border text-foreground dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl shadow-sm"
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
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-zinc-200 dark:border-border/50 rounded-2xl bg-zinc-50 dark:bg-white/[0.01]">
                                    <Folder className="h-8 w-8 text-zinc-400 dark:text-slate-700 mb-3" />
                                    <p className="text-sm text-muted-foreground font-medium">Henüz kategori bulunmuyor.</p>
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
                <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-background/50">
                    {selectedNode ? (
                        <div className="p-8 max-w-5xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <FolderOpen className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-3xl  text-foreground dark:text-white tracking-tight">{selectedNode.name}</h1>
                                        <p className="text-sm text-muted-foreground font-medium mt-1">Toplu Özet • {selectedNode.children?.length ?? 0} Bağlı Düğüm</p>
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
                                    <div className="flex h-9 items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm dark:border-border/50 dark:bg-white/[0.03]">
                                        {(["TRY", "USD", "EUR"] as const).map((currency) => (
                                            <button
                                                key={currency}
                                                type="button"
                                                onClick={() => setPriceCurrency(currency)}
                                                className={cn(
                                                    "h-7 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider transition-all",
                                                    priceCurrency === currency
                                                        ? currency === "TRY"
                                                            ? "bg-amber-500 text-black shadow-sm"
                                                            : currency === "USD"
                                                                ? "bg-emerald-500 text-black shadow-sm"
                                                                : "bg-blue-500 text-black shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                                                )}
                                            >
                                                {currency === "TRY" ? "₺ TL" : currency === "USD" ? "$ USD" : "€ EUR"}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="w-[1px] h-9 bg-zinc-200 dark:bg-white/10 mx-1" />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 hover:bg-zinc-100 dark:hover:bg-white/10 text-foreground dark:text-white"
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
                                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-border/50 relative overflow-hidden group shadow-sm">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Package className="h-12 w-12 text-indigo-500" />
                                    </div>
                                    <p className="text-xs  text-muted-foreground uppercase tracking-widest mb-1 font-bold">KÜMÜLATİF STOK</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground dark:text-white">{selectedStats?.totalStock}</span>
                                        <span className="text-sm text-muted-foreground font-medium">Adet</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 dark:text-slate-600 mt-2">Alt kategorilerdeki ({selectedStats?.familyIds.length}) ürünler dahildir.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-border/50 relative overflow-hidden group shadow-sm">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Info className="h-12 w-12 text-indigo-500" />
                                    </div>
                                    <p className="text-xs  text-muted-foreground uppercase tracking-widest mb-1 font-bold">DİREKT ALT VARYANTLAR</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground dark:text-white">{selectedNode.children?.length ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Section: Quick Actions & Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Products Table Area */}
                                    <div className="p-6 rounded-2xl bg-white/80 dark:bg-white/[0.02] border border-zinc-200 dark:border-border/50 shadow-sm backdrop-blur-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                                                <Package className="h-4 w-4 text-indigo-500" />
                                                Bu Kategorideki Ürünler
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg text-[10px]  text-muted-foreground font-bold hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 uppercase tracking-widest px-3"
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
                                                <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in slide-in-from-top-4 duration-300 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="font-bold text-[9px]  text-emerald-600 dark:text-emerald-500 uppercase tracking-widest pl-1">Yeni Ürün Adı</Label>
                                                                <Input
                                                                    autoFocus
                                                                    value={newProductData.name}
                                                                    onChange={e => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                                                                    placeholder="Örn: iPhone 15 Pro Kılıf"
                                                                    className="bg-white/50 dark:bg-black/40 border-emerald-500/30 h-10 text-[13px] font-bold text-foreground dark:text-white focus:border-emerald-500/50"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1 pt-6">
                                                                <Button
                                                                    className="h-10 px-4 rounded-xl bg-emerald-500 text-black  text-[10px] font-bold hover:bg-emerald-400 gap-2 shadow-lg shadow-emerald-500/20"
                                                                    onClick={handleQuickProductAdd}
                                                                    disabled={isCreatingProduct || !newProductData.name}
                                                                >
                                                                    {isCreatingProduct ? <Loader2 className="h-3 w-3 animate-spin" /> : "KAYDET"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-10 px-4 rounded-xl bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white"
                                                                    onClick={() => setShowQuickAdd(false)}
                                                                >
                                                                    <div className=" text-[10px] font-bold">İPTAL</div>
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="font-bold text-[9px]  text-muted-foreground uppercase tracking-widest pl-1">Alış Fiyatı ({priceCurrency})</Label>
                                                                <div className="relative">
                                                                    <PriceInput
                                                                        value={newProductData.buyPrice}
                                                                        onChange={value => setNewProductData(prev => ({ ...prev, buyPrice: value }))}
                                                                        prefix={getCurrencySymbol()}
                                                                        className="h-10 rounded-xl border-zinc-200 dark:border-border/50 bg-white/50 dark:bg-black/20 text-[13px] font-bold text-foreground dark:text-white"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="font-bold text-[9px]  text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-1">Satış Fiyatı ({priceCurrency})</Label>
                                                                <div className="relative">
                                                                    <PriceInput
                                                                        value={newProductData.sellPrice}
                                                                        onChange={value => setNewProductData(prev => ({ ...prev, sellPrice: value }))}
                                                                        prefix={getCurrencySymbol()}
                                                                        className="h-10 rounded-xl border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 text-[13px] font-bold text-indigo-600 dark:text-indigo-400"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="font-bold text-[9px]  text-muted-foreground uppercase tracking-widest pl-1">Başlangıç Stoku</Label>
                                                                <input
                                                                    type="number"
                                                                    value={newProductData.stock}
                                                                    onChange={e => setNewProductData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                                                                    className="flex h-10 w-full rounded-xl border border-zinc-200 dark:border-border/50 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-[13px] font-bold text-foreground dark:text-white text-center"
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
                                                    buyPrice: getProductDisplayPrice(product, "buyPrice"),
                                                    sellPrice: getProductDisplayPrice(product, "sellPrice")
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
                                                            "p-1.5 rounded-[22px] border transition-all group relative select-none touch-none shadow-sm",
                                                            isSelected
                                                                ? "bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                                                : "bg-white/50 dark:bg-white/[0.02] border-zinc-200 dark:border-border/50 hover:border-indigo-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
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
                                                                                    ? "bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/20"
                                                                                    : "border-zinc-300 dark:border-white/20 bg-white dark:bg-black/40 hover:border-indigo-400 shadow-sm"
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
                                                                        className="bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-border/50 h-10 text-[13px] font-bold text-foreground dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-indigo-500/30 transition-all shadow-sm"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-1.5 pt-7">
                                                                    <Button
                                                                        variant="ghost"
                                                                        className={cn(
                                                                            "h-10 px-4 rounded-xl transition-all shadow-lg",
                                                                            hasChanges
                                                                                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                                                                                : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white font-bold"
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
                                                                        className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-red-500/10 dark:hover:bg-red-500/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
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
                                                                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Alış Fiyatı ({priceCurrency})</Label>
                                                                    <div className="relative">
                                                                        <PriceInput
                                                                            value={editData.buyPrice}
                                                                            onChange={value => setEditingProducts(prev => ({
                                                                                ...prev,
                                                                                [product.id]: { ...editData, buyPrice: value }
                                                                            }))}
                                                                            prefix={getCurrencySymbol()}
                                                                            className="bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-border/50 h-10 text-[13px] font-bold text-foreground dark:text-white shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="font-medium text-[9px]  text-muted-foreground/80 uppercase tracking-widest pl-1">Satış Fiyatı ({priceCurrency})</Label>
                                                                    <div className="relative">
                                                                        <PriceInput
                                                                            value={editData.sellPrice}
                                                                            onChange={value => setEditingProducts(prev => ({
                                                                                ...prev,
                                                                                [product.id]: { ...editData, sellPrice: value }
                                                                            }))}
                                                                            prefix={getCurrencySymbol()}
                                                                            className="bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/10 h-10 text-[13px] font-bold text-indigo-600 dark:text-indigo-300 shadow-sm"
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
                                                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-zinc-200 dark:border-border/50 rounded-2xl bg-zinc-50 dark:bg-white/[0.01]">
                                                    <Package className="h-8 w-8 text-zinc-400 dark:text-slate-700 mb-3" />
                                                    <p className="text-xs text-muted-foreground font-bold">Bu kategoride ürün bulunmuyor.</p>
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

                                        <div className="flex p-1.5 rounded-2xl bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-border/50 mb-6 shadow-inner">
                                            <button
                                                onClick={() => setStockMode("plus")}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-[10px]  transition-all uppercase tracking-widest font-bold",
                                                    stockMode === "plus" ? "bg-white dark:bg-emerald-500 text-emerald-600 dark:text-black shadow-sm dark:shadow-emerald-500/20 border border-zinc-200 dark:border-transparent" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Stok Ekle (+)
                                            </button>
                                            <button
                                                onClick={() => setStockMode("minus")}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-[10px]  transition-all uppercase tracking-widest font-bold",
                                                    stockMode === "minus" ? "bg-white dark:bg-red-500 text-red-600 dark:text-white shadow-sm dark:shadow-red-500/20 border border-zinc-200 dark:border-transparent" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Stok Çıkar (-)
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">ADET MİKTARI</Label>
                                                <Input
                                                    type="number"
                                                    value={stockToAdd}
                                                    onChange={e => setStockToAdd(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="bg-white dark:bg-black/40 border-zinc-200 dark:border-border/50 h-12 text-lg font-bold text-foreground dark:text-white focus:bg-white dark:focus:bg-black/60 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">İŞLEM NOTU</Label>
                                                <Input
                                                    value={stockNotes}
                                                    onChange={e => setStockNotes(e.target.value)}
                                                    placeholder="Opsiyonel not..."
                                                    className="bg-white dark:bg-black/40 border-zinc-200 dark:border-border/50 h-11 text-xs font-medium shadow-sm"
                                                />
                                            </div>
                                            <Button
                                                className={cn(
                                                    "w-full h-12 text-xs  transition-all rounded-2xl shadow-xl uppercase tracking-widest font-bold",
                                                    stockMode === "plus" ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20" : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                                                )}
                                                disabled={isPending || stockToAdd <= 0 || selectedProductIds.length === 0}
                                                onClick={handleAddStock}
                                            >
                                                {savingId === "bulk-stock" ? <Loader2 className="h-5 w-5 animate-spin" /> : `İŞLEMİ ONAYLA (${selectedProductIds.length})`}
                                            </Button>
                                            {selectedProductIds.length === 0 && (
                                                <p className="text-[10px] text-zinc-500 dark:text-slate-600 text-center font-bold italic mt-2 animate-bounce">Lütfen soldan ürün seçiniz</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-border/50 flex items-center justify-center mb-8 shadow-xl relative group">
                                <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] scale-0 group-hover:scale-100 transition-transform duration-500" />
                                <Folder className="h-10 w-10 text-indigo-500 dark:text-slate-800 relative z-10" />
                            </div>
                            <h2 className="font-bold text-2xl text-foreground dark:text-white mb-3">Ağaçtan bir kategori seçin</h2>
                            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
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
                <DialogContent className="bg-white dark:bg-card border-zinc-200 dark:border-border/50 text-foreground dark:text-white max-w-md shadow-2xl">
                    <form onSubmit={handleAddSubmit}>
                        <DialogHeader>
                            <DialogTitle className="font-bold text-2xl text-indigo-600 dark:text-white tracking-tight">{modalTitle}</DialogTitle>
                            <DialogDescription className="text-zinc-500 dark:text-muted-foreground text-xs font-medium">
                                Yeni kategori oluştururken hiyerarşi düzeyini belirleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">KATEGORİ ADI</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Telefon Kılıfları"
                                    className="bg-zinc-100 dark:bg-black/20 border-zinc-200 dark:border-border/50 h-11 text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentId" className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">ÜST KATEGORİ</Label>
                                <select
                                    id="parentId"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-border/50 text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20 shadow-inner"
                                >
                                    <option value="null">--- Ana Dizin (Root) ---</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Vazgeç</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-indigo-500/10" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet ve Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-white dark:bg-card border-zinc-200 dark:border-border/50 text-foreground dark:text-white max-w-md shadow-2xl">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle className="font-bold text-2xl text-indigo-600 dark:text-white tracking-tight">Kategoriyi Düzenle</DialogTitle>
                            <DialogDescription className="text-zinc-500 dark:text-muted-foreground text-xs font-medium">
                                Kategori adını ve ağaçtaki yerini değiştirebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-6">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name" className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">KATEGORİ ADI</Label>
                                <Input
                                    id="edit_name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-zinc-100 dark:bg-black/20 border-zinc-200 dark:border-border/50 h-11 text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_parentId" className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">ÜST KATEGORİ</Label>
                                <select
                                    id="edit_parentId"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-border/50 text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20 shadow-inner"
                                >
                                    <option value="null">--- Ana Dizin (Root) ---</option>
                                    {categories.filter(c => c.id !== editCatId).map(c => {
                                        // Simple circular dependency prevention: don't allow selecting current category as parent
                                        return <option key={c.id} value={c.id}>{c.name}</option>
                                    })}
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Vazgeç</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-indigo-500/10" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE SAFETY MODAL */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-white dark:bg-background border-red-500/20 text-foreground dark:text-white max-w-lg p-0 overflow-hidden shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="font-bold text-3xl  flex items-center gap-3 text-red-600 dark:text-red-500 tracking-tight">
                                <AlertTriangle className="h-10 w-10" />
                                Kritik İşlem Onayı
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500 dark:text-muted-foreground text-sm leading-relaxed mt-4 font-medium">
                                <span className="text-foreground dark:text-white font-bold underline">"{selectedNode?.name}"</span> kategorisi ve bağlı tüm alt veriler silinmek üzere. Bu işlem geri alınamaz.
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
                                            : "bg-zinc-100 dark:bg-white/[0.02] border-zinc-200 dark:border-border/50 hover:border-red-500/30"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", deleteMode === "full" ? "bg-red-500 text-white" : "bg-zinc-200 dark:bg-white/5 text-muted-foreground group-hover:bg-red-500/10 group-hover:text-red-500")}>
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <p className={cn(" text-sm font-bold", deleteMode === "full" ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>Tamamen Sil</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-muted-foreground/80 mt-1 font-medium">Kategori ve tüm alt ürünleri yok eder.</p>
                                </button>

                                <button
                                    onClick={() => setDeleteMode("products")}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        deleteMode === "products"
                                            ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20"
                                            : "bg-zinc-100 dark:bg-white/[0.02] border-zinc-200 dark:border-border/50 hover:border-amber-500/30"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", deleteMode === "products" ? "bg-amber-500 text-white" : "bg-zinc-200 dark:bg-white/5 text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-amber-500")}>
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <p className={cn(" text-sm font-bold", deleteMode === "products" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>Sadece Ürünleri Sil</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-muted-foreground/80 mt-1 font-medium">Kategori kalır, içindeki tüm stok temizlenir.</p>
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-foreground font-medium">
                                            Bu kategoride toplam <span className="text-red-600 dark:text-white font-bold">{selectedStats?.totalStock}</span> adet ürün bulunuyor.
                                        </p>
                                        <p className="text-[10px] text-zinc-500 dark:text-muted-foreground/80 font-bold leading-relaxed">
                                            SİLME İŞLEMİ FİNANSAL TABLOLARI ETKİLEMEZ ANCAK AKTİF STOK TAKİBİNİ SONLANDIRIR.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-200 dark:border-border/50 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-muted-foreground hover:text-foreground dark:hover:text-white font-bold uppercase text-[10px] tracking-widest"
                        >
                            İptal Et
                        </Button>
                        <div className="flex items-center gap-3">
                            {deleteCountdown > 0 ? (
                                <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Bekleniyor ({deleteCountdown}s)
                                </div>
                            ) : (
                                <Button
                                    className={cn(
                                        "px-8 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest",
                                        deleteMode === "full" ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
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









