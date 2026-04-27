import { CategorySummaryCards } from "../category-summary-cards";
import { getProductsForCategorySummary, getCategories } from "@/lib/actions/product-actions";
import { serializePrisma } from "@/lib/utils";

export async function CategorySummaryStream() {
    const [productsRaw, categoriesRaw] = await Promise.all([
        getProductsForCategorySummary(),
        getCategories()
    ]);

    const products = serializePrisma(productsRaw);
    const categories = serializePrisma(categoriesRaw);

    return <CategorySummaryCards products={products} categories={categories} />;
}



