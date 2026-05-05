"use client";

import { useState } from "react";
import { StatCard } from "./stat-card";
import { StatDetailModal, StatType } from "./modals/stat-detail-modal";

interface StatWidgetWrapperProps {
    stat: any;
    type: StatType;
    statsData: any;
}

export function StatWidgetWrapper({ stat, type, statsData }: StatWidgetWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <StatCard
                {...stat}
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
