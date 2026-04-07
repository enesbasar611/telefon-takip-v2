"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PatternLockProps {
    onComplete?: (pattern: number[]) => void;
    width?: number;
    height?: number;
    readOnly?: boolean;
    initialPattern?: number[];
    className?: string;
    error?: boolean;
}

const DOT_RADIUS = 6;
const DOT_INTERACT_RADIUS = 24;

export function PatternLock({
    onComplete,
    width = 280,
    height = 280,
    readOnly = false,
    initialPattern = [],
    className,
    error = false,
}: PatternLockProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [pattern, setPattern] = useState<number[]>(initialPattern);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (readOnly) {
            setPattern(initialPattern);
        }
    }, [initialPattern, readOnly]);

    const getDots = useCallback(() => {
        const marginX = width * 0.15;
        const marginY = height * 0.15;
        const stepX = (width - marginX * 2) / 2;
        const stepY = (height - marginY * 2) / 2;

        const dots: { x: number; y: number; index: number }[] = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                dots.push({
                    x: marginX + col * stepX,
                    y: marginY + row * stepY,
                    index: row * 3 + col + 1,
                });
            }
        }
        return dots;
    }, [width, height]);

    const drawPattern = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        const dots = getDots();

        // Draw lines
        if (pattern.length > 0) {
            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.strokeStyle = error ? "#ef4444" : "#3b82f6"; // Red if error, else Blue
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            pattern.forEach((idx, i) => {
                const dot = dots.find((d) => d.index === idx);
                if (dot) {
                    if (i === 0) ctx.moveTo(dot.x, dot.y);
                    else ctx.lineTo(dot.x, dot.y);
                }
            });

            if (isDrawing && currentPos && !readOnly) {
                ctx.lineTo(currentPos.x, currentPos.y);
            }

            ctx.stroke();
        }

        // Draw dots
        dots.forEach((dot) => {
            const isSelected = pattern.includes(dot.index);
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);

            if (isSelected) {
                ctx.fillStyle = error ? "#ef4444" : "#3b82f6";
                ctx.fill();

                // draw outer ring
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, DOT_RADIUS * 3, 0, Math.PI * 2);
                ctx.fillStyle = error ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)";
                ctx.fill();
            } else {
                ctx.fillStyle = "#94a3b8"; // slate-400
                ctx.fill();
            }
        });
    }, [pattern, isDrawing, currentPos, width, height, getDots, readOnly, error]);

    useEffect(() => {
        drawPattern();
    }, [drawPattern]);

    const getCanvasPos = (evt: React.TouchEvent | React.MouseEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ("touches" in evt) {
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else {
            clientX = (evt as React.MouseEvent).clientX;
            clientY = (evt as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;

        // Prevent default scrolling on mobile
        if (e.type.startsWith("touch")) {
            e.cancelable && e.preventDefault();
        }

        setIsDrawing(true);
        setPattern([]);

        const pos = getCanvasPos(e);
        if (!pos) return;

        checkHitAndAdd(pos);
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!isDrawing || readOnly) return;

        if (e.type.startsWith("touch")) {
            e.cancelable && e.preventDefault();
        }

        const pos = getCanvasPos(e);
        if (!pos) return;

        setCurrentPos(pos);
        checkHitAndAdd(pos);
    };

    const handlePointerUp = () => {
        if (!isDrawing || readOnly) return;
        setIsDrawing(false);
        setCurrentPos(null);
        if (onComplete) {
            onComplete(pattern);
        }
    };

    const checkHitAndAdd = (pos: { x: number; y: number }) => {
        const dots = getDots();
        for (const dot of dots) {
            const dx = dot.x - pos.x;
            const dy = dot.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < DOT_INTERACT_RADIUS && !pattern.includes(dot.index)) {
                setPattern((prev) => {
                    const newPattern = [...prev, dot.index];
                    // We can also connect the dots automatically if jumped over, but skipping for simplicity
                    return newPattern;
                });
                break;
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative mx-auto rounded-xl select-none touch-none", className)}
            style={{ width, height }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
        >
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="block"
            />
        </div>
    );
}
