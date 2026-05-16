import { getInventoryStats, getCriticalProducts, getAllInventoryMovements } from "@/lib/actions/product-actions";
import { StockMovementsClient } from "@/components/stok/stock-movements-client";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";

export const dynamic = 'force-dynamic';

export default async function StokHareketleriPage({ searchParams }: { searchParams: { page?: string, search?: string } }) {
    const page = Number(searchParams?.page) || 1;
    const search = searchParams?.search || "";

    const queryClient = new QueryClient();

    // Parallel prefetching for instant page load without blocking sequentially
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["inventory-stats"],
            queryFn: async () => await getInventoryStats(),
        }),
        queryClient.prefetchQuery({
            queryKey: ["critical-products"],
            queryFn: async () => await getCriticalProducts(),
        }),
        queryClient.prefetchQuery({
            queryKey: ["inventory-movements", page, search],
            queryFn: async () => await getAllInventoryMovements({ page, limit: 30, search }),
        })
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <StockMovementsClient
                initialPage={page}
                initialSearch={search}
            />
        </HydrationBoundary>
    );
}
