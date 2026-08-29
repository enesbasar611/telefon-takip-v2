import { getSalesHistoryReport, getUnifiedHistory, type HistoryDateRange } from "@/lib/actions/activity-actions";
import { SalesHistoryClient } from "@/components/satis/sales-history-client";
import { endOfDay, startOfMonth } from "date-fns";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Satış Geçmişi | Başar Teknik",
  description: "Geçmiş satış kayıtları, faturalar ve işlem detayları.",
};

export const dynamic = 'force-dynamic';

export default async function SalesHistoryPage({
    searchParams
}: {
    searchParams: { page?: string, search?: string, type?: string, startDate?: string, endDate?: string }
}) {
    const page = Number(searchParams.page) || 1;
    const searchTerm = searchParams.search || "";
    const typeFilter = searchParams.type || "ALL";
    const now = new Date();
    const startDate = searchParams.startDate || startOfMonth(now).toISOString();
    const endDate = searchParams.endDate || endOfDay(now).toISOString();

    const [historyData, reportData] = await Promise.all([
        getUnifiedHistory({
            page,
            pageSize: 30,
            searchTerm,
            typeFilter,
            startDate,
            endDate
        }),
        getSalesHistoryReport({ startDate, endDate })
    ]);

    return (
        <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 pt-6">
            <SalesHistoryClient
                initialData={historyData}
                reportData={reportData}
                currentPage={page}
                searchTerm={searchTerm}
                typeFilter={typeFilter}
                startDate={startDate}
                endDate={endDate}
            />
        </div>
    );
}



