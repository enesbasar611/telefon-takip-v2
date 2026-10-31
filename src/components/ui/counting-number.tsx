"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { animate, useInView, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CountingNumberProps {
  value: number | string;
  duration?: number;
  delay?: number;
  trigger?: "view" | "load" | "manual";
  grouping?: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: string;
}

export function CountingNumber({
  value,
  duration = 1.2,
  delay = 0,
  trigger = "view",
  grouping = true,
  decimals,
  prefix = "",
  suffix = "",
  className,
  locale,
}: CountingNumberProps) {
  // Parse numeric value, prefix, suffix if value is passed as string (e.g. "₺255.37", "(₺12.715,15)", "$0.00")
  const { numericValue, extractedPrefix, extractedSuffix, autoDecimals } = useMemo(() => {
    if (typeof value === "number") {
      const isUsd = prefix.includes("$") || suffix.includes("$");
      const dec = decimals !== undefined
        ? decimals
        : (isUsd ? 2 : (value % 1 !== 0 ? Math.min(2, value.toString().split(".")[1]?.length || 2) : 0));
      return { numericValue: value, extractedPrefix: prefix, extractedSuffix: suffix, autoDecimals: dec };
    }

    let str = String(value ?? 0).trim();
    let p = prefix;
    let s = suffix;

    // Check for wrapping parentheses e.g. "(₺12.715,15)"
    if (str.startsWith("(") && str.endsWith(")")) {
      str = str.slice(1, -1).trim();
      p = p ? `(${p}` : "(";
      s = s ? `${s})` : ")";
    }

    if (str.startsWith("₺") || str.startsWith("$") || str.startsWith("€")) {
      const sym = str[0];
      if (!p || !p.includes(sym)) {
        p = p ? `${p}${sym}` : sym;
      }
      str = str.slice(1).trim();
    }

    let clean = str.replace(/[^\d.,-]/g, "");
    let decCount = 0;

    if (clean.includes(",") && clean.includes(".")) {
      if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
        // Turkish/European: 12.715,15
        const parts = clean.split(",");
        decCount = parts[1]?.length || 2;
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else {
        // US: 12,715.15
        const parts = clean.split(".");
        decCount = parts[1]?.length || 2;
        clean = clean.replace(/,/g, "");
      }
    } else if (clean.includes(",")) {
      const parts = clean.split(",");
      decCount = parts[1]?.length || 0;
      clean = clean.replace(",", ".");
    } else if (clean.includes(".")) {
      const parts = clean.split(".");
      decCount = parts[1]?.length || 0;
    }

    const num = parseFloat(clean);
    const isUsd = p.includes("$") || s.includes("$");
    const resolvedDec = decimals !== undefined ? decimals : Math.min(2, isUsd ? 2 : decCount);

    return {
      numericValue: isNaN(num) ? 0 : num,
      extractedPrefix: p,
      extractedSuffix: s,
      autoDecimals: resolvedDec,
    };
  }, [value, prefix, suffix, decimals]);

  const resolvedLocale = useMemo(() => {
    if (locale) return locale;
    if (extractedPrefix.includes("$")) return "en-US";
    return "tr-TR";
  }, [locale, extractedPrefix]);

  const spanRef = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const isInView = useInView(spanRef, { once: true, margin: "0px" });
  const [hasMounted, setHasMounted] = useState(false);
  const hasAnimatedFirstTime = useRef(false);

  const formatNumber = (val: number) => {
    const dec = autoDecimals;
    if (grouping) {
      return val.toLocaleString(resolvedLocale, {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
    }
    return dec > 0 ? val.toFixed(dec) : Math.round(val).toString();
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (trigger === "view" && !isInView) return;

    if (!hasAnimatedFirstTime.current) {
      motionVal.set(0);
      hasAnimatedFirstTime.current = true;
    }

    // Animate from current motionVal to numericValue
    const controls = animate(motionVal, numericValue, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1], // Smooth organic deceleration
      onUpdate: (latest) => {
        if (spanRef.current) {
          spanRef.current.textContent = `${extractedPrefix}${formatNumber(latest)}${extractedSuffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [numericValue, isInView, trigger, duration, delay, hasMounted, extractedPrefix, extractedSuffix, grouping, autoDecimals, resolvedLocale]);

  return (
    <span
      ref={spanRef}
      className={cn("tabular-nums inline-block select-none", className)}
    >
      {extractedPrefix}{formatNumber(numericValue)}{extractedSuffix}
    </span>
  );
}

export default CountingNumber;
