import { StockListTable } from "../stock-list-table";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
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

    const [data, categoriesRaw] = await Promise.all([
        getProducts({
            page: currentPage,
            pageSize: pageSize,
            search: searchParams?.q,
            ...aiFilters
        }),
        getCategories()
    ]);

    const products = data.products;
    const totalCount = data.totalCount;
    const categories = serializePrisma(categoriesRaw);

    return (
        <StockListTable
            products={products}
            categories={categories}
            shop={shop}
            totalCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
        />
    );
}



