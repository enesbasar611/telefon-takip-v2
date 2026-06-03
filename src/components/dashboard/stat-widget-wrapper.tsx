"use client";

import { useState, useMemo } from "react";
import { StatCard } from "./stat-card";
import { StatDetailModal, StatType } from "./modals/stat-detail-modal";
import { useQuery } from "@tanstack/react-query";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";

interface StatWidgetWrapperProps {
    stat: any;
    type: StatType;
    shopId: string | null;
    defaultCurrency?: string;
}

export function StatWidgetWrapper({ stat, type, shopId, defaultCurrency }: StatWidgetWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { data: dashboardInit, isLoading, isError } = useQuery({
        queryKey: ["dashboard-init", shopId || ""],
        queryFn: () => getDashboardInit(shopId),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const statsData = useMemo(() => dashboardInit?.stats || {}, [dashboardInit]);

    // Dinamik değer hesaplamaları (Client-side hydration)
    // Eğer veri henüz yüklenmediyse veya hata varsa, server'dan gelen stat.value'yu koru (fallback "0" değil)
    let value = stat.value || "0";
    let subValue = stat.subValue;
    let usdValue = stat.usdValue;
    let outOfStockCount = stat.outOfStockCount;

    if (!isLoading && !isError && dashboardInit?.stats) {
        const s = dashboardInit.stats;
        switch (type) {
            case "DAILY_SALES":
                // Daily Sales card uses Kasa Balance as primary, Today Sales as sub
                value = s.kasaBalance || value;
                subValue = `Günün Satışı: ${s.todaySales || "₺0"}`;
                usdValue = s.kasaBalanceUSD;
                break;
            case "REPAIR_INCOME":
                value = s.todayRepairIncome || value;
                usdValue = s.todayRepairIncomeUSD;
                break;
            case "COLLECTIONS":
                value = s.collectedPayments || value;
                usdValue = s.collectedPaymentsUSD;
                break;
            case "PENDING_SERVICES":
                value = s.pendingServices || value;
                break;
            case "READY_DEVICES":
                value = s.readyDevices || value;
                break;
            case "CRITICAL_STOCK":
                value = s.criticalStock || value;
                outOfStockCount = s.outOfStockCount || outOfStockCount;
                break;
            case "TOTAL_DEBTS":
                value = s.totalDebts || value;
                usdValue = s.totalDebtsUSD;
                break;
            case "CASH_BALANCE":
                // Cash Balance card uses Today Sales (Volume) as primary
                value = s.todaySales || value;
                usdValue = s.todaySalesUSD;
                break;
        }
    }

    return (
        <>
            <StatCard
                {...stat}
                value={isLoading && !stat.value ? "Yükleniyor..." : value}
                subValue={subValue}
                usdValue={usdValue}
                outOfStockCount={outOfStockCount}
                defaultCurrency={defaultCurrency}
                isLoading={isLoading}
                onClick={() => setIsOpen(true)}
            />
            <StatDetailModal
                type={type}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                statsData={statsData}
            />
        </>
    );
}
