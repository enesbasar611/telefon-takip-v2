"use client";

import { useAura } from "@/lib/context/aura-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AuraSystem() {
    const { aura } = useAura();
    const isNavigation = aura === "navigation";

    return (
        <AnimatePresence>
            {isNavigation && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="fixed inset-0 z-[9999] bg-black/40 pointer-events-none"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="w-64 h-64 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}