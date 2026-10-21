import { Metadata } from "next";
import { StockAIClient } from "./stok-ai-client";
import {
    getMonthEndForecastMetrics,
    getLatestAIReport,
    getAIReportHistory
} from "@/lib/actions/ai-forecast-actions";
import { getAIAlerts } from "@/lib/actions/stock-ai-actions";

export const metadata: Metadata = {
    title: "J.A.R.V.I.S. Komuta Merkezi & Ciro Projeksiyonu | Başar Teknik",
    description: "Yapay zeka destekli ay sonu net ciro tahmini, finansal sağlık analizi ve envanter komuta merkezi.",
};

export const dynamic = 'force-dynamic';

export default async function StockAIPage() {
    const [metrics, latestReport, history, alerts] = await Promise.all([
        getMonthEndForecastMetrics().catch(() => null),
        getLatestAIReport().catch(() => null),
        getAIReportHistory(20).catch(() => []),
        getAIAlerts().catch(() => [])
    ]);

    return (
        <StockAIClient
            initialMetrics={metrics}
            initialLatestReport={latestReport}
            initialHistory={history}
            initialAlerts={alerts}
        />
    );
}

