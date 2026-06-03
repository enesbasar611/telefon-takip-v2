"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryLabel } from "@/lib/industry-utils";
import { PageHeader } from "@/components/ui/page-header";
import { TechnicalServiceAnalysisModal } from "@/components/service/technical-service-analysis-modal";
import { Zap } from "lucide-react";

export function ServiceTabsHeader() {
    const { data: tickets = [] } = useQuery({
        queryKey: ["service-tickets"],
        queryFn: () => getServiceTickets(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: shop } = useQuery({
        queryKey: ["shop"],
        queryFn: () => getShop(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const activeCount = tickets.filter((t: any) => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)).length;
    const serviceLabel = getIndustryLabel(shop, "serviceTicket");

    return (
        <PageHeader
            title={`${serviceLabel} Merkezi`}
            description={`Dükkandaki tüm ${serviceLabel.toLowerCase()} süreçlerini, iadeleri ve teslimatları tek bir ekrandan yönetin.`}
            icon={Zap}
            badge={
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 bg-emerald-500/[0.08] px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all hover:bg-emerald-500/[0.12] group">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400/90 uppercase tracking-[0.1em]">{activeCount} AKTİF İŞLEM</span>
                    </div>

                    <TechnicalServiceAnalysisModal />
                </div>
            }
        />
    );
}
