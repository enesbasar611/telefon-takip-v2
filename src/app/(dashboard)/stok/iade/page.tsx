import { Suspense } from "react";
import { getReturnTickets } from "@/lib/actions/return-actions";
import { ReturnsClient } from "@/components/stock/returns-client";
import { Loader2 } from "lucide-react";

export const metadata = {
    title: "İade & Hasarlı Ürün Takibi | Başar AI",
    description: "Müşteri ve tedarikçi iadelerini, hasarlı ürünleri takip edin.",
};

export default async function ReturnsPage() {
    const initialTickets = await getReturnTickets();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">İade & Hasarlı Ürünler</h2>
            </div>
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <ReturnsClient initialData={initialTickets} />
            </Suspense>
        </div>
    );
}

