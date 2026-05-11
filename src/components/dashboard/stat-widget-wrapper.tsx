"use client";

import { useState } from "react";
import { StatCard } from "./stat-card";
import { StatDetailModal, StatType } from "./modals/stat-detail-modal";

interface StatWidgetWrapperProps {
    stat: any;
    type: StatType;
    statsData: any;
    defaultCurrency?: string;
}

export function StatWidgetWrapper({ stat, type, statsData, defaultCurrency }: StatWidgetWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <StatCard
                {...stat}
                defaultCurrency={defaultCurrency}
                onClick={() => setIsOpen(true)}
            />
            <StatDetailModal
                type={type}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                statsData={statsData}
            />
        </>
    );
}
