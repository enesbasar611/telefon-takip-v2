"use client";

import { useAura } from "@/lib/context/aura-context";
import { motion } from "framer-motion";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    const { aura } = useAura();
    const isNavigation = aura === "navigation";

    return (
        <motion.div
            animate={{
                scale: isNavigation ? 0.98 : 1,
                filter: isNavigation ? "blur(12px)" : "blur(0px)",
                opacity: isNavigation ? 0.6 : 1,
            }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col overflow-hidden h-full"
        >
            {children}
        </motion.div>
    );
}
