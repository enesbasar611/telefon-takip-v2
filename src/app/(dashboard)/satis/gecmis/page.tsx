import { getSales } from "@/lib/actions/sale-actions";
import { SalesHistoryClient } from "@/components/satis/sales-history-client";
import { History } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

export default async function SalesHistoryPage() {
    const sales = await getSales();

    return (
        <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 pt-6">
            <SalesHistoryClient initialSales={sales} />
        </div>
    );
}



