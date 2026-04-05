"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Loader2, PackageSearch } from "lucide-react";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";

interface CriticalStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: any[];
}

export function CriticalStockDialog({
    open,
    onOpenChange,
    products,
}: CriticalStockDialogProps) {
    const [loadingIds, setLoadingIds] = useState<string[]>([]);

    const handleAddToShortage = async (product: any) => {
        setLoadingIds((prev) => [...prev, product.id]);
        try {
            const result = await addShortageItem({
                productId: product.id,
                name: product.name,
                quantity: product.criticalStock * 2, // Default suggest double the critical level
                notes: `Kritik stok uyarısı: Mevcut ${product.stock}, Kritik ${product.criticalStock}`,
            });

            if (result.success) {
                if (result.isDuplicate) {
                    toast.warning(result.message);
                } else {
                    toast.success(`${product.name} eksikler listesine eklendi.`);
                }
            } else {
                toast.error(result.error || "İşlem başarısız.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoadingIds((prev) => prev.filter((id) => id !== product.id));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <DialogHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                            <AlertTriangle className="h-6 w-6 text-rose-500" />
                        </div>
                        <div>
                            <DialogTitle className="font-medium text-xl ">Kritik Stok Uyarıları</DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium tracking-tight">
                                Stok seviyesi kritik sınırın altına düşen {products.length} ürün bulundu.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <PackageSearch className="h-12 w-12 mb-4 opacity-20" />
                            <p className="">Kritik seviyede ürün bulunmuyor.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-white/5 hover:bg-transparent">
                                    <TableHead className="font-medium text-[10px]  uppercase text-slate-500 px-6 tracking-widest">Ürün</TableHead>
                                    <TableHead className="font-medium text-[10px]  uppercase text-slate-500 tracking-widest">Mevcut</TableHead>
                                    <TableHead className="font-medium text-[10px]  uppercase text-slate-500 tracking-widest">Kritik</TableHead>
                                    <TableHead className="font-medium text-[10px]  uppercase text-slate-500 text-right px-6 tracking-widest">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className=" text-sm text-slate-200 group-hover:text-white transition-colors">{product.name}</span>
                                                <span className="text-[10px] text-slate-500  mt-1 tracking-tighter uppercase">{product.category?.name || "Kategorisiz"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="bg-rose-500/10 text-rose-500 border-rose-500/20  text-[11px] shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse px-3 py-1 rounded-full"
                                            >
                                                {product.stock} Adet
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm  text-slate-400">
                                            {product.criticalStock}
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                size="sm"
                                                className="h-9 px-4 rounded-xl text-[11px]  bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 group-hover:scale-105 active:scale-95"
                                                onClick={() => handleAddToShortage(product)}
                                                disabled={loadingIds.includes(product.id)}
                                            >
                                                {loadingIds.includes(product.id) ? (
                                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                ) : (
                                                    <Plus className="h-3 w-3 mr-2" />
                                                )}
                                                Eksik Listesine Ekle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
                    <Button
                        variant="ghost"
                        className="rounded-xl  text-xs px-8 text-slate-500 hover:text-white hover:bg-white/5"
                        onClick={() => onOpenChange(false)}
                    >
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}





