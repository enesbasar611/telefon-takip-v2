"use client";

import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";

interface DashboardDataContextType {
    rates: any;
    stats: any;
    settings: any[];
    isLoading: boolean;
    refresh: () => void;
    defaultCurrency: "TRY" | "USD";
}

const DashboardDataContext = createContext<DashboardDataContextType | null>(null);

export function DashboardDataProvider({
    children,
    initialRates,
    initialStats,
    initialSettings,
    shopId,
}: {
    children: React.ReactNode;
    initialRates: any;
    initialStats: any;
    initialSettings: any[];
    shopId?: string;
}) {
    const { data, isLoading, refetch: refresh } = useQuery({
        queryKey: ["dashboard-init", shopId],
        queryFn: () => getDashboardInit(shopId || ""),
        initialData: { rates: initialRates, stats: initialStats, settings: initialSettings },
        staleTime: 60000, // 1 minute
        refetchOnWindowFocus: true,
    });

    const settings = data?.settings || initialSettings || [];
    const defaultCurrency = (settings.find(s => s.key === "defaultCurrency")?.value as any) || "TRY";

    return (
        <DashboardDataContext.Provider
            value={{
                rates: data?.rates || initialRates,
                stats: data?.stats || initialStats,
                settings,
                defaultCurrency,
                isLoading,
                refresh
            }}
        >
            {children}
        </DashboardDataContext.Provider>
    );
}

export function useDashboardData() {
    const context = useContext(DashboardDataContext);
    if (!context) {
        throw new Error("useDashboardData must be used within a DashboardDataProvider");
    }
    return context;
}
