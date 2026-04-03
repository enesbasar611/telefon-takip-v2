"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getShortageItems, addShortageItem as addShortageItemAction, deleteShortageItem as deleteShortageAction, updateShortageQuantity as updateShortageQtyAction, resolveShortageItems as resolveShortageItemsAction } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";

interface ShortageContextType {
    items: any[];
    loading: boolean;
    refresh: () => void;
    addShortage: (data: { productId?: string; name: string; quantity: number }) => Promise<void>;
    removeShortage: (id: string, silent?: boolean) => Promise<void>;
    updateQty: (id: string, qty: number) => Promise<void>;
}

const ShortageContext = createContext<ShortageContextType | undefined>(undefined);

export function ShortageProvider({ children }: { children: React.ReactNode }) {
    const { data: items = [], isLoading: loading, refetch: refresh } = useQuery({
        queryKey: ["shortages"],
        queryFn: () => getShortageItems(),
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: true,
    });

    const addShortage = async (data: { productId?: string; name: string; quantity: number }) => {
        try {
            const res = await addShortageItemAction(data);
            if (res.success) {
                if (res.isDuplicate) {
                    toast.warning(res.message);
                } else {
                    toast.success(`${data.name} eksik listesine eklendi.`);
                    await refresh();
                }
            } else {
                toast.error(res.error || "Ekleme başarısız.");
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

    return (
        <ShortageContext.Provider value={{ items, loading, refresh, addShortage, removeShortage, updateQty }}>
            {children}
        </ShortageContext.Provider>
    );
}

export function useShortage() {
    const ctx = useContext(ShortageContext);
    if (!ctx) throw new Error("useShortage must be used within ShortageProvider");
    return ctx;
}
