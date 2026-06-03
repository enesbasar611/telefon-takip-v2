export interface Category {
    id: string;
    name: string;
    parentId: string | null;
    order: number;
}

export interface Product {
    id: string;
    name: string;
    categoryId: string;
    stock: number;
    buyPrice: number;
    buyPriceUsd?: number | null;
    sellPrice: number;
    sellPriceUsd?: number | null;
    attributes?: Record<string, any> | null;
}

export interface CategoryNode extends Category {
    children: CategoryNode[];
}

export type PriceCurrency = "TRY" | "USD" | "EUR";
