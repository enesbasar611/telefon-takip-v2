"use client";
import { cn } from "@/lib/utils";

export function DashboardContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex-1 flex flex-col overflow-hidden relative", className)}>
            {children}
        </div>
    );
}



