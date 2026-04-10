"use client";

import { motion, AnimatePresence } from "framer-motion";
import { industries, IndustryType } from "@/config/industries";
import { useState, useEffect } from "react";

interface IndustryBackgroundProps {
    industry: IndustryType;
}

export function IndustryBackground({ industry }: IndustryBackgroundProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const industryConfig = industries[industry] || industries.GENERAL;
    const bgIcons = industryConfig.bgIcons || [];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={industry}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
            >
                {/* Atmospheric Glows */}
                <div className={`absolute top-[-20%] right-[-10%] w-[55%] h-[55%] blur-[140px] rounded-full opacity-[0.25] animate-pulse transition-colors duration-1000
                    ${industry === 'PHONE_REPAIR' ? 'bg-blue-600' :
                        industry === 'ELECTRICIAN' ? 'bg-amber-500' :
                            industry === 'GROCERY' ? 'bg-emerald-500' :
                                industry === 'CLOTHING' ? 'bg-rose-500' :
                                    industry === 'COMPUTER_REPAIR' ? 'bg-indigo-500' :
                                        industry === 'AUTOMOTIVE' ? 'bg-orange-500' :
                                            industry === 'BARBER' ? 'bg-purple-600' :
                                                industry === 'PLUMBING' ? 'bg-cyan-500' : 'bg-slate-500'}`}
                />
                <div className={`absolute bottom-[-20%] left-[-10%] w-[55%] h-[55%] blur-[140px] rounded-full opacity-[0.25] animate-pulse transition-colors duration-1000
                    ${industry === 'PHONE_REPAIR' ? 'bg-indigo-600' :
                        industry === 'ELECTRICIAN' ? 'bg-orange-600' :
                            industry === 'GROCERY' ? 'bg-green-600' :
                                industry === 'CLOTHING' ? 'bg-pink-600' :
                                    industry === 'COMPUTER_REPAIR' ? 'bg-blue-600' :
                                        industry === 'AUTOMOTIVE' ? 'bg-red-600' :
                                            industry === 'BARBER' ? 'bg-pink-500' :
                                                industry === 'PLUMBING' ? 'bg-blue-400' : 'bg-gray-600'}`}
                />

                {/* Corner Icons */}
                {isMounted && (() => {
                    const cornerPositions = [
                        { position: 'top-6 left-6', iconIndex: 0, size: 'w-44 h-44', rotDir: 1 },
                        { position: 'top-6 left-44', iconIndex: 1, size: 'w-28 h-28', rotDir: -1 },
                        { position: 'top-40 left-14', iconIndex: 2, size: 'w-20 h-20', rotDir: 1 },
                        { position: 'bottom-6 right-6', iconIndex: 3, size: 'w-44 h-44', rotDir: -1 },
                        { position: 'bottom-6 right-44', iconIndex: 4, size: 'w-28 h-28', rotDir: 1 },
                        { position: 'bottom-40 right-14', iconIndex: 0, size: 'w-20 h-20', rotDir: -1 },
                    ];
                    return cornerPositions.map((corner, i) => {
                        const Icon = bgIcons[corner.iconIndex % bgIcons.length] || bgIcons[0];
                        if (!Icon) return null;
                        return (
                            <motion.div
                                key={`corner-${industry}-${i}`}
                                className={`absolute ${corner.position} text-white pointer-events-none`}
                                initial={{ opacity: 0.1, rotate: 0, scale: 1 }}
                                animate={{
                                    opacity: [0.08, 0.15, 0.08],
                                    rotate: corner.rotDir > 0 ? [0, 360] : [0, -360],
                                    scale: [1, 1.08, 1],
                                }}
                                transition={{
                                    opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                                    rotate: { duration: 30 + i * 4, repeat: Infinity, ease: 'linear' },
                                    scale: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
                                }}
                            >
                                <Icon className={corner.size} />
                            </motion.div>
                        );
                    });
                })()}

                {/* Floating Icons */}
                {isMounted && (() => {
                    const floatConfigs = [
                        { x: -420, y: -200, ix: 0, dur: 18, size: 'w-32 h-32' },
                        { x: 380, y: 180, ix: 1, dur: 22, size: 'w-28 h-28' },
                        { x: -280, y: 220, ix: 2, dur: 20, size: 'w-24 h-24' },
                        { x: 300, y: -240, ix: 3, dur: 25, size: 'w-36 h-36' },
                    ];
                    return floatConfigs.map((cfg, i) => {
                        const Icon = bgIcons[cfg.ix % bgIcons.length] || bgIcons[0];
                        if (!Icon) return null;
                        return (
                            <motion.div
                                key={`float-${industry}-${i}`}
                                className="absolute left-1/2 top-1/2 text-white pointer-events-none"
                                style={{ translateX: '-50%', translateY: '-50%' }}
                                initial={{ x: cfg.x, y: cfg.y, opacity: 0.12, rotate: 0 }}
                                animate={{
                                    x: [cfg.x, cfg.x + 70, cfg.x - 50, cfg.x],
                                    y: [cfg.y, cfg.y - 50, cfg.y + 70, cfg.y],
                                    opacity: [0.12, 0.2, 0.12],
                                    rotate: [0, 360],
                                }}
                                transition={{
                                    x: { duration: cfg.dur, repeat: Infinity, ease: 'easeInOut' },
                                    y: { duration: cfg.dur, repeat: Infinity, ease: 'easeInOut' },
                                    opacity: { duration: cfg.dur / 2, repeat: Infinity, ease: 'easeInOut' },
                                    rotate: { duration: cfg.dur * 1.5, repeat: Infinity, ease: 'linear' },
                                }}
                            >
                                <Icon className={cfg.size} />
                            </motion.div>
                        );
                    });
                })()}

                {/* Texture overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
            </motion.div>
        </AnimatePresence>
    );
}
