"use client";

import { useState } from "react";
import { ActionGuideModal } from "./action-guide-modal";
import { FirstTaskCheck } from "./first-task-check";

interface DashboardOnboardingClientProps {
    categories: any[];
    shop: any;
}

export function DashboardOnboardingClient({ categories, shop }: DashboardOnboardingClientProps) {
    const [actionModalOpen, setActionModalOpen] = useState(false);

    return (
        <>
            <FirstTaskCheck onTrigger={() => setActionModalOpen(true)} />
            <ActionGuideModal
                open={actionModalOpen}
                onOpenChange={setActionModalOpen}
                shopName={shop?.name || "Dükkan"}
            />
        </>
    );
}
