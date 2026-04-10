import { getInventoryStats, getCriticalProducts, getAllInventoryMovements } from "@/lib/actions/product-actions";
import { StockMovementsClient } from "@/components/stok/stock-movements-client";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getShop } from "@/lib/actions/setting-actions";

export const dynamic = 'force-dynamic';

export default async function StokHareketleriPage({ searchParams }: { searchParams: { page?: string, search?: string } }) {
    const page = Number(searchParams?.page) || 1;
    const search = searchParams?.search || "";
    const shop = await getShop();

    const [stats, criticalProducts, movementData] = await Promise.all([
        getInventoryStats(),
        getCriticalProducts(),
        getAllInventoryMovements({ page, limit: 50, search }),
    ]);

    const allMovements = movementData.success ? movementData.data : [];
    const totalMovements = movementData.success ? movementData.total : 0;
    const totalPages = movementData.success ? movementData.totalPages : 1;

    return (
        <div className="flex flex-col gap-10 pb-32">
            <PageHeader
                title="Hareket Analizi"
                description="Envanterdeki tüm değişimleri izleyin, kritik seviyeleri kontrol edin ve ikmal listesini yönetin."
                icon={BarChart3}
                badge={
                    <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] text-blue-500 uppercase tracking-widest leading-none font-bold">Canlı Stok Takibi</span>
                    </div>
                }
            />

            <StockMovementsClient
                movements={allMovements}
                criticalProducts={criticalProducts}
                stats={{
                    totalMovements: totalMovements,
                    criticalCount: stats.criticalCount
                }}
                pagination={{
                    page,
                    totalPages,
                    search
                }}
            />
        </div>
    );
}




