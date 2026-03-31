import { StockListTable } from "../stock-list-table";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { semanticSearchWithAI } from "@/lib/actions/gemini-actions";
import { serializePrisma } from "@/lib/utils";

export async function StockTableStream({ searchParams }: { searchParams?: any }) {
    let aiFilters = {};
    if (searchParams?.ai_search) {
        const result = await semanticSearchWithAI(searchParams.ai_search);
        if (result.success) {
            aiFilters = result.filters;
        }
    }

    const [productsRaw, categoriesRaw] = await Promise.all([
        getProducts({
            pageSize: 100,
            search: searchParams?.q,
            ...aiFilters
        }),
        getCategories()
    ]);

    const products = serializePrisma(productsRaw);
    const categories = serializePrisma(categoriesRaw);

    return <StockListTable products={products} categories={categories} />;
}
