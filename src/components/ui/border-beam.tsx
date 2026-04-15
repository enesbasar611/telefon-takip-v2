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
    duration = 12,
    borderWidth = 2,
    isActive = false,
    isError = false,
    isSuccess = false,
    opacity = 0.5,
    blur = 4,
}: BorderBeamProps) {

    // Smooth transitions for visuals
    const currentDuration = isSuccess ? 1 : (isActive ? 3 : duration);
    const currentOpacity = isSuccess || isError ? 1 : (isActive ? 1 : opacity);

    return (
        <div
            className={cn("pointer-events-none absolute inset-0 z-50 rounded-[inherit]", className)}
        >
            <div
                className="absolute inset-0 rounded-[inherit]"
                style={{
                    filter: blur > 0 ? `blur(${blur}px)` : "none",
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
                        width: "150vmax",
                        height: "150vmax",
                        marginLeft: "-75vmax",
                        marginTop: "-75vmax",
                        background: isError
                            ? "conic-gradient(from 0deg, rgba(234, 67, 53, 0.8) 0deg, rgba(185, 28, 28, 0.4) 90deg, rgba(234, 67, 53, 0.8) 180deg, rgba(185, 28, 28, 0.4) 270deg, rgba(234, 67, 53, 0.8) 360deg)"
                            : isSuccess
                                ? "conic-gradient(from 0deg, rgba(52, 168, 83, 0.8) 0deg, rgba(21, 128, 61, 0.4) 90deg, rgba(52, 168, 83, 0.8) 180deg, rgba(21, 128, 61, 0.4) 270deg, rgba(52, 168, 83, 0.8) 360deg)"
                                : "conic-gradient(from 0deg, #4285F4 0deg, #9b51e0 60deg, #EA4335 120deg, #FBBC05 180deg, #34A853 240deg, #4285F4 300deg, #4285F4 360deg)",
                        opacity: currentOpacity,
                        filter: "blur(40px)",
                    }}
                />
            </div>
        </div>
    );
}



