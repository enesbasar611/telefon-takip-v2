import { Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StockOrdersClient } from "@/components/stock/stock-orders-client";
import { getPurchaseOrders, getSuppliers } from "@/lib/actions/supplier-actions";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tedarikçi Siparişleri | Başar Teknik",
    description: "Tedarikçi siparişleri, satın alma geçmişi, mal kabul ve eksik stok takibi.",
};

export const dynamic = "force-dynamic";

export default async function SupplierOrdersPage() {
    const [orders, suppliers] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers()
    ]);

    return (
        <div className="flex flex-col gap-8 pb-20">
            <PageHeader
                title="Tedarikçi Siparişleri & Satın Alma"
                description="Tedarikçilere verilen tüm siparişler, mal kabul (teslim alma) işlemleri ve eksik stok listeleri."
                icon={Truck}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
            />

            <StockOrdersClient
                initialOrders={orders}
                initialSuppliers={suppliers}
            />
        </div>
    );
}
