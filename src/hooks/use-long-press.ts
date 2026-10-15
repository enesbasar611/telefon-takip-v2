"use client";

import { useCallback, useRef } from "react";

/**
 * Tap vs long-press detection for touch + mouse.
 * - Short tap  → onTap
 * - Hold ≥ delay (or right-click) → onLongPress (with haptic feedback where supported)
 * Movement beyond `moveTolerance` cancels (so scrolling a list never triggers actions).
 */
export function useLongPress(
    onTap: () => void,
    onLongPress: () => void,
    { delay = 450, moveTolerance = 10 }: { delay?: number; moveTolerance?: number } = {}
) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const start = useRef<{ x: number; y: number } | null>(null);
    const fired = useRef(false);

    const clear = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return;
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        clear();
        timer.current = setTimeout(() => {
            fired.current = true;
            if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
            onLongPress();
        }, delay);
    }, [delay, onLongPress]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!start.current) return;
        if (Math.abs(e.clientX - start.current.x) > moveTolerance || Math.abs(e.clientY - start.current.y) > moveTolerance) {
            clear();
            start.current = null;
        }
    }, [moveTolerance]);

    const onPointerUp = useCallback(() => {
        const wasTracking = !!start.current;
        clear();
        start.current = null;
        if (wasTracking && !fired.current) onTap();
    }, [onTap]);

    const onPointerCancel = useCallback(() => {
        clear();
        start.current = null;
    }, []);

    const onContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        clear();
        if (!fired.current) onLongPress();
        fired.current = true;
    }, [onLongPress]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTap();
        } else if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
            e.preventDefault();
            onLongPress();
        }
    }, [onTap, onLongPress]);

    return { onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerCancel, onPointerCancel, onContextMenu, onKeyDown };
}
