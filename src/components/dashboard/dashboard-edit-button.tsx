"use client";

import { useDashboard } from "./dashboard-context";
import { Button } from "@/components/ui/button";
import { Settings2, Check, Loader2, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardEditButton() {
    const { isEditMode, setIsEditMode, isPending, hasChanges } = useDashboard();

    if (isEditMode) {
        return (
            <div className="flex items-center gap-2">
                {hasChanges ? (
                    <Button
                        onClick={() => setIsEditMode(false)}
                        className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 transition-all gap-2 text-[10px] font-bold uppercase tracking-widest"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        DEĞİŞİKLİKLERİ KAYDET
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsEditMode(false)}
                        variant="secondary"
                        className="h-10 px-4 rounded-xl shadow-lg transition-all gap-2 text-[10px] font-bold uppercase tracking-widest border border-border/40 bg-card/40 backdrop-blur-md"
                    >
                        <X className="h-4 w-4" />
                        DÜZENLEMEYİ BİTİR
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Button
            onClick={() => setIsEditMode(true)}
            variant="outline"
            className="h-10 px-4 gap-2 border-border/40 bg-card/40 backdrop-blur-md hover:bg-primary/10 hover:text-primary hover:border-primary/40 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm group"
        >
            <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            PANELİ DÜZENLE
        </Button>
    );
}
