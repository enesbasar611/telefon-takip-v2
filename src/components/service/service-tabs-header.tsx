"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryLabel } from "@/lib/industry-utils";
import { PageHeader } from "@/components/ui/page-header";
import { TechnicalServiceAnalysisModal } from "@/components/service/technical-service-analysis-modal";
import { Zap, Sparkles } from "lucide-react";

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
    const assetLabel = getIndustryLabel(shop, "customerAsset");

    return (
        <PageHeader
            title={`${serviceLabel} Merkezi`}
            description={`Dükkandaki tüm ${serviceLabel.toLowerCase()} süreçlerini, iadeleri ve teslimatları tek bir ekrandan yönetin.`}
            icon={Zap}
            badge={
                <div className="flex items-center gap-3">
                    <TechnicalServiceAnalysisModal />
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px]  text-emerald-500 uppercase tracking-wider">{activeCount} Aktif İşlem</span>
                    </div>

                    <button className="flex items-center gap-2 bg-[#111111] hover:bg-[#18181A] px-3 py-1 rounded-full border border-[#333333] transition-colors group">
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-[10px]  text-white uppercase tracking-wider">BAŞAR AI İLE {assetLabel.toLocaleUpperCase('tr-TR')} GİRİŞİ</span>
                    </button>
                </div>
            }
        />
    );
}
