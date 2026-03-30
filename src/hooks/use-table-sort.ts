"use client";

import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc" | null;

export function useTableSort<T>(
    data: T[],
    initialField?: string,
    initialOrder: SortOrder = "asc"
) {
    const [sortField, setSortField] = useState<string | null>(initialField || null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);

    const toggleSort = (field: string) => {
        if (sortField === field) {
            if (sortOrder === "asc") setSortOrder("desc");
            else if (sortOrder === "desc") {
                setSortField(null);
                setSortOrder(null);
            } else {
                setSortOrder("asc");
            }
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortField || !sortOrder) return data;

        return [...data].sort((a, b) => {
            let aVal: any = a;
            let bVal: any = b;

            // Handle nested keys like 'product.name'
            if (sortField.includes(".")) {
                const keys = sortField.split(".");
                let currentA = a as any;
                let currentB = b as any;
                for (const key of keys) {
                    currentA = currentA?.[key];
                    currentB = currentB?.[key];
                }
                aVal = currentA;
                bVal = currentB;
            } else {
                aVal = (a as any)[sortField];
                bVal = (b as any)[sortField];
            }

            // Handle null/undefined
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            // Handle Prisma Decimals / Objects with toNumber()
            if (typeof aVal?.toNumber === "function") aVal = aVal.toNumber();
            if (typeof bVal?.toNumber === "function") bVal = bVal.toNumber();

            // Number comparison
            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            }

            // Date comparison
            const aDate = new Date(aVal).getTime();
            const bDate = new Date(bVal).getTime();
            if (!isNaN(aDate) && !isNaN(bDate) && typeof aVal !== "number") {
                return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
            }

            // String comparison (Turkish locale)
            const aStr = String(aVal).toLocaleLowerCase("tr-TR");
            const bStr = String(bVal).toLocaleLowerCase("tr-TR");

            return sortOrder === "asc"
                ? aStr.localeCompare(bStr, "tr-TR")
                : bStr.localeCompare(aStr, "tr-TR");
        });
    }, [data, sortField, sortOrder]);

    return { sortedData, sortField, sortOrder, toggleSort };
}
