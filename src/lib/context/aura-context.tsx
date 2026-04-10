"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export type AuraType = "idle" | "focus" | "analyzing" | "success" | "error" | "navigation";

interface AuraContextType {
    aura: AuraType;
    triggerAura: (type: AuraType) => void;
    MapsWithAura: (href: string) => void;
}

const AuraContext = createContext<AuraContextType | null>(null);

export function AuraProvider({ children }: { children: React.ReactNode }) {
    const [aura, setAura] = useState<AuraType>("idle");
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const router = useRouter();

    const triggerAura = useCallback((type: AuraType) => {
        setAura(type);
        if (type !== "navigation" && type !== "idle") {
            setTimeout(() => setAura("idle"), 2000);
        }
    }, []);

    const MapsWithAura = useCallback((href: string) => {
        setAura("navigation");
        startTransition(() => {
            router.push(href);
        });
    }, [router]);

    // Reset aura to idle when pathname changes OR when transition completes
    useEffect(() => {
        if (!isPending) {
            setAura("idle");
        }
    }, [pathname, isPending]);

    return (
        <AuraContext.Provider value={{ aura, triggerAura, MapsWithAura }}>
            {children}
        </AuraContext.Provider>
    );
}

export function useAura() {
    const context = useContext(AuraContext);
    if (!context) throw new Error("useAura must be used within an AuraProvider");
    return context;
}



