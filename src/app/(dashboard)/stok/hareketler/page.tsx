import { getInventoryStats, getCriticalProducts, getAllInventoryMovements } from "@/lib/actions/product-actions";
import { StockMovementsClient } from "@/components/stok/stock-movements-client";

export const dynamic = 'force-dynamic';

export default async function StokHareketleriPage({ searchParams }: { searchParams: { page?: string, search?: string } }) {
    const page = Number(searchParams?.page) || 1;
    const search = searchParams?.search || "";

    const [stats, criticalProducts, movementData] = await Promise.all([
        getInventoryStats(),
        getCriticalProducts(),
        getAllInventoryMovements({ page, limit: 30, search }),
    ]);

    const allMovements = movementData.success ? movementData.data : [];
    const totalMovements = movementData.success ? movementData.total : 0;
    const totalPages = movementData.success ? movementData.totalPages : 1;

    return (
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
    );
}
