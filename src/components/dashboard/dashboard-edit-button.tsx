"use client";

import { useDashboard } from "./dashboard-context";
import { Button } from "@/components/ui/button";
import { Check, Edit3, Loader2, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardEditButton() {
  const {
    isEditMode,
    setIsEditMode,
    isStudioOpen,
    setIsStudioOpen,
    isPending,
    hasChanges,
  } = useDashboard();

  const handleOpenStudio = () => {
    if (!isEditMode) setIsEditMode(true);
    setIsStudioOpen(!isStudioOpen);
  };

  const handleToggleEdit = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    if (hasChanges) {
      window.dispatchEvent(new CustomEvent("dashboard:save-and-exit"));
      return;
    }

    setIsStudioOpen(false);
    setIsEditMode(false);
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Button
        type="button"
        variant={isStudioOpen ? "default" : "outline"}
        size="sm"
        onClick={handleOpenStudio}
        disabled={isPending}
        className={cn(
          "h-8 rounded-xl px-2.5 text-[11px] font-semibold tracking-tight gap-1.5 transition-all cursor-pointer border-border/50",
          isStudioOpen && "shadow-xs"
        )}
        title="Kart kütüphanesi, hazır şablonlar ve görünüm ayarları"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Stüdyo</span>
      </Button>

      <Button
        type="button"
        variant={isEditMode ? (hasChanges ? "default" : "secondary") : "outline"}
        size="sm"
        onClick={handleToggleEdit}
        disabled={isPending}
        className={cn(
          "h-8 rounded-xl px-3 text-[11px] font-semibold uppercase tracking-wider gap-1.5 transition-all cursor-pointer",
          isEditMode && hasChanges && "bg-primary text-primary-foreground shadow-sm",
          !isEditMode && "bg-card/60 hover:bg-muted border-border/50"
        )}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isEditMode ? (
          hasChanges ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Kaydet & Bitir</span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Bitir</span>
            </>
          )
        ) : (
          <>
            <Edit3 className="w-3.5 h-3.5" />
            <span>Paneli Düzenle</span>
          </>
        )}
      </Button>
    </div>
  );
}
