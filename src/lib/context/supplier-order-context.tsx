"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { addShortageItem as addShortageItemAction } from "@/lib/actions/shortage-actions";

export interface SupplierOrderItem {
    productId: string | null;
    name: string;
    quantity: number;
    notes?: string;
}

export interface SupplierOrderList {
    supplierName: string;
    supplierPhone?: string;
    items: SupplierOrderItem[];
    hasNewItems?: boolean;
    lastAddedAt?: number;
}

export type SupplierOrders = Record<string, SupplierOrderList>;

interface SupplierOrderContextType {
    orders: SupplierOrders;
    totalItemCount: number;
    addProductToSupplier: (
        supplierId: string,
        supplierName: string,
        supplierPhone: string | undefined,
        product: { productId: string | null; name: string },
        quantity?: number
    ) => void;
    assignProductToSupplier: (
        supplierId: string,
        supplierName: string,
        supplierPhone: string | undefined,
        product: { productId: string | null; name: string },
        quantity?: number
    ) => boolean;
    removeProduct: (supplierId: string, productId: string | null, productName: string, moveBackToShortage?: boolean) => void;
    updateQty: (supplierId: string, productId: string | null, productName: string, qty: number) => void;
    markSeen: (supplierId: string) => void;
    clearSupplier: (supplierId: string) => void;
    clearAll: () => void;
}

const STORAGE_KEY = "supplierOrderLists_v1";

const SupplierOrderContext = createContext<SupplierOrderContextType | undefined>(undefined);

export function SupplierOrderProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<SupplierOrders>({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setOrders(JSON.parse(saved));
        } catch { }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        } catch { }
    }, [orders]);

    const totalItemCount = Object.values(orders).reduce(
        (sum, list) => sum + list.items.length,
        0
    );

    const addProductToSupplier = useCallback(
        (
            supplierId: string,
            supplierName: string,
            supplierPhone: string | undefined,
            product: { productId: string | null; name: string },
            quantity = 1
        ) => {
            setOrders((prev) => {
                const existing = prev[supplierId] ?? {
                    supplierName,
                    supplierPhone,
                    items: [],
                };

                const alreadyExists = existing.items.some(
                    (i) => (product.productId ? i.productId === product.productId : i.name === product.name)
                );

                if (alreadyExists) {
                    return {
                        ...prev,
                        [supplierId]: {
                            ...existing,
                            items: existing.items.map((i) =>
                                (product.productId ? i.productId === product.productId : i.name === product.name)
                                    ? { ...i, quantity: i.quantity + quantity }
                                    : i
                            ),
                        },
                    };
                }

                return {
                    ...prev,
                    [supplierId]: {
                        supplierName,
                        supplierPhone: supplierPhone ?? existing.supplierPhone,
                        items: [
                            ...existing.items,
                            { productId: product.productId, name: product.name, quantity },
                        ],
                    },
                };
            });
        },
        []
    );

    const removeProduct = useCallback(
        async (supplierId: string, productId: string | null, productName: string, moveBackToShortage = true) => {
            setOrders((prev) => {
                const existing = prev[supplierId];
                if (!existing) return prev;
                const items = existing.items.filter((i) =>
                    productId ? i.productId !== productId : i.name !== productName
                );
                if (items.length === 0) {
                    const next = { ...prev };
                    delete next[supplierId];
                    return next;
                }
                return { ...prev, [supplierId]: { ...existing, items } };
            });

            if (moveBackToShortage) {
                try {
                    const res = await addShortageItemAction({
                        productId: productId ?? undefined,
                        name: productName,
                        quantity: 1
                    });
                    if (res.isDuplicate) {
                        toast.warning(res.message);
                    } else {
                        toast.success(`${productName} tekrar eksiklere eklendi.`);
                    }
                } catch (err) {
                    console.error("Back to shortage error:", err);
                }
            }
        },
        []
    );

    const updateQty = useCallback(
        (supplierId: string, productId: string | null, productName: string, qty: number) => {
            setOrders((prev) => {
                const existing = prev[supplierId];
                if (!existing) return prev;
                return {
                    ...prev,
                    [supplierId]: {
                        ...existing,
                        items: existing.items.map((i) =>
                            (productId ? i.productId === productId : i.name === productName)
                                ? { ...i, quantity: Math.max(1, qty) }
                                : i
                        ),
                    },
                };
            });
        },
        []
    );

    const clearSupplier = useCallback((supplierId: string) => {
        setOrders((prev) => {
            const next = { ...prev };
            delete next[supplierId];
            return next;
        });
    }, []);

    const clearAll = useCallback(() => setOrders({}), []);

    const markSeen = useCallback((supplierId: string) => {
        setOrders((prev) => {
            const existing = prev[supplierId];
            if (!existing || !existing.hasNewItems) return prev;
            return {
                ...prev,
                [supplierId]: {
                    ...existing,
                    hasNewItems: false
                }
            };
        });
    }, []);

    const assignProductToSupplier = useCallback(
        (
            supplierId: string,
            supplierName: string,
            supplierPhone: string | undefined,
            product: { productId: string | null; name: string },
            quantity = 1
        ) => {
            setOrders((prev) => {
                const next = { ...prev };
                const existing = next[supplierId] ?? {
                    supplierName,
                    supplierPhone,
                    items: [],
                };

                const itemIndex = existing.items.findIndex((i) =>
                    product.productId ? i.productId === product.productId : i.name === product.name
                );

                let updatedItems;
                if (itemIndex > -1) {
                    updatedItems = existing.items.map((i, idx) =>
                        idx === itemIndex ? { ...i, quantity: i.quantity + quantity } : i
                    );
                } else {
                    updatedItems = [
                        ...existing.items,
                        { productId: product.productId, name: product.name, quantity }
                    ];
                }

                next[supplierId] = {
                    ...existing,
                    supplierPhone: supplierPhone ?? existing.supplierPhone,
                    items: updatedItems,
                    hasNewItems: true,
                    lastAddedAt: Date.now()
                };

                return next;
            });

            toast.success(`${product.name} → ${supplierName} sipariş listesine eklendi.`);
            return true;
        },
        []
    );

    return (
        <SupplierOrderContext.Provider
            value={{ orders, totalItemCount, addProductToSupplier, assignProductToSupplier, removeProduct, updateQty, markSeen, clearSupplier, clearAll }}
        >
            {children}
        </SupplierOrderContext.Provider>
    );
}

export function useSupplierOrders() {
    const ctx = useContext(SupplierOrderContext);
    if (!ctx) throw new Error("useSupplierOrders must be used within SupplierOrderProvider");
    return ctx;
}



