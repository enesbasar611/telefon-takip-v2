import { StockListTable } from "../stock-list-table";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { semanticSearchWithAI } from "@/lib/actions/gemini-actions";
import { serializePrisma } from "@/lib/utils";

export async function StockTableStream({ searchParams, shop }: { searchParams?: any, shop?: any }) {
    let aiFilters = {};
    if (searchParams?.ai_search) {
        const result = await semanticSearchWithAI(searchParams.ai_search);
        if (result.success) {
            aiFilters = result.filters;
        }
    }

    const currentPage = Number(searchParams?.page) || 1;
    const pageSize = 50;

    const [data, categoriesRaw, suppliersRaw] = await Promise.all([
        getProducts({
            id: searchParams?.highlight,
            page: currentPage,
            pageSize: pageSize,
            search: searchParams?.q,
            isCritical: searchParams?.isCritical === "true",
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
        />
    );
}



