import { getSuppliers, getPurchaseOrders, getCriticalAndOutOfStockProducts } from "@/lib/actions/supplier-actions";
import { getAIAlerts } from "@/lib/actions/stock-ai-actions";
import { TedarikcilerPageClient } from "@/components/supplier/tedarikciler-page-client";
import { getShop } from "@/lib/actions/setting-actions";

export const dynamic = 'force-dynamic';

export default async function TedarikcilerPage() {
  const [suppliers, purchaseOrders, aiAlerts, criticalProducts, shop] = await Promise.all([
    getSuppliers(),
    getPurchaseOrders(),
    getAIAlerts(),
    getCriticalAndOutOfStockProducts(),
    getShop(),
  ]);

  return (
    <TedarikcilerPageClient
      suppliers={suppliers}
      purchaseOrders={purchaseOrders}
      aiAlerts={aiAlerts as any[]}
      criticalProducts={criticalProducts as any[]}
      shop={shop}
    />
  );
}
