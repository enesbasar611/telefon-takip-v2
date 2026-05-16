"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { DailySessionControl } from "../daily-session-control";
import { getDailySession } from "@/lib/actions/finance-actions";
import { Skeleton } from "@/components/ui/skeleton";

export function DailySessionStream() {
    const { data: session, isPending } = useQuery({
        queryKey: ["daily-session"],
        queryFn: getDailySession,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isPending && !session) {
        return <Skeleton className="h-10 w-48 rounded-full" />;
    }

    return <DailySessionControl session={session} />;
}
