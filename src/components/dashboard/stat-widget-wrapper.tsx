"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { StatCard } from "./stat-card";
import { StatDetailModal, StatType } from "./modals/stat-detail-modal";
import { useQuery } from "@tanstack/react-query";
import { getDashboardInit } from "@/lib/actions/dashboard-actions";

const CreateProductModal = dynamic(() => import("@/components/product/create-product-modal").then(m => m.CreateProductModal), { ssr: false });
const CreateServiceModal = dynamic(() => import("@/components/service/create-service-modal").then(m => m.CreateServiceModal), { ssr: false });
const CreateTransactionModal = dynamic(() => import("@/components/finance/create-transaction-modal").then(m => m.CreateTransactionModal), { ssr: false });
const AddDebtModal = dynamic(() => import("@/components/finance/add-debt-modal").then(m => m.AddDebtModal), { ssr: false });
const CashBalanceDetailModal = dynamic(() => import("./modals/cash-balance-detail-modal").then(m => m.CashBalanceDetailModal), { ssr: false });
const VeresiyeDetailModal = dynamic(() => import("./modals/veresiye-detail-modal").then(m => m.VeresiyeDetailModal), { ssr: false });

type QuickAction =
    | { kind: "modal"; modal: "PRODUCT" | "SERVICE" | "TX" | "INCOME" | "DEBT"; label: string }
    | { kind: "route"; href: string; label: string };

/** Primary (tap) action per card. Long-press / right-click opens the detail view. */
const QUICK_ACTIONS: Record<StatType, QuickAction> = {
    DAILY_SALES: { kind: "modal", modal: "TX", label: "Kasa Hareketi" },
    CASH_BALANCE: { kind: "route", href: "/satis", label: "Yeni Satış" },
    REPAIR_INCOME: { kind: "modal", modal: "SERVICE", label: "Yeni Servis" },
    PENDING_SERVICES: { kind: "route", href: "/servis", label: "Kuyruğa Git" },
    COLLECTIONS: { kind: "modal", modal: "INCOME", label: "Tahsilat Al" },
    READY_DEVICES: { kind: "route", href: "/servis", label: "Teslim Et" },
    CRITICAL_STOCK: { kind: "modal", modal: "PRODUCT", label: "Ürün Ekle" },
    TOTAL_DEBTS: { kind: "modal", modal: "DEBT", label: "Alacak Ekle" },
} as Record<StatType, QuickAction>;

interface StatWidgetWrapperProps {
    stat: any;
    type: StatType;
    shopId: string | null;
    defaultCurrency?: string;
    shop?: any;
    categories?: any[];
    suppliers?: any[];
    rates?: any;
}

export function StatWidgetWrapper({ stat, type, shopId, defaultCurrency, shop, categories = [], suppliers = [], rates }: StatWidgetWrapperProps) {
    const router = useRouter();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const action = QUICK_ACTIONS[type];

    const { data: dashboardInit, isLoading, isError } = useQuery({
        queryKey: ["dashboard-init", shopId || "all"],
        queryFn: () => getDashboardInit(shopId || undefined),
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

    const [isCashDetailOpen, setIsCashDetailOpen] = useState(false);
    const [isVeresiyeDetailOpen, setIsVeresiyeDetailOpen] = useState(false);

    const runAction = useCallback(() => {
        if (type === "DAILY_SALES") {
            setIsCashDetailOpen(true);
            return;
        }
        if (type === "TOTAL_DEBTS") {
            setActiveModal("DEBT");
            return;
        }
        if (!action) return setIsDetailOpen(true);
        if (action.kind === "route") router.push(action.href);
        else setActiveModal(action.modal);
    }, [action, router, type]);

    const openDetail = useCallback(() => {
        if (type === "DAILY_SALES") {
            setIsCashDetailOpen(true);
            return;
        }
        if (type === "TOTAL_DEBTS") {
            setIsVeresiyeDetailOpen(true);
            return;
        }
        setIsDetailOpen(true);
    }, [type]);

    const closeModal = (v: boolean) => { if (!v) setActiveModal(null); };

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
                actionLabel={type === "DAILY_SALES" ? "Kasa Detayı" : action?.label}
                onAction={runAction}
                onDetail={openDetail}
            />
            {type === "DAILY_SALES" ? (
                <CashBalanceDetailModal
                    isOpen={isCashDetailOpen || isDetailOpen}
                    onClose={() => {
                        setIsCashDetailOpen(false);
                        setIsDetailOpen(false);
                    }}
                />
            ) : type === "TOTAL_DEBTS" ? (
                <VeresiyeDetailModal
                    isOpen={isVeresiyeDetailOpen || isDetailOpen}
                    onClose={() => {
                        setIsVeresiyeDetailOpen(false);
                        setIsDetailOpen(false);
                    }}
                    rates={rates}
                    defaultCurrency={defaultCurrency}
                />
            ) : (
                <StatDetailModal
                    type={type}
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    statsData={statsData}
                />
            )}

            {activeModal === "PRODUCT" && (
                <CreateProductModal open onOpenChange={closeModal} categories={categories} suppliers={suppliers} shop={shop} />
            )}
            {activeModal === "SERVICE" && <CreateServiceModal open onOpenChange={closeModal} shop={shop} />}
            {(activeModal === "TX" || activeModal === "INCOME") && (
                <CreateTransactionModal open onOpenChange={closeModal} initialType={activeModal === "INCOME" ? "INCOME" : undefined} />
            )}
            {activeModal === "DEBT" && <AddDebtModal open onOpenChange={closeModal} rates={rates} />}
        </>
    );
}
