"use client";

import { cn } from "@/lib/utils";

interface SectionBadgeProps {
    icon: any;
    title: string;
    className?: string;
}

export const SectionBadge = ({ icon: Icon, title, className }: SectionBadgeProps) => (
    <div className={cn("flex items-center gap-2.5 mb-6 opacity-80", className)}>
        <div className="p-2 rounded-lg bg-muted border border-border/50 transition-colors group-hover/card:bg-primary/5 group-hover/card:border-primary/20">
            <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover/card:text-primary" strokeWidth={2.5} />
        </div>
        <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 group-hover/card:text-foreground transition-colors">{title}</h3>
    </div>
);
