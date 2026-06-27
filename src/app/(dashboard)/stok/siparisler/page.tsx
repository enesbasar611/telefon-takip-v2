import { ShoppingBasket } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SupplierOrderListsPanel } from "@/components/supplier/supplier-order-lists-panel";

export default function SupplierOrdersPage() {
    return (
        <div className="flex flex-col gap-8 pb-20">
            <PageHeader
                title="Tedarikçi Sipariş Listeleri"
                description="Eksik ürünlerden oluşturulan, kuryeye atanmaya veya tedarikçiye gönderilmeye hazır listeler."
                icon={ShoppingBasket}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
            />

            <div className="max-w-4xl mx-auto w-full">
                <SupplierOrderListsPanel isInline={true} />
            </div>
        </div>
    );
}
