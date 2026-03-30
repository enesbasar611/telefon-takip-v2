"use client";

import { useState, useMemo, useTransition } from "react";
import { Folder, FolderOpen, Plus, ChevronRight, ChevronDown, Trash2, Edit2, Info, Loader2, Package } from "lucide-react";
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
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category-actions";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface Product {
    id: string;
    categoryId: string;
    stock: number;
    buyPrice: number;
    sellPrice: number;
}

interface CategoryNode extends Category {
    children: CategoryNode[];
}

export function CategoryManagementClient({
    initialCategories,
    products
}: {
    initialCategories: Category[],
    products: Product[]
}) {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Modal Data
    const [modalTitle, setModalTitle] = useState("");
    const [formData, setFormData] = useState({ name: "", parentId: "null" });
    const [editCatId, setEditCatId] = useState("");

    const [isPending, startTransition] = useTransition();

    // 1. Build Tree
    const tree = useMemo(() => {
        const map = new Map<string, CategoryNode>();
        const roots: CategoryNode[] = [];

        categories.forEach(cat => {
            map.set(cat.id, { ...cat, children: [] });
        });

        categories.forEach(cat => {
            const node = map.get(cat.id);
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children.push(node!);
            } else {
                roots.push(node!);
            }
        });

        return roots;
    }, [categories]);

    // 2. Calculate Total Nested Stock Function
    const getCategoryFamilyIds = (catId: string): string[] => {
        const children = categories.filter(c => c.parentId === catId).map(c => c.id);
        let allIds = [catId, ...children];
        children.forEach(childId => {
            // Recursive call, avoiding loops by simple tree nature
            allIds = [...allIds, ...getCategoryFamilyIds(childId).filter(id => id !== childId)];
        });
        return Array.from(new Set(allIds));
    };

    const getCumulativeStats = (catId: string) => {
        const familyIds = getCategoryFamilyIds(catId);
        let totalStock = 0;
        let totalCost = 0;

        products.forEach(p => {
            if (familyIds.includes(p.categoryId)) {
                totalStock += p.stock;
                totalCost += (Number(p.buyPrice) || 0) * p.stock;
            }
        });

        return { totalStock, totalCost, familyIds };
    };

    const selectedNode = categories.find(c => c.id === selectedCatId);
    const selectedStats = selectedNode ? getCumulativeStats(selectedNode.id) : null;
    const directChildren = categories.filter(c => c.parentId === selectedCatId);

    // Toggle Node
    const toggleNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Select Node
    const selectNode = (id: string) => {
        setSelectedCatId(id);
    };

    // Handlers
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Kategori adı zorunludur!");

        startTransition(async () => {
            const res = await createCategory({
                name: formData.name,
                parentId: formData.parentId === "null" ? undefined : formData.parentId
            });

            if (res.success && res.category) {
                setCategories([...categories, res.category as Category]);
                toast.success("Kategori eklendi!");
                setIsAddModalOpen(false);
                if (formData.parentId !== "null") {
                    setExpandedNodes(prev => ({ ...prev, [formData.parentId]: true }));
                }
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
                setCategories(categories.map(c => c.id === editCatId ? res.category as Category : c));
                toast.success("Kategori güncellendi!");
                setIsEditModalOpen(false);
            } else {
                toast.error(res.message || "Hata oluştu");
            }
        });
    };

    const handleDelete = () => {
        if (!selectedCatId) return;

        startTransition(async () => {
            const res = await deleteCategory(selectedCatId);
            if (res.success) {
                setCategories(categories.filter(c => c.id !== selectedCatId));
                toast.success("Kategori silindi!");
                setSelectedCatId(null);
                setIsDeleteModalOpen(false);
            } else {
                toast.error(res.message);
            }
        });
    };

    // Render Tree recursively
    const renderTree = (nodes: CategoryNode[], level = 0) => {
        return (
            <div className="flex flex-col gap-1 w-full relative">
                {nodes.map(node => {
                    const isExpanded = !!expandedNodes[node.id];
                    const isSelected = selectedCatId === node.id;
                    const hasChildren = node.children.length > 0;
                    const stats = getCumulativeStats(node.id);

                    return (
                        <div key={node.id} className="w-full">
                            <div
                                onClick={() => selectNode(node.id)}
                                className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all border border-transparent
                  ${isSelected ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "hover:bg-white/[0.03] text-slate-300 hover:text-white"}
                `}
                                style={{ marginLeft: `${level * 16}px` }}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        onClick={(e) => hasChildren ? toggleNode(node.id, e) : undefined}
                                        className={`w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 ${hasChildren ? "cursor-pointer" : "opacity-0"}`}
                                    >
                                        {hasChildren && (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />)}
                                    </span>
                                    {hasChildren && isExpanded ? (
                                        <FolderOpen className={`h-4 w-4 ${isSelected ? "text-indigo-400" : "text-blue-400"}`} />
                                    ) : (
                                        <Folder className={`h-4 w-4 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                                    )}
                                    <span className={`text-[13px] ${isSelected ? "font-semibold" : "font-medium"}`}>{node.name}</span>
                                </div>

                                {/* Meta Badge */}
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isSelected ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-white/[0.02] border-white/5 text-slate-500"}`}>
                                        {stats.totalStock} Adet
                                    </div>
                                </div>
                            </div>

                            {hasChildren && isExpanded && (
                                <div className="mt-1 relative before:content-[''] before:absolute before:left-[-6px] before:top-0 before:bottom-0 before:w-px before:bg-white/5">
                                    {renderTree(node.children, level + 1)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Sol Pane - Tree View */}
            <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 shadow-2xl shadow-black/40 rounded-2xl p-6 min-h-[500px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <h2 className="text-[14px] font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-slate-600"></span> Kategori Ağacı
                    </h2>
                    <Button
                        onClick={() => {
                            setModalTitle("Ana Kategori Ekle");
                            setFormData({ name: "", parentId: "null" });
                            setIsAddModalOpen(true);
                        }}
                        variant="default"
                        className="h-8 px-3 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    >
                        <Plus className="h-4 w-4 mr-1.5" /> Yeni Kategori Ekle
                    </Button>
                </div>

                <div className="space-y-1">
                    {tree.length > 0 ? renderTree(tree) : (
                        <div className="py-10 text-center flex flex-col items-center justify-center opacity-50">
                            <Folder className="h-10 w-10 text-slate-600 mb-3" />
                            <p className="text-[12px] font-medium text-slate-400">Henüz kategori bulunmuyor, sağ üstten yeni ekleyebilirsiniz.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sağ Pane - Detaylar */}
            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 shadow-2xl shadow-black/40 rounded-2xl p-8 min-h-[500px] flex flex-col">
                {selectedNode && selectedStats ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <FolderOpen className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{selectedNode.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[12px] font-medium text-slate-500">
                                            Toplu Özet
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                                        <span className="text-[12px] font-medium text-slate-500">
                                            {selectedStats.familyIds.length} Bağlı Düğüm
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border border-white/10 bg-white/[0.02] p-1 rounded-xl">
                                <Button
                                    onClick={() => {
                                        setModalTitle(`"${selectedNode.name}" için Alt Kategori`);
                                        setFormData({ name: "", parentId: selectedNode.id });
                                        setIsAddModalOpen(true);
                                    }}
                                    variant="ghost"
                                    className="h-9 px-4 text-[12px] font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" /> Alt Varyant
                                </Button>
                                <div className="w-px h-5 bg-white/10" />
                                <Button
                                    onClick={() => {
                                        setEditCatId(selectedNode.id);
                                        setFormData({ name: selectedNode.name, parentId: selectedNode.parentId || "null" });
                                        setIsEditModalOpen(true);
                                    }}
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Metrikler Bento */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Kümülatif Stok</h3>
                                </div>
                                <div className="text-3xl font-bold text-white relative z-10">
                                    {selectedStats.totalStock} <span className="text-[14px] font-medium text-slate-500 ml-1">Adet</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-500 mt-2 relative z-10">Alt kategorilerdeki ({directChildren.length}) ürünler dahildir.</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Direkt Alt Varyantlar</h3>
                                </div>
                                <div className="text-3xl font-bold text-white relative z-10">
                                    {directChildren.length}
                                </div>
                            </div>
                        </div>

                        {/* List connected alt categories thinly */}
                        <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-5">
                            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-3 mb-4">
                                <div className="w-4 h-[1px] bg-slate-700"></div> Alt Kategori Hiyerarşisi
                            </h4>
                            {directChildren.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {directChildren.map(child => (
                                        <div key={child.id} onClick={() => selectNode(child.id)} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-3.5 w-3.5 text-blue-400" />
                                                <span className="text-[12px] font-semibold text-slate-300">{child.name}</span>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-slate-600" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-[12px] font-medium text-slate-500">Bu kategoriye ait alt varyant bulunamadı.</p>
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 py-20">
                        <Package className="h-16 w-16 text-slate-700 mb-6" />
                        <p className="text-[15px] font-semibold text-slate-400">Ağaçtan bir kategori seçin</p>
                        <p className="text-[12px] font-medium text-slate-500 mt-2 text-center max-w-[280px]">Detayları, özel metrikleri ve alt varyant erişimlerini görmek için sol taraftan bir seçim yapın.</p>
                    </div>
                )}
            </div>

            {/* MODALS */}

            {/* Add Kategori */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleAddSubmit}>
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-semibold">{modalTitle}</DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">Yeni bir varyant veya kategori düğümü oluştur.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-slate-400">İsim</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/[0.03] border-white/10 h-11 text-[13px] focus-visible:ring-indigo-500/50"
                                        placeholder="Örn: 20W Adaptör"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-slate-400">Üst Kategori Konumu</Label>
                                    <select
                                        value={formData.parentId}
                                        onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                        className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 outline-none text-white"
                                    >
                                        <option value="null" className="bg-[#0f172a] text-slate-400">-- Ana Kategori (Kök) --</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mr-6 mb-6">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={isPending} className="bg-indigo-500 text-white font-semibold hover:bg-indigo-600">
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Ekle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Kategori */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleEditSubmit}>
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-semibold">Kategoriyi Düzenle</DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">İsimlendirmeyi veya kategorinin ait olduğu dalı güncelleyin.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-slate-400">İsim</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/[0.03] border-white/10 h-11 text-[13px] focus-visible:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-slate-400">Üst Kategori Konumu</Label>
                                    <select
                                        value={formData.parentId}
                                        onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                        className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 outline-none text-white"
                                    >
                                        <option value="null" className="bg-[#0f172a] text-slate-400">-- Ana Kategori (Kök) --</option>
                                        {categories.filter(c => c.id !== editCatId).map(c => (
                                            <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mr-6 mb-6">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={isPending} className="bg-indigo-500 text-white font-semibold hover:bg-indigo-600">
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Kategori */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-red-950/20 border border-red-500/20 text-white p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-red-500">Düğümü Sil</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-2">
                                <strong>{selectedNode?.name}</strong> kategorisini silmek istediğinize emin misiniz? <br />
                                <span className="text-rose-400/80">İçerisinde ürün veya alt kategori varsa silme işlemi başarısız olacaktır.</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="mr-6 mb-6">
                        <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>İptal</Button>
                        <Button type="button" onClick={handleDelete} disabled={isPending} className="bg-red-500 text-white font-semibold hover:bg-red-600">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Evet, Kalıcı Olarak Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
