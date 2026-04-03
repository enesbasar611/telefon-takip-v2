"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type AuraType = "idle" | "focus" | "analyzing" | "success" | "error" | "navigation";

interface AuraContextType {
    aura: AuraType;
    triggerAura: (type: AuraType, coords?: { x: number; y: number }) => void;
    auraCoords: { x: number; y: number } | null;
}

const AuraContext = createContext<AuraContextType | null>(null);

export function AuraProvider({ children }: { children: React.ReactNode }) {
    const [aura, setAura] = useState<AuraType>("idle");
    const [auraCoords, setAuraCoords] = useState<{ x: number; y: number } | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const triggerAura = useCallback((type: AuraType, coords?: { x: number; y: number }) => {
        // Clear any pending resets
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setAura(type);
        if (coords) setAuraCoords(coords);

        // Dynamic reset logic
        if (type === "success" || type === "error" || type === "navigation" || type === "analyzing") {
            timeoutRef.current = setTimeout(() => {
                setAura("idle");
                setAuraCoords(null);
            }, type === "navigation" ? 1500 : 2000);
        }
    }, []);

    // Navigation Tracker - Çevrim içi geçişleri yakalama
    useEffect(() => {
        // Hedefe ulaşıldığında hemen kapat (veya temizle)
        triggerAura("idle");
    }, [pathname, searchParams, triggerAura]);

    // Anlık Tıklama Yakalayıcı (Linklere tıklanır tıklanmaz blur için)
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = (e.target as Element).closest('a[href]');
            if (target) {
                const href = target.getAttribute('href');
                const targetAttr = target.getAttribute('target');

                // Aynı sayfaya tıklamadığımızı kontrol edelim
                const isInternal = href && href.startsWith('/') && targetAttr !== '_blank';
                // URL farklıysa veya query string değişiyorsa hemen tetikle
                if (isInternal) {
                    const currentUrl = pathname + searchParams.toString();
                    if (href !== currentUrl && href !== pathname) {
                        triggerAura("navigation");
                    }
                }
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [pathname, searchParams, triggerAura]);

    return (
        <AuraContext.Provider value={{ aura, triggerAura, auraCoords }}>
            {children}
        </AuraContext.Provider>
    );
}

export function useAura() {
    const context = useContext(AuraContext);
    if (!context) throw new Error("useAura must be used within an AuraProvider");
    return context;
}
