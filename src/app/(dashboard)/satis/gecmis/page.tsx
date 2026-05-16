import { getUnifiedHistory } from "@/lib/actions/activity-actions";
import { SalesHistoryClient } from "@/components/satis/sales-history-client";
import { History } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

export default async function SalesHistoryPage({
    searchParams
}: {
    searchParams: { page?: string, search?: string, type?: string }
}) {
    const page = Number(searchParams.page) || 1;
    const searchTerm = searchParams.search || "";
    const typeFilter = searchParams.type || "ALL";

    const historyData = await getUnifiedHistory({
        page,
        pageSize: 30,
        searchTerm,
        typeFilter
    });

    return (
        <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 pt-6">
            <SalesHistoryClient
                initialData={historyData}
                currentPage={page}
                searchTerm={searchTerm}
                typeFilter={typeFilter}
            />
        </div>
    );
}



