"use client";

import React, { useEffect } from "react";
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed";
import { getLiveActivity } from "@/lib/actions/live-actions";
import { serializePrisma } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export function LiveActivityStream({ onDataStatus }: { onDataStatus?: (isEmpty: boolean) => void }) {
    const { data: liveActivity = [], isLoading } = useQuery({
        queryKey: ["dashboard-live-activity"],
        queryFn: async () => {
            const dataRaw = await getLiveActivity();
            return serializePrisma(dataRaw);
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    React.useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!liveActivity || liveActivity.length === 0);
        }
    }, [liveActivity, isLoading, onDataStatus]);

    if (isLoading) return <Card className="h-full border border-border/40 bg-card rounded-[2rem] animate-pulse" />;

    return <LiveActivityFeed activity={liveActivity} />;
}
