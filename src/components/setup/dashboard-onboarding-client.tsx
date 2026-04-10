"use client";

import { useState } from "react";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { FirstTaskCheck } from "./first-task-check";

interface DashboardOnboardingClientProps {
    categories: any[];
    shop: any;
}

export function DashboardOnboardingClient({ categories, shop }: DashboardOnboardingClientProps) {
    const [autoOpen, setAutoOpen] = useState(false);

    return (
        <>
            <FirstTaskCheck onTrigger={() => setAutoOpen(true)} />
            {autoOpen && (
                <div className="hidden">
                    <CreateProductModal
                        categories={categories}
                        shop={shop}
                        autoOpen={true}
                    />
                </div>
            )}
        </>
    );
}
