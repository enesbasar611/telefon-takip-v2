"use client";

import { useState, useEffect } from "react";
import { OnboardingWizard } from "./onboarding-wizard";

interface SetupCheckProps {
    isFirstLogin: boolean;
    shopName: string;
}

export function SetupCheck({ isFirstLogin, shopName }: SetupCheckProps) {
    const [showSetup, setShowSetup] = useState(false);

    useEffect(() => {
        if (isFirstLogin) {
            // Delay slightly for premium entrance effect
            const timer = setTimeout(() => {
                setShowSetup(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isFirstLogin]);

    return (
        <OnboardingWizard
            isOpen={showSetup}
            onClose={() => setShowSetup(false)}
            shopName={shopName}
        />
    );
}
