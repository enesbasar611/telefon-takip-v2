"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { updateDashboardLayout } from "@/lib/actions/staff-actions";
import { toast } from "sonner";

interface DashboardContextType {
    isEditMode: boolean;
    setIsEditMode: (val: boolean) => void;
    isStudioOpen: boolean;
    setIsStudioOpen: (val: boolean) => void;
    saveLayout: (layout: any, silent?: boolean) => Promise<boolean>;
    isPending: boolean;
    hasChanges: boolean;
    setHasChanges: (val: boolean) => void;
    saveVersion: number;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveVersion, setSaveVersion] = useState(0);
    const router = useRouter();

    const saveLayout = useCallback(async (layout: any, silent = false): Promise<boolean> => {
        setIsPending(true);
        try {
            const result = await updateDashboardLayout(layout);
            if (result.success) {
                setHasChanges(false);
                setSaveVersion((v) => v + 1);
                if (!silent) toast.success("Panel düzeni kaydedildi ve senkronize edildi.");
                router.refresh();
                return true;
            }
            toast.error("Düzen kaydedilemedi.");
            return false;
        } catch (error) {
            console.error("Save layout error:", error);
            toast.error("Sistem hatası. Düzen kaydedilemedi.");
            return false;
        } finally {
            setIsPending(false);
        }
    }, [router]);

    return (
        <DashboardContext.Provider
            value={{
                isEditMode,
                setIsEditMode,
                isStudioOpen,
                setIsStudioOpen,
                saveLayout,
                isPending,
                hasChanges,
                setHasChanges,
                saveVersion,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) throw new Error("useDashboard must be used within DashboardProvider");
    return context;
}
