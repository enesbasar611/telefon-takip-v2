"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { TransactionHistory } from "../transaction-history";
import { getTransactions } from "@/lib/actions/finance-actions";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionListStream({ initialSearch = "", accountId }: { initialSearch?: string; accountId?: string }) {
    const [search, setSearch] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [search]);

    const { data: transactions, isPending } = useQuery({
        queryKey: ["finance-transactions", 1, debouncedSearch, accountId],
        queryFn: () => getTransactions({ page: 1, pageSize: 50, search: debouncedSearch, accountId }),
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

    return (
        <TransactionHistory
            transactions={transactions ?? []}
            search={search}
            onSearchChange={setSearch}
        />
    );
}
