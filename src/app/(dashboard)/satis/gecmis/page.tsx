import { getSales } from "@/lib/actions/sale-actions";
import { SalesHistoryClient } from "@/components/satis/sales-history-client";

export const dynamic = 'force-dynamic';

export default async function SalesHistoryPage() {
    const sales = await getSales();

    return (
        <div className="flex flex-col gap-6 pb-12 bg-background text-foreground min-h-screen lg:p-10 p-6">
            <SalesHistoryClient initialSales={sales} />
        </div>
    );
}



