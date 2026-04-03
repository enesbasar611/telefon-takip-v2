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
    blur = 0,
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
                            ? "conic-gradient(from 0deg, #EA4335 0deg, #b91c1c 90deg, #EA4335 180deg, #b91c1c 270deg, #EA4335 360deg)"
                            : isSuccess
                                ? "conic-gradient(from 0deg, #34A853 0deg, #15803d 90deg, #34A853 180deg, #15803d 270deg, #34A853 360deg)"
                                : "conic-gradient(from 0deg, #4285F4 0deg, #EA4335 90deg, #FBBC05 180deg, #34A853 270deg, #4285F4 360deg)",
                        opacity: currentOpacity,
                    }}
                />
            </div>
        </div>
    );
}
