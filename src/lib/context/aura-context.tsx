"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
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
    const pathname = usePathname();
    const router = useRouter();

    const triggerAura = useCallback((type: AuraType) => {
        setAura(type);
        // Only non-navigation types reset via timeout if needed, 
        // but for this flow we focus on navigation which resets via pathname change
        if (type !== "navigation" && type !== "idle") {
            setTimeout(() => setAura("idle"), 2000);
        }
    }, []);

    const MapsWithAura = useCallback((href: string) => {
        // Immediate visual feedback
        setAura("navigation");
        // Start Next.js navigation
        router.push(href);
    }, [router]);

    // Reset aura to idle ONLY when pathname changes (meaning navigation completed)
    useEffect(() => {
        setAura("idle");
    }, [pathname]);

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
