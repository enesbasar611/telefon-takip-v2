"use client";

import { useState, useEffect } from "react";

interface FirstTaskCheckProps {
    onTrigger: () => void;
}

export function FirstTaskCheck({ onTrigger }: FirstTaskCheckProps) {
    useEffect(() => {
        const justFinished = sessionStorage.getItem("just_finished_onboarding");
        if (justFinished === "true") {
            // Remove it so it doesn't trigger on every refresh
            sessionStorage.removeItem("just_finished_onboarding");

            // Delay slightly to let the dashboard render
            const timer = setTimeout(() => {
                onTrigger();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [onTrigger]);

    return null;
}
