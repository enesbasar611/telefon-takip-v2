"use client";

import { useAura } from "@/lib/context/aura-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BorderBeam } from "./border-beam";

export function AuraSystem() {
    const { aura, auraCoords } = useAura();

    const isActive = aura !== "idle" && aura !== "success" && aura !== "error";
    const isSuccess = aura === "success";
    const isError = aura === "error";
    const isNavigation = aura === "navigation";
    const isAnalyzing = aura === "analyzing";

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Sayfa Geçiş Blur Efekti */}
            <AnimatePresence>
                {isNavigation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 backdrop-blur-sm bg-black/10"
                    />
                )}
            </AnimatePresence>

            {/* AI Işık Dalgası (Pulse) */}
            <AnimatePresence>
                {isAnalyzing && auraCoords && (
                    <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 6, opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{
                            left: auraCoords.x,
                            top: auraCoords.y,
                            translateX: "-50%",
                            translateY: "-50%",
                            width: "800px",
                            height: "800px",
                            background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(66,133,244,0.3) 50%, transparent 80%)"
                        }}
                        className="absolute rounded-full blur-[80px]"
                    />
                )}
            </AnimatePresence>

            {/* Global Kapsayan Bulanıklık Zırhı */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        <BorderBeam
                            isActive={isActive}
                            isError={isError}
                            isSuccess={isSuccess}
                            borderWidth={4}
                            blur={6}
                            opacity={1}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}