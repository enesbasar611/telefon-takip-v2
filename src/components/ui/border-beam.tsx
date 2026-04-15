"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BorderBeamProps {
    className?: string;
    size?: number;
    duration?: number;
    borderWidth?: number;
    colorFrom?: string;
    colorTo?: string;
    delay?: number;
    isActive?: boolean;
    isError?: boolean;
    isSuccess?: boolean;
    opacity?: number;
    blur?: number;
}

export function BorderBeam({
    className,
    size = 200,
    duration = 8,
    borderWidth = 3,
    isActive = false,
    isError = false,
    isSuccess = false,
    opacity = 0.2,
    blur = 8,
}: BorderBeamProps) {

    // Smooth transitions for visuals
    const currentDuration = isSuccess ? 1 : (isActive ? 2 : duration);
    const currentOpacity = isSuccess || isError ? 1 : (isActive ? 0.5 : opacity);

    return (
        <div
            className={cn("pointer-events-none absolute inset-0 z-20 rounded-[inherit] overflow-hidden", className)}
        >
            {/* Primary Sharp Border */}
            <div
                className="absolute inset-0 rounded-[inherit]"
                style={{
                    border: `${borderWidth}px solid transparent`,
                    WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "destination-out",
                    maskComposite: "exclude"
                }}
            >
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: currentDuration,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "100vmax",
                        height: "100vmax",
                        marginLeft: "-50vmax",
                        marginTop: "-50vmax",
                        background: isError
                            ? "conic-gradient(from 0deg, rgba(234, 67, 53, 0.9) 0deg, transparent 60deg, rgba(234, 67, 53, 0.9) 180deg, transparent 240deg, rgba(234, 67, 53, 0.9) 360deg)"
                            : isSuccess
                                ? "conic-gradient(from 0deg, rgba(52, 168, 83, 0.9) 0deg, transparent 60deg, rgba(52, 168, 83, 0.9) 180deg, transparent 240deg, rgba(52, 168, 83, 0.9) 360deg)"
                                : "conic-gradient(from 0deg, #4285F4 0deg, #9b51e0 60deg, #EA4335 120deg, #FBBC05 180deg, #34A853 240deg, #4285F4 300deg, #4285F4 360deg)",
                        opacity: currentOpacity,
                    }}
                />
            </div>

            {/* Secondary Vibrant Glow Layer (Bulanık ve Canlı) */}
            <div
                className="absolute inset-0 rounded-[inherit] blur-[15px] mix-blend-screen overflow-hidden"
                style={{
                    border: `${borderWidth * 2}px solid transparent`,
                    WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "destination-out",
                    maskComposite: "exclude",
                    opacity: currentOpacity * 0.5
                }}
            >
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: currentDuration * 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "120vmax",
                        height: "120vmax",
                        marginLeft: "-60vmax",
                        marginTop: "-60vmax",
                        background: isError
                            ? "conic-gradient(from 0deg, #dc2626, transparent, #dc2626)"
                            : isSuccess
                                ? "conic-gradient(from 0deg, #16a34a, transparent, #16a34a)"
                                : "conic-gradient(from 0deg, #60a5fa, #c084fc, #f87171, #facc15, #4ade80, #60a5fa)",
                    }}
                />
            </div>
        </div>
    );
}



