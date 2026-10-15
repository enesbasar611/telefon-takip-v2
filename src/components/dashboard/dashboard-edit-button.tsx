"use client";

import { useDashboard } from "./dashboard-context";
import { Button } from "@/components/ui/button";
import { Settings2, Check, Loader2, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardEditButton() {
    const { isEditMode, setIsEditMode, isPending, hasChanges } = useDashboard();

    if (isEditMode) {
        return (
            <div className="flex items-center gap-2 shrink-0">
                {hasChanges ? (
                    <Button
                        onClick={() => setIsEditMode(false)}
                        className="h-10 px-3 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 transition-all gap-1.5 sm:gap-2 text-[10px] font-bold uppercase tracking-widest shrink-0 whitespace-nowrap"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
                        <span className="hidden sm:inline">DEĞİŞİKLİKLERİ</span> KAYDET
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsEditMode(false)}
                        variant="secondary"
                        className="h-10 px-3 sm:px-4 rounded-xl shadow-lg transition-all gap-1.5 sm:gap-2 text-[10px] font-bold uppercase tracking-widest border border-border/40 bg-card/40 backdrop-blur-md shrink-0 whitespace-nowrap"
                    >
                        <X className="h-4 w-4 shrink-0" />
                        BİTİR
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Button
            onClick={() => setIsEditMode(true)}
            variant="outline"
            className="h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 border-border/40 bg-card/40 backdrop-blur-md hover:bg-primary/10 hover:text-primary hover:border-primary/40 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm group shrink-0 whitespace-nowrap"
        >
            <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform shrink-0" />
            <span>PANELİ DÜZENLE</span>
        </Button>
    );
}
