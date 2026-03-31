import { Package } from "lucide-react";
import { getAllCategories } from "@/lib/actions/category-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { CategoryManagementClient } from "@/components/product/category-management-client";

export const dynamic = 'force-dynamic';

export default async function KategorilerPage() {
    const categories = await getAllCategories();
    const products = await getProducts();

    return (
        <div className="flex flex-col gap-8 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <Package className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-extrabold text-white font-manrope">Kategori Yönetimi</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest">STOK VARYANT AĞACI</p>
                    </div>
                </div>
            </div>

            <CategoryManagementClient initialCategories={categories} products={products} />
        </div>
    );
}
