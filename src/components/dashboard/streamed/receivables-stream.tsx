"use client";

import React, { useEffect } from "react";
import { getDebts } from "@/lib/actions/debt-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { ReceivablesClient } from "../receivables-client";
import { serializePrisma } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export function ReceivablesStream({ cols = 8, rows = 4, shopId, onDataStatus }: { cols?: number, rows?: number, shopId?: string, onDataStatus?: (isEmpty: boolean) => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-receivables", shopId || ""],
        queryFn: async () => {
            const [debtsRaw, shop] = await Promise.all([
                getDebts(),
                getShop()
            ]);
            return {
                debts: serializePrisma(debtsRaw),
                shop
            };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!data?.debts || data.debts.length === 0);
        }
    }, [data, isLoading, onDataStatus]);

    if (isLoading) return <Card className="h-full border border-border/40 bg-card rounded-[2rem] animate-pulse" />;

    return <ReceivablesClient debts={data?.debts || []} shopName={data?.shop?.name} shopPhone={data?.shop?.phone} cols={cols} rows={rows} />;
}
