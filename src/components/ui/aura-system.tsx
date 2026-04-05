"use client";

import { useAura } from "@/lib/context/aura-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BorderBeam } from "./border-beam";

export function AuraSystem() {
    const { aura } = useAura();
    const isNavigation = aura === "navigation";

    return (
        <AnimatePresence>
            {isNavigation && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="fixed inset-0 z-[9999] bg-black/30 pointer-events-none will-change-[backdrop-filter,opacity]"
                    style={{ transform: "translateZ(0)" }}
                >
                    <BorderBeam
                        duration={6}
                        size={500}
                        borderWidth={2}
                        opacity={0.8}
                        className="opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 opacity-60" />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.05, duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="relative">
                            <div className="w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-primary/40 animate-ping" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}



