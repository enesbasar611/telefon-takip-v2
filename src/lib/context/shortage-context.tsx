"use client";

import React, { createContext, useContext } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getShortageItems, addShortageItem as addShortageItemAction, addShortageItems as addShortageBulkAction, deleteShortageItem as deleteShortageAction, updateShortageQuantity as updateShortageQtyAction, resolveShortageItems as resolveShortageItemsAction } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";

interface ShortageContextType {
    items: any[];
    loading: boolean;
    refresh: () => void;
    addShortage: (data: {
        productId?: string;
        name: string;
        quantity: number;
        requesterName?: string;
        requesterPhone?: string;
        customerId?: string;
        assignedToId?: string;
    }) => Promise<void>;
    addShortageBulk: (items: any[]) => Promise<void>;
    removeShortage: (id: string, silent?: boolean) => Promise<void>;
    updateQty: (id: string, qty: number) => Promise<void>;
    clearShortages: () => Promise<void>;
    syncZeroStock: () => Promise<void>;
}

const ShortageContext = createContext<ShortageContextType | undefined>(undefined);

export function ShortageProvider({ children }: { children: React.ReactNode }) {
    const { data: items = [], isLoading: loading, refetch: refresh } = useQuery({
        queryKey: ["shortages"],
        queryFn: () => getShortageItems(),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const addShortage = async (data: {
        productId?: string;
        name: string;
        quantity: number;
        requesterName?: string;
        requesterPhone?: string;
        customerId?: string;
        assignedToId?: string;
    }) => {
        try {
            const res = await addShortageItemAction(data);
            if (res.success) {
                toast.success(`${data.name} eksik listesine eklendi.`);
                await refresh();
            } else {
                toast.error(res.error || "Ekleme başarısız.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        }
    };

    const addShortageBulk = async (items: any[]) => {
        try {
            const res = await addShortageBulkAction(items);
            if (res.success) {
                toast.success(`${items.length} ürün başarıyla kuryeye atandı.`);
                await refresh();
            } else {
                toast.error(res.error || "Toplu ekleme başarısız.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        }
    };

    const removeShortage = async (id: string, silent = false) => {
        const res = await deleteShortageAction(id);
        if (res.success) {
            if (!silent) toast.success("Listeden kaldırıldı.");
            refresh();
        } else {
            toast.error(res.error);
        }
    };

    const updateQty = async (id: string, qty: number) => {
        await updateShortageQtyAction(id, qty);
        refresh();
    };

    const clearShortages = async () => {
        try {
            const res = await (await import('@/lib/actions/shortage-actions')).clearAllShortages();
            if (res.success) {
                toast.success("Eksik listesi temizlendi.");
                await refresh();
            } else {
                toast.error(res.error || "Temizleme başarısız.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        }
    };

    const syncZeroStock = async () => {
        try {
            const res = await (await import('@/lib/actions/shortage-actions')).syncZeroStockShortages();
            if (res.success) {
                if (res.count && res.count > 0) {
                    toast.success(`${res.count} ürün otomatik olarak eklendi.`);
                } else {
                    toast.info("Eklenecek yeni stoksuz ürün bulunamadı.");
                }
                await refresh();
            }
        } catch (err) {
            console.error("sync error", err);
        }
    };

    return (
        <ShortageContext.Provider value={{ items, loading, refresh, addShortage, addShortageBulk, removeShortage, updateQty, clearShortages, syncZeroStock }}>
            {children}
        </ShortageContext.Provider>
    );
}

export function useShortage() {
    const ctx = useContext(ShortageContext);
    if (!ctx) throw new Error("useShortage must be used within ShortageProvider");
    return ctx;
}



