"use client";

import { useUI } from "@/lib/context/ui-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedAura() {
    const { isAiLoading, isAiInputFocused } = useUI();
    const isActive = isAiLoading || isAiInputFocused;

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden saturate-[1.6]"
                >
                    {/* Layer 1: Strong Wide Glow */}
                    <div className="absolute inset-0 blur-[48px]">
                        <div
                            className="absolute inset--16 border-[48px] border-transparent"
                            style={{
                                maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
                                maskClip: 'content-box, border-box',
                                maskComposite: 'exclude',
                                WebkitMaskComposite: 'destination-out',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-150%] aspect-square"
                                style={{
                                    background: 'conic-gradient(from 0deg, transparent, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4, transparent)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Layer 2: Vivid Primary Beam */}
                    <div className="absolute inset-0 blur-[12px]">
                        <div
                            className="absolute inset-[-4px] border-[8px] border-transparent"
                            style={{
                                maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
                                maskClip: 'content-box, border-box',
                                maskComposite: 'exclude',
                                WebkitMaskComposite: 'destination-out',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-100%] aspect-square"
                                style={{
                                    background: 'conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Layer 3: Ultra Sharp Core */}
                    <div className="absolute inset-0">
                        <div
                            className="absolute inset-[-1px] border-[2px] border-transparent"
                            style={{
                                maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
                                maskClip: 'content-box, border-box',
                                maskComposite: 'exclude',
                                WebkitMaskComposite: 'destination-out',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-100%] aspect-square"
                                style={{
                                    background: 'conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
