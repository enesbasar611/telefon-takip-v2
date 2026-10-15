"use client";

import React, { createContext, useContext } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";

interface DashboardSetting {
    key: string;
    value: unknown;
}

export interface TenantConfig {
    id: string;
    name: string;
    industry: string;
    enabledModules: string[];
    isCourierEnabled: boolean;
    isEInvoiceEnabled: boolean;
    isFinanceEnabled: boolean;
    isServiceEnabled: boolean;
    isStockEnabled: boolean;
}

interface DashboardDataContextType {
    rates: any;
    stats: any;
    settings: DashboardSetting[];
    tenant?: TenantConfig | null;
    isLoading: boolean;
    refresh: () => void;
    defaultCurrency: "TRY" | "USD" | "EUR";
    shopId?: string;
}

const DashboardDataContext = createContext<DashboardDataContextType | null>(null);

export function DashboardDataProvider({
    children,
    initialRates,
    initialStats,
    initialSettings,
    initialTenant,
    shopId,
}: {
    children: React.ReactNode;
    initialRates: any;
    initialStats: any;
    initialSettings: DashboardSetting[];
    initialTenant?: TenantConfig | null;
    shopId?: string;
}) {
    const { data, isLoading, refetch: refresh } = useQuery({
        queryKey: ["dashboard-init", shopId],
        queryFn: () => getDashboardInit(shopId || ""),
        initialData: { rates: initialRates, stats: initialStats, settings: initialSettings, tenant: initialTenant || null },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    // Handle LocalStorage caching for rates to survive browser refreshes/data clearing issues
    React.useEffect(() => {
        if (data?.rates) {
            localStorage.setItem(`last_known_rates_${shopId || 'global'}`, JSON.stringify(data.rates));
        }
    }, [data?.rates, shopId]);

    const cachedRates = React.useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            const cached = localStorage.getItem(`last_known_rates_${shopId || 'global'}`);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    }, [shopId]);

    const rates = data?.rates || initialRates || cachedRates;
    const settings: DashboardSetting[] = data?.settings || initialSettings || [];
    const tenant: TenantConfig | null = data?.tenant || initialTenant || null;
    const defaultCurrency = (settings.find(s => s.key === "defaultCurrency")?.value as any) || "TRY";

    return (
        <DashboardDataContext.Provider
            value={{
                rates,
                stats: data?.stats || initialStats,
                settings,
                tenant,
                defaultCurrency,
                isLoading,
                refresh,
                shopId
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

/**
 * Multi-Tenant adaptation hook:
 * Enables components to adapt based on tenant configuration, branch type and enabled modules.
 */
export function useTenant() {
    const { tenant } = useDashboardData();

    const isModuleEnabled = React.useCallback((moduleKey: string): boolean => {
        if (!tenant) return true;
        if (tenant.enabledModules && Array.isArray(tenant.enabledModules)) {
            return tenant.enabledModules.includes(moduleKey);
        }
        return true;
    }, [tenant]);

    const industry = tenant?.industry || "GENERAL";
    const isServiceBranch = industry === "TECHNICAL_SERVICE" || (tenant?.isServiceEnabled ?? true);
    const isRetailBranch = industry === "RETAIL" || industry === "PHONE_COMMUNICATION";

    return {
        tenant,
        industry,
        isServiceBranch,
        isRetailBranch,
        isCourierEnabled: tenant?.isCourierEnabled ?? true,
        isEInvoiceEnabled: tenant?.isEInvoiceEnabled ?? true,
        isFinanceEnabled: tenant?.isFinanceEnabled ?? true,
        isServiceEnabled: tenant?.isServiceEnabled ?? true,
        isStockEnabled: tenant?.isStockEnabled ?? true,
        isModuleEnabled,
    };
}
