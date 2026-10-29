"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export function VeresiyeEmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center shadow-2xs mb-3">
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500/80" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">Kayıt Bulunamadı</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                Seçili filtrelere veya arama terimine uygun herhangi bir müşteri borç kaydı bulunmuyor.
            </p>
        </div>
    );
}
