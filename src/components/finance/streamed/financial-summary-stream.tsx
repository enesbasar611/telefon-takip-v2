"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getDailySummary } from "@/lib/actions/finance-actions";
import { AccountList } from "../account-list";
import { FinanceDashboard } from "../finance-dashboard";
import { FinanceCharts } from "../finance-charts";
import { CashResetReport } from "../cash-reset-report";
import { Skeleton } from "@/components/ui/skeleton";

export function FinancialSummaryStream() {
    const { data: summary, isPending } = useQuery({
        queryKey: ["finance-summary"],
        queryFn: getDailySummary,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isPending && !summary) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-[2.5rem]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-[2.5rem]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-700">
            <AccountList accounts={summary?.accounts || []} />
            <FinanceDashboard summary={summary} />
            <CashResetReport />
        </div>
    );
}
