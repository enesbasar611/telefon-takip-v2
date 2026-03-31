import { getInventoryStats, getCriticalProducts, getAllInventoryMovements } from "@/lib/actions/product-actions";
import { StockMovementsClient } from "@/components/stok/stock-movements-client";
import { BarChart3 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function StokHareketleriPage() {
    const [stats, criticalProducts, allMovements] = await Promise.all([
        getInventoryStats(),
        getCriticalProducts(),
        getAllInventoryMovements(),
    ]);

    return (
        <div className="flex flex-col gap-10 bg-black text-white min-h-screen lg:p-16 p-8 pb-32">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] mt-1">
                        <BarChart3 className="h-10 w-10 text-blue-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Canlı Stok Takibi</span>
                            </div>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter shadow-sm">Hareket Analizi</h1>
                        <p className="text-base text-slate-500 font-medium mt-3 max-w-xl">Envanterdeki tüm değişimleri izleyin, kritik seviyeleri kontrol edin ve ikmal listesini yönetin.</p>
                    </div>
                </div>
            </div>

            <StockMovementsClient
                movements={allMovements}
                criticalProducts={criticalProducts}
                stats={{
                    totalMovements: allMovements.length,
                    criticalCount: stats.criticalCount
                }}
            />
        </div>
    );
}
