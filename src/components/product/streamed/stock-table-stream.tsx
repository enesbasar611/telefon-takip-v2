import { StockListTable } from "../stock-list-table";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { serializePrisma } from "@/lib/utils";

export async function StockTableStream() {
    const [productsRaw, categoriesRaw] = await Promise.all([
        getProducts({ pageSize: 50 }),
        getCategories()
    ]);

    const products = serializePrisma(productsRaw);
    const categories = serializePrisma(categoriesRaw);

    return <StockListTable products={products} categories={categories} />;
}
