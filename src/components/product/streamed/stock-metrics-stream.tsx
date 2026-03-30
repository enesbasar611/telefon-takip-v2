import { StockDashboardMetrics } from "../stock-dashboard-metrics";
import { getInventoryStats } from "@/lib/actions/product-actions";
import { serializePrisma } from "@/lib/utils";

export async function StockMetricsStream() {
    const statsRaw = await getInventoryStats();
    const stats = serializePrisma(statsRaw);

    return <StockDashboardMetrics stats={stats} />;
}
