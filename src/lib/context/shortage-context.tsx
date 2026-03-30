"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getShortageItems, addShortageItem as addShortageItemAction, deleteShortageItem as deleteShortageAction, updateShortageQuantity as updateShortageQtyAction, resolveShortageItems as resolveShortageItemsAction } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";

interface ShortageContextType {
    items: any[];
    loading: boolean;
    refresh: () => Promise<void>;
    addShortage: (data: { productId?: string; name: string; quantity: number }) => Promise<void>;
    removeShortage: (id: string, silent?: boolean) => Promise<void>;
    updateQty: (id: string, qty: number) => Promise<void>;
}

const ShortageContext = createContext<ShortageContextType | undefined>(undefined);

export function ShortageProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const isRefreshing = useRef(false);

    const refresh = useCallback(async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        try {
            const data = await getShortageItems();
            setItems(data);
        } catch (error) {
            console.error("Shortage fetch error:", error);
        } finally {
            isRefreshing.current = false;
            setLoading(false);
        }
    }, []);

    // Polling for live updates (e.g. every 15 seconds)
    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 15000);
        return () => clearInterval(interval);
    }, [refresh]);

    const addShortage = async (data: { productId?: string; name: string; quantity: number }) => {
        try {
            const res = await addShortageItemAction(data);
            if (res.success) {
                if (res.message) {
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
            setItems(prev => prev.filter(i => i.id !== id));
        } else {
            toast.error(res.error);
        }
    };

    const updateQty = async (id: string, qty: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
        await updateShortageQtyAction(id, qty);
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
