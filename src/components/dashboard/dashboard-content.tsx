"use client";

import { useAura } from "@/lib/context/aura-context";
import { motion } from "framer-motion";
import { BorderBeam } from "../ui/border-beam";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    const { aura } = useAura();
    const isNavigation = aura === "navigation";

    return (
        <motion.div
            animate={{
                scale: isNavigation ? 0.985 : 1,
                filter: isNavigation ? "blur(8px)" : "blur(0px)",
                opacity: isNavigation ? 0.7 : 1,
            }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col overflow-hidden h-full relative"
            style={{ transform: "translateZ(0)" }}
        >
            {isNavigation && <BorderBeam duration={4} size={300} borderWidth={1.5} className="z-[99]" />}
            {children}
        </motion.div>
    );
}



