"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { TransactionHistory } from "../transaction-history";
import { getTransactions } from "@/lib/actions/finance-actions";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionListStream() {
    const { data: transactions, isPending } = useQuery({
        queryKey: ["finance-transactions", 1, ""], // page 1, no search
        queryFn: () => getTransactions({ page: 1, pageSize: 50 }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isPending && !transactions) {
        return (
            <div className="space-y-4 bg-card p-8 rounded-[2rem]">
                <Skeleton className="h-8 w-48 mb-6" />
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return <TransactionHistory transactions={transactions} />;
}
