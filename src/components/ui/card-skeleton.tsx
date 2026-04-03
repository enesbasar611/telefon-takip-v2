"use client";

import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("bg-card border border-border/40 rounded-2xl p-6 relative overflow-hidden", className)}>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full" />

            <div className="space-y-4 relative z-10">
                <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse" />
                <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3 w-full bg-muted/60 rounded-md animate-pulse" />
                    <div className="h-3 w-4/5 bg-muted/60 rounded-md animate-pulse" />
                </div>
            </div>

            <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
        </div>
    );
}
