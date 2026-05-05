"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { updateDashboardLayout } from "@/lib/actions/staff-actions";
import { toast } from "sonner";

interface DashboardContextType {
    isEditMode: boolean;
    setIsEditMode: (val: boolean) => void;
    saveLayout: (layout: any, silent?: boolean) => Promise<void>;
    isPending: boolean;
    hasChanges: boolean;
    setHasChanges: (val: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const router = useRouter();

    const saveLayout = async (layout: any, silent = false) => {
        setIsPending(true);
        try {
            console.log("DASHBOARD_PROVIDER: Triggering updateDashboardLayout...");
            const result = await updateDashboardLayout(layout);
            if (result.success) {
                router.refresh();
                if (!silent) toast.success("Düzen başarıyla kaydedildi ve senkronize edildi.");
                setHasChanges(false);
            } else {
                toast.error("Düzen kaydedilemedi.");
            }
        } catch (error) {
            console.error("Save layout error:", error);
            toast.error("Sistem hatası. Düzen kaydedilemedi.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <DashboardContext.Provider value={{ isEditMode, setIsEditMode, saveLayout, isPending, hasChanges, setHasChanges }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) throw new Error("useDashboard must be used within DashboardProvider");
    return context;
}
