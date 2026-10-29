import { StockListTable } from "../stock-list-table";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { semanticSearchWithAI } from "@/lib/actions/gemini-actions";
import { serializePrisma } from "@/lib/utils";

export async function StockTableStream({ searchParams, shop }: { searchParams?: any, shop?: any }) {
    const sp = await searchParams;
    let aiFilters: any = {};
    if (sp?.ai_search) {
        const result = await semanticSearchWithAI(sp.ai_search);
        if (result.success) {
            aiFilters = result.filters;
        }
    }

    const currentPage = Number(sp?.page) || 1;
    const pageSize = 50;

    const [data, categoriesRaw, suppliersRaw] = await Promise.all([
        getProducts({
            id: sp?.highlight,
            page: currentPage,
            pageSize: pageSize,
            search: sp?.q || aiFilters?.name,
            isCritical: sp?.isCritical === "true" || aiFilters?.isCritical === true,
            outOfStock: sp?.outOfStock === "true" || aiFilters?.maxStock === 0,
            ...aiFilters
        }),
        getCategories(),
        getSuppliers()
    ]);

    const products = data.products;
    const totalCount = data.totalCount;
    const categories = serializePrisma(categoriesRaw);
    const suppliers = serializePrisma(suppliersRaw);

    return (
        <StockListTable
            products={products}
            categories={categories}
            suppliers={suppliers}
            shop={shop}
            totalCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
            aiSearchQuery={sp?.ai_search}
        />
    );
}
