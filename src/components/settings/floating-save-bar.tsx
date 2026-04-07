"use client";

import { Button } from "@/components/ui/button";
import { Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingSaveBarProps {
    hasChanges: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function FloatingSaveBar({ hasChanges, isSaving, onSave, onCancel }: FloatingSaveBarProps) {
    if (!hasChanges) return null;

    return (
        <div className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-4 px-6 py-3 rounded-2xl",
            "bg-[#111]/95 backdrop-blur-xl border border-[#333] shadow-2xl shadow-black/50",
            "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}>
            <div className="flex items-center gap-2 mr-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-muted-foreground">Kaydedilmemiş değişiklikler</span>
            </div>

            <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                disabled={isSaving}
                className="text-muted-foreground hover:text-white h-9 px-4 text-xs font-bold"
            >
                <X className="h-3.5 w-3.5 mr-1.5" />
                İptal
            </Button>

            <Button
                onClick={onSave}
                disabled={isSaving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-6 text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
            >
                {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Değişiklikleri Kaydet
            </Button>
        </div>
    );
}
