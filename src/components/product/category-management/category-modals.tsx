"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2, Package, Info, Loader2, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "./types";

interface CategoryAddModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: { name: string; parentId: string };
    setFormData: (data: any) => void;
    categories: Category[];
    title: string;
    isPending: boolean;
}

export function CategoryAddModal({
    isOpen,
    onOpenChange,
    onSubmit,
    formData,
    setFormData,
    categories,
    title,
    isPending
}: CategoryAddModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-card border-zinc-200 dark:border-border/50 text-foreground dark:text-white max-w-md shadow-2xl">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-bold text-2xl text-indigo-600 dark:text-white tracking-tight">{title}</DialogTitle>
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
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Vazgeç</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-indigo-500/10" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet ve Oluştur"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface CategoryEditModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: { name: string; parentId: string };
    setFormData: (data: any) => void;
    categories: Category[];
    editCatId: string | null;
    isPending: boolean;
}

export function CategoryEditModal({
    isOpen,
    onOpenChange,
    onSubmit,
    formData,
    setFormData,
    categories,
    editCatId,
    isPending
}: CategoryEditModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-card border-zinc-200 dark:border-border/50 text-foreground dark:text-white max-w-md shadow-2xl">
                <form onSubmit={onSubmit}>
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
                                {categories.filter(c => c.id !== editCatId).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Vazgeç</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-indigo-500/10" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface CategoryDeleteModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: () => void;
    categoryName: string;
    totalStock: number;
    deleteMode: "full" | "products";
    setDeleteMode: (mode: "full" | "products") => void;
    deleteCountdown: number;
}

export function CategoryDeleteModal({
    isOpen,
    onOpenChange,
    onDelete,
    categoryName,
    totalStock,
    deleteMode,
    setDeleteMode,
    deleteCountdown
}: CategoryDeleteModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-background border-red-500/20 text-foreground dark:text-white max-w-lg p-0 overflow-hidden shadow-2xl">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="font-bold text-3xl  flex items-center gap-3 text-red-600 dark:text-red-500 tracking-tight">
                            <AlertTriangle className="h-10 w-10" />
                            Kritik İşlem Onayı
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-muted-foreground text-sm leading-relaxed mt-4 font-medium">
                            <span className="text-foreground dark:text-white font-bold underline">"{categoryName}"</span> kategorisi ve bağlı tüm alt veriler silinmek üzere. Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
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
                                        Bu kategoride toplam <span className="text-red-600 dark:text-white font-bold">{totalStock}</span> adet ürün bulunuyor.
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
                        onClick={() => onOpenChange(false)}
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
                                onClick={onDelete}
                            >
                                {deleteMode === "full" ? "Kategoriyi Tamamen Yok Et" : "Kategori İçeriğini Temizle"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface CategoryBulkAddModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: { parentId: string };
    categories: Category[];
    bulkNames: string;
    setBulkNames: (names: string) => void;
    isPending: boolean;
}

export function CategoryBulkAddModal({
    isOpen,
    onOpenChange,
    onSubmit,
    formData,
    categories,
    bulkNames,
    setBulkNames,
    isPending
}: CategoryBulkAddModalProps) {
    const parent = categories.find(c => c.id === formData.parentId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-card border-zinc-200 dark:border-border/50 text-foreground dark:text-white max-w-xl shadow-2xl">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-bold text-2xl text-indigo-600 dark:text-white tracking-tight italic flex items-center gap-3">
                            <Sparkles className="h-6 w-6" />
                            Toplu Alt Varyant Ekle
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-muted-foreground text-xs font-medium">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{parent?.name || "Ana Dizin"}</span> altına birden fazla alt kategori ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                        <div className="space-y-3">
                            <Label htmlFor="bulkNames" className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest pl-1 flex items-center justify-between">
                                VARYANT İSİMLERİ
                                <span className="text-zinc-400 normal-case font-medium">(Virgül veya Alt satır ile ayırın)</span>
                            </Label>
                            <textarea
                                id="bulkNames"
                                value={bulkNames}
                                onChange={e => setBulkNames(e.target.value)}
                                placeholder="Örn: 27W, 33W, 45W, 67W, 120W"
                                rows={6}
                                className="w-full bg-zinc-100 dark:bg-black/20 border-zinc-200 dark:border-border/50 px-4 py-3 rounded-xl text-sm font-bold shadow-inner focus:outline-none focus:ring-2 ring-indigo-500/20 resize-none leading-relaxed"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/10">
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">
                                💡 İPUCU: Her satıra veya her virgül arasına bir isim yazarak onlarca alt varyantı bir saniyede oluşturabilirsiniz.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Vazgeç</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg shadow-indigo-500/10" disabled={isPending || !bulkNames.trim()}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Varyantları Oluştur"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
