"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export function VeresiyeEmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-8 grayscale opacity-40">
            <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center border border-border/50 shadow-2xl">
                <CheckCircle2 className="w-14 h-14 text-muted-foreground/80" />
            </div>
            <div className="text-center space-y-3 px-6">
                <h3 className="font-medium text-2xl text-foreground uppercase">Borç Kaydı Yok</h3>
                <p className="text-[10px] text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
                    Şu anda seçili filtrelere uygun herhangi bir alacak kaydı bulunmuyor.
                </p>
            </div>
        </div>
    );
}
