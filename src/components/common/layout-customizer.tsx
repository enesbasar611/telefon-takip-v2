"use client";

import React, { useState, useTransition } from "react";
import { EyeOff, Settings, X } from "lucide-react";
import { useUI } from "@/lib/context/ui-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateSetting } from "@/lib/actions/setting-actions";
import { toast } from "sonner";

interface LayoutCustomizerProps {
    sectionKey: string; // e.g., "veresiye_analysis_sidebar"
    children: React.ReactNode;
    className?: string;
    settings?: any[];
    onUpdate?: () => void;
}

export function LayoutCustomizer({ sectionKey, children, className, settings, onUpdate }: LayoutCustomizerProps) {
    const { isLayoutEditing } = useUI();
    const [isPending, startTransition] = useTransition();

    // Check if this section is hidden in settings
    const isHidden = settings?.find(s => s.key === `layout_hidden_${sectionKey}`)?.value === "true";

    const handleToggleVisibility = () => {
        startTransition(async () => {
            const result = await updateSetting(`layout_hidden_${sectionKey}`, isHidden ? "false" : "true");
            if (result.success) {
                toast.success(isHidden ? "Bölüm gösteriliyor" : "Bölüm gizlendi");
                if (onUpdate) onUpdate();
            } else {
                toast.error("Hata oluştu");
            }
        });
    };

    if (!isLayoutEditing && isHidden) return null;

    return (
        <div
            className={cn(
                "relative group/layout transition-all duration-300",
                isLayoutEditing && "ring-2 ring-primary/20 ring-dashed rounded-xl p-1 bg-primary/5 min-h-[50px]",
                isLayoutEditing && isHidden && "opacity-40 grayscale",
                className
            )}
        >
            {isLayoutEditing && (
                <div className="absolute -top-3 -right-3 z-[30] flex items-center gap-1">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg border border-border hover:bg-destructive hover:text-white transition-all bg-background"
                        onClick={handleToggleVisibility}
                        disabled={isPending}
                        title={isHidden ? "Göster" : "Gizle"}
                    >
                        {isHidden ? <Settings className="h-4 w-4 animate-spin-slow" /> : <EyeOff className="h-4 w-4 font-black" />}
                    </Button>
                </div>
            )}

            {isLayoutEditing && (
                <div className="absolute top-2 left-2 z-[30] pointer-events-none opacity-0 group-hover/layout:opacity-100 transition-opacity">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-primary/20 backdrop-blur-md">
                        {sectionKey.replace(/_/g, ' ')}
                    </div>
                </div>
            )}

            <div className={cn("transition-all", isLayoutEditing && "pointer-events-none select-none ring-1 ring-primary/10 rounded-lg")}>
                {children}
            </div>
        </div>
    );
}
