import { getSales } from "@/lib/actions/sale-actions";
import { SalesHistoryClient } from "@/components/satis/sales-history-client";
import { History } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

export default async function SalesHistoryPage() {
    const sales = await getSales();

    return (
        <div className="flex flex-col gap-10 pb-12 animate-in fade-in duration-500">
            <PageHeader
                title="Satış Geçmişi"
                description="Mağazada gerçekleşen tüm işlemleri ve geçmiş satış verilerini inceleyin."
                icon={History}
            />
            <SalesHistoryClient initialSales={sales} />
        </div>
    );
}



