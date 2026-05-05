"use client";

import { useDashboard } from "./dashboard-context";
import { Button } from "@/components/ui/button";
import { Settings2, Check, Loader2, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardEditButton() {
    const { isEditMode, setIsEditMode, isPending, hasChanges } = useDashboard();

    if (isEditMode) {
        return (
            <div className="flex items-center gap-2 ml-2">
                {hasChanges ? (
                    <Button
                        onClick={() => setIsEditMode(false)}
                        size="sm"
                        className="h-9 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 transition-all gap-2 text-[11px] font-bold uppercase tracking-widest"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        DEĞİŞİKLİKLERİ KAYDET
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsEditMode(false)}
                        size="sm"
                        variant="secondary"
                        className="h-9 px-6 rounded-full shadow-lg transition-all gap-2 text-[11px] font-bold uppercase tracking-widest border-none"
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
            size="sm"
            variant="outline"
            className="h-9 px-6 rounded-full bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:bg-primary/90 transition-all gap-2 text-[11px] font-bold uppercase tracking-widest ml-2"
        >
            <Settings2 className="h-4 w-4" />
            PANELİ DÜZENLE
        </Button>
    );
}
