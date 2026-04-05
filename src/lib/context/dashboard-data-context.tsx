"use client";

import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";

interface DashboardDataContextType {
    rates: any;
    stats: any;
    isLoading: boolean;
    refresh: () => void;
}

const DashboardDataContext = createContext<DashboardDataContextType | null>(null);

export function DashboardDataProvider({
    children,
    initialRates,
    initialStats,
}: {
    children: React.ReactNode;
    initialRates: any;
    initialStats: any;
}) {
    const { data, isLoading, refetch: refresh } = useQuery({
        queryKey: ["dashboard-init"],
        queryFn: () => getDashboardInit(),
        initialData: { rates: initialRates, stats: initialStats },
        staleTime: 60000, // 1 minute
        refetchOnWindowFocus: true,
    });

    return (
        <DashboardDataContext.Provider
            value={{
                rates: data?.rates || initialRates,
                stats: data?.stats || initialStats,
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



