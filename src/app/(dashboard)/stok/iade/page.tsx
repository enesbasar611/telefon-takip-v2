import { PageHeader } from "@/components/ui/page-header";
import { Suspense } from "react";
import { getReturnTickets } from "@/lib/actions/return-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { ReturnsClient } from "@/components/stock/returns-client";
import { Loader2, PackageX } from "lucide-react";

export const metadata = {
    title: "İade & Hasarlı Ürün Takibi | Başar AI",
    description: "Müşteri ve tedarikçi iadelerini, hasarlı ürünleri takip edin.",
};

export default async function ReturnsPage() {
    const [initialTickets, suppliers] = await Promise.all([
        getReturnTickets(),
        getSuppliers()
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="İade & Hasarlı Ürünler"
                description="Müşteri ve tedarikçi iadelerini, hasarlı ürünleri takip edin."
                icon={PackageX}
                iconColor="text-red-500"
                iconBgColor="bg-red-500/10"
            />
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <ReturnsClient initialData={initialTickets} suppliers={suppliers} />
            </Suspense>
        </div>
    );
}

